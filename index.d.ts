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
/** The contents and how to find them in the html */
declare const xpaths: {
    Name: (index: number) => string;
    Geography: (index: number) => string;
    Title: (index: number) => string;
    Account: (index: number) => string;
};
/** Store the contents ready to put in a CSV. */
declare const data: Map<string, string[]>;
declare let index: number;
