import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// ── Tool definitions ────────────────────────────────────────────

interface ToolDef {
  name: string;
  description: string;
}

const SDK_TOOLS: ToolDef[] = [
  { name: "Read", description: "Read file contents from the filesystem" },
  { name: "Edit", description: "Edit existing files with search/replace operations" },
  { name: "Write", description: "Write new files to the filesystem" },
  { name: "Glob", description: "Find files matching glob patterns" },
  { name: "Grep", description: "Search file contents with regex patterns" },
  { name: "Bash", description: "Execute shell commands in the terminal" },
  { name: "WebFetch", description: "Fetch and read web page contents" },
  { name: "WebSearch", description: "Search the web for information" },
];

const AGENTOPS_TOOLS: ToolDef[] = [
  { name: "create_tasks", description: "Create subtasks for a story with dependency edges" },
  { name: "transition_state", description: "Move a story or task to a new workflow state" },
  { name: "request_review", description: "Request human review of completed work" },
  { name: "flag_blocked", description: "Flag a task as blocked with a reason" },
  { name: "post_comment", description: "Post a comment on a story or task" },
  { name: "list_tasks", description: "List all tasks for a given story" },
  { name: "get_context", description: "Get project context and memory entries" },
];

// ── Presets ──────────────────────────────────────────────────────

interface Preset {
  name: string;
  sdkTools: string[];
  mcpTools: string[];
}

const PRESETS: Preset[] = [
  {
    name: "PM preset",
    sdkTools: ["Read", "Glob", "Grep", "WebSearch"],
    mcpTools: ["post_comment", "transition_state"],
  },
  {
    name: "Tech Lead preset",
    sdkTools: ["Read", "Glob", "Grep", "WebSearch", "Bash"],
    mcpTools: ["create_tasks", "post_comment", "request_review"],
  },
  {
    name: "Engineer preset",
    sdkTools: ["Read", "Edit", "Write", "Glob", "Grep", "Bash", "WebFetch"],
    mcpTools: ["post_comment", "flag_blocked", "transition_state"],
  },
  {
    name: "Reviewer preset",
    sdkTools: ["Read", "Glob", "Grep", "Bash"],
    mcpTools: ["post_comment", "request_review", "transition_state"],
  },
  {
    name: "QA preset",
    sdkTools: ["Read", "Bash", "Glob", "Grep"],
    mcpTools: ["post_comment", "transition_state"],
  },
  {
    name: "All tools",
    sdkTools: SDK_TOOLS.map((t) => t.name),
    mcpTools: AGENTOPS_TOOLS.map((t) => t.name),
  },
  {
    name: "None",
    sdkTools: [],
    mcpTools: [],
  },
];

// ── Props ───────────────────────────────────────────────────────

interface ToolConfigurationProps {
  allowedTools: string[];
  mcpTools: string[];
  onAllowedToolsChange: (tools: string[]) => void;
  onMcpToolsChange: (tools: string[]) => void;
}

// ── Tool checkbox ───────────────────────────────────────────────

function ToolCheckbox({
  tool,
  checked,
  onToggle,
  mono,
}: {
  tool: ToolDef;
  checked: boolean;
  onToggle: () => void;
  mono?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <label
          className={cn(
            "flex items-center gap-2 rounded-md border px-2.5 py-1.5 cursor-pointer transition-colors",
            checked
              ? "border-primary/30 bg-primary/5"
              : "border-border hover:bg-accent/30",
          )}
        >
          <Checkbox checked={checked} onCheckedChange={onToggle} />
          <span className={cn("text-xs", mono && "font-mono")}>{tool.name}</span>
        </label>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p className="text-xs max-w-[200px]">{tool.description}</p>
      </TooltipContent>
    </Tooltip>
  );
}

// ── Main component ──────────────────────────────────────────────

export function ToolConfiguration({
  allowedTools,
  mcpTools,
  onAllowedToolsChange,
  onMcpToolsChange,
}: ToolConfigurationProps) {
  const totalSelected = allowedTools.length + mcpTools.length;
  const totalAvailable = SDK_TOOLS.length + AGENTOPS_TOOLS.length;

  const toggleSdkTool = (name: string) => {
    onAllowedToolsChange(
      allowedTools.includes(name)
        ? allowedTools.filter((t) => t !== name)
        : [...allowedTools, name],
    );
  };

  const toggleMcpTool = (name: string) => {
    onMcpToolsChange(
      mcpTools.includes(name)
        ? mcpTools.filter((t) => t !== name)
        : [...mcpTools, name],
    );
  };

  const applyPreset = (preset: Preset) => {
    onAllowedToolsChange([...preset.sdkTools]);
    onMcpToolsChange([...preset.mcpTools]);
  };

  return (
    <div className="space-y-4">
      {/* Header with count and presets */}
      <div className="flex items-center justify-between">
        <Badge variant="secondary" className="text-xs px-1.5 py-0">
          {totalSelected}/{totalAvailable} selected
        </Badge>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1">
              Presets
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {PRESETS.map((preset) => (
              <DropdownMenuItem
                key={preset.name}
                onClick={() => applyPreset(preset)}
                className="text-xs"
              >
                {preset.name}
                <Badge variant="outline" className="ml-auto text-xs px-1 py-0">
                  {preset.sdkTools.length + preset.mcpTools.length}
                </Badge>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <TooltipProvider>
        {/* SDK Tools */}
        <div>
          <span className="text-xs text-muted-foreground mb-2 block">
            SDK Tools
            <Badge variant="outline" className="ml-2 text-xs px-1 py-0">
              {allowedTools.length}
            </Badge>
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {SDK_TOOLS.map((tool) => (
              <ToolCheckbox
                key={tool.name}
                tool={tool}
                checked={allowedTools.includes(tool.name)}
                onToggle={() => toggleSdkTool(tool.name)}
              />
            ))}
          </div>
        </div>

        {/* Woof Tools */}
        <div>
          <span className="text-xs text-muted-foreground mb-2 block">
            Woof Tools
            <Badge variant="outline" className="ml-2 text-xs px-1 py-0">
              {mcpTools.length}
            </Badge>
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {AGENTOPS_TOOLS.map((tool) => (
              <ToolCheckbox
                key={tool.name}
                tool={tool}
                checked={mcpTools.includes(tool.name)}
                onToggle={() => toggleMcpTool(tool.name)}
                mono
              />
            ))}
          </div>
        </div>
      </TooltipProvider>
    </div>
  );
}
