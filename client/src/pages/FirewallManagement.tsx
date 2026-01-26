import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Shield,
  Plus,
  Settings,
  Trash2,
  RefreshCw,
  ArrowRight,
  Network,
  Globe,
  CheckCircle2,
  XCircle,
} from "lucide-react";

// 类型定义
type Protocol = "tcp" | "udp" | "both" | "all";
type Action = "ACCEPT" | "DROP" | "REJECT";
type NATType = "SNAT" | "DNAT" | "MASQUERADE";

interface FirewallRule {
  id: string;
  name: string;
  chain: string;
  protocol: Protocol;
  sourceIp: string;
  sourcePort: string;
  destIp: string;
  destPort: string;
  action: Action;
  enabled: boolean;
}

interface PortForwardRule {
  id: string;
  name: string;
  protocol: Protocol;
  externalPort: string;
  internalIp: string;
  internalPort: string;
  enabled: boolean;
}

interface NATRule {
  id: string;
  name: string;
  type: NATType;
  sourceNetwork: string;
  destNetwork: string;
  interface: string;
  enabled: boolean;
}

// 模拟数据
const mockFirewallRules: FirewallRule[] = [
  {
    id: "1",
    name: "允许SSH",
    chain: "INPUT",
    protocol: "tcp",
    sourceIp: "0.0.0.0/0",
    sourcePort: "*",
    destIp: "*",
    destPort: "22",
    action: "ACCEPT",
    enabled: true,
  },
  {
    id: "2",
    name: "允许HTTP",
    chain: "INPUT",
    protocol: "tcp",
    sourceIp: "0.0.0.0/0",
    sourcePort: "*",
    destIp: "*",
    destPort: "80",
    action: "ACCEPT",
    enabled: true,
  },
  {
    id: "3",
    name: "允许HTTPS",
    chain: "INPUT",
    protocol: "tcp",
    sourceIp: "0.0.0.0/0",
    sourcePort: "*",
    destIp: "*",
    destPort: "443",
    action: "ACCEPT",
    enabled: true,
  },
];

const mockPortForwardRules: PortForwardRule[] = [
  {
    id: "1",
    name: "Web服务器",
    protocol: "tcp",
    externalPort: "8080",
    internalIp: "192.168.1.100",
    internalPort: "80",
    enabled: true,
  },
  {
    id: "2",
    name: "SSH服务器",
    protocol: "tcp",
    externalPort: "2222",
    internalIp: "192.168.1.101",
    internalPort: "22",
    enabled: true,
  },
];

const mockNATRules: NATRule[] = [
  {
    id: "1",
    name: "LAN出网NAT",
    type: "MASQUERADE",
    sourceNetwork: "192.168.1.0/24",
    destNetwork: "0.0.0.0/0",
    interface: "eth0",
    enabled: true,
  },
];

