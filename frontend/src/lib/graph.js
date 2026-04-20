export function normalizeGraph(rawData) {
  if (!rawData || typeof rawData !== 'object') {
    throw new Error('JSON root must be an object.')
  }

  if (typeof rawData.graph_id !== 'string' || rawData.graph_id.trim() === '') {
    throw new Error('graph_id is required.')
  }

  if (
    typeof rawData.coordinate_frame !== 'string' ||
    rawData.coordinate_frame.trim() === ''
  ) {
    throw new Error('coordinate_frame is required.')
  }

  if (!Array.isArray(rawData.nodes)) {
    throw new Error('nodes must be an array.')
  }

  const nodes = rawData.nodes.map((node, index) => {
    if (!node || typeof node !== 'object') {
      throw new Error(`nodes[${index}] must be an object.`)
    }

    if (!Number.isInteger(node.id)) {
      throw new Error(`nodes[${index}].id must be an integer.`)
    }

    if (!Array.isArray(node.transitions)) {
      throw new Error(`nodes[${index}].transitions must be an array.`)
    }

    return node
  })

  const places = Array.isArray(rawData.places)
    ? rawData.places.map((place, index) => {
        if (!place || typeof place !== 'object') {
          throw new Error(`places[${index}] must be an object.`)
        }

        if (typeof place.id !== 'string' || place.id.trim() === '') {
          throw new Error(`places[${index}].id must be a non-empty string.`)
        }

        if (!Number.isInteger(place.node_id)) {
          throw new Error(`places[${index}].node_id must be an integer.`)
        }

        return {
          id: place.id,
          nodeId: place.node_id,
        }
      })
    : []

  return {
    graphId: rawData.graph_id,
    coordinateFrame: rawData.coordinate_frame,
    nodes,
    places,
    raw: rawData,
  }
}