/** Assert an expression is true. */
function assert(expression: unknown, message = 'Assertion Error'): asserts expression {
  if (!expression) throw new Error(message)
}

/** Assert an expression is not null, and returns it. */
function assertNotNull<T>(expression: T, message?: string): NonNullable<T> {
  assert(expression != null, message)
  return expression
}

/** Escapes a CSV */
const csvEscape = (data: string) =>
  `"${data
    .replace(/(\r\n|\n|\r|\s+|\t|&nbsp;)/gm, ' ')
    .replace(/"/g, '""')
    .trim()}"`

/** Downloads an auto generated file locally. */
function download(filename: string, text: string, meta: BlobPropertyBag = { type: 'text/csv' }) {
  const element = document.createElement('a')
  element.setAttribute('href', URL.createObjectURL(new Blob([text], meta)))
  element.setAttribute('download', filename)

  // simulate click on invisible link to start download
  element.style.display = 'none'
  document.body.appendChild(element)

  element.click()
  document.body.removeChild(element)
}

/** Convert an Array map to a stringified CSV. */
function toCsv(contents: Map<string, string[]>) {
  const data = [[...contents.keys()]]
  for (let row = 0; row < Math.max(...[...contents.values()].map(col => col.length)); row++) {
    const rowData: string[] = []
    for (const header of data[0]) {
      const column = contents.get(header)!
      rowData.push(column[row])
    }
    data.push(rowData)
  }

  return data.map(row => row.map(csvEscape).join(',')).join('\n')
}

/** The contents and how to find them in the html */
const xpaths = {
  name: (index: number) =>
    `/html/body/main/div[1]/div[2]/div[4]/table/tbody/tr[${index}]/td[1]/div/figure/a/span`,
  geography: (index: number) =>
    `/html/body/main/div[1]/div[2]/div[4]/table/tbody/tr[${index}]/td[3]`,
  title: (index: number) =>
    `/html/body/main/div[1]/div[2]/div[4]/table/tbody/tr[${index}]/td[1]/div/div[2]/div[2]/span/div`,
  account: (index: number) =>
    `/html/body/main/div[1]/div[2]/div[4]/table/tbody/tr[${index}]/td[2]/div/div/div/a/div/div/div/span`,
}

/** Store the contents ready to put in a CSV. */
const data: Map<string, string[]> = new Map()
let index = 0

// put as much data as possible into the array map
while (true)
  try {
    index++ // 1-indexed for xpath's sake
    for (const [key, fullXpath] of Object.entries(xpaths)) {
      const xpathResult = document.evaluate(
        fullXpath(index),
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      )
      const element = assertNotNull(
        xpathResult.singleNodeValue,
        `Unable to find element for the ${index}th ${key} field.`
      )
      const content = assertNotNull(
        element.textContent,
        `No text found in the ${index}th ${key} field.`
      )
      data.set(key, [...(data.get(key) ?? []), content])
    }
  } catch (err) {
    break
  }

// download the array map as a csv
if (data.size)
  try {
    const csv = toCsv(data)
    download(`${index}_${Date.now()}.csv`, csv)
  } catch (err) {
    assert(err instanceof Error)
    alert(err.message)
  }
