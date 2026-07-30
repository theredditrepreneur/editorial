CREATE TABLE `articles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`headline` text NOT NULL,
	`slug` text NOT NULL,
	`industry` text NOT NULL,
	`framework_id` integer,
	`tags` text DEFAULT '[]' NOT NULL,
	`summary` text,
	`hero_image_key` text,
	`published_url` text,
	`publication_date` integer,
	`seo_title` text,
	`seo_description` text,
	`internal_notes` text,
	`status` text DEFAULT 'idea' NOT NULL,
	`distribution_status` text DEFAULT 'not_started' NOT NULL,
	`performance_status` text DEFAULT 'pending' NOT NULL,
	`repurpose_completed` integer DEFAULT false NOT NULL,
	`newsletter_included` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `articles_slug_unique` ON `articles` (`slug`);--> statement-breakpoint
CREATE TABLE `distribution_copies` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`article_id` integer NOT NULL,
	`platform` text NOT NULL,
	`copy` text NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`scheduled_at` integer,
	`published_url` text,
	`external_post_id` text,
	`last_error` text,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `editorial_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`article_id` integer NOT NULL,
	`type` text NOT NULL,
	`channel` text,
	`scheduled_at` integer NOT NULL,
	`status` text DEFAULT 'scheduled' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `frameworks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text NOT NULL,
	`relationships` text DEFAULT '[]' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `frameworks_name_unique` ON `frameworks` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `frameworks_slug_unique` ON `frameworks` (`slug`);--> statement-breakpoint
CREATE TABLE `performance_snapshots` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`article_id` integer,
	`channel` text NOT NULL,
	`captured_at` integer NOT NULL,
	`metrics` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `repurpose_assets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`article_id` integer NOT NULL,
	`format` text NOT NULL,
	`content` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`updated_at` integer NOT NULL
);
