"""Independent negative controls for the optional Decimal/Fraction verifier.

These run through npm run test:oracle:verifier; the normal Node suite does not
acquire a Python dependency. CLI cases execute real throwaway generators.
"""
from collections import Counter
from copy import deepcopy
import hashlib
import importlib.util
import json
from pathlib import Path
import shutil
import struct
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parent.parent
sys.dont_write_bytecode = True
SPEC = importlib.util.spec_from_file_location('numeric_oracle', ROOT / 'scripts/check-numeric-oracle.py')
ORACLE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(ORACLE)

CASES = [
    ['round', '1.5', '0', '4000000000000000'],
    ['floor', '-0.1', '0', 'bff0000000000000'],
    ['ceil', '-0.1', '0', '8000000000000000'],
    ['roundTo', '0.15', '0.1', '3fc999999999999a'],
    ['modulo', '-1', '5', '4010000000000000'],
]


def manifest(cases):
    wire = json.dumps([row[:3] for row in cases], separators=(',', ':'), ensure_ascii=True).encode()
    return {'count': len(cases), 'operations': dict(Counter(row[0] for row in cases)),
            'inputSha256': hashlib.sha256(wire).hexdigest()}


class NumericOracleVerifierTests(unittest.TestCase):
    def validate(self, cases, expected=None):
        validator = getattr(ORACLE, 'validate_cases', None)
        self.assertTrue(callable(validator), 'The oracle must validate its input corpus before reporting success')
        return validator(cases, manifest(CASES) if expected is None else expected)

    def cli(self, generator):
        with tempfile.TemporaryDirectory(prefix='go-numbers-oracle-control-') as folder:
            scripts = Path(folder) / 'scripts'
            scripts.mkdir()
            shutil.copy2(ROOT / 'scripts/check-numeric-oracle.py', scripts)
            metadata = ROOT / 'scripts/lib/oracle-corpora.json'
            if metadata.exists():
                (scripts / 'lib').mkdir()
                shutil.copy2(metadata, scripts / 'lib')
            (scripts / 'oracle-cases.js').write_text(generator, encoding='utf-8')
            return subprocess.run([sys.executable, str(scripts / 'check-numeric-oracle.py')],
                                  capture_output=True, text=True, timeout=30)

    def assert_cli_failure(self, source):
        result = self.cli(source)
        self.assertNotEqual(result.returncode, 0, result.stdout)
        self.assertNotIn('PASS:', result.stdout)
        return result

    def test_empty_generator_is_not_success(self):
        self.assert_cli_failure("console.log('[]');")

    def test_empty_object_is_not_success(self):
        self.assert_cli_failure("console.log('{}');")

    def test_truncated_but_valid_generator_is_not_success(self):
        self.assert_cli_failure('console.log(' + json.dumps(json.dumps(CASES)) + ');')

    def test_generator_process_failure_is_not_success(self):
        self.assert_cli_failure("console.log('[]'); process.exitCode = 1;")

    def test_invalid_json_is_not_success(self):
        self.assert_cli_failure("console.log('not JSON');")

    def real_generator(self, transform):
        # Execute the real corpus generator, then corrupt ONLY its emitted output.
        # This distinguishes count/fingerprint checks from numerical correctness.
        script = json.dumps(str(ROOT / 'scripts/oracle-cases.js'))
        return f"""
            const {{spawnSync}} = require('node:child_process');
            const result = spawnSync(process.execPath, [{script}, ...process.argv.slice(2)],
                {{encoding: 'utf8', maxBuffer: 16 * 1024 * 1024}});
            if (result.status !== 0) throw new Error(result.stderr);
            const cases = JSON.parse(result.stdout);
            {transform}
            console.log(JSON.stringify(cases));
        """

    def test_empty_second_family_invalidates_a_complete_first_family(self):
        source = self.real_generator("if (process.argv.includes('sha256')) cases.length = 0;")
        result = self.assert_cli_failure(source)
        self.assertIn('lcg/round:', result.stdout)
        self.assertIn('nonempty', result.stderr)

    def test_wrong_result_bits_fail_despite_unchanged_complete_inputs(self):
        source = self.real_generator("cases[0][3] = (BigInt('0x' + cases[0][3]) ^ 1n).toString(16).padStart(16, '0');")
        result = self.assert_cli_failure(source)
        self.assertIn('MISMATCH:', result.stderr)
        self.assertNotIn('fingerprint differs', result.stderr)

    def test_complete_small_fixture_validates(self):
        self.validate(CASES)

    def test_non_list_corpora_are_rejected(self):
        for value in [None, {}, '[]', 1, True]:
            with self.subTest(value=value), self.assertRaises(ValueError):
                self.validate(value)

    def test_empty_corpus_is_rejected_even_with_empty_manifest(self):
        with self.assertRaises(ValueError):
            self.validate([], manifest([]))

    def test_missing_case_is_rejected(self):
        with self.assertRaises(ValueError):
            self.validate(CASES[:-1])

    def test_extra_case_is_rejected(self):
        with self.assertRaises(ValueError):
            self.validate(CASES + [CASES[0]])

    def test_unknown_operation_is_rejected_even_with_matching_manifest(self):
        changed = deepcopy(CASES)
        changed[0][0] = 'unrecognised'
        with self.assertRaises(ValueError):
            self.validate(changed, manifest(changed))

    def test_wrong_case_shapes_are_rejected(self):
        for row in [None, {}, 'abcd', [1, 2, 3], [1, 2, 3, 4, 5]]:
            changed = deepcopy(CASES)
            changed[0] = row
            with self.subTest(row=row), self.assertRaises(ValueError):
                self.validate(changed)

    def test_case_fields_must_be_strings(self):
        for field in range(4):
            changed = deepcopy(CASES)
            changed[0][field] = 2
            with self.subTest(field=field), self.assertRaises(ValueError):
                self.validate(changed)

    def test_unknown_reference_operation_does_not_fall_through_to_round(self):
        with self.assertRaises(ValueError):
            ORACLE.expected_result('unrecognised', '1.5', '0')

    def test_invalid_result_bit_patterns_are_rejected(self):
        for bits in ['', '0', '0' * 15, '0' * 17, 'g' * 16, '-000000000000000']:
            changed = deepcopy(CASES)
            changed[0][3] = bits
            with self.subTest(bits=bits), self.assertRaises(ValueError):
                self.validate(changed)

    def test_changed_input_with_same_size_and_operations_is_rejected(self):
        changed = deepcopy(CASES)
        changed[0][1] = '2.5'
        with self.assertRaises(ValueError):
            self.validate(changed)

    def test_reordered_input_is_rejected(self):
        with self.assertRaises(ValueError):
            self.validate(list(reversed(CASES)))

    def test_duplicated_case_cannot_replace_another_input(self):
        changed = deepcopy(CASES)
        changed[1] = changed[0].copy()
        with self.assertRaises(ValueError):
            self.validate(changed)

    def test_missing_operation_is_rejected(self):
        changed = deepcopy(CASES)
        changed[-1] = CASES[0].copy()
        with self.assertRaises(ValueError):
            self.validate(changed)

    def test_output_is_not_part_of_input_fingerprint(self):
        # Numerically wrong output remains an arithmetic mismatch, not a corpus mismatch.
        changed = deepcopy(CASES)
        changed[0][3] = '0000000000000000'
        self.validate(changed)
        self.assertNotEqual(struct.pack('>d', ORACLE.expected_result(*changed[0][:3])).hex(), changed[0][3])

    def test_negative_zero_input_is_part_of_fingerprint(self):
        cases = [['round', '-0', '0', '8000000000000000']]
        changed = [['round', '0', '0', '8000000000000000']]
        with self.assertRaises(ValueError):
            self.validate(changed, manifest(cases))

    def test_nonfinite_or_non_numeric_inputs_are_rejected(self):
        for value in ['NaN', 'Infinity', '-Infinity', '1e999', 'not numeric']:
            changed = deepcopy(CASES)
            changed[0][1] = value
            with self.subTest(value=value), self.assertRaises(ValueError):
                self.validate(changed, manifest(changed))

    def test_invalid_precision_is_rejected(self):
        for value in ['1.5', '-309', '325', 'NaN']:
            changed = deepcopy(CASES)
            changed[0][2] = value
            with self.subTest(value=value), self.assertRaises(ValueError):
                self.validate(changed, manifest(changed))

    def test_invalid_step_or_modulus_is_rejected(self):
        for operation in ['roundTo', 'modulo']:
            for value in ['0', '-0', '-1', 'Infinity', 'NaN', '1e-999']:
                changed = [[operation, '1', value, '0000000000000000']]
                with self.subTest(operation=operation, value=value), self.assertRaises(ValueError):
                    self.validate(changed, manifest(changed))

    def test_signed_zero_and_known_boundary_reference_values(self):
        for operation, value, operand, expected in CASES:
            self.assertEqual(struct.pack('>d', ORACLE.expected_result(operation, value, operand)).hex(), expected)


if __name__ == '__main__':
    unittest.main()
