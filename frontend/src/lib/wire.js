export function getMetersPerDegreeLon(latitudeDeg) {
  return 111_320 * Math.cos((latitudeDeg * Math.PI) / 180)
}

export function projectNodeToMeters(node, coordinateFrame, referenceLat) {
  if (coordinateFrame === 'wgs84') {
    const metersPerDegreeLon = getMetersPerDegreeLon(referenceLat)
    const metersPerDegreeLat = 111_320

    return {
      x: node.lon * metersPerDegreeLon,
      y: node.lat * metersPerDegreeLat,
    }
  }

  return {
    x: node.x,
    y: node.y,
  }
}

export function projectLatLngToMeters(latlng, coordinateFrame, referenceLat) {
  if (coordinateFrame === 'wgs84') {
    const metersPerDegreeLon = getMetersPerDegreeLon(referenceLat)
    const metersPerDegreeLat = 111_320

    return {
      x: latlng.lng * metersPerDegreeLon,
      y: latlng.lat * metersPerDegreeLat,
    }
  }

  return {
    x: latlng.lng,
    y: latlng.lat,
  }
}

export function unprojectMetersToGraphPoint(point, coordinateFrame, referenceLat) {
  if (coordinateFrame === 'wgs84') {
    const metersPerDegreeLon = getMetersPerDegreeLon(referenceLat)
    const metersPerDegreeLat = 111_320

    return {
      lat: point.y / metersPerDegreeLat,
      lon: point.x / metersPerDegreeLon,
    }
  }

  return {
    x: point.x,
    y: point.y,
  }
}

export function unprojectMetersToLatLng(point, coordinateFrame, referenceLat) {
  if (coordinateFrame === 'wgs84') {
    const metersPerDegreeLon = getMetersPerDegreeLon(referenceLat)
    const metersPerDegreeLat = 111_320

    return [
      point.y / metersPerDegreeLat,
      point.x / metersPerDegreeLon,
    ]
  }

  return [point.y, point.x]
}

export function interpolateQuadraticBezier(p0, p1, p2, t) {
  const u = 1 - t

  return {
    x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
    y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
  }
}

export function buildCurveSamples(p0, p1, p2, sampleCount = 200) {
  const points = []
  const cumulativeDistances = [0]

  let totalLength = 0
  let previousPoint = interpolateQuadraticBezier(p0, p1, p2, 0)

  points.push(previousPoint)

  for (let index = 1; index <= sampleCount; index += 1) {
    const t = index / sampleCount
    const nextPoint = interpolateQuadraticBezier(p0, p1, p2, t)
    const segmentLength = Math.hypot(
      nextPoint.x - previousPoint.x,
      nextPoint.y - previousPoint.y,
    )

    totalLength += segmentLength
    cumulativeDistances.push(totalLength)
    points.push(nextPoint)
    previousPoint = nextPoint
  }

  return {
    points,
    cumulativeDistances,
    totalLength,
  }
}

export function getPointAtDistance(points, cumulativeDistances, targetDistance) {
  for (let index = 1; index < cumulativeDistances.length; index += 1) {
    const previousDistance = cumulativeDistances[index - 1]
    const nextDistance = cumulativeDistances[index]

    if (targetDistance <= nextDistance) {
      const previousPoint = points[index - 1]
      const nextPoint = points[index]
      const segmentLength = nextDistance - previousDistance

      if (segmentLength <= 0) {
        return previousPoint
      }

      const ratio = (targetDistance - previousDistance) / segmentLength

      return {
        x: previousPoint.x + (nextPoint.x - previousPoint.x) * ratio,
        y: previousPoint.y + (nextPoint.y - previousPoint.y) * ratio,
      }
    }
  }

  return points[points.length - 1]
}

function getReferenceLatitude(sourceNode, targetNode, controlPointLatLng, coordinateFrame) {
  if (coordinateFrame !== 'wgs84') {
    return 0
  }

  if (controlPointLatLng) {
    return (sourceNode.lat + targetNode.lat + controlPointLatLng.lat) / 3
  }

  return (sourceNode.lat + targetNode.lat) / 2
}

