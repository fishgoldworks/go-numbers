#!/usr/bin/env python3
"""Cross-check public runtime results with independent Decimal/Fraction oracles.

Requires Python 3.9+ and Node on PATH. No pip packages or network access.
The JS generator supplies shortest decimal operands (the documented rounding
contract) and actual result bits. Python computes every expected result.
"""
from collections import Counter
from decimal import Decimal, localcontext, ROUND_CEILING, ROUND_FLOOR, ROUND_HALF_UP, ROUND_HALF_DOWN
from fractions import Fraction
from pathlib import Path
import hashlib
import json
import re
import math
import os
import struct
import subprocess
import sys


def expected_result(operation: str, text: str, operand: str) -> float:
    if operation == 'modulo':
        value, modulus = float(text), float(operand)
        # Exact rational modulo of the supplied binary Numbers, then the nearest
        # binary result constrained to the specified half-open output interval.
        remainder = Fraction.from_float(value) % Fraction.from_float(modulus)
        result = float(remainder)
        return math.nextafter(modulus, 0.0) if result >= modulus else result
    value = Decimal(text)
    if operation == 'roundTo':
        step = Decimal(operand)
        tie_mode = ROUND_HALF_DOWN if value.is_signed() else ROUND_HALF_UP
        multiple = (value / step).to_integral_value(rounding=tie_mode)
        return float(multiple * step)
    precision = int(operand)
    if operation == 'ceil':
        direction = ROUND_CEILING
    elif operation == 'floor':
        direction = ROUND_FLOOR
    elif operation == 'round':
        direction = ROUND_HALF_DOWN if value.is_signed() else ROUND_HALF_UP
    else:
        raise ValueError(f'Unknown oracle operation: {operation!r}')
    return float(value.quantize(Decimal(1).scaleb(-precision), rounding=direction))


OPERATIONS = frozenset({'round', 'ceil', 'floor', 'roundTo', 'modulo'})
FAMILIES = ('lcg', 'sha256')


def validate_cases(cases: object, expected: dict) -> None:
    """Validate the wire format AND the reviewed input corpus, never output values.

    The manifest fingerprints only [operation, input, operand]. Actual result bits
    must still be compared with the independent oracle. Truncation, duplication,
    reordering or accidental changes to the generator cannot yield a green run.
    Intentional corpus changes require a separately reviewed manifest update.
    """
    if not isinstance(cases, list) or not cases:
        raise ValueError('Generator must emit a nonempty list of cases')
    if len(cases) != expected['count']:
        raise ValueError(f"Incomplete or changed corpus: expected {expected['count']} cases, got {len(cases)}")
    counts = Counter()
    inputs = []
    for index, row in enumerate(cases):
        if not isinstance(row, list) or len(row) != 4 or not all(isinstance(item, str) for item in row):
            raise ValueError(f'Case {index} must contain four strings')
        operation, value, operand, actual = row
        if operation not in OPERATIONS:
            raise ValueError(f'Unknown oracle operation at case {index}: {operation!r}')
        if re.fullmatch(r'[0-9a-f]{16}', actual) is None:
            raise ValueError(f'Case {index} has an invalid binary64 result bit pattern')
        try:
            number = float(value)
            if not math.isfinite(number):
                raise ValueError('nonfinite input')
            if operation in ('roundTo', 'modulo'):
                step = float(operand)
                if not math.isfinite(step) or step <= 0:
                    raise ValueError('step/modulus must be finite and positive')
            else:
                precision = int(operand)
                if not -308 <= precision <= 324:
                    raise ValueError('precision out of range')
        except (ValueError, OverflowError) as error:
            raise ValueError(f'Invalid numerical input at case {index}: {error}') from error
        counts[operation] += 1
        inputs.append(row[:3])
    if dict(counts) != expected['operations']:
        raise ValueError(f'Operation counts differ from the reviewed corpus: {dict(counts)}')
    wire = json.dumps(inputs, separators=(',', ':'), ensure_ascii=True).encode('utf-8')
    if hashlib.sha256(wire).hexdigest() != expected['inputSha256']:
        raise ValueError('Input fingerprint differs from the reviewed corpus; investigate generator changes')


def main() -> int:
    root = Path(__file__).resolve().parent.parent
    catalog = json.loads((root / 'scripts/lib/oracle-corpora.json').read_text(encoding='utf-8'))
    if catalog.get('formatVersion') != 1 or set(catalog.get('families', {})) != set(FAMILIES):
        raise ValueError('Invalid oracle corpus manifest; both reviewed input families are required')
    total = 0
    failures = []
    # More than the maximum ~633 decimal positions between finite double operands.
    with localcontext() as context:
        context.prec = 2000
        for family in FAMILIES:
            result = subprocess.run(
                [os.environ.get('NODE', 'node'), str(root / 'scripts' / 'oracle-cases.js'), '--family', family],
                cwd=root, capture_output=True, text=True, check=True, timeout=30,
            )
            cases = json.loads(result.stdout)
            validate_cases(cases, catalog['families'][family])
            counts = Counter()
            for operation, value, operand, actual in cases:
                expected = expected_result(operation, value, operand)
                expected_bits = struct.pack('>d', expected).hex()
                counts[operation] += 1
                if actual != expected_bits:
                    failures.append((family, operation, value, operand, actual, expected_bits))
            for operation, count in counts.items():
                print(f'{family}/{operation}: {count} independent reference comparisons')
            total += len(cases)
    if failures:
        for row in failures[:20]:
            print('MISMATCH:', row, file=sys.stderr)
        print(f'FAIL: {len(failures)} of {total} cases', file=sys.stderr)
        return 1
    print(f'PASS: {total} Decimal/Fraction comparisons across both verified input corpora, including signed result bits')
    return 0


if __name__ == '__main__':
    try:
        sys.exit(main())
    except (OSError, subprocess.SubprocessError, ValueError, KeyError, TypeError) as error:
        print(f'Oracle check could not complete: {error}', file=sys.stderr)
        sys.exit(1)
