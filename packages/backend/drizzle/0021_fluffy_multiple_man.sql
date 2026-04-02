-- Backfill NULL projectId → 'pj-global' before enforcing NOT NULL
UPDATE `chat_sessions` SET `project_id` = 'pj-global' WHERE `project_id` IS NULL;--> statement-breakpoint
UPDATE `executions` SET `project_id` = 'pj-global' WHERE `project_id` IS NULL;--> statement-breakpoint
UPDATE `schedules` SET `project_id` = 'pj-global' WHERE `project_id` IS NULL;--> statement-breakpoint
UPDATE `webhook_triggers` SET `project_id` = 'pj-global' WHERE `project_id` IS NULL;--> statement-breakpoint
UPDATE `workflows` SET `project_id` = 'pj-global' WHERE `project_id` IS NULL;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_chat_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`persona_id` text,
	`work_item_id` text,
	`sdk_session_id` text,
	`title` text DEFAULT 'New chat' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`persona_id`) REFERENCES `personas`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`work_item_id`) REFERENCES `work_items`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_chat_sessions`("id", "project_id", "persona_id", "work_item_id", "sdk_session_id", "title", "created_at", "updated_at") SELECT "id", "project_id", "persona_id", "work_item_id", "sdk_session_id", "title", "created_at", "updated_at" FROM `chat_sessions`;--> statement-breakpoint
DROP TABLE `chat_sessions`;--> statement-breakpoint
ALTER TABLE `__new_chat_sessions` RENAME TO `chat_sessions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_executions` (
	`id` text PRIMARY KEY NOT NULL,
	`work_item_id` text,
	`persona_id` text NOT NULL,
	`project_id` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`started_at` integer NOT NULL,
	`completed_at` integer,
	`cost_usd` integer DEFAULT 0 NOT NULL,
	`duration_ms` integer DEFAULT 0 NOT NULL,
	`summary` text DEFAULT '' NOT NULL,
	`outcome` text,
	`rejection_payload` text,
	`logs` text DEFAULT '' NOT NULL,
	`checkpoint_message_id` text,
	`structured_output` text,
	`parent_execution_id` text,
	`error` text,
	`workflow_id` text,
	`workflow_state_name` text,
	`handoff_notes` text,
	`model` text,
	`total_tokens` integer,
	`tool_uses` integer,
	`trigger_type` text,
	`trigger_id` text,
	FOREIGN KEY (`work_item_id`) REFERENCES `work_items`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`persona_id`) REFERENCES `personas`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_executions`("id", "work_item_id", "persona_id", "project_id", "status", "started_at", "completed_at", "cost_usd", "duration_ms", "summary", "outcome", "rejection_payload", "logs", "checkpoint_message_id", "structured_output", "parent_execution_id", "error", "workflow_id", "workflow_state_name", "handoff_notes", "model", "total_tokens", "tool_uses", "trigger_type", "trigger_id") SELECT "id", "work_item_id", "persona_id", "project_id", "status", "started_at", "completed_at", "cost_usd", "duration_ms", "summary", "outcome", "rejection_payload", "logs", "checkpoint_message_id", "structured_output", "parent_execution_id", "error", "workflow_id", "workflow_state_name", "handoff_notes", "model", "total_tokens", "tool_uses", "trigger_type", "trigger_id" FROM `executions`;--> statement-breakpoint
DROP TABLE `executions`;--> statement-breakpoint
ALTER TABLE `__new_executions` RENAME TO `executions`;--> statement-breakpoint
CREATE TABLE `__new_schedules` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`persona_id` text NOT NULL,
	`project_id` text NOT NULL,
	`cron_expression` text NOT NULL,
	`prompt_template` text DEFAULT '' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`last_run_at` integer,
	`next_run_at` integer,
	`consecutive_failures` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`persona_id`) REFERENCES `personas`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_schedules`("id", "name", "persona_id", "project_id", "cron_expression", "prompt_template", "is_active", "last_run_at", "next_run_at", "consecutive_failures", "created_at") SELECT "id", "name", "persona_id", "project_id", "cron_expression", "prompt_template", "is_active", "last_run_at", "next_run_at", "consecutive_failures", "created_at" FROM `schedules`;--> statement-breakpoint
DROP TABLE `schedules`;--> statement-breakpoint
ALTER TABLE `__new_schedules` RENAME TO `schedules`;--> statement-breakpoint
CREATE TABLE `__new_webhook_triggers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`secret` text NOT NULL,
	`persona_id` text NOT NULL,
	`project_id` text NOT NULL,
	`prompt_template` text DEFAULT '' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`persona_id`) REFERENCES `personas`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_webhook_triggers`("id", "name", "secret", "persona_id", "project_id", "prompt_template", "is_active", "created_at") SELECT "id", "name", "secret", "persona_id", "project_id", "prompt_template", "is_active", "created_at" FROM `webhook_triggers`;--> statement-breakpoint
DROP TABLE `webhook_triggers`;--> statement-breakpoint
ALTER TABLE `__new_webhook_triggers` RENAME TO `webhook_triggers`;--> statement-breakpoint
CREATE TABLE `__new_workflows` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`scope` text DEFAULT 'global' NOT NULL,
	`project_id` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`is_published` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_workflows`("id", "name", "description", "scope", "project_id", "version", "is_published", "created_at", "updated_at") SELECT "id", "name", "description", "scope", "project_id", "version", "is_published", "created_at", "updated_at" FROM `workflows`;--> statement-breakpoint
DROP TABLE `workflows`;--> statement-breakpoint
ALTER TABLE `__new_workflows` RENAME TO `workflows`;