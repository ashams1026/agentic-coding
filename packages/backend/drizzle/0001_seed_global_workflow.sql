-- Ensure the global project exists before seeding the global workflow.
-- Uses INSERT OR IGNORE so re-running on an existing DB (where ensureGlobalProject already ran) is safe.
INSERT OR IGNORE INTO `projects` (`id`, `name`, `path`, `is_global`, `settings`, `created_at`)
VALUES ('pj-global', 'Global Workspace', '', 1, '{}', 1743552000000);
--> statement-breakpoint
-- Seed a simple 3-state workflow for the global project (pj-global).
-- autoRouting is not a schema column; workflow is manual (no agents assigned).
INSERT INTO `workflows` (`id`, `name`, `description`, `scope`, `project_id`, `version`, `is_published`, `created_at`, `updated_at`)
VALUES (
  'wf-global',
  'Global Workflow',
  'Simple 3-state workflow for the global project: Backlog → In Progress → Done',
  'global',
  'pj-global',
  1,
  1,
  1743552000000,
  1743552000000
);
--> statement-breakpoint
INSERT INTO `workflow_states` (`id`, `workflow_id`, `name`, `type`, `color`, `agent_id`, `sort_order`)
VALUES
  ('ws-global-backlog',     'wf-global', 'Backlog',     'initial',      '#6b7280', NULL, 0),
  ('ws-global-in-progress', 'wf-global', 'In Progress', 'intermediate', '#3b82f6', NULL, 1),
  ('ws-global-done',        'wf-global', 'Done',        'terminal',     '#22c55e', NULL, 2);
--> statement-breakpoint
INSERT INTO `workflow_transitions` (`id`, `workflow_id`, `from_state_id`, `to_state_id`, `label`, `sort_order`)
VALUES
  ('wt-global-0', 'wf-global', 'ws-global-backlog',     'ws-global-in-progress', '', 0),
  ('wt-global-1', 'wf-global', 'ws-global-in-progress', 'ws-global-done',        '', 1);
