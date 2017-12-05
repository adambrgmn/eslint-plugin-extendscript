const globals = require('./globals.json');

const environments = Object.keys(globals).reduce(
  (keys, key) => ({
    ...keys,
    [key]: { globals: globals[key] },
  }),
  {},
);

module.exports = {
  environments,
};
