function getDisplayOffset(viewport) {
  const offset = viewport.displayOffset || {};
  return {
    x: Number.isFinite(offset.x) ? offset.x : 0,
    y: Number.isFinite(offset.y) ? offset.y : 0,
  };
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
