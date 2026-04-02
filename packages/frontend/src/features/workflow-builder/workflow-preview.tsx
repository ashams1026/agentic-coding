import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { StateCardData } from "./state-card";

// ── Types ───────────────────────────────────────────────────────

interface WorkflowPreviewProps {
  states: StateCardData[];
  className?: string;
}

interface PositionedState {
  state: StateCardData;
  col: number;
  row: number;
}

// ── Layout helpers ──────────────────────────────────────────────

function layoutStates(states: StateCardData[]): PositionedState[] {
  if (states.length === 0) return [];

  // Group by type: initial → intermediate → terminal (horizontal flow)
  const initial = states.filter((s) => s.type === "initial").sort((a, b) => a.sortOrder - b.sortOrder);
  const intermediate = states.filter((s) => s.type === "intermediate").sort((a, b) => a.sortOrder - b.sortOrder);
  const terminal = states.filter((s) => s.type === "terminal").sort((a, b) => a.sortOrder - b.sortOrder);

  const positioned: PositionedState[] = [];
  let col = 0;

  // Initial states in column 0
  initial.forEach((state, row) => {
    positioned.push({ state, col: 0, row });
  });
  if (initial.length > 0) col = 1;

  // Intermediate states spread across middle columns
  intermediate.forEach((state, i) => {
    positioned.push({ state, col: col + i, row: 0 });
  });
  if (intermediate.length > 0) col += intermediate.length;

  // Terminal states in last column
  terminal.forEach((state, row) => {
    positioned.push({ state, col, row });
  });

  return positioned;
}

// ── Arrow SVG between two nodes ─────────────────────────────────

