import { useEffect, useState } from "react";
import { Dithering } from "@paper-design/shaders-react";

/**
 * Animated dithered halftone overlay for tile containers.
 * Lifted directly from the artboard 82-0 hero on the Paper canvas:
 * <Dithering speed={2} shape="warp" type="8x8" size={1.1} scale={1.67} />
 * Recolored from the green (#00A44F) to the site's hot orange (#FF6A3D).
 *
 * Renders as an absolutely positioned fill behind tile content. Idle
 * opacity is 0; CSS hover on the parent tile fades it in via the
 * .tile-shader-layer class in the parent's scoped styles.
 *
 * Respects prefers-reduced-motion by freezing the shader (speed: 0)
 * rather than removing it — visitors still see the static dither
 * pattern on hover, just without the movement.
 */
interface Props {
  /** Lower = subtler. Higher = more visible movement. */
  speed?: number;
  /** Foreground color of the dither pattern. Default: site accent. */
  colorFront?: string;
}

export default function TileShader({
  speed = 1.5,
  colorFront = "#FF6A3D",
}: Props) {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <Dithering
      speed={reduceMotion ? 0 : speed}
      shape="warp"
      type="8x8"
      size={1.1}
      scale={1.67}
      colorBack="transparent"
      colorFront={colorFront}
      width="100%"
      height="100%"
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
      }}
    />
  );
}
