/** Assert an expression is true. */
function assert(expression: unknown, message = 'Assertion Error'): asserts expression {
  if (!expression) throw new Error(message)
}

/** Assert an expression is true. */
function assertInstanceOf(
  expression: unknown,
  parent: any,
  message = 'Assertion Error'
): InstanceType<typeof parent> {
  assert(expression instanceof parent, message)
  return expression
}

/** Assert an expression is not null, and returns it. */
function assertNotNull<T>(expression: T, message?: string): NonNullable<T> {
  assert(expression != null, message)
  return expression
}

const getElementByXpath = (xpath: string) =>
  document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
    .singleNodeValue

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

/** Returns the data from the given xpaths on the current view. */
function getViewableList(xPaths: Paths) {
  const data = new Map<string, string[]>()
  let index = 0

  // put as much data as possible into the array map
  while (true)
    try {
      index++ // 1-indexed for xpath's sake
      for (const [key, fullXpath] of Object.entries(xPaths)) {
        let content = ''
        const element = getElementByXpath(fullXpath(index))
        if (element) {
          content = element.textContent ?? ''

          if (key === 'Link' && element instanceof HTMLAnchorElement) {
            content = element.href
          }
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

async function getData(xPaths: Paths, nextButtonGenerator: () => HTMLAnchorElement | void) {
  const data = new Map<string, string[]>()

  while (true) {
    // Fill up total list
    for (const [column, updatedRows] of getViewableList(xPaths)) {
      const originalRows = data.get(column) ?? []
      data.set(column, [...originalRows, ...updatedRows])
    }

    const nextButton = nextButtonGenerator()

    // we are done if the next button is not clickable
    if (!nextButton?.getAttribute('onclick')) break

    nextButton.click()

    // wait for next page to load
    await new Promise(resolve => setTimeout(resolve, 1000)) // TODO replace with event listener
  }

  return data
}

type Paths = Record<string, (index: number) => string>
/** Paths to important fields in user-generated linkedin lists. */
const userPaths = {
  Name: (index: number) =>
    `/html/body/main/div[1]/div[2]/div[4]/table/tbody/tr[${index}]/td[1]/div/figure/a/span`,
  Link: (index: number) =>
    `/html/body/main/div[1]/div[2]/div[4]/table/tbody/tr[${index}]/td[1]/div/figure/a`,
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
  Link: (index: number) =>
    `/html/body/main/div[1]/div[2]/div[5]/table/tbody/tr[${index}]/td[1]/div/div[2]/div[1]/div[1]/a`,
  Geography: (index: number) =>
    `/html/body/main/div[1]/div[2]/div[5]/table/tbody/tr[${index}]/td[3]`,
  Title: (index: number) =>
    `/html/body/main/div[1]/div[2]/div[5]/table/tbody/tr[${index}]/td[1]/div/div[2]/div[2]/span/div`,
  Account: (index: number) =>
    `/html/body/main/div[1]/div[2]/div[5]/table/tbody/tr[${index}]/td[2]/div/div/div/a/div/div/div/span`,
}

const nextButtonXpath = `/html/body/main/div[1]/div[2]/div[5]/div[2]/button[2]` // double check

try {
  // todo use intl date formatter
  const time = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  console.log('searching user-generated xpaths')
  let data = await getData(userPaths, () =>
    assertInstanceOf(getElementByXpath(nextButtonXpath), HTMLAnchorElement)
  )
  if (!data.size) {
    console.warn('Unable to find user generated paths')
    console.log('searching system-generated xpaths')
    data = await getData(systemPaths, () =>
      assertInstanceOf(getElementByXpath(nextButtonXpath), HTMLAnchorElement)
    )
  }

  assert(data.size, 'No data was found to export')
  download(`Contacts Exported on ${time}.csv`, toCsv(data))
} catch (err) {
  assert(err instanceof Error)
  alert(err.message)
}
