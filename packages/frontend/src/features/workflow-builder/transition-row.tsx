import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { StateCardData } from "./state-card";

interface TransitionRowProps {
  toStateId: string;
  label: string;
  allStates: StateCardData[];
  onChange: (updated: { toStateId: string; label: string }) => void;
  onDelete: () => void;
}

export function TransitionRow({ toStateId, label, allStates, onChange, onDelete }: TransitionRowProps) {
  return (
    <div className="flex items-center gap-1.5">
      <Select value={toStateId} onValueChange={(v) => onChange({ toStateId: v, label })}>
        <SelectTrigger className="h-6 text-[10px] flex-1 min-w-0">
          <SelectValue placeholder="Target state" />
        </SelectTrigger>
        <SelectContent>
          {allStates.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              <span className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: s.color }}
                />
                {s.name || "Untitled"}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        value={label}
        onChange={(e) => onChange({ toStateId, label: e.target.value })}
        placeholder="Label"
        className="h-6 text-[10px] flex-1 min-w-0"
      />

      <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={onDelete}>
        <Trash2 className="h-3 w-3 text-red-400" />
      </Button>
    </div>
  );
}
