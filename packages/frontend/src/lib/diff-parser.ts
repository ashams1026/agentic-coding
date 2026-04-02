/**
 * Line-by-line diff parser using Myers' diff algorithm.
 * No external dependencies — pure TypeScript implementation.
 */

export interface DiffLine {
  type: "add" | "remove" | "context";
  content: string;
  oldLineNumber: number | null;
  newLineNumber: number | null;
}

export interface DiffResult {
  lines: DiffLine[];
  addCount: number;
  removeCount: number;
}

/**
 * Myers' diff algorithm — finds the shortest edit script (SES)
 * between two arrays of lines. Returns an array of edit operations.
 *
 * Reference: "An O(ND) Difference Algorithm" by Eugene W. Myers (1986)
 */
function myersDiff(oldLines: string[], newLines: string[]): DiffLine[] {
  const N = oldLines.length;
  const M = newLines.length;
  const MAX = N + M;

  // V[k] stores the furthest-reaching x for each diagonal k
  // We offset k by MAX so negative diagonals map to positive indices
  const V = new Int32Array(2 * MAX + 1);
  V.fill(-1);
  V[MAX + 1] = 0; // V[1] = 0

  // Store the V array at each step for backtracking
  const trace: Int32Array[] = [];

  outer:
  for (let d = 0; d <= MAX; d++) {
    trace.push(V.slice());

    for (let k = -d; k <= d; k += 2) {
      const idx = k + MAX;

      // Decide whether to move down or right
      let x: number;
      if (k === -d || (k !== d && (V[idx - 1] ?? 0) < (V[idx + 1] ?? 0))) {
        x = V[idx + 1] ?? 0; // move down (insert from new)
      } else {
        x = (V[idx - 1] ?? 0) + 1; // move right (delete from old)
      }

      let y = x - k;

      // Follow diagonal (matching lines)
      while (x < N && y < M && oldLines[x] === newLines[y]) {
        x++;
        y++;
      }

      V[idx] = x;

      if (x >= N && y >= M) {
        break outer;
      }
    }
  }

  // Backtrack to reconstruct the edit script
  const edits: Array<{ type: "add" | "remove" | "context"; oldIdx: number; newIdx: number }> = [];

  let x = N;
  let y = M;

  for (let d = trace.length - 1; d >= 0; d--) {
    const prevV = trace[d]!;
    const k = x - y;

    let prevK: number;
    if (k === -d || (k !== d && (prevV[k - 1 + MAX] ?? 0) < (prevV[k + 1 + MAX] ?? 0))) {
      prevK = k + 1; // came from above (insert)
    } else {
      prevK = k - 1; // came from left (delete)
    }

    const prevX = prevV[prevK + MAX] ?? 0;
    const prevY = prevX - prevK;

    // Diagonal moves (context lines)
    while (x > prevX && y > prevY) {
      x--;
      y--;
      edits.push({ type: "context", oldIdx: x, newIdx: y });
    }

    if (d > 0) {
      if (x === prevX) {
        // Insert (y changed, x didn't)
        y--;
        edits.push({ type: "add", oldIdx: -1, newIdx: y });
      } else {
        // Delete (x changed, y didn't)
        x--;
        edits.push({ type: "remove", oldIdx: x, newIdx: -1 });
      }
    }
  }

  edits.reverse();

  // Convert edit operations to DiffLine objects with line numbers
  let oldLineNum = 1;
  let newLineNum = 1;

  return edits.map((edit) => {
    switch (edit.type) {
      case "context":
        return {
          type: "context" as const,
          content: oldLines[edit.oldIdx] ?? "",
          oldLineNumber: oldLineNum++,
          newLineNumber: newLineNum++,
        };
      case "add":
        return {
          type: "add" as const,
          content: newLines[edit.newIdx] ?? "",
          oldLineNumber: null,
          newLineNumber: newLineNum++,
        };
      case "remove":
        return {
          type: "remove" as const,
          content: oldLines[edit.oldIdx] ?? "",
          oldLineNumber: oldLineNum++,
          newLineNumber: null,
        };
    }
  });
}

/**
 * Compute a line-by-line diff between two strings.
 *
 * Handles edge cases:
 * - Both empty → empty result
 * - oldString empty → all lines are "add" (new file)
 * - newString empty → all lines are "remove" (deletion)
 * - Identical strings → all lines are "context"
 */
export function computeDiff(oldString: string, newString: string): DiffResult {
  const safeOld = oldString ?? "";
  const safeNew = newString ?? "";

  // Both empty
  if (safeOld === "" && safeNew === "") {
    return { lines: [], addCount: 0, removeCount: 0 };
  }

  // Identical
  if (safeOld === safeNew) {
    const lines = safeOld.split("\n");
    return {
      lines: lines.map((content, i) => ({
        type: "context",
        content,
        oldLineNumber: i + 1,
        newLineNumber: i + 1,
      })),
      addCount: 0,
      removeCount: 0,
    };
  }

  const oldLines = safeOld === "" ? [] : safeOld.split("\n");
  const newLines = safeNew === "" ? [] : safeNew.split("\n");

  // New file — all adds
  if (oldLines.length === 0) {
    return {
      lines: newLines.map((content, i) => ({
        type: "add",
        content,
        oldLineNumber: null,
        newLineNumber: i + 1,
      })),
      addCount: newLines.length,
      removeCount: 0,
    };
  }

  // Deletion — all removes
  if (newLines.length === 0) {
    return {
      lines: oldLines.map((content, i) => ({
        type: "remove",
        content,
        oldLineNumber: i + 1,
        newLineNumber: null,
      })),
      addCount: 0,
      removeCount: oldLines.length,
    };
  }

  // General case: Myers' diff
  const lines = myersDiff(oldLines, newLines);
  let addCount = 0;
  let removeCount = 0;

  for (const line of lines) {
    if (line.type === "add") addCount++;
    else if (line.type === "remove") removeCount++;
  }

  return { lines, addCount, removeCount };
}

/**
 * Format a DiffResult as a unified-diff-style text string.
 * Useful for clipboard copy.
 *
 * Output format:
 *   - removed line
 *   + added line
 *     context line
 */
export function formatDiffText(result: DiffResult): string {
  return result.lines
    .map((line) => {
      switch (line.type) {
        case "add":
          return `+ ${line.content}`;
        case "remove":
          return `- ${line.content}`;
        case "context":
          return `  ${line.content}`;
      }
    })
    .join("\n");
}
