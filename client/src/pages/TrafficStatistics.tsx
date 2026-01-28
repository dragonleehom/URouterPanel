/**
 * 流量统计管理页面
 * 实时和历史流量监控,按设备/接口分组统计
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Activity, ArrowDown, ArrowUp, BarChart3, Download, HardDrive, Monitor, RefreshCw, Wifi } from "lucide-react";
import { toast } from "sonner";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface DeviceTraffic {
  id: string;
  name: string;
  ip: string;
  mac: string;
  upload: number;
  download: number;
  total: number;
  percentage: number;
}

interface InterfaceTraffic {
  name: string;
  upload: number;
  download: number;
  total: number;
  speed: {
    upload: number;
    download: number;
  };
}

export default function TrafficStatistics() {
  const [timeRange, setTimeRange] = useState("24h");
  const [refreshInterval, setRefreshInterval] = useState("5s");

  // 实时流量数据(最近20个数据点)
  const realtimeData = Array.from({ length: 20 }, (_, i) => ({
    time: `${i * 5}s`,
    upload: Math.floor(Math.random() * 50) + 20,
    download: Math.floor(Math.random() * 80) + 40,
  }));

  // 历史流量数据(24小时)
  const historicalData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    upload: Math.floor(Math.random() * 2000) + 500,
    download: Math.floor(Math.random() * 5000) + 1000,
  }));

  // 按设备统计
  const deviceTraffic: DeviceTraffic[] = [
    {
      id: "1",
      name: "Desktop PC",
      ip: "192.168.1.100",
      mac: "00:11:22:33:44:55",
      upload: 1250,
      download: 8500,
      total: 9750,
      percentage: 45,
    },
    {
      id: "2",
      name: "Laptop",
      ip: "192.168.1.101",
      mac: "AA:BB:CC:DD:EE:FF",
      upload: 850,
      download: 4200,
      total: 5050,
      percentage: 23,
    },
    {
      id: "3",
      name: "iPhone",
      ip: "192.168.1.102",
      mac: "11:22:33:44:55:66",
      upload: 320,
      download: 2800,
      total: 3120,
      percentage: 14,
    },
    {
      id: "4",
      name: "Smart TV",
      ip: "192.168.1.103",
      mac: "77:88:99:AA:BB:CC",
      upload: 180,
      download: 3500,
      total: 3680,
      percentage: 17,
    },
  ];

  // 按接口统计
  const interfaceTraffic: InterfaceTraffic[] = [
    {
      name: "WAN",
      upload: 2600,
      download: 19000,
      total: 21600,
      speed: { upload: 45, download: 125 },
    },
    {
      name: "LAN",
      upload: 2600,
      download: 19000,
      total: 21600,
      speed: { upload: 45, download: 125 },
    },
    {
      name: "WiFi 2.4GHz",
      upload: 1200,
      download: 8500,
      total: 9700,
      speed: { upload: 22, download: 68 },
    },
    {
      name: "WiFi 5GHz",
      upload: 1400,
      download: 10500,
      total: 11900,
      speed: { upload: 23, download: 57 },
    },
  ];

  // 饼图数据
  const pieData = deviceTraffic.map((device) => ({
    name: device.name,
    value: device.total,
    percentage: device.percentage,
  }));

  const COLORS = ["#0066ff", "#00c49f", "#ffbb28", "#ff8042"];

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
  };

  const handleExportData = () => {
    toast.success("正在导出流量统计数据...");
  };

  const handleRefresh = () => {
    toast.success("正在刷新流量数据...");
  };

  return (
    <div className="p-6 space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">流量统计</h1>
            <p className="text-sm text-gray-600 mt-1">
              实时和历史流量监控,按设备/接口分组统计
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">最近1小时</SelectItem>
                <SelectItem value="24h">最近24小时</SelectItem>
                <SelectItem value="7d">最近7天</SelectItem>
                <SelectItem value="30d">最近30天</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="w-4 h-4 mr-2" />
              刷新
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportData}>
              <Download className="w-4 h-4 mr-2" />
              导出
            </Button>
          </div>
        </div>

        {/* 总览卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">总上传</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">2.6 GB</div>
                  <div className="text-xs text-gray-500 mt-1">
                    <ArrowUp className="w-3 h-3 inline mr-1" />
                    45 MB/s
                  </div>
                </div>
                <Activity className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">总下载</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">19.0 GB</div>
                  <div className="text-xs text-gray-500 mt-1">
                    <ArrowDown className="w-3 h-3 inline mr-1" />
                    125 MB/s
                  </div>
                </div>
                <Activity className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">总流量</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">21.6 GB</div>
                  <div className="text-xs text-gray-500 mt-1">
                    最近24小时
                  </div>
                </div>
                <BarChart3 className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">活跃设备</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">12</div>
                  <div className="text-xs text-gray-500 mt-1">
                    在线设备数
                  </div>
                </div>
                <Monitor className="w-8 h-8 text-amber-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 标签页内容 */}
        <Tabs defaultValue="realtime" className="space-y-4">
          <TabsList>
            <TabsTrigger value="realtime">实时流量</TabsTrigger>
            <TabsTrigger value="historical">历史统计</TabsTrigger>
            <TabsTrigger value="devices">按设备统计</TabsTrigger>
            <TabsTrigger value="interfaces">按接口统计</TabsTrigger>
          </TabsList>

          {/* 实时流量 */}
          <TabsContent value="realtime" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>实时流量监控</CardTitle>
                    <CardDescription>最近100秒的上传/下载速率</CardDescription>
                  </div>
                  <Select value={refreshInterval} onValueChange={setRefreshInterval}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1s">每1秒</SelectItem>
                      <SelectItem value="5s">每5秒</SelectItem>
                      <SelectItem value="10s">每10秒</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={realtimeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis label={{ value: "MB/s", angle: -90, position: "insideLeft" }} />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="upload"
                      stackId="1"
                      stroke="#0066ff"
                      fill="#0066ff"
                      fillOpacity={0.6}
                      name="上传"
                    />
                    <Area
                      type="monotone"
                      dataKey="download"
                      stackId="1"
                      stroke="#00c49f"
                      fill="#00c49f"
                      fillOpacity={0.6}
                      name="下载"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 历史统计 */}
          <TabsContent value="historical" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>历史流量统计</CardTitle>
                <CardDescription>最近24小时的流量使用情况</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis label={{ value: "MB", angle: -90, position: "insideLeft" }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="upload" fill="#0066ff" name="上传" />
                    <Bar dataKey="download" fill="#00c49f" name="下载" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 按设备统计 */}
          <TabsContent value="devices" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>设备流量占比</CardTitle>
                  <CardDescription>各设备流量使用比例</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name} (${entry.percentage}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatBytes(value * 1024 * 1024)} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>设备详细统计</CardTitle>
                  <CardDescription>各设备上传/下载流量明细</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {deviceTraffic.map((device) => (
                      <div
                        key={device.id}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Monitor className="w-8 h-8 text-blue-600" />
                          <div>
                            <div className="font-medium">{device.name}</div>
                            <div className="text-xs text-gray-600">
                              {device.ip} • {device.mac}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatBytes(device.total * 1024 * 1024)}</div>
                          <div className="text-xs text-gray-600">
                            ↑ {formatBytes(device.upload * 1024 * 1024)} ↓{" "}
                            {formatBytes(device.download * 1024 * 1024)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 按接口统计 */}
          <TabsContent value="interfaces" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {interfaceTraffic.map((iface, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {iface.name.includes("WiFi") ? (
                          <Wifi className="w-5 h-5 text-blue-600" />
                        ) : (
                          <HardDrive className="w-5 h-5 text-blue-600" />
                        )}
                        <CardTitle className="text-base">{iface.name}</CardTitle>
                      </div>
                      <Badge variant="outline">
                        {formatBytes(iface.total * 1024 * 1024)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-gray-500">上传</div>
                        <div className="font-medium">
                          {formatBytes(iface.upload * 1024 * 1024)}
                        </div>
                        <div className="text-xs text-gray-600">
                          <ArrowUp className="w-3 h-3 inline mr-1" />
                          {iface.speed.upload} MB/s
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">下载</div>
                        <div className="font-medium">
                          {formatBytes(iface.download * 1024 * 1024)}
                        </div>
                        <div className="text-xs text-gray-600">
                          <ArrowDown className="w-3 h-3 inline mr-1" />
                          {iface.speed.download} MB/s
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
  );
}
