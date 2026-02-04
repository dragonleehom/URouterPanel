CREATE TABLE `local_users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`username` varchar(64) NOT NULL,
	`passwordHash` varchar(255) NOT NULL,
	`role` enum('admin','user') NOT NULL DEFAULT 'user',
	`enabled` int NOT NULL DEFAULT 1,
	`lastLoginAt` timestamp,
	`lastLoginIp` varchar(45),
	`failedLoginAttempts` int DEFAULT 0,
	`lockedUntil` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `local_users_id` PRIMARY KEY(`id`),
	CONSTRAINT `local_users_username_unique` UNIQUE(`username`)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`token` varchar(255) NOT NULL,
	`ipAddress` varchar(45),
	`userAgent` text,
	`lastActivityAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `sessions_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `ssh_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`port` int NOT NULL DEFAULT 22,
	`permitRootLogin` enum('yes','no','prohibit-password') NOT NULL DEFAULT 'prohibit-password',
	`passwordAuthentication` int NOT NULL DEFAULT 1,
	`pubkeyAuthentication` int NOT NULL DEFAULT 1,
	`allowUsers` text,
	`denyUsers` text,
	`maxAuthTries` int DEFAULT 6,
	`loginGraceTime` int DEFAULT 120,
	`clientAliveInterval` int DEFAULT 300,
	`clientAliveCountMax` int DEFAULT 3,
	`pendingChanges` int DEFAULT 0,
	`lastAppliedAt` timestamp,
	`applyStatus` enum('pending','success','failed') DEFAULT 'pending',
	`applyError` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ssh_config_id` PRIMARY KEY(`id`)
);
