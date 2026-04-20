import { useCallback, useMemo, useState } from 'react'
import './App.css'
import Sidebar from './components/Sidebar'
import GraphViewer from './components/GraphViewer'
import useGraphEditor from './hooks/useGraphEditor'
import useCsvOverlayEditor from './hooks/useCsvOverlayEditor'
import useJsonGraphEditor from './hooks/useJsonGraphEditor'
import useFileImportController from './hooks/useFileImportController'
import { downloadGraphJson } from './lib/graphExport'

export default function App() {
  const [message, setMessage] = useState('No file selected yet.')
  const [fileName, setFileName] = useState('')
  const [fileType, setFileType] = useState('')
  const [graphFileName, setGraphFileName] = useState('')
  const [preview, setPreview] = useState('')
  const [graphData, setGraphData] = useState(null)

  const [selectedJsonNodeIds, setSelectedJsonNodeIds] = useState([])
  const [jsonSelectionAnchorNodeId, setJsonSelectionAnchorNodeId] =
    useState(null)
  const [jsonSelectionTerminalNodeId, setJsonSelectionTerminalNodeId] =
    useState(null)

  const [activeCsvOverlayId, setActiveCsvOverlayId] = useState(null)
  const [selectedCsvPointIndices, setSelectedCsvPointIndices] = useState([])
  const [csvSelectionAnchorIndex, setCsvSelectionAnchorIndex] = useState(null)
  const [csvSelectionTerminalIndex, setCsvSelectionTerminalIndex] =
    useState(null)

  const [csvOverlays, setCsvOverlays] = useState([])
  const [fitViewVersion, setFitViewVersion] = useState(0)
  const [spacingMeters, setSpacingMeters] = useState(0.5)

  const clearJsonSelection = useCallback(() => {
    setSelectedJsonNodeIds([])
    setJsonSelectionAnchorNodeId(null)
    setJsonSelectionTerminalNodeId(null)
  }, [])

  const clearCsvSelection = useCallback(
    (options = {}) => {
      const { clearActiveOverlay = false } = options

      if (clearActiveOverlay) {
        setActiveCsvOverlayId(null)
      }

      setSelectedCsvPointIndices([])
      setCsvSelectionAnchorIndex(null)
      setCsvSelectionTerminalIndex(null)
    },
    [],
  )

  const clearAllSelections = useCallback(() => {
    clearJsonSelection()
    clearCsvSelection({ clearActiveOverlay: true })
  }, [clearJsonSelection, clearCsvSelection])

  const primarySelectedJsonNodeId =
    selectedJsonNodeIds.length === 1 ? selectedJsonNodeIds[0] : null

  const selectedNode = useMemo(() => {
    if (!graphData || primarySelectedJsonNodeId === null) {
      return null
    }

    return (
      graphData.nodes.find((node) => node.id === primarySelectedJsonNodeId) ??
      null
    )
  }, [graphData, primarySelectedJsonNodeId])

  const {
    handleAddJsonNodeAt,
    handleDeleteSelectedJsonNodes,
    handleFilterSelectedJsonNodes,
    handleConnectNodes,
    handleDisconnectNodes,
    handleApplyWire,
  } = useJsonGraphEditor({
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
  })

  const {
    handleDeleteSelectedCsvPoints,
    handleFilterSelectedCsvPoints,
    handleSampleSelectedCsvPointsToJson,
  } = useCsvOverlayEditor({
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
  })

  const handleSaveJson = useCallback(() => {
    if (!graphData) {
      setMessage('Load a graph JSON first, then save.')
      return
    }

    try {
      const downloadedFileName = downloadGraphJson({
        graph: graphData,
        graphFileName: graphFileName || `${graphData.graphId || 'graph'}.json`,
      })

      setMessage(`Graph JSON saved: ${downloadedFileName}`)
    } catch (error) {
      setMessage(error.message ?? 'Failed to save graph JSON.')
    }
  }, [graphData, graphFileName])

  const {
    editMode,
    setHoveredMapLatLng,
    linkMode,
    linkSourceNodeId,
    wireTargetNodeId,
    wireControlPointLatLng,
    activeCsvOverlayId: editorActiveCsvOverlayId,
    cancelLinkMode,
    resetEditorState,
    handleMapClick,
    handleJsonNodeClick,
    handleCsvPointClick,
  } = useGraphEditor({
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
    onAddJsonNodeAt: handleAddJsonNodeAt,
    onDeleteSelectedJsonNodes: handleDeleteSelectedJsonNodes,
    onFilterSelectedJsonNodes: handleFilterSelectedJsonNodes,
    onDeleteSelectedCsvPoints: handleDeleteSelectedCsvPoints,
    onFilterSelectedCsvPoints: handleFilterSelectedCsvPoints,
    onSampleSelectedCsvPointsToJson: handleSampleSelectedCsvPointsToJson,
    onConnectNodes: handleConnectNodes,
    onDisconnectNodes: handleDisconnectNodes,
    onApplyWire: handleApplyWire,
    onSaveJson: handleSaveJson,
    setMessage,
  })

  const { handleAddFile } = useFileImportController({
    graphData,
    setGraphData,
    setCsvOverlays,
    clearAllSelections,
    clearCsvSelection,
    cancelLinkMode,
    setActiveCsvOverlayId,
    setFitViewVersion,
    setFileName,
    setFileType,
    setGraphFileName,
    setPreview,
    setMessage,
  })

  function handleResetSession() {
    setMessage('Session has been reset.')
    setFileName('')
    setFileType('')
    setGraphFileName('')
    setPreview('')
    setGraphData(null)
    setCsvOverlays([])
    clearAllSelections()
    resetEditorState()
  }

  return (
    <div className="app">
      <Sidebar
        onAddFile={handleAddFile}
        onResetSession={handleResetSession}
        graphData={graphData}
        selectedNode={selectedNode}
        selectedJsonNodeCount={selectedJsonNodeIds.length}
        selectedCsvPointCount={selectedCsvPointIndices.length}
        csvOverlayCount={csvOverlays.length}
        editMode={editMode}
        activeCsvOverlayId={editorActiveCsvOverlayId}
        linkMode={linkMode}
        linkSourceNodeId={linkSourceNodeId}
        wireTargetNodeId={wireTargetNodeId}
        wireControlPointLatLng={wireControlPointLatLng}
        spacingMeters={spacingMeters}
        onSpacingChange={setSpacingMeters}
        message={message}
      />

      <GraphViewer
        graphData={graphData}
        csvOverlays={csvOverlays}
        editMode={editMode}
        selectedJsonNodeIds={selectedJsonNodeIds}
        activeCsvOverlayId={editorActiveCsvOverlayId}
        selectedCsvPointIndices={selectedCsvPointIndices}
        linkMode={linkMode}
        linkSourceNodeId={linkSourceNodeId}
        wireTargetNodeId={wireTargetNodeId}
        wireControlPointLatLng={wireControlPointLatLng}
        onSelectJsonNode={handleJsonNodeClick}
        onSelectCsvPoint={handleCsvPointClick}
        onMapClick={handleMapClick}
        onHoverMapLatLngChange={setHoveredMapLatLng}
        fitViewVersion={fitViewVersion}
      />
    </div>
  )
}