CREATE TABLE `dhcp_static_leases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`networkPortId` int NOT NULL,
	`hostname` varchar(100),
	`macAddress` varchar(20) NOT NULL,
	`ipAddress` varchar(50) NOT NULL,
	`description` text,
	`enabled` int DEFAULT 1,
	`pendingChanges` int DEFAULT 0,
	`lastAppliedAt` timestamp,
	`applyStatus` enum('pending','success','failed') DEFAULT 'pending',
	`applyError` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dhcp_static_leases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dns_forwarders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`networkPortId` int,
	`dnsServer` varchar(100) NOT NULL,
	`priority` int DEFAULT 0,
	`enabled` int DEFAULT 1,
	`pendingChanges` int DEFAULT 0,
	`lastAppliedAt` timestamp,
	`applyStatus` enum('pending','success','failed') DEFAULT 'pending',
	`applyError` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dns_forwarders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `firewall_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`action` enum('accept','reject','drop') NOT NULL DEFAULT 'accept',
	`protocol` enum('tcp','udp','icmp','all') DEFAULT 'all',
	`sourceZone` varchar(50),
	`sourceIp` varchar(100),
	`sourcePort` varchar(50),
	`destZone` varchar(50),
	`destIp` varchar(100),
	`destPort` varchar(50),
	`priority` int DEFAULT 0,
	`description` text,
	`enabled` int DEFAULT 1,
	`pendingChanges` int DEFAULT 0,
	`lastAppliedAt` timestamp,
	`applyStatus` enum('pending','success','failed') DEFAULT 'pending',
	`applyError` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `firewall_rules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `port_forwarding_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`protocol` enum('tcp','udp','both') NOT NULL DEFAULT 'tcp',
	`sourceZone` varchar(50) DEFAULT 'wan',
	`externalPort` varchar(50) NOT NULL,
	`internalIp` varchar(50) NOT NULL,
	`internalPort` varchar(50) NOT NULL,
	`description` text,
	`enabled` int DEFAULT 1,
	`pendingChanges` int DEFAULT 0,
	`lastAppliedAt` timestamp,
	`applyStatus` enum('pending','success','failed') DEFAULT 'pending',
	`applyError` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `port_forwarding_rules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `qos_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`interface` varchar(50) NOT NULL,
	`direction` enum('upload','download','both') NOT NULL DEFAULT 'both',
	`maxBandwidth` int,
	`minBandwidth` int,
	`priority` int DEFAULT 0,
	`sourceIp` varchar(100),
	`destIp` varchar(100),
	`protocol` enum('tcp','udp','all') DEFAULT 'all',
	`sourcePort` varchar(50),
	`destPort` varchar(50),
	`description` text,
	`enabled` int DEFAULT 1,
	`pendingChanges` int DEFAULT 0,
	`lastAppliedAt` timestamp,
	`applyStatus` enum('pending','success','failed') DEFAULT 'pending',
	`applyError` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `qos_rules_id` PRIMARY KEY(`id`)
);
