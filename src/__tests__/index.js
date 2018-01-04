import { CLIEngine } from 'eslint';
import plugin from '../index';

const createCli = env => {
  const cli = new CLIEngine({
    useEslintrc: false,
    baseConfig: {
      extends: 'eslint:recommended',
      plugins: ['extendscript'],
      env,
    },
  });
  cli.addPlugin('eslint-plugin-extendscript', plugin);
  return cli;
};

const lint = (code, cli) => {
  const linter = cli.executeOnText(code);
  return CLIEngine.getErrorResults(linter.results);
};

test('Separate environments', () => {
  const cli = createCli({
    'extendscript/base': true,
    'extendscript/indesign': true,
    'extendscript/illustrator': true,
    'extendscript/photoshop': true,
    'extendscript/scriptui': true,
  });

  const result = lint(
    `
    $.writeln('Hello world!');
    new AlignOptions();
    new Artboard();
    new Channel();
    new ScriptUI();
  `,
    cli,
  );

  expect(result).toMatchSnapshot();
});

test('General environment', () => {
  const cli = createCli({ 'extendscript/extendscript': true });

  const result = lint(
    `
    $.writeln('Hello world!');
    new Book();
    new BlendModes();
    new Direction();
    new DropDownList();
  `,
    cli,
  );

  expect(result).toMatchSnapshot();
});

test('Should not leak between environments', () => {
  const cli = createCli({ 'extendscript/indesign': true });
  const result = lint(
    `
    $.writeln('Hello world');
  `,
    cli,
  );

  expect(result).toMatchSnapshot();
});
