import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  BarChart3,
  LineChart,
  PieChart,
  Plus,
  Save,
  Settings,
  Trash2,
  Eye,
  Download,
  Upload,
} from "lucide-react";
// @ts-ignore
import GridLayout from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import {
  LineChart as RechartsLineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// 图表类型定义
type ChartType = "line" | "bar" | "pie" | "gauge";

interface ChartWidget {
  id: string;
  type: ChartType;
  title: string;
  query: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Dashboard {
  id: string;
  name: string;
  description: string;
  widgets: ChartWidget[];
}

// 模拟数据
const generateMockData = (type: ChartType) => {
  if (type === "pie") {
    return [
      { name: "CPU", value: 30 },
      { name: "内存", value: 25 },
      { name: "磁盘", value: 20 },
      { name: "网络", value: 25 },
    ];
  }
  return Array.from({ length: 10 }, (_, i) => ({
    time: `${i}s`,
    value: Math.floor(Math.random() * 100),
    value2: Math.floor(Math.random() * 100),
  }));
};

const COLORS = ["#0066ff", "#00cc88", "#ff6b6b", "#ffd93d"];

export default function DashboardBuilder() {
  const [dashboards, setDashboards] = useState<Dashboard[]>([
    {
      id: "default",
      name: "系统概览",
      description: "默认系统监控仪表盘",
      widgets: [
        {
          id: "cpu",
          type: "line",
          title: "CPU 使用率",
          query: "100 - (avg by(instance) (irate(node_cpu_seconds_total{mode=\"idle\"}[5m])) * 100)",
          x: 0,
          y: 0,
          w: 6,
          h: 2,
        },
        {
          id: "memory",
          type: "bar",
          title: "内存使用",
          query: "(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100",
          x: 6,
          y: 0,
          w: 6,
          h: 2,
        },
      ],
    },
  ]);

  const [currentDashboard, setCurrentDashboard] = useState<Dashboard>(dashboards[0]);
  const [isAddWidgetOpen, setIsAddWidgetOpen] = useState(false);
  const [isCreateDashboardOpen, setIsCreateDashboardOpen] = useState(false);
  const [editingWidget, setEditingWidget] = useState<ChartWidget | null>(null);

  // 新建仪表盘表单
  const [newDashboardName, setNewDashboardName] = useState("");
  const [newDashboardDesc, setNewDashboardDesc] = useState("");

  // 新建图表表单
  const [newWidgetType, setNewWidgetType] = useState<ChartType>("line");
  const [newWidgetTitle, setNewWidgetTitle] = useState("");
  const [newWidgetQuery, setNewWidgetQuery] = useState("");

  const handleCreateDashboard = () => {
    if (!newDashboardName) {
      toast.error("请输入仪表盘名称");
      return;
    }

    const newDashboard: Dashboard = {
      id: Date.now().toString(),
      name: newDashboardName,
      description: newDashboardDesc,
      widgets: [],
    };

    setDashboards([...dashboards, newDashboard]);
    setCurrentDashboard(newDashboard);
    setIsCreateDashboardOpen(false);
    setNewDashboardName("");
    setNewDashboardDesc("");
    toast.success("仪表盘创建成功");
  };

  const handleAddWidget = () => {
    if (!newWidgetTitle || !newWidgetQuery) {
      toast.error("请填写完整的图表信息");
      return;
    }

    const newWidget: ChartWidget = {
      id: Date.now().toString(),
      type: newWidgetType,
      title: newWidgetTitle,
      query: newWidgetQuery,
      x: 0,
      y: Infinity, // 自动放到最下面
      w: 6,
      h: 2,
    };

    const updatedDashboard = {
      ...currentDashboard,
      widgets: [...currentDashboard.widgets, newWidget],
    };

    setCurrentDashboard(updatedDashboard);
    setDashboards(
      dashboards.map((d) => (d.id === currentDashboard.id ? updatedDashboard : d))
    );

    setIsAddWidgetOpen(false);
    setNewWidgetTitle("");
    setNewWidgetQuery("");
    toast.success("图表添加成功");
  };

  const handleDeleteWidget = (widgetId: string) => {
    const updatedDashboard = {
      ...currentDashboard,
      widgets: currentDashboard.widgets.filter((w) => w.id !== widgetId),
    };

    setCurrentDashboard(updatedDashboard);
    setDashboards(
      dashboards.map((d) => (d.id === currentDashboard.id ? updatedDashboard : d))
    );
    toast.success("图表已删除");
  };

  const handleLayoutChange = (layout: any) => {
    const updatedWidgets = currentDashboard.widgets.map((widget) => {
      const layoutItem = layout.find((l: any) => l.i === widget.id);
      if (layoutItem) {
        return {
          ...widget,
          x: (layoutItem as any).x,
          y: (layoutItem as any).y,
          w: (layoutItem as any).w,
          h: (layoutItem as any).h,
        };
      }
      return widget;
    });

    const updatedDashboard = {
      ...currentDashboard,
      widgets: updatedWidgets,
    };

    setCurrentDashboard(updatedDashboard);
    setDashboards(
      dashboards.map((d) => (d.id === currentDashboard.id ? updatedDashboard : d))
    );
  };

  const handleSaveDashboard = () => {
    toast.success("仪表盘已保存");
  };

  const handleExportDashboard = () => {
    const dataStr = JSON.stringify(currentDashboard, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${currentDashboard.name}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("仪表盘已导出");
  };

  const renderChart = (widget: ChartWidget) => {
    const data = generateMockData(widget.type);

    switch (widget.type) {
      case "line":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <RechartsLineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="time" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#0066ff" strokeWidth={2} />
            </RechartsLineChart>
          </ResponsiveContainer>
        );

      case "bar":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="time" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#0066ff" />
            </RechartsBarChart>
          </ResponsiveContainer>
        );

      case "pie":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </RechartsPieChart>
          </ResponsiveContainer>
        );

      default:
        return <div className="text-gray-500">不支持的图表类型</div>;
    }
  };

  const getChartIcon = (type: ChartType) => {
    switch (type) {
      case "line":
        return <LineChart className="w-4 h-4" />;
      case "bar":
        return <BarChart3 className="w-4 h-4" />;
      case "pie":
        return <PieChart className="w-4 h-4" />;
      default:
        return <BarChart3 className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">仪表盘创建器</h1>
          <p className="text-sm text-gray-500 mt-1">
            拖拽创建自定义监控仪表盘
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsCreateDashboardOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            新建仪表盘
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportDashboard}>
            <Download className="w-4 h-4 mr-2" />
            导出
          </Button>
          <Button size="sm" onClick={handleSaveDashboard}>
            <Save className="w-4 h-4 mr-2" />
            保存
          </Button>
        </div>
      </div>

      {/* 仪表盘选择器 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>当前仪表盘</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                {currentDashboard.description}
              </p>
            </div>
            <Select
              value={currentDashboard.id}
              onValueChange={(value) => {
                const dashboard = dashboards.find((d) => d.id === value);
                if (dashboard) setCurrentDashboard(dashboard);
              }}
            >
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {dashboards.map((dashboard) => (
                  <SelectItem key={dashboard.id} value={dashboard.id}>
                    {dashboard.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* 工具栏 */}
      <div className="flex items-center gap-2">
        <Button onClick={() => setIsAddWidgetOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          添加图表
        </Button>
        <Button variant="outline">
          <Eye className="w-4 h-4 mr-2" />
          预览
        </Button>
      </div>

      {/* 拖拽网格 */}
      <Card>
        <CardContent className="p-6">
          {currentDashboard.widgets.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">暂无图表,点击"添加图表"开始创建</p>
              <Button onClick={() => setIsAddWidgetOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                添加图表
              </Button>
            </div>
          ) : (
            <GridLayout
              className="layout"
              layout={currentDashboard.widgets.map((w) => ({
                i: w.id,
                x: w.x,
                y: w.y,
                w: w.w,
                h: w.h,
              }))}
              cols={12}
              rowHeight={150}
              onLayoutChange={handleLayoutChange}
              draggableHandle=".drag-handle"
            >
              {currentDashboard.widgets.map((widget) => (
                <div key={widget.id} className="border border-gray-200 rounded-lg bg-white">
                  <div className="drag-handle flex items-center justify-between p-3 border-b border-gray-200 cursor-move bg-gray-50">
                    <div className="flex items-center gap-2">
                      {getChartIcon(widget.type)}
                      <span className="text-sm font-medium">{widget.title}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingWidget(widget)}
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteWidget(widget.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                  <div className="p-4" style={{ height: "calc(100% - 57px)" }}>
                    {renderChart(widget)}
                  </div>
                </div>
              ))}
            </GridLayout>
          )}
        </CardContent>
      </Card>

      {/* 新建仪表盘对话框 */}
      <Dialog open={isCreateDashboardOpen} onOpenChange={setIsCreateDashboardOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新建仪表盘</DialogTitle>
            <DialogDescription>
              创建一个新的自定义监控仪表盘
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="dashboard-name">仪表盘名称</Label>
              <Input
                id="dashboard-name"
                value={newDashboardName}
                onChange={(e) => setNewDashboardName(e.target.value)}
                placeholder="例如: 容器监控"
              />
            </div>
            <div>
              <Label htmlFor="dashboard-desc">描述</Label>
              <Textarea
                id="dashboard-desc"
                value={newDashboardDesc}
                onChange={(e) => setNewDashboardDesc(e.target.value)}
                placeholder="简要描述仪表盘用途"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDashboardOpen(false)}>
              取消
            </Button>
            <Button onClick={handleCreateDashboard}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 添加图表对话框 */}
      <Dialog open={isAddWidgetOpen} onOpenChange={setIsAddWidgetOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>添加图表</DialogTitle>
            <DialogDescription>
              选择图表类型并配置数据源
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">基础配置</TabsTrigger>
              <TabsTrigger value="advanced">高级配置</TabsTrigger>
            </TabsList>
            <TabsContent value="basic" className="space-y-4">
              <div>
                <Label htmlFor="chart-type">图表类型</Label>
                <Select
                  value={newWidgetType}
                  onValueChange={(value) => setNewWidgetType(value as ChartType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="line">
                      <div className="flex items-center gap-2">
                        <LineChart className="w-4 h-4" />
                        折线图
                      </div>
                    </SelectItem>
                    <SelectItem value="bar">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        柱状图
                      </div>
                    </SelectItem>
                    <SelectItem value="pie">
                      <div className="flex items-center gap-2">
                        <PieChart className="w-4 h-4" />
                        饼图
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="chart-title">图表标题</Label>
                <Input
                  id="chart-title"
                  value={newWidgetTitle}
                  onChange={(e) => setNewWidgetTitle(e.target.value)}
                  placeholder="例如: CPU 使用率"
                />
              </div>
              <div>
                <Label htmlFor="chart-query">Prometheus 查询</Label>
                <Textarea
                  id="chart-query"
                  value={newWidgetQuery}
                  onChange={(e) => setNewWidgetQuery(e.target.value)}
                  placeholder="例如: 100 - (avg by(instance) (irate(node_cpu_seconds_total{mode='idle'}[5m])) * 100)"
                  rows={3}
                  className="font-mono text-sm"
                />
              </div>
            </TabsContent>
            <TabsContent value="advanced" className="space-y-4">
              <div className="text-sm text-gray-500">
                高级配置功能即将推出,包括:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>自定义颜色和样式</li>
                  <li>阈值告警线</li>
                  <li>数据聚合方式</li>
                  <li>刷新间隔设置</li>
                </ul>
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddWidgetOpen(false)}>
              取消
            </Button>
            <Button onClick={handleAddWidget}>添加</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
