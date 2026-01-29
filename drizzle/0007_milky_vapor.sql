CREATE TABLE `config_snapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`configType` varchar(50) NOT NULL,
	`configId` int NOT NULL,
	`snapshotData` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`appliedAt` timestamp,
	CONSTRAINT `config_snapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `network_ports` ADD `savedAt` timestamp DEFAULT (now()) NOT NULL;--> statement-breakpoint
ALTER TABLE `network_ports` ADD `appliedAt` timestamp;