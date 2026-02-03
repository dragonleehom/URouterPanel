/**
 * 防火墙自定义规则管理对话框
 * 用于管理防火墙自定义过滤规则
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, Edit, Save, X, CheckCircle2, AlertCircle, Power, PowerOff, Shield } from "lucide-react";

interface FirewallRulesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface RuleFormData {
  name: string;
  action: string;
  protocol: string;
  sourceZone: string;
  sourceIp: string;
  sourcePort: string;
  destZone: string;
  destIp: string;
  destPort: string;
  priority: number;
  description: string;
}

export function FirewallRulesDialog({
  open,
  onOpenChange,
}: FirewallRulesDialogProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<RuleFormData>({
    name: "",
    action: "accept",
    protocol: "all",
    sourceZone: "",
    sourceIp: "",
    sourcePort: "",
    destZone: "",
    destIp: "",
    destPort: "",
    priority: 0,
    description: "",
  });

  const utils = trpc.useUtils();

  // 查询防火墙规则列表
  const { data: rules, isLoading } = trpc.firewallRule.getAll.useQuery(
    undefined,
    { enabled: open }
  );

  // 创建防火墙规则
  const createMutation = trpc.firewallRule.create.useMutation({
    onSuccess: () => {
      toast.success("防火墙规则已添加(未应用)");
      utils.firewallRule.getAll.invalidate();
      resetForm();
    },
    onError: (error) => {
      toast.error(`添加失败: ${error.message}`);
    },
  });

  // 更新防火墙规则
  const updateMutation = trpc.firewallRule.update.useMutation({
    onSuccess: () => {
      toast.success("防火墙规则已更新(未应用)");
      utils.firewallRule.getAll.invalidate();
      setEditingId(null);
    },
    onError: (error) => {
      toast.error(`更新失败: ${error.message}`);
    },
  });

  // 删除防火墙规则
  const deleteMutation = trpc.firewallRule.delete.useMutation({
    onSuccess: () => {
      toast.success("防火墙规则已删除(需应用配置)");
      utils.firewallRule.getAll.invalidate();
    },
    onError: (error) => {
      toast.error(`删除失败: ${error.message}`);
    },
  });

  // 切换启用状态
  const toggleMutation = trpc.firewallRule.toggleEnabled.useMutation({
    onSuccess: () => {
      toast.success("规则状态已更新(需应用配置)");
      utils.firewallRule.getAll.invalidate();
    },
    onError: (error) => {
      toast.error(`更新失败: ${error.message}`);
    },
  });

  // 应用所有配置
  const applyMutation = trpc.firewallRule.applyAll.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success(result.message);
        utils.firewallRule.getAll.invalidate();
      } else {
        toast.error(result.message);
      }
    },
    onError: (error) => {
      toast.error(`应用失败: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      action: "accept",
      protocol: "all",
      sourceZone: "",
      sourceIp: "",
      sourcePort: "",
      destZone: "",
      destIp: "",
      destPort: "",
      priority: 0,
      description: "",
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSubmit = () => {
    if (!formData.name) {
      toast.error("规则名称为必填项");
      return;
    }

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        ...formData,
        action: formData.action as any,
        protocol: formData.protocol as any,
        sourceZone: formData.sourceZone || undefined,
        sourceIp: formData.sourceIp || undefined,
        sourcePort: formData.sourcePort || undefined,
        destZone: formData.destZone || undefined,
        destIp: formData.destIp || undefined,
        destPort: formData.destPort || undefined,
      });
    } else {
      createMutation.mutate({
        ...formData,
        action: formData.action as any,
        protocol: formData.protocol as any,
        sourceZone: formData.sourceZone || undefined,
        sourceIp: formData.sourceIp || undefined,
        sourcePort: formData.sourcePort || undefined,
        destZone: formData.destZone || undefined,
        destIp: formData.destIp || undefined,
        destPort: formData.destPort || undefined,
        enabled: 1,
      });
    }
  };

  const handleEdit = (rule: any) => {
    setEditingId(rule.id);
    setFormData({
      name: rule.name,
      action: rule.action,
      protocol: rule.protocol || "all",
      sourceZone: rule.sourceZone || "",
      sourceIp: rule.sourceIp || "",
      sourcePort: rule.sourcePort || "",
      destZone: rule.destZone || "",
      destIp: rule.destIp || "",
      destPort: rule.destPort || "",
      priority: rule.priority || 0,
      description: rule.description || "",
    });
    setIsAdding(false);
  };

  const handleDelete = (id: number) => {
    if (confirm("确定要删除此防火墙规则吗?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleToggle = (id: number, currentEnabled: number) => {
    toggleMutation.mutate({ id, enabled: currentEnabled === 1 ? 0 : 1 });
  };

  const handleApply = () => {
    if (confirm("确定要应用所有防火墙规则到系统吗? 这将修改iptables配置。")) {
      applyMutation.mutate();
    }
  };

  const pendingCount = rules?.filter(r => r.pendingChanges === 1).length || 0;
  const hasPendingChanges = pendingCount > 0;

  const getActionBadge = (action: string) => {
    const variants: Record<string, { variant: any; color: string }> = {
      accept: { variant: "outline", color: "bg-green-50 text-green-700 border-green-200" },
      reject: { variant: "outline", color: "bg-amber-50 text-amber-700 border-amber-200" },
      drop: { variant: "outline", color: "bg-red-50 text-red-700 border-red-200" },
    };
    const config = variants[action] || variants.accept;
    return (
      <Badge variant={config.variant} className={config.color}>
        {action.toUpperCase()}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            防火墙自定义规则
          </DialogTitle>
          <DialogDescription>
            配置防火墙过滤规则,控制网络流量的允许/拒绝/丢弃
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 待应用提示 */}
          {hasPendingChanges && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span className="text-sm text-amber-900 dark:text-amber-100">
                有 {pendingCount} 条修改未应用到系统
              </span>
            </div>
          )}

          {/* 添加/编辑表单 */}
          {(isAdding || editingId) && (
            <div className="p-4 border border-border rounded-md space-y-3">
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <Label htmlFor="name">规则名称 *</Label>
                  <Input
                    id="name"
                    placeholder="允许SSH访问"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="action">动作</Label>
                  <Select
                    value={formData.action}
                    onValueChange={(value) =>
                      setFormData({ ...formData, action: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="accept">ACCEPT (允许)</SelectItem>
                      <SelectItem value="reject">REJECT (拒绝)</SelectItem>
                      <SelectItem value="drop">DROP (丢弃)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="protocol">协议</Label>
                  <Select
                    value={formData.protocol}
                    onValueChange={(value) =>
                      setFormData({ ...formData, protocol: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">ALL (所有)</SelectItem>
                      <SelectItem value="tcp">TCP</SelectItem>
                      <SelectItem value="udp">UDP</SelectItem>
                      <SelectItem value="icmp">ICMP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="priority">优先级</Label>
                  <Input
                    id="priority"
                    type="number"
                    placeholder="0"
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">源地址</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="sourceZone">源区域(可选)</Label>
                      <Input
                        id="sourceZone"
                        placeholder="wan"
                        value={formData.sourceZone}
                        onChange={(e) =>
                          setFormData({ ...formData, sourceZone: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="sourceIp">源IP(可选)</Label>
                      <Input
                        id="sourceIp"
                        placeholder="192.168.1.0/24"
                        value={formData.sourceIp}
                        onChange={(e) =>
                          setFormData({ ...formData, sourceIp: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="sourcePort">源端口(可选)</Label>
                    <Input
                      id="sourcePort"
                      placeholder="22 或 1024:65535"
                      value={formData.sourcePort}
                      onChange={(e) =>
                        setFormData({ ...formData, sourcePort: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-medium">目标地址</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="destZone">目标区域(可选)</Label>
                      <Input
                        id="destZone"
                        placeholder="lan"
                        value={formData.destZone}
                        onChange={(e) =>
                          setFormData({ ...formData, destZone: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="destIp">目标IP(可选)</Label>
                      <Input
                        id="destIp"
                        placeholder="10.0.0.1"
                        value={formData.destIp}
                        onChange={(e) =>
                          setFormData({ ...formData, destIp: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="destPort">目标端口(可选)</Label>
                    <Input
                      id="destPort"
                      placeholder="80 或 8080:8090"
                      value={formData.destPort}
                      onChange={(e) =>
                        setFormData({ ...formData, destPort: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="description">描述(可选)</Label>
                <Textarea
                  id="description"
                  placeholder="规则描述信息"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={2}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSubmit} size="sm">
                  <Save className="w-4 h-4 mr-2" />
                  {editingId ? "更新" : "添加"}
                </Button>
                <Button onClick={resetForm} variant="outline" size="sm">
                  <X className="w-4 h-4 mr-2" />
                  取消
                </Button>
              </div>
            </div>
          )}

          {/* 添加按钮 */}
          {!isAdding && !editingId && (
            <Button onClick={() => setIsAdding(true)} variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              添加防火墙规则
            </Button>
          )}

          {/* 防火墙规则列表 */}
          <div className="border border-border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>优先级</TableHead>
                  <TableHead>规则名称</TableHead>
                  <TableHead>动作</TableHead>
                  <TableHead>协议</TableHead>
                  <TableHead>源地址</TableHead>
                  <TableHead>目标地址</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      加载中...
                    </TableCell>
                  </TableRow>
                ) : rules && rules.length > 0 ? (
                  rules
                    .sort((a, b) => (a.priority || 999) - (b.priority || 999))
                    .map((rule: any) => (
                      <TableRow key={rule.id}>
                        <TableCell className="font-mono text-sm">{rule.priority || 0}</TableCell>
                        <TableCell className="font-medium">{rule.name}</TableCell>
                        <TableCell>{getActionBadge(rule.action)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {rule.protocol?.toUpperCase() || "ALL"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {rule.sourceIp || rule.sourceZone || "-"}
                          {rule.sourcePort && `:${rule.sourcePort}`}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {rule.destIp || rule.destZone || "-"}
                          {rule.destPort && `:${rule.destPort}`}
                        </TableCell>
                        <TableCell>
                          {rule.enabled === 1 ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              <Power className="w-3 h-3 mr-1" />
                              启用
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                              <PowerOff className="w-3 h-3 mr-1" />
                              禁用
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              onClick={() => handleToggle(rule.id, rule.enabled)}
                              variant="ghost"
                              size="sm"
                              title={rule.enabled === 1 ? "禁用" : "启用"}
                            >
                              {rule.enabled === 1 ? (
                                <PowerOff className="w-4 h-4" />
                              ) : (
                                <Power className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              onClick={() => handleEdit(rule)}
                              variant="ghost"
                              size="sm"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={() => handleDelete(rule.id)}
                              variant="ghost"
                              size="sm"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      暂无防火墙规则
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <DialogFooter>
          <div className="flex justify-between w-full">
            <Button onClick={() => onOpenChange(false)} variant="outline">
              关闭
            </Button>
            <Button
              onClick={handleApply}
              disabled={!hasPendingChanges || applyMutation.isPending}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              应用配置
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
