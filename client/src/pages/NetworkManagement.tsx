/**
 * 网络管理页面
 * 管理网络接口、防火墙、路由、DHCP/DNS
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Network,
  Shield,
  Route,
  Server,
  Plus,
  Settings,
  Activity,
} from "lucide-react";
import { toast } from "sonner";

export default function NetworkManagement() {
  const handleAction = (action: string) => {
    toast.info(`功能开发中: ${action}`);
  };

  return (
    <div className="space-y-6">
      {/* 页面标题和操作 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium">网络管理</h1>
          <p className="text-sm text-muted-foreground mt-1">
            配置网络接口、防火墙、路由和DNS服务
          </p>
        </div>
        <Button onClick={() => handleAction("添加网络接口")}>
          <Plus className="w-4 h-4 mr-2" />
          添加接口
        </Button>
      </div>

      {/* 标签页 */}
      <Tabs defaultValue="interfaces" className="space-y-4">
        <TabsList>
          <TabsTrigger value="interfaces">
            <Network className="w-4 h-4 mr-2" />
            网络接口
          </TabsTrigger>
          <TabsTrigger value="firewall">
            <Shield className="w-4 h-4 mr-2" />
            防火墙
          </TabsTrigger>
          <TabsTrigger value="routes">
            <Route className="w-4 h-4 mr-2" />
            路由
          </TabsTrigger>
          <TabsTrigger value="dhcp">
            <Server className="w-4 h-4 mr-2" />
            DHCP/DNS
          </TabsTrigger>
        </TabsList>

        {/* 网络接口 */}
        <TabsContent value="interfaces" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>物理接口</CardTitle>
                <Button asChild variant="outline" size="sm">
                  <Link href="/network/interfaces">
                    进入接口管理
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full table-zebra">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        接口名称
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        状态
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        IP地址
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        MAC地址
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        速率
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        流量
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      {
                        name: "eth0",
                        status: "up",
                        ip: "192.168.1.1/24",
                        mac: "00:1a:2b:3c:4d:5e",
                        speed: "10 Gbps",
                        traffic: "↑ 125 MB/s ↓ 80 MB/s",
                      },
                      {
                        name: "eth1",
                        status: "up",
                        ip: "10.0.0.1/24",
                        mac: "00:1a:2b:3c:4d:5f",
                        speed: "10 Gbps",
                        traffic: "↑ 45 MB/s ↓ 30 MB/s",
                      },
                      {
                        name: "eth2",
                        status: "down",
                        ip: "-",
                        mac: "00:1a:2b:3c:4d:60",
                        speed: "-",
                        traffic: "-",
                      },
                    ].map((iface) => (
                      <tr key={iface.name}>
                        <td className="py-3 px-4">
                          <code className="text-sm font-mono">{iface.name}</code>
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={
                              iface.status === "up" ? "default" : "secondary"
                            }
                          >
                            {iface.status === "up" ? "运行中" : "已停止"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <code className="text-sm font-mono">{iface.ip}</code>
                        </td>
                        <td className="py-3 px-4">
                          <code className="text-sm font-mono text-muted-foreground">
                            {iface.mac}
                          </code>
                        </td>
                        <td className="py-3 px-4 text-sm">{iface.speed}</td>
                        <td className="py-3 px-4 text-sm font-mono">
                          {iface.traffic}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAction(`配置${iface.name}`)}
                          >
                            <Settings className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>虚拟接口</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full table-zebra">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        接口名称
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        类型
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        IP地址
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        关联接口
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      {
                        name: "br0",
                        type: "Bridge",
                        ip: "192.168.100.1/24",
                        parent: "eth0, eth1",
                      },
                      {
                        name: "vlan10",
                        type: "VLAN",
                        ip: "10.10.0.1/24",
                        parent: "eth0",
                      },
                    ].map((iface) => (
                      <tr key={iface.name}>
                        <td className="py-3 px-4">
                          <code className="text-sm font-mono">{iface.name}</code>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline">{iface.type}</Badge>
                        </td>
                        <td className="py-3 px-4">
                          <code className="text-sm font-mono">{iface.ip}</code>
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {iface.parent}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAction(`配置${iface.name}`)}
                          >
                            <Settings className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 防火墙 */}
        <TabsContent value="firewall" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>防火墙规则</CardTitle>
              <Button onClick={() => handleAction("添加防火墙规则")}>
                <Plus className="w-4 h-4 mr-2" />
                添加规则
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full table-zebra">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        规则名称
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        链
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        协议
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        源地址
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        目标端口
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        动作
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      {
                        name: "允许SSH",
                        chain: "INPUT",
                        protocol: "TCP",
                        source: "0.0.0.0/0",
                        port: "22",
                        action: "ACCEPT",
                      },
                      {
                        name: "允许HTTP",
                        chain: "INPUT",
                        protocol: "TCP",
                        source: "0.0.0.0/0",
                        port: "80",
                        action: "ACCEPT",
                      },
                      {
                        name: "允许HTTPS",
                        chain: "INPUT",
                        protocol: "TCP",
                        source: "0.0.0.0/0",
                        port: "443",
                        action: "ACCEPT",
                      },
                      {
                        name: "NAT转发",
                        chain: "POSTROUTING",
                        protocol: "ALL",
                        source: "192.168.1.0/24",
                        port: "-",
                        action: "MASQUERADE",
                      },
                    ].map((rule, idx) => (
                      <tr key={idx}>
                        <td className="py-3 px-4 text-sm">{rule.name}</td>
                        <td className="py-3 px-4">
                          <code className="text-xs font-mono">{rule.chain}</code>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline">{rule.protocol}</Badge>
                        </td>
                        <td className="py-3 px-4">
                          <code className="text-xs font-mono">{rule.source}</code>
                        </td>
                        <td className="py-3 px-4 text-sm">{rule.port}</td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={
                              rule.action === "ACCEPT" ? "default" : "secondary"
                            }
                          >
                            {rule.action}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAction(`编辑规则${idx + 1}`)}
                          >
                            <Settings className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 路由 */}
        <TabsContent value="routes" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>路由表</CardTitle>
              <Button onClick={() => handleAction("添加路由")}>
                <Plus className="w-4 h-4 mr-2" />
                添加路由
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full table-zebra">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        目标网络
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        网关
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        接口
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        跃点数
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        状态
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      {
                        dest: "0.0.0.0/0",
                        gateway: "192.168.1.254",
                        iface: "eth0",
                        metric: "100",
                        status: "active",
                      },
                      {
                        dest: "192.168.1.0/24",
                        gateway: "-",
                        iface: "eth0",
                        metric: "0",
                        status: "active",
                      },
                      {
                        dest: "10.0.0.0/24",
                        gateway: "-",
                        iface: "eth1",
                        metric: "0",
                        status: "active",
                      },
                    ].map((route, idx) => (
                      <tr key={idx}>
                        <td className="py-3 px-4">
                          <code className="text-sm font-mono">{route.dest}</code>
                        </td>
                        <td className="py-3 px-4">
                          <code className="text-sm font-mono">
                            {route.gateway}
                          </code>
                        </td>
                        <td className="py-3 px-4">
                          <code className="text-sm font-mono">{route.iface}</code>
                        </td>
                        <td className="py-3 px-4 text-sm">{route.metric}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-green-500" />
                            <span className="text-sm">活动</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAction(`编辑路由${idx + 1}`)}
                          >
                            <Settings className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>        {/* DHCP/DNS */}
        <TabsContent value="dhcp-dns" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>DHCP/DNS服务</CardTitle>
                <Button asChild variant="outline" size="sm">
                  <Link href="/dhcp-dns">
                    进入DHCP/DNS管理
                  </Link>
                </Button>
              </div>
            </CardHeader>
          </Card>         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>DHCP服务</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">服务状态</span>
                  <Badge>运行中</Badge>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">地址池</span>
                  <code className="text-sm font-mono">
                    192.168.1.100-200
                  </code>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">租约时间</span>
                  <span className="text-sm">12小时</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-muted-foreground">已分配</span>
                  <span className="text-sm font-medium">45 / 100</span>
                </div>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => handleAction("配置DHCP")}
                >
                  配置DHCP
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>DNS服务</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">服务状态</span>
                  <Badge>运行中</Badge>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">上游DNS</span>
                  <code className="text-sm font-mono">8.8.8.8</code>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">缓存大小</span>
                  <span className="text-sm">1000条</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-muted-foreground">查询次数</span>
                  <span className="text-sm font-medium">12,345</span>
                </div>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => handleAction("配置DNS")}
                >
                  配置DNS
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
