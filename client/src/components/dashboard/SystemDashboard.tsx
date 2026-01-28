import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import {
  Activity,
  HardDrive,
  MemoryStick,
  Network,
  Container,
  Server,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface SystemStats {
  cpu: {
    usage: number;
    cores: number;
    loadAverage: number[];
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usage: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    usage: number;
  };
  network: {
    interfaces: Array<{
      name: string;
      rxBytes: number;
      txBytes: number;
      rxRate: number;
      txRate: number;
    }>;
  };
  timestamp: number;
}

interface ServiceStatus {
  docker: {
    running: boolean;
    containers: {
      total: number;
      running: number;
      stopped: number;
    };
  };
  vms: {
    total: number;
    running: number;
    stopped: number;
  };
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

function formatBytesPerSecond(bytesPerSecond: number): string {
  return `${formatBytes(bytesPerSecond)}/s`;
}

export function SystemDashboard() {
  const [, navigate] = useLocation();
  const [refreshKey, setRefreshKey] = useState(0);

  // 获取当前系统状态
  const { data: currentStats, isLoading: statsLoading } = trpc.systemMonitor.getStats.useQuery(undefined, {
    refetchInterval: 5000, // 每5秒刷新
  });

  // 获取历史数据(最近5分钟)
  const { data: historyData } = trpc.systemMonitor.getHistory.useQuery(
    { minutes: 5 },
    {
      refetchInterval: 5000,
    }
  );

  // 获取服务状态
  const { data: serviceStatus } = trpc.systemMonitor.getServiceStatus.useQuery(undefined, {
    refetchInterval: 10000, // 每10秒刷新
  });

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  // 准备图表数据
  const chartData = historyData?.map((stat: SystemStats) => ({
    time: new Date(stat.timestamp).toLocaleTimeString(),
    cpu: stat.cpu.usage,
    memory: stat.memory.usage,
    timestamp: stat.timestamp,
  })) || [];

  // 计算总网络速率
  const totalRxRate = currentStats?.network.interfaces.reduce((sum, iface) => sum + iface.rxRate, 0) || 0;
  const totalTxRate = currentStats?.network.interfaces.reduce((sum, iface) => sum + iface.txRate, 0) || 0;

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">加载系统信息...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 标题和刷新按钮 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">系统仪表盘</h1>
          <p className="text-muted-foreground">实时监控系统资源和服务状态</p>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          刷新
        </Button>
      </div>

      {/* 资源使用卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CPU使用率 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">CPU使用率</CardTitle>
            <Activity className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentStats?.cpu.usage.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {currentStats?.cpu.cores} 核心 | 负载: {currentStats?.cpu.loadAverage[0].toFixed(2)}
            </p>
          </CardContent>
        </Card>

        {/* 内存使用 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">内存使用</CardTitle>
            <MemoryStick className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentStats?.memory.usage.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatBytes(currentStats?.memory.used || 0)} / {formatBytes(currentStats?.memory.total || 0)}
            </p>
          </CardContent>
        </Card>

        {/* 磁盘使用 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">磁盘使用</CardTitle>
            <HardDrive className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentStats?.disk.usage.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatBytes(currentStats?.disk.used || 0)} / {formatBytes(currentStats?.disk.total || 0)}
            </p>
          </CardContent>
        </Card>

        {/* 网络流量 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">网络流量</CardTitle>
            <Network className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBytesPerSecond(totalRxRate + totalTxRate)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              ↓ {formatBytesPerSecond(totalRxRate)} ↑ {formatBytesPerSecond(totalTxRate)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 资源趋势图表 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* CPU趋势 */}
        <Card>
          <CardHeader>
            <CardTitle>CPU使用率趋势</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" fontSize={12} />
                <YAxis domain={[0, 100]} fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="cpu" stroke="#8884d8" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 内存趋势 */}
        <Card>
          <CardHeader>
            <CardTitle>内存使用率趋势</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" fontSize={12} />
                <YAxis domain={[0, 100]} fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="memory" stroke="#82ca9d" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 服务状态 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Docker服务 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Docker服务</CardTitle>
            <Container className="w-5 h-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">服务状态</span>
              <span className={`text-sm font-medium ${serviceStatus?.docker.running ? "text-green-600" : "text-red-600"}`}>
                {serviceStatus?.docker.running ? "运行中" : "已停止"}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">总容器数</span>
                <span className="text-sm font-medium">{serviceStatus?.docker.containers.total || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">运行中</span>
                <span className="text-sm font-medium text-green-600">{serviceStatus?.docker.containers.running || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">已停止</span>
                <span className="text-sm font-medium text-gray-600">{serviceStatus?.docker.containers.stopped || 0}</span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => navigate("/container-management")}
            >
              管理容器
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        {/* 虚拟机服务 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>虚拟机服务</CardTitle>
            <Server className="w-5 h-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">总虚拟机数</span>
                <span className="text-sm font-medium">{serviceStatus?.vms.total || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">运行中</span>
                <span className="text-sm font-medium text-green-600">{serviceStatus?.vms.running || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">已停止</span>
                <span className="text-sm font-medium text-gray-600">{serviceStatus?.vms.stopped || 0}</span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => navigate("/vm-management")}
            >
              管理虚拟机
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* 网络接口详情 */}
      <Card>
        <CardHeader>
          <CardTitle>网络接口</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {currentStats?.network.interfaces.map((iface) => (
              <div key={iface.name} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Network className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{iface.name}</p>
                    <p className="text-xs text-muted-foreground">
                      总接收: {formatBytes(iface.rxBytes)} | 总发送: {formatBytes(iface.txBytes)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    ↓ {formatBytesPerSecond(iface.rxRate)}
                  </p>
                  <p className="text-sm font-medium">
                    ↑ {formatBytesPerSecond(iface.txRate)}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-4"
            onClick={() => navigate("/network-interfaces")}
          >
            管理网络接口
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
