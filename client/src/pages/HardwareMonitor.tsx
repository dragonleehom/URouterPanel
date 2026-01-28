import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Cpu, MemoryStick, HardDrive, Network, Thermometer, Activity, Server } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useState, useEffect } from "react";

export default function HardwareMonitor() {
  const { data: hardwareInfo, isLoading } = trpc.hardwareMonitor.getAll.useQuery(undefined, {
    refetchInterval: 5000, // 每5秒刷新一次
  });

  const [cpuTempHistory, setCpuTempHistory] = useState<{ time: string; temp: number }[]>([]);

  // 记录CPU温度历史
  useEffect(() => {
    if (hardwareInfo?.cpu.temperature) {
      const now = new Date();
      const timeStr = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
      setCpuTempHistory(prev => {
        const newHistory = [...prev, { time: timeStr, temp: hardwareInfo.cpu.temperature! }];
        // 只保留最近60个数据点(5分钟)
        return newHistory.slice(-60);
      });
    }
  }, [hardwareInfo?.cpu.temperature]);

  if (isLoading) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">硬件监控</h1>
        <div className="text-muted-foreground">加载硬件信息...</div>
      </div>
    );
  }

  if (!hardwareInfo) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">硬件监控</h1>
        <div className="text-destructive">无法获取硬件信息</div>
      </div>
    );
  }

  const { cpu, memory, disks, networkInterfaces, gpus, motherboard } = hardwareInfo;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">硬件监控</h1>

      {/* CPU信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="w-5 h-5" />
            CPU信息
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">型号</div>
              <div className="font-medium">{cpu.model}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">架构</div>
              <div className="font-medium">{cpu.architecture}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">核心/线程</div>
              <div className="font-medium">{cpu.cores} 核心 / {cpu.threads} 线程</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">频率</div>
              <div className="font-medium">{cpu.frequency}</div>
            </div>
          </div>

          {cpu.temperature && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Thermometer className="w-4 h-4" />
                <span className="text-sm font-medium">温度: {cpu.temperature.toFixed(1)}°C</span>
                <Badge variant={cpu.temperature > 80 ? "destructive" : cpu.temperature > 60 ? "secondary" : "default"}>
                  {cpu.temperature > 80 ? "过热" : cpu.temperature > 60 ? "偏高" : "正常"}
                </Badge>
              </div>

              {cpuTempHistory.length > 1 && (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={cpuTempHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="temp" stroke="#8884d8" name="温度(°C)" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 内存信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MemoryStick className="w-5 h-5" />
            内存信息
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">总容量</div>
              <div className="font-medium">{(memory.total / 1024 / 1024).toFixed(2)} GB</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">已使用</div>
              <div className="font-medium">{(memory.used / 1024 / 1024).toFixed(2)} GB</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">类型</div>
              <div className="font-medium">{memory.type}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">频率</div>
              <div className="font-medium">{memory.speed}</div>
            </div>
          </div>

          {memory.slots.length > 0 && (
            <div>
              <div className="text-sm font-medium mb-2">内存插槽</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {memory.slots.map((slot, index) => (
                  <div key={index} className="border rounded p-2 text-sm">
                    <div className="font-medium">{slot.slot}</div>
                    <div className="text-muted-foreground">{slot.size} - {slot.type} {slot.speed}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 磁盘信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="w-5 h-5" />
            磁盘信息
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {disks.map((disk, index) => (
              <div key={index} className="border rounded p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">{disk.device}</div>
                  <Badge variant={disk.health === "Good" ? "default" : disk.health === "Warning" ? "secondary" : "outline"}>
                    {disk.health === "Good" ? "健康" : disk.health === "Warning" ? "警告" : "未知"}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <div>
                    <div className="text-muted-foreground">型号</div>
                    <div>{disk.model}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">容量</div>
                    <div>{disk.size}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">类型</div>
                    <div>{disk.type}</div>
                  </div>
                  {disk.temperature && (
                    <div>
                      <div className="text-muted-foreground">温度</div>
                      <div>{disk.temperature}°C</div>
                    </div>
                  )}
                </div>
                {disk.smart && (
                  <div className="mt-2 pt-2 border-t text-xs text-muted-foreground grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div>开机时间: {disk.smart.powerOnHours}h</div>
                    <div>开机次数: {disk.smart.powerCycleCount}</div>
                    <div>重映射扇区: {disk.smart.reallocatedSectors}</div>
                    <div>待处理扇区: {disk.smart.pendingSectors}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 网络接口信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="w-5 h-5" />
            网络接口
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {networkInterfaces.map((iface, index) => (
              <div key={index} className="border rounded p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">{iface.name}</div>
                  <Badge variant={iface.state === "up" ? "default" : "secondary"}>
                    {iface.state === "up" ? "已连接" : "未连接"}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                  <div>
                    <div className="text-muted-foreground">MAC地址</div>
                    <div className="font-mono">{iface.mac}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">速率/双工</div>
                    <div>{iface.speed} / {iface.duplex}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">IP地址</div>
                    <div>
                      {iface.ipv4.length > 0 && <div className="font-mono">{iface.ipv4[0]}</div>}
                      {iface.ipv6.length > 0 && <div className="font-mono text-xs">{iface.ipv6[0]}</div>}
                      {iface.ipv4.length === 0 && iface.ipv6.length === 0 && <div className="text-muted-foreground">无</div>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* GPU信息 */}
      {gpus.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="w-5 h-5" />
              GPU信息
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {gpus.map((gpu, index) => (
                <div key={index} className="border rounded p-3">
                  <div className="font-medium mb-2">{gpu.vendor} {gpu.model}</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <div>
                      <div className="text-muted-foreground">驱动版本</div>
                      <div>{gpu.driver}</div>
                    </div>
                    {gpu.temperature && (
                      <div>
                        <div className="text-muted-foreground">温度</div>
                        <div>{gpu.temperature}°C</div>
                      </div>
                    )}
                    {gpu.utilization !== null && (
                      <div>
                        <div className="text-muted-foreground">使用率</div>
                        <div>{gpu.utilization}%</div>
                      </div>
                    )}
                    {gpu.memory && (
                      <div>
                        <div className="text-muted-foreground">显存</div>
                        <div>{gpu.memory.used} / {gpu.memory.total} MB</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 主板信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            主板信息
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">制造商</div>
              <div className="font-medium">{motherboard.manufacturer}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">型号</div>
              <div className="font-medium">{motherboard.product}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">版本</div>
              <div className="font-medium">{motherboard.version}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">BIOS厂商</div>
              <div className="font-medium">{motherboard.biosVendor}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">BIOS版本</div>
              <div className="font-medium">{motherboard.biosVersion}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">BIOS日期</div>
              <div className="font-medium">{motherboard.biosDate}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
