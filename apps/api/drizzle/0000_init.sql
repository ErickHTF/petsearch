CREATE TYPE "public"."coat_color" AS ENUM('black', 'white', 'brown', 'caramel', 'golden', 'gray', 'brindle', 'spotted', 'orange', 'tricolor');--> statement-breakpoint
CREATE TYPE "public"."image_visibility" AS ENUM('public', 'private');--> statement-breakpoint
CREATE TYPE "public"."microchip" AS ENUM('yes', 'no', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."moderation_action" AS ENUM('hide', 'restore', 'delete');--> statement-breakpoint
CREATE TYPE "public"."moderation_target" AS ENUM('notice', 'sighting');--> statement-breakpoint
CREATE TYPE "public"."notice_status" AS ENUM('open', 'reunited', 'closed');--> statement-breakpoint
CREATE TYPE "public"."notice_type" AS ENUM('lost', 'found');--> statement-breakpoint
CREATE TYPE "public"."sighting_owner_state" AS ENUM('new', 'useful', 'dismissed');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('owner', 'moderator');--> statement-breakpoint
CREATE TYPE "public"."sex" AS ENUM('male', 'female', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."sighting_kind" AS ENUM('sighting', 'message');--> statement-breakpoint
CREATE TYPE "public"."size" AS ENUM('small', 'medium', 'large');--> statement-breakpoint
CREATE TYPE "public"."species" AS ENUM('dog', 'cat', 'other');--> statement-breakpoint
CREATE TABLE "images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"notice_id" uuid NOT NULL,
	"visibility" "image_visibility" NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"alt" text DEFAULT '' NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"content" "bytea" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "moderation_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"target_type" "moderation_target" NOT NULL,
	"target_id" uuid NOT NULL,
	"action" "moderation_action" NOT NULL,
	"reason" text NOT NULL,
	"moderator_id" uuid,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notice_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"notice_id" uuid NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" "notice_status",
	"note" text
);
--> statement-breakpoint
CREATE TABLE "notices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "notice_type" NOT NULL,
	"status" "notice_status" DEFAULT 'open' NOT NULL,
	"name" text,
	"species" "species" NOT NULL,
	"size" "size" NOT NULL,
	"coat_colors" "coat_color"[] NOT NULL,
	"sex" "sex" NOT NULL,
	"distinctive_marks" text,
	"has_microchip" "microchip" NOT NULL,
	"neighborhood" text NOT NULL,
	"event_date" date NOT NULL,
	"description" text,
	"is_fictional" boolean DEFAULT false NOT NULL,
	"owner_id" uuid NOT NULL,
	"consent_accepted_at" timestamp with time zone NOT NULL,
	"consent_policy_version" text NOT NULL,
	"hidden" boolean DEFAULT false NOT NULL,
	"hidden_reason" text,
	"hidden_at" timestamp with time zone,
	"closed_at" timestamp with time zone,
	"last_activity_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" json NOT NULL,
	"expire" timestamp (6) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sightings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"notice_id" uuid NOT NULL,
	"kind" "sighting_kind" NOT NULL,
	"seen_at" date,
	"neighborhood" text,
	"description" text NOT NULL,
	"photo_id" uuid,
	"contact_name" text,
	"contact_value" text,
	"consent_accepted_at" timestamp with time zone NOT NULL,
	"consent_policy_version" text NOT NULL,
	"owner_state" "sighting_owner_state" DEFAULT 'new' NOT NULL,
	"hidden" boolean DEFAULT false NOT NULL,
	"hidden_reason" text,
	"hidden_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"display_name" text NOT NULL,
	"role" "role" DEFAULT 'owner' NOT NULL,
	"consent_accepted_at" timestamp with time zone NOT NULL,
	"consent_policy_version" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "images" ADD CONSTRAINT "images_notice_id_notices_id_fk" FOREIGN KEY ("notice_id") REFERENCES "public"."notices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_actions" ADD CONSTRAINT "moderation_actions_moderator_id_users_id_fk" FOREIGN KEY ("moderator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notice_events" ADD CONSTRAINT "notice_events_notice_id_notices_id_fk" FOREIGN KEY ("notice_id") REFERENCES "public"."notices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notices" ADD CONSTRAINT "notices_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sightings" ADD CONSTRAINT "sightings_notice_id_notices_id_fk" FOREIGN KEY ("notice_id") REFERENCES "public"."notices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sightings" ADD CONSTRAINT "sightings_photo_id_images_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."images"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "images_notice_idx" ON "images" USING btree ("notice_id","visibility","position");--> statement-breakpoint
CREATE INDEX "moderation_actions_target_idx" ON "moderation_actions" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "notice_events_notice_idx" ON "notice_events" USING btree ("notice_id","at");--> statement-breakpoint
CREATE INDEX "notices_public_list_idx" ON "notices" USING btree ("hidden","status","neighborhood","event_date");--> statement-breakpoint
CREATE INDEX "notices_species_size_idx" ON "notices" USING btree ("species","size");--> statement-breakpoint
CREATE INDEX "notices_owner_idx" ON "notices" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "session" USING btree ("expire");--> statement-breakpoint
CREATE INDEX "sightings_notice_idx" ON "sightings" USING btree ("notice_id","created_at");