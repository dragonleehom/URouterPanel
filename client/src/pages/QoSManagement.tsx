import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Gauge, Plus, Trash2, Edit, TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";

interface QoSRule {
  id: string;
  name: string;
  enabled: boolean;
  priority: "high" | "medium" | "low";
  type: "ip" | "port" | "protocol" | "application";
  target: string;
  uploadLimit: number; // Mbps, 0 = unlimited
  downloadLimit: number; // Mbps, 0 = unlimited
  uploadMin: number; // Mbps, guaranteed bandwidth
  downloadMin: number; // Mbps, guaranteed bandwidth
}

interface BandwidthStats {
  interface: string;
  upload: number;
  download: number;
  uploadMax: number;
  downloadMax: number;
}

export default function QoSManagement() {
  const [qosEnabled, setQosEnabled] = useState(true);
  const [rules, setRules] = useState<QoSRule[]>([
    {
      id: "1",
      name: "视频会议优先",
      enabled: true,
      priority: "high",
      type: "port",
      target: "3478,8801-8810",
      uploadLimit: 0,
      downloadLimit: 0,
      uploadMin: 2,
      downloadMin: 5,
    },
    {
      id: "2",
      name: "游戏流量优先",
      enabled: true,
      priority: "high",
      type: "protocol",
      target: "UDP",
      uploadLimit: 0,
      downloadLimit: 0,
      uploadMin: 1,
      downloadMin: 3,
    },
    {
      id: "3",
      name: "下载限速",
      enabled: true,
      priority: "low",
      type: "port",
      target: "6881-6889",
      uploadLimit: 10,
      downloadLimit: 50,
      uploadMin: 0,
      downloadMin: 0,
    },
  ]);

  const [bandwidthStats] = useState<BandwidthStats[]>([
    {
      interface: "WAN",
      upload: 45.2,
      download: 123.5,
      uploadMax: 100,
      downloadMax: 500,
    },
    {
      interface: "LAN",
      upload: 15.8,
      download: 67.3,
      uploadMax: 1000,
      downloadMax: 1000,
    },
  ]);

  const [editingRule, setEditingRule] = useState<QoSRule | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploadBandwidth, setUploadBandwidth] = useState(100);
  const [downloadBandwidth, setDownloadBandwidth] = useState(500);

  const handleToggleQoS = () => {
    setQosEnabled(!qosEnabled);
    toast.success(qosEnabled ? "QoS已禁用" : "QoS已启用");
  };

  const handleToggleRule = (id: string) => {
    setRules(
      rules.map((rule) =>
        rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
      )
    );
    toast.success("规则状态已更新");
  };

  const handleEditRule = (rule: QoSRule) => {
    setEditingRule({ ...rule });
    setIsDialogOpen(true);
  };

  const handleSaveRule = () => {
    if (!editingRule) return;

    if (!editingRule.name.trim()) {
      toast.error("规则名称不能为空");
      return;
    }

    if (!editingRule.target.trim()) {
      toast.error("目标不能为空");
      return;
    }

    if (rules.find((r) => r.id === editingRule.id)) {
      setRules(rules.map((r) => (r.id === editingRule.id ? editingRule : r)));
    } else {
      setRules([...rules, { ...editingRule, id: Date.now().toString() }]);
    }

    setIsDialogOpen(false);
    setEditingRule(null);
    toast.success("QoS规则已保存");
  };

  const handleAddRule = () => {
    const newRule: QoSRule = {
      id: Date.now().toString(),
      name: "新规则",
      enabled: true,
      priority: "medium",
      type: "ip",
      target: "",
      uploadLimit: 0,
      downloadLimit: 0,
      uploadMin: 0,
      downloadMin: 0,
    };
    setEditingRule(newRule);
    setIsDialogOpen(true);
  };

  const handleDeleteRule = (id: string) => {
    setRules(rules.filter((rule) => rule.id !== id));
    toast.success("QoS规则已删除");
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-700";
      case "medium":
        return "bg-yellow-100 text-yellow-700";
      case "low":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case "high":
        return "高优先级";
      case "medium":
        return "中优先级";
      case "low":
        return "低优先级";
      default:
        return "未知";
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case "ip":
        return "IP地址";
      case "port":
        return "端口";
      case "protocol":
        return "协议";
      case "application":
        return "应用";
      default:
        return "未知";
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Gauge className="w-6 h-6" />
            QoS流量控制
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            管理带宽分配、流量优先级和限速规则
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label>QoS总开关</Label>
            <Switch checked={qosEnabled} onCheckedChange={handleToggleQoS} />
          </div>
          <Button onClick={handleAddRule} disabled={!qosEnabled}>
            <Plus className="w-4 h-4 mr-2" />
            添加规则
          </Button>
        </div>
      </div>

      <Tabs defaultValue="rules" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rules">QoS规则</TabsTrigger>
          <TabsTrigger value="bandwidth">带宽监控</TabsTrigger>
          <TabsTrigger value="settings">全局设置</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4">
          {!qosEnabled && (
            <Card className="p-4 bg-yellow-50 border-yellow-200">
              <p className="text-sm text-yellow-800">
                QoS功能已禁用,规则不会生效。请在右上角启用QoS总开关。
              </p>
            </Card>
          )}

          {rules.map((rule) => (
            <Card key={rule.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <Gauge
                      className={`w-5 h-5 ${
                        rule.enabled && qosEnabled
                          ? "text-blue-600"
                          : "text-gray-400"
                      }`}
                    />
                    <div>
                      <h3 className="text-lg font-medium">{rule.name}</h3>
                      <p className="text-sm text-gray-500">
                        {getTypeText(rule.type)}: {rule.target}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded ${getPriorityColor(rule.priority)}`}>
                      {getPriorityText(rule.priority)}
                    </span>
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        rule.enabled
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {rule.enabled ? "已启用" : "已禁用"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        上传限制
                      </p>
                      <p className="font-medium">
                        {rule.uploadLimit === 0 ? "无限制" : `${rule.uploadLimit} Mbps`}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 flex items-center gap-1">
                        <TrendingDown className="w-4 h-4" />
                        下载限制
                      </p>
                      <p className="font-medium">
                        {rule.downloadLimit === 0
                          ? "无限制"
                          : `${rule.downloadLimit} Mbps`}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">保证上传</p>
                      <p className="font-medium">
                        {rule.uploadMin === 0 ? "无保证" : `${rule.uploadMin} Mbps`}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">保证下载</p>
                      <p className="font-medium">
                        {rule.downloadMin === 0 ? "无保证" : `${rule.downloadMin} Mbps`}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Switch
                    checked={rule.enabled}
                    onCheckedChange={() => handleToggleRule(rule.id)}
                    disabled={!qosEnabled}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditRule(rule)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteRule(rule.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          {rules.length === 0 && (
            <Card className="p-12 text-center">
              <Gauge className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 mb-4">暂无QoS规则</p>
              <Button onClick={handleAddRule} disabled={!qosEnabled}>
                <Plus className="w-4 h-4 mr-2" />
                添加第一条规则
              </Button>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="bandwidth" className="space-y-4">
          {bandwidthStats.map((stat, index) => (
            <Card key={index} className="p-6">
              <h3 className="text-lg font-medium mb-4">{stat.interface} 接口</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium">上传速率</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {stat.upload.toFixed(1)} / {stat.uploadMax} Mbps
                    </span>
                  </div>
                  <Progress
                    value={(stat.upload / stat.uploadMax) * 100}
                    className="h-3"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium">下载速率</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {stat.download.toFixed(1)} / {stat.downloadMax} Mbps
                    </span>
                  </div>
                  <Progress
                    value={(stat.download / stat.downloadMax) * 100}
                    className="h-3"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-gray-500">上传利用率</p>
                    <p className="text-2xl font-semibold text-blue-600">
                      {((stat.upload / stat.uploadMax) * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">下载利用率</p>
                    <p className="text-2xl font-semibold text-green-600">
                      {((stat.download / stat.downloadMax) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-medium mb-4">带宽设置</h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>上传带宽: {uploadBandwidth} Mbps</Label>
                <Slider
                  value={[uploadBandwidth]}
                  onValueChange={(value) => setUploadBandwidth(value[0] || 100)}
                  min={1}
                  max={1000}
                  step={1}
                />
                <p className="text-xs text-gray-500">
                  设置WAN口的总上传带宽,用于QoS计算
                </p>
              </div>

              <div className="space-y-2">
                <Label>下载带宽: {downloadBandwidth} Mbps</Label>
                <Slider
                  value={[downloadBandwidth]}
                  onValueChange={(value) => setDownloadBandwidth(value[0] || 500)}
                  min={1}
                  max={1000}
                  step={1}
                />
                <p className="text-xs text-gray-500">
                  设置WAN口的总下载带宽,用于QoS计算
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-medium mb-4">QoS算法</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>队列调度算法</Label>
                <Select defaultValue="htb">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="htb">HTB (Hierarchical Token Bucket)</SelectItem>
                    <SelectItem value="hfsc">HFSC (Hierarchical Fair Service Curve)</SelectItem>
                    <SelectItem value="fq_codel">fq_codel (Fair Queue CoDel)</SelectItem>
                    <SelectItem value="cake">CAKE (Common Applications Kept Enhanced)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  HTB适合大多数场景,CAKE对游戏和实时应用更友好
                </p>
              </div>

              <div className="flex items-center justify-between p-4 border rounded">
                <div>
                  <p className="font-medium">智能QoS</p>
                  <p className="text-sm text-gray-500">
                    自动识别应用类型并分配优先级
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between p-4 border rounded">
                <div>
                  <p className="font-medium">游戏加速</p>
                  <p className="text-sm text-gray-500">
                    自动优化游戏流量,降低延迟
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <Button>保存设置</Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 编辑规则对话框 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingRule?.id && rules.find((r) => r.id === editingRule.id)
                ? "编辑QoS规则"
                : "添加QoS规则"}
            </DialogTitle>
            <DialogDescription>
              配置流量控制规则的优先级、目标和带宽限制
            </DialogDescription>
          </DialogHeader>

          {editingRule && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label>规则名称</Label>
                  <Input
                    value={editingRule.name}
                    onChange={(e) =>
                      setEditingRule({ ...editingRule, name: e.target.value })
                    }
                    placeholder="例如: 视频会议优先"
                  />
                </div>

                <div className="space-y-2">
                  <Label>优先级</Label>
                  <Select
                    value={editingRule.priority}
                    onValueChange={(value: "high" | "medium" | "low") =>
                      setEditingRule({ ...editingRule, priority: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">高优先级</SelectItem>
                      <SelectItem value="medium">中优先级</SelectItem>
                      <SelectItem value="low">低优先级</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>匹配类型</Label>
                  <Select
                    value={editingRule.type}
                    onValueChange={(value: "ip" | "port" | "protocol" | "application") =>
                      setEditingRule({ ...editingRule, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ip">IP地址</SelectItem>
                      <SelectItem value="port">端口</SelectItem>
                      <SelectItem value="protocol">协议</SelectItem>
                      <SelectItem value="application">应用</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>目标</Label>
                  <Input
                    value={editingRule.target}
                    onChange={(e) =>
                      setEditingRule({ ...editingRule, target: e.target.value })
                    }
                    placeholder={
                      editingRule.type === "ip"
                        ? "例如: 192.168.1.100"
                        : editingRule.type === "port"
                        ? "例如: 80,443,8000-9000"
                        : editingRule.type === "protocol"
                        ? "例如: TCP, UDP, ICMP"
                        : "例如: zoom, teams, discord"
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>上传限速 (Mbps, 0=无限制)</Label>
                  <Input
                    type="number"
                    value={editingRule.uploadLimit}
                    onChange={(e) =>
                      setEditingRule({
                        ...editingRule,
                        uploadLimit: parseInt(e.target.value) || 0,
                      })
                    }
                    min="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label>下载限速 (Mbps, 0=无限制)</Label>
                  <Input
                    type="number"
                    value={editingRule.downloadLimit}
                    onChange={(e) =>
                      setEditingRule({
                        ...editingRule,
                        downloadLimit: parseInt(e.target.value) || 0,
                      })
                    }
                    min="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label>保证上传 (Mbps, 0=无保证)</Label>
                  <Input
                    type="number"
                    value={editingRule.uploadMin}
                    onChange={(e) =>
                      setEditingRule({
                        ...editingRule,
                        uploadMin: parseInt(e.target.value) || 0,
                      })
                    }
                    min="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label>保证下载 (Mbps, 0=无保证)</Label>
                  <Input
                    type="number"
                    value={editingRule.downloadMin}
                    onChange={(e) =>
                      setEditingRule({
                        ...editingRule,
                        downloadMin: parseInt(e.target.value) || 0,
                      })
                    }
                    min="0"
                  />
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm text-blue-800">
                  <strong>提示:</strong> 保证带宽是在网络拥塞时为该规则保留的最小带宽,
                  限速是该规则可使用的最大带宽。合理配置可以确保关键应用的流畅运行。
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveRule}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
