function haversineDistanceMeters(lat1, lon1, lat2, lon2) {
  const earthRadiusMeters = 6_371_000
  const toRadians = (degrees) => (degrees * Math.PI) / 180

  const deltaLat = toRadians(lat2 - lat1)
  const deltaLon = toRadians(lon2 - lon1)
  const lat1Radians = toRadians(lat1)
  const lat2Radians = toRadians(lat2)

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1Radians) *
      Math.cos(lat2Radians) *
      Math.sin(deltaLon / 2) ** 2

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return earthRadiusMeters * c
}

function getPointDistanceMeters(pointA, pointB, coordinateFrame) {
  if (coordinateFrame === 'wgs84') {
    return haversineDistanceMeters(
      pointA.lat,
      pointA.lon,
      pointB.lat,
      pointB.lon,
    )
  }

  const deltaX = pointB.x - pointA.x
  const deltaY = pointB.y - pointA.y
  return Math.hypot(deltaX, deltaY)
}

function interpolatePoint(pointA, pointB, ratio, coordinateFrame) {
  if (coordinateFrame === 'wgs84') {
    return {
      lat: pointA.lat + (pointB.lat - pointA.lat) * ratio,
      lon: pointA.lon + (pointB.lon - pointA.lon) * ratio,
    }
  }

  return {
    x: pointA.x + (pointB.x - pointA.x) * ratio,
    y: pointA.y + (pointB.y - pointA.y) * ratio,
  }
}

export function buildCsvIndexRange(startIndex, endIndex) {
  const minIndex = Math.min(startIndex, endIndex)
  const maxIndex = Math.max(startIndex, endIndex)
  const indices = []

  for (let index = minIndex; index <= maxIndex; index += 1) {
    indices.push(index)
  }

  return indices
}

export function deleteCsvPointsByIndices(points, selectedIndices) {
  const selectedIndexSet = new Set(selectedIndices)

  return points.filter((_, index) => !selectedIndexSet.has(index))
}

function smoothIndoorPoint(previousPoint, nextPoint) {
  return {
    x: (previousPoint.x + nextPoint.x) / 2,
    y: (previousPoint.y + nextPoint.y) / 2,
  }
}

function smoothWgs84Point(previousPoint, nextPoint) {
  return {
    lat: (previousPoint.lat + nextPoint.lat) / 2,
    lon: (previousPoint.lon + nextPoint.lon) / 2,
  }
}

export function smoothCsvPointsByIndices(
  points,
  orderedSelectedIndices,
  coordinateFrame,
) {
  if (orderedSelectedIndices.length < 3) {
    return {
      ok: false,
      message: 'Filter needs at least 3 selected CSV points.',
    }
  }

  const selectedIndexSet = new Set(orderedSelectedIndices)
  const firstIndex = orderedSelectedIndices[0]
  const lastIndex =
    orderedSelectedIndices[orderedSelectedIndices.length - 1]

  const nextPoints = points.map((point, index) => {
    if (!selectedIndexSet.has(index)) {
      return point
    }

    if (index === firstIndex || index === lastIndex) {
      return point
    }

    const previousPoint = points[index - 1]
    const nextPoint = points[index + 1]

    if (!previousPoint || !nextPoint) {
      return point
    }

    if (coordinateFrame === 'wgs84') {
      const smoothed = smoothWgs84Point(previousPoint, nextPoint)
      return {
        ...point,
        lat: smoothed.lat,
        lon: smoothed.lon,
      }
    }

    const smoothed = smoothIndoorPoint(previousPoint, nextPoint)
    return {
      ...point,
      x: smoothed.x,
      y: smoothed.y,
    }
  })

  return {
    ok: true,
    points: nextPoints,
    message: `Filtered ${orderedSelectedIndices.length} selected CSV points.`,
  }
}

