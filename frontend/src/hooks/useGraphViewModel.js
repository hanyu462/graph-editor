import { useMemo } from 'react'
import {
  buildEdges,
  buildGridLines,
  getCoordinateLatLng,
} from '../lib/graphView'
import { buildWirePreviewPositions } from '../lib/wire'

export default function useGraphViewModel({
  graphData,
  csvOverlays,
  selectedJsonNodeIds,
  linkMode,
  linkSourceNodeId,
  wireTargetNodeId,
  wireControlPointLatLng,
}) {
  const primarySelectedJsonNodeId =
    selectedJsonNodeIds.length === 1 ? selectedJsonNodeIds[0] : null

  const edges = useMemo(() => {
    if (!graphData) {
      return []
    }

    return buildEdges(graphData)
  }, [graphData])

  const selectedNode = useMemo(() => {
    if (!graphData || primarySelectedJsonNodeId === null) {
      return null
    }

    return (
      graphData.nodes.find((node) => node.id === primarySelectedJsonNodeId) ??
      null
    )
  }, [graphData, primarySelectedJsonNodeId])

  const linkSourceNode = useMemo(() => {
    if (!graphData || linkSourceNodeId === null) {
      return null
    }

    return graphData.nodes.find((node) => node.id === linkSourceNodeId) ?? null
  }, [graphData, linkSourceNodeId])

  const disconnectTargetNodeIds = useMemo(() => {
    if (linkMode !== 'disconnect' || !linkSourceNode) {
      return new Set()
    }

    return new Set(linkSourceNode.transitions)
  }, [linkMode, linkSourceNode])

  const transitionableNodeIds = useMemo(() => {
    if (!selectedNode) {
      return new Set()
    }

    return new Set(selectedNode.transitions)
  }, [selectedNode])

  const allPoints = useMemo(() => {
    if (!graphData) {
      return []
    }

    return [
      ...graphData.nodes,
      ...csvOverlays.flatMap((overlay) => overlay.points),
    ]
  }, [graphData, csvOverlays])

  const gridLines = useMemo(() => {
    if (!graphData || allPoints.length === 0) {
      return {
        verticalLines: [],
        horizontalLines: [],
        xLabels: [],
        yLabels: [],
      }
    }

    return buildGridLines(allPoints, graphData.coordinateFrame)
  }, [graphData, allPoints])

  const wireSourceNode = useMemo(() => {
    if (!graphData || linkMode !== 'wire' || linkSourceNodeId === null) {
      return null
    }

    return graphData.nodes.find((node) => node.id === linkSourceNodeId) ?? null
  }, [graphData, linkMode, linkSourceNodeId])

  const wireTargetNode = useMemo(() => {
    if (!graphData || linkMode !== 'wire' || wireTargetNodeId === null) {
      return null
    }

    return graphData.nodes.find((node) => node.id === wireTargetNodeId) ?? null
  }, [graphData, linkMode, wireTargetNodeId])

  const wirePreviewPositions = useMemo(() => {
    return buildWirePreviewPositions({
      sourceNode: wireSourceNode,
      targetNode: wireTargetNode,
      controlPointLatLng: wireControlPointLatLng,
      coordinateFrame: graphData?.coordinateFrame,
      sampleCount: 40,
    })
  }, [graphData, wireSourceNode, wireTargetNode, wireControlPointLatLng])

  const csvOverlayModels = useMemo(() => {
    if (!graphData) {
      return []
    }

    return csvOverlays.map((overlay) => ({
      id: overlay.id,
      name: overlay.name,
      positions: overlay.points.map((point) =>
        getCoordinateLatLng(point, graphData.coordinateFrame),
      ),
      markers: overlay.points.map((point, pointIndex) => ({
        key: `${overlay.id}-${point.id}`,
        pointIndex,
        center: getCoordinateLatLng(point, graphData.coordinateFrame),
      })),
    }))
  }, [graphData, csvOverlays])

  return {
    edges,
    gridLines,
    transitionableNodeIds,
    disconnectTargetNodeIds,
    wirePreviewPositions,
    csvOverlayModels,
  }
}