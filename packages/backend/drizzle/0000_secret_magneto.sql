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
	`work_item_id` text NOT NULL,
	`persona_id` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`started_at` integer NOT NULL,
	`completed_at` integer,
	`cost_usd` integer DEFAULT 0 NOT NULL,
	`duration_ms` integer DEFAULT 0 NOT NULL,
	`summary` text DEFAULT '' NOT NULL,
	`outcome` text,
	`rejection_payload` text,
	`logs` text DEFAULT '' NOT NULL,
	FOREIGN KEY (`work_item_id`) REFERENCES `work_items`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`persona_id`) REFERENCES `personas`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `persona_assignments` (
	`project_id` text NOT NULL,
	`state_name` text NOT NULL,
	`persona_id` text NOT NULL,
	PRIMARY KEY(`project_id`, `state_name`),
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`persona_id`) REFERENCES `personas`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `personas` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`avatar` text NOT NULL,
	`system_prompt` text DEFAULT '' NOT NULL,
	`model` text DEFAULT 'sonnet' NOT NULL,
	`allowed_tools` text DEFAULT '[]' NOT NULL,
	`mcp_tools` text DEFAULT '[]' NOT NULL,
	`max_budget_per_run` integer DEFAULT 0 NOT NULL,
	`settings` text DEFAULT '{}' NOT NULL
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
	`settings` text DEFAULT '{}' NOT NULL,
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
	`priority` text DEFAULT 'p2' NOT NULL,
	`labels` text DEFAULT '[]' NOT NULL,
	`assigned_persona_id` text,
	`execution_context` text DEFAULT '[]' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assigned_persona_id`) REFERENCES `personas`(`id`) ON UPDATE no action ON DELETE no action
);
