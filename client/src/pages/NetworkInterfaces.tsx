import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  Download,
  Upload,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

// ==================== 全局配置标签页 ====================
function GlobalConfigTab() {
  const { data: globalConfig, isLoading } = trpc.networkConfig.getGlobalConfig.useQuery();
  const { data: allPorts } = trpc.networkConfig.listPorts.useQuery();
  const { data: allDevices } = trpc.networkConfig.listDevices.useQuery();
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
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

  const handleExportConfig = () => {
    try {
      const config = {
        version: "1.0",
        exportTime: new Date().toISOString(),
        globalConfig: globalConfig,
        ports: allPorts || [],
        devices: allDevices || [],
      };

      // 创建下载
      const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `urouteros-config-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success("配置已导出");
    } catch (error: any) {
      toast.error(`导出失败: ${error.message}`);
    }
  };

  const handleImportConfig = async (file: File) => {
    try {
      const text = await file.text();
      const config = JSON.parse(text);

      // 验证配置格式
      if (!config.version || !config.globalConfig) {
        throw new Error("无效的配置文件格式");
      }

      // TODO: 导入配置到数据库
      toast.success("配置导入功能开发中...");
    } catch (error: any) {
      toast.error(`导入失败: ${error.message}`);
    }
  };

  const handleApplyTemplate = (template: any) => {
    // TODO: 应用模板配置到数据库
    toast.success(`已选择模板: ${template.name},功能开发中...`);
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

      <div className="flex justify-between">
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => setIsTemplateDialogOpen(true)}
          >
            <Network className="mr-2 h-4 w-4" />
            应用模板
          </Button>
          <Button 
            variant="outline"
            onClick={handleExportConfig}
          >
            <Download className="mr-2 h-4 w-4" />
            导出配置
          </Button>
          <Button 
            variant="outline"
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.json';
              input.onchange = (e: any) => {
                const file = e.target.files[0];
                if (file) {
                  handleImportConfig(file);
                }
              };
              input.click();
            }}
          >
            <Upload className="mr-2 h-4 w-4" />
            导入配置
          </Button>
        </div>
        <div className="flex gap-2">
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

      {/* 配置模板对话框 */}
      <ConfigTemplateDialog
        open={isTemplateDialogOpen}
        onOpenChange={setIsTemplateDialogOpen}
        onApplyTemplate={handleApplyTemplate}
      />
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
      console.log('[PortConfigTab updatePort] onSuccess triggered');
      toast.success("网口更新成功");
      utils.networkConfig.listPorts.invalidate();
      console.log('[PortConfigTab updatePort] closing dialog...');
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

    console.log('[handleSavePort] editingPort:', editingPort);

    if (editingPort.id) {
      // 只传递API需要的字段,过滤掉createdAt等数据库字段,并将null转换为undefined
      const updateData: any = {
        id: editingPort.id,
      };
      
      // 只添加非null的字段
      if (editingPort.name !== null && editingPort.name !== undefined) updateData.name = editingPort.name;
      if (editingPort.type !== null && editingPort.type !== undefined) updateData.type = editingPort.type;
      if (editingPort.protocol !== null && editingPort.protocol !== undefined) updateData.protocol = editingPort.protocol;
      if (editingPort.ifname !== null && editingPort.ifname !== undefined) updateData.ifname = editingPort.ifname;
      if (editingPort.ipaddr !== null && editingPort.ipaddr !== undefined) updateData.ipaddr = editingPort.ipaddr;
      if (editingPort.netmask !== null && editingPort.netmask !== undefined) updateData.netmask = editingPort.netmask;
      if (editingPort.gateway !== null && editingPort.gateway !== undefined) updateData.gateway = editingPort.gateway;
      if (editingPort.dns !== null && editingPort.dns !== undefined) updateData.dns = editingPort.dns;
      if (editingPort.ipv6 !== null && editingPort.ipv6 !== undefined) updateData.ipv6 = editingPort.ipv6;
      if (editingPort.ipv6addr !== null && editingPort.ipv6addr !== undefined) updateData.ipv6addr = editingPort.ipv6addr;
      if (editingPort.ipv6gateway !== null && editingPort.ipv6gateway !== undefined) updateData.ipv6gateway = editingPort.ipv6gateway;
      if (editingPort.mtu !== null && editingPort.mtu !== undefined) updateData.mtu = editingPort.mtu;
      if (editingPort.metric !== null && editingPort.metric !== undefined) updateData.metric = editingPort.metric;
      if (editingPort.firewallZone !== null && editingPort.firewallZone !== undefined) updateData.firewallZone = editingPort.firewallZone;
      if (editingPort.dhcpServer !== null && editingPort.dhcpServer !== undefined) updateData.dhcpServer = editingPort.dhcpServer;
      if (editingPort.dhcpStart !== null && editingPort.dhcpStart !== undefined) updateData.dhcpStart = editingPort.dhcpStart;
      if (editingPort.dhcpEnd !== null && editingPort.dhcpEnd !== undefined) updateData.dhcpEnd = editingPort.dhcpEnd;
      if (editingPort.dhcpTime !== null && editingPort.dhcpTime !== undefined) updateData.dhcpTime = editingPort.dhcpTime;
      if (editingPort.enabled !== null && editingPort.enabled !== undefined) updateData.enabled = editingPort.enabled;
      console.log('[handleSavePort] calling updatePort.mutate with:', updateData);
      updatePort.mutate(updateData);
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
  const { data: ports, isLoading } = trpc.networkConfig.listPorts.useQuery();
  const [editingInterface, setEditingInterface] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const utils = trpc.useUtils();
  const updatePort = trpc.networkConfig.updatePort.useMutation({
    onSuccess: () => {
      toast.success("接口配置已更新");
      utils.networkConfig.listPorts.invalidate();
      setIsDialogOpen(false);
      setEditingInterface(null);
    },
    onError: (error) => {
      toast.error(`更新失败: ${error.message}`);
    },
  });

  const restartPort = trpc.networkConfig.restartPort.useMutation({
    onSuccess: () => {
      toast.success("接口已重启");
      utils.networkConfig.listPorts.invalidate();
    },
    onError: (error) => {
      toast.error(`重启失败: ${error.message}`);
    },
  });

  const stopPort = trpc.networkConfig.stopPort.useMutation({
    onSuccess: () => {
      toast.success("接口已停止");
      utils.networkConfig.listPorts.invalidate();
    },
    onError: (error) => {
      toast.error(`停止失败: ${error.message}`);
    },
  });

  const handleEditInterface = (port: any) => {
    setEditingInterface(port);
    setIsDialogOpen(true);
  };

  const handleSaveInterface = () => {
    if (!editingInterface) return;
    const { id, ...updates } = editingInterface;
    updatePort.mutate({ id, ...updates });
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
      <Card>
        <CardHeader>
          <CardTitle>接口列表</CardTitle>
          <CardDescription>
            查看和管理所有网络接口的协议配置
          </CardDescription>
        </CardHeader>
        <CardContent>
          {ports && ports.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              暂无接口配置,请在"网口配置"标签页添加WAN/LAN口
            </p>
          ) : (
            <div className="space-y-4">
              {ports?.map((port) => (
                <Card key={port.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{port.name}</h3>
                          <Badge variant={port.type === "wan" ? "default" : "secondary"}>
                            {port.type === "wan" ? "WAN" : "LAN"}
                          </Badge>
                          <Badge variant="outline">{port.protocol.toUpperCase()}</Badge>
                          <Badge variant={port.enabled ? "default" : "secondary"}>
                            {port.enabled ? "已启用" : "已禁用"}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">物理接口: </span>
                            <span className="font-mono">{port.ifname || "-"}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">协议: </span>
                            <span>{port.protocol.toUpperCase()}</span>
                          </div>
                          {port.protocol === "static" && (
                            <>
                              <div>
                                <span className="text-muted-foreground">IPv4地址: </span>
                                <span className="font-mono">{port.ipaddr || "-"}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">子网掩码: </span>
                                <span className="font-mono">{port.netmask || "-"}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">网关: </span>
                                <span className="font-mono">{port.gateway || "-"}</span>
                              </div>
                            </>
                          )}
                          {port.dns && (
                            <div className="col-span-2">
                              <span className="text-muted-foreground">DNS服务器: </span>
                              <span className="font-mono">{port.dns}</span>
                            </div>
                          )}
                          {port.ipv6 === 1 && (
                            <>
                              <div>
                                <span className="text-muted-foreground">IPv6地址: </span>
                                <span className="font-mono">{port.ipv6addr || "-"}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">IPv6网关: </span>
                                <span className="font-mono">{port.ipv6gateway || "-"}</span>
                              </div>
                            </>
                          )}
                        </div>

                        <div className="flex gap-4 text-sm pt-2 border-t">
                          {port.mtu && (
                            <div>
                              <span className="text-muted-foreground">MTU: </span>
                              <span>{port.mtu}</span>
                            </div>
                          )}
                          {port.metric && (
                            <div>
                              <span className="text-muted-foreground">Metric: </span>
                              <span>{port.metric}</span>
                            </div>
                          )}
                          {port.firewallZone && (
                            <div>
                              <span className="text-muted-foreground">防火墙区域: </span>
                              <span>{port.firewallZone}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditInterface(port)}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => restartPort.mutate({ id: port.id })}
                          disabled={restartPort.isPending || !port.enabled}
                        >
                          {restartPort.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => stopPort.mutate({ id: port.id })}
                          disabled={stopPort.isPending || !port.enabled}
                        >
                          {stopPort.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <XCircle className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 编辑对话框 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>接口配置 - {editingInterface?.name}</DialogTitle>
            <DialogDescription>
              配置接口的协议参数
            </DialogDescription>
          </DialogHeader>

          {editingInterface && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="interface-protocol">协议类型</Label>
                <select
                  id="interface-protocol"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={editingInterface.protocol}
                  onChange={(e) =>
                    setEditingInterface({
                      ...editingInterface,
                      protocol: e.target.value,
                    })
                  }
                >
                  <option value="static">静态IP</option>
                  <option value="dhcp">DHCP</option>
                  <option value="pppoe">PPPoE</option>
                </select>
              </div>

              {editingInterface.protocol === "static" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="interface-ipaddr">IPv4地址</Label>
                      <Input
                        id="interface-ipaddr"
                        value={editingInterface.ipaddr || ""}
                        onChange={(e) =>
                          setEditingInterface({
                            ...editingInterface,
                            ipaddr: e.target.value,
                          })
                        }
                        placeholder="192.168.1.1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="interface-netmask">子网掩码</Label>
                      <Input
                        id="interface-netmask"
                        value={editingInterface.netmask || ""}
                        onChange={(e) =>
                          setEditingInterface({
                            ...editingInterface,
                            netmask: e.target.value,
                          })
                        }
                        placeholder="255.255.255.0"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="interface-gateway">网关</Label>
                    <Input
                      id="interface-gateway"
                      value={editingInterface.gateway || ""}
                      onChange={(e) =>
                        setEditingInterface({
                          ...editingInterface,
                          gateway: e.target.value,
                        })
                      }
                      placeholder="192.168.1.254"
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="interface-dns">DNS服务器</Label>
                <Input
                  id="interface-dns"
                  value={editingInterface.dns || ""}
                  onChange={(e) =>
                    setEditingInterface({
                      ...editingInterface,
                      dns: e.target.value,
                    })
                  }
                  placeholder="8.8.8.8 8.8.4.4"
                />
                <p className="text-sm text-muted-foreground">
                  多个DNS服务器用空格分隔
                </p>
              </div>

              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>启用IPv6</Label>
                    <p className="text-sm text-muted-foreground">
                      允许此接口使用IPv6
                    </p>
                  </div>
                  <Switch
                    checked={editingInterface.ipv6 === 1}
                    onCheckedChange={(checked) =>
                      setEditingInterface({
                        ...editingInterface,
                        ipv6: checked ? 1 : 0,
                      })
                    }
                  />
                </div>

                {editingInterface.ipv6 === 1 && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="interface-ipv6addr">IPv6地址</Label>
                      <Input
                        id="interface-ipv6addr"
                        value={editingInterface.ipv6addr || ""}
                        onChange={(e) =>
                          setEditingInterface({
                            ...editingInterface,
                            ipv6addr: e.target.value,
                          })
                        }
                        placeholder="2001:db8::1/64"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="interface-ipv6gateway">IPv6网关</Label>
                      <Input
                        id="interface-ipv6gateway"
                        value={editingInterface.ipv6gateway || ""}
                        onChange={(e) =>
                          setEditingInterface({
                            ...editingInterface,
                            ipv6gateway: e.target.value,
                          })
                        }
                        placeholder="2001:db8::254"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between border-t pt-4">
                <Label>启用此接口</Label>
                <Switch
                  checked={editingInterface.enabled === 1}
                  onCheckedChange={(checked) =>
                    setEditingInterface({
                      ...editingInterface,
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
            <Button onClick={handleSaveInterface} disabled={updatePort.isPending}>
              {updatePort.isPending && (
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
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">网络接口配置</h1>
        <p className="text-sm text-gray-600 mt-1">
          配置网络接口、设备和全局网络参数
        </p>
      </div>

      {/* 网络配置标签页 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="global">全局配置</TabsTrigger>
          <TabsTrigger value="ports">网口配置</TabsTrigger>
          <TabsTrigger value="interfaces">接口配置</TabsTrigger>
          <TabsTrigger value="devices">设备配置</TabsTrigger>
        </TabsList>

        <TabsContent value="global" className="space-y-4">
          <GlobalConfigTab />
        </TabsContent>

        <TabsContent value="ports" className="space-y-4">
          <PortConfigTab />
        </TabsContent>

        <TabsContent value="interfaces" className="space-y-4">
          <InterfaceConfigTab />
        </TabsContent>

        <TabsContent value="devices" className="space-y-4">
          <DeviceConfigTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}


// ==================== 配置模板对话框 ====================
const NETWORK_TEMPLATES = {
  home_router: {
    name: "家庭路由器",
    description: "适合家庭使用的标准路由器配置,1个WAN口(DHCP)+ 1个LAN口(静态IP + DHCP服务器)",
    config: {
      globalConfig: {
        ipv6UlaPrefix: "fd00::/48",
        packetSteering: 1,
        rpsEnabled: 0,
      },
      ports: [
        {
          name: "WAN",
          type: "wan",
          protocol: "dhcp",
          ifname: "eth0",
          enabled: 1,
          mtu: 1500,
          firewallZone: "wan",
        },
        {
          name: "LAN",
          type: "lan",
          protocol: "static",
          ifname: "eth1",
          ipaddr: "192.168.1.1",
          netmask: "255.255.255.0",
          dhcpServer: 1,
          dhcpStart: "192.168.1.100",
          dhcpEnd: "192.168.1.200",
          dhcpLeaseTime: "12h",
          enabled: 1,
          mtu: 1500,
          firewallZone: "lan",
        },
      ],
    },
  },
  enterprise_gateway: {
    name: "企业网关",
    description: "企业级网关配置,多WAN负载均衡 + 多LAN网段隔离",
    config: {
      globalConfig: {
        ipv6UlaPrefix: "fd00::/48",
        packetSteering: 1,
        rpsEnabled: 1,
        rpsCpus: "f",
      },
      ports: [
        {
          name: "WAN1",
          type: "wan",
          protocol: "static",
          ifname: "eth0",
          ipaddr: "10.0.0.2",
          netmask: "255.255.255.0",
          gateway: "10.0.0.1",
          dns: "8.8.8.8 8.8.4.4",
          enabled: 1,
          mtu: 1500,
          metric: 10,
          firewallZone: "wan",
        },
        {
          name: "WAN2",
          type: "wan",
          protocol: "dhcp",
          ifname: "eth1",
          enabled: 1,
          mtu: 1500,
          metric: 20,
          firewallZone: "wan",
        },
        {
          name: "LAN_OFFICE",
          type: "lan",
          protocol: "static",
          ifname: "eth2",
          ipaddr: "192.168.10.1",
          netmask: "255.255.255.0",
          dhcpServer: 1,
          dhcpStart: "192.168.10.100",
          dhcpEnd: "192.168.10.200",
          dhcpLeaseTime: "24h",
          enabled: 1,
          firewallZone: "lan",
        },
        {
          name: "LAN_GUEST",
          type: "lan",
          protocol: "static",
          ifname: "eth3",
          ipaddr: "192.168.20.1",
          netmask: "255.255.255.0",
          dhcpServer: 1,
          dhcpStart: "192.168.20.100",
          dhcpEnd: "192.168.20.200",
          dhcpLeaseTime: "2h",
          enabled: 1,
          firewallZone: "guest",
        },
      ],
    },
  },
  transparent_bridge: {
    name: "透明网桥",
    description: "二层透明网桥配置,将多个物理接口桥接为一个逻辑接口",
    config: {
      globalConfig: {
        ipv6UlaPrefix: "",
        packetSteering: 0,
        rpsEnabled: 0,
      },
      ports: [
        {
          name: "BR_LAN",
          type: "lan",
          protocol: "static",
          ifname: "br-lan",
          ipaddr: "192.168.1.1",
          netmask: "255.255.255.0",
          dhcpServer: 1,
          dhcpStart: "192.168.1.100",
          dhcpEnd: "192.168.1.200",
          dhcpLeaseTime: "12h",
          enabled: 1,
          firewallZone: "lan",
        },
      ],
    },
  },
};

function ConfigTemplateDialog({
  open,
  onOpenChange,
  onApplyTemplate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplyTemplate: (template: any) => void;
}) {
  const [selectedTemplate, setSelectedTemplate] = useState<keyof typeof NETWORK_TEMPLATES | null>(null);

  const handleApply = () => {
    if (!selectedTemplate) {
      toast.error("请选择一个配置模板");
      return;
    }
    onApplyTemplate(NETWORK_TEMPLATES[selectedTemplate]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>选择配置模板</DialogTitle>
          <DialogDescription>
            选择一个预设模板快速配置网络
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {Object.entries(NETWORK_TEMPLATES).map(([key, template]) => (
            <Card
              key={key}
              className={`cursor-pointer transition-colors ${
                selectedTemplate === key ? "border-primary bg-primary/5" : ""
              }`}
              onClick={() => setSelectedTemplate(key as keyof typeof NETWORK_TEMPLATES)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">{template.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {template.description}
                    </p>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">包含配置:</p>
                      <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                        <li>全局配置: IPv6 ULA={template.config.globalConfig.ipv6UlaPrefix || "未设置"}, 包转向={template.config.globalConfig.packetSteering ? "启用" : "禁用"}</li>
                        <li>网口配置: {template.config.ports.length}个网口</li>
                        {template.config.ports.map((port, idx) => (
                          <li key={idx} className="ml-4">
                            {port.name} ({port.type.toUpperCase()}, {port.protocol.toUpperCase()})
                            {port.protocol === "static" && ` - ${port.ipaddr}`}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  {selectedTemplate === key && (
                    <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0" />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleApply} disabled={!selectedTemplate}>
            应用模板
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
