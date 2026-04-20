import { useCallback } from 'react'
import {
  addNodeToGraph,
  applyWireToGraph,
  connectNodesInGraph,
  deleteNodesFromGraph,
  disconnectNodesInGraph,
  findShortestNodePath,
  smoothSelectedPathInGraph,
} from '../lib/graphEdit'

export default function useJsonGraphEditor({
  graphData,
  setGraphData,
  selectedJsonNodeIds,
  jsonSelectionAnchorNodeId,
  jsonSelectionTerminalNodeId,
  clearJsonSelection,
  setSelectedJsonNodeIds,
  setJsonSelectionAnchorNodeId,
  setJsonSelectionTerminalNodeId,
  setMessage,
}) {
  const handleAddJsonNodeAt = useCallback(
    (latlng) => {
      if (!graphData) {
        return
      }

      const { graph, newNode } = addNodeToGraph(graphData, latlng)

      setGraphData(graph)
      setSelectedJsonNodeIds([newNode.id])
      setJsonSelectionAnchorNodeId(newNode.id)
      setJsonSelectionTerminalNodeId(newNode.id)
      setMessage(`Node ${newNode.id} added.`)
    },
    [
      graphData,
      setGraphData,
      setJsonSelectionAnchorNodeId,
      setJsonSelectionTerminalNodeId,
      setMessage,
      setSelectedJsonNodeIds,
    ],
  )

  const handleDeleteSelectedJsonNodes = useCallback(() => {
    if (!graphData || selectedJsonNodeIds.length === 0) {
      return
    }

    const nextGraph = deleteNodesFromGraph(graphData, selectedJsonNodeIds)

    setGraphData(nextGraph)
    clearJsonSelection()
    setMessage(`${selectedJsonNodeIds.length} JSON node(s) deleted.`)
  }, [
    clearJsonSelection,
    graphData,
    selectedJsonNodeIds,
    setGraphData,
    setMessage,
  ])

  const handleFilterSelectedJsonNodes = useCallback(() => {
    if (!graphData) {
      return
    }

    if (
      jsonSelectionAnchorNodeId === null ||
      jsonSelectionTerminalNodeId === null ||
      selectedJsonNodeIds.length < 3
    ) {
      setMessage('Select a connected JSON node range first, then press F.')
      return
    }

    const orderedSelectedPath = findShortestNodePath(
      graphData,
      jsonSelectionAnchorNodeId,
      jsonSelectionTerminalNodeId,
    )

    if (!orderedSelectedPath) {
      setMessage('Could not build a valid path for JSON filtering.')
      return
    }

    const selectedNodeIdSet = new Set(selectedJsonNodeIds)
    const isExactContinuousPath =
      orderedSelectedPath.length === selectedJsonNodeIds.length &&
      orderedSelectedPath.every((nodeId) => selectedNodeIdSet.has(nodeId))

    if (!isExactContinuousPath) {
      setMessage('JSON filter only works on one continuous selected path.')
      return
    }

    const result = smoothSelectedPathInGraph(graphData, orderedSelectedPath)
    setMessage(result.message)

    if (!result.ok) {
      return
    }

    setGraphData(result.graph)
  }, [
    graphData,
    jsonSelectionAnchorNodeId,
    jsonSelectionTerminalNodeId,
    selectedJsonNodeIds,
    setGraphData,
    setMessage,
  ])

  const handleConnectNodes = useCallback(
    (sourceNodeId, targetNodeId) => {
      if (!graphData) {
        return
      }

      const result = connectNodesInGraph(graphData, sourceNodeId, targetNodeId)
      setMessage(result.message)

      if (!result.ok) {
        return
      }

      setGraphData(result.graph)
    },
    [graphData, setGraphData, setMessage],
  )

  const handleDisconnectNodes = useCallback(
    (sourceNodeId, targetNodeId) => {
      if (!graphData) {
        return
      }

      const result = disconnectNodesInGraph(
        graphData,
        sourceNodeId,
        targetNodeId,
      )
      setMessage(result.message)

      if (!result.ok) {
        return
      }

      setGraphData(result.graph)
    },
    [graphData, setGraphData, setMessage],
  )

  const handleApplyWire = useCallback(
    ({
      linkMode,
      linkSourceNodeId,
      wireTargetNodeId,
      wireControlPointLatLng,
      spacingMeters,
      cancelLinkMode,
    }) => {
      if (!graphData) {
        return
      }

      if (
        linkMode !== 'wire' ||
        linkSourceNodeId === null ||
        wireTargetNodeId === null
      ) {
        setMessage('Select source and target nodes first for wire mode.')
        return
      }

      const result = applyWireToGraph({
        graph: graphData,
        sourceNodeId: linkSourceNodeId,
        targetNodeId: wireTargetNodeId,
        controlPointLatLng: wireControlPointLatLng,
        targetSpacingMeters: spacingMeters,
      })

      setMessage(result.message)

      if (!result.ok) {
        cancelLinkMode()
        return
      }

      setGraphData(result.graph)
      setSelectedJsonNodeIds([linkSourceNodeId])
      setJsonSelectionAnchorNodeId(linkSourceNodeId)
      setJsonSelectionTerminalNodeId(linkSourceNodeId)
      cancelLinkMode()
    },
    [
      graphData,
      setGraphData,
      setJsonSelectionAnchorNodeId,
      setJsonSelectionTerminalNodeId,
      setMessage,
      setSelectedJsonNodeIds,
    ],
  )

  return {
    handleAddJsonNodeAt,
    handleDeleteSelectedJsonNodes,
    handleFilterSelectedJsonNodes,
    handleConnectNodes,
    handleDisconnectNodes,
    handleApplyWire,
  }
}