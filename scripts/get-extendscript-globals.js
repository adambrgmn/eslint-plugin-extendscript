'use strict'; // eslint-disable-line

const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const xml2js = require('xml2js'); // eslint-disable-line
const ora = require('ora'); // eslint-disable-line
const existingGlobals = require('../src/globals.json');

const parseString = promisify(xml2js.parseString);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

const reduceToName = arr =>
  arr.reduce((acc, def) => {
    const { name } = def.$;
    if (name !== 'global') return { ...acc, [name]: false };

    const properties = reduceToName(def.elements[0].property);
    const methods = reduceToName(def.elements[0].method);
    return { ...acc, ...properties, ...methods };
  }, {});

const toLower = a => a.toLowerCase();
const compare = (a, b) => a.localeCompare(b);
const sortObj = obj =>
  Object.entries(obj)
    .sort(([a], [b]) => compare(toLower(a), toLower(b)))
    .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

const staticJsGlobals = {
  // Fetched from $.global in Extendscript Tools
  app: false,
  apps: false,
  AvailabilityCheckOptions: false,
  bridge: false,
  illustrator: false,
  indesign: false,
  menuTextOrder: false,
  photoshop: false,
};

async function main() {
  const spinner = ora();

  try {
    /**
     * This is the main scripting directory root where most of the Extendscript
     * dictionaries are found (for some reason InDesign dictionaries are located
     * elsewhere)
     */
    const scriptingDir = path.join(
      '/Library',
      'Application Support',
      'Adobe',
      'Scripting Dictionaries CC',
    );

    const paths = {
      // General globals available inside all Extendscript environments
      base: path.join(scriptingDir, 'CommonFiles', 'javascript.xml'),
      /**
       * Indesign envrinoment. These files are located elsewhere and a bit
       * oddly named. Needs to be double chekced to see that the latest one
       * is used.
       */
      indesign: path.join(
        process.env.HOME,
        '/Library',
        'Preferences',
        'ExtendScript Toolkit',
        '4.0',
        'omv$indesign-13.064$13.0.xml',
      ),
      illustrator: path.join(scriptingDir, 'Illustrator 2018', 'omv.xml'),
      photoshop: path.join(scriptingDir, 'photoshop', 'omv.xml'),
      scriptui: path.join(scriptingDir, 'CommonFiles', 'scriptui.xml'),
    };

    /**
     * Try reading all files content. But ignore any errors
     */
    spinner.start('Reading files');
    const files = await Promise.all(
      Object.entries(paths).map(async ([key, p]) => {
        try {
          const content = await readFile(p, 'utf8');
          return [key, content];
        } catch (err) {
          return null;
        }
      }),
    );

    /**
     * Parse the content xml into large objects, ignore any errors.
     */
    spinner.succeed().start('Parsing XML');
    const parsedXml = await Promise.all(
      files.filter(Boolean).map(async ([key, content]) => {
        try {
          const parsed = await parseString(content);
          return [key, parsed];
        } catch (err) {
          return null;
        }
      }),
    );

    /**
     * Reduce the JSON tree into the final JSON tree
     */
    spinner.succeed().start('Extracting globals');
    const globals = parsedXml.filter(Boolean).reduce((acc, [key, xml]) => {
      const { classdef } = xml.dictionary.package[0];
      const keys = reduceToName(classdef);

      if (key === 'base') {
        return {
          ...acc,
          [key]: sortObj({
            ...existingGlobals[key],
            ...keys,
            ...staticJsGlobals,
          }),
        };
      }

      return {
        ...acc,
        [key]: sortObj({ ...existingGlobals[key], ...keys }),
      };
    }, {});

    spinner.succeed().start('Updating src/globals.json');
    await writeFile(
      path.join(__dirname, '..', 'src', 'globals.json'),
      JSON.stringify({ ...existingGlobals, ...globals }, null, 2),
      'utf8',
    );

    spinner.succeed();
  } catch (err) {
    spinner.fail(err.message);
  }
}

main();
