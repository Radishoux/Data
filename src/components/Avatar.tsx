import React from 'react';
import { View } from 'react-native';
import Svg, { Rect, G } from 'react-native-svg';

// ─── Hash ─────────────────────────────────────────────────────────────────────

function djb2(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
  }
  return Math.abs(hash);
}

// ─── Color ────────────────────────────────────────────────────────────────────

function hslToHex(h: number, s: number, l: number): string {
  const hNorm = h / 360;
  const sNorm = s / 100;
  const lNorm = l / 100;

  const hue2rgb = (p: number, q: number, t: number): number => {
    let tNorm = t;
    if (tNorm < 0) tNorm += 1;
    if (tNorm > 1) tNorm -= 1;
    if (tNorm < 1 / 6) return p + (q - p) * 6 * tNorm;
    if (tNorm < 1 / 2) return q;
    if (tNorm < 2 / 3) return p + (q - p) * (2 / 3 - tNorm) * 6;
    return p;
  };

  let r: number, g: number, b: number;

  if (sNorm === 0) {
    r = g = b = lNorm;
  } else {
    const q = lNorm < 0.5 ? lNorm * (1 + sNorm) : lNorm + sNorm - lNorm * sNorm;
    const p = 2 * lNorm - q;
    r = hue2rgb(p, q, hNorm + 1 / 3);
    g = hue2rgb(p, q, hNorm);
    b = hue2rgb(p, q, hNorm - 1 / 3);
  }

  const toHex = (x: number) =>
    Math.round(x * 255)
      .toString(16)
      .padStart(2, '0');

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// ─── Identicon Generation ─────────────────────────────────────────────────────

function generateIdenticon(userId: string): { grid: boolean[][]; hue: number } {
  const hash = djb2(userId);

  // 5x5 grid, symmetric left-right
  // Only compute 3 columns (0, 1, 2), mirror for 3, 4
  const grid: boolean[][] = [];
  for (let row = 0; row < 5; row++) {
    const rowArr: boolean[] = [];
    for (let col = 0; col < 5; col++) {
      const srcCol = col > 2 ? 4 - col : col;
      const bit = (hash >> (row * 3 + srcCol)) & 1;
      rowArr.push(bit === 1);
    }
    grid.push(rowArr);
  }

  // Extract color from hash (hue 0-359, high saturation, medium lightness)
  const hue =
    ((hash >> 16) & 0xff) + ((hash >> 8) & 0xff) + (hash & 0xff);
  const hueNorm = hue % 360;

  return { grid, hue: hueNorm };
}

// ─── Public helper ────────────────────────────────────────────────────────────

export function getAvatarColor(userId: string): string {
  const { hue } = generateIdenticon(userId);
  return hslToHex(hue, 75, 55);
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface AvatarProps {
  userId: string;
  size: number;
  borderRadius?: number;
  style?: object;
}

// ─── Component ────────────────────────────────────────────────────────────────

const Avatar: React.FC<AvatarProps> = ({
  userId,
  size,
  borderRadius,
  style,
}) => {
  const { grid, hue } = generateIdenticon(userId);
  const color = hslToHex(hue, 75, 55);
  const bg = '#1a1a1a';
  const radius = borderRadius ?? size * 0.2;
  const cellSize = size / 5;

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: radius,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Svg width={size} height={size}>
        {/* Background */}
        <Rect x={0} y={0} width={size} height={size} fill={bg} />

        {/* Grid cells */}
        <G>
          {grid.map((row, rowIdx) =>
            row.map((filled, colIdx) =>
              filled ? (
                <Rect
                  key={`${rowIdx}-${colIdx}`}
                  x={colIdx * cellSize}
                  y={rowIdx * cellSize}
                  width={cellSize}
                  height={cellSize}
                  fill={color}
                />
              ) : null
            )
          )}
        </G>
      </Svg>
    </View>
  );
};

export default Avatar;
