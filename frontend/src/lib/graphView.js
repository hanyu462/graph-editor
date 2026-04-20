export function getCoordinateXY(point, coordinateFrame) {
  if (coordinateFrame === 'wgs84') {
    return {
      x: point.lon,
      y: point.lat,
    }
  }

  return {
    x: point.x,
    y: point.y,
  }
}

export function getCoordinateLatLng(point, coordinateFrame) {
  const { x, y } = getCoordinateXY(point, coordinateFrame)
  return [y, x]
}

export function getNodeLatLng(node, coordinateFrame) {
  return getCoordinateLatLng(node, coordinateFrame)
}

export function buildEdges(graphData) {
  const nodeMap = new Map(graphData.nodes.map((node) => [node.id, node]))
  const edges = []
  const seen = new Set()

  for (const fromNode of graphData.nodes) {
    for (const toNodeId of fromNode.transitions) {
      const toNode = nodeMap.get(toNodeId)

      if (!toNode) {
        continue
      }

      const a = Math.min(fromNode.id, toNode.id)
      const b = Math.max(fromNode.id, toNode.id)
      const edgeKey = `${a}-${b}`

      if (seen.has(edgeKey)) {
        continue
      }

      seen.add(edgeKey)

      edges.push({
        key: edgeKey,
        fromNode,
        toNode,
      })
    }
  }

  return edges
}

function getBoundsFromPoints(points, coordinateFrame) {
  const coordinates = points.map((point) => getCoordinateXY(point, coordinateFrame))

  const xs = coordinates.map((coordinate) => coordinate.x)
  const ys = coordinates.map((coordinate) => coordinate.y)

  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  }
}

function chooseNiceStep(range) {
  if (!Number.isFinite(range) || range <= 0) {
    return 1
  }

  const roughStep = range / 8
  const exponent = Math.floor(Math.log10(roughStep))
  const magnitude = 10 ** exponent
  const normalized = roughStep / magnitude

  if (normalized <= 1) {
    return 1 * magnitude
  }

  if (normalized <= 2) {
    return 2 * magnitude
  }

  if (normalized <= 5) {
    return 5 * magnitude
  }

  return 10 * magnitude
}

function roundDown(value, step) {
  return Math.floor(value / step) * step
}

function roundUp(value, step) {
  return Math.ceil(value / step) * step
}

export function buildGridLines(points, coordinateFrame) {
  if (!points || points.length === 0) {
    return {
      verticalLines: [],
      horizontalLines: [],
      xLabels: [],
      yLabels: [],
    }
  }

  const bounds = getBoundsFromPoints(points, coordinateFrame)
  const width = Math.max(bounds.maxX - bounds.minX, 1e-9)
  const height = Math.max(bounds.maxY - bounds.minY, 1e-9)

  const isWgs84 = coordinateFrame === 'wgs84'

  const step = chooseNiceStep(Math.max(width, height))
  const stepX = isWgs84 ? chooseNiceStep(width) : step
  const stepY = isWgs84 ? chooseNiceStep(height) : step

  const paddingSteps = 2

  const startX = roundDown(bounds.minX, stepX) - paddingSteps * stepX
  const endX = roundUp(bounds.maxX, stepX) + paddingSteps * stepX
  const startY = roundDown(bounds.minY, stepY) - paddingSteps * stepY
  const endY = roundUp(bounds.maxY, stepY) + paddingSteps * stepY

  const verticalLines = []
  const horizontalLines = []
  const xLabels = []
  const yLabels = []

  for (let x = startX; x <= endX + stepX * 0.5; x += stepX) {
    verticalLines.push({
      key: `vx-${x}`,
      positions: [
        [startY, x],
        [endY, x],
      ],
      value: x,
    })

    xLabels.push({
      key: `xl-${x}`,
      position: [startY, x],
      value: x,
    })
  }

  for (let y = startY; y <= endY + stepY * 0.5; y += stepY) {
    horizontalLines.push({
      key: `hy-${y}`,
      positions: [
        [y, startX],
        [y, endX],
      ],
      value: y,
    })

    yLabels.push({
      key: `yl-${y}`,
      position: [y, startX],
      value: y,
    })
  }

  return {
    verticalLines,
    horizontalLines,
    xLabels,
    yLabels,
  }
}