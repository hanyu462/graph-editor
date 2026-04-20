import { useState } from 'react'
import useGraphEditorKeyboard from './useGraphEditorKeyboard'
import useGraphEditorClicks from './useGraphEditorClicks'

export default function useGraphEditor({
  graphData,
  csvOverlays,
  spacingMeters,
  selectedJsonNodeIds,
  setSelectedJsonNodeIds,
  jsonSelectionAnchorNodeId,
  setJsonSelectionAnchorNodeId,
  jsonSelectionTerminalNodeId,
  setJsonSelectionTerminalNodeId,
  activeCsvOverlayId,
  setActiveCsvOverlayId,
  selectedCsvPointIndices,
  setSelectedCsvPointIndices,
  csvSelectionAnchorIndex,
  setCsvSelectionAnchorIndex,
  csvSelectionTerminalIndex,
  setCsvSelectionTerminalIndex,
  onAddJsonNodeAt,
  onDeleteSelectedJsonNodes,
  onFilterSelectedJsonNodes,
  onDeleteSelectedCsvPoints,
  onFilterSelectedCsvPoints,
  onSampleSelectedCsvPointsToJson,
  onConnectNodes,
  onDisconnectNodes,
  onApplyWire,
  onSaveJson,
  setMessage,
}) {
  const [editMode, setEditMode] = useState('off') // 'off' | 'json' | 'csv'
  const [hoveredMapLatLng, setHoveredMapLatLng] = useState(null)
  const [linkMode, setLinkMode] = useState(null) // null | 'connect' | 'disconnect' | 'wire'
  const [linkSourceNodeId, setLinkSourceNodeId] = useState(null)
  const [wireTargetNodeId, setWireTargetNodeId] = useState(null)
  const [wireControlPointLatLng, setWireControlPointLatLng] = useState(null)

  const isJsonEditMode = editMode === 'json'
  const isCsvEditMode = editMode === 'csv'
  const primarySelectedJsonNodeId =
    selectedJsonNodeIds.length === 1 ? selectedJsonNodeIds[0] : null

  function clearJsonSelection() {
    setSelectedJsonNodeIds([])
    setJsonSelectionAnchorNodeId(null)
    setJsonSelectionTerminalNodeId(null)
  }

  function clearCsvSelection() {
    setSelectedCsvPointIndices([])
    setCsvSelectionAnchorIndex(null)
    setCsvSelectionTerminalIndex(null)
  }

  function cancelLinkMode() {
    setLinkMode(null)
    setLinkSourceNodeId(null)
    setWireTargetNodeId(null)
    setWireControlPointLatLng(null)
  }

  function resetEditorState() {
    setEditMode('off')
    setHoveredMapLatLng(null)
    cancelLinkMode()
    clearJsonSelection()
    clearCsvSelection()
    setActiveCsvOverlayId(null)
  }

  function cycleEditMode() {
    const availableModes = ['off']

    if (graphData && graphData.nodes.length > 0) {
      availableModes.push('json')
    }

    if (csvOverlays.length > 0) {
      availableModes.push('csv')
    }

    const currentIndex = availableModes.indexOf(editMode)
    const nextIndex = (currentIndex + 1) % availableModes.length
    const nextMode = availableModes[nextIndex]

    cancelLinkMode()
    clearJsonSelection()
    clearCsvSelection()

    if (nextMode === 'csv') {
      const nextActiveOverlayId =
        csvOverlays[csvOverlays.length - 1]?.id ?? null
      setActiveCsvOverlayId(nextActiveOverlayId)
    }

    if (nextMode !== 'csv') {
      setActiveCsvOverlayId(null)
    }

    setEditMode(nextMode)
    setMessage(`Edit mode: ${nextMode.toUpperCase()}`)
  }

  function startConnectMode() {
    if (!isJsonEditMode) {
      setMessage('Connect is available only in JSON edit mode.')
      return
    }

    if (
      selectedJsonNodeIds.length !== 1 ||
      primarySelectedJsonNodeId === null
    ) {
      setMessage('Select exactly one source node first, then press C.')
      return
    }

    setLinkMode('connect')
    setLinkSourceNodeId(primarySelectedJsonNodeId)
    setWireTargetNodeId(null)
    setWireControlPointLatLng(null)
    setMessage(
      `Connect mode: click a target node for node ${primarySelectedJsonNodeId}.`,
    )
  }

  function startDisconnectMode() {
    if (!isJsonEditMode) {
      setMessage('Disconnect is available only in JSON edit mode.')
      return
    }

    if (
      selectedJsonNodeIds.length !== 1 ||
      primarySelectedJsonNodeId === null
    ) {
      setMessage('Select exactly one source node first, then press X.')
      return
    }

    setLinkMode('disconnect')
    setLinkSourceNodeId(primarySelectedJsonNodeId)
    setWireTargetNodeId(null)
    setWireControlPointLatLng(null)
    setMessage(
      `Disconnect mode: click a connected node for node ${primarySelectedJsonNodeId}.`,
    )
  }

  function startWireMode() {
    if (!isJsonEditMode) {
      setMessage('Wire is available only in JSON edit mode.')
      return
    }

    if (
      selectedJsonNodeIds.length !== 1 ||
      primarySelectedJsonNodeId === null
    ) {
      setMessage('Select exactly one source node first, then press W.')
      return
    }

    setLinkMode('wire')
    setLinkSourceNodeId(primarySelectedJsonNodeId)
    setWireTargetNodeId(null)
    setWireControlPointLatLng(null)
    setMessage('Wire mode: click the target node first.')
  }

  const { handleMapClick, handleJsonNodeClick, handleCsvPointClick } =
    useGraphEditorClicks({
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
    })

  useGraphEditorKeyboard({
    editMode,
    isJsonEditMode,
    isCsvEditMode,
    graphData,
    hoveredMapLatLng,
    linkMode,
    linkSourceNodeId,
    wireTargetNodeId,
    wireControlPointLatLng,
    spacingMeters,
    selectedJsonNodeIds,
    selectedCsvPointIndices,
    onAddJsonNodeAt,
    onDeleteSelectedJsonNodes,
    onFilterSelectedJsonNodes,
    onDeleteSelectedCsvPoints,
    onFilterSelectedCsvPoints,
    onSampleSelectedCsvPointsToJson,
    onApplyWire,
    onSaveJson,
    cycleEditMode,
    cancelLinkMode,
    clearJsonSelection,
    clearCsvSelection,
    startConnectMode,
    startDisconnectMode,
    startWireMode,
    setMessage,
  })

  return {
    editMode,
    hoveredMapLatLng,
    setHoveredMapLatLng,
    linkMode,
    linkSourceNodeId,
    wireTargetNodeId,
    wireControlPointLatLng,
    activeCsvOverlayId,
    cancelLinkMode,
    resetEditorState,
    handleMapClick,
    handleJsonNodeClick,
    handleCsvPointClick,
  }
}