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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Network,
  Plus,
  Settings,
  Trash2,
  RefreshCw,
  Globe,
  CheckCircle2,
  XCircle,
  Loader2,
  Play,
  Square,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

// ==================== 全局配置标签页 ====================
function GlobalConfigTab() {
  const { data: globalConfig, isLoading } = trpc.networkConfig.getGlobalConfig.useQuery();
  const updateGlobalConfig = trpc.networkConfig.updateGlobalConfig.useMutation({
    onSuccess: () => {
      toast.success("全局配置已更新");
    },
    onError: (error) => {
      toast.error(`更新失败: ${error.message}`);
    },
  });

  const applyAllConfigs = trpc.networkConfig.applyAllConfigs.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success("所有配置已应用");
      } else {
        const failedPorts = data.results.filter(r => !r.success);
        toast.error(`部分配置应用失败: ${failedPorts.map(p => p.name).join(', ')}`);
      }
    },
    onError: (error) => {
      toast.error(`应用配置失败: ${error.message}`);
    },
  });

  const [ipv6UlaPrefix, setIpv6UlaPrefix] = useState("");
  const [packetSteering, setPacketSteering] = useState(false);
  const [rpsEnabled, setRpsEnabled] = useState(false);
  const [rpsCpus, setRpsCpus] = useState("");

  // 当数据加载完成时,更新表单状态
  useState(() => {
    if (globalConfig) {
      setIpv6UlaPrefix(globalConfig.ipv6UlaPrefix || "");
      setPacketSteering(globalConfig.packetSteering === 1);
      setRpsEnabled(globalConfig.rpsEnabled === 1);
      setRpsCpus(globalConfig.rpsCpus || "");
    }
  });

  const handleSave = () => {
    updateGlobalConfig.mutate({
      ipv6UlaPrefix: ipv6UlaPrefix || undefined,
      packetSteering: packetSteering ? 1 : 0,
      rpsEnabled: rpsEnabled ? 1 : 0,
      rpsCpus: rpsCpus || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>IPv6 配置</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ipv6-ula">IPv6 ULA 前缀</Label>
            <Input
              id="ipv6-ula"
              placeholder="例如: fd00::/48"
              value={ipv6UlaPrefix}
              onChange={(e) => setIpv6UlaPrefix(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              用于本地IPv6网络的唯一本地地址(ULA)前缀
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>网络性能优化</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>包转向 (Packet Steering)</Label>
              <p className="text-sm text-muted-foreground">
                启用多核CPU的数据包处理,提升网络吞吐量
              </p>
            </div>
            <Switch
              checked={packetSteering}
              onCheckedChange={setPacketSteering}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>RPS (Receive Packet Steering)</Label>
              <p className="text-sm text-muted-foreground">
                接收数据包转向,将网络接收负载分配到多个CPU核心
              </p>
            </div>
            <Switch
              checked={rpsEnabled}
              onCheckedChange={setRpsEnabled}
            />
          </div>

          {rpsEnabled && (
            <div className="space-y-2">
              <Label htmlFor="rps-cpus">RPS CPU 掩码</Label>
              <Input
                id="rps-cpus"
                placeholder="例如: f (使用CPU 0-3)"
                value={rpsCpus}
                onChange={(e) => setRpsCpus(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                十六进制CPU掩码,指定用于RPS的CPU核心
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button 
          variant="outline"
          onClick={() => {
            applyAllConfigs.mutate();
          }} 
          disabled={applyAllConfigs.isPending}
        >
          {applyAllConfigs.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          <Play className="mr-2 h-4 w-4" />
          应用所有配置
        </Button>
        <Button onClick={handleSave} disabled={updateGlobalConfig.isPending}>
          {updateGlobalConfig.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          保存配置
        </Button>
      </div>
    </div>
  );
}

// ==================== 网口配置标签页 ====================
function PortConfigTab() {
  const [activeTab, setActiveTab] = useState<"wan" | "lan">("wan");
  const [editingPort, setEditingPort] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const utils = trpc.useUtils();
  const { data: ports, isLoading } = trpc.networkConfig.listPorts.useQuery();
  
  const createPort = trpc.networkConfig.createPort.useMutation({
    onSuccess: () => {
      toast.success("网口创建成功");
      utils.networkConfig.listPorts.invalidate();
      setIsDialogOpen(false);
      setEditingPort(null);
    },
    onError: (error) => {
      toast.error(`创建失败: ${error.message}`);
    },
  });

  const updatePort = trpc.networkConfig.updatePort.useMutation({
    onSuccess: () => {
      toast.success("网口更新成功");
      utils.networkConfig.listPorts.invalidate();
      setIsDialogOpen(false);
      setEditingPort(null);
    },
    onError: (error) => {
      toast.error(`更新失败: ${error.message}`);
    },
  });

  const deletePort = trpc.networkConfig.deletePort.useMutation({
    onSuccess: () => {
      toast.success("网口已删除");
      utils.networkConfig.listPorts.invalidate();
    },
    onError: (error) => {
      toast.error(`删除失败: ${error.message}`);
    },
  });

  const restartPort = trpc.networkConfig.restartPort.useMutation({
    onSuccess: () => {
      toast.success("网口已重启");
      utils.networkConfig.listPorts.invalidate();
    },
    onError: (error) => {
      toast.error(`重启失败: ${error.message}`);
    },
  });

  const stopPort = trpc.networkConfig.stopPort.useMutation({
    onSuccess: () => {
      toast.success("网口已停止");
      utils.networkConfig.listPorts.invalidate();
    },
    onError: (error) => {
      toast.error(`停止失败: ${error.message}`);
    },
  });

  const wanPorts = ports?.filter((p) => p.type === "wan") || [];
  const lanPorts = ports?.filter((p) => p.type === "lan") || [];

  const handleAddPort = () => {
    setEditingPort({
      name: "",
      type: activeTab,
      protocol: "static",
      enabled: 1,
      dhcpServer: 0,
      ipv6: 0,
    });
    setIsDialogOpen(true);
  };

  const handleEditPort = (port: any) => {
    setEditingPort(port);
    setIsDialogOpen(true);
  };

  const handleSavePort = () => {
    if (!editingPort) return;

    if (editingPort.id) {
      updatePort.mutate(editingPort);
    } else {
      createPort.mutate(editingPort);
    }
  };

  const renderPortList = (portList: any[]) => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      );
    }

    if (portList.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          暂无{activeTab === "wan" ? "WAN" : "LAN"}口配置
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {portList.map((port) => (
          <Card key={port.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">{port.name}</h3>
                    <Badge variant={port.enabled ? "default" : "secondary"}>
                      {port.enabled ? "已启用" : "已禁用"}
                    </Badge>
                    <Badge variant="outline">{port.protocol.toUpperCase()}</Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">接口: </span>
                      <span>{port.ifname || "-"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">IPv4: </span>
                      <span>{port.ipaddr || "-"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">网关: </span>
                      <span>{port.gateway || "-"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">DNS: </span>
                      <span>{port.dns || "-"}</span>
                    </div>
                    {port.type === "lan" && port.dhcpServer === 1 && (
                      <>
                        <div>
                          <span className="text-muted-foreground">DHCP范围: </span>
                          <span>{port.dhcpStart} - {port.dhcpEnd}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">租期: </span>
                          <span>{port.dhcpTime}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditPort(port)}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => restartPort.mutate({ id: port.id })}
                    disabled={restartPort.isPending}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  {port.enabled === 1 ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => stopPort.mutate({ id: port.id })}
                      disabled={stopPort.isPending}
                    >
                      <Square className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => restartPort.mutate({ id: port.id })}
                      disabled={restartPort.isPending}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (confirm(`确定要删除网口 ${port.name} 吗?`)) {
                        deletePort.mutate({ id: port.id });
                      }
                    }}
                    disabled={deletePort.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "wan" | "lan")}>
          <TabsList>
            <TabsTrigger value="wan">WAN口配置</TabsTrigger>
            <TabsTrigger value="lan">LAN口配置</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button onClick={handleAddPort}>
          <Plus className="mr-2 h-4 w-4" />
          添加{activeTab === "wan" ? "WAN" : "LAN"}口
        </Button>
      </div>

      {activeTab === "wan" ? renderPortList(wanPorts) : renderPortList(lanPorts)}

      {/* 编辑对话框 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPort?.id ? "编辑" : "添加"}{activeTab === "wan" ? "WAN" : "LAN"}口
            </DialogTitle>
            <DialogDescription>
              配置网络接口的基本参数和高级选项
            </DialogDescription>
          </DialogHeader>

          {editingPort && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="port-name">接口名称</Label>
                <Input
                  id="port-name"
                  value={editingPort.name}
                  onChange={(e) =>
                    setEditingPort({ ...editingPort, name: e.target.value })
                  }
                  placeholder="例如: WAN1, LAN1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="port-ifname">物理接口</Label>
                <Input
                  id="port-ifname"
                  value={editingPort.ifname || ""}
                  onChange={(e) =>
                    setEditingPort({ ...editingPort, ifname: e.target.value })
                  }
                  placeholder="例如: eth0, eth1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="port-protocol">协议</Label>
                <Select
                  value={editingPort.protocol}
                  onValueChange={(value) =>
                    setEditingPort({ ...editingPort, protocol: value })
                  }
                >
                  <SelectTrigger id="port-protocol">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="static">静态IP</SelectItem>
                    <SelectItem value="dhcp">DHCP</SelectItem>
                    <SelectItem value="pppoe">PPPoE</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {editingPort.protocol === "static" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="port-ipaddr">IPv4地址</Label>
                      <Input
                        id="port-ipaddr"
                        value={editingPort.ipaddr || ""}
                        onChange={(e) =>
                          setEditingPort({ ...editingPort, ipaddr: e.target.value })
                        }
                        placeholder="192.168.1.1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="port-netmask">子网掩码</Label>
                      <Input
                        id="port-netmask"
                        value={editingPort.netmask || ""}
                        onChange={(e) =>
                          setEditingPort({ ...editingPort, netmask: e.target.value })
                        }
                        placeholder="255.255.255.0"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="port-gateway">网关</Label>
                    <Input
                      id="port-gateway"
                      value={editingPort.gateway || ""}
                      onChange={(e) =>
                        setEditingPort({ ...editingPort, gateway: e.target.value })
                      }
                      placeholder="192.168.1.254"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="port-dns">DNS服务器</Label>
                    <Input
                      id="port-dns"
                      value={editingPort.dns || ""}
                      onChange={(e) =>
                        setEditingPort({ ...editingPort, dns: e.target.value })
                      }
                      placeholder="8.8.8.8 8.8.4.4"
                    />
                  </div>
                </>
              )}

              {/* 高级选项 */}
              <div className="space-y-4 border-t pt-4">
                <h4 className="font-semibold text-sm">高级选项</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="port-mtu">MTU</Label>
                    <Input
                      id="port-mtu"
                      type="number"
                      value={editingPort.mtu || 1500}
                      onChange={(e) =>
                        setEditingPort({ ...editingPort, mtu: parseInt(e.target.value) })
                      }
                      placeholder="1500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="port-metric">Metric</Label>
                    <Input
                      id="port-metric"
                      type="number"
                      value={editingPort.metric || 0}
                      onChange={(e) =>
                        setEditingPort({ ...editingPort, metric: parseInt(e.target.value) })
                      }
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="port-firewall-zone">防火墙区域</Label>
                  <Input
                    id="port-firewall-zone"
                    value={editingPort.firewallZone || ""}
                    onChange={(e) =>
                      setEditingPort({ ...editingPort, firewallZone: e.target.value })
                    }
                    placeholder="wan, lan, guest"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>启用IPv6</Label>
                  <Switch
                    checked={editingPort.ipv6 === 1}
                    onCheckedChange={(checked) =>
                      setEditingPort({ ...editingPort, ipv6: checked ? 1 : 0 })
                    }
                  />
                </div>

                {editingPort.ipv6 === 1 && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="port-ipv6addr">IPv6地址</Label>
                      <Input
                        id="port-ipv6addr"
                        value={editingPort.ipv6addr || ""}
                        onChange={(e) =>
                          setEditingPort({ ...editingPort, ipv6addr: e.target.value })
                        }
                        placeholder="2001:db8::1/64"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="port-ipv6gateway">IPv6网关</Label>
                      <Input
                        id="port-ipv6gateway"
                        value={editingPort.ipv6gateway || ""}
                        onChange={(e) =>
                          setEditingPort({ ...editingPort, ipv6gateway: e.target.value })
                        }
                        placeholder="2001:db8::fe"
                      />
                    </div>
                  </>
                )}
              </div>

              {activeTab === "lan" && (
                <div className="space-y-4 border-t pt-4">
                  <h4 className="font-semibold text-sm">DHCP服务器</h4>
                  <div className="flex items-center justify-between">
                    <Label>启用DHCP服务器</Label>
                    <Switch
                      checked={editingPort.dhcpServer === 1}
                      onCheckedChange={(checked) =>
                        setEditingPort({ ...editingPort, dhcpServer: checked ? 1 : 0 })
                      }
                    />
                  </div>

                  {editingPort.dhcpServer === 1 && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="dhcp-start">起始地址</Label>
                          <Input
                            id="dhcp-start"
                            value={editingPort.dhcpStart || ""}
                            onChange={(e) =>
                              setEditingPort({
                                ...editingPort,
                                dhcpStart: e.target.value,
                              })
                            }
                            placeholder="192.168.1.100"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="dhcp-end">结束地址</Label>
                          <Input
                            id="dhcp-end"
                            value={editingPort.dhcpEnd || ""}
                            onChange={(e) =>
                              setEditingPort({
                                ...editingPort,
                                dhcpEnd: e.target.value,
                              })
                            }
                            placeholder="192.168.1.200"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="dhcp-time">租约时间</Label>
                        <Input
                          id="dhcp-time"
                          value={editingPort.dhcpTime || ""}
                          onChange={(e) =>
                            setEditingPort({
                              ...editingPort,
                              dhcpTime: e.target.value,
                            })
                          }
                          placeholder="12h"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between border-t pt-4">
                <Label>启用此接口</Label>
                <Switch
                  checked={editingPort.enabled === 1}
                  onCheckedChange={(checked) =>
                    setEditingPort({ ...editingPort, enabled: checked ? 1 : 0 })
                  }
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleSavePort}
              disabled={createPort.isPending || updatePort.isPending}
            >
              {(createPort.isPending || updatePort.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ==================== 接口配置标签页 ====================
function InterfaceConfigTab() {
  // TODO: 实现接口配置功能
  return (
    <Card>
      <CardHeader>
        <CardTitle>接口配置</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">接口配置功能开发中...</p>
      </CardContent>
    </Card>
  );
}

// ==================== 设备配置标签页 ====================
function DeviceConfigTab() {
  const { data: devices, isLoading } = trpc.networkConfig.listDevices.useQuery();
  const [editingDevice, setEditingDevice] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const utils = trpc.useUtils();
  const updateDevice = trpc.networkConfig.updateDevice.useMutation({
    onSuccess: () => {
      toast.success("设备配置已更新");
      utils.networkConfig.listDevices.invalidate();
      setIsDialogOpen(false);
      setEditingDevice(null);
    },
    onError: (error) => {
      toast.error(`更新失败: ${error.message}`);
    },
  });

  const scanDevices = trpc.networkConfig.scanDevices.useMutation({
    onSuccess: () => {
      toast.success("设备扫描完成");
      utils.networkConfig.listDevices.invalidate();
    },
    onError: (error) => {
      toast.error(`扫描失败: ${error.message}`);
    },
  });

  const handleEditDevice = (device: any) => {
    setEditingDevice(device);
    setIsDialogOpen(true);
  };

  const handleSaveDevice = () => {
    if (!editingDevice) return;
    updateDevice.mutate(editingDevice);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => scanDevices.mutate()} disabled={scanDevices.isPending}>
          {scanDevices.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          <RefreshCw className="mr-2 h-4 w-4" />
          扫描设备
        </Button>
      </div>

      {devices && devices.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            暂无网络设备,点击"扫描设备"按钮检测系统网络设备
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {devices?.map((device) => (
            <Card key={device.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{device.name}</h3>
                      <Badge variant={device.enabled ? "default" : "secondary"}>
                        {device.enabled ? "已启用" : "已禁用"}
                      </Badge>
                      <Badge variant="outline">{device.type}</Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">MAC地址: </span>
                        <span className="font-mono">{device.macaddr || "-"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">MTU: </span>
                        <span>{device.mtu || 1500}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">发送队列: </span>
                        <span>{device.txqueuelen || 1000}</span>
                      </div>
                      {device.type === "bridge" && device.bridgePorts && (
                        <div className="col-span-3">
                          <span className="text-muted-foreground">网桥端口: </span>
                          <span>{device.bridgePorts}</span>
                        </div>
                      )}
                      {device.type === "vlan" && (
                        <>
                          <div>
                            <span className="text-muted-foreground">VLAN ID: </span>
                            <span>{device.vlanId}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">父设备: </span>
                            <span>{device.parentDevice}</span>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        {device.promisc ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-gray-400" />
                        )}
                        <span className="text-muted-foreground">混杂模式</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {device.multicast ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-gray-400" />
                        )}
                        <span className="text-muted-foreground">多播</span>
                      </div>
                      {device.type === "bridge" && (
                        <div className="flex items-center gap-1">
                          {device.igmpSnooping ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-gray-400" />
                          )}
                          <span className="text-muted-foreground">IGMP Snooping</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditDevice(device)}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 编辑对话框 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>设备配置 - {editingDevice?.name}</DialogTitle>
            <DialogDescription>
              配置网络设备的高级参数
            </DialogDescription>
          </DialogHeader>

          {editingDevice && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="device-mtu">MTU</Label>
                <Input
                  id="device-mtu"
                  type="number"
                  value={editingDevice.mtu || 1500}
                  onChange={(e) =>
                    setEditingDevice({
                      ...editingDevice,
                      mtu: parseInt(e.target.value),
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="device-txqueuelen">发送队列长度</Label>
                <Input
                  id="device-txqueuelen"
                  type="number"
                  value={editingDevice.txqueuelen || 1000}
                  onChange={(e) =>
                    setEditingDevice({
                      ...editingDevice,
                      txqueuelen: parseInt(e.target.value),
                    })
                  }
                />
              </div>

              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>混杂模式 (Promiscuous Mode)</Label>
                    <p className="text-sm text-muted-foreground">
                      接收所有经过网卡的数据包
                    </p>
                  </div>
                  <Switch
                    checked={editingDevice.promisc === 1}
                    onCheckedChange={(checked) =>
                      setEditingDevice({
                        ...editingDevice,
                        promisc: checked ? 1 : 0,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>多播 (Multicast)</Label>
                    <p className="text-sm text-muted-foreground">
                      启用多播数据包接收
                    </p>
                  </div>
                  <Switch
                    checked={editingDevice.multicast === 1}
                    onCheckedChange={(checked) =>
                      setEditingDevice({
                        ...editingDevice,
                        multicast: checked ? 1 : 0,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>ICMP重定向</Label>
                    <p className="text-sm text-muted-foreground">
                      接受ICMP重定向消息
                    </p>
                  </div>
                  <Switch
                    checked={editingDevice.icmpRedirect === 1}
                    onCheckedChange={(checked) =>
                      setEditingDevice({
                        ...editingDevice,
                        icmpRedirect: checked ? 1 : 0,
                      })
                    }
                  />
                </div>

                {editingDevice.type === "bridge" && (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>IGMP Snooping</Label>
                        <p className="text-sm text-muted-foreground">
                          网桥IGMP监听,优化多播流量
                        </p>
                      </div>
                      <Switch
                        checked={editingDevice.igmpSnooping === 1}
                        onCheckedChange={(checked) =>
                          setEditingDevice({
                            ...editingDevice,
                            igmpSnooping: checked ? 1 : 0,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2 border-t pt-4">
                      <Label htmlFor="bridge-ports">网桥端口</Label>
                      <Input
                        id="bridge-ports"
                        value={editingDevice.bridgePorts || ""}
                        onChange={(e) =>
                          setEditingDevice({
                            ...editingDevice,
                            bridgePorts: e.target.value,
                          })
                        }
                        placeholder="eth0 eth1"
                      />
                      <p className="text-sm text-muted-foreground">
                        空格分隔的网络接口列表
                      </p>
                    </div>
                  </>
                )}

                {editingDevice.type === "vlan" && (
                  <div className="space-y-4 border-t pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="vlan-id">VLAN ID</Label>
                        <Input
                          id="vlan-id"
                          type="number"
                          value={editingDevice.vlanId || ""}
                          onChange={(e) =>
                            setEditingDevice({
                              ...editingDevice,
                              vlanId: parseInt(e.target.value),
                            })
                          }
                          placeholder="1-4094"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="parent-device">父设备</Label>
                        <Input
                          id="parent-device"
                          value={editingDevice.parentDevice || ""}
                          onChange={(e) =>
                            setEditingDevice({
                              ...editingDevice,
                              parentDevice: e.target.value,
                            })
                          }
                          placeholder="eth0"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4 border-t pt-4">
                  <h4 className="font-semibold text-sm">IPv6 高级选项</h4>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>IPv6 路由通告 (RA)</Label>
                      <p className="text-sm text-muted-foreground">
                        发送IPv6路由器通告消息
                      </p>
                    </div>
                    <Switch
                      checked={editingDevice.ipv6Ra === 1}
                      onCheckedChange={(checked) =>
                        setEditingDevice({
                          ...editingDevice,
                          ipv6Ra: checked ? 1 : 0,
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>IPv6 路由请求 (RS)</Label>
                      <p className="text-sm text-muted-foreground">
                        发送IPv6路由器请求消息
                      </p>
                    </div>
                    <Switch
                      checked={editingDevice.ipv6Rs === 1}
                      onCheckedChange={(checked) =>
                        setEditingDevice({
                          ...editingDevice,
                          ipv6Rs: checked ? 1 : 0,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t pt-4">
                <Label>启用此设备</Label>
                <Switch
                  checked={editingDevice.enabled === 1}
                  onCheckedChange={(checked) =>
                    setEditingDevice({
                      ...editingDevice,
                      enabled: checked ? 1 : 0,
                    })
                  }
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveDevice} disabled={updateDevice.isPending}>
              {updateDevice.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ==================== 主组件 ====================
export default function NetworkInterfaces() {
  const [activeTab, setActiveTab] = useState("global");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">网络接口配置</h1>
          <p className="text-muted-foreground mt-1">
            配置网络接口、设备和全局网络参数
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="global">
            <Globe className="mr-2 h-4 w-4" />
            全局配置
          </TabsTrigger>
          <TabsTrigger value="ports">
            <Network className="mr-2 h-4 w-4" />
            网口配置
          </TabsTrigger>
          <TabsTrigger value="interfaces">
            <Settings className="mr-2 h-4 w-4" />
            接口配置
          </TabsTrigger>
          <TabsTrigger value="devices">
            <Network className="mr-2 h-4 w-4" />
            设备配置
          </TabsTrigger>
        </TabsList>

        <TabsContent value="global" className="mt-6">
          <GlobalConfigTab />
        </TabsContent>

        <TabsContent value="ports" className="mt-6">
          <PortConfigTab />
        </TabsContent>

        <TabsContent value="interfaces" className="mt-6">
          <InterfaceConfigTab />
        </TabsContent>

        <TabsContent value="devices" className="mt-6">
          <DeviceConfigTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