function TransitionArrow({
  fromCol,
  fromRow,
  toCol,
  toRow,
  color,
  label,
  nodeWidth,
  nodeHeight,
  gapX,
  gapY,
}: {
  fromCol: number;
  fromRow: number;
  toCol: number;
  toRow: number;
  color: string;
  label: string;
  nodeWidth: number;
  nodeHeight: number;
  gapX: number;
  gapY: number;
}) {
  const x1 = fromCol * (nodeWidth + gapX) + nodeWidth;
  const y1 = fromRow * (nodeHeight + gapY) + nodeHeight / 2;
  const x2 = toCol * (nodeWidth + gapX);
  const y2 = toRow * (nodeHeight + gapY) + nodeHeight / 2;

  // Determine path — simple horizontal or curved
  const midX = (x1 + x2) / 2;
  const path =
    fromRow === toRow
      ? `M ${x1} ${y1} L ${x2} ${y2}`
      : `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;

  const labelX = (x1 + x2) / 2;
  const labelY = (y1 + y2) / 2 - 6;

  return (
    <g>
      <path d={path} stroke={color} strokeWidth={1.5} fill="none" strokeOpacity={0.5} markerEnd="url(#arrowhead)" />
      {label && (
        <text x={labelX} y={labelY} textAnchor="middle" className="fill-muted-foreground text-[9px]">
          {label}
        </text>
      )}
    </g>
  );
}

// ── State node ──────────────────────────────────────────────────

function StateNode({
  state,
  col,
  row,
  nodeWidth,
  nodeHeight,
  gapX,
  gapY,
}: {
  state: StateCardData;
  col: number;
  row: number;
  nodeWidth: number;
  nodeHeight: number;
  gapX: number;
  gapY: number;
}) {
  const x = col * (nodeWidth + gapX);
  const y = row * (nodeHeight + gapY);
  const rx = 8;

  const typeLabel = state.type === "initial" ? "start" : state.type === "terminal" ? "end" : "";

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={nodeWidth}
        height={nodeHeight}
        rx={rx}
        fill={state.color + "20"}
        stroke={state.color}
        strokeWidth={1.5}
      />
      {/* Color dot */}
      <circle cx={x + 12} cy={y + nodeHeight / 2} r={4} fill={state.color} />
      {/* State name */}
      <text
        x={x + 22}
        y={y + nodeHeight / 2 + 1}
        dominantBaseline="middle"
        className="fill-foreground text-[11px] font-medium"
      >
        {state.name || "Untitled"}
      </text>
      {/* Type badge */}
      {typeLabel && (
        <text
          x={x + nodeWidth - 8}
          y={y + nodeHeight / 2 + 1}
          textAnchor="end"
          dominantBaseline="middle"
          className="fill-muted-foreground text-[8px] uppercase tracking-wider"
        >
          {typeLabel}
        </text>
      )}
    </g>
  );
}

// ── Main component ──────────────────────────────────────────────

export function WorkflowPreview({ states, className }: WorkflowPreviewProps) {
  const NODE_W = 140;
  const NODE_H = 40;
  const GAP_X = 60;
  const GAP_Y = 20;

  const positioned = useMemo(() => layoutStates(states), [states]);

  // Build a lookup: stateId → position
  const posMap = useMemo(() => {
    const map = new Map<string, { col: number; row: number }>();
    positioned.forEach((p) => map.set(p.state.id, { col: p.col, row: p.row }));
    return map;
  }, [positioned]);

  // Collect all transitions with positions
  const arrows = useMemo(() => {
    const result: {
      fromCol: number;
      fromRow: number;
      toCol: number;
      toRow: number;
      color: string;
      label: string;
      key: string;
    }[] = [];

    for (const p of positioned) {
      for (const t of p.state.transitions) {
        const target = posMap.get(t.toStateId);
        if (!target) continue;
        result.push({
          fromCol: p.col,
          fromRow: p.row,
          toCol: target.col,
          toRow: target.row,
          color: p.state.color,
          label: t.label,
          key: `${p.state.id}-${t.id}`,
        });
      }
    }
    return result;
  }, [positioned, posMap]);

  // Compute SVG dimensions
  const maxCol = positioned.reduce((max, p) => Math.max(max, p.col), 0);
  const maxRow = positioned.reduce((max, p) => Math.max(max, p.row), 0);
  const svgWidth = (maxCol + 1) * (NODE_W + GAP_X) - GAP_X + 24;
  const svgHeight = (maxRow + 1) * (NODE_H + GAP_Y) - GAP_Y + 24;

  if (states.length === 0) {
    return (
      <div className={cn("flex items-center justify-center rounded-lg border border-dashed bg-muted/20 p-8", className)}>
        <p className="text-xs text-muted-foreground">No states defined yet. Add states in the left panel.</p>
      </div>
    );
  }

  return (
    <div className={cn("rounded-lg border bg-card overflow-auto p-3", className)}>
      <svg width={svgWidth} height={svgHeight} className="select-none" style={{ minWidth: svgWidth, minHeight: svgHeight }}>
        <defs>
          <marker
            id="arrowhead"
            markerWidth="8"
            markerHeight="6"
            refX="7"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M 0 0 L 8 3 L 0 6 Z" className="fill-muted-foreground" fillOpacity={0.5} />
          </marker>
        </defs>

        {/* Render arrows behind nodes */}
        {arrows.map((a) => (
          <TransitionArrow
            key={a.key}
            fromCol={a.fromCol}
            fromRow={a.fromRow}
            toCol={a.toCol}
            toRow={a.toRow}
            color={a.color}
            label={a.label}
            nodeWidth={NODE_W}
            nodeHeight={NODE_H}
            gapX={GAP_X}
            gapY={GAP_Y}
          />
        ))}

        {/* Render state nodes */}
        {positioned.map((p) => (
          <StateNode
            key={p.state.id}
            state={p.state}
            col={p.col}
            row={p.row}
            nodeWidth={NODE_W}
            nodeHeight={NODE_H}
            gapX={GAP_X}
            gapY={GAP_Y}
          />
        ))}
      </svg>
    </div>
  );
}
