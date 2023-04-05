import os from 'os';
import fs from 'fs';
import path from 'path';

const ConfigFolder = path.join(os.homedir(), '.config', 'tmlsm');
const ConfigFile = path.join(ConfigFolder, 'config.json');

export async function loadConfig() {
  await fs.promises.mkdir(ConfigFolder, { recursive: true });
  try {
    const config = await fs.promises.readFile(ConfigFile);
    return JSON.parse(config.toString()) as Partial<Config>;
  } catch (e) {
    return {} as Partial<Config>;
  }
}

export async function saveConfig(config: Config) {
  await fs.promises.mkdir(ConfigFolder, { recursive: true });
  await fs.promises.writeFile(ConfigFile, JSON.stringify(config));
}
