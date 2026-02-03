/**
 * 网络诊断工具面板
 * 提供Ping、Traceroute、Nslookup等网络诊断功能
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Activity, Route, Globe, Play, Loader2, CheckCircle2, XCircle } from "lucide-react";

export function NetworkDiagnosticsPanel() {
  // Ping工具状态
  const [pingTarget, setPingTarget] = useState("");
  const [pingCount, setPingCount] = useState(4);
  const [pingResult, setPingResult] = useState<any>(null);

  // Traceroute工具状态
  const [tracerouteTarget, setTracerouteTarget] = useState("");
  const [tracerouteMaxHops, setTracerouteMaxHops] = useState(30);
  const [tracerouteResult, setTracerouteResult] = useState<any>(null);

  // Nslookup工具状态
  const [nslookupDomain, setNslookupDomain] = useState("");
  const [nslookupResult, setNslookupResult] = useState<any>(null);

  // Ping mutation
  const pingMutation = trpc.diagnostics.ping.useMutation({
    onSuccess: (result) => {
      setPingResult(result);
      if (result && result.results) {
        toast.success("Ping执行完成");
      }
    },
    onError: (error) => {
      toast.error(`Ping执行失败: ${error.message}`);
    },
  });

  // Traceroute mutation
  const tracerouteMutation = trpc.diagnostics.traceroute.useMutation({
    onSuccess: (result) => {
      setTracerouteResult(result);
      if (result && result.length >= 0) {
        toast.success("Traceroute执行完成");
      }
    },
    onError: (error) => {
      toast.error(`Traceroute执行失败: ${error.message}`);
    },
  });

  // Nslookup mutation
  const nslookupMutation = trpc.diagnostics.nslookup.useMutation({
    onSuccess: (result) => {
      setNslookupResult(result);
      if (result && result.length >= 0) {
        toast.success("Nslookup执行完成");
      }
    },
    onError: (error) => {
      toast.error(`Nslookup执行失败: ${error.message}`);
    },
  });

  const handlePing = () => {
    if (!pingTarget) {
      toast.error("请输入目标地址");
      return;
    }
    setPingResult(null);
    pingMutation.mutate({ target: pingTarget, count: pingCount });
  };

  const handleTraceroute = () => {
    if (!tracerouteTarget) {
      toast.error("请输入目标地址");
      return;
    }
    setTracerouteResult(null);
    tracerouteMutation.mutate({ target: tracerouteTarget, maxHops: tracerouteMaxHops });
  };

  const handleNslookup = () => {
    if (!nslookupDomain) {
      toast.error("请输入域名");
      return;
    }
    setNslookupResult(null);
    nslookupMutation.mutate({ domain: nslookupDomain });
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-medium">网络诊断工具</h2>
        <p className="text-sm text-muted-foreground mt-1">
          使用Ping、Traceroute、Nslookup等工具诊断网络连接问题
        </p>
      </div>

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
          <TabsTrigger value="nslookup">
            <Globe className="w-4 h-4 mr-2" />
            Nslookup
          </TabsTrigger>
        </TabsList>

        {/* Ping工具 */}
        <TabsContent value="ping">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Ping - 网络连通性测试
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="pingTarget">目标地址</Label>
                  <Input
                    id="pingTarget"
                    placeholder="例如: 8.8.8.8 或 google.com"
                    value={pingTarget}
                    onChange={(e) => setPingTarget(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handlePing()}
                  />
                </div>
                <div>
                  <Label htmlFor="pingCount">数据包数量</Label>
                  <Input
                    id="pingCount"
                    type="number"
                    min={1}
                    max={100}
                    value={pingCount}
                    onChange={(e) => setPingCount(parseInt(e.target.value) || 4)}
                  />
                </div>
              </div>

              <Button
                onClick={handlePing}
                disabled={pingMutation.isPending}
              >
                {pingMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    执行中...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    执行Ping
                  </>
                )}
              </Button>

              {/* Ping结果 */}
              {pingResult && (
                <div className="mt-4 p-4 border border-border rounded-md">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="font-medium">Ping完成</span>
                  </div>

                  <div className="space-y-2">
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">发送:</span>
                        <span className="ml-2 font-medium">{pingResult.stats?.sent || 0}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">接收:</span>
                        <span className="ml-2 font-medium">{pingResult.stats?.received || 0}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">丢包率:</span>
                        <span className="ml-2 font-medium">
                          {pingResult.stats ? ((pingResult.stats.lost / pingResult.stats.sent) * 100).toFixed(1) : 0}%
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">平均延迟:</span>
                        <span className="ml-2 font-medium">{pingResult.stats?.avg.toFixed(2) || 0}ms</span>
                      </div>
                    </div>

                    {pingResult.results && pingResult.results.length > 0 && (
                      <div className="mt-3 space-y-1">
                        {pingResult.results.map((r: any, idx: number) => (
                          <div key={idx} className="text-xs font-mono p-2 bg-muted rounded">
                            seq={r.seq} time={r.time.toFixed(2)}ms ttl={r.ttl} status={r.status}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Traceroute工具 */}
        <TabsContent value="traceroute">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Route className="w-5 h-5" />
                Traceroute - 路由路径追踪
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="tracerouteTarget">目标地址</Label>
                  <Input
                    id="tracerouteTarget"
                    placeholder="例如: 8.8.8.8 或 google.com"
                    value={tracerouteTarget}
                    onChange={(e) => setTracerouteTarget(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleTraceroute()}
                  />
                </div>
                <div>
                  <Label htmlFor="tracerouteMaxHops">最大跳数</Label>
                  <Input
                    id="tracerouteMaxHops"
                    type="number"
                    min={1}
                    max={64}
                    value={tracerouteMaxHops}
                    onChange={(e) => setTracerouteMaxHops(parseInt(e.target.value) || 30)}
                  />
                </div>
              </div>

              <Button
                onClick={handleTraceroute}
                disabled={tracerouteMutation.isPending}
              >
                {tracerouteMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    执行中...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    执行Traceroute
                  </>
                )}
              </Button>

              {/* Traceroute结果 */}
              {tracerouteResult && (
                <div className="mt-4 p-4 border border-border rounded-md">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="font-medium">Traceroute完成</span>
                  </div>

                  <div className="space-y-2">
                    {tracerouteResult.length > 0 ? (
                      <div className="space-y-1">
                        {tracerouteResult.map((hop: any, index: number) => (
                          <div
                            key={index}
                            className="flex items-center gap-3 p-2 bg-muted rounded-md text-sm"
                          >
                            <Badge variant="outline">{hop.hop}</Badge>
                            <span className="font-mono flex-1">{hop.ip || "*"}</span>
                            <span className="text-muted-foreground">
                              {hop.time1 > 0 ? `${hop.time1.toFixed(2)}ms` : "-"}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">未找到路由路径</p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Nslookup工具 */}
        <TabsContent value="nslookup">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Nslookup - DNS查询
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="nslookupDomain">域名</Label>
                <Input
                  id="nslookupDomain"
                  placeholder="例如: google.com"
                  value={nslookupDomain}
                  onChange={(e) => setNslookupDomain(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleNslookup()}
                />
              </div>

              <Button
                onClick={handleNslookup}
                disabled={nslookupMutation.isPending}
              >
                {nslookupMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    查询中...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    执行查询
                  </>
                )}
              </Button>

              {/* Nslookup结果 */}
              {nslookupResult && (
                <div className="mt-4 p-4 border border-border rounded-md">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="font-medium">查询成功</span>
                  </div>

                  <div className="space-y-2">
                    {nslookupResult.length > 0 ? (
                      <div className="space-y-1">
                        <Label className="text-sm text-muted-foreground">解析结果:</Label>
                        {nslookupResult.map((addr: string, index: number) => (
                          <div
                            key={index}
                            className="p-2 bg-muted rounded-md font-mono text-sm"
                          >
                            {addr}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">未找到DNS记录</p>
                    )}
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
