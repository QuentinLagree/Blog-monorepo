const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'blog-test-summary-'));
const started = performance.now();
const phases = [
  { label: '🧩 Unitaires', config: 'jest.config.ts' },
  { label: '🌐 E2E / intégration', config: 'src/test/e2e/jest-e2e.json' },
];
const totals = {
  tests: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  todo: 0,
  suites: 0,
  failedSuites: 0,
};
const reports = [];
let successful = true;

const color = (code, value) =>
  process.stdout.isTTY && !process.env.NO_COLOR
    ? `\x1b[${code}m${value}\x1b[0m`
    : value;

try {
  for (const [index, phase] of phases.entries()) {
    const file = path.join(directory, `${index}.json`);
    const execution = spawnSync(
      process.execPath,
      [
        require.resolve('jest/bin/jest'),
        '--config',
        phase.config,
        ...process.argv.slice(2),
        '--json',
        '--outputFile',
        file,
      ],
      { cwd: root, env: process.env, stdio: 'inherit' },
    );

    let result;
    try {
      result = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch {
      /* A startup failure may prevent Jest from producing a report. */
    }

    const passed = execution.status === 0 && result?.success === true;
    successful &&= passed;
    if (result) {
      const counts = {
        tests: result.numTotalTests,
        passed: result.numPassedTests,
        failed: result.numFailedTests,
        skipped: result.numPendingTests,
        todo: result.numTodoTests,
        suites: result.numTotalTestSuites,
        failedSuites: result.numFailedTestSuites,
      };
      for (const key of Object.keys(totals)) totals[key] += counts[key] ?? 0;
      reports.push(
        `${phase.label} : ${passed ? '✅' : '❌'} ${counts.passed} réussis / ${counts.tests} tests`,
      );
    } else {
      reports.push(
        `${phase.label} : ❌ rapport indisponible — exécution incomplète`,
      );
    }
    if (execution.error) console.error(execution.error.message);
    if (execution.signal) break;
  }

  const duration = ((performance.now() - started) / 1000).toFixed(1);
  console.log(
    color(
      '36',
      '\n╭──────────────────────────────────────────────────────────',
    ),
  );
  console.log(color('1;36', '│  🧪 BILAN GLOBAL DES TESTS'));
  console.log('│');
  for (const report of reports) console.log(`│  ${report}`);
  console.log('│');
  console.log(`│  📊 Total : ${totals.tests} tests · ${totals.suites} suites`);
  console.log(color('32', `│  ✅ Réussis : ${totals.passed}`));
  console.log(
    color(
      totals.failed || totals.failedSuites ? '31' : '37',
      `│  ❌ Échoués : ${totals.failed} tests · ${totals.failedSuites} suites`,
    ),
  );
  console.log(
    `│  ⏭️  Ignorés : ${totals.skipped} · 📝 À écrire : ${totals.todo}`,
  );
  console.log(`│  ⏱️  Durée totale : ${duration} s`);
  console.log('│');
  console.log(
    color(
      successful ? '1;32' : '1;31',
      successful
        ? '│  🎉 Tous les tests exécutés ont réussi !'
        : '│  🚨 Échecs ou exécution incomplète : vérifier les détails ci-dessus.',
    ),
  );
  console.log(
    color(
      '36',
      '╰──────────────────────────────────────────────────────────\n',
    ),
  );
  process.exitCode = successful ? 0 : 1;
} finally {
  for (const file of fs.readdirSync(directory))
    fs.unlinkSync(path.join(directory, file));
  fs.rmdirSync(directory);
}
