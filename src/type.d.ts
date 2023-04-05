type Arguments<T> = T extends (...args: infer R) => any ? R : never;

interface ArrayConstructor {
  fromEach<T>(count: number, fn: (index: number) => T): T[];
}

interface Array<T> {
  groupBy(fn: (item: T) => string): Record<string, T[]>;
  asyncForEach(callbackfn: (value: T, index: number, array: T[]) => Promise<void>, thisArg?: any): Promise<void>;
  get last(): T;
}

interface Math {
  maxByKey<T>(arr: T[], fn: (entry: T) => number): T | null;
  minByKey<T>(arr: T[], fn: (entry: T) => number): T | null;
}

interface Uint8Array {
  toBase64(): string;
}
interface Uint8ArrayConstructor {
  fromBase64(base64String: string): Uint8Array;
}

interface ObjectConstructor {
  // just some funny personal favor.
  keys<T>(o: T): Array<keyof T>;
  fromEntries<T extends string | number, U>(entries: [T, U][]): Record<T, U>;
}

interface TMLMod {
  id: string;
  name: string;
  availableVersion: TMLVersion[];
}

interface TMLVersion {
  id: string;
  mods: TMLMod[];
}

interface Config {
  host: string;
  username: string;
  shell: string;
  version: string;
  mods: string[];
  localSteamLibrary: string;
}
