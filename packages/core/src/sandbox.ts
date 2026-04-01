/**
 * Command sandbox — best-effort validation layer that blocks shell commands
 * attempting to escape the project directory or access dangerous paths.
 *
 * This is NOT a full sandbox. It catches common escape patterns but cannot
 * prevent all possible evasion (e.g., encoded paths, subshells, symlinks).
 */

import path from "node:path";

export interface ValidationResult {
  allowed: boolean;
  reason?: string;
}

// Paths that should never be written to or read from
const BLOCKED_PATHS = [
  "/etc/",
  "/var/",
  "/usr/",
  "/sys/",
  "/proc/",
  "/dev/",
  "/boot/",
  "/sbin/",
  "/root/",
];

// Commands that are always dangerous regardless of arguments
const BLOCKED_COMMANDS = [
  "rm -rf /",
  "rm -fr /",
  "mkfs",
  "dd if=",
  ":(){:|:&};:",
  "chmod -R 777 /",
  "shutdown",
  "reboot",
  "init 0",
  "init 6",
];

// Patterns for absolute paths outside a project
const HOME_ESCAPE_PATTERNS = [
  /~\//,            // ~/anything
  /\$HOME/,         // $HOME/anything
  /\$\{HOME\}/,     // ${HOME}/anything
];

/**
 * Validate a shell command against the project sandbox rules.
 *
 * @param command - The shell command string to validate
 * @param projectRoot - Absolute path to the project root directory
 * @returns ValidationResult with allowed=true if safe, or allowed=false with reason
 */
export function validateCommand(
  command: string,
  projectRoot: string,
): ValidationResult {
  const normalizedRoot = path.resolve(projectRoot);
  const trimmed = command.trim();

  // Check for always-blocked dangerous commands
  for (const blocked of BLOCKED_COMMANDS) {
    if (trimmed.includes(blocked)) {
      return {
        allowed: false,
        reason: `Blocked dangerous command pattern: "${blocked}"`,
      };
    }
  }

  // Check for cd to absolute paths outside the project
  const cdAbsMatch = trimmed.match(/\bcd\s+([/"'][^;&|]*)/);
  if (cdAbsMatch?.[1]) {
    const target = cdAbsMatch[1].replace(/["']/g, "").trim();
    if (path.isAbsolute(target)) {
      const resolved = path.resolve(target);
      if (!resolved.startsWith(normalizedRoot)) {
        return {
          allowed: false,
          reason: `"cd ${target}" escapes project root (${normalizedRoot})`,
        };
      }
    }
  }

  // Check for cd .. chains that escape the project root
  const cdRelMatch = trimmed.match(/\bcd\s+((?:\.\.\/?\s*)+)/);
  if (cdRelMatch?.[1]) {
    const relPath = cdRelMatch[1].trim();
    // Resolve relative to project root (worst case — agent could be deeper)
    const resolved = path.resolve(normalizedRoot, relPath);
    if (!resolved.startsWith(normalizedRoot)) {
      return {
        allowed: false,
        reason: `"cd ${relPath}" may escape project root (${normalizedRoot})`,
      };
    }
  }

  // Check for references to blocked system paths
  for (const blockedPath of BLOCKED_PATHS) {
    // Match reads, writes, or any file operation touching these paths
    const pattern = new RegExp(`(?:cat|head|tail|less|more|cp|mv|rm|chmod|chown|ln|touch|mkdir|nano|vi|vim|echo.*>)\\s+["']?${blockedPath.replace("/", "\\/")}`, "i");
    if (pattern.test(trimmed)) {
      return {
        allowed: false,
        reason: `Command references blocked system path: ${blockedPath}`,
      };
    }
    // Also catch direct path references like `cat /etc/passwd`
    if (trimmed.includes(blockedPath) && !trimmed.includes(normalizedRoot)) {
      // Allow if the blocked path happens to be a substring of the project path
      if (!normalizedRoot.includes(blockedPath)) {
        return {
          allowed: false,
          reason: `Command references system path: ${blockedPath}`,
        };
      }
    }
  }

  // Check for home directory escape patterns
  for (const pattern of HOME_ESCAPE_PATTERNS) {
    if (pattern.test(trimmed)) {
      // Allow common safe uses: ~/project if project is under home
      // But block writes: cp file ~/somewhere, echo > ~/file
      const hasWrite = /(?:cp|mv|>|>>|tee|echo.*>|rsync|scp)\s/.test(trimmed);
      if (hasWrite) {
        return {
          allowed: false,
          reason: `Command writes to path outside project: matched ${pattern}`,
        };
      }
    }
  }

  // Check for absolute paths in write operations that are outside the project
  const absPathMatches = trimmed.match(/(?:>|>>|cp\s|mv\s|tee\s|rsync\s)\s*["']?(\/[^\s;"'|&]+)/g);
  if (absPathMatches) {
    for (const match of absPathMatches) {
      const pathPart = match.replace(/^(?:>|>>|cp|mv|tee|rsync)\s*["']?/, "").trim();
      if (pathPart.startsWith("/")) {
        const resolved = path.resolve(pathPart);
        if (!resolved.startsWith(normalizedRoot) && !resolved.startsWith("/tmp/")) {
          return {
            allowed: false,
            reason: `Write to path outside project: ${pathPart}`,
          };
        }
      }
    }
  }

  return { allowed: true };
}

/**
 * Build a sandbox instruction block to inject into the agent's system prompt.
 */
export function buildSandboxPrompt(projectRoot: string): string {
  return [
    "## Sandbox Rules",
    "",
    `You are working inside the project directory: ${projectRoot}`,
    "You MUST NOT:",
    "- Navigate outside the project directory with cd",
    "- Read or write files outside the project directory",
    "- Access system paths (/etc, /usr, /var, /sys, /proc, /dev)",
    "- Run destructive commands (rm -rf /, mkfs, dd, shutdown, reboot)",
    "- Write to the home directory (~/) or any absolute path outside the project",
    "",
    "Allowed: /tmp/ for temporary files. All other file operations must stay within the project.",
  ].join("\n");
}
