function pad2(value) {
  return String(value).padStart(2, '0')
}

function formatTimestampForFile(date = new Date()) {
  const year = date.getFullYear()
  const month = pad2(date.getMonth() + 1)
  const day = pad2(date.getDate())
  const hour = pad2(date.getHours())
  const minute = pad2(date.getMinutes())
  const second = pad2(date.getSeconds())

  return `${year}${month}${day}_${hour}${minute}${second}`
}

function removeJsonExtension(fileName) {
  if (!fileName) {
    return 'graph'
  }

  return fileName.replace(/\.json$/i, '')
}

export function buildUpdatedGraphFileName(graphFileName) {
  const baseName = removeJsonExtension(graphFileName)
  const timestamp = formatTimestampForFile()
  return `${baseName}_updated_${timestamp}.json`
}

export function serializeGraphToJsonObject(graph) {
  if (!graph) {
    return null
  }

  return {
    version: graph.version ?? graph.raw?.version ?? 1,
    graph_id: graph.graphId,
    coordinate_frame: graph.coordinateFrame,
    nodes: graph.nodes.map((node) => {
      const serializedNode = {
        id: node.id,
        transitions: Array.isArray(node.transitions)
          ? [...node.transitions]
          : [],
      }

      if (graph.coordinateFrame === 'wgs84') {
        serializedNode.lat = node.lat
        serializedNode.lon = node.lon
        return serializedNode
      }

      serializedNode.x = node.x
      serializedNode.y = node.y
      return serializedNode
    }),
    places: Array.isArray(graph.places)
      ? graph.places.map((place) => ({
          id: place.id,
          node_id: place.nodeId,
        }))
      : [],
  }
}

export function downloadGraphJson({ graph, graphFileName }) {
  const jsonObject = serializeGraphToJsonObject(graph)

  if (!jsonObject) {
    throw new Error('No graph data available to save.')
  }

  const downloadFileName = buildUpdatedGraphFileName(graphFileName)
  const jsonText = `${JSON.stringify(jsonObject, null, 2)}\n`
  const blob = new Blob([jsonText], { type: 'application/json' })
  const objectUrl = URL.createObjectURL(blob)

  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = downloadFileName
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)

  URL.revokeObjectURL(objectUrl)

  return downloadFileName
}