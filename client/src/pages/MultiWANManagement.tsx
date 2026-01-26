import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Network, Plus, Trash2, Edit, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

interface WANInterface {
  id: string;
  name: string;
  enabled: boolean;
  status: "online" | "offline" | "standby";
  type: "dhcp" | "static" | "pppoe";
  ipAddress: string;
  gateway: string;
  dns: string[];
  weight: number; // 负载均衡权重
  priority: number; // 故障切换优先级,数字越小优先级越高
  latency: number; // ms
  packetLoss: number; // %
  bandwidth: number; // Mbps
  traffic: {
    upload: number;
    download: number;
  };
}

interface LoadBalancePolicy {
  id: string;
  name: string;
  enabled: boolean;
  mode: "weight" | "failover" | "backup";
  interfaces: string[]; // WAN interface IDs
  healthCheck: {
    enabled: boolean;
    method: "ping" | "dns" | "http";
    target: string;
    interval: number; // seconds
    timeout: number; // seconds
    failureThreshold: number;
    successThreshold: number;
  };
}

export default function MultiWANManagement() {
  const [wanInterfaces, setWanInterfaces] = useState<WANInterface[]>([
    {
      id: "1",
      name: "WAN1 (主线路)",
      enabled: true,
      status: "online",
      type: "pppoe",
      ipAddress: "123.45.67.89",
      gateway: "123.45.67.1",
      dns: ["8.8.8.8", "8.8.4.4"],
      weight: 3,
      priority: 1,
      latency: 25,
      packetLoss: 0.1,
      bandwidth: 500,
      traffic: {
        upload: 45.2,
        download: 234.5,
      },
    },
    {
      id: "2",
      name: "WAN2 (备用线路)",
      enabled: true,
      status: "online",
      type: "dhcp",
      ipAddress: "98.76.54.32",
      gateway: "98.76.54.1",
      dns: ["1.1.1.1", "1.0.0.1"],
      weight: 2,
      priority: 2,
      latency: 35,
      packetLoss: 0.3,
      bandwidth: 300,
      traffic: {
        upload: 28.7,
        download: 156.3,
      },
    },
    {
      id: "3",
      name: "WAN3 (4G备份)",
      enabled: true,
      status: "standby",
      type: "dhcp",
      ipAddress: "10.20.30.40",
      gateway: "10.20.30.1",
      dns: ["114.114.114.114"],
      weight: 1,
      priority: 3,
      latency: 80,
      packetLoss: 1.2,
      bandwidth: 100,
      traffic: {
        upload: 0,
        download: 0,
      },
    },
  ]);

  const [policies, setPolicies] = useState<LoadBalancePolicy[]>([
    {
      id: "1",
      name: "默认负载均衡",
      enabled: true,
      mode: "weight",
      interfaces: ["1", "2"],
      healthCheck: {
        enabled: true,
        method: "ping",
        target: "8.8.8.8",
        interval: 10,
        timeout: 3,
        failureThreshold: 3,
        successThreshold: 2,
      },
    },
    {
      id: "2",
      name: "故障切换到4G",
      enabled: true,
      mode: "failover",
      interfaces: ["1", "2", "3"],
      healthCheck: {
        enabled: true,
        method: "ping",
        target: "1.1.1.1",
        interval: 5,
        timeout: 2,
        failureThreshold: 2,
        successThreshold: 1,
      },
    },
  ]);

  const [editingInterface, setEditingInterface] = useState<WANInterface | null>(null);
  const [editingPolicy, setEditingPolicy] = useState<LoadBalancePolicy | null>(null);
  const [isInterfaceDialogOpen, setIsInterfaceDialogOpen] = useState(false);
  const [isPolicyDialogOpen, setIsPolicyDialogOpen] = useState(false);

  const handleToggleInterface = (id: string) => {
    setWanInterfaces(
      wanInterfaces.map((iface) =>
        iface.id === id ? { ...iface, enabled: !iface.enabled } : iface
      )
    );
    toast.success("WAN接口状态已更新");
  };

  const handleTogglePolicy = (id: string) => {
    setPolicies(
      policies.map((policy) =>
        policy.id === id ? { ...policy, enabled: !policy.enabled } : policy
      )
    );
    toast.success("负载均衡策略状态已更新");
  };

  const handleEditInterface = (iface: WANInterface) => {
    setEditingInterface({ ...iface });
    setIsInterfaceDialogOpen(true);
  };

  const handleSaveInterface = () => {
    if (!editingInterface) return;

    if (!editingInterface.name.trim()) {
      toast.error("接口名称不能为空");
      return;
    }

    setWanInterfaces(
      wanInterfaces.map((iface) =>
        iface.id === editingInterface.id ? editingInterface : iface
      )
    );
    setIsInterfaceDialogOpen(false);
    setEditingInterface(null);
    toast.success("WAN接口配置已保存");
  };

  const handleEditPolicy = (policy: LoadBalancePolicy) => {
    setEditingPolicy({ ...policy });
    setIsPolicyDialogOpen(true);
  };

  const handleSavePolicy = () => {
    if (!editingPolicy) return;

    if (!editingPolicy.name.trim()) {
      toast.error("策略名称不能为空");
      return;
    }

    if (editingPolicy.interfaces.length === 0) {
      toast.error("请至少选择一个WAN接口");
      return;
    }

    if (policies.find((p) => p.id === editingPolicy.id)) {
      setPolicies(policies.map((p) => (p.id === editingPolicy.id ? editingPolicy : p)));
    } else {
      setPolicies([...policies, { ...editingPolicy, id: Date.now().toString() }]);
    }

    setIsPolicyDialogOpen(false);
    setEditingPolicy(null);
    toast.success("负载均衡策略已保存");
  };

  const handleAddPolicy = () => {
    const newPolicy: LoadBalancePolicy = {
      id: Date.now().toString(),
      name: "新策略",
      enabled: true,
      mode: "weight",
      interfaces: [],
      healthCheck: {
        enabled: true,
        method: "ping",
        target: "8.8.8.8",
        interval: 10,
        timeout: 3,
        failureThreshold: 3,
        successThreshold: 2,
      },
    };
    setEditingPolicy(newPolicy);
    setIsPolicyDialogOpen(true);
  };

  const handleDeletePolicy = (id: string) => {
    setPolicies(policies.filter((policy) => policy.id !== id));
    toast.success("负载均衡策略已删除");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "text-green-600";
      case "offline":
        return "text-red-600";
      case "standby":
        return "text-yellow-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "online":
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case "offline":
        return <XCircle className="w-5 h-5 text-red-600" />;
      case "standby":
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "online":
        return "在线";
      case "offline":
        return "离线";
      case "standby":
        return "待机";
      default:
        return "未知";
    }
  };

  const getModeText = (mode: string) => {
    switch (mode) {
      case "weight":
        return "加权负载均衡";
      case "failover":
        return "故障切换";
      case "backup":
        return "主备模式";
      default:
        return "未知";
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Network className="w-6 h-6" />
            多WAN负载均衡
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            管理多条WAN线路、负载均衡策略和故障切换
          </p>
        </div>
        <Button onClick={handleAddPolicy}>
          <Plus className="w-4 h-4 mr-2" />
          添加策略
        </Button>
      </div>

      <Tabs defaultValue="interfaces" className="space-y-4">
        <TabsList>
          <TabsTrigger value="interfaces">WAN接口</TabsTrigger>
          <TabsTrigger value="policies">负载均衡策略</TabsTrigger>
          <TabsTrigger value="statistics">流量统计</TabsTrigger>
        </TabsList>

        <TabsContent value="interfaces" className="space-y-4">
          {wanInterfaces.map((iface) => (
            <Card key={iface.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    {getStatusIcon(iface.status)}
                    <div>
                      <h3 className="text-lg font-medium">{iface.name}</h3>
                      <p className="text-sm text-gray-500">
                        {iface.type.toUpperCase()} · {iface.ipAddress}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded bg-gray-100 ${getStatusColor(iface.status)}`}>
                      {getStatusText(iface.status)}
                    </span>
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        iface.enabled
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {iface.enabled ? "已启用" : "已禁用"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">网关</p>
                      <p className="font-medium font-mono text-xs">{iface.gateway}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">权重</p>
                      <p className="font-medium">{iface.weight}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">优先级</p>
                      <p className="font-medium">P{iface.priority}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">延迟</p>
                      <p className="font-medium">{iface.latency} ms</p>
                    </div>
                    <div>
                      <p className="text-gray-500">丢包率</p>
                      <p className="font-medium">{iface.packetLoss}%</p>
                    </div>
                    <div>
                      <p className="text-gray-500">带宽</p>
                      <p className="font-medium">{iface.bandwidth} Mbps</p>
                    </div>
                  </div>

                  {iface.status === "online" && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-gray-500">上传</span>
                            <span className="text-sm font-medium">
                              {iface.traffic.upload.toFixed(1)} Mbps
                            </span>
                          </div>
                          <Progress
                            value={(iface.traffic.upload / iface.bandwidth) * 100}
                            className="h-2"
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-gray-500">下载</span>
                            <span className="text-sm font-medium">
                              {iface.traffic.download.toFixed(1)} Mbps
                            </span>
                          </div>
                          <Progress
                            value={(iface.traffic.download / iface.bandwidth) * 100}
                            className="h-2"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Switch
                    checked={iface.enabled}
                    onCheckedChange={() => handleToggleInterface(iface.id)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditInterface(iface)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="policies" className="space-y-4">
          {policies.map((policy) => (
            <Card key={policy.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <Network className={`w-5 h-5 ${policy.enabled ? "text-blue-600" : "text-gray-400"}`} />
                    <div>
                      <h3 className="text-lg font-medium">{policy.name}</h3>
                      <p className="text-sm text-gray-500">{getModeText(policy.mode)}</p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        policy.enabled
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {policy.enabled ? "已启用" : "已禁用"}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500 mb-2">使用的WAN接口:</p>
                      <div className="flex flex-wrap gap-2">
                        {policy.interfaces.map((ifaceId) => {
                          const iface = wanInterfaces.find((i) => i.id === ifaceId);
                          return iface ? (
                            <span
                              key={ifaceId}
                              className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded"
                            >
                              {iface.name}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>

                    {policy.healthCheck.enabled && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm pt-3 border-t">
                        <div>
                          <p className="text-gray-500">健康检查</p>
                          <p className="font-medium">
                            {policy.healthCheck.method.toUpperCase()} → {policy.healthCheck.target}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">检查间隔</p>
                          <p className="font-medium">{policy.healthCheck.interval}秒</p>
                        </div>
                        <div>
                          <p className="text-gray-500">超时时间</p>
                          <p className="font-medium">{policy.healthCheck.timeout}秒</p>
                        </div>
                        <div>
                          <p className="text-gray-500">失败阈值</p>
                          <p className="font-medium">{policy.healthCheck.failureThreshold}次</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Switch
                    checked={policy.enabled}
                    onCheckedChange={() => handleTogglePolicy(policy.id)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditPolicy(policy)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeletePolicy(policy.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="statistics" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-medium mb-4">总流量统计</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {wanInterfaces
                .filter((iface) => iface.status === "online")
                .map((iface) => (
                  <div key={iface.id} className="p-4 border rounded">
                    <h4 className="font-medium mb-3">{iface.name}</h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-500">上传</span>
                          <span className="text-sm font-medium">
                            {iface.traffic.upload.toFixed(1)} / {iface.bandwidth} Mbps
                          </span>
                        </div>
                        <Progress
                          value={(iface.traffic.upload / iface.bandwidth) * 100}
                          className="h-2"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-500">下载</span>
                          <span className="text-sm font-medium">
                            {iface.traffic.download.toFixed(1)} / {iface.bandwidth} Mbps
                          </span>
                        </div>
                        <Progress
                          value={(iface.traffic.download / iface.bandwidth) * 100}
                          className="h-2"
                        />
                      </div>
                      <div className="pt-2 border-t">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">利用率</span>
                          <span className="font-medium">
                            {(
                              ((iface.traffic.upload + iface.traffic.download) /
                                (iface.bandwidth * 2)) *
                              100
                            ).toFixed(1)}
                            %
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 编辑WAN接口对话框 */}
      <Dialog open={isInterfaceDialogOpen} onOpenChange={setIsInterfaceDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>编辑WAN接口</DialogTitle>
            <DialogDescription>配置WAN接口的参数和负载均衡设置</DialogDescription>
          </DialogHeader>

          {editingInterface && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label>接口名称</Label>
                  <Input
                    value={editingInterface.name}
                    onChange={(e) =>
                      setEditingInterface({ ...editingInterface, name: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>权重 (1-10)</Label>
                  <Input
                    type="number"
                    value={editingInterface.weight}
                    onChange={(e) =>
                      setEditingInterface({
                        ...editingInterface,
                        weight: parseInt(e.target.value) || 1,
                      })
                    }
                    min="1"
                    max="10"
                  />
                  <p className="text-xs text-gray-500">权重越大,分配的流量越多</p>
                </div>

                <div className="space-y-2">
                  <Label>优先级 (1-10)</Label>
                  <Input
                    type="number"
                    value={editingInterface.priority}
                    onChange={(e) =>
                      setEditingInterface({
                        ...editingInterface,
                        priority: parseInt(e.target.value) || 1,
                      })
                    }
                    min="1"
                    max="10"
                  />
                  <p className="text-xs text-gray-500">数字越小优先级越高</p>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>带宽 (Mbps)</Label>
                  <Input
                    type="number"
                    value={editingInterface.bandwidth}
                    onChange={(e) =>
                      setEditingInterface({
                        ...editingInterface,
                        bandwidth: parseInt(e.target.value) || 100,
                      })
                    }
                    min="1"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInterfaceDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveInterface}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑负载均衡策略对话框 */}
      <Dialog open={isPolicyDialogOpen} onOpenChange={setIsPolicyDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPolicy?.id && policies.find((p) => p.id === editingPolicy.id)
                ? "编辑负载均衡策略"
                : "添加负载均衡策略"}
            </DialogTitle>
            <DialogDescription>配置负载均衡模式和健康检查参数</DialogDescription>
          </DialogHeader>

          {editingPolicy && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>策略名称</Label>
                <Input
                  value={editingPolicy.name}
                  onChange={(e) =>
                    setEditingPolicy({ ...editingPolicy, name: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>负载均衡模式</Label>
                <Select
                  value={editingPolicy.mode}
                  onValueChange={(value: "weight" | "failover" | "backup") =>
                    setEditingPolicy({ ...editingPolicy, mode: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weight">加权负载均衡</SelectItem>
                    <SelectItem value="failover">故障切换</SelectItem>
                    <SelectItem value="backup">主备模式</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  {editingPolicy.mode === "weight" && "根据权重分配流量到多条线路"}
                  {editingPolicy.mode === "failover" && "主线路故障时自动切换到备用线路"}
                  {editingPolicy.mode === "backup" && "仅使用主线路,备用线路完全待机"}
                </p>
              </div>

              <div className="space-y-2">
                <Label>选择WAN接口</Label>
                <div className="space-y-2">
                  {wanInterfaces.map((iface) => (
                    <div key={iface.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`iface-${iface.id}`}
                        checked={editingPolicy.interfaces.includes(iface.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEditingPolicy({
                              ...editingPolicy,
                              interfaces: [...editingPolicy.interfaces, iface.id],
                            });
                          } else {
                            setEditingPolicy({
                              ...editingPolicy,
                              interfaces: editingPolicy.interfaces.filter(
                                (id) => id !== iface.id
                              ),
                            });
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <label htmlFor={`iface-${iface.id}`} className="text-sm">
                        {iface.name} ({getStatusText(iface.status)})
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4 p-4 border rounded">
                <div className="flex items-center justify-between">
                  <Label>健康检查</Label>
                  <Switch
                    checked={editingPolicy.healthCheck.enabled}
                    onCheckedChange={(checked) =>
                      setEditingPolicy({
                        ...editingPolicy,
                        healthCheck: { ...editingPolicy.healthCheck, enabled: checked },
                      })
                    }
                  />
                </div>

                {editingPolicy.healthCheck.enabled && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>检查方法</Label>
                        <Select
                          value={editingPolicy.healthCheck.method}
                          onValueChange={(value: "ping" | "dns" | "http") =>
                            setEditingPolicy({
                              ...editingPolicy,
                              healthCheck: { ...editingPolicy.healthCheck, method: value },
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ping">PING</SelectItem>
                            <SelectItem value="dns">DNS查询</SelectItem>
                            <SelectItem value="http">HTTP请求</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>目标地址</Label>
                        <Input
                          value={editingPolicy.healthCheck.target}
                          onChange={(e) =>
                            setEditingPolicy({
                              ...editingPolicy,
                              healthCheck: {
                                ...editingPolicy.healthCheck,
                                target: e.target.value,
                              },
                            })
                          }
                          placeholder="8.8.8.8"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>检查间隔 (秒)</Label>
                        <Input
                          type="number"
                          value={editingPolicy.healthCheck.interval}
                          onChange={(e) =>
                            setEditingPolicy({
                              ...editingPolicy,
                              healthCheck: {
                                ...editingPolicy.healthCheck,
                                interval: parseInt(e.target.value) || 10,
                              },
                            })
                          }
                          min="1"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>超时时间 (秒)</Label>
                        <Input
                          type="number"
                          value={editingPolicy.healthCheck.timeout}
                          onChange={(e) =>
                            setEditingPolicy({
                              ...editingPolicy,
                              healthCheck: {
                                ...editingPolicy.healthCheck,
                                timeout: parseInt(e.target.value) || 3,
                              },
                            })
                          }
                          min="1"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>失败阈值 (次)</Label>
                        <Input
                          type="number"
                          value={editingPolicy.healthCheck.failureThreshold}
                          onChange={(e) =>
                            setEditingPolicy({
                              ...editingPolicy,
                              healthCheck: {
                                ...editingPolicy.healthCheck,
                                failureThreshold: parseInt(e.target.value) || 3,
                              },
                            })
                          }
                          min="1"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>成功阈值 (次)</Label>
                        <Input
                          type="number"
                          value={editingPolicy.healthCheck.successThreshold}
                          onChange={(e) =>
                            setEditingPolicy({
                              ...editingPolicy,
                              healthCheck: {
                                ...editingPolicy.healthCheck,
                                successThreshold: parseInt(e.target.value) || 2,
                              },
                            })
                          }
                          min="1"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPolicyDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSavePolicy}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
