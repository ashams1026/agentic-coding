CREATE TABLE `agent_assignments` (
	`project_id` text NOT NULL,
	`state_name` text NOT NULL,
	`agent_id` text NOT NULL,
	PRIMARY KEY(`project_id`, `state_name`),
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `agents` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`avatar` text NOT NULL,
	`system_prompt` text DEFAULT '' NOT NULL,
	`model` text DEFAULT 'sonnet' NOT NULL,
	`allowed_tools` text DEFAULT '[]' NOT NULL,
	`mcp_tools` text DEFAULT '[]' NOT NULL,
	`skills` text DEFAULT '[]' NOT NULL,
	`subagents` text DEFAULT '[]' NOT NULL,
	`max_budget_per_run` integer DEFAULT 0 NOT NULL,
	`settings` text DEFAULT '{}' NOT NULL,
	`scope` text DEFAULT 'global' NOT NULL,
	`project_id` text,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `chat_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`role` text NOT NULL,
	`content` text NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `chat_sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `chat_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`agent_id` text,
	`work_item_id` text,
	`sdk_session_id` text,
	`title` text DEFAULT 'New chat' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`work_item_id`) REFERENCES `work_items`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `comments` (
	`id` text PRIMARY KEY NOT NULL,
	`work_item_id` text NOT NULL,
	`author_type` text NOT NULL,
	`author_id` text,
	`author_name` text NOT NULL,
	`content` text NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`work_item_id`) REFERENCES `work_items`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `executions` (
	`id` text PRIMARY KEY NOT NULL,
	`work_item_id` text,
	`agent_id` text NOT NULL,
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
	FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `global_memories` (
	`id` text PRIMARY KEY NOT NULL,
	`agent_id` text NOT NULL,
	`summary` text DEFAULT '' NOT NULL,
	`key_decisions` text DEFAULT '[]' NOT NULL,
	`created_at` integer NOT NULL,
	`consolidated_into` text,
	FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `project_memories` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`work_item_id` text NOT NULL,
	`summary` text NOT NULL,
	`files_changed` text DEFAULT '[]' NOT NULL,
	`key_decisions` text DEFAULT '[]' NOT NULL,
	`created_at` integer NOT NULL,
	`consolidated_into` text,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`work_item_id`) REFERENCES `work_items`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`path` text NOT NULL,
	`is_global` integer DEFAULT false NOT NULL,
	`settings` text DEFAULT '{}' NOT NULL,
	`workflow_id` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `proposals` (
	`id` text PRIMARY KEY NOT NULL,
	`execution_id` text NOT NULL,
	`work_item_id` text NOT NULL,
	`type` text NOT NULL,
	`payload` text DEFAULT '{}' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`execution_id`) REFERENCES `executions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`work_item_id`) REFERENCES `work_items`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `schedules` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`agent_id` text NOT NULL,
	`project_id` text NOT NULL,
	`cron_expression` text NOT NULL,
	`prompt_template` text DEFAULT '' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`last_run_at` integer,
	`next_run_at` integer,
	`consecutive_failures` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `templates` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`content` text NOT NULL,
	`is_built_in` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `webhook_deliveries` (
	`id` text PRIMARY KEY NOT NULL,
	`subscription_id` text NOT NULL,
	`event` text NOT NULL,
	`payload` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`status_code` integer,
	`latency_ms` integer,
	`attempt` integer DEFAULT 0 NOT NULL,
	`next_retry_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`subscription_id`) REFERENCES `webhook_subscriptions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `webhook_subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`url` text NOT NULL,
	`secret` text NOT NULL,
	`events` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`failure_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `webhook_triggers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`secret` text NOT NULL,
	`agent_id` text NOT NULL,
	`project_id` text NOT NULL,
	`prompt_template` text DEFAULT '' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `work_item_edges` (
	`id` text PRIMARY KEY NOT NULL,
	`from_id` text NOT NULL,
	`to_id` text NOT NULL,
	`type` text NOT NULL,
	FOREIGN KEY (`from_id`) REFERENCES `work_items`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`to_id`) REFERENCES `work_items`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `work_items` (
	`id` text PRIMARY KEY NOT NULL,
	`parent_id` text,
	`project_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`context` text DEFAULT '{}' NOT NULL,
	`current_state` text NOT NULL,
	`workflow_id` text,
	`priority` text DEFAULT 'p2' NOT NULL,
	`labels` text DEFAULT '[]' NOT NULL,
	`assigned_agent_id` text,
	`execution_context` text DEFAULT '[]' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`archived_at` integer,
	`deleted_at` integer,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assigned_agent_id`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `workflow_states` (
	`id` text PRIMARY KEY NOT NULL,
	`workflow_id` text NOT NULL,
	`name` text NOT NULL,
	`type` text DEFAULT 'intermediate' NOT NULL,
	`color` text DEFAULT '#6b7280' NOT NULL,
	`agent_id` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`workflow_id`) REFERENCES `workflows`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `workflow_transitions` (
	`id` text PRIMARY KEY NOT NULL,
	`workflow_id` text NOT NULL,
	`from_state_id` text NOT NULL,
	`to_state_id` text NOT NULL,
	`label` text DEFAULT '' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`workflow_id`) REFERENCES `workflows`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`from_state_id`) REFERENCES `workflow_states`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`to_state_id`) REFERENCES `workflow_states`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `workflows` (
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
