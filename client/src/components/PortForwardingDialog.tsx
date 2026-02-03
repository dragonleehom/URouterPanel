/**
 * 端口转发管理对话框
 * 用于管理端口转发和DNAT规则
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
import { Plus, Trash2, Edit, Save, X, CheckCircle2, AlertCircle, ArrowRight, Power, PowerOff } from "lucide-react";

interface PortForwardingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface RuleFormData {
  name: string;
  protocol: string;
  sourceZone: string;
  externalPort: string;
  internalIp: string;
  internalPort: string;
  description: string;
}

export function PortForwardingDialog({
  open,
  onOpenChange,
}: PortForwardingDialogProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<RuleFormData>({
    name: "",
    protocol: "tcp",
    sourceZone: "wan",
    externalPort: "",
    internalIp: "",
    internalPort: "",
    description: "",
  });

  const utils = trpc.useUtils();

  // 查询端口转发规则列表
  const { data: rules, isLoading } = trpc.portForwarding.getAll.useQuery(
    undefined,
    { enabled: open }
  );

  // 查询待应用数量
  const { data: pendingData } = trpc.portForwarding.getPendingCount.useQuery(
    undefined,
    { enabled: open, refetchInterval: 3000 }
  );

  // 创建端口转发规则
  const createMutation = trpc.portForwarding.create.useMutation({
    onSuccess: () => {
      toast.success("端口转发规则已添加(未应用)");
      utils.portForwarding.getAll.invalidate();
      utils.portForwarding.getPendingCount.invalidate();
      resetForm();
    },
    onError: (error) => {
      toast.error(`添加失败: ${error.message}`);
    },
  });

  // 更新端口转发规则
  const updateMutation = trpc.portForwarding.update.useMutation({
    onSuccess: () => {
      toast.success("端口转发规则已更新(未应用)");
      utils.portForwarding.getAll.invalidate();
      utils.portForwarding.getPendingCount.invalidate();
      setEditingId(null);
    },
    onError: (error) => {
      toast.error(`更新失败: ${error.message}`);
    },
  });

  // 删除端口转发规则
  const deleteMutation = trpc.portForwarding.delete.useMutation({
    onSuccess: () => {
      toast.success("端口转发规则已删除(需应用配置)");
      utils.portForwarding.getAll.invalidate();
      utils.portForwarding.getPendingCount.invalidate();
    },
    onError: (error) => {
      toast.error(`删除失败: ${error.message}`);
    },
  });

  // 切换启用状态
  const toggleMutation = trpc.portForwarding.toggleEnabled.useMutation({
    onSuccess: () => {
      toast.success("规则状态已更新(需应用配置)");
      utils.portForwarding.getAll.invalidate();
      utils.portForwarding.getPendingCount.invalidate();
    },
    onError: (error) => {
      toast.error(`更新失败: ${error.message}`);
    },
  });

  // 应用所有配置
  const applyMutation = trpc.portForwarding.applyAll.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success(result.message);
        utils.portForwarding.getAll.invalidate();
        utils.portForwarding.getPendingCount.invalidate();
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
      protocol: "tcp",
      sourceZone: "wan",
      externalPort: "",
      internalIp: "",
      internalPort: "",
      description: "",
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.externalPort || !formData.internalIp || !formData.internalPort) {
      toast.error("规则名称、外部端口、内部IP和内部端口为必填项");
      return;
    }

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        ...formData,
        protocol: formData.protocol as any,
      });
    } else {
      createMutation.mutate({
        ...formData,
        protocol: formData.protocol as any,
        enabled: 1,
      });
    }
  };

  const handleEdit = (rule: any) => {
    setEditingId(rule.id);
    setFormData({
      name: rule.name,
      protocol: rule.protocol,
      sourceZone: rule.sourceZone || "wan",
      externalPort: rule.externalPort,
      internalIp: rule.internalIp,
      internalPort: rule.internalPort,
      description: rule.description || "",
    });
    setIsAdding(false);
  };

  const handleDelete = (id: number) => {
    if (confirm("确定要删除此端口转发规则吗?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleToggle = (id: number, currentEnabled: number) => {
    toggleMutation.mutate({ id, enabled: currentEnabled === 1 ? 0 : 1 });
  };

  const handleApply = () => {
    if (confirm("确定要应用所有端口转发规则到系统吗? 这将修改iptables配置。")) {
      applyMutation.mutate();
    }
  };

  const pendingCount = pendingData?.count || 0;
  const hasPendingChanges = pendingCount > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>端口转发配置</DialogTitle>
          <DialogDescription>
            配置端口转发规则,将外部端口映射到内部网络设备
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
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="name">规则名称 *</Label>
                  <Input
                    id="name"
                    placeholder="SSH转发"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
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
                      <SelectItem value="tcp">TCP</SelectItem>
                      <SelectItem value="udp">UDP</SelectItem>
                      <SelectItem value="both">TCP+UDP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="sourceZone">源区域</Label>
                  <Input
                    id="sourceZone"
                    placeholder="wan"
                    value={formData.sourceZone}
                    onChange={(e) =>
                      setFormData({ ...formData, sourceZone: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="externalPort">外部端口 *</Label>
                  <Input
                    id="externalPort"
                    placeholder="8080 或 8080-8090"
                    value={formData.externalPort}
                    onChange={(e) =>
                      setFormData({ ...formData, externalPort: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="internalIp">内部IP地址 *</Label>
                  <Input
                    id="internalIp"
                    placeholder="192.168.1.100"
                    value={formData.internalIp}
                    onChange={(e) =>
                      setFormData({ ...formData, internalIp: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="internalPort">内部端口 *</Label>
                  <Input
                    id="internalPort"
                    placeholder="22 或 8080-8090"
                    value={formData.internalPort}
                    onChange={(e) =>
                      setFormData({ ...formData, internalPort: e.target.value })
                    }
                  />
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
              添加端口转发规则
            </Button>
          )}

          {/* 端口转发规则列表 */}
          <div className="border border-border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>规则名称</TableHead>
                  <TableHead>协议</TableHead>
                  <TableHead>外部端口</TableHead>
                  <TableHead></TableHead>
                  <TableHead>内部地址</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      加载中...
                    </TableCell>
                  </TableRow>
                ) : rules && rules.length > 0 ? (
                  rules.map((rule: any) => (
                    <TableRow key={rule.id}>
                      <TableCell className="font-medium">{rule.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {rule.protocol.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{rule.externalPort}</TableCell>
                      <TableCell className="text-center">
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {rule.internalIp}:{rule.internalPort}
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
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      暂无端口转发规则
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
