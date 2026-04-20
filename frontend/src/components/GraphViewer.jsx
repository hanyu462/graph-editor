import { useEffect, useRef } from 'react'
import { MapContainer, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  getCoordinateLatLng,
  getNodeLatLng,
} from '../lib/graphView'
import useGraphViewModel from '../hooks/useGraphViewModel'
import GraphMapLayers from './GraphMapLayers'

function FitGraphBounds({ graphData, csvOverlays, fitViewVersion }) {
  const map = useMap()
  const lastAppliedFitVersionRef = useRef(-1)

  useEffect(() => {
    if (!graphData || graphData.nodes.length === 0) {
      return
    }

    if (lastAppliedFitVersionRef.current === fitViewVersion) {
      return
    }

    const graphLatLngs = graphData.nodes.map((node) =>
      getNodeLatLng(node, graphData.coordinateFrame),
    )

    const overlayLatLngs = csvOverlays.flatMap((overlay) =>
      overlay.points.map((point) =>
        getCoordinateLatLng(point, graphData.coordinateFrame),
      ),
    )

    const latLngs = [...graphLatLngs, ...overlayLatLngs]
    const isWgs84 = graphData.coordinateFrame === 'wgs84'

    if (latLngs.length === 1) {
      const [lat, lng] = latLngs[0]
      const delta = isWgs84 ? 0.0001 : 1

      const bounds = L.latLngBounds(
        [lat - delta, lng - delta],
        [lat + delta, lng + delta],
      )

      map.fitBounds(bounds, { padding: [40, 40] })
      lastAppliedFitVersionRef.current = fitViewVersion
      return
    }

    const bounds = L.latLngBounds(latLngs)

    map.fitBounds(bounds, {
      padding: [40, 40],
    })

    lastAppliedFitVersionRef.current = fitViewVersion
  }, [graphData, csvOverlays, fitViewVersion, map])

  return null
}

function MapPointerTracker({ onHoverMapLatLngChange }) {
  useMapEvents({
    mousemove(event) {
      onHoverMapLatLngChange(event.latlng)
    },
  })

  return null
}

function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(event) {
      onMapClick(event.latlng)
    },
  })

  return null
}

export default function GraphViewer({
  graphData,
  csvOverlays,
  editMode,
  selectedJsonNodeIds,
  activeCsvOverlayId,
  selectedCsvPointIndices,
  linkMode,
  linkSourceNodeId,
  wireTargetNodeId,
  wireControlPointLatLng,
  onSelectJsonNode,
  onSelectCsvPoint,
  onMapClick,
  onHoverMapLatLngChange,
  fitViewVersion,
}) {
  const {
    edges,
    gridLines,
    transitionableNodeIds,
    disconnectTargetNodeIds,
    wirePreviewPositions,
    csvOverlayModels,
  } = useGraphViewModel({
    graphData,
    csvOverlays,
    selectedJsonNodeIds,
    linkMode,
    linkSourceNodeId,
    wireTargetNodeId,
    wireControlPointLatLng,
  })

  if (!graphData || graphData.nodes.length === 0) {
    return (
      <main className="viewer viewer-empty">
        <p>No graph loaded.</p>
      </main>
    )
  }

  const isWgs84 = graphData.coordinateFrame === 'wgs84'
  const mapCrs = isWgs84 ? L.CRS.EPSG3857 : L.CRS.Simple

  return (
    <main className="viewer">
      <MapContainer
        crs={mapCrs}
        center={[0, 0]}
        zoom={0}
        minZoom={-5}
        scrollWheelZoom={true}
        className={`leaflet-map ${editMode !== 'off' ? 'leaflet-map-edit' : ''}`}
      >
        <FitGraphBounds
          graphData={graphData}
          csvOverlays={csvOverlays}
          fitViewVersion={fitViewVersion}
        />

        <MapPointerTracker onHoverMapLatLngChange={onHoverMapLatLngChange} />
        <MapClickHandler onMapClick={onMapClick} />

        <GraphMapLayers
          graphData={graphData}
          isWgs84={isWgs84}
          editMode={editMode}
          gridLines={gridLines}
          linkMode={linkMode}
          selectedJsonNodeIds={selectedJsonNodeIds}
          linkSourceNodeId={linkSourceNodeId}
          wireTargetNodeId={wireTargetNodeId}
          wireControlPointLatLng={wireControlPointLatLng}
          wirePreviewPositions={wirePreviewPositions}
          csvOverlayModels={csvOverlayModels}
          activeCsvOverlayId={activeCsvOverlayId}
          selectedCsvPointIndices={selectedCsvPointIndices}
          edges={edges}
          transitionableNodeIds={transitionableNodeIds}
          disconnectTargetNodeIds={disconnectTargetNodeIds}
          onSelectJsonNode={onSelectJsonNode}
          onSelectCsvPoint={onSelectCsvPoint}
        />
      </MapContainer>
    </main>
  )
}