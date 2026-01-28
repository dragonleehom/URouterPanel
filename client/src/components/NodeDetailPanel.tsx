/**
 * 网络拓扑图节点详情面板
 * 显示和编辑网络/容器节点的详细信息
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { X, Network, Box, Edit, Save, Play, Square, RotateCw } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface NodeDetailPanelProps {
  node: {
    id: string;
    type: "network" | "container";
    data: any;
  } | null;
  onClose: () => void;
}

export default function NodeDetailPanel({ node, onClose }: NodeDetailPanelProps) {
  const [isEditing, setIsEditing] = useState(false);

  if (!node) {
    return null;
  }

  return (
    <div className="absolute top-0 right-0 h-full w-96 bg-white border-l shadow-lg z-10 flex flex-col">
      {/* 头部 */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          {node.type === "network" ? (
            <Network className="w-5 h-5 text-blue-600" />
          ) : (
            <Box className="w-5 h-5 text-green-600" />
          )}
          <h3 className="font-semibold">
            {node.type === "network" ? "网络详情" : "容器详情"}
          </h3>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* 内容区域 */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {node.type === "network" ? (
            <NetworkDetails node={node} isEditing={isEditing} />
          ) : (
            <ContainerDetails node={node} isEditing={isEditing} />
          )}
        </div>
      </ScrollArea>

      {/* 底部操作按钮 */}
      <div className="p-4 border-t space-y-2">
        {node.type === "container" && (
          <ContainerActions containerId={node.id.replace("container-", "")} />
        )}
        <Button
          variant={isEditing ? "default" : "outline"}
          className="w-full"
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? (
            <>
              <Save className="w-4 h-4 mr-2" />
              保存更改
            </>
          ) : (
            <>
              <Edit className="w-4 h-4 mr-2" />
              编辑配置
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// 网络节点详情组件
function NetworkDetails({ node, isEditing }: { node: any; isEditing: boolean }) {
  const networkId = node.id.replace("network-", "");
  const { data: networkDetail } = trpc.network.inspect.useQuery({ networkId });

  if (!networkDetail) {
    return <div className="text-sm text-muted-foreground">加载中...</div>;
  }

  return (
    <div className="space-y-4">
      {/* 基本信息 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">基本信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>
            <Label className="text-xs text-muted-foreground">名称</Label>
            <div className="font-medium">{node.data.label}</div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">ID</Label>
            <div className="font-mono text-xs truncate">{networkId}</div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">驱动</Label>
            <Badge variant="secondary" className="text-xs">
              {node.data.driver}
            </Badge>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">作用域</Label>
            <Badge variant="outline" className="text-xs">
              {node.data.scope}
            </Badge>
          </div>
          {node.data.internal && (
            <div>
              <Badge variant="destructive" className="text-xs">
                内部网络
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 网络配置 */}
      {networkDetail.ipam?.Config && networkDetail.ipam.Config.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">网络配置</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {networkDetail.ipam.Config.map((config: any, index: number) => (
              <div key={index} className="space-y-1">
                {config.Subnet && (
                  <div>
                    <Label className="text-xs text-muted-foreground">子网</Label>
                    {isEditing ? (
                      <Input
                        value={config.Subnet}
                        className="h-8 text-sm"
                        disabled
                      />
                    ) : (
                      <div className="font-mono text-xs">{config.Subnet}</div>
                    )}
                  </div>
                )}
                {config.Gateway && (
                  <div>
                    <Label className="text-xs text-muted-foreground">网关</Label>
                    {isEditing ? (
                      <Input
                        value={config.Gateway}
                        className="h-8 text-sm"
                        disabled
                      />
                    ) : (
                      <div className="font-mono text-xs">{config.Gateway}</div>
                    )}
                  </div>
                )}
                {config.IPRange && (
                  <div>
                    <Label className="text-xs text-muted-foreground">IP范围</Label>
                    <div className="font-mono text-xs">{config.IPRange}</div>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 连接的容器 */}
      {networkDetail.containers && networkDetail.containers.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">连接的容器</CardTitle>
            <CardDescription className="text-xs">
              {networkDetail.containers.length} 个容器
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {networkDetail.containers.map((container: any) => (
                <div
                  key={container.id}
                  className="p-2 bg-gray-50 rounded text-xs space-y-1"
                >
                  <div className="font-medium truncate">{container.name}</div>
                  <div className="font-mono text-muted-foreground">
                    {container.ipv4Address || container.ipv6Address}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// 容器节点详情组件
function ContainerDetails({ node, isEditing }: { node: any; isEditing: boolean }) {
  const containerId = node.id.replace("container-", "");
  const { data: containerDetail } = trpc.container.getContainer.useQuery({ containerId });

  if (!containerDetail) {
    return <div className="text-sm text-muted-foreground">加载中...</div>;
  }

  const getStatusColor = (status: string) => {
    if (status.includes("running")) return "bg-green-100 text-green-800";
    if (status.includes("exited")) return "bg-gray-100 text-gray-800";
    return "bg-yellow-100 text-yellow-800";
  };

  return (
    <div className="space-y-4">
      {/* 基本信息 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">基本信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>
            <Label className="text-xs text-muted-foreground">名称</Label>
            <div className="font-medium">{node.data.label}</div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">ID</Label>
            <div className="font-mono text-xs truncate">{containerId}</div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">镜像</Label>
            <div className="font-mono text-xs truncate">{node.data.image}</div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">状态</Label>
            <Badge className={`text-xs ${getStatusColor(node.data.status)}`}>
              {node.data.status}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* 端口映射 */}
      {containerDetail.ports && Array.isArray(containerDetail.ports) && containerDetail.ports.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">端口映射</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {containerDetail.ports.map((port: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs"
                >
                  <span className="font-mono">
                    {port.PublicPort || "-"}:{port.PrivatePort}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {port.Type}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 环境变量 */}
      {containerDetail.env && containerDetail.env.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">环境变量</CardTitle>
            <CardDescription className="text-xs">
              {containerDetail.env.length} 个变量
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48">
              <div className="space-y-1">
                {containerDetail.env.map((envVar: string, index: number) => {
                  const [key, ...valueParts] = envVar.split("=");
                  const value = valueParts.join("=");
                  return (
                    <div
                      key={index}
                      className="p-2 bg-gray-50 rounded text-xs space-y-1"
                    >
                      <div className="font-medium">{key}</div>
                      <div className="font-mono text-muted-foreground truncate">
                        {value}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}


    </div>
  );
}

// 容器操作按钮组
function ContainerActions({ containerId }: { containerId: string }) {
  const utils = trpc.useUtils();

  const startMutation = trpc.container.startContainer.useMutation({
    onSuccess: () => {
      alert("容器已启动");
      utils.container.listContainers.invalidate();
    },
  });

  const stopMutation = trpc.container.stopContainer.useMutation({
    onSuccess: () => {
      alert("容器已停止");
      utils.container.listContainers.invalidate();
    },
  });

  const restartMutation = trpc.container.restartContainer.useMutation({
    onSuccess: () => {
      alert("容器已重启");
      utils.container.listContainers.invalidate();
    },
  });

  return (
    <div className="grid grid-cols-3 gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => startMutation.mutate({ containerId })}
        disabled={startMutation.isPending}
      >
        <Play className="w-3 h-3 mr-1" />
        启动
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => stopMutation.mutate({ containerId })}
        disabled={stopMutation.isPending}
      >
        <Square className="w-3 h-3 mr-1" />
        停止
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => restartMutation.mutate({ containerId })}
        disabled={restartMutation.isPending}
      >
        <RotateCw className="w-3 h-3 mr-1" />
        重启
      </Button>
    </div>
  );
}
