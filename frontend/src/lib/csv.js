function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function normalizeHeader(header) {
  return header.replace(/^\uFEFF/, '').trim().toLowerCase()
}

function parseCsvLine(line) {
  const cells = []
  let current = ''
  let inQuotes = false

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]

    if (char === '"') {
      const nextChar = line[index + 1]

      if (inQuotes && nextChar === '"') {
        current += '"'
        index += 1
      } else {
        inQuotes = !inQuotes
      }

      continue
    }

    if (char === ',' && !inQuotes) {
      cells.push(current)
      current = ''
      continue
    }

    current += char
  }

  cells.push(current)
  return cells.map((cell) => cell.trim())
}

function parseCsvRows(text) {
  const normalizedText = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim()

  assert(normalizedText !== '', 'CSV is empty.')

  const lines = normalizedText
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '')

  assert(lines.length >= 2, 'CSV must include a header and at least one data row.')

  const headers = parseCsvLine(lines[0]).map(normalizeHeader)

  return lines.slice(1).map((line, rowIndex) => {
    const cells = parseCsvLine(line)
    const row = { __rowIndex: rowIndex + 2 }

    headers.forEach((header, headerIndex) => {
      row[header] = cells[headerIndex]?.trim() ?? ''
    })

    return row
  })
}

function firstFiniteNumber(row, columnNames) {
  for (const columnName of columnNames) {
    const rawValue = row[columnName]

    if (rawValue === undefined || rawValue === '') {
      continue
    }

    const value = Number(rawValue)

    if (Number.isFinite(value)) {
      return value
    }
  }

  return null
}

export function parseCsvOverlay(text, coordinateFrame) {
  const rows = parseCsvRows(text)
  const points = []

  if (coordinateFrame === 'wgs84') {
    for (const row of rows) {
      const lat = firstFiniteNumber(row, ['gnss_lat', 'lat', 'latitude'])
      const lon = firstFiniteNumber(row, ['gnss_lon', 'lon', 'lng', 'longitude'])

      if (lat === null || lon === null) {
        continue
      }

      points.push({
        id: `csv-${row.__rowIndex}`,
        lat,
        lon,
      })
    }

    assert(
      points.length > 0,
      'No usable GNSS columns found in CSV. Expected gnss_lat/gnss_lon or lat/lon.',
    )

    return points
  }

  for (const row of rows) {
    const x = firstFiniteNumber(row, ['uwb_x', 'x'])
    const y = firstFiniteNumber(row, ['uwb_y', 'y'])

    if (x === null || y === null) {
      continue
    }

    points.push({
      id: `csv-${row.__rowIndex}`,
      x,
      y,
    })
  }

  assert(
    points.length > 0,
    'No usable local columns found in CSV. Expected uwb_x/uwb_y or x/y.',
  )

  return points
}