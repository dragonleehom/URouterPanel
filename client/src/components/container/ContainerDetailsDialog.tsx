/**
 * 容器详细信息对话框
 * 显示容器配置和实时资源监控
 */

import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface ContainerDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  containerId: string;
  containerName: string;
}

export function ContainerDetailsDialog({
  open,
  onOpenChange,
  containerId,
  containerName,
}: ContainerDetailsDialogProps) {
  const [statsHistory, setStatsHistory] = useState<any[]>([]);

  // 获取容器详细配置
  const { data: details, isLoading: isLoadingDetails } =
    trpc.container.getContainerDetails.useQuery(
      { containerId },
      { enabled: open }
    );

  // 获取容器资源统计
  const { data: stats, isLoading: isLoadingStats } =
    trpc.container.getContainerStats.useQuery(
      { containerId },
      {
        enabled: open,
        refetchInterval: 3000, // 每3秒刷新一次
      }
    );

  // 更新历史数据
  useEffect(() => {
    if (stats) {
      setStatsHistory((prev) => {
        const newHistory = [
          ...prev,
          {
            time: new Date(stats.timestamp).toLocaleTimeString(),
            cpu: stats.cpu.percent,
            memory: stats.memory.percent,
          },
        ];
        // 只保留最近20个数据点
        return newHistory.slice(-20);
      });
    }
  }, [stats]);

  // 清空历史数据when dialog closes
  useEffect(() => {
    if (!open) {
      setStatsHistory([]);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>容器详情: {containerName}</DialogTitle>
          <DialogDescription>
            查看容器配置和实时资源使用情况
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="monitor" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="monitor">资源监控</TabsTrigger>
            <TabsTrigger value="config">配置信息</TabsTrigger>
          </TabsList>

          {/* 资源监控标签页 */}
          <TabsContent value="monitor" className="space-y-4">
            {isLoadingStats ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : stats ? (
              <>
                {/* 当前资源使用 */}
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">
                        CPU使用率
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {stats.cpu.percent}%
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {stats.cpu.cores} 核心
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">
                        内存使用
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {stats.memory.percent}%
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {(stats.memory.usage / 1024 / 1024).toFixed(2)} MB /{" "}
                        {(stats.memory.limit / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* 资源使用趋势图 */}
                {statsHistory.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">
                        资源使用趋势
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={statsHistory}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="time" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="cpu"
                            stroke="#8884d8"
                            name="CPU (%)"
                          />
                          <Line
                            type="monotone"
                            dataKey="memory"
                            stroke="#82ca9d"
                            name="内存 (%)"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

                {/* 网络和磁盘I/O */}
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">
                        网络I/O
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div>
                          <span className="text-xs text-gray-500">接收:</span>
                          <span className="ml-2 font-medium">
                            {(stats.network.rx / 1024 / 1024).toFixed(2)} MB
                          </span>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">发送:</span>
                          <span className="ml-2 font-medium">
                            {(stats.network.tx / 1024 / 1024).toFixed(2)} MB
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">
                        磁盘I/O
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div>
                          <span className="text-xs text-gray-500">读取:</span>
                          <span className="ml-2 font-medium">
                            {(stats.disk.read / 1024 / 1024).toFixed(2)} MB
                          </span>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">写入:</span>
                          <span className="ml-2 font-medium">
                            {(stats.disk.write / 1024 / 1024).toFixed(2)} MB
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : (
              <p className="text-center text-gray-500 py-12">
                无法加载资源统计
              </p>
            )}
          </TabsContent>

          {/* 配置信息标签页 */}
          <TabsContent value="config" className="space-y-4">
            {isLoadingDetails ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : details ? (
              <>
                {/* 基本信息 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">
                      基本信息
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">容器ID:</span>
                        <span className="ml-2 font-mono">
                          {details.id.substring(0, 12)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">镜像:</span>
                        <span className="ml-2">{details.image}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">状态:</span>
                        <Badge className="ml-2">
                          {details.state.running ? "运行中" : "已停止"}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-gray-500">主机名:</span>
                        <span className="ml-2">{details.config.hostname}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 环境变量 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">
                      环境变量
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {details.config.env.length > 0 ? (
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {details.config.env.map((env: string, index: number) => (
                          <div
                            key={index}
                            className="text-xs font-mono bg-gray-50 p-2 rounded"
                          >
                            {env}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">无环境变量</p>
                    )}
                  </CardContent>
                </Card>

                {/* 卷挂载 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">
                      卷挂载
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {details.mounts.length > 0 ? (
                      <div className="space-y-2">
                        {details.mounts.map((mount: any, index: number) => (
                          <div
                            key={index}
                            className="text-xs bg-gray-50 p-2 rounded"
                          >
                            <div className="font-mono">
                              {mount.source} → {mount.destination}
                            </div>
                            <div className="text-gray-500 mt-1">
                              类型: {mount.type} | 模式: {mount.mode}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">无卷挂载</p>
                    )}
                  </CardContent>
                </Card>

                {/* 网络配置 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">
                      网络配置
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-sm">
                      <span className="text-gray-500">IP地址:</span>
                      <span className="ml-2 font-mono">
                        {details.network.ipAddress || "无"}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-500">MAC地址:</span>
                      <span className="ml-2 font-mono">
                        {details.network.macAddress || "无"}
                      </span>
                    </div>
                    {details.network.networks.length > 0 && (
                      <div>
                        <div className="text-sm text-gray-500 mb-2">
                          网络列表:
                        </div>
                        <div className="space-y-1">
                          {details.network.networks.map(
                            (net: any, index: number) => (
                              <div
                                key={index}
                                className="text-xs bg-gray-50 p-2 rounded"
                              >
                                <div className="font-medium">{net.name}</div>
                                <div className="text-gray-500">
                                  IP: {net.ipAddress} | Gateway: {net.gateway}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 端口映射 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">
                      端口映射
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {Object.keys(details.network.ports).length > 0 ? (
                      <div className="space-y-1">
                        {Object.entries(details.network.ports).map(
                          ([port, bindings]: [string, any]) => (
                            <div
                              key={port}
                              className="text-xs bg-gray-50 p-2 rounded"
                            >
                              {port} →{" "}
                              {bindings && bindings.length > 0
                                ? bindings.map((b: any) => b.HostPort).join(", ")
                                : "未绑定"}
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">无端口映射</p>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <p className="text-center text-gray-500 py-12">
                无法加载容器详情
              </p>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
