ALTER TABLE `network_ports` ADD `autoStart` int DEFAULT 1;--> statement-breakpoint
ALTER TABLE `network_ports` ADD `dhcpHostname` varchar(100);--> statement-breakpoint
ALTER TABLE `network_ports` ADD `dhcpBroadcast` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `network_ports` ADD `dhcpClientId` varchar(100);--> statement-breakpoint
ALTER TABLE `network_ports` ADD `dhcpVendorClass` varchar(100);--> statement-breakpoint
ALTER TABLE `network_ports` ADD `useDefaultGateway` int DEFAULT 1;--> statement-breakpoint
ALTER TABLE `network_ports` ADD `useCustomDns` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `network_ports` ADD `dnsServers` text;--> statement-breakpoint
ALTER TABLE `network_ports` ADD `peerdns` int DEFAULT 1;--> statement-breakpoint
ALTER TABLE `network_ports` ADD `ipv6Delegation` int DEFAULT 1;--> statement-breakpoint
ALTER TABLE `network_ports` ADD `ipv6Assignment` varchar(20) DEFAULT '60';--> statement-breakpoint
ALTER TABLE `network_ports` ADD `ipv6Suffix` varchar(50);--> statement-breakpoint
ALTER TABLE `network_ports` ADD `ipv6PrefixFilter` varchar(50);--> statement-breakpoint
ALTER TABLE `network_ports` ADD `ipv4RoutingTable` varchar(50);--> statement-breakpoint
ALTER TABLE `network_ports` ADD `ipv6RoutingTable` varchar(50);--> statement-breakpoint
ALTER TABLE `network_ports` ADD `ignoreDhcpServer` int DEFAULT 0;