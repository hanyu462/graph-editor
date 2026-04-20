import { useEffect } from 'react'

export default function useGraphEditorKeyboard({
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
}) {
  useEffect(() => {
    function handleKeyDown(event) {
      const target = event.target
      const tagName = target?.tagName?.toLowerCase()

      if (
        tagName === 'input' ||
        tagName === 'textarea' ||
        target?.isContentEditable
      ) {
        return
      }

      const key = event.key.toLowerCase()
      const isSaveShortcut = (event.ctrlKey || event.metaKey) && key === 's'

      if (isSaveShortcut) {
        event.preventDefault()
        onSaveJson()
        return
      }

      if (key === 'e') {
        event.preventDefault()
        cycleEditMode()
        return
      }

      if (key === 'escape') {
        if (linkMode !== null) {
          event.preventDefault()
          cancelLinkMode()
          setMessage('Link mode cancelled.')
          return
        }

        if (isJsonEditMode && selectedJsonNodeIds.length > 0) {
          event.preventDefault()
          clearJsonSelection()
          setMessage('JSON selection cleared.')
          return
        }

        if (isCsvEditMode && selectedCsvPointIndices.length > 0) {
          event.preventDefault()
          clearCsvSelection()
          setMessage('CSV selection cleared.')
        }

        return
      }

      if (editMode === 'off') {
        return
      }

      if (key === 'a') {
        if (!isJsonEditMode) {
          return
        }

        event.preventDefault()

        if (!graphData) {
          setMessage('Load a graph before adding a node.')
          return
        }

        if (!hoveredMapLatLng) {
          setMessage('Move the mouse over the map first, then press A.')
          return
        }

        onAddJsonNodeAt(hoveredMapLatLng)
        return
      }

      if (key === 'd') {
        event.preventDefault()

        if (isJsonEditMode) {
          if (selectedJsonNodeIds.length === 0) {
            setMessage('Select one or more JSON nodes first, then press D.')
            return
          }

          onDeleteSelectedJsonNodes()
          return
        }

        if (isCsvEditMode) {
          if (selectedCsvPointIndices.length === 0) {
            setMessage('Select one or more CSV points first, then press D.')
            return
          }

          onDeleteSelectedCsvPoints()
        }

        return
      }

      if (key === 'f') {
        event.preventDefault()

        if (isJsonEditMode) {
          if (selectedJsonNodeIds.length < 3) {
            setMessage(
              'Select at least 3 connected JSON nodes first, then press F.',
            )
            return
          }

          onFilterSelectedJsonNodes()
          return
        }

        if (isCsvEditMode) {
          if (selectedCsvPointIndices.length < 3) {
            setMessage('Select at least 3 CSV points first, then press F.')
            return
          }

          onFilterSelectedCsvPoints()
        }

        return
      }

      if (key === 's') {
        if (!isCsvEditMode) {
          return
        }

        event.preventDefault()

        if (selectedCsvPointIndices.length < 2) {
          setMessage('Select at least 2 CSV points first, then press S.')
          return
        }

        onSampleSelectedCsvPointsToJson()
        return
      }

      if (!isJsonEditMode) {
        return
      }

      if (key === 'c') {
        event.preventDefault()
        startConnectMode()
        return
      }

      if (key === 'x') {
        event.preventDefault()
        startDisconnectMode()
        return
      }

      if (key === 'w') {
        event.preventDefault()
        startWireMode()
        return
      }

      if (key === 'enter' && linkMode === 'wire') {
        event.preventDefault()
        onApplyWire({
          linkMode,
          linkSourceNodeId,
          wireTargetNodeId,
          wireControlPointLatLng,
          spacingMeters,
          cancelLinkMode,
        })
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [
    cancelLinkMode,
    clearCsvSelection,
    clearJsonSelection,
    cycleEditMode,
    editMode,
    graphData,
    hoveredMapLatLng,
    isCsvEditMode,
    isJsonEditMode,
    linkMode,
    linkSourceNodeId,
    onAddJsonNodeAt,
    onApplyWire,
    onDeleteSelectedCsvPoints,
    onDeleteSelectedJsonNodes,
    onFilterSelectedCsvPoints,
    onFilterSelectedJsonNodes,
    onSampleSelectedCsvPointsToJson,
    onSaveJson,
    selectedCsvPointIndices,
    selectedJsonNodeIds,
    setMessage,
    spacingMeters,
    startConnectMode,
    startDisconnectMode,
    startWireMode,
    wireControlPointLatLng,
    wireTargetNodeId,
  ])
}