import { useMemo } from 'react'
import { Marker, Polyline } from 'react-leaflet'
import L from 'leaflet'

const GRID_STYLE = {
  color: '#b8c2cc',
  weight: 1,
  opacity: 0.9,
}

const AXIS_STYLE = {
  color: '#8a94a6',
  weight: 1.5,
  opacity: 1,
}

function createAxisLabelIcon(text) {
  return L.divIcon({
    className: 'axis-label',
    html: `<div>${text}</div>`,
    iconSize: [0, 0],
  })
}

export default function GraphGridLayers({ isWgs84, gridLines }) {
  const xLabelIcons = useMemo(
    () =>
      gridLines.xLabels.map((label) => ({
        key: label.key,
        position: label.position,
        icon: createAxisLabelIcon(label.value),
      })),
    [gridLines.xLabels],
  )

  const yLabelIcons = useMemo(
    () =>
      gridLines.yLabels.map((label) => ({
        key: label.key,
        position: label.position,
        icon: createAxisLabelIcon(label.value),
      })),
    [gridLines.yLabels],
  )

  return (
    <>
      {gridLines.verticalLines.map((line) => (
        <Polyline
          key={line.key}
          positions={line.positions}
          pathOptions={line.value === 0 ? AXIS_STYLE : GRID_STYLE}
        />
      ))}

      {gridLines.horizontalLines.map((line) => (
        <Polyline
          key={line.key}
          positions={line.positions}
          pathOptions={line.value === 0 ? AXIS_STYLE : GRID_STYLE}
        />
      ))}

      {!isWgs84 &&
        xLabelIcons.map((label) => (
          <Marker
            key={label.key}
            position={label.position}
            icon={label.icon}
            interactive={false}
          />
        ))}

      {!isWgs84 &&
        yLabelIcons.map((label) => (
          <Marker
            key={label.key}
            position={label.position}
            icon={label.icon}
            interactive={false}
          />
        ))}
    </>
  )
}