import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Activity,
  Route,
  Shield,
  Search,
  Play,
  StopCircle,
  Download,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";

interface PingResult {
  seq: number;
  time: number;
  ttl: number;
  status: "success" | "timeout";
}

interface TracerouteHop {
  hop: number;
  ip: string;
  hostname: string;
  time1: number;
  time2: number;
  time3: number;
}

interface PortScanResult {
  port: number;
  protocol: string;
  status: "open" | "closed" | "filtered";
  service: string;
}

export default function NetworkDiagnostics() {
  // Ping工具状态
  const [pingTarget, setPingTarget] = useState("");
  const [pingCount, setPingCount] = useState("4");
  const [pingRunning, setPingRunning] = useState(false);
  const [pingResults, setPingResults] = useState<PingResult[]>([]);
  const [pingStats, setPingStats] = useState({
    sent: 0,
    received: 0,
    lost: 0,
    min: 0,
    max: 0,
    avg: 0,
  });

  // Traceroute工具状态
  const [traceTarget, setTraceTarget] = useState("");
  const [traceMaxHops, setTraceMaxHops] = useState("30");
  const [traceRunning, setTraceRunning] = useState(false);
  const [traceResults, setTraceResults] = useState<TracerouteHop[]>([]);

  // 端口扫描工具状态
  const [scanTarget, setScanTarget] = useState("");
  const [scanPorts, setScanPorts] = useState("80,443,22,21,25,3306,3389,8080");
  const [scanRunning, setScanRunning] = useState(false);
  const [scanResults, setScanResults] = useState<PortScanResult[]>([]);

  // DNS查询工具状态
  const [dnsQuery, setDnsQuery] = useState("");
  const [dnsType, setDnsType] = useState("A");
  const [dnsResults, setDnsResults] = useState<string[]>([]);

  // tRPC mutations
  const pingMutation = trpc.diagnostics.ping.useMutation();

  // Ping工具函数
  const handlePing = async () => {
    if (!pingTarget) {
      toast.error("请输入目标主机");
      return;
    }

    setPingRunning(true);
    setPingResults([]);
    
    try {
      const result = await pingMutation.mutateAsync({
        target: pingTarget,
        count: parseInt(pingCount),
      });

      setPingResults(result.results);
      setPingStats(result.stats);
      toast.success("Ping测试完成");
    } catch (error: any) {
      toast.error(`Ping失败: ${error.message}`);
    } finally {
      setPingRunning(false);
    }
  };

  const handleStopPing = () => {
    setPingRunning(false);
    toast.info("Ping测试已停止");
  };

  const tracerouteMutation = trpc.diagnostics.traceroute.useMutation();

  // Traceroute工具函数
  const handleTraceroute = async () => {
    if (!traceTarget) {
      toast.error("请输入目标主机");
      return;
    }

    setTraceRunning(true);
    setTraceResults([]);

    try {
      const results = await tracerouteMutation.mutateAsync({
        target: traceTarget,
        maxHops: parseInt(traceMaxHops),
      });

      setTraceResults(results);
      toast.success("Traceroute完成");
    } catch (error: any) {
      toast.error(`Traceroute失败: ${error.message}`);
    } finally {
      setTraceRunning(false);
    }
  };

  const handleStopTraceroute = () => {
    setTraceRunning(false);
    toast.info("Traceroute已停止");
  };

  const portScanMutation = trpc.diagnostics.portScan.useMutation();

  // 端口扫描工具函数
  const handlePortScan = async () => {
    if (!scanTarget) {
      toast.error("请输入目标主机");
      return;
    }

    setScanRunning(true);
    setScanResults([]);

    try {
      // 解析端口列表
      const ports = scanPorts.split(",").map((p) => parseInt(p.trim()));
      
      const results = await portScanMutation.mutateAsync({
        target: scanTarget,
        ports,
      });

      setScanResults(results);
      toast.success("端口扫描完成");
    } catch (error: any) {
      toast.error(`端口扫描失败: ${error.message}`);
    } finally {
      setScanRunning(false);
    }
  };

  const handleStopPortScan = () => {
    setScanRunning(false);
    toast.info("端口扫描已停止");
  };

  const dnsQueryMutation = trpc.diagnostics.dnsQuery.useMutation();
  const nslookupMutation = trpc.diagnostics.nslookup.useMutation();

  // DNS查询工具函数
  const handleDNSQuery = async () => {
    if (!dnsQuery) {
      toast.error("请输入域名");
      return;
    }

    try {
      const results = await nslookupMutation.mutateAsync({
        domain: dnsQuery,
      });

      setDnsResults(results);
      toast.success("DNS查询完成");
    } catch (error: any) {
      toast.error(`DNS查询失败: ${error.message}`);
    }
  };

  const exportResults = (type: string, data: any) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${type}-results-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("结果已导出");
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">网络诊断工具</h1>
          <p className="text-sm text-gray-500 mt-1">
            使用Ping、Traceroute和端口扫描工具诊断网络问题
          </p>
        </div>
      </div>

      {/* 标签页 */}
      <Tabs defaultValue="ping" className="space-y-4">
        <TabsList>
          <TabsTrigger value="ping">
            <Activity className="w-4 h-4 mr-2" />
            Ping
          </TabsTrigger>
          <TabsTrigger value="traceroute">
            <Route className="w-4 h-4 mr-2" />
            Traceroute
          </TabsTrigger>
          <TabsTrigger value="portscan">
            <Shield className="w-4 h-4 mr-2" />
            端口扫描
          </TabsTrigger>
          <TabsTrigger value="dns">
            <Search className="w-4 h-4 mr-2" />
            DNS查询
          </TabsTrigger>
        </TabsList>

        {/* Ping工具标签页 */}
        <TabsContent value="ping" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ping - ICMP连通性测试</CardTitle>
              <CardDescription>
                测试目标主机的网络连通性和延迟
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="ping-target">目标主机</Label>
                  <Input
                    id="ping-target"
                    value={pingTarget}
                    onChange={(e) => setPingTarget(e.target.value)}
                    placeholder="例如: google.com 或 8.8.8.8"
                    disabled={pingRunning}
                  />
                </div>
                <div>
                  <Label htmlFor="ping-count">发送次数</Label>
                  <Input
                    id="ping-count"
                    type="number"
                    value={pingCount}
                    onChange={(e) => setPingCount(e.target.value)}
                    min="1"
                    max="100"
                    disabled={pingRunning}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                {!pingRunning ? (
                  <Button onClick={handlePing}>
                    <Play className="w-4 h-4 mr-2" />
                    开始Ping
                  </Button>
                ) : (
                  <Button variant="destructive" onClick={handleStopPing}>
                    <StopCircle className="w-4 h-4 mr-2" />
                    停止
                  </Button>
                )}
                {pingResults.length > 0 && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => exportResults("ping", { results: pingResults, stats: pingStats })}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      导出结果
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setPingResults([]);
                        setPingStats({ sent: 0, received: 0, lost: 0, min: 0, max: 0, avg: 0 });
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      清空
                    </Button>
                  </>
                )}
              </div>

              {pingResults.length > 0 && (
                <div className="border border-gray-200 rounded-lg p-4 space-y-4">
                  <div className="font-mono text-sm space-y-1">
                    <p className="text-gray-600">正在Ping {pingTarget}...</p>
                    {pingResults.map((result) => (
                      <div key={result.seq} className="flex items-center gap-2">
                        {result.status === "success" ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span>
                              来自 {pingTarget}: 字节=32 时间={result.time}ms TTL={result.ttl}
                            </span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 text-red-600" />
                            <span className="text-red-600">请求超时</span>
                          </>
                        )}
                      </div>
                    ))}
                  </div>

                  {!pingRunning && (
                    <div className="border-t border-gray-200 pt-4">
                      <p className="font-medium mb-2">统计信息:</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">已发送</p>
                          <p className="font-medium">{pingStats.sent} 个数据包</p>
                        </div>
                        <div>
                          <p className="text-gray-500">已接收</p>
                          <p className="font-medium">{pingStats.received} 个数据包</p>
                        </div>
                        <div>
                          <p className="text-gray-500">丢失</p>
                          <p className="font-medium">
                            {pingStats.lost} 个 ({((pingStats.lost / pingStats.sent) * 100).toFixed(0)}%)
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">最小延迟</p>
                          <p className="font-medium">{pingStats.min.toFixed(2)} ms</p>
                        </div>
                        <div>
                          <p className="text-gray-500">最大延迟</p>
                          <p className="font-medium">{pingStats.max.toFixed(2)} ms</p>
                        </div>
                        <div>
                          <p className="text-gray-500">平均延迟</p>
                          <p className="font-medium">{pingStats.avg.toFixed(2)} ms</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Traceroute工具标签页 */}
        <TabsContent value="traceroute" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Traceroute - 路由跟踪</CardTitle>
              <CardDescription>
                追踪数据包到达目标主机的路由路径
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="trace-target">目标主机</Label>
                  <Input
                    id="trace-target"
                    value={traceTarget}
                    onChange={(e) => setTraceTarget(e.target.value)}
                    placeholder="例如: google.com 或 8.8.8.8"
                    disabled={traceRunning}
                  />
                </div>
                <div>
                  <Label htmlFor="trace-maxhops">最大跳数</Label>
                  <Input
                    id="trace-maxhops"
                    type="number"
                    value={traceMaxHops}
                    onChange={(e) => setTraceMaxHops(e.target.value)}
                    min="1"
                    max="64"
                    disabled={traceRunning}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                {!traceRunning ? (
                  <Button onClick={handleTraceroute}>
                    <Play className="w-4 h-4 mr-2" />
                    开始追踪
                  </Button>
                ) : (
                  <Button variant="destructive" onClick={handleStopTraceroute}>
                    <StopCircle className="w-4 h-4 mr-2" />
                    停止
                  </Button>
                )}
                {traceResults.length > 0 && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => exportResults("traceroute", traceResults)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      导出结果
                    </Button>
                    <Button variant="outline" onClick={() => setTraceResults([])}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      清空
                    </Button>
                  </>
                )}
              </div>

              {traceResults.length > 0 && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium text-gray-700">跳数</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-700">IP地址</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-700">主机名</th>
                        <th className="px-4 py-2 text-right font-medium text-gray-700">时间1</th>
                        <th className="px-4 py-2 text-right font-medium text-gray-700">时间2</th>
                        <th className="px-4 py-2 text-right font-medium text-gray-700">时间3</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {traceResults.map((hop) => (
                        <tr key={hop.hop} className="hover:bg-gray-50">
                          <td className="px-4 py-2 font-mono">{hop.hop}</td>
                          <td className="px-4 py-2 font-mono">{hop.ip}</td>
                          <td className="px-4 py-2 text-gray-600">{hop.hostname}</td>
                          <td className="px-4 py-2 text-right font-mono">{hop.time1} ms</td>
                          <td className="px-4 py-2 text-right font-mono">{hop.time2} ms</td>
                          <td className="px-4 py-2 text-right font-mono">{hop.time3} ms</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 端口扫描工具标签页 */}
        <TabsContent value="portscan" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>端口扫描 - TCP/UDP端口检测</CardTitle>
              <CardDescription>
                扫描目标主机的开放端口和服务
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>注意:</strong> 端口扫描可能被视为攻击行为,请仅在授权的网络环境中使用。
                </p>
              </div>

              <div>
                <Label htmlFor="scan-target">目标主机</Label>
                <Input
                  id="scan-target"
                  value={scanTarget}
                  onChange={(e) => setScanTarget(e.target.value)}
                  placeholder="例如: 192.168.1.1"
                  disabled={scanRunning}
                />
              </div>

              <div>
                <Label htmlFor="scan-ports">端口列表</Label>
                <Input
                  id="scan-ports"
                  value={scanPorts}
                  onChange={(e) => setScanPorts(e.target.value)}
                  placeholder="例如: 80,443,22,21 或 1-1000"
                  disabled={scanRunning}
                />
                <p className="text-xs text-gray-500 mt-1">
                  使用逗号分隔多个端口,或使用连字符表示范围
                </p>
              </div>

              <div className="flex gap-2">
                {!scanRunning ? (
                  <Button onClick={handlePortScan}>
                    <Play className="w-4 h-4 mr-2" />
                    开始扫描
                  </Button>
                ) : (
                  <Button variant="destructive" onClick={handleStopPortScan}>
                    <StopCircle className="w-4 h-4 mr-2" />
                    停止
                  </Button>
                )}
                {scanResults.length > 0 && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => exportResults("portscan", scanResults)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      导出结果
                    </Button>
                    <Button variant="outline" onClick={() => setScanResults([])}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      清空
                    </Button>
                  </>
                )}
              </div>

              {scanResults.length > 0 && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium text-gray-700">端口</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-700">协议</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-700">状态</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-700">服务</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {scanResults.map((result) => (
                        <tr key={result.port} className="hover:bg-gray-50">
                          <td className="px-4 py-2 font-mono">{result.port}</td>
                          <td className="px-4 py-2">{result.protocol}</td>
                          <td className="px-4 py-2">
                            <Badge
                              variant={
                                result.status === "open"
                                  ? "default"
                                  : result.status === "closed"
                                  ? "secondary"
                                  : "outline"
                              }
                            >
                              {result.status === "open" && "开放"}
                              {result.status === "closed" && "关闭"}
                              {result.status === "filtered" && "过滤"}
                            </Badge>
                          </td>
                          <td className="px-4 py-2 text-gray-600">{result.service}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="bg-gray-50 border-t border-gray-200 px-4 py-3 text-sm text-gray-600">
                    扫描完成: 共扫描 {scanResults.length} 个端口,
                    {scanResults.filter((r) => r.status === "open").length} 个开放,
                    {scanResults.filter((r) => r.status === "closed").length} 个关闭,
                    {scanResults.filter((r) => r.status === "filtered").length} 个过滤
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* DNS查询工具标签页 */}
        <TabsContent value="dns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>DNS查询 - 域名解析</CardTitle>
              <CardDescription>
                查询域名的DNS记录
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="dns-query">域名</Label>
                  <Input
                    id="dns-query"
                    value={dnsQuery}
                    onChange={(e) => setDnsQuery(e.target.value)}
                    placeholder="例如: example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="dns-type">记录类型</Label>
                  <select
                    id="dns-type"
                    value={dnsType}
                    onChange={(e) => setDnsType(e.target.value)}
                    className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm"
                  >
                    <option value="A">A (IPv4地址)</option>
                    <option value="AAAA">AAAA (IPv6地址)</option>
                    <option value="CNAME">CNAME (别名)</option>
                    <option value="MX">MX (邮件服务器)</option>
                    <option value="TXT">TXT (文本记录)</option>
                    <option value="NS">NS (域名服务器)</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleDNSQuery}>
                  <Search className="w-4 h-4 mr-2" />
                  查询
                </Button>
                {dnsResults.length > 0 && (
                  <Button variant="outline" onClick={() => setDnsResults([])}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    清空
                  </Button>
                )}
              </div>

              {dnsResults.length > 0 && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <p className="font-medium mb-2">查询结果:</p>
                  <div className="space-y-1 font-mono text-sm">
                    {dnsResults.map((result, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>{result}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
