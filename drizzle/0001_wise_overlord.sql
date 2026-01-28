CREATE TABLE `app_store_apps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`appKey` varchar(100) NOT NULL,
	`name` varchar(200) NOT NULL,
	`shortDesc` text,
	`description` text,
	`type` varchar(50),
	`iconUrl` varchar(500),
	`website` varchar(500),
	`github` varchar(500),
	`document` varchar(500),
	`tags` text,
	`architectures` text,
	`memoryRequired` int,
	`recommend` int DEFAULT 0,
	`installCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `app_store_apps_id` PRIMARY KEY(`id`),
	CONSTRAINT `app_store_apps_appKey_unique` UNIQUE(`appKey`)
);
--> statement-breakpoint
CREATE TABLE `app_store_versions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`appKey` varchar(100) NOT NULL,
	`version` varchar(50) NOT NULL,
	`isStable` int DEFAULT 0,
	`dockerCompose` text,
	`versionData` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `app_store_versions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `installed_apps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`appKey` varchar(100) NOT NULL,
	`version` varchar(50) NOT NULL,
	`containerName` varchar(200) NOT NULL,
	`status` enum('running','stopped','error','installing') DEFAULT 'installing',
	`portMappings` text,
	`envConfig` text,
	`installPath` varchar(500),
	`installedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `installed_apps_id` PRIMARY KEY(`id`),
	CONSTRAINT `installed_apps_containerName_unique` UNIQUE(`containerName`)
);
