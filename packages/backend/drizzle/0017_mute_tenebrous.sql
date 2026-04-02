CREATE TABLE `webhook_triggers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`secret` text NOT NULL,
	`persona_id` text NOT NULL,
	`project_id` text,
	`prompt_template` text DEFAULT '' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`persona_id`) REFERENCES `personas`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `executions` ADD `trigger_type` text;--> statement-breakpoint
ALTER TABLE `executions` ADD `trigger_id` text;