"""Exercise the actual Node-to-Python boundary without requiring Python in npm test."""
import os
import json
import shlex
import shutil
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parent.parent


class PythonLauncherTests(unittest.TestCase):
    def run_python(self, *args, executable=None):
        return subprocess.run(
            [os.environ.get('NODE', 'node'), str(ROOT / 'scripts/run-python.js'), *args],
            env={**os.environ, 'PYTHON': executable or sys.executable},
            capture_output=True, text=True, timeout=15)

    def test_imports_do_not_write_bytecode_and_paths_with_spaces_work(self):
        with tempfile.TemporaryDirectory(prefix='go numbers python ') as folder:
            directory = Path(folder)
            (directory / 'helper.py').write_text('answer = 42\n', encoding='utf-8')
            script = directory / 'consumer with spaces.py'
            script.write_text('import helper, sys\nassert sys.dont_write_bytecode\nprint(helper.answer)\n', encoding='utf-8')
            result = self.run_python(str(script))
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertEqual(result.stdout.strip(), '42')
            self.assertFalse((directory / '__pycache__').exists())

    def test_python_failure_is_not_reported_as_success(self):
        result = self.run_python('-c', 'import sys; sys.exit(17)')
        self.assertEqual(result.returncode, 17, result.stderr)

    def test_missing_explicit_executable_fails(self):
        with tempfile.TemporaryDirectory(prefix='go-numbers-no-python-') as folder:
            result = self.run_python('-c', 'print(42)', executable=str(Path(folder) / 'missing-python'))
            self.assertNotEqual(result.returncode, 0)
            self.assertIn('ENOENT', result.stderr)

    def test_explicit_suites_ignore_experiments_and_preserve_failures(self):
        with tempfile.TemporaryDirectory(prefix='go-numbers-python-suites-') as folder:
            directory = Path(folder)
            tests = directory / 'test'
            (directory / 'scripts').mkdir()
            shutil.copy2(ROOT / 'scripts/run-python.js', directory / 'scripts/run-python.js')
            for name in ['temp', '.tmp']:
                experiment = tests / name
                experiment.mkdir(parents=True)
                (experiment / '__init__.py').write_text('raise RuntimeError("EXPERIMENT_IMPORTED")\n')
                (experiment / 'experiment_test.py').write_text('raise RuntimeError("EXPERIMENT_IMPORTED")\n')
            shutil.copy2(ROOT / 'test/__init__.py', tests / '__init__.py')
            for name in ['oracle_verifier_test.py', 'python_launcher_test.py']:
                (tests / name).write_text('import unittest\nclass Control(unittest.TestCase):\n    def test_control(self):\n        self.assertTrue(True)\n')
            command = shlex.split(json.loads((ROOT / 'package.json').read_text())['scripts']['test:oracle:verifier'])
            self.assertEqual(command[:2], ['node', 'scripts/run-python.js'])
            command[0] = os.environ.get('NODE', 'node')
            def run():
                return subprocess.run(command, cwd=directory,
                                      env={**os.environ, 'PYTHON': sys.executable},
                                      capture_output=True, text=True, timeout=15)
            result = run()
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertIn('Ran 2 tests', result.stderr)
            (tests / 'python_launcher_test.py').write_text('import unittest\nclass Control(unittest.TestCase):\n    def test_control(self):\n        self.fail("MAINTAINED_FAILURE")\n')
            result = run()
            self.assertNotEqual(result.returncode, 0)
            self.assertIn('MAINTAINED_FAILURE', result.stderr)
