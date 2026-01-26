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

  // ==================== 网络管理 API ====================

  /**
   * 获取所有网络接口
   */
  async getInterfaces() {
    const response = await this.client.get('/api/network/interfaces');
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
   * 启用网络接口
   */
  async enableInterface(name: string) {
    const response = await this.client.post(`/api/network/interfaces/${name}/enable`);
    return response.data;
  }

  /**
   * 禁用网络接口
   */
  async disableInterface(name: string) {
    const response = await this.client.post(`/api/network/interfaces/${name}/disable`);
    return response.data;
  }

  /**
   * 获取防火墙规则
   */
  async getFirewallRules() {
    const response = await this.client.get('/api/network/firewall/rules');
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
  async deleteFirewallRule(ruleId: string) {
    const response = await this.client.delete(`/api/network/firewall/rules/${ruleId}`);
    return response.data;
  }

  /**
   * 获取路由表
   */
  async getRoutes() {
    const response = await this.client.get('/api/network/routes');
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
  async deleteRoute(destination: string) {
    const response = await this.client.delete(`/api/network/routes/${destination}`);
    return response.data;
  }

  /**
   * 获取DHCP配置
   */
  async getDHCPConfig() {
    const response = await this.client.get('/api/network/dhcp/config');
    return response.data;
  }

  /**
   * 更新DHCP配置
   */
  async updateDHCPConfig(config: any) {
    const response = await this.client.put('/api/network/dhcp/config', config);
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
