import { useCallback } from 'react'
import { appendUniqueIds, findShortestNodePath } from '../lib/graphEdit'
import { buildCsvIndexRange } from '../lib/csvEdit'

export default function useGraphEditorClicks({
  graphData,
  isJsonEditMode,
  isCsvEditMode,
  linkMode,
  linkSourceNodeId,
  wireTargetNodeId,
  activeCsvOverlayId,
  jsonSelectionAnchorNodeId,
  csvSelectionAnchorIndex,
  setWireTargetNodeId,
  setWireControlPointLatLng,
  setSelectedJsonNodeIds,
  setJsonSelectionAnchorNodeId,
  setJsonSelectionTerminalNodeId,
  setActiveCsvOverlayId,
  setSelectedCsvPointIndices,
  setCsvSelectionAnchorIndex,
  setCsvSelectionTerminalIndex,
  onConnectNodes,
  onDisconnectNodes,
  setMessage,
}) {
  const handleMapClick = useCallback(
    (latlng) => {
      if (!isJsonEditMode) {
        return
      }

      if (
        linkMode !== 'wire' ||
        linkSourceNodeId === null ||
        wireTargetNodeId === null
      ) {
        return
      }

      setWireControlPointLatLng(latlng)
      setMessage('Wire control point updated. Press Enter to apply.')
    },
    [
      isJsonEditMode,
      linkMode,
      linkSourceNodeId,
      setMessage,
      setWireControlPointLatLng,
      wireTargetNodeId,
    ],
  )

  const handleJsonNodeClick = useCallback(
    ({ nodeId, shiftKey }) => {
      if (!isJsonEditMode) {
        return
      }

      if (linkMode === 'connect' && linkSourceNodeId !== null) {
        onConnectNodes(linkSourceNodeId, nodeId)
        return
      }

      if (linkMode === 'disconnect' && linkSourceNodeId !== null) {
        onDisconnectNodes(linkSourceNodeId, nodeId)
        return
      }

      if (linkMode === 'wire' && linkSourceNodeId !== null) {
        if (nodeId === linkSourceNodeId) {
          setMessage('Pick a different target node for wire mode.')
          return
        }

        setWireTargetNodeId(nodeId)
        setMessage(
          'Wire target selected. Click empty map to bend the wire, or press Enter to apply a straight wire.',
        )
        return
      }

      if (!shiftKey) {
        setSelectedJsonNodeIds([nodeId])
        setJsonSelectionAnchorNodeId(nodeId)
        setJsonSelectionTerminalNodeId(nodeId)
        return
      }

      if (!graphData) {
        return
      }

      if (jsonSelectionAnchorNodeId === null) {
        setSelectedJsonNodeIds((previousIds) =>
          appendUniqueIds(previousIds, [nodeId]),
        )
        setJsonSelectionAnchorNodeId(nodeId)
        setJsonSelectionTerminalNodeId(nodeId)
        return
      }

      const pathNodeIds = findShortestNodePath(
        graphData,
        jsonSelectionAnchorNodeId,
        nodeId,
      )

      if (!pathNodeIds) {
        setMessage('No path found between the anchor node and the clicked node.')
        return
      }

      setSelectedJsonNodeIds((previousIds) =>
        appendUniqueIds(previousIds, pathNodeIds),
      )
      setJsonSelectionTerminalNodeId(nodeId)
    },
    [
      graphData,
      isJsonEditMode,
      jsonSelectionAnchorNodeId,
      linkMode,
      linkSourceNodeId,
      onConnectNodes,
      onDisconnectNodes,
      setJsonSelectionAnchorNodeId,
      setJsonSelectionTerminalNodeId,
      setMessage,
      setSelectedJsonNodeIds,
      setWireTargetNodeId,
    ],
  )

  const handleCsvPointClick = useCallback(
    ({ overlayId, pointIndex, shiftKey }) => {
      if (!isCsvEditMode) {
        return
      }

      if (overlayId !== activeCsvOverlayId) {
        setActiveCsvOverlayId(overlayId)
        setSelectedCsvPointIndices([pointIndex])
        setCsvSelectionAnchorIndex(pointIndex)
        setCsvSelectionTerminalIndex(pointIndex)
        return
      }

      if (!shiftKey) {
        setSelectedCsvPointIndices([pointIndex])
        setCsvSelectionAnchorIndex(pointIndex)
        setCsvSelectionTerminalIndex(pointIndex)
        return
      }

      if (csvSelectionAnchorIndex === null) {
        setSelectedCsvPointIndices([pointIndex])
        setCsvSelectionAnchorIndex(pointIndex)
        setCsvSelectionTerminalIndex(pointIndex)
        return
      }

      const selectedRange = buildCsvIndexRange(
        csvSelectionAnchorIndex,
        pointIndex,
      )

      setSelectedCsvPointIndices(selectedRange)
      setCsvSelectionTerminalIndex(pointIndex)
    },
    [
      activeCsvOverlayId,
      csvSelectionAnchorIndex,
      isCsvEditMode,
      setActiveCsvOverlayId,
      setCsvSelectionAnchorIndex,
      setCsvSelectionTerminalIndex,
      setSelectedCsvPointIndices,
    ],
  )

  return {
    handleMapClick,
    handleJsonNodeClick,
    handleCsvPointClick,
  }
}