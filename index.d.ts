/** Assert an expression is true. */
declare function assert(expression: unknown, message?: string): asserts expression;
/** Assert an expression is not null, and returns it. */
declare function assertNotNull<T>(expression: T, message?: string): NonNullable<T>;
/** Escapes a CSV */
declare const csvEscape: (data: string) => string;
/** Downloads an auto generated file locally. */
declare function download(filename: string, text: string, meta?: BlobPropertyBag): void;
/** Convert an Array map to a stringified CSV. */
declare function toCsv(contents: Map<string, string[]>): string;
/** Append a value to an ArrayMap with the given header. */
declare function updateMap<K, V>(contents: Map<K, V[]>, header: K, data: V): void;
declare const xpaths: {
    name: (index: number) => string;
    geography: (index: number) => string;
    title: (index: number) => string;
    account: (index: number) => string;
};
declare const data: Map<string, string[]>;
declare let index: number;
