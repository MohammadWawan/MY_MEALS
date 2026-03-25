CREATE TABLE `coupon` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`discountValue` real NOT NULL,
	`discountType` text DEFAULT 'percentage' NOT NULL,
	`isActive` integer DEFAULT true NOT NULL,
	`expiryDate` integer,
	`createdAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `coupon_code_unique` ON `coupon` (`code`);--> statement-breakpoint
ALTER TABLE `order` ADD `couponCode` text;--> statement-breakpoint
ALTER TABLE `order` ADD `discountTotal` real DEFAULT 0;