/**
 * 容器管理页面
 * 管理Docker容器、镜像、网络和卷
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Box,
  Play,
  Square,
  RotateCw,
  Trash2,
  Plus,
  Download,
  Loader2,
  AlertCircle,
} from "lucide-react";

export default function ContainerManagement() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [pullDialogOpen, setPullDialogOpen] = useState(false);
  const [newContainer, setNewContainer] = useState({
    name: "",
    image: "",
    env: "",
    ports: "",
  });
  const [imageName, setImageName] = useState("");

  // 检查Docker是否可用
  const { data: dockerStatus } = trpc.container.checkDocker.useQuery();

  // 获取容器列表
  const {
    data: containers,
    isLoading: isLoadingContainers,
    refetch: refetchContainers,
  } = trpc.container.listContainers.useQuery({ all: true });

  // 获取镜像列表
  const {
    data: images,
    isLoading: isLoadingImages,
    refetch: refetchImages,
  } = trpc.container.listImages.useQuery();

  // 创建容器
  const createMutation = trpc.container.createContainer.useMutation({
    onSuccess: () => {
      alert("容器创建成功");
      setCreateDialogOpen(false);
      setNewContainer({ name: "", image: "", env: "", ports: "" });
      refetchContainers();
    },
    onError: (error) => {
      alert(`创建失败: ${error.message}`);
    },
  });

  // 启动容器
  const startMutation = trpc.container.startContainer.useMutation({
    onSuccess: () => {
      alert("容器已启动");
      refetchContainers();
    },
    onError: (error) => {
      alert(`启动失败: ${error.message}`);
    },
  });

  // 停止容器
  const stopMutation = trpc.container.stopContainer.useMutation({
    onSuccess: () => {
      alert("容器已停止");
      refetchContainers();
    },
    onError: (error) => {
      alert(`停止失败: ${error.message}`);
    },
  });

  // 重启容器
  const restartMutation = trpc.container.restartContainer.useMutation({
    onSuccess: () => {
      alert("容器已重启");
      refetchContainers();
    },
    onError: (error) => {
      alert(`重启失败: ${error.message}`);
    },
  });

  // 删除容器
  const removeMutation = trpc.container.removeContainer.useMutation({
    onSuccess: () => {
      alert("容器已删除");
      refetchContainers();
    },
    onError: (error) => {
      alert(`删除失败: ${error.message}`);
    },
  });

  // 拉取镜像
  const pullMutation = trpc.container.pullImage.useMutation({
    onSuccess: () => {
      alert("镜像拉取成功");
      setPullDialogOpen(false);
      setImageName("");
      refetchImages();
    },
    onError: (error) => {
      alert(`拉取失败: ${error.message}`);
    },
  });

  // 删除镜像
  const removeImageMutation = trpc.container.removeImage.useMutation({
    onSuccess: () => {
      alert("镜像已删除");
      refetchImages();
    },
    onError: (error) => {
      alert(`删除失败: ${error.message}`);
    },
  });

  const handleCreateContainer = () => {
    if (!newContainer.name || !newContainer.image) {
      alert("请填写容器名称和镜像");
      return;
    }

    const env = newContainer.env
      ? newContainer.env.split(",").map((e) => e.trim())
      : [];
    
    // 解析端口映射 (格式: 8080:80,3306:3306)
    const ports: Record<string, {}> = {};
    if (newContainer.ports) {
      newContainer.ports.split(",").forEach((mapping) => {
        const [hostPort, containerPort] = mapping.trim().split(":");
        if (hostPort && containerPort) {
          ports[`${containerPort}/tcp`] = [{ HostPort: hostPort }];
        }
      });
    }

    createMutation.mutate({
      name: newContainer.name,
      image: newContainer.image,
      env,
      ports: Object.keys(ports).length > 0 ? ports : undefined,
    });
  };

  const handlePullImage = () => {
    if (!imageName) {
      alert("请输入镜像名称");
      return;
    }
    pullMutation.mutate({ imageName });
  };

  const handleRemoveContainer = (containerId: string) => {
    if (confirm("确定要删除此容器吗?")) {
      removeMutation.mutate({ containerId, force: true });
    }
  };

  const handleRemoveImage = (imageId: string) => {
    if (confirm("确定要删除此镜像吗?")) {
      removeImageMutation.mutate({ imageId, force: true });
    }
  };

  // Docker不可用提示
  if (dockerStatus && !dockerStatus.available) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-red-500" />
            <h3 className="text-lg font-medium mb-2">Docker服务不可用</h3>
            <p className="text-sm text-gray-500">
              请确保Docker已安装并正在运行
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const runningContainers = containers?.filter((c) => c.state === "running") || [];
  const totalContainers = containers?.length || 0;
  const totalImages = images?.length || 0;

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题和操作 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">容器管理</h1>
          <p className="text-sm text-gray-500 mt-1">
            管理Docker容器、镜像、网络和卷
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={pullDialogOpen} onOpenChange={setPullDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                拉取镜像
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>拉取Docker镜像</DialogTitle>
                <DialogDescription>
                  输入镜像名称,例如: nginx:latest, mysql:8.0
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="imageName">镜像名称</Label>
                  <Input
                    id="imageName"
                    placeholder="nginx:latest"
                    value={imageName}
                    onChange={(e) => setImageName(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={handlePullImage}
                  disabled={pullMutation.isPending}
                >
                  {pullMutation.isPending && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  拉取
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                创建容器
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>创建新容器</DialogTitle>
                <DialogDescription>
                  填写容器配置信息
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">容器名称 *</Label>
                  <Input
                    id="name"
                    placeholder="my-container"
                    value={newContainer.name}
                    onChange={(e) =>
                      setNewContainer({ ...newContainer, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="image">镜像 *</Label>
                  <Input
                    id="image"
                    placeholder="nginx:latest"
                    value={newContainer.image}
                    onChange={(e) =>
                      setNewContainer({ ...newContainer, image: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="ports">端口映射</Label>
                  <Input
                    id="ports"
                    placeholder="8080:80,3306:3306"
                    value={newContainer.ports}
                    onChange={(e) =>
                      setNewContainer({ ...newContainer, ports: e.target.value })
                    }
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    格式: 主机端口:容器端口,多个用逗号分隔
                  </p>
                </div>
                <div>
                  <Label htmlFor="env">环境变量</Label>
                  <Input
                    id="env"
                    placeholder="KEY=value,KEY2=value2"
                    value={newContainer.env}
                    onChange={(e) =>
                      setNewContainer({ ...newContainer, env: e.target.value })
                    }
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    格式: KEY=value,多个用逗号分隔
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleCreateContainer}
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  创建
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              运行中容器
            </CardTitle>
            <Box className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{runningContainers.length}</div>
            <p className="text-xs text-gray-500 mt-1">总计 {totalContainers} 个</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              镜像数量
            </CardTitle>
            <Box className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalImages}</div>
            <p className="text-xs text-gray-500 mt-1">本地镜像</p>
          </CardContent>
        </Card>
      </div>

      {/* 标签页 */}
      <Tabs defaultValue="containers">
        <TabsList>
          <TabsTrigger value="containers">容器</TabsTrigger>
          <TabsTrigger value="images">镜像</TabsTrigger>
        </TabsList>

        {/* 容器列表 */}
        <TabsContent value="containers" className="space-y-4">
          {isLoadingContainers ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : containers && containers.length > 0 ? (
            <div className="space-y-2">
              {containers.map((container: any) => (
                <Card key={container.id}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded bg-blue-100 flex items-center justify-center">
                          <Box className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {container.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {container.image}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant={
                                container.state === "running"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {container.state === "running" ? "运行中" : "已停止"}
                            </Badge>
                            <span className="text-xs text-gray-400">
                              {container.status}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {container.state !== "running" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startMutation.mutate({ containerId: container.id })}
                            disabled={startMutation.isPending}
                          >
                            <Play className="w-4 h-4" />
                          </Button>
                        )}
                        {container.state === "running" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => stopMutation.mutate({ containerId: container.id })}
                              disabled={stopMutation.isPending}
                            >
                              <Square className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => restartMutation.mutate({ containerId: container.id })}
                              disabled={restartMutation.isPending}
                            >
                              <RotateCw className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRemoveContainer(container.id)}
                          disabled={removeMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                <Box className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>暂无容器</p>
                <p className="text-sm mt-1">点击"创建容器"按钮开始</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* 镜像列表 */}
        <TabsContent value="images" className="space-y-4">
          {isLoadingImages ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : images && images.length > 0 ? (
            <div className="space-y-2">
              {images.map((image: any) => (
                <Card key={image.id}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {image.tags[0] || "未命名"}
                        </h3>
                        <p className="text-sm text-gray-500">
                          大小: {(image.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemoveImage(image.id)}
                        disabled={removeImageMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                <Box className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>暂无镜像</p>
                <p className="text-sm mt-1">点击"拉取镜像"按钮开始</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
