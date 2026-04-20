import { useCallback } from 'react'
import {
  buildCsvIndexRange,
  buildJsonNodeChainFromSampledPoints,
  deleteCsvPointsByIndices,
  resampleCsvPointsBySpacing,
  smoothCsvPointsByIndices,
} from '../lib/csvEdit'

export default function useCsvOverlayEditor({
  graphData,
  setGraphData,
  csvOverlays,
  setCsvOverlays,
  activeCsvOverlayId,
  selectedCsvPointIndices,
  csvSelectionAnchorIndex,
  csvSelectionTerminalIndex,
  spacingMeters,
  clearCsvSelection,
  setSelectedJsonNodeIds,
  setJsonSelectionAnchorNodeId,
  setJsonSelectionTerminalNodeId,
  setMessage,
}) {
  const handleDeleteSelectedCsvPoints = useCallback(() => {
    if (!activeCsvOverlayId || selectedCsvPointIndices.length === 0) {
      return
    }

    setCsvOverlays((previousOverlays) =>
      previousOverlays.map((overlay) => {
        if (overlay.id !== activeCsvOverlayId) {
          return overlay
        }

        return {
          ...overlay,
          points: deleteCsvPointsByIndices(
            overlay.points,
            selectedCsvPointIndices,
          ),
        }
      }),
    )

    clearCsvSelection()
    setMessage(`${selectedCsvPointIndices.length} CSV point(s) deleted.`)
  }, [
    activeCsvOverlayId,
    clearCsvSelection,
    selectedCsvPointIndices,
    setCsvOverlays,
    setMessage,
  ])

  const handleFilterSelectedCsvPoints = useCallback(() => {
    if (!activeCsvOverlayId || !graphData) {
      return
    }

    if (
      csvSelectionAnchorIndex === null ||
      csvSelectionTerminalIndex === null ||
      selectedCsvPointIndices.length < 3
    ) {
      setMessage('Select a CSV point range first, then press F.')
      return
    }

    const orderedSelectedIndices = buildCsvIndexRange(
      csvSelectionAnchorIndex,
      csvSelectionTerminalIndex,
    )

    const selectedIndexSet = new Set(selectedCsvPointIndices)
    const isExactContinuousRange =
      orderedSelectedIndices.length === selectedCsvPointIndices.length &&
      orderedSelectedIndices.every((index) => selectedIndexSet.has(index))

    if (!isExactContinuousRange) {
      setMessage('CSV filter only works on one continuous selected range.')
      return
    }

    let nextMessage = null

    setCsvOverlays((previousOverlays) =>
      previousOverlays.map((overlay) => {
        if (overlay.id !== activeCsvOverlayId) {
          return overlay
        }

        const result = smoothCsvPointsByIndices(
          overlay.points,
          orderedSelectedIndices,
          graphData.coordinateFrame,
        )

        nextMessage = result.message

        if (!result.ok) {
          return overlay
        }

        return {
          ...overlay,
          points: result.points,
        }
      }),
    )

    if (nextMessage) {
      setMessage(nextMessage)
    }
  }, [
    activeCsvOverlayId,
    csvSelectionAnchorIndex,
    csvSelectionTerminalIndex,
    graphData,
    selectedCsvPointIndices,
    setCsvOverlays,
    setMessage,
  ])

  const handleSampleSelectedCsvPointsToJson = useCallback(() => {
    if (!activeCsvOverlayId || !graphData) {
      return
    }

    if (
      csvSelectionAnchorIndex === null ||
      csvSelectionTerminalIndex === null ||
      selectedCsvPointIndices.length < 2
    ) {
      setMessage('Select a CSV point range first, then press S.')
      return
    }

    const orderedSelectedIndices = buildCsvIndexRange(
      csvSelectionAnchorIndex,
      csvSelectionTerminalIndex,
    )

    const selectedIndexSet = new Set(selectedCsvPointIndices)
    const isExactContinuousRange =
      orderedSelectedIndices.length === selectedCsvPointIndices.length &&
      orderedSelectedIndices.every((index) => selectedIndexSet.has(index))

    if (!isExactContinuousRange) {
      setMessage('Sampling only works on one continuous selected CSV range.')
      return
    }

    const activeOverlay = csvOverlays.find(
      (overlay) => overlay.id === activeCsvOverlayId,
    )

    if (!activeOverlay) {
      setMessage('Active CSV overlay was not found.')
      return
    }

    const sampledResult = resampleCsvPointsBySpacing(
      activeOverlay.points,
      orderedSelectedIndices,
      graphData.coordinateFrame,
      spacingMeters,
    )

    setMessage(sampledResult.message)

    if (!sampledResult.ok) {
      return
    }

    const { newNodes, newNodeIds } = buildJsonNodeChainFromSampledPoints(
      graphData,
      sampledResult.sampledPoints,
    )

    setGraphData((previousGraph) => {
      if (!previousGraph) {
        return previousGraph
      }

      return {
        ...previousGraph,
        nodes: [...previousGraph.nodes, ...newNodes],
      }
    })

    setCsvOverlays((previousOverlays) =>
      previousOverlays.map((overlay) => {
        if (overlay.id !== activeCsvOverlayId) {
          return overlay
        }

        return {
          ...overlay,
          points: deleteCsvPointsByIndices(
            overlay.points,
            orderedSelectedIndices,
          ),
        }
      }),
    )

    clearCsvSelection()

    setSelectedJsonNodeIds(newNodeIds)
    setJsonSelectionAnchorNodeId(newNodeIds[0] ?? null)
    setJsonSelectionTerminalNodeId(
      newNodeIds.length > 0 ? newNodeIds[newNodeIds.length - 1] : null,
    )

    setMessage(
      `Sampled CSV path into ${newNodeIds.length} JSON nodes and removed the source CSV segment. Actual spacing: ${sampledResult.actualSpacingMeters.toFixed(3)} m.`,
    )
  }, [
    activeCsvOverlayId,
    clearCsvSelection,
    csvOverlays,
    csvSelectionAnchorIndex,
    csvSelectionTerminalIndex,
    graphData,
    selectedCsvPointIndices,
    setCsvOverlays,
    setGraphData,
    setJsonSelectionAnchorNodeId,
    setJsonSelectionTerminalNodeId,
    setMessage,
    setSelectedJsonNodeIds,
    spacingMeters,
  ])

  return {
    handleDeleteSelectedCsvPoints,
    handleFilterSelectedCsvPoints,
    handleSampleSelectedCsvPointsToJson,
  }
}