ALTER TABLE `agents` ADD COLUMN `scope` text NOT NULL DEFAULT 'global';
ALTER TABLE `agents` ADD COLUMN `project_id` text REFERENCES `projects`(`id`);
