const globals = require('./globals.json');

const environments = Object.keys(globals).reduce(
  (keys, key) => ({
    ...keys,
    [key]: { globals: globals[key] },
  }),
  {},
);

module.exports = {
  environments: {
    extendscript: Object.keys(environments).reduce(
      (acc, key) => ({
        globals: {
          ...acc.globals,
          ...environments[key].globals,
        },
      }),
      {},
    ),
    ...environments,
  },
};
