import { Dithering } from "@paper-design/shaders-react";
import { useEffect, useState } from "react";

/**
 * Animated Paper Shaders Dithering overlay for the Now tiles.
 *
 * Sized 100% of its positioned wrapper. The wrapper handles `position: absolute`
 * + opacity transitions; this island just paints a WebGL canvas that fills it.
 *
 * Gotcha learned the hard way: `colorBack="transparent"` is NOT a supported
 * color format in @paper-design/shaders. The internal parser only handles
 * strings starting with `#`, `rgb`, or `hsl`. Anything else (including the
 * CSS keyword `transparent`) falls through to its fallback color, which is
 * `[0, 0, 0, 1]` — opaque black. That's why the prior attempt rendered as
 * solid black tiles. Use 8-char hex with alpha=00 instead.
 *
 * Respects prefers-reduced-motion by freezing the shader at speed=0.
 */
export default function TileShader() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return (
    <Dithering
      speed={reducedMotion ? 0 : 1.5}
      shape="warp"
      type="8x8"
      size={1.1}
      scale={1.67}
      colorFront="#FF6A3D"
      colorBack="#00000000"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        display: "block",
      }}
    />
  );
}