export function buildWirePreviewPositions({
  sourceNode,
  targetNode,
  controlPointLatLng,
  coordinateFrame,
  sampleCount = 40,
}) {
  if (!sourceNode || !targetNode) {
    return []
  }

  if (!controlPointLatLng) {
    if (coordinateFrame === 'wgs84') {
      return [
        [sourceNode.lat, sourceNode.lon],
        [targetNode.lat, targetNode.lon],
      ]
    }

    return [
      [sourceNode.y, sourceNode.x],
      [targetNode.y, targetNode.x],
    ]
  }

  const referenceLat = getReferenceLatitude(
    sourceNode,
    targetNode,
    controlPointLatLng,
    coordinateFrame,
  )

  const sourcePoint = projectNodeToMeters(sourceNode, coordinateFrame, referenceLat)
  const targetPoint = projectNodeToMeters(targetNode, coordinateFrame, referenceLat)
  const controlPoint = projectLatLngToMeters(
    controlPointLatLng,
    coordinateFrame,
    referenceLat,
  )

  const positions = []

  for (let index = 0; index <= sampleCount; index += 1) {
    const t = index / sampleCount
    const point = interpolateQuadraticBezier(
      sourcePoint,
      controlPoint,
      targetPoint,
      t,
    )

    positions.push(
      unprojectMetersToLatLng(point, coordinateFrame, referenceLat),
    )
  }

  return positions
}

export function buildIntermediateWireNodes({
  sourceNode,
  targetNode,
  controlPointLatLng,
  coordinateFrame,
  targetSpacingMeters,
  nextNodeIdStart,
}) {
  const referenceLat = getReferenceLatitude(
    sourceNode,
    targetNode,
    controlPointLatLng,
    coordinateFrame,
  )

  const sourcePoint = projectNodeToMeters(sourceNode, coordinateFrame, referenceLat)
  const targetPoint = projectNodeToMeters(targetNode, coordinateFrame, referenceLat)

  let totalLengthMeters = 0
  let newNodes = []

  if (controlPointLatLng) {
    const controlPoint = projectLatLngToMeters(
      controlPointLatLng,
      coordinateFrame,
      referenceLat,
    )

    const { points, cumulativeDistances, totalLength } = buildCurveSamples(
      sourcePoint,
      controlPoint,
      targetPoint,
    )

    totalLengthMeters = totalLength

    const segmentCount = Math.max(
      1,
      Math.round(totalLengthMeters / targetSpacingMeters),
    )
    const actualSpacingMeters = totalLengthMeters / segmentCount
    const insertedNodeCount = Math.max(0, segmentCount - 1)

    if (insertedNodeCount === 0) {
      return {
        status: 'too_short',
        totalLengthMeters,
        actualSpacingMeters,
        insertedNodeCount,
        newNodes: [],
      }
    }

    let nextNodeId = nextNodeIdStart

    for (let segmentIndex = 1; segmentIndex < segmentCount; segmentIndex += 1) {
      const targetDistance = actualSpacingMeters * segmentIndex
      const pointOnCurve = getPointAtDistance(
        points,
        cumulativeDistances,
        targetDistance,
      )
      const graphPoint = unprojectMetersToGraphPoint(
        pointOnCurve,
        coordinateFrame,
        referenceLat,
      )

      if (coordinateFrame === 'wgs84') {
        newNodes.push({
          id: nextNodeId,
          lat: graphPoint.lat,
          lon: graphPoint.lon,
          transitions: [],
        })
      } else {
        newNodes.push({
          id: nextNodeId,
          x: graphPoint.x,
          y: graphPoint.y,
          transitions: [],
        })
      }

      nextNodeId += 1
    }

    return {
      status: 'ok',
      totalLengthMeters,
      actualSpacingMeters,
      insertedNodeCount,
      newNodes,
    }
  }

  totalLengthMeters = Math.hypot(
    targetPoint.x - sourcePoint.x,
    targetPoint.y - sourcePoint.y,
  )

  const segmentCount = Math.max(
    1,
    Math.round(totalLengthMeters / targetSpacingMeters),
  )
  const actualSpacingMeters = totalLengthMeters / segmentCount
  const insertedNodeCount = Math.max(0, segmentCount - 1)

  if (insertedNodeCount === 0) {
    return {
      status: 'too_short',
      totalLengthMeters,
      actualSpacingMeters,
      insertedNodeCount,
      newNodes: [],
    }
  }

  let nextNodeId = nextNodeIdStart

  for (let segmentIndex = 1; segmentIndex < segmentCount; segmentIndex += 1) {
    const t = segmentIndex / segmentCount
    const point = {
      x: sourcePoint.x + (targetPoint.x - sourcePoint.x) * t,
      y: sourcePoint.y + (targetPoint.y - sourcePoint.y) * t,
    }
    const graphPoint = unprojectMetersToGraphPoint(
      point,
      coordinateFrame,
      referenceLat,
    )

    if (coordinateFrame === 'wgs84') {
      newNodes.push({
        id: nextNodeId,
        lat: graphPoint.lat,
        lon: graphPoint.lon,
        transitions: [],
      })
    } else {
      newNodes.push({
        id: nextNodeId,
        x: graphPoint.x,
        y: graphPoint.y,
        transitions: [],
      })
    }

    nextNodeId += 1
  }

  return {
    status: 'ok',
    totalLengthMeters,
    actualSpacingMeters,
    insertedNodeCount,
    newNodes,
  }
}