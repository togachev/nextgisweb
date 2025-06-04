type Entries<T> = { [K in keyof T]: [K, T[K]]; }[keyof T][];

export const getEntries = <T extends object>(obj: T) => Object.entries(obj) as Entries<T>;

type Entry<T> = {
    [K in keyof T]: [K, T[K]];
}[keyof T];

export const filterObject = <T extends object>(
    obj: T,
    fn: (entry: Entry<T>, i: number, arr: Entry<T>[]) => boolean,
): Partial<T> => {
    const next = { ...obj };

    const entries: Entry<T>[] = [];

    for (const key in obj) {
        entries.push([key, obj[key]]);
    }

    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        if (!fn(entry, i, entries)) {
            delete next[entry[0]];
        }
    }

    return next;
}