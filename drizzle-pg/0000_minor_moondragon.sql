CREATE TABLE "articles" (
	"id" serial PRIMARY KEY NOT NULL,
	"headline" text NOT NULL,
	"slug" text NOT NULL,
	"industry" text NOT NULL,
	"framework_id" integer,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"summary" text,
	"hero_image_key" text,
	"published_url" text,
	"publication_date" timestamp with time zone,
	"seo_title" text,
	"seo_description" text,
	"internal_notes" text,
	"status" text DEFAULT 'idea' NOT NULL,
	"distribution_status" text DEFAULT 'not_started' NOT NULL,
	"performance_status" text DEFAULT 'pending' NOT NULL,
	"repurpose_completed" boolean DEFAULT false NOT NULL,
	"newsletter_included" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "articles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "distribution_copies" (
	"id" serial PRIMARY KEY NOT NULL,
	"article_id" integer NOT NULL,
	"platform" text NOT NULL,
	"copy" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"scheduled_at" timestamp with time zone,
	"published_url" text,
	"external_post_id" text,
	"last_error" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "editorial_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"article_id" integer NOT NULL,
	"type" text NOT NULL,
	"channel" text,
	"scheduled_at" timestamp with time zone NOT NULL,
	"status" text DEFAULT 'scheduled' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "frameworks" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text NOT NULL,
	"relationships" jsonb DEFAULT '[]'::jsonb NOT NULL,
	CONSTRAINT "frameworks_name_unique" UNIQUE("name"),
	CONSTRAINT "frameworks_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "performance_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"article_id" integer,
	"channel" text NOT NULL,
	"captured_at" timestamp with time zone DEFAULT now() NOT NULL,
	"metrics" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "repurpose_assets" (
	"id" serial PRIMARY KEY NOT NULL,
	"article_id" integer NOT NULL,
	"format" text NOT NULL,
	"content" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_framework_id_frameworks_id_fk" FOREIGN KEY ("framework_id") REFERENCES "public"."frameworks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "distribution_copies" ADD CONSTRAINT "distribution_copies_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "editorial_events" ADD CONSTRAINT "editorial_events_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_snapshots" ADD CONSTRAINT "performance_snapshots_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repurpose_assets" ADD CONSTRAINT "repurpose_assets_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;