PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_executions` (
	`id` text PRIMARY KEY NOT NULL,
	`work_item_id` text,
	`persona_id` text NOT NULL,
	`project_id` text,
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
	FOREIGN KEY (`work_item_id`) REFERENCES `work_items`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`persona_id`) REFERENCES `personas`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_executions`("id", "work_item_id", "persona_id", "project_id", "status", "started_at", "completed_at", "cost_usd", "duration_ms", "summary", "outcome", "rejection_payload", "logs", "checkpoint_message_id", "structured_output", "parent_execution_id", "error") SELECT "id", "work_item_id", "persona_id", "project_id", "status", "started_at", "completed_at", "cost_usd", "duration_ms", "summary", "outcome", "rejection_payload", "logs", "checkpoint_message_id", "structured_output", "parent_execution_id", "error" FROM `executions`;--> statement-breakpoint
DROP TABLE `executions`;--> statement-breakpoint
ALTER TABLE `__new_executions` RENAME TO `executions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;