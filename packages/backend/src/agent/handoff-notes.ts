/**
 * Handoff Notes — structured context passed between agents as a work item
 * moves through workflow states. Each completed execution can produce a
 * handoff note that the next agent receives as injected context.
 */

export interface HandoffNote {
  fromState: string;
  targetState: string;
  summary: string;
  decisions: string[];
  filesChanged: string[];
  openQuestions: string[];
}
