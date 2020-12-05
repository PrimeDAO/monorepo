import { runCLI } from '@jest/core';
import * as path from 'path';
import * as packageJson from '../../package.json';

import { CLIOptions } from 'aurelia-cli';

export default (cb) => {
  const options = packageJson.jest;

  if (CLIOptions.hasFlag('watch')) {
    Object.assign(options, { watch: true });
  }

  if (CLIOptions.hasFlag('spec')) {
    Object.assign(options, { '_': [CLIOptions.getFlagValue('spec')] });
  }

  runCLI(options, [path.resolve(__dirname, '../../')]).then(({ results }) => {
    if (results.numFailedTests || results.numFailedTestSuites) {
      cb('Tests Failed');
    } else {
      cb();
    }
  });
};
