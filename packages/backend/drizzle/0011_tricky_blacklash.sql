ALTER TABLE `chat_sessions` ADD `persona_id` text REFERENCES personas(id);--> statement-breakpoint
ALTER TABLE `chat_sessions` ADD `work_item_id` text REFERENCES work_items(id);--> statement-breakpoint
ALTER TABLE `chat_sessions` ADD `sdk_session_id` text;--> statement-breakpoint
UPDATE `chat_sessions` SET `persona_id` = (SELECT `id` FROM `personas` WHERE `settings` LIKE '%"isAssistant":true%' LIMIT 1) WHERE `persona_id` IS NULL;