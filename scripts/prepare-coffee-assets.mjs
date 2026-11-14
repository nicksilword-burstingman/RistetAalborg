import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const directory = process.argv[2];
if (!directory) throw new Error("Supply the attachment directory.");
const source = (suffix) =>
  path.join(directory, `9ba64da1-0c11-408d-b604-5fa3a15604bd-${suffix}.png`);

async function removeBackground(filename) {
  const { data, info } = await sharp(filename)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const visited = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let tail = 0;
  let head = 0;
  const add = (pixel) => {
    if (visited[pixel]) return;
    visited[pixel] = 1;
    const offset = pixel * 4;
    const low = Math.min(data[offset], data[offset + 1], data[offset + 2]);
    const high = Math.max(data[offset], data[offset + 1], data[offset + 2]);
    if (low < 120 || high - low > 25) return;
    queue[tail++] = pixel;
  };
  for (let horizontal = 0; horizontal < width; horizontal++) {
    add(horizontal);
    add((height - 1) * width + horizontal);
  }
  for (let vertical = 0; vertical < height; vertical++) {
    add(vertical * width);
    add(vertical * width + width - 1);
  }
  while (head < tail) {
    const pixel = queue[head++];
    const horizontal = pixel % width;
    const vertical = Math.floor(pixel / width);
    const offset = pixel * 4;
    const shade = Math.min(data[offset], data[offset + 1], data[offset + 2]);
    const alpha = shade >= 245 ? 0 : Math.round((255 - shade) * 1.1);
    data[offset] = 42;
    data[offset + 1] = 32;
    data[offset + 2] = 28;
    data[offset + 3] = Math.min(160, alpha);
    if (horizontal > 0) add(pixel - 1);
    if (horizontal + 1 < width) add(pixel + 1);
    if (vertical > 0) add(pixel - width);
    if (vertical + 1 < height) add(pixel + width);
  }
  return sharp(data, { raw: { width, height, channels: 4 } })
    .png()
    .toBuffer();
}

async function main() {
  fs.mkdirSync("public/images/products", { recursive: true });
  fs.mkdirSync("public/images/origins", { recursive: true });
  for (const [coffee, suffix, espresso, filter] of [
    ["guatemala", "4a953ae6-0bf1-4bcc-b815-805b56122051", 4, 3],
    ["ethiopia", "8d2bca4e-b7e7-4005-829b-bde3cc5865d8", 3, 2],
    ["brazil", "ee1ebb67-7708-4654-9f49-ef3f7691288c", 5, 5],
  ]) {
    const transparent = await removeBackground(source(suffix));
    await sharp(transparent)
      .webp({ quality: 94 })
      .toFile(`public/images/products/${coffee}-base.webp`);
    for (const [method, level] of [
      ["espresso", espresso],
      ["filter", filter],
    ]) {
      const circles = Array.from(
        { length: level },
        (_, index) =>
          `<circle cx="${520 + index * 43.8}" cy="${coffee === "guatemala" ? 1071 : 1069}" r="13" fill="#823044"/>`,
      ).join("");
      const left = method === "espresso" ? 475 : 675;
      const mark = `<path d="M ${left - 8} 1127 l 6 6 l 12 -16" fill="none" stroke="#823044" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`;
      const overlay = Buffer.from(
        `<svg width="1024" height="1536" xmlns="http://www.w3.org/2000/svg">${circles}${mark}</svg>`,
      );
      await sharp(transparent)
        .composite([{ input: overlay }])
        .webp({ quality: 94, effort: 6 })
        .toFile(`public/images/products/${coffee}-${method}.webp`);
      console.log("Product image:", coffee, method, level);
    }
  }
  for (const [name, suffix] of [
    ["guatemala-dyrker", "c294652b-ac5e-431a-acc6-a30e9fbc4cf1"],
    ["guatemala-kaffeskov", "edaa6081-24e1-44d9-89d3-61e6f250951d"],
    ["guatemala-mennesker", "83d4f85f-3475-4756-bb20-2d7652c4b422"],
    ["ethiopia-kaffedyrker", "efb3b0a4-fa66-4a6c-8796-be8331d4e2d6"],
    ["ethiopia-kaffebaer", "10ccdb1d-385d-4adf-b398-e1690d1f427d"],
    ["ethiopia-hoest", "bacfbce9-0d06-4118-85e1-98090905ad59"],
    ["brazil-familien-dutra", "505c7267-c309-4886-b914-0794d253a53a"],
    ["brazil-kaffefarmen", "08700550-888c-4681-89e1-02f5768c7f65"],
  ]) {
    const result = await sharp(source(suffix))
      .rotate()
      .resize({ width: 1600, withoutEnlargement: true })
      .webp({ quality: 84, effort: 6 })
      .toFile(`public/images/origins/${name}.webp`);
    console.log("Origin image:", name, result.width, result.height);
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
