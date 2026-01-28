import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Server,
  Plus,
  Trash2,
  RefreshCw,
  Power,
  PowerOff,
  Clock,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function DHCPDNSManagement() {
  const [staticLeaseDialogOpen, setStaticLeaseDialogOpen] = useState(false);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);

  // 获取DHCP/DNS状态
  const { data: status, refetch: refetchStatus } = trpc.dhcpDns.getStatus.useQuery();

  // 获取DHCP配置
  const { data: config, refetch: refetchConfig } = trpc.dhcpDns.getConfig.useQuery();

  // 获取租约列表
  const { data: leases, isLoading: leasesLoading, refetch: refetchLeases } = 
    trpc.dhcpDns.getLeases.useQuery();

  // 获取静态租约列表
  const { data: staticLeases, refetch: refetchStaticLeases } = 
    trpc.dhcpDns.getStaticLeases.useQuery();

  // 配置DHCP mutation
  const configureMutation = trpc.dhcpDns.configure.useMutation({
    onSuccess: () => {
      toast.success("DHCP配置已保存");
      refetchConfig();
      refetchStatus();
      setConfigDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`配置失败: ${error.message}`);
    },
  });

  // 添加静态租约mutation
  const addStaticLeaseMutation = trpc.dhcpDns.addStaticLease.useMutation({
    onSuccess: () => {
      toast.success("静态IP绑定已添加");
      refetchStaticLeases();
      setStaticLeaseDialogOpen(false);
      setStaticLeaseForm({ hostname: "", mac: "", ip: "" });
    },
    onError: (error) => {
      toast.error(`添加失败: ${error.message}`);
    },
  });

  // 删除静态租约mutation
  const deleteStaticLeaseMutation = trpc.dhcpDns.deleteStaticLease.useMutation({
    onSuccess: () => {
      toast.success("静态IP绑定已删除");
      refetchStaticLeases();
    },
    onError: (error) => {
      toast.error(`删除失败: ${error.message}`);
    },
  });

  // 启动服务mutation
  const startMutation = trpc.dhcpDns.start.useMutation({
    onSuccess: () => {
      toast.success("DHCP/DNS服务已启动");
      refetchStatus();
    },
    onError: (error) => {
      toast.error(`启动失败: ${error.message}`);
    },
  });

  // 停止服务mutation
  const stopMutation = trpc.dhcpDns.stop.useMutation({
    onSuccess: () => {
      toast.success("DHCP/DNS服务已停止");
      refetchStatus();
    },
    onError: (error) => {
      toast.error(`停止失败: ${error.message}`);
    },
  });

  // 重启服务mutation
  const restartMutation = trpc.dhcpDns.restart.useMutation({
    onSuccess: () => {
      toast.success("DHCP/DNS服务已重启");
      refetchStatus();
      refetchLeases();
    },
    onError: (error) => {
      toast.error(`重启失败: ${error.message}`);
    },
  });

  // 配置表单状态
  const [configForm, setConfigForm] = useState({
    interface: "",
    dhcp_start: "",
    dhcp_end: "",
    dns_servers: "",
    dhcp_time: "",
    domain: "",
    enabled: true,
  });

  // 静态租约表单状态
  const [staticLeaseForm, setStaticLeaseForm] = useState({
    hostname: "",
    mac: "",
    ip: "",
  });

  // 加载配置到表单
  const loadConfigToForm = () => {
    if (config) {
      setConfigForm({
        interface: config.interface || "",
        dhcp_start: config.dhcp_start || "",
        dhcp_end: config.dhcp_end || "",
        dns_servers: config.dns_servers?.join(",") || "",
        dhcp_time: config.dhcp_time || "",
        domain: config.domain || "",
        enabled: config.enabled !== false,
      });
      setConfigDialogOpen(true);
    }
  };

  // 提交配置
  const handleSubmitConfig = () => {
    if (!configForm.interface || !configForm.dhcp_start || !configForm.dhcp_end) {
      toast.error("请填写必填项");
      return;
    }

    configureMutation.mutate({
      interface: configForm.interface,
      dhcp_start: configForm.dhcp_start,
      dhcp_end: configForm.dhcp_end,
      dhcp_time: configForm.dhcp_time || "12h",
      dns_servers: configForm.dns_servers ? configForm.dns_servers.split(",").map(s => s.trim()) : [],
      domain: configForm.domain,
      enabled: configForm.enabled,
    });
  };

  // 提交静态租约
  const handleSubmitStaticLease = () => {
    if (!staticLeaseForm.mac || !staticLeaseForm.ip) {
      toast.error("请填写MAC地址和IP地址");
      return;
    }

    addStaticLeaseMutation.mutate({
      hostname: staticLeaseForm.hostname || "",
      mac: staticLeaseForm.mac,
      ip: staticLeaseForm.ip,
    });
  };

  // 删除静态租约
  const handleDeleteStaticLease = (mac: string) => {
    if (confirm(`确定要删除MAC地址为 ${mac} 的静态绑定吗?`)) {
      deleteStaticLeaseMutation.mutate({ mac });
    }
  };

  if (leasesLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">DHCP/DNS服务</h1>
          <p className="text-muted-foreground mt-1">
            管理DHCP服务器、租约和静态IP绑定
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetchStatus();
              refetchConfig();
              refetchLeases();
              refetchStaticLeases();
            }}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            刷新
          </Button>
          {status?.running ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => stopMutation.mutate()}
              disabled={stopMutation.isPending}
            >
              <PowerOff className="w-4 h-4 mr-2" />
              停止服务
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => startMutation.mutate()}
              disabled={startMutation.isPending}
            >
              <Power className="w-4 h-4 mr-2" />
              启动服务
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => restartMutation.mutate()}
            disabled={restartMutation.isPending}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            重启服务
          </Button>
        </div>
      </div>

      {/* 状态卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Server className="w-8 h-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">服务状态</p>
              <p className="text-2xl font-bold">
                {status?.running ? "运行中" : "已停止"}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div>
            <p className="text-sm text-muted-foreground">活跃租约</p>
            <p className="text-2xl font-bold">
              {leases?.filter((l: any) => l.active).length || 0}
            </p>
          </div>
        </Card>
        <Card className="p-4">
          <div>
            <p className="text-sm text-muted-foreground">静态绑定</p>
            <p className="text-2xl font-bold">{staticLeases?.length || 0}</p>
          </div>
        </Card>
        <Card className="p-4">
          <div>
            <p className="text-sm text-muted-foreground">配置状态</p>
            <p className="text-2xl font-bold">
              {status?.configured ? "已配置" : "未配置"}
            </p>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="config" className="space-y-4">
        <TabsList>
          <TabsTrigger value="config">DHCP配置</TabsTrigger>
          <TabsTrigger value="leases">租约列表</TabsTrigger>
          <TabsTrigger value="static">静态绑定</TabsTrigger>
        </TabsList>

        {/* DHCP配置标签页 */}
        <TabsContent value="config" className="space-y-4">
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">当前配置</h3>
                <Button onClick={loadConfigToForm}>编辑配置</Button>
              </div>

              {config ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>接口</Label>
                    <p className="text-sm mt-1">{config.interface || "未配置"}</p>
                  </div>
                  <div>
                    <Label>IP范围</Label>
                    <p className="text-sm mt-1">
                      {config.dhcp_start && config.dhcp_end
                        ? `${config.dhcp_start} - ${config.dhcp_end}`
                        : "未配置"}
                    </p>
                  </div>

                  <div>
                    <Label>DNS服务器</Label>
                    <p className="text-sm mt-1">
                      {config.dns_servers?.join(", ") || "未配置"}
                    </p>
                  </div>
                  <div>
                    <Label>租约时间</Label>
                    <p className="text-sm mt-1">
                      {config.dhcp_time || "未配置"}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">暂无配置信息</p>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* 租约列表标签页 */}
        <TabsContent value="leases" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">DHCP租约</h3>
            {leases && leases.length > 0 ? (
              <div className="space-y-2">
                {leases.map((lease: any) => (
                  <div
                    key={lease.mac}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{lease.hostname || "未知主机"}</p>
                      <p className="text-sm text-muted-foreground">
                        MAC: {lease.mac} | IP: {lease.ip}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {lease.active ? (
                        <span className="text-sm text-green-600 flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          活跃
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">已过期</span>
                      )}
                      {lease.expires && (
                        <span className="text-xs text-muted-foreground">
                          过期: {new Date(lease.expires * 1000).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">暂无租约记录</p>
            )}
          </Card>
        </TabsContent>

        {/* 静态绑定标签页 */}
        <TabsContent value="static" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">静态IP绑定</h3>
            <Button onClick={() => setStaticLeaseDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              添加绑定
            </Button>
          </div>

          <div className="space-y-2">
            {staticLeases && staticLeases.length > 0 ? (
              staticLeases.map((lease: any) => (
                <Card key={lease.mac} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{lease.hostname || "未命名"}</p>
                      <p className="text-sm text-muted-foreground">
                        MAC: {lease.mac} | IP: {lease.ip}
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteStaticLease(lease.mac)}
                      disabled={deleteStaticLeaseMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">暂无静态IP绑定</p>
                <Button
                  className="mt-4"
                  onClick={() => setStaticLeaseDialogOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  添加第一个绑定
                </Button>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* 配置对话框 */}
      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>DHCP配置</DialogTitle>
            <DialogDescription>
              配置DHCP服务器参数
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="interface">接口 *</Label>
              <Input
                id="interface"
                value={configForm.interface}
                onChange={(e) =>
                  setConfigForm({ ...configForm, interface: e.target.value })
                }
                placeholder="例如: br-lan"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dhcp_start">起始IP *</Label>
                <Input
                  id="dhcp_start"
                  value={configForm.dhcp_start}
                  onChange={(e) =>
                    setConfigForm({ ...configForm, dhcp_start: e.target.value })
                  }
                  placeholder="192.168.188.100"
                />
              </div>
              <div>
                <Label htmlFor="dhcp_end">结束IP *</Label>
                <Input
                  id="dhcp_end"
                  value={configForm.dhcp_end}
                  onChange={(e) =>
                    setConfigForm({ ...configForm, dhcp_end: e.target.value })
                  }
                  placeholder="192.168.188.200"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="dns_servers">DNS服务器(逗号分隔)</Label>
              <Input
                id="dns_servers"
                value={configForm.dns_servers}
                onChange={(e) =>
                  setConfigForm({ ...configForm, dns_servers: e.target.value })
                }
                placeholder="8.8.8.8,8.8.4.4"
              />
            </div>
            <div>
              <Label htmlFor="dhcp_time">租约时间</Label>
              <Input
                id="dhcp_time"
                value={configForm.dhcp_time}
                onChange={(e) =>
                  setConfigForm({ ...configForm, dhcp_time: e.target.value })
                }
                placeholder="12h"
              />
            </div>
            <div>
              <Label htmlFor="domain">域名(可选)</Label>
              <Input
                id="domain"
                value={configForm.domain}
                onChange={(e) =>
                  setConfigForm({ ...configForm, domain: e.target.value })
                }
                placeholder="local"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfigDialogOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleSubmitConfig}
              disabled={configureMutation.isPending}
            >
              {configureMutation.isPending ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 静态租约对话框 */}
      <Dialog open={staticLeaseDialogOpen} onOpenChange={setStaticLeaseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加静态IP绑定</DialogTitle>
            <DialogDescription>
              为指定MAC地址分配固定IP
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="hostname">主机名</Label>
              <Input
                id="hostname"
                value={staticLeaseForm.hostname}
                onChange={(e) =>
                  setStaticLeaseForm({ ...staticLeaseForm, hostname: e.target.value })
                }
                placeholder="例如: my-device"
              />
            </div>
            <div>
              <Label htmlFor="mac">MAC地址 *</Label>
              <Input
                id="mac"
                value={staticLeaseForm.mac}
                onChange={(e) =>
                  setStaticLeaseForm({ ...staticLeaseForm, mac: e.target.value })
                }
                placeholder="AA:BB:CC:DD:EE:FF"
              />
            </div>
            <div>
              <Label htmlFor="ip">IP地址 *</Label>
              <Input
                id="ip"
                value={staticLeaseForm.ip}
                onChange={(e) =>
                  setStaticLeaseForm({ ...staticLeaseForm, ip: e.target.value })
                }
                placeholder="192.168.1.100"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setStaticLeaseDialogOpen(false);
                setStaticLeaseForm({ hostname: "", mac: "", ip: "" });
              }}
            >
              取消
            </Button>
            <Button
              onClick={handleSubmitStaticLease}
              disabled={addStaticLeaseMutation.isPending}
            >
              {addStaticLeaseMutation.isPending ? "添加中..." : "添加"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
