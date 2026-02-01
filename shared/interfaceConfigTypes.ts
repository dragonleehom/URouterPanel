/**
 * 接口配置参数类型定义
 * 参考iStoreOS的接口配置结构
 */

/**
 * DHCP主机名选项
 */
export type DhcpHostnameOption = 'none' | 'system' | 'custom';

/**
 * IPv6分配长度选项
 */
export type Ipv6AssignmentLength = 'disabled' | '64' | '63' | '62' | '61' | '60' | '59' | '58' | '57' | '56';

/**
 * 路由表选项
 */
export type RoutingTableOption = 'default' | 'main' | 'custom';

/**
 * 接口状态信息
 */
export interface InterfaceStatus {
  device: string; // 设备名称(如eth0)
  uptime: string; // 运行时间(如"0h 20m 4s")
  macAddress: string; // MAC地址
  rxBytes: number; // 接收字节数
  rxPackets: number; // 接收数据包数
  txBytes: number; // 发送字节数
  txPackets: number; // 发送数据包数
  ipv4Address?: string; // IPv4地址
  ipv6Address?: string; // IPv6地址
}

/**
 * 常规设置配置
 */
export interface GeneralSettings {
  name: string; // 接口名称
  protocol: 'static' | 'dhcp' | 'pppoe'; // 协议
  device: string; // 设备
  autoStart: boolean; // 开机自动运行
  dhcpHostname?: DhcpHostnameOption | string; // 请求DHCP时发送的主机名
  firewallZone?: string; // 防火墙区域
  
  // 静态IP配置
  ipaddr?: string;
  netmask?: string;
  gateway?: string;
  
  // PPPoE配置
  pppoeUsername?: string;
  pppoePassword?: string;
  pppoeServiceName?: string;
}

/**
 * 高级设置配置
 */
export interface AdvancedSettings {
  // DHCP客户端选项
  dhcpBroadcast?: boolean; // 使用广播标志
  dhcpClientId?: string; // 覆盖DHCP客户端标识符ID
  dhcpVendorClass?: string; // 覆盖DHCP对接收到的包括配置
  
  // 路由和DNS
  useDefaultGateway?: boolean; // 使用默认网关
  peerdns?: boolean; // 使用对端的DNS
  useCustomDns?: boolean; // 自定义DNS
  dnsServers?: string[]; // DNS服务器列表
  
  // MTU和Metric
  mtu?: number;
  metric?: number;
  
  // 路由表覆盖
  ipv4RoutingTable?: RoutingTableOption | string;
  ipv6RoutingTable?: RoutingTableOption | string;
  
  // IPv6配置
  ipv6Delegation?: boolean; // 委托IPv6前缀
  ipv6Assignment?: Ipv6AssignmentLength; // IPv6分配长度
  ipv6PrefixFilter?: string; // IPv6前缀过滤器
  ipv6Suffix?: string; // IPv6后缀
}

/**
 * DHCP服务器配置
 */
export interface DhcpServerSettings {
  ignoreDhcpServer: boolean; // 忽略此接口(不提供DHCP服务)
}

/**
 * 完整的接口配置
 */
export interface InterfaceConfig extends GeneralSettings, AdvancedSettings, DhcpServerSettings {
  id?: number;
  type: 'wan' | 'lan';
  enabled: boolean;
}
