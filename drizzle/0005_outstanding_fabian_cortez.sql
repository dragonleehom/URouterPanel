CREATE TABLE `static_routes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`interface` varchar(50) NOT NULL,
	`target` varchar(50) NOT NULL,
	`netmask` varchar(50),
	`gateway` varchar(50),
	`metric` int DEFAULT 0,
	`mtu` int,
	`table` varchar(50),
	`type` enum('unicast','local','broadcast','multicast','unreachable','prohibit','blackhole','anycast') DEFAULT 'unicast',
	`enabled` int DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `static_routes_id` PRIMARY KEY(`id`)
);
