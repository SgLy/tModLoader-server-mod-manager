import path from 'path';
import { compareVersion, isDirectory, isFile, listDirectory, matchVersions, rsync, tmpFile } from './utils.js';

export class TMLServerModManager {
  private localSteamLibrary: string;
  public mods: TMLMod[] = [];
  public versions: TMLVersion[] = [];
  private initialized = false;
  private initializeDone = false;
  private modRoot: string;

  constructor(localSteamLibrary: string) {
    this.localSteamLibrary = localSteamLibrary;
    this.modRoot = path.join(this.localSteamLibrary, 'steamapps', 'workshop', 'content', '1281930');
  }

  public async init() {
    if (this.initialized) {
      throw new Error('Manager can not be initialized twice');
    }
    this.initialized = true;

    const allVersions: Record<string, TMLVersion> = {};

    await listDirectory(this.modRoot)
      .filter(isDirectory)
      .forEach(async (modId, modPath) => {
        let modName: string | null = null;
        const allModVersions = new Set<string>();
        await listDirectory(modPath)
          .filter(isDirectory)
          .forEach(async (versionId, versionPath) => {
            if (allVersions[versionId] === undefined) {
              allVersions[versionId] = {
                id: versionId,
                mods: [],
              };
            }
            await listDirectory(versionPath)
              .filter(isFile)
              .filter(p => path.extname(p) === '.tmod')
              .forEach(modFile => {
                const { name } = path.parse(modFile);
                if (typeof modName === 'string' && modName !== name) {
                  throw new Error(`Mod ${modId} has multiple names ("${modName}" and "${name}")`);
                }
                modName = name;
                allModVersions.add(versionId);
                allVersions[versionId].mods.push();
              });
          });
        if (modName === null) {
          console.warn(`Mod with id ${modId} has no name`);
        }
        if (allModVersions.size === 0) {
          console.warn(`Mod with id ${modId} has no version`);
        }
        const mod = {
          name: modName ?? 'Unknown',
          id: modId,
          availableVersion: Array.from(allModVersions)
            .sort(compareVersion)
            .map(v => allVersions[v]!),
        };
        this.mods.push(mod);
        allModVersions.forEach(v => allVersions[v].mods.push(mod));
      });
    const allVersionIds = Object.keys(allVersions);
    allVersionIds.sort(compareVersion);
    this.versions = allVersionIds.map(id => allVersions[id]);
    this.initializeDone = true;
  }

  public getMods(modIds: string[]) {
    if (!this.initializeDone) throw new Error('getMods should be called after init');
    return modIds.map(id => {
      const mod = this.mods.find(m => m.id === id);
      if (mod === undefined) throw new Error(`Mod with id "${id}" not found during generateServerConfig`);
      return mod;
    });
  }

  public getModFile(mod: TMLMod, version: TMLVersion) {
    return path.join(this.modRoot, mod.id, version.id, `${mod.name}.tmod`);
  }

  public async sync(config: Config) {
    const mods = this.getMods(config.mods);

    const serverConfigFile = await tmpFile(JSON.stringify(mods.map(m => m.name)));
    const modFiles = mods.map(mod => {
      const version = matchVersions(config.version, mod.availableVersion);
      return this.getModFile(mod, version);
    });

    await rsync({
      shell: config.shell,
      source: [serverConfigFile, ...modFiles],
      destination: `${config.username}@${config.host}:/home/${config.username}/.local/share/Terraria/tModLoader/Mods/`,
    });
  }
}
