import { useState, useMemo, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import type { Workflow, WorkflowState, WorkflowTransition } from "@agentops/shared";

// ── Layout constants ─────────────────────────────────────────────

const NODE_W = 140;
const NODE_H = 56;
const H_GAP = 200; // horizontal gap between levels
const V_GAP = 100; // vertical gap between nodes at same level
const PADDING = 60; // canvas padding

// ── Position type ────────────────────────────────────────────────

interface Position {
  x: number;
  y: number;
}

// ── BFS-based layout algorithm ───────────────────────────────────

function computeLayout(workflow: Workflow): Map<string, Position> {
  const { states, transitions, initialState } = workflow;
  const positions = new Map<string, Position>();

  if (states.length === 0) return positions;

  // Build adjacency list (forward edges only for level assignment)
  const forwardAdj = new Map<string, string[]>();
  for (const s of states) forwardAdj.set(s.name, []);
  for (const t of transitions) {
    forwardAdj.get(t.from)?.push(t.to);
  }

  // BFS from initial state to assign levels
  const levels = new Map<string, number>();
  const queue: string[] = [initialState];
  levels.set(initialState, 0);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentLevel = levels.get(current)!;
    for (const next of forwardAdj.get(current) ?? []) {
      if (!levels.has(next)) {
        levels.set(next, currentLevel + 1);
        queue.push(next);
      }
    }
  }

  // Assign levels to any unreachable states
  let maxLevel = 0;
  for (const [, lvl] of levels) {
    if (lvl > maxLevel) maxLevel = lvl;
  }
  for (const s of states) {
    if (!levels.has(s.name)) {
      maxLevel++;
      levels.set(s.name, maxLevel);
    }
  }

  // Group states by level
  const levelGroups = new Map<number, string[]>();
  for (const [name, level] of levels) {
    if (!levelGroups.has(level)) levelGroups.set(level, []);
    levelGroups.get(level)!.push(name);
  }

  // Position each state
  for (const [level, group] of levelGroups) {
    const totalHeight = group.length * NODE_H + (group.length - 1) * V_GAP;
    const startY = -totalHeight / 2;
    for (let i = 0; i < group.length; i++) {
      positions.set(group[i]!, {
        x: PADDING + level * (NODE_W + H_GAP),
        y: PADDING + 300 + startY + i * (NODE_H + V_GAP), // center vertically with 300 offset
      });
    }
  }

  return positions;
}

// ── Arrow path computation ───────────────────────────────────────

function computeArrowPath(
  from: Position,
  to: Position,
  isBackward: boolean,
): string {
  const fromCenterX = from.x + NODE_W / 2;
  const fromCenterY = from.y + NODE_H / 2;
  const toCenterX = to.x + NODE_W / 2;
  const toCenterY = to.y + NODE_H / 2;

  // Determine connection points
  let startX: number, startY: number, endX: number, endY: number;

  if (isBackward) {
    // Backward arrow: go from bottom of source, curve around, to top of target
    startX = fromCenterX;
    startY = from.y + NODE_H;
    endX = toCenterX;
    endY = to.y + NODE_H;

    const curveOffset = 40 + Math.abs(fromCenterX - toCenterX) * 0.15;
    return `M ${startX} ${startY} C ${startX} ${startY + curveOffset}, ${endX} ${endY + curveOffset}, ${endX} ${endY}`;
  }

  // Forward arrow: right side of source → left side of target
  startX = from.x + NODE_W;
  startY = fromCenterY;
  endX = to.x;
  endY = toCenterY;

  // Slight vertical offset when multiple transitions between same levels
  const dx = endX - startX;
  const dy = endY - startY;
  const cpOffset = Math.max(40, Math.abs(dx) * 0.3);

  return `M ${startX} ${startY} C ${startX + cpOffset} ${startY + dy * 0.1}, ${endX - cpOffset} ${endY - dy * 0.1}, ${endX} ${endY}`;
}

function getArrowheadAngle(path: string): { x: number; y: number; angle: number } {
  // Parse last control point and end point from cubic bezier
  const parts = path.match(/C\s+([\d.-]+)\s+([\d.-]+),\s*([\d.-]+)\s+([\d.-]+),\s*([\d.-]+)\s+([\d.-]+)/);
  if (!parts) return { x: 0, y: 0, angle: 0 };

  const cp2x = parseFloat(parts[3]!);
  const cp2y = parseFloat(parts[4]!);
  const endX = parseFloat(parts[5]!);
  const endY = parseFloat(parts[6]!);

  const angle = Math.atan2(endY - cp2y, endX - cp2x) * (180 / Math.PI);
  return { x: endX, y: endY, angle };
}

// ── StateNode component ──────────────────────────────────────────

interface StateNodeProps {
  state: WorkflowState;
  position: Position;
  isSelected: boolean;
  onDragStart: (name: string, e: React.MouseEvent) => void;
  onClick: (name: string) => void;
}

