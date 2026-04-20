import { buildIntermediateWireNodes } from './wire'

function appendUnique(values, valueToAdd) {
  if (values.includes(valueToAdd)) {
    return values
  }

  return [...values, valueToAdd]
}

export function getNextNodeId(nodes) {
  if (!nodes || nodes.length === 0) {
    return 1
  }

  return Math.max(...nodes.map((node) => node.id)) + 1
}

export function createNodeAtLatLng(graph, latlng) {
  const nextNodeId = getNextNodeId(graph.nodes)

  if (graph.coordinateFrame === 'wgs84') {
    return {
      id: nextNodeId,
      lat: latlng.lat,
      lon: latlng.lng,
      transitions: [],
    }
  }

  return {
    id: nextNodeId,
    x: latlng.lng,
    y: latlng.lat,
    transitions: [],
  }
}

export function addNodeToGraph(graph, latlng) {
  const newNode = createNodeAtLatLng(graph, latlng)

  return {
    graph: {
      ...graph,
      nodes: [...graph.nodes, newNode],
    },
    newNode,
  }
}

export function deleteNodeFromGraph(graph, deleteNodeId) {
  const nextNodes = graph.nodes
    .filter((node) => node.id !== deleteNodeId)
    .map((node) => ({
      ...node,
      transitions: node.transitions.filter((id) => id !== deleteNodeId),
    }))

  return {
    ...graph,
    nodes: nextNodes,
  }
}

export function connectNodesInGraph(graph, sourceNodeId, targetNodeId) {
  if (sourceNodeId === targetNodeId) {
    return {
      ok: false,
      message: 'Cannot connect a node to itself.',
    }
  }

  const sourceNode = graph.nodes.find((node) => node.id === sourceNodeId)
  const targetNode = graph.nodes.find((node) => node.id === targetNodeId)

  if (!sourceNode || !targetNode) {
    return {
      ok: false,
      message: 'Source or target node was not found.',
    }
  }

  if (sourceNode.transitions.includes(targetNodeId)) {
    return {
      ok: false,
      message: `Node ${sourceNodeId} and node ${targetNodeId} are already connected.`,
    }
  }

  const nextGraph = {
    ...graph,
    nodes: graph.nodes.map((node) => {
      if (node.id === sourceNodeId) {
        return {
          ...node,
          transitions: [...node.transitions, targetNodeId],
        }
      }

      if (node.id === targetNodeId) {
        return {
          ...node,
          transitions: [...node.transitions, sourceNodeId],
        }
      }

      return node
    }),
  }

  return {
    ok: true,
    graph: nextGraph,
    message: `Connected node ${sourceNodeId} and node ${targetNodeId}.`,
  }
}

export function disconnectNodesInGraph(graph, sourceNodeId, targetNodeId) {
  if (sourceNodeId === targetNodeId) {
    return {
      ok: false,
      message: 'Cannot disconnect a node from itself.',
    }
  }

  const sourceNode = graph.nodes.find((node) => node.id === sourceNodeId)
  const targetNode = graph.nodes.find((node) => node.id === targetNodeId)

  if (!sourceNode || !targetNode) {
    return {
      ok: false,
      message: 'Source or target node was not found.',
    }
  }

  if (!sourceNode.transitions.includes(targetNodeId)) {
    return {
      ok: false,
      message: `Node ${sourceNodeId} is not connected to node ${targetNodeId}.`,
    }
  }

  const nextGraph = {
    ...graph,
    nodes: graph.nodes.map((node) => {
      if (node.id === sourceNodeId) {
        return {
          ...node,
          transitions: node.transitions.filter((id) => id !== targetNodeId),
        }
      }

      if (node.id === targetNodeId) {
        return {
          ...node,
          transitions: node.transitions.filter((id) => id !== sourceNodeId),
        }
      }

      return node
    }),
  }

  return {
    ok: true,
    graph: nextGraph,
    message: `Disconnected node ${sourceNodeId} and node ${targetNodeId}.`,
  }
}

export function applyWireToGraph({
  graph,
  sourceNodeId,
  targetNodeId,
  controlPointLatLng,
  targetSpacingMeters,
}) {
  if (sourceNodeId === targetNodeId) {
    return {
      ok: false,
      message: 'Cannot wire a node to itself.',
    }
  }

  const sourceNode = graph.nodes.find((node) => node.id === sourceNodeId)
  const targetNode = graph.nodes.find((node) => node.id === targetNodeId)

  if (!sourceNode || !targetNode) {
    return {
      ok: false,
      message: 'Source or target node was not found.',
    }
  }

  const nextNodeIdStart = getNextNodeId(graph.nodes)

  const result = buildIntermediateWireNodes({
    sourceNode,
    targetNode,
    controlPointLatLng,
    coordinateFrame: graph.coordinateFrame,
    targetSpacingMeters,
    nextNodeIdStart,
  })

  if (result.status === 'too_short') {
    return {
      ok: false,
      message: `Wire length ${result.totalLengthMeters.toFixed(3)} m is too short for wire spacing ${targetSpacingMeters.toFixed(3)} m.`,
    }
  }

  const chainIds = [
    sourceNodeId,
    ...result.newNodes.map((node) => node.id),
    targetNodeId,
  ]

  const updatedExistingNodes = graph.nodes.map((node) => {
    if (node.id === sourceNodeId) {
      let transitions = node.transitions.filter((id) => id !== targetNodeId)
      transitions = appendUnique(transitions, chainIds[1])

      return {
        ...node,
        transitions,
      }
    }

    if (node.id === targetNodeId) {
      let transitions = node.transitions.filter((id) => id !== sourceNodeId)
      transitions = appendUnique(
        transitions,
        chainIds[chainIds.length - 2],
      )

      return {
        ...node,
        transitions,
      }
    }

    return node
  })

  const wiredNodes = result.newNodes.map((node, index) => {
    const previousNodeId = chainIds[index]
    const nextNodeIdInChain = chainIds[index + 2]

    return {
      ...node,
      transitions: [previousNodeId, nextNodeIdInChain],
    }
  })

  return {
    ok: true,
    graph: {
      ...graph,
      nodes: [...updatedExistingNodes, ...wiredNodes],
    },
    insertedNodeCount: result.insertedNodeCount,
    actualSpacingMeters: result.actualSpacingMeters,
    message: `Wire applied with ${result.insertedNodeCount} new nodes. Actual spacing: ${result.actualSpacingMeters.toFixed(3)} m.`,
  }
}

