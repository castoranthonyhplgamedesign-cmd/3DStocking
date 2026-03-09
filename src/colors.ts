import { Color3 } from "@babylonjs/core/Maths/math.color";

const PALETTE = [
  "#FF6B6B", // coral
  "#FF8E53", // orange
  "#FEC163", // gold
  "#7BC67E", // green
  "#4ECDC4", // teal
  "#45B7D1", // sky blue
  "#6C5CE7", // purple
  "#A66CFF", // lavender
  "#FF6B9D", // pink
  "#C44569", // berry
];

export function getBlockColor(index: number): Color3 {
  const hex = PALETTE[index % PALETTE.length];
  return Color3.FromHexString(hex);
}
