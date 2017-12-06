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

const sortObj = obj =>
  Object.keys(obj)
    .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
    .reduce((acc, key) => ({ ...acc, [key]: obj[key] }), {});

const staticJsGlobals = {
  // Fetched from $.global in Extendscript Tools and filtered
  app: false,
  apps: false,
  AvailabilityCheckOptions: false,
  bridge: false,
  contextMenu: false,
  document: false,
  illustrator: false,
  indesign: false,
  key: false,
  keys: false,
  menuItemInfo: false,
  menuTextOrder: false,
  photoshop: false,
  placeLinkCmd: false,
  subMenu: false,
  subMenuBrush: false,
  subMenuGraphic: false,
  subMenuSwatch: false,
  subMenuSymbol: false,
  tempPSVersionInfo: false,
};

async function main() {
  const spinner = ora('Generating data from xml').start();

  try {
    const scriptingDir = path.join(
      '/Library',
      'Application Support',
      'Adobe',
      'Scripting Dictionaries CC',
    );

    const paths = {
      base: path.join(scriptingDir, 'CommonFiles', 'javascript.xml'),
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

    const parsedXml = await Promise.all(
      Object.keys(paths).map(async key => {
        try {
          const p = paths[key];
          const xml = await readFile(p, 'utf8');
          const parsed = await parseString(xml);
          return [key, parsed];
        } catch (err) {
          return null;
        }
      }),
    );

    const globals = parsedXml.filter(Boolean).reduce((acc, [key, x]) => {
      const { classdef } = x.dictionary.package[0];
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

    await writeFile(
      path.join(__dirname, '..', 'src', 'globals.json'),
      JSON.stringify({ ...existingGlobals, ...globals }, null, 2),
      'utf8',
    );

    spinner.succeed('Done!');
  } catch (err) {
    spinner.fail(err.message);
  }
}

main();