function StateNode({ state, position, isSelected, onDragStart, onClick }: StateNodeProps) {
  const mouseDownPos = useRef<{ x: number; y: number } | null>(null);

  return (
    <g
      transform={`translate(${position.x}, ${position.y})`}
      className="cursor-grab active:cursor-grabbing"
      onMouseDown={(e) => {
        mouseDownPos.current = { x: e.clientX, y: e.clientY };
        onDragStart(state.name, e);
      }}
      onMouseUp={(e) => {
        // Only fire click if mouse didn't move (not a drag)
        if (mouseDownPos.current) {
          const dx = Math.abs(e.clientX - mouseDownPos.current.x);
          const dy = Math.abs(e.clientY - mouseDownPos.current.y);
          if (dx < 5 && dy < 5) {
            onClick(state.name);
          }
        }
        mouseDownPos.current = null;
      }}
    >
      {/* Selection highlight */}
      {isSelected && (
        <rect
          x={-4}
          y={-4}
          width={NODE_W + 8}
          height={NODE_H + 8}
          rx={13}
          ry={13}
          fill="none"
          className="stroke-ring"
          strokeWidth={2}
          strokeDasharray="4 2"
        />
      )}

      {/* Initial state indicator: filled circle to the left */}
      {state.isInitial && (
        <circle
          cx={-14}
          cy={NODE_H / 2}
          r={6}
          fill={state.color}
          stroke={state.color}
          strokeWidth={2}
        />
      )}

      {/* State rectangle */}
      <rect
        width={NODE_W}
        height={NODE_H}
        rx={10}
        ry={10}
        fill="var(--color-card)"
        stroke={state.color}
        strokeWidth={state.isFinal ? 3 : 2}
        className="transition-colors"
      />

      {/* Final state indicator: inner border (double border effect) */}
      {state.isFinal && (
        <rect
          x={4}
          y={4}
          width={NODE_W - 8}
          height={NODE_H - 8}
          rx={7}
          ry={7}
          fill="none"
          stroke={state.color}
          strokeWidth={1.5}
          opacity={0.5}
        />
      )}

      {/* Color indicator bar at top */}
      <rect
        x={1}
        y={1}
        width={NODE_W - 2}
        height={4}
        rx={10}
        fill={state.color}
      />

      {/* State name */}
      <text
        x={NODE_W / 2}
        y={NODE_H / 2 + 4}
        textAnchor="middle"
        className="fill-foreground text-xs font-medium select-none pointer-events-none"
      >
        {state.name}
      </text>

      {/* Entry/exit indicators */}
      <g className="opacity-60">
        {state.isInitial && (
          <text
            x={NODE_W / 2}
            y={NODE_H - 6}
            textAnchor="middle"
            className="fill-muted-foreground select-none pointer-events-none"
            style={{ fontSize: "8px" }}
          >
            entry
          </text>
        )}
        {state.isFinal && (
          <text
            x={NODE_W / 2}
            y={NODE_H - 6}
            textAnchor="middle"
            className="fill-muted-foreground select-none pointer-events-none"
            style={{ fontSize: "8px" }}
          >
            exit
          </text>
        )}
      </g>
    </g>
  );
}

// ── TransitionArrow component ────────────────────────────────────

/** Unique key for a transition */
export function transitionKey(t: WorkflowTransition): string {
  return `${t.from}→${t.to}→${t.name}`;
}

interface TransitionArrowProps {
  transition: WorkflowTransition;
  fromPos: Position;
  toPos: Position;
  isBackward: boolean;
  isSelected: boolean;
  onClick: (t: WorkflowTransition) => void;
}

function TransitionArrow({ transition, fromPos, toPos, isBackward, isSelected, onClick }: TransitionArrowProps) {
  const path = computeArrowPath(fromPos, toPos, isBackward);
  const { x: tipX, y: tipY, angle } = getArrowheadAngle(path);

  // Label position: midpoint of the curve
  const midX = (fromPos.x + NODE_W / 2 + toPos.x + NODE_W / 2) / 2;
  const midY = (fromPos.y + NODE_H / 2 + toPos.y + NODE_H / 2) / 2 + (isBackward ? 30 : -12);

  return (
    <g>
      {/* Invisible wider hit area for clicking */}
      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth={12}
        className="cursor-pointer"
        onClick={(e) => { e.stopPropagation(); onClick(transition); }}
      />

      {/* Arrow path */}
      <path
        d={path}
        fill="none"
        className={isSelected ? "stroke-ring" : "stroke-muted-foreground/50"}
        strokeWidth={isSelected ? 2.5 : 1.5}
      />

      {/* Arrowhead */}
      <polygon
        points="0,-4 8,0 0,4"
        transform={`translate(${tipX}, ${tipY}) rotate(${angle})`}
        className={isSelected ? "fill-ring" : "fill-muted-foreground/50"}
      />

      {/* Label */}
      <g transform={`translate(${midX}, ${midY})`}>
        <rect
          x={-transition.name.length * 3 - 6}
          y={-8}
          width={transition.name.length * 6 + 12}
          height={16}
          rx={4}
          className={isSelected ? "fill-ring/10 stroke-ring" : "fill-background/90"}
          strokeWidth={isSelected ? 1 : 0}
        />
        <text
          textAnchor="middle"
          y={4}
          className={`select-none pointer-events-none ${isSelected ? "fill-foreground font-medium" : "fill-muted-foreground"}`}
          style={{ fontSize: "9px" }}
        >
          {transition.name}
        </text>
      </g>
    </g>
  );
}

