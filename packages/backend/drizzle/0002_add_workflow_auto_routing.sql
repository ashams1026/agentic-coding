ALTER TABLE `workflows` ADD `auto_routing` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE `workflow_states` ADD `agent_overrides` text DEFAULT '[]' NOT NULL;
