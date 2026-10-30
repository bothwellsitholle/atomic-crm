import { rasterizeSvg } from "./rasterizeSvg";

const svgFile = (markup: string) =>
  new Blob([markup], { type: "image/svg+xml" });

const imageSize = (src: string) =>
  new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = new Image();
    image.onload = () =>
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = reject;
    image.src = src;
  });

describe("rasterizeSvg", () => {
  it("sizes an SVG that only has a viewBox from its viewBox", async () => {
    const png = await rasterizeSvg(
      svgFile(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100"><rect width="200" height="100" fill="#2563eb"/></svg>',
      ),
    );

    expect(png).toMatch(/^data:image\/png;base64,/);
    expect(await imageSize(png)).toEqual({ width: 1024, height: 512 });
  });

  it("falls back to the width and height attributes", async () => {
    const png = await rasterizeSvg(
      svgFile(
        '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="96"><rect width="48" height="96"/></svg>',
      ),
    );

    expect(await imageSize(png)).toEqual({ width: 512, height: 1024 });
  });

  it("rejects a file that is not an SVG", async () => {
    await expect(rasterizeSvg(svgFile("<html><body/></html>"))).rejects.toThrow(
      "Invalid SVG file",
    );
  });
});
