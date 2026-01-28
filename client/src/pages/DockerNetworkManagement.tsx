/**
 * Docker网络管理页面
 * 提供网络创建、删除、查看和容器连接管理功能
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Network, Plus, Trash2, Info, RefreshCw } from "lucide-react";

export default function DockerNetworkManagement() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);
  const [newNetwork, setNewNetwork] = useState({
    name: "",
    driver: "bridge" as "bridge" | "host" | "overlay" | "macvlan",
    internal: false,
    subnet: "",
    gateway: "",
  });

  // 获取网络列表
  const { data: networks, isLoading, error, refetch } = trpc.network.list.useQuery();

  // 创建网络
  const createNetworkMutation = trpc.network.create.useMutation({
    onSuccess: () => {
      alert("网络创建成功!");
      setCreateDialogOpen(false);
      setNewNetwork({
        name: "",
        driver: "bridge",
        internal: false,
        subnet: "",
        gateway: "",
      });
      refetch();
    },
    onError: (error) => {
      alert(`创建网络失败: ${error.message}`);
    },
  });

  // 删除网络
  const deleteNetworkMutation = trpc.network.remove.useMutation({
    onSuccess: () => {
      alert("网络已删除!");
      refetch();
    },
    onError: (error) => {
      alert(`删除网络失败: ${error.message}`);
    },
  });

  const handleCreateNetwork = () => {
    if (!newNetwork.name) {
      alert("请输入网络名称");
      return;
    }
    createNetworkMutation.mutate(newNetwork);
  };

  const handleDeleteNetwork = (networkId: string, networkName: string) => {
    if (confirm(`确定要删除网络 "${networkName}" 吗?`)) {
      deleteNetworkMutation.mutate({ networkId });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Docker网络管理</h1>
          <p className="text-sm text-gray-500 mt-1">
            管理Docker网络和容器连接
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-muted-foreground">加载中...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Docker网络管理</h1>
          <p className="text-sm text-gray-500 mt-1">
            管理Docker网络和容器连接
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-destructive">
              加载失败: {error.message}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Docker网络管理</h1>
          <p className="text-sm text-gray-500 mt-1">
            管理Docker网络和容器连接
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            刷新
          </Button>
          <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            创建网络
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              总网络数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{networks?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Bridge网络
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {networks?.filter((n) => n.driver === "bridge").length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              自定义网络
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {networks?.filter((n) => !["bridge", "host", "none"].includes(n.name)).length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 网络列表 */}
      <Card>
        <CardHeader>
          <CardTitle>网络列表</CardTitle>
          <CardDescription>查看和管理所有Docker网络</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {networks && networks.length > 0 ? (
              networks.map((network) => (
                <div
                  key={network.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <Network className="w-5 h-5 text-gray-400" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{network.name}</span>
                        <Badge variant="secondary">{network.driver}</Badge>
                        {network.internal && (
                          <Badge variant="outline">内部网络</Badge>
                        )}
                        <Badge variant="outline">{network.scope}</Badge>
                      </div>
                      <div className="text-sm text-gray-500">
                        网络ID: {network.id.substring(0, 12)}
                        {network.containers && network.containers.length > 0 && (
                          <span className="ml-4">
                            连接容器: {network.containers.length}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedNetwork(network.id)}
                    >
                      <Info className="w-4 h-4 mr-2" />
                      详情
                    </Button>
                    {!["bridge", "host", "none"].includes(network.name) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteNetwork(network.id, network.name)}
                        disabled={deleteNetworkMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        删除
                      </Button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                没有可用的网络
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 创建网络对话框 */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>创建Docker网络</DialogTitle>
            <DialogDescription>
              配置新的Docker网络参数
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="network-name">网络名称 *</Label>
              <Input
                id="network-name"
                placeholder="my-network"
                value={newNetwork.name}
                onChange={(e) =>
                  setNewNetwork({ ...newNetwork, name: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="network-driver">驱动类型</Label>
              <Select
                value={newNetwork.driver}
                onValueChange={(value: any) =>
                  setNewNetwork({ ...newNetwork, driver: value })
                }
              >
                <SelectTrigger id="network-driver">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bridge">Bridge</SelectItem>
                  <SelectItem value="host">Host</SelectItem>
                  <SelectItem value="overlay">Overlay</SelectItem>
                  <SelectItem value="macvlan">Macvlan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="network-subnet">子网 (可选)</Label>
              <Input
                id="network-subnet"
                placeholder="172.20.0.0/16"
                value={newNetwork.subnet}
                onChange={(e) =>
                  setNewNetwork({ ...newNetwork, subnet: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="network-gateway">网关 (可选)</Label>
              <Input
                id="network-gateway"
                placeholder="172.20.0.1"
                value={newNetwork.gateway}
                onChange={(e) =>
                  setNewNetwork({ ...newNetwork, gateway: e.target.value })
                }
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="network-internal"
                checked={newNetwork.internal}
                onChange={(e) =>
                  setNewNetwork({ ...newNetwork, internal: e.target.checked })
                }
                className="rounded"
              />
              <Label htmlFor="network-internal" className="cursor-pointer">
                内部网络 (禁止外部访问)
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
            >
              取消
            </Button>
            <Button
              onClick={handleCreateNetwork}
              disabled={createNetworkMutation.isPending}
            >
              {createNetworkMutation.isPending ? "创建中..." : "创建"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
