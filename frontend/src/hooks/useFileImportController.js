import { useCallback } from 'react'
import { importFile } from '../lib/fileImport'
import { normalizeGraph } from '../lib/graph'
import { parseCsvOverlay } from '../lib/csv'

export default function useFileImportController({
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
}) {
  const handleAddFile = useCallback(
    async (file) => {
      try {
        const importedFile = await importFile(file)

        setFileName(importedFile.fileName)
        setFileType(importedFile.fileType)

        if (importedFile.fileType === 'json') {
          const graph = normalizeGraph(importedFile.parsedData)

          setGraphData(graph)
          setGraphFileName(importedFile.fileName)
          setCsvOverlays([])
          clearAllSelections()
          cancelLinkMode()
          setFitViewVersion((previous) => previous + 1)
          setMessage(`JSON graph loaded: ${importedFile.fileName}`)
          setPreview(
            `graph_id: ${graph.graphId}\ncoordinate_frame: ${graph.coordinateFrame}\nnodes: ${graph.nodes.length}`,
          )
          return
        }

        if (importedFile.fileType === 'csv') {
          if (!graphData) {
            throw new Error('Load a graph JSON before adding a CSV overlay.')
          }

          const points = parseCsvOverlay(
            importedFile.text,
            graphData.coordinateFrame,
          )

          const overlayId = `${Date.now()}-${importedFile.fileName}`

          setCsvOverlays((previous) => [
            ...previous,
            {
              id: overlayId,
              name: importedFile.fileName,
              points,
            },
          ])

          setActiveCsvOverlayId(overlayId)
          clearCsvSelection()
          setFitViewVersion((previous) => previous + 1)
          setMessage(`CSV overlay added: ${importedFile.fileName}`)
          setPreview(`csv_points: ${points.length}`)
        }
      } catch (error) {
        setMessage(error.message ?? 'Failed to import file.')
      }
    },
    [
      cancelLinkMode,
      clearAllSelections,
      clearCsvSelection,
      graphData,
      setActiveCsvOverlayId,
      setCsvOverlays,
      setFileName,
      setFileType,
      setFitViewVersion,
      setGraphData,
      setGraphFileName,
      setMessage,
      setPreview,
    ],
  )

  return {
    handleAddFile,
  }
}