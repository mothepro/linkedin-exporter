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
  // maybe we shouldn't remove the element immediately
  // document.body.removeChild(element)
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

/** Find the data from the given xpaths and return as an array map. */
function getData(xPaths: Record<string, (index: number) => string>) {
  const data: Map<string, string[]> = new Map()
  let index = 0

  // put as much data as possible into the array map
  while (true)
    try {
      index++ // 1-indexed for xpath's sake
      for (const [key, fullXpath] of Object.entries(xPaths)) {
        const xpathResult = document.evaluate(
          fullXpath(index),
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        )
        let content = ''
        try {
          const element = assertNotNull(
            xpathResult.singleNodeValue,
            `Unable to find element for the ${index}th ${key} field.`
          )
          content = assertNotNull(
            element.textContent,
            `No text found in the ${index}th ${key} field.`
          )
        } catch (err) {
          assert(err instanceof Error)
          // `Account` is actually an optional field.
          // Rethrow the error if it's a required key.
          assert(key === 'Account', err.message)
        }
        data.set(key, [...(data.get(key) ?? []), content])
      }
    } catch (err) {
      console.error(err)
      break
    }

  // Return the number of rows?? `index - 1`
  return data
}

/** Paths to important fields in user-generated linkedin lists. */
const userPaths = {
  Name: (index: number) =>
    `/html/body/main/div[1]/div[2]/div[4]/table/tbody/tr[${index}]/td[1]/div/figure/a/span`,
  Geography: (index: number) =>
    `/html/body/main/div[1]/div[2]/div[4]/table/tbody/tr[${index}]/td[3]`,
  Title: (index: number) =>
    `/html/body/main/div[1]/div[2]/div[4]/table/tbody/tr[${index}]/td[1]/div/div[2]/div[2]/span/div`,
  Account: (index: number) =>
    `/html/body/main/div[1]/div[2]/div[4]/table/tbody/tr[${index}]/td[2]/div/div/div/a/div/div/div/span`,
}

/** Paths to important fields in user-generated linkedin lists. */
const systemPaths = {
  Name: (index: number) =>
    `/html/body/main/div[1]/div[2]/div[5]/table/tbody/tr[${index}]/td[1]/div/div[2]/div[1]/div[1]/a`,
  Geography: (index: number) =>
    `/html/body/main/div[1]/div[2]/div[5]/table/tbody/tr[${index}]/td[3]`,
  Title: (index: number) =>
    `/html/body/main/div[1]/div[2]/div[5]/table/tbody/tr[${index}]/td[1]/div/div[2]/div[2]/span/div`,
  Account: (index: number) =>
    `/html/body/main/div[1]/div[2]/div[5]/table/tbody/tr[${index}]/td[2]/div/div/div/a/div/div/div/span`,
}

try {
  // todo use intl date formatter
  const time = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })


  console.log('searching user-generated xpaths')
  let data = getData(userPaths)
  if (!data.size) {
    console.warn('Unable to find user generated paths')
    console.log('searching system-generated xpaths')
    data = getData(systemPaths)
  }

  assert(data.size, 'No data was found to export')
  download(`Contacts Exported on ${time}.csv`, toCsv(data))
} catch (err) {
  assert(err instanceof Error)
  alert(err.message)
}
