import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  RefreshCw,
  Settings,
  TrendingUp,
  XCircle,
} from "lucide-react";

export default function Monitoring() {
  const [refreshing, setRefreshing] = useState(false);

  // 模拟告警数据
  const alerts = [
    {
      id: 1,
      severity: "critical",
      name: "HighCPUUsage",
      instance: "urouteros-node",
      message: "CPU 使用率超过 95%",
      time: "2 分钟前",
      status: "firing",
    },
    {
      id: 2,
      severity: "warning",
      name: "HighMemoryUsage",
      instance: "urouteros-node",
      message: "内存使用率超过 80%",
      time: "5 分钟前",
      status: "firing",
    },
    {
      id: 3,
      severity: "warning",
      name: "HighDiskUsage",
      instance: "urouteros-node",
      message: "磁盘使用率超过 80%",
      time: "10 分钟前",
      status: "resolved",
    },
  ];

  // 统计数据
  const stats = {
    totalAlerts: alerts.length,
    critical: alerts.filter((a) => a.severity === "critical" && a.status === "firing").length,
    warning: alerts.filter((a) => a.severity === "warning" && a.status === "firing").length,
    resolved: alerts.filter((a) => a.status === "resolved").length,
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "destructive";
      case "warning":
        return "default";
      default:
        return "secondary";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <XCircle className="w-4 h-4" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <CheckCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">系统监控</h1>
          <p className="text-sm text-gray-500 mt-1">
            实时监控系统性能和告警状态
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            刷新
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            配置
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              总告警数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{stats.totalAlerts}</div>
            <p className="text-xs text-gray-500 mt-1">
              <TrendingUp className="w-3 h-3 inline mr-1" />
              过去 24 小时
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              严重告警
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-red-600">
              {stats.critical}
            </div>
            <p className="text-xs text-gray-500 mt-1">需要立即处理</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              警告告警
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-yellow-600">
              {stats.warning}
            </div>
            <p className="text-xs text-gray-500 mt-1">需要关注</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              已解决
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-green-600">
              {stats.resolved}
            </div>
            <p className="text-xs text-gray-500 mt-1">过去 24 小时</p>
          </CardContent>
        </Card>
      </div>

      {/* 标签页 */}
      <Tabs defaultValue="dashboards" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboards">
            <Activity className="w-4 h-4 mr-2" />
            监控仪表盘
          </TabsTrigger>
          <TabsTrigger value="alerts">
            <AlertTriangle className="w-4 h-4 mr-2" />
            告警列表
          </TabsTrigger>
        </TabsList>

        {/* 监控仪表盘 */}
        <TabsContent value="dashboards" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Grafana 监控仪表盘</CardTitle>
                <Button variant="outline" size="sm" asChild>
                  <a
                    href="http://localhost:3001"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    在新窗口打开
                  </a>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* 嵌入 Grafana 仪表盘 */}
              <div className="relative w-full" style={{ height: "800px" }}>
                <iframe
                  src="http://localhost:3001/d/urouteros-overview/urouteros-system-overview?orgId=1&refresh=5s&kiosk"
                  className="w-full h-full border-0"
                  title="Grafana Dashboard"
                />
              </div>
            </CardContent>
          </Card>

          {/* 快速访问链接 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">系统概览</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 mb-4">
                  查看系统 CPU、内存、磁盘、网络等核心指标
                </p>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <a
                    href="http://localhost:3001/d/urouteros-overview"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    查看仪表盘
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">容器监控</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 mb-4">
                  监控 Docker 容器的资源使用和运行状态
                </p>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <a
                    href="http://localhost:3001/d/urouteros-containers"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    查看仪表盘
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">网络监控</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 mb-4">
                  监控网络接口流量、错误率和连接状态
                </p>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <a
                    href="http://localhost:3001/d/urouteros-network"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    查看仪表盘
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 告警列表 */}
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>活动告警</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="mt-0.5">
                      {getSeverityIcon(alert.severity)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={getSeverityColor(alert.severity) as any}>
                          {alert.severity}
                        </Badge>
                        <span className="text-sm font-medium text-gray-900">
                          {alert.name}
                        </span>
                        {alert.status === "resolved" && (
                          <Badge variant="secondary">已解决</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        {alert.message}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>实例: {alert.instance}</span>
                        <span>•</span>
                        <span>{alert.time}</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      查看详情
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Alertmanager 链接 */}
          <Card>
            <CardHeader>
              <CardTitle>告警管理</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">
                使用 Alertmanager 管理告警规则、静默和通知配置
              </p>
              <Button variant="outline" asChild>
                <a
                  href="http://localhost:9093"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  打开 Alertmanager
                </a>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
