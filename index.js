"use strict";
/** Assert an expression is true. */
function assert(expression, message = 'Assertion Error') {
    if (!expression)
        throw new Error(message);
}
/** Assert an expression is not null, and returns it. */
function assertNotNull(expression, message) {
    assert(expression != null, message);
    return expression;
}
/** Escapes a CSV */
const csvEscape = (data) => `"${data
    .replace(/(\r\n|\n|\r|\s+|\t|&nbsp;)/gm, ' ')
    .replace(/"/g, '""')
    .trim()}"`;
/** Downloads an auto generated file locally. */
function download(filename, text, meta = { type: 'text/csv' }) {
    const element = document.createElement('a');
    element.setAttribute('href', URL.createObjectURL(new Blob([text], meta)));
    element.setAttribute('download', filename);
    // simulate click on invisible link to start download
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}
/** Convert an Array map to a stringified CSV. */
function toCsv(contents) {
    const data = [[...contents.keys()]];
    for (let row = 0; row < Math.max(...[...contents.values()].map(col => col.length)); row++) {
        const rowData = [];
        for (const header of data[0]) {
            const column = contents.get(header);
            rowData.push(column[row]);
        }
        data.push(rowData);
    }
    return data.map(row => row.map(csvEscape).join(',')).join('\n');
}
/** Append a value to an ArrayMap with the given header. */
function updateMap(contents, header, data) {
    var _a;
    const column = (_a = contents.get(header)) !== null && _a !== void 0 ? _a : [];
    column.push(data);
    contents.set(header, column);
}
// Activated //
const xpaths = {
    name: (index) => `/html/body/main/div[1]/div[2]/div[4]/table/tbody/tr[${index}]/td[1]/div/figure/a/span`,
    geography: (index) => `/html/body/main/div[1]/div[2]/div[4]/table/tbody/tr[${index}]/td[3]`,
    title: (index) => `/html/body/main/div[1]/div[2]/div[4]/table/tbody/tr[${index}]/td[1]/div/div[2]/div[2]/span/div`,
    account: (index) => `/html/body/main/div[1]/div[2]/div[4]/table/tbody/tr[${index}]/td[2]/div/div/div/a/div/div/div/span`,
};
const data = new Map();
let index = 1;
while (true)
    try {
        for (const [key, fullXpath] of Object.entries(xpaths)) {
            const element = document.evaluate(fullXpath(index), document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            updateMap(data, key, assertNotNull(assertNotNull(element).textContent));
        }
        index++;
    }
    catch (err) {
        break;
    }
if (data.size)
    try {
        download(`${index}_contacts__${Date.now()}.csv`, toCsv(data));
    }
    catch (err) {
        assert(err instanceof Error);
        alert(err.message);
    }
