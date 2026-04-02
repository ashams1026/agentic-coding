ALTER TABLE `executions` ADD `workflow_id` text;--> statement-breakpoint
ALTER TABLE `executions` ADD `workflow_state_name` text;--> statement-breakpoint
ALTER TABLE `projects` ADD `workflow_id` text;--> statement-breakpoint
ALTER TABLE `work_items` ADD `workflow_id` text;