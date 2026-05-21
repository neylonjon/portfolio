import { readFileSync, writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";

const svg = readFileSync(new URL("../public/og.svg", import.meta.url));
const resvg = new Resvg(svg, {
  background: "#FAFAF7",
  fitTo: { mode: "width", value: 1200 },
  font: {
    loadSystemFonts: true,
    defaultFontFamily: "Inter",
  },
});
const png = resvg.render().asPng();
writeFileSync(new URL("../public/og.png", import.meta.url), png);
console.log(`og.png written (${png.length} bytes)`);