// ── Connection handle (right edge of state) ─────────────────────

interface ConnectionHandleProps {
  position: Position;
  stateName: string;
  onStartConnect: (stateName: string, e: React.MouseEvent) => void;
}

function ConnectionHandle({ position, stateName, onStartConnect }: ConnectionHandleProps) {
  return (
    <circle
      cx={position.x + NODE_W}
      cy={position.y + NODE_H / 2}
      r={6}
      className="fill-background stroke-muted-foreground/40 hover:stroke-ring hover:fill-ring/20 cursor-crosshair transition-colors"
      strokeWidth={1.5}
      onMouseDown={(e) => {
        e.stopPropagation();
        e.preventDefault();
        onStartConnect(stateName, e);
      }}
    />
  );
}

// ── Main canvas component ────────────────────────────────────────

interface StateMachineCanvasProps {
  workflow: Workflow;
  selectedState: string | null;
  selectedTransitionKey: string | null;
  onSelectState: (name: string | null) => void;
  onSelectTransition: (key: string | null, transition: WorkflowTransition | null) => void;
  onAddState: (position: { x: number; y: number }) => void;
  onCreateTransition: (from: string, to: string) => void;
}

export function StateMachineCanvas({
  workflow,
  selectedState,
  selectedTransitionKey,
  onSelectState,
  onSelectTransition,
  onAddState,
  onCreateTransition,
}: StateMachineCanvasProps) {
  const initialPositions = useMemo(() => computeLayout(workflow), [workflow]);
  const [positions, setPositions] = useState<Map<string, Position>>(() => initialPositions);
  const [dragging, setDragging] = useState<string | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [connectCursor, setConnectCursor] = useState<Position>({ x: 0, y: 0 });
  const dragOffset = useRef<Position>({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  // Reset positions when workflow changes
  const workflowIdRef = useRef(workflow.id);
  if (workflowIdRef.current !== workflow.id) {
    workflowIdRef.current = workflow.id;
    setPositions(initialPositions);
  }

  // Compute which transitions are "backward" (to a state at a lower or same level)
  const levelMap = useMemo(() => {
    const levels = new Map<string, number>();
    const queue = [workflow.initialState];
    levels.set(workflow.initialState, 0);
    const adj = new Map<string, string[]>();
    for (const s of workflow.states) adj.set(s.name, []);
    for (const t of workflow.transitions) adj.get(t.from)?.push(t.to);

    while (queue.length > 0) {
      const cur = queue.shift()!;
      for (const next of adj.get(cur) ?? []) {
        if (!levels.has(next)) {
          levels.set(next, (levels.get(cur) ?? 0) + 1);
          queue.push(next);
        }
      }
    }
    return levels;
  }, [workflow]);

  // Compute SVG viewBox dimensions
  const viewBox = useMemo(() => {
    let maxX = 0;
    let maxY = 0;
    for (const [, pos] of positions) {
      if (pos.x + NODE_W > maxX) maxX = pos.x + NODE_W;
      if (pos.y + NODE_H > maxY) maxY = pos.y + NODE_H;
    }
    return {
      width: Math.max(maxX + PADDING * 2, 800),
      height: Math.max(maxY + PADDING * 2, 500),
    };
  }, [positions]);

  // ── Drag handlers ──────────────────────────────────────────────

  const handleDragStart = useCallback((name: string, e: React.MouseEvent) => {
    e.preventDefault();
    const pos = positions.get(name);
    if (!pos || !svgRef.current) return;

    const svgRect = svgRef.current.getBoundingClientRect();
    const svgWidth = svgRef.current.viewBox.baseVal.width || viewBox.width;
    const scale = svgWidth / svgRect.width;

    dragOffset.current = {
      x: (e.clientX - svgRect.left) * scale - pos.x,
      y: (e.clientY - svgRect.top) * scale - pos.y,
    };
    setDragging(name);
  }, [positions, viewBox.width]);

  const getSvgCoords = useCallback((e: React.MouseEvent): Position => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const svgRect = svgRef.current.getBoundingClientRect();
    const svgWidth = svgRef.current.viewBox.baseVal.width || viewBox.width;
    const scale = svgWidth / svgRect.width;
    return {
      x: (e.clientX - svgRect.left) * scale,
      y: (e.clientY - svgRect.top) * scale,
    };
  }, [viewBox.width]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    // Connection drag
    if (connectingFrom) {
      setConnectCursor(getSvgCoords(e));
      return;
    }

    if (!dragging || !svgRef.current) return;

    const coords = getSvgCoords(e);
    const newX = coords.x - dragOffset.current.x;
    const newY = coords.y - dragOffset.current.y;

    setPositions((prev) => {
      const next = new Map(prev);
      next.set(dragging, {
        x: Math.max(0, newX),
        y: Math.max(0, newY),
      });
      return next;
    });
  }, [dragging, connectingFrom, getSvgCoords]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (connectingFrom) {
      // Check if cursor is over a state node
      const coords = getSvgCoords(e);
      for (const [name, pos] of positions) {
        if (
          name !== connectingFrom &&
          coords.x >= pos.x &&
          coords.x <= pos.x + NODE_W &&
          coords.y >= pos.y &&
          coords.y <= pos.y + NODE_H
        ) {
          onCreateTransition(connectingFrom, name);
          break;
        }
      }
      setConnectingFrom(null);
    }
    setDragging(null);
  }, [connectingFrom, positions, getSvgCoords, onCreateTransition]);

  const handleStartConnect = useCallback((stateName: string, e: React.MouseEvent) => {
    setConnectingFrom(stateName);
    setConnectCursor(getSvgCoords(e));
    // Clear other selections
    onSelectState(null);
    onSelectTransition(null, null);
  }, [getSvgCoords, onSelectState, onSelectTransition]);

  if (workflow.states.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">
          No states defined. Add states to get started.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("h-full w-full overflow-auto bg-background", dragging && "select-none")}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${viewBox.width} ${viewBox.height}`}
        className="min-w-full min-h-full"
        style={{ minWidth: viewBox.width, minHeight: viewBox.height }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={() => { onSelectState(null); onSelectTransition(null, null); }}
        onDoubleClick={(e) => {
          if (!svgRef.current) return;
          const svgRect = svgRef.current.getBoundingClientRect();
          const svgWidth = svgRef.current.viewBox.baseVal.width || viewBox.width;
          const scale = svgWidth / svgRect.width;
          onAddState({
            x: (e.clientX - svgRect.left) * scale,
            y: (e.clientY - svgRect.top) * scale,
          });
        }}
      >
        {/* Grid dots pattern */}
        <defs>
          <pattern id="grid-dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.5" className="fill-border/50" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-dots)" />

        {/* Transitions (render below nodes) */}
        {workflow.transitions.map((t) => {
          const fromPos = positions.get(t.from);
          const toPos = positions.get(t.to);
          if (!fromPos || !toPos) return null;

          const fromLevel = levelMap.get(t.from) ?? 0;
          const toLevel = levelMap.get(t.to) ?? 0;
          const isBackward = toLevel <= fromLevel;

          const tKey = transitionKey(t);
          return (
            <TransitionArrow
              key={tKey}
              transition={t}
              fromPos={fromPos}
              toPos={toPos}
              isBackward={isBackward}
              isSelected={selectedTransitionKey === tKey}
              onClick={(tr) => {
                onSelectState(null);
                onSelectTransition(transitionKey(tr), tr);
              }}
            />
          );
        })}

        {/* State nodes */}
        {workflow.states.map((state) => {
          const pos = positions.get(state.name);
          if (!pos) return null;
          return (
            <StateNode
              key={state.name}
              state={state}
              position={pos}
              isSelected={selectedState === state.name}
              onDragStart={handleDragStart}
              onClick={(name) => {
                onSelectState(name);
                onSelectTransition(null, null);
              }}
            />
          );
        })}

        {/* Connection handles on right edge of each state */}
        {workflow.states.map((state) => {
          const pos = positions.get(state.name);
          if (!pos) return null;
          return (
            <ConnectionHandle
              key={`handle-${state.name}`}
              position={pos}
              stateName={state.name}
              onStartConnect={handleStartConnect}
            />
          );
        })}

        {/* Connection preview line while dragging */}
        {connectingFrom && (() => {
          const fromPos = positions.get(connectingFrom);
          if (!fromPos) return null;
          return (
            <line
              x1={fromPos.x + NODE_W}
              y1={fromPos.y + NODE_H / 2}
              x2={connectCursor.x}
              y2={connectCursor.y}
              className="stroke-ring"
              strokeWidth={2}
              strokeDasharray="6 3"
              pointerEvents="none"
            />
          );
        })()}
      </svg>
    </div>
  );
}
