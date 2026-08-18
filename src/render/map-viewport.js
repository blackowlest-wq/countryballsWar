function getDisplayOffset(viewport) {
  const offset = viewport.displayOffset || {};
  return {
    x: Number.isFinite(offset.x) ? offset.x : 0,
    y: Number.isFinite(offset.y) ? offset.y : 0,
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function screenPointFromWorld(point, viewport) {
  const centerX = viewport.width / 2;
  const centerY = viewport.height / 2;
  const x = Array.isArray(point) ? point[0] : point.x;
  const y = Array.isArray(point) ? point[1] : point.y;
  const offset = getDisplayOffset(viewport);
  return {
    x: centerX + ((x + offset.x) * viewport.width - centerX) * viewport.zoom + viewport.panX,
    y: centerY + ((y + offset.y) * viewport.height - centerY) * viewport.zoom + viewport.panY,
  };
}

export function worldPointFromScreen(x, y, viewport) {
  const centerX = viewport.width / 2;
  const centerY = viewport.height / 2;
  const offset = getDisplayOffset(viewport);
  return [
    (centerX + (x - centerX - viewport.panX) / viewport.zoom) / viewport.width - offset.x,
    (centerY + (y - centerY - viewport.panY) / viewport.zoom) / viewport.height - offset.y,
  ];
}

export function createInitialMapCamera({ map, regions = [], width, height }) {
  const viewport = map?.viewport || {};
  const minZoom = Number.isFinite(viewport.minZoom) && viewport.minZoom > 0 ? viewport.minZoom : 0.82;
  const maxZoom = Number.isFinite(viewport.maxZoom) && viewport.maxZoom >= minZoom ? viewport.maxZoom : 1.42;
  const zoom = clamp(
    Number.isFinite(viewport.initialZoom) && viewport.initialZoom > 0 ? viewport.initialZoom : 1,
    minZoom,
    maxZoom,
  );
  const camera = { zoom, panX: 0, panY: 0 };
  const focusRegion = regions.find((region) => region.id === viewport.initialFocusRegionId);
  const focusPoint = focusRegion?.interactionPoint;
  if (!Array.isArray(focusPoint) || focusPoint.length !== 2 || width <= 0 || height <= 0) return camera;

  const focusAnchor = Array.isArray(viewport.focusAnchor) && viewport.focusAnchor.length === 2
    ? viewport.focusAnchor
    : [0.5, 0.5];
  const baseScreenPoint = screenPointFromWorld(focusPoint, {
    width,
    height,
    zoom,
    panX: 0,
    panY: 0,
    displayOffset: map?.displayOffset,
  });

  return {
    zoom,
    panX: width * clamp(focusAnchor[0], 0, 1) - baseScreenPoint.x,
    panY: height * clamp(focusAnchor[1], 0, 1) - baseScreenPoint.y,
  };
}
