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
  return (
    <Dithering
      speed={speed}
      shape="warp"
      type="8x8"
      size={1.1}
      scale={1.67}
      colorBack="#00000000"
      colorFront={colorFront}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    />
  );
}
