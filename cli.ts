import inquirer from 'inquirer';

import inquirerAutoCompletePrompt from 'inquirer-autocomplete-prompt';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { TMLServerModManager } from './src/lib.js';
import { loadConfig, saveConfig } from './src/config.js';
import { autoCompletePath, isDirectorySync, matchVersions } from './src/utils.js';

const log = console.log;

async function interactive() {
  inquirer.registerPrompt('autocomplete', inquirerAutoCompletePrompt);

  const oldConfig = await loadConfig();

  const { localSteamLibrary } = await inquirer.prompt([
    {
      type: 'autocomplete',
      name: 'localSteamLibrary',
      message: 'Local Steam library path:',
      default: oldConfig.localSteamLibrary,
      suggestOnly: true,
      validate(choice) {
        return isDirectorySync(choice) ? true : `"${choice}" is not a valid folder!`;
      },
      async source(_answer: Record<string, never>, input?: string) {
        return await autoCompletePath(process.cwd(), input ?? oldConfig.localSteamLibrary);
      },
    },
  ]);

  const manager = new TMLServerModManager(localSteamLibrary);
  log('Initializing...');
  await manager.init();

  const config: Config = await inquirer.prompt([
    {
      type: 'input',
      name: 'host',
      message: 'Server host address:',
      default: oldConfig.host,
    },
    {
      type: 'input',
      name: 'username',
      message: 'Server username:',
      default: oldConfig.username,
    },
    {
      type: 'input',
      name: 'shell',
      message: 'RSync shell:',
      default: oldConfig.shell,
    },
    {
      type: 'list',
      name: 'version',
      message: 'tModLoader version:',
      choices: manager.versions.map(v => ({
        name: `${v.id} (${v.mods.length} mods)`,
        value: v.id,
      })),
      default: oldConfig.version,
      loop: false,
    },
    {
      type: 'checkbox',
      name: 'mods',
      message: 'Enabled mods: ',
      choices(answer) {
        return manager.mods.map(m => ({
          name: `${m.name} (${matchVersions(answer.version, m.availableVersion).id})`,
          value: m.id,
        }));
      },
      loop: false,
      default: oldConfig.mods,
    },
  ]);

  config.localSteamLibrary = localSteamLibrary;

  await saveConfig(config);

  log('Synchronizing...');

  await manager.sync(config);
}

async function update() {
  const config = await loadConfig();

  if (typeof config.localSteamLibrary !== 'string') {
    throw new Error('Missing localSteamLibrary, made an interactive run before update.');
  }
  if (typeof config.host !== 'string') {
    throw new Error('Missing host, made an interactive run before update.');
  }
  if (typeof config.username !== 'string') {
    throw new Error('Missing username, made an interactive run before update.');
  }
  if (typeof config.shell !== 'string') {
    throw new Error('Missing shell, made an interactive run before update.');
  }
  if (typeof config.version !== 'string') {
    throw new Error('Missing version, made an interactive run before update.');
  }
  if (!Array.isArray(config.mods)) {
    throw new Error('Missing mods, made an interactive run before update.');
  }

  const manager = new TMLServerModManager(config.localSteamLibrary);
  log('Initializing...');
  await manager.init();

  log('Synchronizing...');

  await manager.sync(config as unknown as Config);
}

const argv = await yargs(hideBin(process.argv))
  .option('u', {
    alias: 'update',
    demandOption: false,
    type: 'boolean',
    default: false,
    describe: 'Update mods using last time options.',
  })
  .option('p', {
    alias: ['path', 'steam-library-path'],
    demandOption: false,
    type: 'string',
    default: '',
    describe: 'Local Steam library path',
  })
  .option('i', {
    alias: ['interactive'],
    demandOption: false,
    type: 'boolean',
    default: true,
    describe: 'Interactively ask for all required params',
  }).argv;

if (argv.u) {
  await update();
} else {
  await interactive();
}
