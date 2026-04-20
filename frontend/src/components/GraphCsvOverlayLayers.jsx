import { useMemo } from 'react'
import { CircleMarker, Polyline } from 'react-leaflet'
import { buildCsvIndexRange } from '../lib/csvEdit'

export default function GraphCsvOverlayLayers({
  csvOverlayModels,
  activeCsvOverlayId,
  selectedCsvPointIndices,
  onSelectCsvPoint,
}) {
  const selectedCsvPointIndexSet = useMemo(
    () => new Set(selectedCsvPointIndices),
    [selectedCsvPointIndices],
  )

  const selectedCsvRangeSet = useMemo(() => {
    const selectedCsvRange =
      selectedCsvPointIndices.length >= 2
        ? buildCsvIndexRange(
            selectedCsvPointIndices[0],
            selectedCsvPointIndices[selectedCsvPointIndices.length - 1],
          )
        : selectedCsvPointIndices

    return new Set(selectedCsvRange)
  }, [selectedCsvPointIndices])

  return (
    <>
      {csvOverlayModels.map((overlay) => {
        const isActiveOverlay = overlay.id === activeCsvOverlayId

        const selectedSegmentPositions = overlay.markers
          .filter((marker) => selectedCsvRangeSet.has(marker.pointIndex))
          .map((marker) => marker.center)

        return (
          <div key={overlay.id}>
            {overlay.positions.length >= 2 && (
              <Polyline
                positions={overlay.positions}
                pathOptions={{
                  color: isActiveOverlay ? '#607d8b' : '#90a4ae',
                  weight: isActiveOverlay ? 2.5 : 2,
                  opacity: isActiveOverlay ? 0.85 : 0.45,
                }}
              />
            )}

            {isActiveOverlay && selectedSegmentPositions.length >= 2 && (
              <Polyline
                positions={selectedSegmentPositions}
                pathOptions={{
                  color: '#2f80ed',
                  weight: 4,
                  opacity: 0.95,
                }}
              />
            )}

            {overlay.markers.map((marker) => {
              const isSelected =
                isActiveOverlay &&
                selectedCsvPointIndexSet.has(marker.pointIndex)

              return (
                <CircleMarker
                  key={marker.key}
                  center={marker.center}
                  radius={isSelected ? 4 : 2.5}
                  bubblingMouseEvents={false}
                  pathOptions={{
                    color: isSelected ? '#2f80ed' : '#546e7a',
                    fillColor: isSelected ? '#2f80ed' : '#546e7a',
                    fillOpacity: isSelected ? 0.35 : 0.18,
                    opacity: isSelected ? 0.95 : 0.18,
                    weight: isSelected ? 2 : 1,
                  }}
                  eventHandlers={{
                    click: (event) =>
                      onSelectCsvPoint({
                        overlayId: overlay.id,
                        pointIndex: marker.pointIndex,
                        shiftKey: event.originalEvent.shiftKey,
                      }),
                  }}
                />
              )
            })}
          </div>
        )
      })}
    </>
  )
}