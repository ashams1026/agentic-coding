import type { ReactNode } from "react";
import { createElement, Fragment } from "react";

// ANSI escape sequence regex — matches ESC[ followed by semicolon-separated numbers and 'm'
const ANSI_REGEX = /\x1b\[([\d;]*)m/g;

// Standard foreground color code → Tailwind class
const FG_COLOR_MAP: Record<number, string> = {
  30: "text-zinc-500",    // black
  31: "text-red-400",     // red
  32: "text-green-400",   // green
  33: "text-yellow-400",  // yellow
  34: "text-blue-400",    // blue
  35: "text-purple-400",  // magenta
  36: "text-cyan-400",    // cyan
  37: "text-zinc-200",    // white
};

// Bright foreground color code → Tailwind class
const BRIGHT_FG_COLOR_MAP: Record<number, string> = {
  90: "text-zinc-400",    // bright black (gray)
  91: "text-red-300",     // bright red
  92: "text-green-300",   // bright green
  93: "text-yellow-300",  // bright yellow
  94: "text-blue-300",    // bright blue
  95: "text-purple-300",  // bright magenta
  96: "text-cyan-300",    // bright cyan
  97: "text-zinc-100",    // bright white
};

// 256-color palette → nearest Tailwind class
// 0-7: standard colors, 8-15: bright, 16-231: 6x6x6 cube, 232-255: grayscale
function color256ToTailwind(n: number): string {
  if (n < 0 || n > 255) return "";

  // Standard colors (0-7)
  if (n <= 7) {
    const map: Record<number, string> = {
      0: "text-zinc-500",
      1: "text-red-400",
      2: "text-green-400",
      3: "text-yellow-400",
      4: "text-blue-400",
      5: "text-purple-400",
      6: "text-cyan-400",
      7: "text-zinc-200",
    };
    return map[n] ?? "";
  }

  // Bright colors (8-15)
  if (n <= 15) {
    const map: Record<number, string> = {
      8: "text-zinc-400",
      9: "text-red-300",
      10: "text-green-300",
      11: "text-yellow-300",
      12: "text-blue-300",
      13: "text-purple-300",
      14: "text-cyan-300",
      15: "text-zinc-100",
    };
    return map[n] ?? "";
  }

  // 6x6x6 color cube (16-231)
  if (n <= 231) {
    const idx = n - 16;
    const r = Math.floor(idx / 36);
    const g = Math.floor((idx % 36) / 6);
    const b = idx % 6;

    // Map the dominant channel to a Tailwind color
    const max = Math.max(r, g, b);
    if (max === 0) return "text-zinc-700";

    // Determine dominant hue
    if (r > g && r > b) return r >= 4 ? "text-red-300" : "text-red-400";
    if (g > r && g > b) return g >= 4 ? "text-green-300" : "text-green-400";
    if (b > r && b > g) return b >= 4 ? "text-blue-300" : "text-blue-400";
    if (r === g && r > b) return r >= 4 ? "text-yellow-300" : "text-yellow-400";
    if (r === b && r > g) return r >= 4 ? "text-purple-300" : "text-purple-400";
    if (g === b && g > r) return g >= 4 ? "text-cyan-300" : "text-cyan-400";
    // All equal — grayscale
    return max >= 4 ? "text-zinc-200" : max >= 2 ? "text-zinc-400" : "text-zinc-600";
  }

  // Grayscale ramp (232-255): 232 is darkest, 255 is lightest
  const gray = n - 232; // 0-23
  if (gray < 4) return "text-zinc-700";
  if (gray < 8) return "text-zinc-600";
  if (gray < 12) return "text-zinc-500";
  if (gray < 16) return "text-zinc-400";
  if (gray < 20) return "text-zinc-300";
  return "text-zinc-200";
}

interface StyleState {
  bold: boolean;
  dim: boolean;
  italic: boolean;
  colorClass: string;
}

function defaultStyle(): StyleState {
  return { bold: false, dim: false, italic: false, colorClass: "" };
}

function applyCode(state: StyleState, code: number, codes: number[], index: number): { state: StyleState; skip: number } {
  let skip = 0;

  if (code === 0) {
    // Reset all
    return { state: defaultStyle(), skip };
  }
  if (code === 1) {
    return { state: { ...state, bold: true }, skip };
  }
  if (code === 2) {
    return { state: { ...state, dim: true }, skip };
  }
  if (code === 3) {
    return { state: { ...state, italic: true }, skip };
  }
  if (code === 22) {
    // Reset bold and dim
    return { state: { ...state, bold: false, dim: false }, skip };
  }
  if (code === 23) {
    // Reset italic
    return { state: { ...state, italic: false }, skip };
  }
  if (code === 39) {
    // Default foreground
    return { state: { ...state, colorClass: "" }, skip };
  }

  // Standard foreground (30-37)
  if (code >= 30 && code <= 37) {
    return { state: { ...state, colorClass: FG_COLOR_MAP[code] ?? "" }, skip };
  }

  // Bright foreground (90-97)
  if (code >= 90 && code <= 97) {
    return { state: { ...state, colorClass: BRIGHT_FG_COLOR_MAP[code] ?? "" }, skip };
  }

  // 256-color foreground: 38;5;N
  if (code === 38 && codes[index + 1] === 5 && index + 2 < codes.length) {
    const colorNum = codes[index + 2] ?? 0;
    return { state: { ...state, colorClass: color256ToTailwind(colorNum) }, skip: 2 };
  }

  return { state, skip };
}

function styleToClasses(state: StyleState): string {
  const parts: string[] = [];
  if (state.bold) parts.push("font-bold");
  if (state.dim) parts.push("opacity-60");
  if (state.italic) parts.push("italic");
  if (state.colorClass) parts.push(state.colorClass);
  return parts.join(" ");
}

/**
 * Parse ANSI escape sequences and return React elements with Tailwind CSS classes.
 * If the text has no ANSI codes, returns the plain string (no wrapping).
 */
export function parseAnsi(text: string): ReactNode {
  if (!text) return text;

  // Fast path: no ANSI codes
  if (!text.includes("\x1b[")) return text;

  const segments: ReactNode[] = [];
  let style = defaultStyle();
  let lastIndex = 0;
  let spanKey = 0;

  // Reset regex state
  ANSI_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = ANSI_REGEX.exec(text)) !== null) {
    // Capture text before this escape sequence
    const before = text.slice(lastIndex, match.index);
    if (before) {
      const cls = styleToClasses(style);
      if (cls) {
        segments.push(createElement("span", { key: spanKey++, className: cls }, before));
      } else {
        segments.push(createElement(Fragment, { key: spanKey++ }, before));
      }
    }

    // Parse the codes from this escape sequence
    const rawCodes = match[1] ?? "";
    const codes: number[] = rawCodes === "" ? [0] : rawCodes.split(";").map(Number);

    let i = 0;
    while (i < codes.length) {
      const result = applyCode(style, codes[i] ?? 0, codes, i);
      style = result.state;
      i += 1 + result.skip;
    }

    lastIndex = match.index + match[0].length;
  }

  // Remaining text after last escape
  const remaining = text.slice(lastIndex);
  if (remaining) {
    const cls = styleToClasses(style);
    if (cls) {
      segments.push(createElement("span", { key: spanKey++, className: cls }, remaining));
    } else {
      segments.push(createElement(Fragment, { key: spanKey++ }, remaining));
    }
  }

  // If only one segment with no styling, return plain string
  if (segments.length === 1 && typeof segments[0] === "string") {
    return segments[0];
  }

  return createElement(Fragment, null, ...segments);
}

/**
 * Strip all ANSI escape sequences from text, returning plain text.
 * Useful for copy-to-clipboard or search/filter operations.
 */
export function stripAnsi(text: string): string {
  if (!text) return text;
  return text.replace(ANSI_REGEX, "");
}
