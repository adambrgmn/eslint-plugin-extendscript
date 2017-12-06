# Eslint Plugin ExtendScript

> Add environmen globals for extendscript

<!-- START doctoc generated TOC please keep comment here to allow auto update -->

<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

* [Contributors](#contributors)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Installation

This module is distributed via [npm](https://www.npmjs.com/) which comes bundled
with [node](https://nodejs.org/). Install it as one of your projects
`devDependencies`.

```sh
# with npm
npm install --save-dev eslint-plugin-extendscript

# or with yarn
yarn add --dev eslint-plugin-extendscript
```

## Setup

Remember to first install [Eslint](https://eslint.org/) as well, otherwise this
plugin will be utterly useless!

Then define `extendscript` as one of the plugins inside `.eslintrc` and add the
environments you like.

```js
{
  "extends": "eslint:recommended", // or any other presets
  "plugins": ["extendscript"],
  "env": {
    "extendscript/base": true, // Basic suite available in all ExtenScript environments
    "extendscript/scriptui": true, // ScriptUI globals
    "extendscript/indesign": true, // InDesign globals
    "extendscript/photoshop": true, // Photoshop globals
    "extendscript/illustrator": true, // Illustrator globals
  }
}
```

If you don't know or want to work on all environments you can use the
environment `"extendscript/extendscript"` instead. This will give you all
environment globals form all the ExtendScript environments.

## Contributions

Contributions are more than welcome. Especially if you like to add more
environments to this setup.

The globals are generated autotaically from ExtendScript documentation which
might be quite hard to find sometimes. Reach out to me via issues or email and
we might get something working.

All globals are found in `src/globals.json`. They are generated by running `npm
run get-globals`.

## Contributors

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->

<!-- prettier-ignore -->
| [<img src="https://avatars1.githubusercontent.com/u/13746650?v=4" width="100px;"/><br /><sub><b>Adam Bergman</b></sub>](http://fransvilhelm.com)<br />[💻](https://github.com/adambrgmn/eslint-plugin-extendscript/commits?author=adambrgmn "Code") [📖](https://github.com/adambrgmn/eslint-plugin-extendscript/commits?author=adambrgmn "Documentation") |
| :---: |

<!-- ALL-CONTRIBUTORS-LIST:END -->

## License

MIT
