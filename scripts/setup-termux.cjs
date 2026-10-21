const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');

function main() {
  if (process.platform !== 'android' || !process.env.PREFIX) {
    throw new Error('This setup command is for native Android Termux only. Elsewhere use npm ci.');
  }
  if (/^(\/sdcard|\/storage|\/mnt\/media_rw)(\/|$)/.test(fs.realpathSync(root))) {
    throw new Error('Move the project into Termux home (for example ~/projects/WorkerFeedback).');
  }
  const prefix = process.env.PREFIX;
  for (const file of ['bin/python', 'bin/clang', 'bin/clang++', 'bin/make', 'include/node/node.h']) {
    if (!fs.existsSync(path.join(prefix, file))) {
      throw new Error(`Missing ${file}. First run: pkg install nodejs-lts python make clang pkg-config binutils`);
    }
  }
  if (!process.env.npm_execpath) throw new Error('Run this script with npm run setup:termux.');
  const env = {
    ...process.env,
    CC: path.join(prefix, 'bin/clang'),
    CXX: path.join(prefix, 'bin/clang++'),
    npm_config_python: path.join(prefix, 'bin/python'),
    npm_config_nodedir: prefix,
    npm_config_jobs: '1',
    npm_config_ignore_scripts: 'false',
    GYP_DEFINES: `${process.env.GYP_DEFINES || ''} android_ndk_path=${prefix}`.trim()
  };
  function run(script, args) {
    const result = spawnSync(process.execPath, [script, ...args], { cwd: root, env, stdio: 'inherit' });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(`Setup stopped (${result.signal || result.status}); see the error above.`);
  }

  // better-sqlite3 11.10 runs its install hook and builds the Android binding.
  run(process.env.npm_execpath, ['ci', '--include=dev', '--include=optional']);

  // Explicitly install the matching Android package if npm skipped an optional dependency.
  const frontendRequire = createRequire(path.join(root, 'frontend/package.json'));
  const rollupPath = frontendRequire.resolve('rollup/package.json');
  const rollup = JSON.parse(fs.readFileSync(rollupPath, 'utf8'));
  const suffix = { arm64: 'android-arm64', arm: 'android-arm-eabi' }[process.arch];
  if (!suffix) throw new Error(`Unsupported Android architecture: ${process.arch}`);
  const nativePackage = `@rollup/rollup-${suffix}`;
  const rollupRequire = createRequire(rollupPath);
  try {
    rollupRequire(nativePackage);
  } catch {
    run(process.env.npm_execpath, ['install', '--no-save', '--package-lock=false', '--include=optional', `${nativePackage}@${rollup.version}`]);
  }
  run(path.join(root, 'scripts/check-sqlite.cjs'), []);
  console.log('Termux setup complete. Run npm run build, then start each dev server in its own terminal.');
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