export default function FirewallManagement() {
  const [firewallRules, setFirewallRules] = useState<FirewallRule[]>(mockFirewallRules);
  const [portForwardRules, setPortForwardRules] = useState<PortForwardRule[]>(mockPortForwardRules);
  const [natRules, setNATRules] = useState<NATRule[]>(mockNATRules);

  const [isAddRuleOpen, setIsAddRuleOpen] = useState(false);
  const [isAddPortForwardOpen, setIsAddPortForwardOpen] = useState(false);
  const [isAddNATOpen, setIsAddNATOpen] = useState(false);

  // 新建防火墙规则表单
  const [newRule, setNewRule] = useState({
    name: "",
    chain: "INPUT",
    protocol: "tcp" as Protocol,
    sourceIp: "0.0.0.0/0",
    sourcePort: "*",
    destIp: "*",
    destPort: "",
    action: "ACCEPT" as Action,
  });

  // 新建端口转发表单
  const [newPortForward, setNewPortForward] = useState({
    name: "",
    protocol: "tcp" as Protocol,
    externalPort: "",
    internalIp: "",
    internalPort: "",
  });

  // 新建NAT规则表单
  const [newNAT, setNewNAT] = useState({
    name: "",
    type: "MASQUERADE" as NATType,
    sourceNetwork: "",
    destNetwork: "0.0.0.0/0",
    interface: "eth0",
  });

  const handleAddFirewallRule = () => {
    if (!newRule.name || !newRule.destPort) {
      toast.error("请填写完整的规则信息");
      return;
    }

    const rule: FirewallRule = {
      id: Date.now().toString(),
      ...newRule,
      enabled: true,
    };

    setFirewallRules([...firewallRules, rule]);
    setIsAddRuleOpen(false);
    setNewRule({
      name: "",
      chain: "INPUT",
      protocol: "tcp",
      sourceIp: "0.0.0.0/0",
      sourcePort: "*",
      destIp: "*",
      destPort: "",
      action: "ACCEPT",
    });
    toast.success("防火墙规则添加成功");
  };

  const handleAddPortForward = () => {
    if (!newPortForward.name || !newPortForward.externalPort || !newPortForward.internalIp || !newPortForward.internalPort) {
      toast.error("请填写完整的端口转发信息");
      return;
    }

    const rule: PortForwardRule = {
      id: Date.now().toString(),
      ...newPortForward,
      enabled: true,
    };

    setPortForwardRules([...portForwardRules, rule]);
    setIsAddPortForwardOpen(false);
    setNewPortForward({
      name: "",
      protocol: "tcp",
      externalPort: "",
      internalIp: "",
      internalPort: "",
    });
    toast.success("端口转发规则添加成功");
  };

  const handleAddNAT = () => {
    if (!newNAT.name || !newNAT.sourceNetwork) {
      toast.error("请填写完整的NAT规则信息");
      return;
    }

    const rule: NATRule = {
      id: Date.now().toString(),
      ...newNAT,
      enabled: true,
    };

    setNATRules([...natRules, rule]);
    setIsAddNATOpen(false);
    setNewNAT({
      name: "",
      type: "MASQUERADE",
      sourceNetwork: "",
      destNetwork: "0.0.0.0/0",
      interface: "eth0",
    });
    toast.success("NAT规则添加成功");
  };

  const handleDeleteFirewallRule = (id: string) => {
    setFirewallRules(firewallRules.filter((rule) => rule.id !== id));
    toast.success("规则已删除");
  };

  const handleDeletePortForward = (id: string) => {
    setPortForwardRules(portForwardRules.filter((rule) => rule.id !== id));
    toast.success("端口转发规则已删除");
  };

  const handleDeleteNAT = (id: string) => {
    setNATRules(natRules.filter((rule) => rule.id !== id));
    toast.success("NAT规则已删除");
  };

  const handleToggleFirewallRule = (id: string) => {
    setFirewallRules(
      firewallRules.map((rule) =>
        rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
      )
    );
    toast.success("规则状态已更新");
  };

  const handleTogglePortForward = (id: string) => {
    setPortForwardRules(
      portForwardRules.map((rule) =>
        rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
      )
    );
    toast.success("端口转发规则状态已更新");
  };

  const handleToggleNAT = (id: string) => {
    setNATRules(
      natRules.map((rule) =>
        rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
      )
    );
    toast.success("NAT规则状态已更新");
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">防火墙管理</h1>
          <p className="text-sm text-gray-500 mt-1">
            配置防火墙规则、端口转发和NAT规则
          </p>
        </div>
        <Button variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          刷新
        </Button>
      </div>

      {/* 标签页 */}
      <Tabs defaultValue="rules" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rules">
            <Shield className="w-4 h-4 mr-2" />
            防火墙规则
          </TabsTrigger>
          <TabsTrigger value="port-forward">
            <ArrowRight className="w-4 h-4 mr-2" />
            端口转发
          </TabsTrigger>
          <TabsTrigger value="nat">
            <Network className="w-4 h-4 mr-2" />
            NAT规则
          </TabsTrigger>
        </TabsList>

        {/* 防火墙规则标签页 */}
        <TabsContent value="rules" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setIsAddRuleOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              添加规则
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>防火墙规则列表</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                        规则名称
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                        链
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                        协议
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                        源地址
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                        目标端口
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                        动作
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                        状态
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {firewallRules.map((rule) => (
                      <tr key={rule.id} className="border-b border-gray-100">
                        <td className="py-3 px-4 text-sm">{rule.name}</td>
                        <td className="py-3 px-4">
                          <code className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                            {rule.chain}
                          </code>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className="text-xs">
                            {rule.protocol.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <code className="text-xs font-mono">{rule.sourceIp}</code>
                        </td>
                        <td className="py-3 px-4 text-sm">{rule.destPort}</td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={rule.action === "ACCEPT" ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {rule.action}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleToggleFirewallRule(rule.id)}
                            className="flex items-center gap-1"
                          >
                            {rule.enabled ? (
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            ) : (
                              <XCircle className="w-4 h-4 text-gray-400" />
                            )}
                            <span className="text-xs text-gray-500">
                              {rule.enabled ? "已启用" : "已禁用"}
                            </span>
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="outline" size="sm">
                              <Settings className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteFirewallRule(rule.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 端口转发标签页 */}
        <TabsContent value="port-forward" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setIsAddPortForwardOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              添加端口转发
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>端口转发规则列表</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                        规则名称
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                        协议
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                        外部端口
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                        内部IP
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                        内部端口
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                        状态
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {portForwardRules.map((rule) => (
                      <tr key={rule.id} className="border-b border-gray-100">
                        <td className="py-3 px-4 text-sm">{rule.name}</td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className="text-xs">
                            {rule.protocol.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <code className="text-sm font-mono">{rule.externalPort}</code>
                        </td>
                        <td className="py-3 px-4">
                          <code className="text-sm font-mono">{rule.internalIp}</code>
                        </td>
                        <td className="py-3 px-4">
                          <code className="text-sm font-mono">{rule.internalPort}</code>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleTogglePortForward(rule.id)}
                            className="flex items-center gap-1"
                          >
                            {rule.enabled ? (
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            ) : (
                              <XCircle className="w-4 h-4 text-gray-400" />
                            )}
                            <span className="text-xs text-gray-500">
                              {rule.enabled ? "已启用" : "已禁用"}
                            </span>
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="outline" size="sm">
                              <Settings className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeletePortForward(rule.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* 端口转发说明 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">端口转发说明</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600 space-y-2">
              <p>
                端口转发(Port Forwarding)将外部网络对路由器特定端口的访问请求转发到内网指定主机的端口。
              </p>
              <p className="font-medium">典型应用场景:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>将外网访问路由器的8080端口转发到内网Web服务器的80端口</li>
                <li>将外网访问路由器的2222端口转发到内网SSH服务器的22端口</li>
                <li>将外网访问路由器的3389端口转发到内网远程桌面服务器的3389端口</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {/* NAT规则标签页 */}
        <TabsContent value="nat" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setIsAddNATOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              添加NAT规则
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>NAT规则列表</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                        规则名称
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                        类型
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                        源网络
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                        目标网络
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                        接口
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                        状态
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {natRules.map((rule) => (
                      <tr key={rule.id} className="border-b border-gray-100">
                        <td className="py-3 px-4 text-sm">{rule.name}</td>
                        <td className="py-3 px-4">
                          <Badge variant="default" className="text-xs">
                            {rule.type}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <code className="text-sm font-mono">{rule.sourceNetwork}</code>
                        </td>
                        <td className="py-3 px-4">
                          <code className="text-sm font-mono">{rule.destNetwork}</code>
                        </td>
                        <td className="py-3 px-4">
                          <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                            {rule.interface}
                          </code>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleToggleNAT(rule.id)}
                            className="flex items-center gap-1"
                          >
                            {rule.enabled ? (
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            ) : (
                              <XCircle className="w-4 h-4 text-gray-400" />
                            )}
                            <span className="text-xs text-gray-500">
                              {rule.enabled ? "已启用" : "已禁用"}
                            </span>
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="outline" size="sm">
                              <Settings className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteNAT(rule.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* NAT规则说明 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">NAT规则说明</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600 space-y-2">
              <p className="font-medium">NAT类型:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>
                  <strong>MASQUERADE</strong>: 动态源地址转换,自动使用出口接口的IP地址,适用于DHCP动态IP场景
                </li>
                <li>
                  <strong>SNAT</strong>: 静态源地址转换,将源IP地址转换为指定的公网IP地址
                </li>
                <li>
                  <strong>DNAT</strong>: 目标地址转换,将目标IP地址转换为内网IP地址,常用于端口映射
                </li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 添加防火墙规则对话框 */}
      <Dialog open={isAddRuleOpen} onOpenChange={setIsAddRuleOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>添加防火墙规则</DialogTitle>
            <DialogDescription>
              配置新的防火墙规则
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rule-name">规则名称</Label>
                <Input
                  id="rule-name"
                  value={newRule.name}
                  onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                  placeholder="例如: 允许HTTP"
                />
              </div>
              <div>
                <Label htmlFor="rule-chain">链</Label>
                <Select
                  value={newRule.chain}
                  onValueChange={(value) => setNewRule({ ...newRule, chain: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INPUT">INPUT (入站)</SelectItem>
                    <SelectItem value="OUTPUT">OUTPUT (出站)</SelectItem>
                    <SelectItem value="FORWARD">FORWARD (转发)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="rule-protocol">协议</Label>
                <Select
                  value={newRule.protocol}
                  onValueChange={(value) =>
                    setNewRule({ ...newRule, protocol: value as Protocol })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tcp">TCP</SelectItem>
                    <SelectItem value="udp">UDP</SelectItem>
                    <SelectItem value="both">TCP+UDP</SelectItem>
                    <SelectItem value="all">全部</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="rule-action">动作</Label>
                <Select
                  value={newRule.action}
                  onValueChange={(value) =>
                    setNewRule({ ...newRule, action: value as Action })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACCEPT">ACCEPT (允许)</SelectItem>
                    <SelectItem value="DROP">DROP (丢弃)</SelectItem>
                    <SelectItem value="REJECT">REJECT (拒绝)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="rule-source-ip">源IP地址</Label>
                <Input
                  id="rule-source-ip"
                  value={newRule.sourceIp}
                  onChange={(e) =>
                    setNewRule({ ...newRule, sourceIp: e.target.value })
                  }
                  placeholder="0.0.0.0/0"
                />
              </div>
              <div>
                <Label htmlFor="rule-dest-port">目标端口</Label>
                <Input
                  id="rule-dest-port"
                  value={newRule.destPort}
                  onChange={(e) =>
                    setNewRule({ ...newRule, destPort: e.target.value })
                  }
                  placeholder="80 或 80-443"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddRuleOpen(false)}>
              取消
            </Button>
            <Button onClick={handleAddFirewallRule}>添加</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 添加端口转发对话框 */}
      <Dialog open={isAddPortForwardOpen} onOpenChange={setIsAddPortForwardOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加端口转发</DialogTitle>
            <DialogDescription>
              配置新的端口转发规则
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="pf-name">规则名称</Label>
              <Input
                id="pf-name"
                value={newPortForward.name}
                onChange={(e) =>
                  setNewPortForward({ ...newPortForward, name: e.target.value })
                }
                placeholder="例如: Web服务器"
              />
            </div>
            <div>
              <Label htmlFor="pf-protocol">协议</Label>
              <Select
                value={newPortForward.protocol}
                onValueChange={(value) =>
                  setNewPortForward({
                    ...newPortForward,
                    protocol: value as Protocol,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tcp">TCP</SelectItem>
                  <SelectItem value="udp">UDP</SelectItem>
                  <SelectItem value="both">TCP+UDP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pf-external-port">外部端口</Label>
                <Input
                  id="pf-external-port"
                  value={newPortForward.externalPort}
                  onChange={(e) =>
                    setNewPortForward({
                      ...newPortForward,
                      externalPort: e.target.value,
                    })
                  }
                  placeholder="8080"
                />
              </div>
              <div>
                <Label htmlFor="pf-internal-port">内部端口</Label>
                <Input
                  id="pf-internal-port"
                  value={newPortForward.internalPort}
                  onChange={(e) =>
                    setNewPortForward({
                      ...newPortForward,
                      internalPort: e.target.value,
                    })
                  }
                  placeholder="80"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="pf-internal-ip">内部IP地址</Label>
              <Input
                id="pf-internal-ip"
                value={newPortForward.internalIp}
                onChange={(e) =>
                  setNewPortForward({
                    ...newPortForward,
                    internalIp: e.target.value,
                  })
                }
                placeholder="192.168.1.100"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddPortForwardOpen(false)}
            >
              取消
            </Button>
            <Button onClick={handleAddPortForward}>添加</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 添加NAT规则对话框 */}
      <Dialog open={isAddNATOpen} onOpenChange={setIsAddNATOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加NAT规则</DialogTitle>
            <DialogDescription>
              配置新的NAT规则
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="nat-name">规则名称</Label>
              <Input
                id="nat-name"
                value={newNAT.name}
                onChange={(e) => setNewNAT({ ...newNAT, name: e.target.value })}
                placeholder="例如: LAN出网NAT"
              />
            </div>
            <div>
              <Label htmlFor="nat-type">NAT类型</Label>
              <Select
                value={newNAT.type}
                onValueChange={(value) =>
                  setNewNAT({ ...newNAT, type: value as NATType })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MASQUERADE">MASQUERADE (动态源NAT)</SelectItem>
                  <SelectItem value="SNAT">SNAT (静态源NAT)</SelectItem>
                  <SelectItem value="DNAT">DNAT (目标NAT)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="nat-source">源网络</Label>
              <Input
                id="nat-source"
                value={newNAT.sourceNetwork}
                onChange={(e) =>
                  setNewNAT({ ...newNAT, sourceNetwork: e.target.value })
                }
                placeholder="192.168.1.0/24"
              />
            </div>
            <div>
              <Label htmlFor="nat-dest">目标网络</Label>
              <Input
                id="nat-dest"
                value={newNAT.destNetwork}
                onChange={(e) =>
                  setNewNAT({ ...newNAT, destNetwork: e.target.value })
                }
                placeholder="0.0.0.0/0"
              />
            </div>
            <div>
              <Label htmlFor="nat-interface">出口接口</Label>
              <Select
                value={newNAT.interface}
                onValueChange={(value) => setNewNAT({ ...newNAT, interface: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="eth0">eth0</SelectItem>
                  <SelectItem value="eth1">eth1</SelectItem>
                  <SelectItem value="ppp0">ppp0</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddNATOpen(false)}>
              取消
            </Button>
            <Button onClick={handleAddNAT}>添加</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
