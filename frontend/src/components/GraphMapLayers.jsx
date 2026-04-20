import { useMemo } from 'react'
import { CircleMarker, Polyline } from 'react-leaflet'
import { getNodeLatLng } from '../lib/graphView'
import GraphGridLayers from './GraphGridLayers'
import GraphCsvOverlayLayers from './GraphCsvOverlayLayers'

const NODE_STYLE = {
  default: {
    color: '#7a7a7a',
    fillColor: '#7a7a7a',
    fillOpacity: 0.12,
    weight: 2,
    radius: 5,
  },
  selected: {
    color: '#2f80ed',
    fillColor: '#2f80ed',
    fillOpacity: 0.28,
    weight: 2,
    radius: 5,
  },
  transitionable: {
    color: '#56a3ff',
    fillColor: '#56a3ff',
    fillOpacity: 0.22,
    weight: 2,
    radius: 5,
  },
  linkSource: {
    color: '#f59e0b',
    fillColor: '#f59e0b',
    fillOpacity: 0.3,
    weight: 2,
    radius: 5,
  },
  disconnectTarget: {
    color: '#ef4444',
    fillColor: '#ef4444',
    fillOpacity: 0.22,
    weight: 2,
    radius: 5,
  },
  wireTarget: {
    color: '#10b981',
    fillColor: '#10b981',
    fillOpacity: 0.28,
    weight: 2,
    radius: 5,
  },
}

const EDGE_STYLE = {
  default: {
    color: '#a0a0a0',
    weight: 2,
    opacity: 0.55,
  },
  highlighted: {
    color: '#2f80ed',
    weight: 3,
    opacity: 1,
  },
  disconnect: {
    color: '#ef4444',
    weight: 3,
    opacity: 1,
  },
  multiSelected: {
    color: '#2f80ed',
    weight: 3,
    opacity: 0.9,
  },
}

function getNodeStyle({
  nodeId,
  selectedJsonNodeIdSet,
  linkMode,
  linkSourceNodeId,
  wireTargetNodeId,
  transitionableNodeIds,
  disconnectTargetNodeIds,
}) {
  const isLinkSource = nodeId === linkSourceNodeId
  const isSelected = selectedJsonNodeIdSet.has(nodeId)
  const isTransitionable = transitionableNodeIds.has(nodeId)
  const isDisconnectTarget =
    linkMode === 'disconnect' && disconnectTargetNodeIds.has(nodeId)
  const isWireTarget = linkMode === 'wire' && nodeId === wireTargetNodeId

  if (isLinkSource) {
    return NODE_STYLE.linkSource
  }

  if (isWireTarget) {
    return NODE_STYLE.wireTarget
  }

  if (isDisconnectTarget) {
    return NODE_STYLE.disconnectTarget
  }

  if (isSelected) {
    return NODE_STYLE.selected
  }

  if (linkMode !== 'disconnect' && isTransitionable) {
    return NODE_STYLE.transitionable
  }

  return NODE_STYLE.default
}

function getEdgeStyle({
  edge,
  linkMode,
  primarySelectedJsonNodeId,
  selectedJsonNodeIdSet,
  linkSourceNodeId,
  transitionableNodeIds,
  disconnectTargetNodeIds,
}) {
  const isConnectHighlighted =
    linkMode !== 'disconnect' &&
    primarySelectedJsonNodeId !== null &&
    ((edge.fromNode.id === primarySelectedJsonNodeId &&
      transitionableNodeIds.has(edge.toNode.id)) ||
      (edge.toNode.id === primarySelectedJsonNodeId &&
        transitionableNodeIds.has(edge.fromNode.id)))

  const isDisconnectHighlighted =
    linkMode === 'disconnect' &&
    linkSourceNodeId !== null &&
    ((edge.fromNode.id === linkSourceNodeId &&
      disconnectTargetNodeIds.has(edge.toNode.id)) ||
      (edge.toNode.id === linkSourceNodeId &&
        disconnectTargetNodeIds.has(edge.fromNode.id)))

  const isMultiSelectedEdge =
    selectedJsonNodeIdSet.size >= 2 &&
    selectedJsonNodeIdSet.has(edge.fromNode.id) &&
    selectedJsonNodeIdSet.has(edge.toNode.id)

  if (isDisconnectHighlighted) {
    return EDGE_STYLE.disconnect
  }

  if (isConnectHighlighted) {
    return EDGE_STYLE.highlighted
  }

  if (isMultiSelectedEdge) {
    return EDGE_STYLE.multiSelected
  }

  return EDGE_STYLE.default
}

