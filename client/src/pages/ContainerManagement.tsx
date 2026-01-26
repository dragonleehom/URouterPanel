/**
 * 容器管理页面
 * 管理Docker容器、镜像、网络和卷
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Box,
  Image,
  Play,
  Square,
  RotateCw,
  Trash2,
  Plus,
  Settings,
  Activity,
  HardDrive,
  Network,
  Download,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// 模拟数据
const containerResourceData = [
  { name: "nginx", cpu: 12, memory: 256 },
  { name: "mysql", cpu: 35, memory: 1024 },
  { name: "redis", cpu: 8, memory: 128 },
  { name: "node-app", cpu: 22, memory: 512 },
  { name: "python-api", cpu: 18, memory: 384 },
];

const imageStorageData = [
  { name: "使用中", value: 12.5, color: "hsl(var(--chart-1))" },
  { name: "未使用", value: 8.3, color: "hsl(var(--chart-2))" },
  { name: "空闲", value: 29.2, color: "hsl(var(--muted))" },
];

export default function ContainerManagement() {
  const handleAction = (action: string) => {
    toast.info(`功能开发中: ${action}`);
  };

  return (
    <div className="space-y-6">
      {/* 页面标题和操作 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium">容器管理</h1>
          <p className="text-sm text-muted-foreground mt-1">
            管理Docker容器、镜像、网络和卷
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleAction("拉取镜像")}
          >
            <Download className="w-4 h-4 mr-2" />
            拉取镜像
          </Button>
          <Button onClick={() => handleAction("创建容器")}>
            <Plus className="w-4 h-4 mr-2" />
            创建容器
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              运行中容器
            </CardTitle>
            <Box className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-medium">12</div>
            <p className="text-xs text-muted-foreground mt-1">总计 15 个</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              镜像数量
            </CardTitle>
            <Image className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-medium">28</div>
            <p className="text-xs text-muted-foreground mt-1">占用 20.8 GB</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              网络数量
            </CardTitle>
            <Network className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-medium">5</div>
            <p className="text-xs text-muted-foreground mt-1">3 个自定义</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              卷数量
            </CardTitle>
            <HardDrive className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-medium">18</div>
            <p className="text-xs text-muted-foreground mt-1">占用 45.2 GB</p>
          </CardContent>
        </Card>
      </div>

      {/* 标签页 */}
      <Tabs defaultValue="containers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="containers">
            <Box className="w-4 h-4 mr-2" />
            容器列表
          </TabsTrigger>
          <TabsTrigger value="images">
            <Image className="w-4 h-4 mr-2" />
            镜像管理
          </TabsTrigger>
          <TabsTrigger value="stats">
            <Activity className="w-4 h-4 mr-2" />
            资源统计
          </TabsTrigger>
        </TabsList>

        {/* 容器列表 */}
        <TabsContent value="containers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>运行中的容器</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full table-zebra">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        容器名称
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        镜像
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        状态
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        端口映射
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        CPU
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        内存
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        运行时间
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      {
                        name: "nginx-web",
                        image: "nginx:latest",
                        status: "running",
                        ports: "80:80, 443:443",
                        cpu: "12%",
                        memory: "256 MB",
                        uptime: "5天",
                      },
                      {
                        name: "mysql-db",
                        image: "mysql:8.0",
                        status: "running",
                        ports: "3306:3306",
                        cpu: "35%",
                        memory: "1.0 GB",
                        uptime: "12天",
                      },
                      {
                        name: "redis-cache",
                        image: "redis:alpine",
                        status: "running",
                        ports: "6379:6379",
                        cpu: "8%",
                        memory: "128 MB",
                        uptime: "8天",
                      },
                      {
                        name: "node-app",
                        image: "node:18-alpine",
                        status: "running",
                        ports: "3000:3000",
                        cpu: "22%",
                        memory: "512 MB",
                        uptime: "3天",
                      },
                      {
                        name: "python-api",
                        image: "python:3.11-slim",
                        status: "running",
                        ports: "8000:8000",
                        cpu: "18%",
                        memory: "384 MB",
                        uptime: "6天",
                      },
                    ].map((container) => (
                      <tr key={container.name}>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="status-indicator running"></span>
                            <code className="text-sm font-mono">
                              {container.name}
                            </code>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <code className="text-xs font-mono text-muted-foreground">
                            {container.image}
                          </code>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="default">运行中</Badge>
                        </td>
                        <td className="py-3 px-4">
                          <code className="text-xs font-mono">
                            {container.ports}
                          </code>
                        </td>
                        <td className="py-3 px-4 text-sm font-mono">
                          {container.cpu}
                        </td>
                        <td className="py-3 px-4 text-sm font-mono">
                          {container.memory}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {container.uptime}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleAction(`重启${container.name}`)
                              }
                            >
                              <RotateCw className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleAction(`停止${container.name}`)
                              }
                            >
                              <Square className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleAction(`配置${container.name}`)
                              }
                            >
                              <Settings className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>已停止的容器</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full table-zebra">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        容器名称
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        镜像
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        状态
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        退出时间
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      {
                        name: "test-container",
                        image: "ubuntu:22.04",
                        status: "exited",
                        exitTime: "2小时前",
                      },
                      {
                        name: "old-nginx",
                        image: "nginx:1.20",
                        status: "exited",
                        exitTime: "1天前",
                      },
                      {
                        name: "backup-job",
                        image: "alpine:latest",
                        status: "exited",
                        exitTime: "3天前",
                      },
                    ].map((container) => (
                      <tr key={container.name}>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="status-indicator stopped"></span>
                            <code className="text-sm font-mono">
                              {container.name}
                            </code>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <code className="text-xs font-mono text-muted-foreground">
                            {container.image}
                          </code>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="secondary">已停止</Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {container.exitTime}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleAction(`启动${container.name}`)
                              }
                            >
                              <Play className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleAction(`删除${container.name}`)
                              }
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 镜像管理 */}
        <TabsContent value="images" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>本地镜像</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAction("清理未使用镜像")}
                >
                  清理未使用
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleAction("拉取镜像")}
                >
                  <Download className="w-4 h-4 mr-2" />
                  拉取镜像
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full table-zebra">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        镜像名称
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        标签
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        镜像ID
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        大小
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        创建时间
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        使用中
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      {
                        name: "nginx",
                        tag: "latest",
                        id: "a1b2c3d4e5f6",
                        size: "142 MB",
                        created: "2周前",
                        inUse: true,
                      },
                      {
                        name: "mysql",
                        tag: "8.0",
                        id: "b2c3d4e5f6a1",
                        size: "538 MB",
                        created: "1个月前",
                        inUse: true,
                      },
                      {
                        name: "redis",
                        tag: "alpine",
                        id: "c3d4e5f6a1b2",
                        size: "32 MB",
                        created: "3周前",
                        inUse: true,
                      },
                      {
                        name: "node",
                        tag: "18-alpine",
                        id: "d4e5f6a1b2c3",
                        size: "178 MB",
                        created: "1周前",
                        inUse: true,
                      },
                      {
                        name: "python",
                        tag: "3.11-slim",
                        id: "e5f6a1b2c3d4",
                        size: "125 MB",
                        created: "2周前",
                        inUse: true,
                      },
                      {
                        name: "ubuntu",
                        tag: "22.04",
                        id: "f6a1b2c3d4e5",
                        size: "77 MB",
                        created: "1个月前",
                        inUse: false,
                      },
                      {
                        name: "alpine",
                        tag: "latest",
                        id: "a1b2c3d4e5f7",
                        size: "7 MB",
                        created: "3周前",
                        inUse: false,
                      },
                    ].map((image) => (
                      <tr key={image.id}>
                        <td className="py-3 px-4">
                          <code className="text-sm font-mono">{image.name}</code>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline">{image.tag}</Badge>
                        </td>
                        <td className="py-3 px-4">
                          <code className="text-xs font-mono text-muted-foreground">
                            {image.id}
                          </code>
                        </td>
                        <td className="py-3 px-4 text-sm">{image.size}</td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {image.created}
                        </td>
                        <td className="py-3 px-4">
                          {image.inUse ? (
                            <Badge variant="default">使用中</Badge>
                          ) : (
                            <Badge variant="secondary">未使用</Badge>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleAction(`推送${image.name}`)
                              }
                            >
                              <Upload className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleAction(`删除${image.name}`)
                              }
                              disabled={image.inUse}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 资源统计 */}
        <TabsContent value="stats" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 容器资源使用 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  容器资源使用
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={containerResourceData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      dataKey="name"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar
                      dataKey="cpu"
                      fill="hsl(var(--chart-1))"
                      name="CPU (%)"
                    />
                    <Bar
                      dataKey="memory"
                      fill="hsl(var(--chart-2))"
                      name="内存 (MB)"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* 镜像存储占用 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="w-5 h-5" />
                  镜像存储占用
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={imageStorageData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value} GB`}
                      outerRadius={100}
                      fill="hsl(var(--primary))"
                      dataKey="value"
                    >
                      {imageStorageData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">总存储</span>
                    <span className="font-medium">50 GB</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">已使用</span>
                    <span className="font-medium">20.8 GB (41.6%)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 容器详细统计 */}
          <Card>
            <CardHeader>
              <CardTitle>容器详细统计</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full table-zebra">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        容器名称
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        CPU使用率
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        内存使用
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        网络I/O
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        磁盘I/O
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        进程数
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      {
                        name: "nginx-web",
                        cpu: "12.5%",
                        memory: "256 MB / 512 MB",
                        network: "↑ 125 KB/s ↓ 80 KB/s",
                        disk: "↑ 10 KB/s ↓ 5 KB/s",
                        processes: 4,
                      },
                      {
                        name: "mysql-db",
                        cpu: "35.2%",
                        memory: "1.0 GB / 2.0 GB",
                        network: "↑ 45 KB/s ↓ 30 KB/s",
                        disk: "↑ 500 KB/s ↓ 200 KB/s",
                        processes: 12,
                      },
                      {
                        name: "redis-cache",
                        cpu: "8.1%",
                        memory: "128 MB / 256 MB",
                        network: "↑ 20 KB/s ↓ 15 KB/s",
                        disk: "↑ 5 KB/s ↓ 2 KB/s",
                        processes: 2,
                      },
                      {
                        name: "node-app",
                        cpu: "22.3%",
                        memory: "512 MB / 1.0 GB",
                        network: "↑ 80 KB/s ↓ 50 KB/s",
                        disk: "↑ 15 KB/s ↓ 8 KB/s",
                        processes: 6,
                      },
                      {
                        name: "python-api",
                        cpu: "18.7%",
                        memory: "384 MB / 768 MB",
                        network: "↑ 60 KB/s ↓ 40 KB/s",
                        disk: "↑ 12 KB/s ↓ 6 KB/s",
                        processes: 8,
                      },
                    ].map((stat) => (
                      <tr key={stat.name}>
                        <td className="py-3 px-4">
                          <code className="text-sm font-mono">{stat.name}</code>
                        </td>
                        <td className="py-3 px-4 text-sm font-mono">
                          {stat.cpu}
                        </td>
                        <td className="py-3 px-4 text-sm font-mono">
                          {stat.memory}
                        </td>
                        <td className="py-3 px-4 text-sm font-mono">
                          {stat.network}
                        </td>
                        <td className="py-3 px-4 text-sm font-mono">
                          {stat.disk}
                        </td>
                        <td className="py-3 px-4 text-sm">{stat.processes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
