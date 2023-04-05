import fs from 'fs';
import os from 'os';
import path from 'path';
import RSync from 'rsync';

if (!Array.prototype.asyncForEach) {
  Array.prototype.asyncForEach = function (fn) {
    let p = Promise.resolve();
    for (let i = 0; i < this.length; ++i) {
      p = p.then(() => fn(this[i], i, this));
    }
    return p;
  };
}

if (!Array.prototype.groupBy) {
  Array.prototype.groupBy = function (fn) {
    const ret: Record<string, any[]> = {};
    for (let i = 0; i < this.length; ++i) {
      const key = fn(this[i]);
      if (ret[key] === undefined) ret[key] = [];
      ret[key].push(this[i]);
    }
    return ret;
  };
}

if (!Array.prototype.last) {
  Object.defineProperty(Array.prototype, 'last', {
    configurable: true,
    enumerable: true,
    get() {
      return this[this.length - 1];
    },
    set(v) {
      this[this.length - 1] = v;
    },
  });
}

if (!Array.fromEach) {
  Array.fromEach = function (n, fn) {
    return Array(n)
      .fill(null)
      .map((_, i) => fn(i));
  };
}

if (!Math.maxByKey) {
  Math.maxByKey = function (arr, fn) {
    let maxValue = Number.NEGATIVE_INFINITY;
    let maxEntry: (typeof arr)[0] | null = null;
    arr.forEach(item => {
      if (fn(item) > maxValue) {
        maxValue = fn(item);
        maxEntry = item;
      }
    });
    return maxEntry;
  };
}

if (!Math.minByKey) {
  Math.minByKey = function (arr, fn) {
    let minValue = Number.POSITIVE_INFINITY;
    let minEntry: (typeof arr)[0] | null = null;
    arr.forEach(item => {
      if (fn(item) < minValue) {
        minValue = fn(item);
        minEntry = item;
      }
    });
    return minEntry;
  };
}

export function isDirectorySync(path: string) {
  if (!fs.existsSync(path)) return false;
  const stat = fs.statSync(path);
  return stat.isDirectory();
}

export async function isDirectory(path: string) {
  try {
    const stat = await fs.promises.stat(path);
    return stat.isDirectory();
  } catch (e) {
    return false;
  }
}

export async function isFile(path: string) {
  try {
    const stat = await fs.promises.stat(path);
    return stat.isFile();
  } catch (e) {
    return false;
  }
}

export function listDirectory(dir: string) {
  type Filter = (subPath: string) => boolean | Promise<boolean>;
  const filters: Filter[] = [];
  const ret = {
    filter(filter: Filter) {
      filters.push(filter);
      return ret;
    },
    async forEach(callback: (path: string, fullPath: string) => void | Promise<void>) {
      const subPaths = await fs.promises.readdir(dir);
      await subPaths.asyncForEach(async p => {
        const subPath = path.join(dir, p);
        for (let i = 0; i < filters.length; ++i) {
          const filterRes = await filters[i](subPath);
          if (!filterRes) return;
        }
        await callback(p, subPath);
      });
    },
  };
  return ret;
}

export async function autoCompletePath(cwd: string, str?: string) {
  const s = str ?? '';
  let p = '';
  for (let i = s.length; i >= 0; --i) {
    p = path.resolve(cwd, s.slice(0, i));
    if (await isDirectory(p)) break;
  }
  try {
    const dir = await fs.promises.readdir(p);
    const ret: string[] = [];
    ret.push(p + path.sep);
    if (path.resolve(p, '..') !== p) {
      ret.push(p + path.sep + '..');
    }
    for (let i = 0; i < dir.length; ++i) {
      const subFolder = path.join(p, dir[i]);
      if (!(await isDirectory(subFolder))) continue;
      ret.push(subFolder);
    }
    return ret;
  } catch (e) {
    return [];
  }
}

export async function tmpFile(content: string) {
  const folder = path.join(os.tmpdir(), 'tmlsm');
  const file = path.join(folder, 'enabled.json');
  await fs.promises.mkdir(folder, { recursive: true });
  await fs.promises.writeFile(file, content);
  return file;
}

export async function rsync(args: Arguments<(typeof RSync)['build']>[0]) {
  const rsync = RSync.build({
    ...args,
    flags: 'uav',
    chmod: '644',
    progress: true,
  });
  return new Promise<void>((resolve, reject) => {
    rsync.execute(
      (err, code) => {
        if (err) reject(err);
        else if (code !== 0) reject(new Error(`rsync returned with non-zero exit code (${code})`));
        else resolve();
      },
      (data: Buffer) => {
        console.log(data.toString());
      },
    );
  });
}

const parseVersion = (v: string) => v.split('.').map(part => parseInt(part, 10));

export function compareVersion(a: string, b: string) {
  const A = parseVersion(a);
  const B = parseVersion(b);
  for (let i = 0; i < Math.min(A.length, B.length); ++i) {
    if (A[i] < B[i]) return -1;
    if (A[i] > B[i]) return 1;
  }
  if (A.length < B.length) return -1;
  if (A.length > B.length) return 1;
  return 0;
}

export function matchVersions(targetId: string, versions: TMLVersion[]) {
  let left = 0;
  let right = versions.length;
  while (left + 1 < right) {
    const mid = (left + right) >> 1;
    if (compareVersion(versions[mid].id, targetId) <= 0) left = mid;
    else right = mid;
  }
  return versions[left]!;
}