export default function GraphMapLayers({
  graphData,
  isWgs84,
  editMode,
  gridLines,
  linkMode,
  selectedJsonNodeIds,
  linkSourceNodeId,
  wireTargetNodeId,
  wireControlPointLatLng,
  wirePreviewPositions,
  csvOverlayModels,
  activeCsvOverlayId,
  selectedCsvPointIndices,
  edges,
  transitionableNodeIds,
  disconnectTargetNodeIds,
  onSelectJsonNode,
  onSelectCsvPoint,
}) {
  const selectedJsonNodeIdSet = useMemo(
    () => new Set(selectedJsonNodeIds),
    [selectedJsonNodeIds],
  )

  const primarySelectedJsonNodeId =
    selectedJsonNodeIds.length === 1 ? selectedJsonNodeIds[0] : null

  return (
    <>
      <GraphGridLayers isWgs84={isWgs84} gridLines={gridLines} />

      <GraphCsvOverlayLayers
        csvOverlayModels={csvOverlayModels}
        activeCsvOverlayId={activeCsvOverlayId}
        selectedCsvPointIndices={selectedCsvPointIndices}
        onSelectCsvPoint={onSelectCsvPoint}
      />

      {linkMode === 'wire' && wirePreviewPositions.length >= 2 && (
        <Polyline
          positions={wirePreviewPositions}
          pathOptions={{
            color: '#f59e0b',
            weight: 2,
            opacity: 0.9,
            dashArray: '8 8',
          }}
        />
      )}

      {linkMode === 'wire' && wireControlPointLatLng && (
        <CircleMarker
          center={[wireControlPointLatLng.lat, wireControlPointLatLng.lng]}
          radius={4}
          pathOptions={{
            color: '#f59e0b',
            fillColor: '#f59e0b',
            fillOpacity: 0.35,
            weight: 2,
          }}
        />
      )}

      {edges.map((edge) => (
        <Polyline
          key={edge.key}
          positions={[
            getNodeLatLng(edge.fromNode, graphData.coordinateFrame),
            getNodeLatLng(edge.toNode, graphData.coordinateFrame),
          ]}
          pathOptions={getEdgeStyle({
            edge,
            linkMode,
            primarySelectedJsonNodeId,
            selectedJsonNodeIdSet,
            linkSourceNodeId,
            transitionableNodeIds,
            disconnectTargetNodeIds,
          })}
        />
      ))}

      {graphData.nodes.map((node) => {
        const style = getNodeStyle({
          nodeId: node.id,
          selectedJsonNodeIdSet,
          linkMode,
          linkSourceNodeId,
          wireTargetNodeId,
          transitionableNodeIds,
          disconnectTargetNodeIds,
        })

        return (
          <CircleMarker
            key={node.id}
            center={getNodeLatLng(node, graphData.coordinateFrame)}
            radius={style.radius}
            bubblingMouseEvents={false}
            pathOptions={{
              color: style.color,
              fillColor: style.fillColor,
              fillOpacity: style.fillOpacity,
              weight: style.weight,
              opacity: editMode === 'csv' ? 0.55 : 1,
            }}
            eventHandlers={{
              click: (event) =>
                onSelectJsonNode({
                  nodeId: node.id,
                  shiftKey: event.originalEvent.shiftKey,
                }),
            }}
          />
        )
      })}
    </>
  )
}