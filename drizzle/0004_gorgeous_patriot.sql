CREATE TABLE `global_network_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ipv6UlaPrefix` varchar(50),
	`packetSteering` int DEFAULT 0,
	`rpsEnabled` int DEFAULT 0,
	`rpsCpus` varchar(100),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `global_network_config_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `network_devices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(50) NOT NULL,
	`type` enum('ethernet','bridge','vlan','wireless','virtual') NOT NULL,
	`macaddr` varchar(20),
	`mtu` int DEFAULT 1500,
	`promisc` int DEFAULT 0,
	`multicast` int DEFAULT 1,
	`icmpRedirect` int DEFAULT 1,
	`txqueuelen` int DEFAULT 1000,
	`acceptRa` int DEFAULT 0,
	`sendRs` int DEFAULT 0,
	`igmpSnooping` int DEFAULT 0,
	`bridgePorts` text,
	`vlanId` int,
	`parentDevice` varchar(50),
	`enabled` int DEFAULT 1,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `network_devices_id` PRIMARY KEY(`id`),
	CONSTRAINT `network_devices_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `network_ports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(50) NOT NULL,
	`type` enum('wan','lan') NOT NULL,
	`protocol` enum('static','dhcp','pppoe') NOT NULL DEFAULT 'static',
	`ifname` varchar(100),
	`ipaddr` varchar(50),
	`netmask` varchar(50),
	`gateway` varchar(50),
	`dns` text,
	`ipv6` int DEFAULT 0,
	`ipv6addr` varchar(100),
	`ipv6gateway` varchar(100),
	`mtu` int DEFAULT 1500,
	`metric` int DEFAULT 0,
	`firewallZone` varchar(50),
	`dhcpServer` int DEFAULT 0,
	`dhcpStart` varchar(50),
	`dhcpEnd` varchar(50),
	`dhcpTime` varchar(20) DEFAULT '12h',
	`enabled` int DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `network_ports_id` PRIMARY KEY(`id`),
	CONSTRAINT `network_ports_name_unique` UNIQUE(`name`)
);
