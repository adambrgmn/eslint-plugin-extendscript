const globalKeys = require('./global-keys.json');

const environments = Object.keys(globalKeys).reduce(
  (keys, key) =>
    Object.assign({}, keys, {
      [key]: {
        globals: Object.assign({ $: true }, globalKeys[key]),
      },
    }),
  {},
);

module.exports = {
  environments,
};
