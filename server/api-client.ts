/**
 * Python后端API客户端
 * 用于与URouterOS Python后端进行通信
 */

import axios, { AxiosInstance } from 'axios';

// Python后端API基础URL
const PYTHON_API_BASE_URL = process.env.PYTHON_API_URL || 'http://localhost:8000';

class PythonAPIClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: PYTHON_API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // ==================== 网络接口管理 API ====================

  /**
   * 获取所有网络接口
   */
  async getInterfaces() {
    const response = await this.client.get('/api/network/interfaces');
    return response.data;
  }

  /**
   * 获取物理网络接口
   */
  async getPhysicalInterfaces() {
    const response = await this.client.get('/api/network/interfaces/physical');
    return response.data;
  }

  /**
   * 获取指定接口详情
   */
  async getInterface(name: string) {
    const response = await this.client.get(`/api/network/interfaces/${name}`);
    return response.data;
  }

  /**
   * 获取接口统计信息
   */
  async getInterfaceStats(name: string) {
    const response = await this.client.get(`/api/network/interfaces/${name}/stats`);
    return response.data;
  }

  /**
   * 配置网络接口
   */
  async configureInterface(name: string, config: any) {
    const response = await this.client.put(`/api/network/interfaces/${name}`, config);
    return response.data;
  }

  /**
   * 启用网络接口
   */
  async enableInterface(name: string) {
    const response = await this.client.put(`/api/network/interfaces/${name}`, {
      name,
      state: 'up'
    });
    return response.data;
  }

  /**
   * 禁用网络接口
   */
  async disableInterface(name: string) {
    const response = await this.client.put(`/api/network/interfaces/${name}`, {
      name,
      state: 'down'
    });
    return response.data;
  }

  /**
   * 创建网桥
   */
  async createBridge(config: any) {
    const response = await this.client.post('/api/network/bridges', config);
    return response.data;
  }

  /**
   * 删除网桥
   */
  async deleteBridge(name: string) {
    const response = await this.client.delete(`/api/network/bridges/${name}`);
    return response.data;
  }

  /**
   * 创建VLAN接口
   */
  async createVLAN(config: any) {
    const response = await this.client.post('/api/network/vlans', config);
    return response.data;
  }

  /**
   * 删除VLAN接口
   */
  async deleteVLAN(name: string) {
    const response = await this.client.delete(`/api/network/vlans/${name}`);
    return response.data;
  }

  // ==================== 防火墙管理 API ====================

  /**
   * 获取防火墙规则
   */
  async getFirewallRules(chain?: string) {
    const params = chain ? { chain } : {};
    const response = await this.client.get('/api/network/firewall/rules', { params });
    return response.data;
  }

  /**
   * 添加防火墙规则
   */
  async addFirewallRule(rule: any) {
    const response = await this.client.post('/api/network/firewall/rules', rule);
    return response.data;
  }

  /**
   * 删除防火墙规则
   */
  async deleteFirewallRule(chain?: string) {
    const params = chain ? { chain } : {};
    const response = await this.client.delete('/api/network/firewall/rules', { params });
    return response.data;
  }

  /**
   * 添加MASQUERADE规则
   */
  async addMasqueradeRule(rule: any) {
    const response = await this.client.post('/api/network/firewall/masquerade', rule);
    return response.data;
  }

  /**
   * 添加端口转发规则
   */
  async addPortForwardRule(rule: any) {
    const response = await this.client.post('/api/network/firewall/port-forward', rule);
    return response.data;
  }

  /**
   * 启用IP转发
   */
  async enableIPForward() {
    const response = await this.client.post('/api/network/firewall/ip-forward/enable');
    return response.data;
  }

  /**
   * 禁用IP转发
   */
  async disableIPForward() {
    const response = await this.client.post('/api/network/firewall/ip-forward/disable');
    return response.data;
  }

  // ==================== 路由管理 API ====================

  /**
   * 获取路由表
   */
  async getRoutes(table: string = 'main') {
    const response = await this.client.get('/api/network/routes', { params: { table } });
    return response.data;
  }

  /**
   * 添加路由
   */
  async addRoute(route: any) {
    const response = await this.client.post('/api/network/routes', route);
    return response.data;
  }

  /**
   * 删除路由
   */
  async deleteRoute(route: any) {
    const response = await this.client.delete('/api/network/routes', { data: route });
    return response.data;
  }

  /**
   * 获取默认网关
   */
  async getDefaultGateway() {
    const response = await this.client.get('/api/network/routes/default');
    return response.data;
  }

  /**
   * 设置默认网关
   */
  async setDefaultGateway(gateway: string, device?: string) {
    const response = await this.client.post('/api/network/routes/default', null, {
      params: { gateway, device }
    });
    return response.data;
  }

  /**
   * 获取策略路由规则
   */
  async getPolicyRules() {
    const response = await this.client.get('/api/network/policy-rules');
    return response.data;
  }

  /**
   * 添加策略路由规则
   */
  async addPolicyRule(rule: any) {
    const response = await this.client.post('/api/network/policy-rules', rule);
    return response.data;
  }

  // ==================== DHCP/DNS管理 API ====================

  /**
   * 配置DHCP服务
   */
  async configureDHCP(config: any) {
    const response = await this.client.post('/api/network/dhcp/configure', config);
    return response.data;
  }

  /**
   * 获取DHCP租约列表
   */
  async getDHCPLeases() {
    const response = await this.client.get('/api/network/dhcp/leases');
    return response.data;
  }

  /**
   * 添加静态租约
   */
  async addStaticLease(lease: any) {
    const response = await this.client.post('/api/network/dhcp/static-leases', lease);
    return response.data;
  }

  /**
   * 删除静态租约
   */
  async deleteStaticLease(mac: string) {
    const response = await this.client.delete(`/api/network/dhcp/static-leases/${mac}`);
    return response.data;
  }

  /**
   * 配置DNS服务
   */
  async configureDNS(config: any) {
    const response = await this.client.post('/api/network/dns/configure', config);
    return response.data;
  }

  /**
   * 获取DNS记录列表
   */
  async getDNSRecords() {
    const response = await this.client.get('/api/network/dns/records');
    return response.data;
  }

  /**
   * 添加DNS记录
   */
  async addDNSRecord(record: any) {
    const response = await this.client.post('/api/network/dns/records', record);
    return response.data;
  }

  /**
   * 删除DNS记录
   */
  async deleteDNSRecord(hostname: string) {
    const response = await this.client.delete(`/api/network/dns/records/${hostname}`);
    return response.data;
  }

  /**
   * 获取DNS服务状态
   */
  async getDNSStatus() {
    const response = await this.client.get('/api/network/dns/status');
    return response.data;
  }

  /**
   * 启动DNS服务
   */
  async startDNSService() {
    const response = await this.client.post('/api/network/dns/start');
    return response.data;
  }

  /**
   * 停止DNS服务
   */
  async stopDNSService() {
    const response = await this.client.post('/api/network/dns/stop');
    return response.data;
  }

  /**
   * 重启DNS服务
   */
  async restartDNSService() {
    const response = await this.client.post('/api/network/dns/restart');
    return response.data;
  }

  /**
   * 获取DHCP配置(兼容旧接口)
   */
  async getDHCPConfig() {
    const response = await this.client.get('/api/network/dhcp/config');
    return response.data;
  }

  /**
   * 更新DHCP配置(兼容旧接口)
   */
  async updateDHCPConfig(config: any) {
    const response = await this.client.put('/api/network/dhcp/config', config);
    return response.data;
  }

  // ==================== 无线网络管理 API ====================

  /**
   * 获取无线接口列表
   */
  async getWirelessInterfaces() {
    const response = await this.client.get('/api/network/wireless/interfaces');
    return response.data;
  }

  /**
   * 配置无线网络
   */
  async configureWireless(config: any) {
    const response = await this.client.post('/api/network/wireless/configure', config);
    return response.data;
  }

  /**
   * 启用无线网络
   */
  async enableWireless(iface: string) {
    const response = await this.client.post(`/api/network/wireless/${iface}/enable`);
    return response.data;
  }

  /**
   * 禁用无线网络
   */
  async disableWireless(iface: string) {
    const response = await this.client.post(`/api/network/wireless/${iface}/disable`);
    return response.data;
  }

  /**
   * 获取无线客户端列表
   */
  async getWirelessClients(iface: string) {
    const response = await this.client.get(`/api/network/wireless/${iface}/clients`);
    return response.data;
  }

  // ==================== QoS流控管理 API ====================

  /**
   * 获取QoS配置
   */
  async getQoSConfig() {
    const response = await this.client.get('/api/network/qos/config');
    return response.data;
  }

  /**
   * 配置QoS规则
   */
  async configureQoS(config: any) {
    const response = await this.client.post('/api/network/qos/configure', config);
    return response.data;
  }

  /**
   * 启用QoS
   */
  async enableQoS() {
    const response = await this.client.post('/api/network/qos/enable');
    return response.data;
  }

  /**
   * 禁用QoS
   */
  async disableQoS() {
    const response = await this.client.post('/api/network/qos/disable');
    return response.data;
  }

  // ==================== 多WAN管理 API ====================

  /**
   * 获取多WAN配置
   */
  async getMultiWANConfig() {
    const response = await this.client.get('/api/network/multiwan/config');
    return response.data;
  }

  /**
   * 配置多WAN
   */
  async configureMultiWAN(config: any) {
    const response = await this.client.post('/api/network/multiwan/configure', config);
    return response.data;
  }

  /**
   * 获取WAN状态
   */
  async getWANStatus() {
    const response = await this.client.get('/api/network/multiwan/status');
    return response.data;
  }

  // ==================== VPN管理 API ====================

  /**
   * 获取OpenVPN配置
   */
  async getOpenVPNConfig() {
    const response = await this.client.get('/api/network/vpn/openvpn/config');
    return response.data;
  }

  /**
   * 配置OpenVPN服务器
   */
  async configureOpenVPN(config: any) {
    const response = await this.client.post('/api/network/vpn/openvpn/configure', config);
    return response.data;
  }

  /**
   * 启动OpenVPN服务
   */
  async startOpenVPN() {
    const response = await this.client.post('/api/network/vpn/openvpn/start');
    return response.data;
  }

  /**
   * 停止OpenVPN服务
   */
  async stopOpenVPN() {
    const response = await this.client.post('/api/network/vpn/openvpn/stop');
    return response.data;
  }

  /**
   * 获取WireGuard配置
   */
  async getWireGuardConfig() {
    const response = await this.client.get('/api/network/vpn/wireguard/config');
    return response.data;
  }

  /**
   * 配置WireGuard服务器
   */
  async configureWireGuard(config: any) {
    const response = await this.client.post('/api/network/vpn/wireguard/configure', config);
    return response.data;
  }

  /**
   * 启动WireGuard服务
   */
  async startWireGuard() {
    const response = await this.client.post('/api/network/vpn/wireguard/start');
    return response.data;
  }

  /**
   * 停止WireGuard服务
   */
  async stopWireGuard() {
    const response = await this.client.post('/api/network/vpn/wireguard/stop');
    return response.data;
  }

  /**
   * 获取VPN客户端列表
   */
  async getVPNClients() {
    const response = await this.client.get('/api/network/vpn/clients');
    return response.data;
  }

  // ==================== IPv6管理 API ====================

  /**
   * 获取IPv6配置
   */
  async getIPv6Config() {
    const response = await this.client.get('/api/network/ipv6/config');
    return response.data;
  }

  /**
   * 配置IPv6
   */
  async configureIPv6(config: any) {
    const response = await this.client.post('/api/network/ipv6/configure', config);
    return response.data;
  }

  /**
   * 启用IPv6
   */
  async enableIPv6() {
    const response = await this.client.post('/api/network/ipv6/enable');
    return response.data;
  }

  /**
   * 禁用IPv6
   */
  async disableIPv6() {
    const response = await this.client.post('/api/network/ipv6/disable');
    return response.data;
  }

  // ==================== DDNS管理 API ====================

  /**
   * 获取DDNS配置
   */
  async getDDNSConfig() {
    const response = await this.client.get('/api/network/ddns/config');
    return response.data;
  }

  /**
   * 配置DDNS
   */
  async configureDDNS(config: any) {
    const response = await this.client.post('/api/network/ddns/configure', config);
    return response.data;
  }

  /**
   * 启用DDNS
   */
  async enableDDNS() {
    const response = await this.client.post('/api/network/ddns/enable');
    return response.data;
  }

  /**
   * 禁用DDNS
   */
  async disableDDNS() {
    const response = await this.client.post('/api/network/ddns/disable');
    return response.data;
  }

  /**
   * 强制更新DDNS
   */
  async updateDDNS() {
    const response = await this.client.post('/api/network/ddns/update');
    return response.data;
  }

  // ==================== UPnP管理 API ====================

  /**
   * 获取UPnP配置
   */
  async getUPnPConfig() {
    const response = await this.client.get('/api/network/upnp/config');
    return response.data;
  }

  /**
   * 配置UPnP
   */
  async configureUPnP(config: any) {
    const response = await this.client.post('/api/network/upnp/configure', config);
    return response.data;
  }

  /**
   * 启用UPnP
   */
  async enableUPnP() {
    const response = await this.client.post('/api/network/upnp/enable');
    return response.data;
  }

  /**
   * 禁用UPnP
   */
  async disableUPnP() {
    const response = await this.client.post('/api/network/upnp/disable');
    return response.data;
  }

  /**
   * 获取UPnP端口映射列表
   */
  async getUPnPMappings() {
    const response = await this.client.get('/api/network/upnp/mappings');
    return response.data;
  }

  // ==================== 流量统计 API ====================

  /**
   * 获取实时流量统计
   */
  async getTrafficStats() {
    const response = await this.client.get('/api/network/traffic/stats');
    return response.data;
  }

  /**
   * 获取历史流量数据
   */
  async getTrafficHistory(period: string = '24h') {
    const response = await this.client.get('/api/network/traffic/history', {
      params: { period }
    });
    return response.data;
  }

  /**
   * 获取按设备分组的流量统计
   */
  async getTrafficByDevice() {
    const response = await this.client.get('/api/network/traffic/by-device');
    return response.data;
  }

  /**
   * 获取按接口分组的流量统计
   */
  async getTrafficByInterface() {
    const response = await this.client.get('/api/network/traffic/by-interface');
    return response.data;
  }

  // ==================== MAC地址管理 API ====================

  /**
   * 获取MAC地址列表
   */
  async getMACAddresses() {
    const response = await this.client.get('/api/network/mac/list');
    return response.data;
  }

  /**
   * 添加MAC地址过滤规则
   */
  async addMACFilter(rule: any) {
    const response = await this.client.post('/api/network/mac/filter', rule);
    return response.data;
  }

  /**
   * 删除MAC地址过滤规则
   */
  async deleteMACFilter(mac: string) {
    const response = await this.client.delete(`/api/network/mac/filter/${mac}`);
    return response.data;
  }

  /**
   * 克隆MAC地址
   */
  async cloneMAC(iface: string, mac: string) {
    const response = await this.client.post('/api/network/mac/clone', { iface, mac });
    return response.data;
  }

  /**
   * 绑定MAC-IP
   */
  async bindMACIP(mac: string, ip: string) {
    const response = await this.client.post('/api/network/mac/bind', { mac, ip });
    return response.data;
  }

  // ==================== WOL网络唤醒 API ====================

  /**
   * 发送WOL魔术包
   */
  async sendWOL(mac: string) {
    const response = await this.client.post('/api/network/wol/wake', { mac });
    return response.data;
  }

  /**
   * 获取WOL设备列表
   */
  async getWOLDevices() {
    const response = await this.client.get('/api/network/wol/devices');
    return response.data;
  }

  /**
   * 添加WOL设备
   */
  async addWOLDevice(device: any) {
    const response = await this.client.post('/api/network/wol/devices', device);
    return response.data;
  }

  /**
   * 删除WOL设备
   */
  async deleteWOLDevice(id: string) {
    const response = await this.client.delete(`/api/network/wol/devices/${id}`);
    return response.data;
  }

  // ==================== 容器管理 API ====================

  /**
   * 获取所有容器
   */
  async getContainers() {
    const response = await this.client.get('/api/containers');
    return response.data;
  }

  /**
   * 获取指定容器详情
   */
  async getContainer(containerId: string) {
    const response = await this.client.get(`/api/containers/${containerId}`);
    return response.data;
  }

  /**
   * 启动容器
   */
  async startContainer(containerId: string) {
    const response = await this.client.post(`/api/containers/${containerId}/start`);
    return response.data;
  }

  /**
   * 停止容器
   */
  async stopContainer(containerId: string) {
    const response = await this.client.post(`/api/containers/${containerId}/stop`);
    return response.data;
  }

  /**
   * 重启容器
   */
  async restartContainer(containerId: string) {
    const response = await this.client.post(`/api/containers/${containerId}/restart`);
    return response.data;
  }

  /**
   * 删除容器
   */
  async deleteContainer(containerId: string) {
    const response = await this.client.delete(`/api/containers/${containerId}`);
    return response.data;
  }

  /**
   * 获取容器统计信息
   */
  async getContainerStats(containerId: string) {
    const response = await this.client.get(`/api/containers/${containerId}/stats`);
    return response.data;
  }

  /**
   * 获取所有镜像
   */
  async getImages() {
    const response = await this.client.get('/api/images');
    return response.data;
  }

  /**
   * 拉取镜像
   */
  async pullImage(imageName: string) {
    const response = await this.client.post('/api/images/pull', { image: imageName });
    return response.data;
  }

  /**
   * 删除镜像
   */
  async deleteImage(imageId: string) {
    const response = await this.client.delete(`/api/images/${imageId}`);
    return response.data;
  }

  // ==================== 虚拟机管理 API ====================

  /**
   * 获取所有虚拟机
   */
  async getVMs() {
    const response = await this.client.get('/api/vms');
    return response.data;
  }

  /**
   * 获取指定虚拟机详情
   */
  async getVM(vmName: string) {
    const response = await this.client.get(`/api/vms/${vmName}`);
    return response.data;
  }

  /**
   * 启动虚拟机
   */
  async startVM(vmName: string) {
    const response = await this.client.post(`/api/vms/${vmName}/start`);
    return response.data;
  }

  /**
   * 停止虚拟机
   */
  async stopVM(vmName: string) {
    const response = await this.client.post(`/api/vms/${vmName}/stop`);
    return response.data;
  }

  /**
   * 重启虚拟机
   */
  async rebootVM(vmName: string) {
    const response = await this.client.post(`/api/vms/${vmName}/reboot`);
    return response.data;
  }

  /**
   * 删除虚拟机
   */
  async deleteVM(vmName: string) {
    const response = await this.client.delete(`/api/vms/${vmName}`);
    return response.data;
  }

  // ==================== 硬件监控 API ====================

  /**
   * 获取系统概览
   */
  async getSystemOverview() {
    const response = await this.client.get('/api/system/overview');
    return response.data;
  }

  /**
   * 获取CPU信息
   */
  async getCPUInfo() {
    const response = await this.client.get('/api/system/cpu');
    return response.data;
  }

  /**
   * 获取内存信息
   */
  async getMemoryInfo() {
    const response = await this.client.get('/api/system/memory');
    return response.data;
  }

  /**
   * 获取磁盘信息
   */
  async getDiskInfo() {
    const response = await this.client.get('/api/system/disk');
    return response.data;
  }

  /**
   * 获取网卡信息
   */
  async getNetworkInfo() {
    const response = await this.client.get('/api/system/network');
    return response.data;
  }

  /**
   * 获取GPU信息
   */
  async getGPUInfo() {
    const response = await this.client.get('/api/system/gpu');
    return response.data;
  }
}

// 导出单例实例
export const pythonAPI = new PythonAPIClient();