export function appendUniqueIds(existingIds, idsToAdd) {
  const nextIds = new Set(existingIds)

  idsToAdd.forEach((id) => {
    nextIds.add(id)
  })

  return [...nextIds]
}

export function buildNodeMap(graph) {
  return new Map(graph.nodes.map((node) => [node.id, node]))
}

export function findShortestNodePath(graph, startNodeId, endNodeId) {
  if (startNodeId === endNodeId) {
    return [startNodeId]
  }

  const nodeMap = buildNodeMap(graph)

  if (!nodeMap.has(startNodeId) || !nodeMap.has(endNodeId)) {
    return null
  }

  const queue = [startNodeId]
  const visited = new Set([startNodeId])
  const previousNodeIds = new Map()

  while (queue.length > 0) {
    const currentNodeId = queue.shift()
    const currentNode = nodeMap.get(currentNodeId)

    for (const nextNodeId of currentNode.transitions) {
      if (visited.has(nextNodeId)) {
        continue
      }

      visited.add(nextNodeId)
      previousNodeIds.set(nextNodeId, currentNodeId)

      if (nextNodeId === endNodeId) {
        const path = [endNodeId]
        let cursor = endNodeId

        while (previousNodeIds.has(cursor)) {
          cursor = previousNodeIds.get(cursor)
          path.push(cursor)
        }

        path.reverse()
        return path
      }

      queue.push(nextNodeId)
    }
  }

  return null
}

export function deleteNodesFromGraph(graph, deleteNodeIds) {
  const deleteNodeIdSet = new Set(deleteNodeIds)

  const nextNodes = graph.nodes
    .filter((node) => !deleteNodeIdSet.has(node.id))
    .map((node) => ({
      ...node,
      transitions: node.transitions.filter((id) => !deleteNodeIdSet.has(id)),
    }))

  return {
    ...graph,
    nodes: nextNodes,
  }
}

function smoothIndoorNode(previousNode, nextNode) {
  return {
    x: (previousNode.x + nextNode.x) / 2,
    y: (previousNode.y + nextNode.y) / 2,
  }
}

function smoothWgs84Node(previousNode, nextNode) {
  return {
    lat: (previousNode.lat + nextNode.lat) / 2,
    lon: (previousNode.lon + nextNode.lon) / 2,
  }
}

export function smoothSelectedPathInGraph(graph, orderedSelectedNodeIds) {
  if (!graph || orderedSelectedNodeIds.length < 3) {
    return {
      ok: false,
      message: 'Filter needs at least 3 selected nodes.',
    }
  }

  const nodeMap = buildNodeMap(graph)
  const selectedNodeIdSet = new Set(orderedSelectedNodeIds)
  const firstNodeId = orderedSelectedNodeIds[0]
  const lastNodeId = orderedSelectedNodeIds[orderedSelectedNodeIds.length - 1]

  const nextNodes = graph.nodes.map((node) => {
    if (!selectedNodeIdSet.has(node.id)) {
      return node
    }

    if (node.id === firstNodeId || node.id === lastNodeId) {
      return node
    }

    const nodeIndex = orderedSelectedNodeIds.indexOf(node.id)
    const previousNode = nodeMap.get(orderedSelectedNodeIds[nodeIndex - 1])
    const nextNode = nodeMap.get(orderedSelectedNodeIds[nodeIndex + 1])

    if (!previousNode || !nextNode) {
      return node
    }

    if (graph.coordinateFrame === 'wgs84') {
      const smoothed = smoothWgs84Node(previousNode, nextNode)
      return {
        ...node,
        lat: smoothed.lat,
        lon: smoothed.lon,
      }
    }

    const smoothed = smoothIndoorNode(previousNode, nextNode)
    return {
      ...node,
      x: smoothed.x,
      y: smoothed.y,
    }
  })

  return {
    ok: true,
    graph: {
      ...graph,
      nodes: nextNodes,
    },
    message: `Filtered ${orderedSelectedNodeIds.length} selected nodes.`,
  }
}