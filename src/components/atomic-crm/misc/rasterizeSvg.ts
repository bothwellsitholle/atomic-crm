const RASTER_SIZE = 1024;

// SVGs without width/height have no intrinsic size in Safari and Firefox,
// which breaks cropping, so read the size from the viewBox instead.
const readSvgSize = (svg: Element) => {
  const viewBox = svg
    .getAttribute("viewBox")
    ?.trim()
    .split(/[\s,]+/);
  const viewBoxWidth = Number(viewBox?.[2]);
  const viewBoxHeight = Number(viewBox?.[3]);
  if (viewBoxWidth > 0 && viewBoxHeight > 0) {
    return { width: viewBoxWidth, height: viewBoxHeight };
  }
  const width = parseFloat(svg.getAttribute("width") ?? "");
  const height = parseFloat(svg.getAttribute("height") ?? "");
  return width > 0 && height > 0 ? { width, height } : { width: 1, height: 1 };
};

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load the SVG image"));
    image.src = src;
  });

export const rasterizeSvg = async (file: Blob): Promise<string> => {
  const doc = new DOMParser().parseFromString(
    await file.text(),
    "image/svg+xml",
  );
  const svg = doc.documentElement;
  if (svg.nodeName !== "svg" || doc.querySelector("parsererror")) {
    throw new Error("Invalid SVG file");
  }

  const { width, height } = readSvgSize(svg);
  const scale = RASTER_SIZE / Math.max(width, height);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  svg.setAttribute("width", String(canvas.width));
  svg.setAttribute("height", String(canvas.height));

  const url = URL.createObjectURL(
    new Blob([new XMLSerializer().serializeToString(svg)], {
      type: "image/svg+xml",
    }),
  );
  try {
    const image = await loadImage(url);
    canvas
      .getContext("2d")
      ?.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(url);
  }
};
