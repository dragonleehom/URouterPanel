/**
 * 容器资源使用图表组件
 * 显示容器的CPU、内存、网络使用情况
 */

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";

interface ContainerStat {
  containerId: string;
  containerName: string;
  cpu: {
    percent: string;
    usage: number;
  };
  memory: {
    usage: number;
    limit: number;
    percent: string;
  };
  network: {
    rxBytes: number;
    txBytes: number;
  };
  timestamp: string;
}

export function ContainerResourceChart() {
  const [stats, setStats] = useState<ContainerStat[]>([]);
  
  // 获取所有容器的资源使用情况
  const { data, isLoading, error, refetch } = trpc.containerMonitor.getAllStats.useQuery(
    undefined,
    {
      refetchInterval: 5000, // 每5秒刷新一次
    }
  );

  useEffect(() => {
    if (data) {
      setStats(data as any);
    }
  }, [data]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>容器资源监控</CardTitle>
          <CardDescription>实时监控容器资源使用情况</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">加载中...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>容器资源监控</CardTitle>
          <CardDescription>实时监控容器资源使用情况</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-destructive">
            加载失败: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats || stats.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>容器资源监控</CardTitle>
          <CardDescription>实时监控容器资源使用情况</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            没有运行中的容器
          </div>
        </CardContent>
      </Card>
    );
  }

  // 格式化字节数
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>容器资源监控</CardTitle>
        <CardDescription>
          实时监控容器资源使用情况 (每5秒更新)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stats.map((stat) => (
            <div
              key={stat.containerId}
              className="border rounded-lg p-4 space-y-3"
            >
              {/* 容器名称 */}
              <div className="font-semibold text-lg">{stat.containerName}</div>

              {/* CPU使用率 */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">CPU使用率</span>
                  <span className="font-medium">{stat.cpu.percent}%</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(parseFloat(stat.cpu.percent), 100)}%` }}
                  />
                </div>
              </div>

              {/* 内存使用 */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">内存使用</span>
                  <span className="font-medium">
                    {formatBytes(stat.memory.usage)} / {formatBytes(stat.memory.limit)} ({stat.memory.percent}%)
                  </span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(parseFloat(stat.memory.percent), 100)}%` }}
                  />
                </div>
              </div>

              {/* 网络流量 */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">接收</div>
                  <div className="font-medium text-green-600">
                    ↓ {formatBytes(stat.network.rxBytes)}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">发送</div>
                  <div className="font-medium text-blue-600">
                    ↑ {formatBytes(stat.network.txBytes)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
