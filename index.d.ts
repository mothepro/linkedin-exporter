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
/** Find the data from the given xpaths and return as an array map. */
declare function getData(xPaths: Record<string, (index: number) => string>): Map<string, string[]>;
/** Paths to important fields in user-generated linkedin lists. */
declare const userPaths: {
    Name: (index: number) => string;
    Link: (index: number) => string;
    Geography: (index: number) => string;
    Title: (index: number) => string;
    Account: (index: number) => string;
};
/** Paths to important fields in user-generated linkedin lists. */
declare const systemPaths: {
    Name: (index: number) => string;
    Link: (index: number) => string;
    Geography: (index: number) => string;
    Title: (index: number) => string;
    Account: (index: number) => string;
};
