-- Rename personas table → agents
ALTER TABLE `personas` RENAME TO `agents`;--> statement-breakpoint
-- Rename persona_assignments table → agent_assignments
ALTER TABLE `persona_assignments` RENAME TO `agent_assignments`;--> statement-breakpoint
-- Rename persona_id → agent_id in agent_assignments
ALTER TABLE `agent_assignments` RENAME COLUMN `persona_id` TO `agent_id`;--> statement-breakpoint
-- Rename persona_id → agent_id in executions
ALTER TABLE `executions` RENAME COLUMN `persona_id` TO `agent_id`;--> statement-breakpoint
-- Rename persona_id → agent_id in chat_sessions
ALTER TABLE `chat_sessions` RENAME COLUMN `persona_id` TO `agent_id`;--> statement-breakpoint
-- Rename persona_id → agent_id in global_memories
ALTER TABLE `global_memories` RENAME COLUMN `persona_id` TO `agent_id`;--> statement-breakpoint
-- Rename persona_id → agent_id in webhook_triggers
ALTER TABLE `webhook_triggers` RENAME COLUMN `persona_id` TO `agent_id`;--> statement-breakpoint
-- Rename persona_id → agent_id in schedules
ALTER TABLE `schedules` RENAME COLUMN `persona_id` TO `agent_id`;--> statement-breakpoint
-- Rename persona_id → agent_id in workflow_states
ALTER TABLE `workflow_states` RENAME COLUMN `persona_id` TO `agent_id`;--> statement-breakpoint
-- Rename assigned_persona_id → assigned_agent_id in work_items
ALTER TABLE `work_items` RENAME COLUMN `assigned_persona_id` TO `assigned_agent_id`;
