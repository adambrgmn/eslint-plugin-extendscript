'use strict'; // eslint-disable-line

const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const xml2js = require('xml2js'); // eslint-disable-line
const ora = require('ora'); // eslint-disable-line

const parseString = promisify(xml2js.parseString);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

const reduceToName = (acc, def) => {
  const { name } = def.$;
  if (name !== 'global') return Object.assign({}, acc, { [name]: false });

  const properties = def.elements[0].property.reduce(reduceToName, {});
  const methods = def.elements[0].method.reduce(reduceToName, {});
  return Object.assign({}, acc, properties, methods);
};

const reduceClassDef = arr => arr.reduce(reduceToName, {});

const sortObj = obj =>
  Object.keys(obj)
    .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
    .reduce((acc, key) => Object.assign({}, acc, { [key]: obj[key] }), {});

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
    const data = {
      base:
        '/Library/Application Support/Adobe/Scripting Dictionaries CC/CommonFiles/javascript.xml',
      indesign:
        '/Users/adam/Library/Preferences/ExtendScript Toolkit/4.0/omv$indesign-13.064$13.0.xml',
      illustrator:
        '/Library/Application Support/Adobe/Scripting Dictionaries CC/Illustrator 2018/omv.xml',
      photoshop:
        '/Library/Application Support/Adobe/Scripting Dictionaries CC/photoshop/omv.xml',
      scriptui:
        '/Library/Application Support/Adobe/Scripting Dictionaries CC/CommonFiles/scriptui.xml',
    };

    const xml = await Promise.all(
      Object.keys(data).map(async key => {
        const p = data[key];
        const xmlString = await readFile(p, 'utf8');
        return [key, xmlString];
      }),
    );

    const parsedXml = await Promise.all(
      xml.map(async ([key, xmlString]) => {
        const parsed = await parseString(xmlString);
        return [key, parsed];
      }),
    );

    const globals = parsedXml.reduce((acc, [key, x]) => {
      const { classdef } = x.dictionary.package[0];
      const keys = reduceClassDef(classdef);

      if (key === 'javascript') {
        return Object.assign({}, acc, {
          [key]: sortObj(Object.assign({}, keys, staticJsGlobals)),
        });
      }

      return Object.assign({}, acc, { [key]: sortObj(keys) });
    }, {});

    await writeFile(
      path.join(__dirname, 'test.json'),
      JSON.stringify(globals, null, 2),
      'utf8',
    );

    spinner.succeed('Done!');
  } catch (err) {
    spinner.fail(err.message);
  }
}

main();
