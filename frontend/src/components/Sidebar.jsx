import { useEffect, useRef, useState } from 'react'

export default function Sidebar({
  onAddFile,
  onResetSession,
  graphData,
  selectedNode,
  selectedJsonNodeCount,
  selectedCsvPointCount,
  csvOverlayCount,
  editMode,
  activeCsvOverlayId,
  linkMode,
  linkSourceNodeId,
  wireTargetNodeId,
  wireControlPointLatLng,
  spacingMeters,
  onSpacingChange,
  message,
}) {
  const fileInputRef = useRef(null)
  const [spacingInput, setSpacingInput] = useState(String(spacingMeters))

  useEffect(() => {
    setSpacingInput(String(spacingMeters))
  }, [spacingMeters])

  function handleClickAddFile() {
    fileInputRef.current?.click()
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) {
      return
    }

    onAddFile(file)
  }

  const hasSingleJsonSelection =
    selectedJsonNodeCount === 1 && selectedNode !== null
  const hasMultiJsonSelection = selectedJsonNodeCount > 1

  return (
    <aside className="sidebar">
      <h2>Graph Editor</h2>

      <div className="button-group">
        <button onClick={handleClickAddFile}>Add File</button>
        <button onClick={onResetSession}>Reset Session</button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.csv"
        hidden
        onChange={handleFileChange}
      />

      <hr className="sidebar-divider" />

      <div className="graph-info">
        <p>graph_id: {graphData?.graphId || 'None'}</p>
        <p>coordinate_frame: {graphData?.coordinateFrame || 'None'}</p>
      </div>

      <hr className="sidebar-divider" />

      <div className="graph-info shortcut-info">
        <p>edit_mode: {editMode.toUpperCase()}</p>
        <p>link_mode: {linkMode || 'None'}</p>
        <p>link_source_node_id: {linkSourceNodeId ?? 'None'}</p>
        <p>wire_target_node_id: {wireTargetNodeId ?? 'None'}</p>
        <p>wire_control_point: {wireControlPointLatLng ? 'SET' : 'None'}</p>
      </div>

      <hr className="sidebar-divider" />

      <div className="graph-info shortcut-info">
        <p>shortcut: E = edit mode switch</p>
        <p>shortcut: A = add node</p>
        <p>shortcut: D = delete selected</p>
        <p>shortcut: F = filter selected</p>
        <p>shortcut: S = sample CSV to JSON</p>
        <p>shortcut: C = connect node</p>
        <p>shortcut: X = disconnect node</p>
        <p>shortcut: W = start wire preview</p>
        <p>shortcut: Enter = apply wire preview</p>
        <p>shortcut: Esc = cancel current mode / clear selection</p>
      </div>

      <hr className="sidebar-divider" />

      <div className="graph-info">
        <label>
          spacing_m:
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={spacingInput}
            onChange={(event) => {
              const nextText = event.target.value
              setSpacingInput(nextText)

              const nextValue = Number(nextText)

              if (
                nextText !== '' &&
                Number.isFinite(nextValue) &&
                nextValue > 0
              ) {
                onSpacingChange(nextValue)
              }
            }}
            onBlur={() => {
              const nextValue = Number(spacingInput)

              if (
                spacingInput === '' ||
                !Number.isFinite(nextValue) ||
                nextValue <= 0
              ) {
                setSpacingInput(String(spacingMeters))
              }
            }}
          />
        </label>
      </div>

      <hr className="sidebar-divider" />

      <div className="graph-info shortcut-info">
        <p>{message}</p>
      </div>

      <hr className="sidebar-divider" />

      <div className="graph-info">
        <p>selected_json_node_count: {selectedJsonNodeCount}</p>
        <p>selected_csv_point_count: {selectedCsvPointCount}</p>

        <pre className="selected-node-box">
          {hasSingleJsonSelection
            ? JSON.stringify(selectedNode, null, 2)
            : hasMultiJsonSelection
              ? `${selectedJsonNodeCount} JSON nodes selected.`
              : selectedCsvPointCount > 0
                ? `${selectedCsvPointCount} CSV points selected.`
                : 'No selection.'}
        </pre>
      </div>
    </aside>
  )
}