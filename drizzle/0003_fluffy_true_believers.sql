CREATE TABLE `nat_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`networkId` int NOT NULL,
	`ruleType` enum('snat','dnat','masquerade') NOT NULL,
	`protocol` enum('tcp','udp','all') DEFAULT 'tcp',
	`sourceIp` varchar(50),
	`sourcePort` int,
	`destinationIp` varchar(50),
	`destinationPort` int,
	`targetIp` varchar(50),
	`targetPort` int,
	`enabled` int DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `nat_rules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `network_interfaces` (
	`id` int AUTO_INCREMENT NOT NULL,
	`networkId` int NOT NULL,
	`resourceType` enum('container','vm') NOT NULL,
	`resourceId` varchar(200) NOT NULL,
	`interfaceName` varchar(50),
	`macAddress` varchar(20),
	`ipAddress` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `network_interfaces_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `network_topology` (
	`id` int AUTO_INCREMENT NOT NULL,
	`networkId` int NOT NULL,
	`topologyData` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `network_topology_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `routing_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceNetworkId` int NOT NULL,
	`destinationNetwork` varchar(50) NOT NULL,
	`gateway` varchar(50),
	`metric` int DEFAULT 100,
	`enabled` int DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `routing_rules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `virtual_networks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`type` enum('bridge','nat','routed','isolated') NOT NULL DEFAULT 'bridge',
	`subnet` varchar(50),
	`gateway` varchar(50),
	`vlanId` int,
	`bridgeName` varchar(50),
	`dhcpEnabled` int DEFAULT 1,
	`dhcpRange` varchar(100),
	`dnsServers` text,
	`status` enum('active','inactive','error') DEFAULT 'inactive',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `virtual_networks_id` PRIMARY KEY(`id`),
	CONSTRAINT `virtual_networks_name_unique` UNIQUE(`name`)
);
