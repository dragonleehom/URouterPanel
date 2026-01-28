/**
 * 虚拟网络管理页面
 * 支持容器和虚拟机的统一网络配置
 * 包括可视化拓扑编辑器
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Network,
  Plus,
  Trash2,
  Loader2,
  Edit,
  Globe,
  Shield,
} from "lucide-react";
import { NetworkTopologyEditor } from "@/components/network/NetworkTopologyEditor";

export default function VirtualNetworkManagement() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedNetworkId, setSelectedNetworkId] = useState<number | null>(null);
  const [newNetwork, setNewNetwork] = useState({
    name: "",
    description: "",
    type: "bridge" as "bridge" | "nat" | "routed" | "isolated",
    subnet: "192.168.100.0/24",
    gateway: "192.168.100.1",
    dhcpEnabled: true,
    dhcpRange: "192.168.100.100-192.168.100.200",
  });

  // 获取虚拟网络列表
  const { data: networks, isLoading, refetch } = trpc.virtualNetwork.list.useQuery();

  // 创建虚拟网络
  const createMutation = trpc.virtualNetwork.create.useMutation({
    onSuccess: () => {
      alert("虚拟网络创建成功!");
      setCreateDialogOpen(false);
      setNewNetwork({
        name: "",
        description: "",
        type: "bridge",
        subnet: "192.168.100.0/24",
        gateway: "192.168.100.1",
        dhcpEnabled: true,
        dhcpRange: "192.168.100.100-192.168.100.200",
      });
      refetch();
    },
    onError: (error) => {
      alert(`创建失败: ${error.message}`);
    },
  });

  // 删除虚拟网络
  const deleteMutation = trpc.virtualNetwork.delete.useMutation({
    onSuccess: () => {
      alert("虚拟网络已删除");
      refetch();
    },
    onError: (error) => {
      alert(`删除失败: ${error.message}`);
    },
  });

  const handleCreate = () => {
    if (!newNetwork.name) {
      alert("请输入网络名称");
      return;
    }
    createMutation.mutate(newNetwork);
  };

  const handleDelete = (id: number, name: string) => {
    if (confirm(`确定要删除虚拟网络 ${name} 吗? 此操作不可恢复!`)) {
      deleteMutation.mutate({ id });
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      bridge: "桥接模式",
      nat: "NAT模式",
      routed: "路由模式",
      isolated: "隔离模式",
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      bridge: "bg-blue-100 text-blue-800",
      nat: "bg-green-100 text-green-800",
      routed: "bg-purple-100 text-purple-800",
      isolated: "bg-gray-100 text-gray-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">虚拟网络管理</h1>
          <p className="text-gray-500 mt-1">
            统一管理容器和虚拟机的虚拟网络,支持可视化拓扑编辑
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              创建虚拟网络
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>创建虚拟网络</DialogTitle>
              <DialogDescription>
                配置虚拟网络参数,支持容器和虚拟机使用
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="network-name">网络名称</Label>
                <Input
                  id="network-name"
                  placeholder="例如: vnet-prod"
                  value={newNetwork.name}
                  onChange={(e) => setNewNetwork({ ...newNetwork, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="network-desc">描述</Label>
                <Input
                  id="network-desc"
                  placeholder="网络用途说明"
                  value={newNetwork.description}
                  onChange={(e) =>
                    setNewNetwork({ ...newNetwork, description: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="network-type">网络类型</Label>
                <Select
                  value={newNetwork.type}
                  onValueChange={(value: any) => setNewNetwork({ ...newNetwork, type: value })}
                >
                  <SelectTrigger id="network-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bridge">桥接模式 - 直接连接物理网络</SelectItem>
                    <SelectItem value="nat">NAT模式 - 网络地址转换</SelectItem>
                    <SelectItem value="routed">路由模式 - 路由转发</SelectItem>
                    <SelectItem value="isolated">隔离模式 - 内部通信</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="network-subnet">子网 (CIDR)</Label>
                  <Input
                    id="network-subnet"
                    placeholder="192.168.100.0/24"
                    value={newNetwork.subnet}
                    onChange={(e) => setNewNetwork({ ...newNetwork, subnet: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="network-gateway">网关IP</Label>
                  <Input
                    id="network-gateway"
                    placeholder="192.168.100.1"
                    value={newNetwork.gateway}
                    onChange={(e) => setNewNetwork({ ...newNetwork, gateway: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="network-dhcp">DHCP范围</Label>
                <Input
                  id="network-dhcp"
                  placeholder="192.168.100.100-192.168.100.200"
                  value={newNetwork.dhcpRange}
                  onChange={(e) =>
                    setNewNetwork({ ...newNetwork, dhcpRange: e.target.value })
                  }
                />
              </div>
            </div>

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

      {/* 网络列表 */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">虚拟网络列表</h2>

        {isLoading ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-gray-400" />
              <p className="text-gray-500">加载中...</p>
            </CardContent>
          </Card>
        ) : !networks || networks.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              <Network className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>暂无虚拟网络</p>
              <p className="text-sm mt-1">点击"创建虚拟网络"按钮开始</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {networks.map((network: any) => (
              <Card key={network.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                        <Network className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{network.name}</CardTitle>
                        <Badge className={`mt-1 ${getTypeColor(network.type)}`}>
                          {getTypeLabel(network.type)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  {network.description && (
                    <CardDescription className="mt-2">{network.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Globe className="w-4 h-4" />
                      <span>子网: {network.subnet}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Shield className="w-4 h-4" />
                      <span>网关: {network.gateway}</span>
                    </div>
                    {network.bridgeName && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Network className="w-4 h-4" />
                        <span>Bridge: {network.bridgeName}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedNetworkId(network.id)}
                      className="flex-1"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      编辑拓扑
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(network.id, network.name)}
                      disabled={deleteMutation.isPending}
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

      {/* 网络拓扑编辑器 */}
      {selectedNetworkId && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>网络拓扑编辑器</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setSelectedNetworkId(null)}>
                关闭
              </Button>
            </div>
            <CardDescription>
              拖拽组件创建网络拓扑,连接容器、虚拟机和物理网卡
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NetworkTopologyEditor networkId={selectedNetworkId} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
