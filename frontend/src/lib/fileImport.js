export function detectFileType(fileName) {
  const lowerName = fileName.toLowerCase()

  if (lowerName.endsWith('.json')) {
    return 'json'
  }

  if (lowerName.endsWith('.csv')) {
    return 'csv'
  }

  return 'unknown'
}

function parseJsonText(text, fileName) {
  try {
    return JSON.parse(text)
  } catch {
    throw new Error(`Invalid JSON file: ${fileName}`)
  }
}

function parseCsvText(text) {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '')
}

export async function importFile(file) {
  const fileType = detectFileType(file.name)

  if (fileType === 'unknown') {
    throw new Error(`Unsupported file type: ${file.name}`)
  }

  const text = await file.text()

  if (fileType === 'json') {
    const parsedData = parseJsonText(text, file.name)

    return {
      fileName: file.name,
      fileType,
      text,
      parsedData,
    }
  }

  if (fileType === 'csv') {
    const parsedLines = parseCsvText(text)

    return {
      fileName: file.name,
      fileType,
      text,
      parsedLines,
    }
  }

  throw new Error(`Unsupported file type: ${file.name}`)
}