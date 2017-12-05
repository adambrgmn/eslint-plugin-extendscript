#!/usr/bin/env node

'use strict'; // eslint-disable-line

const path = require('path');
const fs = require('fs');
const spawn = require('cross-spawn'); // eslint-disable-line
const rimraf = require('rimraf'); // eslint-disable-line
const meow = require('meow'); // eslint-disable-line
const ora = require('ora'); // eslint-disable-line

const cli = meow(
  `
  Usage
    $ generate-globals --target target

  Options
    --target, -t  Target (e.g. indesign, photoshp)

  Examples
    $ generate-globals --target indesign
`,
  {
    flags: {
      target: {
        type: 'string',
        alias: 't',
        default: '',
      },
    },
  },
);

const generateCode = (target, tempFile) => `${target && `//@target ${target}`}
if (!Object.keys) {
  Object.keys = (function () {
    'use strict';
    var hasOwnProperty = Object.prototype.hasOwnProperty,
      hasDontEnumBug = !({ toString: null }).propertyIsEnumerable('toString'),
      dontEnums = [
        'toString',
        'toLocaleString',
        'valueOf',
        'hasOwnProperty',
        'isPrototypeOf',
        'propertyIsEnumerable',
        'constructor'
      ],
      dontEnumsLength = dontEnums.length;

    return function (obj) {
      if (typeof obj !== 'function' && (typeof obj !== 'object' || obj === null)) {
        throw new TypeError('Object.keys called on non-object');
      }

      var result = [], prop, i;

      for (prop in obj) {
        if (hasOwnProperty.call(obj, prop)) {
          result.push(prop);
        }
      }

      if (hasDontEnumBug) {
        for (i = 0; i < dontEnumsLength; i++) {
          if (hasOwnProperty.call(obj, dontEnums[i])) {
            result.push(dontEnums[i]);
          }
        }
      }
      return result;
    };
  }());
}


var _getGlobal = Function('return this')();
var _global = _getGlobal();

main();

function main() {
  var filename = '${tempFile}';
  var file = File(filename);

  try {
    file.open('w', undefined, undefined);
    file.encoding = 'UTF-8';
    file.lineFeed = 'Unix';
    file.writeln('{');

    var keys = Object.keys(_global)
      .sort(function sort(a, b) {
        var aLow = a.toLowerCase();
        var bLow = b.toLowerCase();

        if (aLow > bLow) return 1;
        if (bLow > aLow) return -1;
        return 0;
      });

    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];

      if (key[0] !== '_') {
        var str = '  "' + key + '": true';
        if (i < keys.length - 1) str += ',';

        file.writeln(str);
      }
    }

    file.writeln('}');
  } finally {
    file.close();
  }
}
`;

const ensureDirectoryExistence = p => {
  const dirname = path.dirname(p);
  if (fs.existsSync(dirname)) return;

  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
};

const readJson = p => {
  try {
    const content = fs.readFileSync(p);
    const json = JSON.parse(content.toString());
    return json;
  } catch (err) {
    throw err;
  }
};

const writeJson = (p, content) => {
  try {
    const json = JSON.stringify(content, null, 2);
    ensureDirectoryExistence(p);
    fs.writeFileSync(p, json, 'utf8');
  } catch (err) {
    throw err;
  }
};

const delay = dur =>
  new Promise(resolve => {
    setTimeout(resolve, dur);
  });

const awaitFile = async (p, dur = 500) => {
  await delay(dur);
  if (!fs.existsSync(p)) return awaitFile(p);
  return true;
};

async function main(target) {
  const spinner = ora(
    `Will run script on target ${target || 'extendscript'}`,
  ).start();

  try {
    rimraf.sync(path.join(__dirname, '../.temp'));

    const tempCodePath = path.join(__dirname, '../.temp', 'code.jsx');
    const tempKeysPath = path.join(__dirname, '../.temp', 'global-keys.json');
    const keysPath = path.join(__dirname, '../src', 'global-keys.json');
    const bin =
      '/Applications/Adobe ExtendScript Toolkit CC/ExtendScript Toolkit.app/Contents/MacOS/ExtendScript Toolkit';

    spinner.text = 'Reading and creating necessary files';
    const existingKeys = readJson(keysPath);
    const testCode = generateCode(target, tempKeysPath);

    ensureDirectoryExistence(tempCodePath);
    fs.writeFileSync(tempCodePath, testCode, 'utf8');

    spinner.text = 'Will run script (awaiting confirmation)';
    spinner.color = 'yellow';
    const result = spawn.sync(bin, ['-run', tempCodePath], {
      stdio: 'inherit',
    });

    if (result > 0) {
      const err = new Error('Failed to execute script');
      err.code = result.code;
      throw err;
    }

    spinner.text = 'Waiting for script to finish';
    spinner.color = 'cyan';
    await awaitFile(tempKeysPath);

    spinner.text = 'Finalizing by writing new global keys';
    const generatedJson = readJson(tempKeysPath);
    const newKeys = Object.assign({}, existingKeys, {
      [target || 'extendscript']: generatedJson,
    });

    writeJson(keysPath, newKeys);
    rimraf.sync(path.join(__dirname, '../.temp'));

    spinner.succeed('Everything done!');
    process.exit(0);
    return null;
  } catch (err) {
    spinner.fail(err.message);
    process.exit(err.code || 1);
    return null;
  }
}

main(cli.flags.target);
