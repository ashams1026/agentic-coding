import { useState, useEffect } from "react";
import { Shield, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useProjectFromUrl, useUpdateProject } from "@/hooks";

export function SecuritySection() {
  const { project } = useProjectFromUrl();
  const updateMutation = useUpdateProject();

  const [sandboxEnabled, setSandboxEnabled] = useState(true);
  const [allowedDomains, setAllowedDomains] = useState<string[]>([]);
  const [denyWritePaths, setDenyWritePaths] = useState<string[]>([]);
  const [newDomain, setNewDomain] = useState("");
  const [newDenyPath, setNewDenyPath] = useState("");

  useEffect(() => {
    if (!project) return;
    const sandbox = project.settings?.sandbox;
    setSandboxEnabled(sandbox?.enabled !== false);
    setAllowedDomains(sandbox?.allowedDomains ?? [
      "api.anthropic.com", "registry.npmjs.org", "github.com", "raw.githubusercontent.com",
    ]);
    setDenyWritePaths(sandbox?.denyWritePaths ?? ["/", "/etc", "/usr", "/var"]);
  }, [project?.id]);

  const handleSave = () => {
    if (!project) return;
    updateMutation.mutate({
      id: project.id,
      settings: {
        ...project.settings,
        sandbox: {
          enabled: sandboxEnabled,
          allowedDomains,
          allowedWritePaths: [project.path],
          denyWritePaths,
        },
      },
    });
  };

  const addDomain = () => {
    const d = newDomain.trim();
    if (d && !allowedDomains.includes(d)) {
      setAllowedDomains([...allowedDomains, d]);
      setNewDomain("");
    }
  };

  const addDenyPath = () => {
    const p = newDenyPath.trim();
    if (p && !denyWritePaths.includes(p)) {
      setDenyWritePaths([...denyWritePaths, p]);
      setNewDenyPath("");
    }
  };

  if (!project) {
    return <p className="text-sm text-muted-foreground">Select a project to configure security settings.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
        <div>
          <p className="text-sm font-medium">Agent Sandbox</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            OS-level sandboxing restricts agent file system and network access. Requires macOS sandbox or Linux namespaces.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox checked={sandboxEnabled} onCheckedChange={(v) => setSandboxEnabled(v === true)} />
        <span className="text-sm">Enable OS-level sandboxing</span>
      </div>

      {/* Allowed Domains */}
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Allowed Network Domains</h4>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {allowedDomains.map((domain) => (
            <Badge key={domain} variant="secondary" className="text-xs gap-1 pr-1">
              {domain}
              <button type="button" onClick={() => setAllowedDomains(allowedDomains.filter((d) => d !== domain))} className="hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="e.g., api.example.com"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addDomain()}
            className="h-8 text-sm"
          />
          <Button variant="outline" size="sm" className="h-8 gap-1" onClick={addDomain}>
            <Plus className="h-3 w-3" /> Add
          </Button>
        </div>
      </div>

      {/* Denied Write Paths */}
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Denied Write Paths</h4>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {denyWritePaths.map((path) => (
            <Badge key={path} variant="secondary" className="text-xs font-mono gap-1 pr-1">
              {path}
              <button type="button" onClick={() => setDenyWritePaths(denyWritePaths.filter((p) => p !== path))} className="hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="e.g., /home/user/.ssh"
            value={newDenyPath}
            onChange={(e) => setNewDenyPath(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addDenyPath()}
            className="h-8 text-sm font-mono"
          />
          <Button variant="outline" size="sm" className="h-8 gap-1" onClick={addDenyPath}>
            <Plus className="h-3 w-3" /> Add
          </Button>
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        Agents can always write to the project directory: <code className="font-mono bg-muted px-1 rounded">{project.path}</code>
      </div>

      <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending}>
        Save Security Settings
      </Button>
    </div>
  );
}
