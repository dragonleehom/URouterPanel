/**
 * IPv6管理页面
 * 支持IPv6地址配置、防火墙、DHCPv6和路由通告
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertCircle, Globe, Plus, Save, Shield, Trash2 } from "lucide-react";
import { toast } from "sonner";


interface IPv6Address {
  id: string;
  interface: string;
  address: string;
  prefix: number;
  type: "static" | "dhcp" | "slaac";
  status: "active" | "inactive";
}

interface IPv6FirewallRule {
  id: string;
  name: string;
  action: "accept" | "drop" | "reject";
  protocol: "tcp" | "udp" | "icmpv6" | "all";
  source: string;
  destination: string;
  enabled: boolean;
}

export default function IPv6Management() {
  const [activeTab, setActiveTab] = useState("addresses");
  
  // IPv6全局设置
  const [ipv6Enabled, setIPv6Enabled] = useState(true);
  const [ipv6Forwarding, setIPv6Forwarding] = useState(true);

  // IPv6地址列表
  const [ipv6Addresses] = useState<IPv6Address[]>([
    {
      id: "1",
      interface: "eth0",
      address: "2001:db8:1234:5678::1",
      prefix: 64,
      type: "static",
      status: "active",
    },
    {
      id: "2",
      interface: "eth1",
      address: "fe80::1",
      prefix: 64,
      type: "slaac",
      status: "active",
    },
  ]);

  // IPv6防火墙规则
  const [ipv6FirewallRules, setIPv6FirewallRules] = useState<IPv6FirewallRule[]>([
    {
      id: "1",
      name: "允许ICMPv6",
      action: "accept",
      protocol: "icmpv6",
      source: "::/0",
      destination: "::/0",
      enabled: true,
    },
    {
      id: "2",
      name: "允许已建立连接",
      action: "accept",
      protocol: "all",
      source: "::/0",
      destination: "::/0",
      enabled: true,
    },
  ]);

  // DHCPv6设置
  const [dhcpv6Enabled, setDHCPv6Enabled] = useState(true);
  const [dhcpv6Range, setDHCPv6Range] = useState("2001:db8:1234:5678::100-2001:db8:1234:5678::200");
  const [dhcpv6DNS, setDHCPv6DNS] = useState("2001:4860:4860::8888");
  const [dhcpv6LeaseTime, setDHCPv6LeaseTime] = useState("86400");

  // 路由通告设置
  const [raEnabled, setRAEnabled] = useState(true);
  const [raPrefix, setRAPrefix] = useState("2001:db8:1234:5678::/64");
  const [raLifetime, setRALifetime] = useState("1800");
  const [raManaged, setRAManaged] = useState(false);
  const [raOtherConfig, setRAOtherConfig] = useState(true);

  const handleSaveGlobalSettings = () => {
    toast.success("IPv6全局设置已保存");
  };

  const handleSaveDHCPv6 = () => {
    toast.success("DHCPv6配置已保存");
  };

  const handleSaveRA = () => {
    toast.success("路由通告配置已保存");
  };

  const handleToggleFirewallRule = (ruleId: string) => {
    setIPv6FirewallRules((rules) =>
      rules.map((rule) =>
        rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
      )
    );
    toast.success("防火墙规则已更新");
  };

  const handleDeleteFirewallRule = (ruleId: string) => {
    setIPv6FirewallRules((rules) => rules.filter((rule) => rule.id !== ruleId));
    toast.success("防火墙规则已删除");
  };

  return (
    <div className="p-6 space-y-6">
        {/* 页面标题 */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">IPv6管理</h1>
          <p className="text-sm text-gray-600 mt-1">
            配置IPv6地址、防火墙规则、DHCPv6服务和路由通告
          </p>
        </div>

        {/* 全局设置卡片 */}
        <Card>
          <CardHeader>
            <CardTitle>IPv6全局设置</CardTitle>
            <CardDescription>
              启用或禁用IPv6功能和转发
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="ipv6-enabled">启用IPv6</Label>
                <p className="text-xs text-gray-500">
                  在系统上启用IPv6协议栈
                </p>
              </div>
              <Switch
                id="ipv6-enabled"
                checked={ipv6Enabled}
                onCheckedChange={setIPv6Enabled}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="ipv6-forwarding">IPv6转发</Label>
                <p className="text-xs text-gray-500">
                  允许在不同网络接口之间转发IPv6数据包
                </p>
              </div>
              <Switch
                id="ipv6-forwarding"
                checked={ipv6Forwarding}
                onCheckedChange={setIPv6Forwarding}
              />
            </div>
            <Button onClick={handleSaveGlobalSettings}>
              <Save className="w-4 h-4 mr-2" />
              保存全局设置
            </Button>
          </CardContent>
        </Card>

        {/* IPv6配置标签页 */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="addresses">IPv6地址</TabsTrigger>
            <TabsTrigger value="firewall">防火墙规则</TabsTrigger>
            <TabsTrigger value="dhcpv6">DHCPv6服务</TabsTrigger>
            <TabsTrigger value="ra">路由通告(RA)</TabsTrigger>
          </TabsList>

          {/* IPv6地址管理 */}
          <TabsContent value="addresses" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>IPv6地址配置</CardTitle>
                    <CardDescription>
                      管理网络接口的IPv6地址
                    </CardDescription>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        添加IPv6地址
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>添加IPv6地址</DialogTitle>
                        <DialogDescription>
                          为网络接口配置新的IPv6地址
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="ipv6-interface">网络接口</Label>
                          <Select>
                            <SelectTrigger id="ipv6-interface">
                              <SelectValue placeholder="选择接口" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="eth0">eth0 (WAN)</SelectItem>
                              <SelectItem value="eth1">eth1 (LAN)</SelectItem>
                              <SelectItem value="wlan0">wlan0 (WiFi)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="ipv6-address">IPv6地址</Label>
                          <Input
                            id="ipv6-address"
                            placeholder="2001:db8:1234:5678::1"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="ipv6-prefix">前缀长度</Label>
                          <Input
                            id="ipv6-prefix"
                            type="number"
                            placeholder="64"
                            min="1"
                            max="128"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="ipv6-type">地址类型</Label>
                          <Select>
                            <SelectTrigger id="ipv6-type">
                              <SelectValue placeholder="选择类型" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="static">静态地址</SelectItem>
                              <SelectItem value="dhcp">DHCPv6</SelectItem>
                              <SelectItem value="slaac">SLAAC</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button>添加地址</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {ipv6Addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <Globe className="w-5 h-5 text-blue-600" />
                        <div>
                          <div className="font-medium">
                            {addr.address}/{addr.prefix}
                          </div>
                          <div className="text-xs text-gray-500">
                            接口: {addr.interface} • 类型: {addr.type.toUpperCase()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={addr.status === "active" ? "default" : "secondary"}>
                          {addr.status === "active" ? "活跃" : "未激活"}
                        </Badge>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* IPv6连接性测试 */}
            <Card>
              <CardHeader>
                <CardTitle>IPv6连接性测试</CardTitle>
                <CardDescription>
                  测试IPv6网络连接是否正常
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button variant="outline">
                    Ping IPv6 DNS (2001:4860:4860::8888)
                  </Button>
                  <Button variant="outline">
                    测试IPv6连接
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* IPv6防火墙规则 */}
          <TabsContent value="firewall" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>IPv6防火墙规则</CardTitle>
                    <CardDescription>
                      管理IPv6流量的防火墙规则
                    </CardDescription>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        添加规则
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>添加IPv6防火墙规则</DialogTitle>
                        <DialogDescription>
                          创建新的IPv6防火墙规则
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="rule-name">规则名称</Label>
                          <Input id="rule-name" placeholder="允许HTTP流量" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="rule-action">动作</Label>
                          <Select>
                            <SelectTrigger id="rule-action">
                              <SelectValue placeholder="选择动作" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="accept">ACCEPT (允许)</SelectItem>
                              <SelectItem value="drop">DROP (丢弃)</SelectItem>
                              <SelectItem value="reject">REJECT (拒绝)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="rule-protocol">协议</Label>
                          <Select>
                            <SelectTrigger id="rule-protocol">
                              <SelectValue placeholder="选择协议" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="tcp">TCP</SelectItem>
                              <SelectItem value="udp">UDP</SelectItem>
                              <SelectItem value="icmpv6">ICMPv6</SelectItem>
                              <SelectItem value="all">ALL</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="rule-source">源地址</Label>
                          <Input id="rule-source" placeholder="::/0" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="rule-dest">目标地址</Label>
                          <Input id="rule-dest" placeholder="::/0" />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button>添加规则</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {ipv6FirewallRules.map((rule) => (
                    <div
                      key={rule.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <Shield className="w-5 h-5 text-blue-600" />
                        <div>
                          <div className="font-medium">{rule.name}</div>
                          <div className="text-xs text-gray-500">
                            {rule.action.toUpperCase()} • {rule.protocol.toUpperCase()} • {rule.source} → {rule.destination}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={rule.enabled}
                          onCheckedChange={() => handleToggleFirewallRule(rule.id)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteFirewallRule(rule.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 重要提示 */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-700">
                    <p className="font-medium mb-1">ICMPv6重要性</p>
                    <p>
                      ICMPv6对IPv6网络至关重要,用于邻居发现、路径MTU发现等功能。
                      建议始终允许必要的ICMPv6消息类型。
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* DHCPv6服务 */}
          <TabsContent value="dhcpv6" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>DHCPv6服务器</CardTitle>
                    <CardDescription>
                      配置DHCPv6服务器为客户端分配IPv6地址
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="dhcpv6-enabled">启用服务</Label>
                    <Switch
                      id="dhcpv6-enabled"
                      checked={dhcpv6Enabled}
                      onCheckedChange={setDHCPv6Enabled}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="dhcpv6-range">地址分配范围</Label>
                  <Input
                    id="dhcpv6-range"
                    value={dhcpv6Range}
                    onChange={(e) => setDHCPv6Range(e.target.value)}
                    placeholder="2001:db8:1234:5678::100-2001:db8:1234:5678::200"
                  />
                  <p className="text-xs text-gray-500">
                    DHCPv6服务器将从此范围分配IPv6地址
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dhcpv6-dns">DNS服务器</Label>
                  <Input
                    id="dhcpv6-dns"
                    value={dhcpv6DNS}
                    onChange={(e) => setDHCPv6DNS(e.target.value)}
                    placeholder="2001:4860:4860::8888"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dhcpv6-lease">租约时间(秒)</Label>
                  <Input
                    id="dhcpv6-lease"
                    value={dhcpv6LeaseTime}
                    onChange={(e) => setDHCPv6LeaseTime(e.target.value)}
                    placeholder="86400"
                  />
                  <p className="text-xs text-gray-500">
                    默认: 86400秒 (24小时)
                  </p>
                </div>

                <Button onClick={handleSaveDHCPv6}>
                  <Save className="w-4 h-4 mr-2" />
                  保存DHCPv6配置
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 路由通告(RA) */}
          <TabsContent value="ra" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>路由器通告(RA)</CardTitle>
                    <CardDescription>
                      配置IPv6路由器通告参数
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="ra-enabled">启用RA</Label>
                    <Switch
                      id="ra-enabled"
                      checked={raEnabled}
                      onCheckedChange={setRAEnabled}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ra-prefix">通告前缀</Label>
                  <Input
                    id="ra-prefix"
                    value={raPrefix}
                    onChange={(e) => setRAPrefix(e.target.value)}
                    placeholder="2001:db8:1234:5678::/64"
                  />
                  <p className="text-xs text-gray-500">
                    客户端将使用此前缀自动配置IPv6地址(SLAAC)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ra-lifetime">路由器生存时间(秒)</Label>
                  <Input
                    id="ra-lifetime"
                    value={raLifetime}
                    onChange={(e) => setRALifetime(e.target.value)}
                    placeholder="1800"
                  />
                  <p className="text-xs text-gray-500">
                    默认: 1800秒 (30分钟)
                  </p>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="ra-managed">托管地址配置(M标志)</Label>
                      <p className="text-xs text-gray-500">
                        客户端应使用DHCPv6获取地址
                      </p>
                    </div>
                    <Switch
                      id="ra-managed"
                      checked={raManaged}
                      onCheckedChange={setRAManaged}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="ra-other">其他配置(O标志)</Label>
                      <p className="text-xs text-gray-500">
                        客户端应使用DHCPv6获取其他配置(如DNS)
                      </p>
                    </div>
                    <Switch
                      id="ra-other"
                      checked={raOtherConfig}
                      onCheckedChange={setRAOtherConfig}
                    />
                  </div>
                </div>

                <Button onClick={handleSaveRA}>
                  <Save className="w-4 h-4 mr-2" />
                  保存RA配置
                </Button>
              </CardContent>
            </Card>

            {/* RA配置说明 */}
            <Card>
              <CardHeader>
                <CardTitle>SLAAC vs DHCPv6</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-gray-700">
                  <p className="font-medium mb-2">配置模式:</p>
                  <ul className="space-y-2 list-disc list-inside">
                    <li>
                      <strong>SLAAC (M=0, O=0)</strong>: 客户端自动配置地址和DNS
                    </li>
                    <li>
                      <strong>SLAAC + DHCPv6 (M=0, O=1)</strong>: 客户端自动配置地址,从DHCPv6获取DNS
                    </li>
                    <li>
                      <strong>DHCPv6 (M=1, O=1)</strong>: 客户端从DHCPv6获取所有配置
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
  );
}
