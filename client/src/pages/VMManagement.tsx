/**
 * 虚拟机管理页面
 * 基于QEMU实现虚拟机创建、启动、停止等功能
 * 集成智能性能优化和高级配置选项
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Server,
  Play,
  Square,
  Trash2,
  Plus,
  Monitor,
  Cpu,
  HardDrive,
  Loader2,
  CheckCircle2,
  XCircle,
  Network,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HardwareDetectionPanel } from "@/components/vm/HardwareDetectionPanel";
import { OptimizationRecommendations } from "@/components/vm/OptimizationRecommendations";
import { AdvancedOptions, type AdvancedVMConfig } from "@/components/vm/AdvancedOptions";
import { EditVMNetworkDialog } from "@/components/vm/EditVMNetworkDialog";

export default function VMManagement() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editNetworkDialogOpen, setEditNetworkDialogOpen] = useState(false);
  const [selectedVM, setSelectedVM] = useState<{
    name: string;
    status: string;
  } | null>(null);
  const [newVM, setNewVM] = useState({
    name: "",
    memory: 2048,
    cpus: 2,
    diskSize: 20,
    virtualNetworkId: null as number | null,
    ipAddress: "",
  });
  const [advancedConfig, setAdvancedConfig] = useState<AdvancedVMConfig>({});

  // 获取虚拟机列表
  const { data: vms, isLoading, refetch } = trpc.vm.list.useQuery();

  // 检查KVM支持
  const { data: kvmStatus } = trpc.vm.checkKVM.useQuery();

  // 获取虚拟网络列表
  const { data: virtualNetworks } = trpc.virtualNetwork.list.useQuery();

  // 连接虚拟机到虚拟网络
  const attachNetworkMutation = trpc.virtualNetwork.attachVM.useMutation({
    onSuccess: () => {
      alert("虚拟机创建成功并已连接到虚拟网络!");
      setCreateDialogOpen(false);
      setNewVM({ name: "", memory: 2048, cpus: 2, diskSize: 20, virtualNetworkId: null, ipAddress: "" });
      setAdvancedConfig({});
      refetch();
    },
    onError: (error) => {
      alert(`网络连接失败: ${error.message}`);
      refetch();
    },
  });

  // 创建虚拟机
  const createMutation = trpc.vm.create.useMutation({
    onSuccess: (data) => {
      // 如果选择了虚拟网络,连接虚拟机到网络
      if (newVM.virtualNetworkId) {
        attachNetworkMutation.mutate({
          networkId: newVM.virtualNetworkId,
          vmName: newVM.name,
          ipAddress: newVM.ipAddress || undefined,
        });
      } else {
        alert("虚拟机创建成功!");
        setCreateDialogOpen(false);
        setNewVM({ name: "", memory: 2048, cpus: 2, diskSize: 20, virtualNetworkId: null, ipAddress: "" });
        setAdvancedConfig({});
        refetch();
      }
    },
    onError: (error) => {
      alert(`创建失败: ${error.message}`);
    },
  });

  // 启动虚拟机
  const startMutation = trpc.vm.start.useMutation({
    onSuccess: (data) => {
      alert(`虚拟机已启动!\nVNC地址: ${data.vncUrl}`);
      refetch();
    },
    onError: (error) => {
      alert(`启动失败: ${error.message}`);
    },
  });

  // 停止虚拟机
  const stopMutation = trpc.vm.stop.useMutation({
    onSuccess: () => {
      alert("虚拟机已停止");
      refetch();
    },
    onError: (error) => {
      alert(`停止失败: ${error.message}`);
    },
  });

  // 删除虚拟机
  const deleteMutation = trpc.vm.delete.useMutation({
    onSuccess: () => {
      alert("虚拟机已删除");
      refetch();
    },
    onError: (error) => {
      alert(`删除失败: ${error.message}`);
    },
  });

  const handleCreate = () => {
    if (!newVM.name) {
      alert("请输入虚拟机名称");
      return;
    }
    // TODO: 将advancedConfig传递给后端
    console.log("Advanced config:", advancedConfig);
    createMutation.mutate(newVM);
  };

  const handleStart = (name: string) => {
    startMutation.mutate({ name });
  };

  const handleStop = (name: string) => {
    if (confirm(`确定要停止虚拟机 ${name} 吗?`)) {
      stopMutation.mutate({ name });
    }
  };

  const handleDelete = (name: string) => {
    if (confirm(`确定要删除虚拟机 ${name} 吗? 此操作不可恢复!`)) {
      deleteMutation.mutate({ name });
    }
  };

  const handleApplyOptimization = (config: any) => {
    // 应用一键优化配置
    setAdvancedConfig({
      ...advancedConfig,
      cpuPinning: { enabled: config.enableCPUPinning },
      numa: { enabled: config.enableNUMA },
      hugepages: {
        enabled: config.enableHugepages,
        size: config.hugepagesSize,
      },
    });
    alert("优化配置已应用!请在高级选项中查看详细配置。");
  };

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">虚拟机管理</h1>
          <p className="text-gray-500 mt-1">基于QEMU的虚拟机管理系统,支持GPU直通和性能优化</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              创建虚拟机
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>创建新虚拟机</DialogTitle>
              <DialogDescription>
                配置虚拟机参数、性能优化和高级选项
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">基本配置</TabsTrigger>
                <TabsTrigger value="hardware">硬件检测</TabsTrigger>
                <TabsTrigger value="optimization">性能优化</TabsTrigger>
                <TabsTrigger value="advanced">高级选项</TabsTrigger>
              </TabsList>

              {/* 基本配置 */}
              <TabsContent value="basic" className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="vm-name">虚拟机名称</Label>
                  <Input
                    id="vm-name"
                    placeholder="例如: ubuntu-server"
                    value={newVM.name}
                    onChange={(e) => setNewVM({ ...newVM, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vm-memory">内存 (MB)</Label>
                  <Input
                    id="vm-memory"
                    type="number"
                    min="512"
                    max="32768"
                    value={newVM.memory}
                    onChange={(e) => setNewVM({ ...newVM, memory: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vm-cpus">CPU核心数</Label>
                  <Input
                    id="vm-cpus"
                    type="number"
                    min="1"
                    max="16"
                    value={newVM.cpus}
                    onChange={(e) => setNewVM({ ...newVM, cpus: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vm-disk">磁盘大小 (GB)</Label>
                  <Input
                    id="vm-disk"
                    type="number"
                    min="1"
                    max="500"
                    value={newVM.diskSize}
                    onChange={(e) => setNewVM({ ...newVM, diskSize: parseInt(e.target.value) })}
                  />
                </div>

                {/* 虚拟网络配置 */}
                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Network className="w-4 h-4 text-gray-500" />
                    <Label className="text-sm font-semibold">网络配置</Label>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="vm-network">虚拟网络</Label>
                      <Select
                        value={newVM.virtualNetworkId?.toString() || "default"}
                        onValueChange={(value) =>
                          setNewVM({
                            ...newVM,
                            virtualNetworkId: value === "default" ? null : parseInt(value),
                          })
                        }
                      >
                        <SelectTrigger id="vm-network">
                          <SelectValue placeholder="选择网络" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">NAT默认网络</SelectItem>
                          {virtualNetworks?.map((network: any) => (
                            <SelectItem key={network.id} value={network.id.toString()}>
                              {network.name} ({network.subnet})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500 mt-1">
                        选择虚拟机连接的虚拟网络
                      </p>
                    </div>

                    {newVM.virtualNetworkId && (
                      <div>
                        <Label htmlFor="vm-ip">IP地址 (可选)</Label>
                        <Input
                          id="vm-ip"
                          placeholder="留空自动分配"
                          value={newVM.ipAddress}
                          onChange={(e) => setNewVM({ ...newVM, ipAddress: e.target.value })}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          指定静态IP地址,留空则自动分配
                        </p>
                      </div>
                    )}

                    {newVM.virtualNetworkId && virtualNetworks && (
                      <div className="bg-blue-50 border border-blue-200 rounded p-3 text-xs">
                        <p className="font-semibold text-blue-900 mb-1">网络信息</p>
                        {(() => {
                          const selectedNetwork = virtualNetworks.find(
                            (n: any) => n.id === newVM.virtualNetworkId
                          );
                          if (!selectedNetwork) return null;
                          return (
                            <div className="text-blue-800 space-y-0.5">
                              <p>子网: {selectedNetwork.subnet}</p>
                              <p>网关: {selectedNetwork.gateway}</p>
                              <p>类型: {selectedNetwork.type}</p>
                              {selectedNetwork.bridgeName && (
                                <p>Bridge: {selectedNetwork.bridgeName}</p>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* 硬件检测 */}
              <TabsContent value="hardware" className="py-4">
                <HardwareDetectionPanel />
              </TabsContent>

              {/* 性能优化 */}
              <TabsContent value="optimization" className="py-4">
                <OptimizationRecommendations onApplyOptimization={handleApplyOptimization} />
              </TabsContent>

              {/* 高级选项 */}
              <TabsContent value="advanced" className="py-4">
                <AdvancedOptions config={advancedConfig} onChange={setAdvancedConfig} />
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                创建
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* KVM状态卡片 */}
      {kvmStatus && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              {kvmStatus.supported ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-yellow-600" />
              )}
              <div>
                <p className="font-medium">{kvmStatus.message}</p>
                {!kvmStatus.supported && (
                  <p className="text-sm text-gray-500 mt-1">
                    性能会比KVM模式略低,但功能完整可用
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 虚拟机列表 */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">虚拟机列表</h2>

        {isLoading ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-gray-400" />
              <p className="text-gray-500">加载中...</p>
            </CardContent>
          </Card>
        ) : !vms || vms.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              <Server className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>暂无虚拟机</p>
              <p className="text-sm mt-1">点击"创建虚拟机"按钮开始</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vms.map((vm: any) => (
              <Card key={vm.name}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Server className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{vm.name}</CardTitle>
                        <Badge
                          variant={vm.status === "running" ? "default" : "secondary"}
                          className="mt-1"
                        >
                          {vm.status === "running" ? "运行中" : "已停止"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Cpu className="w-4 h-4" />
                      <span>CPU: {vm.cpus || "N/A"} 核心</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Monitor className="w-4 h-4" />
                      <span>内存: {vm.memory || "N/A"} MB</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <HardDrive className="w-4 h-4" />
                      <span>磁盘: {vm.diskPath.split("/").pop()}</span>
                    </div>
                    {vm.vncPort && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Monitor className="w-4 h-4" />
                        <span>VNC: localhost:{vm.vncPort}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    {vm.status === "stopped" ? (
                      <Button
                        size="sm"
                        onClick={() => handleStart(vm.name)}
                        disabled={startMutation.isPending}
                        className="flex-1"
                      >
                        <Play className="w-4 h-4 mr-1" />
                        启动
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStop(vm.name)}
                        disabled={stopMutation.isPending}
                        className="flex-1"
                      >
                        <Square className="w-4 h-4 mr-1" />
                        停止
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedVM({ name: vm.name, status: vm.status });
                        setEditNetworkDialogOpen(true);
                      }}
                      title="编辑网络"
                    >
                      <Network className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(vm.name)}
                      disabled={deleteMutation.isPending || vm.status === "running"}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* 编辑网络对话框 */}
      {selectedVM && (
        <EditVMNetworkDialog
          open={editNetworkDialogOpen}
          onOpenChange={setEditNetworkDialogOpen}
          vmName={selectedVM.name}
          vmStatus={selectedVM.status}
          onSuccess={() => {
            refetch();
          }}
        />
      )}
    </div>
  );
}