export function resampleCsvPointsBySpacing(
  points,
  orderedSelectedIndices,
  coordinateFrame,
  targetSpacingMeters,
) {
  if (orderedSelectedIndices.length < 2) {
    return {
      ok: false,
      message: 'Sampling needs at least 2 selected CSV points.',
    }
  }

  if (!Number.isFinite(targetSpacingMeters) || targetSpacingMeters <= 0) {
    return {
      ok: false,
      message: 'spacing_m must be a positive number.',
    }
  }

  const selectedPoints = orderedSelectedIndices
    .map((index) => points[index])
    .filter(Boolean)

  if (selectedPoints.length < 2) {
    return {
      ok: false,
      message: 'Sampling needs a valid continuous CSV point range.',
    }
  }

  const cumulativeDistances = [0]

  for (let index = 1; index < selectedPoints.length; index += 1) {
    const segmentDistanceMeters = getPointDistanceMeters(
      selectedPoints[index - 1],
      selectedPoints[index],
      coordinateFrame,
    )

    cumulativeDistances.push(
      cumulativeDistances[cumulativeDistances.length - 1] + segmentDistanceMeters,
    )
  }

  const totalLengthMeters = cumulativeDistances[cumulativeDistances.length - 1]

  if (totalLengthMeters <= 0) {
    return {
      ok: false,
      message: 'Selected CSV path length must be greater than 0.',
    }
  }

  const segmentCount = Math.max(
    1,
    Math.round(totalLengthMeters / targetSpacingMeters),
  )
  const actualSpacingMeters = totalLengthMeters / segmentCount
  const sampledPoints = []

  let segmentIndex = 0

  for (let sampleIndex = 0; sampleIndex <= segmentCount; sampleIndex += 1) {
    const targetDistanceMeters =
      sampleIndex === segmentCount
        ? totalLengthMeters
        : actualSpacingMeters * sampleIndex

    while (
      segmentIndex < cumulativeDistances.length - 2 &&
      cumulativeDistances[segmentIndex + 1] < targetDistanceMeters
    ) {
      segmentIndex += 1
    }

    const segmentStartDistance = cumulativeDistances[segmentIndex]
    const segmentEndDistance = cumulativeDistances[segmentIndex + 1]
    const segmentLength = segmentEndDistance - segmentStartDistance

    if (segmentLength <= 0) {
      sampledPoints.push(selectedPoints[segmentIndex])
      continue
    }

    const ratio =
      (targetDistanceMeters - segmentStartDistance) / segmentLength

    const interpolatedPoint = interpolatePoint(
      selectedPoints[segmentIndex],
      selectedPoints[segmentIndex + 1],
      ratio,
      coordinateFrame,
    )

    sampledPoints.push(interpolatedPoint)
  }

  return {
    ok: true,
    sampledPoints,
    segmentCount,
    actualSpacingMeters,
    totalLengthMeters,
    message: `Sampled CSV path into ${sampledPoints.length} JSON nodes. Actual spacing: ${actualSpacingMeters.toFixed(3)} m.`,
  }
}

export function buildJsonNodeChainFromSampledPoints(graph, sampledPoints) {
  const existingIds = graph.nodes.map((node) => node.id)
  const nextNodeIdStart =
    existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1

  const newNodes = sampledPoints.map((point, index) => {
    const nodeId = nextNodeIdStart + index

    if (graph.coordinateFrame === 'wgs84') {
      return {
        id: nodeId,
        lat: point.lat,
        lon: point.lon,
        transitions: [],
      }
    }

    return {
      id: nodeId,
      x: point.x,
      y: point.y,
      transitions: [],
    }
  })

  const chainedNodes = newNodes.map((node, index) => {
    const transitions = []

    if (index > 0) {
      transitions.push(newNodes[index - 1].id)
    }

    if (index < newNodes.length - 1) {
      transitions.push(newNodes[index + 1].id)
    }

    return {
      ...node,
      transitions,
    }
  })

  return {
    newNodes: chainedNodes,
    newNodeIds: chainedNodes.map((node) => node.id),
  }
}