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
import { Gauge, Plus, Trash2, Edit, RefreshCw, Power, PowerOff } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";

export default function QoSManagement() {
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);

  // 获取QoS配置
  const { data: config, refetch: refetchConfig } = trpc.qos.getConfig.useQuery();

  // 获取QoS规则列表
  const { data: rules, isLoading: rulesLoading, refetch: refetchRules } = 
    trpc.qos.getRules.useQuery();

  // 获取QoS状态
  const { data: status, refetch: refetchStatus } = trpc.qos.getStatus.useQuery();

  // 启用QoS mutation
  const enableQoSMutation = trpc.qos.enable.useMutation({
    onSuccess: () => {
      toast.success("QoS已启用");
      refetchStatus();
      refetchConfig();
    },
    onError: (error) => {
      toast.error(`启用失败: ${error.message}`);
    },
  });

  // 禁用QoS mutation
  const disableQoSMutation = trpc.qos.disable.useMutation({
    onSuccess: () => {
      toast.success("QoS已禁用");
      refetchStatus();
      refetchConfig();
    },
    onError: (error) => {
      toast.error(`禁用失败: ${error.message}`);
    },
  });

  // 配置QoS mutation
  const configureQoSMutation = trpc.qos.configure.useMutation({
    onSuccess: () => {
      toast.success("QoS配置已保存");
      refetchConfig();
    },
    onError: (error) => {
      toast.error(`配置失败: ${error.message}`);
    },
  });

  // 添加规则mutation
  const addRuleMutation = trpc.qos.addRule.useMutation({
    onSuccess: () => {
      toast.success("规则添加成功");
      refetchRules();
      refetchStatus();
      setRuleDialogOpen(false);
      setEditingRule(null);
    },
    onError: (error) => {
      toast.error(`添加失败: ${error.message}`);
    },
  });

  // 更新规则mutation
  const updateRuleMutation = trpc.qos.updateRule.useMutation({
    onSuccess: () => {
      toast.success("规则更新成功");
      refetchRules();
      setRuleDialogOpen(false);
      setEditingRule(null);
    },
    onError: (error) => {
      toast.error(`更新失败: ${error.message}`);
    },
  });

  // 删除规则mutation
  const deleteRuleMutation = trpc.qos.deleteRule.useMutation({
    onSuccess: () => {
      toast.success("规则删除成功");
      refetchRules();
      refetchStatus();
    },
    onError: (error) => {
      toast.error(`删除失败: ${error.message}`);
    },
  });

  // 切换规则状态mutation
  const toggleRuleMutation = trpc.qos.toggleRule.useMutation({
    onSuccess: () => {
      toast.success("规则状态已更新");
      refetchRules();
    },
    onError: (error) => {
      toast.error(`切换失败: ${error.message}`);
    },
  });

  // 规则表单状态
  const [formData, setFormData] = useState({
    name: "",
    interface: "eth0",
    direction: "upload",
    protocol: "",
    src_ip: "",
    dst_ip: "",
    src_port: "",
    dst_port: "",
    priority: 3,
    min_bandwidth: "",
    max_bandwidth: "",
  });

  // 打开添加规则对话框
  const handleAddRule = () => {
    setEditingRule(null);
    setFormData({
      name: "",
      interface: "eth0",
      direction: "upload",
      protocol: "",
      src_ip: "",
      dst_ip: "",
      src_port: "",
      dst_port: "",
      priority: 3,
      min_bandwidth: "",
      max_bandwidth: "",
    });
    setRuleDialogOpen(true);
  };

  // 打开编辑规则对话框
  const handleEditRule = (rule: any) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name || "",
      interface: rule.interface || "eth0",
      direction: rule.direction || "upload",
      protocol: rule.protocol || "",
      src_ip: rule.src_ip || "",
      dst_ip: rule.dst_ip || "",
      src_port: rule.src_port?.toString() || "",
      dst_port: rule.dst_port?.toString() || "",
      priority: rule.priority || 3,
      min_bandwidth: rule.min_bandwidth?.toString() || "",
      max_bandwidth: rule.max_bandwidth?.toString() || "",
    });
    setRuleDialogOpen(true);
  };

  // 提交规则
  const handleSubmitRule = () => {
    if (!formData.name) {
      toast.error("请输入规则名称");
      return;
    }

    const ruleData = {
      name: formData.name,
      interface: formData.interface,
      direction: formData.direction,
      protocol: formData.protocol || null,
      src_ip: formData.src_ip || null,
      dst_ip: formData.dst_ip || null,
      src_port: formData.src_port ? parseInt(formData.src_port) : null,
      dst_port: formData.dst_port ? parseInt(formData.dst_port) : null,
      priority: formData.priority,
      min_bandwidth: formData.min_bandwidth ? parseInt(formData.min_bandwidth) : null,
      max_bandwidth: formData.max_bandwidth ? parseInt(formData.max_bandwidth) : null,
    };

    if (editingRule) {
      updateRuleMutation.mutate({
        ruleId: editingRule.id,
        rule: ruleData,
      });
    } else {
      addRuleMutation.mutate(ruleData);
    }
  };

  // 删除规则
  const handleDeleteRule = (ruleId: string) => {
    if (confirm("确定要删除此规则吗?")) {
      deleteRuleMutation.mutate({ ruleId });
    }
  };

  // 切换规则状态
  const handleToggleRule = (ruleId: string) => {
    toggleRuleMutation.mutate({ ruleId });
  };

  // 配置表单状态
  const [configFormData, setConfigFormData] = useState({
    upload_bandwidth: "",
    download_bandwidth: "",
    default_priority: 3,
  });

  // 加载配置到表单
  const loadConfigToForm = () => {
    if (config) {
      setConfigFormData({
        upload_bandwidth: config.upload_bandwidth?.toString() || "",
        download_bandwidth: config.download_bandwidth?.toString() || "",
        default_priority: config.default_priority || 3,
      });
    }
  };

  // 保存配置
  const handleSaveConfig = () => {
    if (!configFormData.upload_bandwidth || !configFormData.download_bandwidth) {
      toast.error("请输入上传和下载带宽");
      return;
    }

    configureQoSMutation.mutate({
      upload_bandwidth: parseInt(configFormData.upload_bandwidth),
      download_bandwidth: parseInt(configFormData.download_bandwidth),
      default_priority: configFormData.default_priority,
    });
  };

  if (rulesLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">QoS流量控制</h1>
          <p className="text-muted-foreground mt-1">
            管理带宽限制和流量优先级
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetchConfig();
              refetchRules();
              refetchStatus();
            }}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            刷新
          </Button>
          {status?.enabled ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => disableQoSMutation.mutate()}
              disabled={disableQoSMutation.isPending}
            >
              <PowerOff className="w-4 h-4 mr-2" />
              禁用QoS
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => enableQoSMutation.mutate()}
              disabled={enableQoSMutation.isPending}
            >
              <Power className="w-4 h-4 mr-2" />
              启用QoS
            </Button>
          )}
        </div>
      </div>

      {/* 状态卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Gauge className="w-8 h-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">QoS状态</p>
              <p className="text-2xl font-bold">
                {status?.enabled ? "已启用" : "已禁用"}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div>
            <p className="text-sm text-muted-foreground">规则总数</p>
            <p className="text-2xl font-bold">{status?.rule_count || 0}</p>
          </div>
        </Card>
        <Card className="p-4">
          <div>
            <p className="text-sm text-muted-foreground">活跃规则</p>
            <p className="text-2xl font-bold">{status?.active_rule_count || 0}</p>
          </div>
        </Card>
        <Card className="p-4">
          <div>
            <p className="text-sm text-muted-foreground">配置状态</p>
            <p className="text-2xl font-bold">
              {status?.configured ? "已配置" : "未配置"}
            </p>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="rules" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rules">QoS规则</TabsTrigger>
          <TabsTrigger value="config">全局配置</TabsTrigger>
        </TabsList>

        {/* QoS规则标签页 */}
        <TabsContent value="rules" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">规则列表</h3>
            <Button onClick={handleAddRule}>
              <Plus className="w-4 h-4 mr-2" />
              添加规则
            </Button>
          </div>

          <div className="space-y-2">
            {rules && rules.length > 0 ? (
              rules.map((rule: any) => (
                <Card key={rule.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={rule.enabled}
                          onCheckedChange={() => handleToggleRule(rule.id)}
                        />
                        <div>
                          <p className="font-medium">{rule.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {rule.interface} | {rule.direction} | 优先级: {rule.priority}
                            {rule.max_bandwidth && ` | 最大带宽: ${rule.max_bandwidth}kbps`}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditRule(rule)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteRule(rule.id)}
                        disabled={deleteRuleMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">暂无QoS规则</p>
                <Button className="mt-4" onClick={handleAddRule}>
                  <Plus className="w-4 h-4 mr-2" />
                  添加第一条规则
                </Button>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* 全局配置标签页 */}
        <TabsContent value="config" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">带宽配置</h3>
            <div className="space-y-4">
              <div>
                <Label>上传带宽 (kbps)</Label>
                <Input
                  type="number"
                  value={configFormData.upload_bandwidth}
                  onChange={(e) =>
                    setConfigFormData({
                      ...configFormData,
                      upload_bandwidth: e.target.value,
                    })
                  }
                  placeholder={config?.upload_bandwidth?.toString() || "10000"}
                />
              </div>
              <div>
                <Label>下载带宽 (kbps)</Label>
                <Input
                  type="number"
                  value={configFormData.download_bandwidth}
                  onChange={(e) =>
                    setConfigFormData({
                      ...configFormData,
                      download_bandwidth: e.target.value,
                    })
                  }
                  placeholder={config?.download_bandwidth?.toString() || "100000"}
                />
              </div>
              <div>
                <Label>默认优先级 (1-5)</Label>
                <Input
                  type="number"
                  min="1"
                  max="5"
                  value={configFormData.default_priority}
                  onChange={(e) =>
                    setConfigFormData({
                      ...configFormData,
                      default_priority: parseInt(e.target.value) || 3,
                    })
                  }
                />
              </div>
              <Button
                onClick={handleSaveConfig}
                disabled={configureQoSMutation.isPending}
              >
                {configureQoSMutation.isPending ? "保存中..." : "保存配置"}
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 规则对话框 */}
      <Dialog open={ruleDialogOpen} onOpenChange={setRuleDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingRule ? "编辑规则" : "添加规则"}</DialogTitle>
            <DialogDescription>
              配置QoS流量控制规则
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div>
              <Label htmlFor="name">规则名称 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="例如: 视频会议优先"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="interface">接口</Label>
                <Input
                  id="interface"
                  value={formData.interface}
                  onChange={(e) => setFormData({ ...formData, interface: e.target.value })}
                  placeholder="eth0"
                />
              </div>
              <div>
                <Label htmlFor="direction">方向</Label>
                <Select
                  value={formData.direction}
                  onValueChange={(value) => setFormData({ ...formData, direction: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upload">上传</SelectItem>
                    <SelectItem value="download">下载</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="protocol">协议</Label>
                <Select
                  value={formData.protocol}
                  onValueChange={(value) => setFormData({ ...formData, protocol: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="不限制" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">不限制</SelectItem>
                    <SelectItem value="tcp">TCP</SelectItem>
                    <SelectItem value="udp">UDP</SelectItem>
                    <SelectItem value="icmp">ICMP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">优先级 (1最高-5最低)</Label>
                <Input
                  id="priority"
                  type="number"
                  min="1"
                  max="5"
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({ ...formData, priority: parseInt(e.target.value) || 3 })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="src_ip">源IP地址</Label>
                <Input
                  id="src_ip"
                  value={formData.src_ip}
                  onChange={(e) => setFormData({ ...formData, src_ip: e.target.value })}
                  placeholder="例如: 192.168.1.100"
                />
              </div>
              <div>
                <Label htmlFor="dst_ip">目标IP地址</Label>
                <Input
                  id="dst_ip"
                  value={formData.dst_ip}
                  onChange={(e) => setFormData({ ...formData, dst_ip: e.target.value })}
                  placeholder="例如: 8.8.8.8"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="src_port">源端口</Label>
                <Input
                  id="src_port"
                  value={formData.src_port}
                  onChange={(e) => setFormData({ ...formData, src_port: e.target.value })}
                  placeholder="例如: 80"
                />
              </div>
              <div>
                <Label htmlFor="dst_port">目标端口</Label>
                <Input
                  id="dst_port"
                  value={formData.dst_port}
                  onChange={(e) => setFormData({ ...formData, dst_port: e.target.value })}
                  placeholder="例如: 443"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="min_bandwidth">最小带宽 (kbps)</Label>
                <Input
                  id="min_bandwidth"
                  type="number"
                  value={formData.min_bandwidth}
                  onChange={(e) =>
                    setFormData({ ...formData, min_bandwidth: e.target.value })
                  }
                  placeholder="保证带宽"
                />
              </div>
              <div>
                <Label htmlFor="max_bandwidth">最大带宽 (kbps)</Label>
                <Input
                  id="max_bandwidth"
                  type="number"
                  value={formData.max_bandwidth}
                  onChange={(e) =>
                    setFormData({ ...formData, max_bandwidth: e.target.value })
                  }
                  placeholder="限制带宽"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRuleDialogOpen(false);
                setEditingRule(null);
              }}
            >
              取消
            </Button>
            <Button
              onClick={handleSubmitRule}
              disabled={addRuleMutation.isPending || updateRuleMutation.isPending}
            >
              {addRuleMutation.isPending || updateRuleMutation.isPending
                ? "保存中..."
                : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
