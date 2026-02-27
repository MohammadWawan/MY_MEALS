CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`accountId` text NOT NULL,
	`providerId` text NOT NULL,
	`userId` integer NOT NULL,
	`accessToken` text,
	`refreshToken` text,
	`idToken` text,
	`password` text,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `favorite` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` integer NOT NULL,
	`menuId` text NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`menuId`) REFERENCES `menu`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `menu` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`category` text NOT NULL,
	`price` real NOT NULL,
	`imageUrl` text,
	`menuType` text DEFAULT 'customer' NOT NULL,
	`rating` real DEFAULT 0,
	`reviews` integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE `orderItem` (
	`id` text PRIMARY KEY NOT NULL,
	`orderId` text NOT NULL,
	`productId` text,
	`productName` text NOT NULL,
	`quantity` integer NOT NULL,
	`price` real NOT NULL,
	FOREIGN KEY (`orderId`) REFERENCES `order`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `order` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` integer NOT NULL,
	`totalAmount` real NOT NULL,
	`deliveryType` text DEFAULT 'immediate' NOT NULL,
	`status` text DEFAULT 'received' NOT NULL,
	`orderDate` integer NOT NULL,
	`expectedDate` integer NOT NULL,
	`isPaid` integer DEFAULT false NOT NULL,
	`paymentMethod` text,
	`receiptImageUrl` text,
	`deliveryProofUrl` text,
	`cancelReason` text,
	`validatedAt` integer,
	`preparingAt` integer,
	`readyAt` integer,
	`deliveringAt` integer,
	`deliveredAt` integer,
	`description` text,
	`mrn` text,
	`orderType` text DEFAULT 'customer' NOT NULL,
	`floor` text,
	`location` text,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expiresAt` integer NOT NULL,
	`ipAddress` text,
	`userAgent` text,
	`userId` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`password` text NOT NULL,
	`resetToken` text,
	`resetTokenExpiry` integer,
	`emailVerified` integer DEFAULT false NOT NULL,
	`image` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`role` text DEFAULT 'customer' NOT NULL,
	`employeeId` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expiresAt` integer NOT NULL
);
