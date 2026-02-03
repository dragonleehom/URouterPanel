/**
 * DNS转发器管理对话框
 * 用于配置上游DNS服务器
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
import { Plus, Trash2, Edit, Save, X, CheckCircle2, AlertCircle, Server, ArrowUp, ArrowDown, Globe } from "lucide-react";

interface DnsForwardersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface DnsFormData {
  dnsServer: string;
  priority: number;
}

// 常用DNS服务器预设
const COMMON_DNS_SERVERS = [
  { name: "Google DNS", primary: "8.8.8.8", secondary: "8.8.4.4" },
  { name: "Cloudflare DNS", primary: "1.1.1.1", secondary: "1.0.0.1" },
  { name: "阿里DNS", primary: "223.5.5.5", secondary: "223.6.6.6" },
  { name: "腾讯DNS", primary: "119.29.29.29", secondary: "182.254.116.116" },
  { name: "百度DNS", primary: "180.76.76.76", secondary: "114.114.114.114" },
  { name: "OpenDNS", primary: "208.67.222.222", secondary: "208.67.220.220" },
];

export function DnsForwardersDialog({
  open,
  onOpenChange,
}: DnsForwardersDialogProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showPresets, setShowPresets] = useState(false);
  const [formData, setFormData] = useState<DnsFormData>({
    dnsServer: "",
    priority: 0,
  });

  const utils = trpc.useUtils();

  // 查询DNS转发器列表
  const { data: forwarders, isLoading } = trpc.dnsForwarders.getAll.useQuery(
    undefined,
    { enabled: open }
  );

  // 查询当前系统DNS
  const { data: currentDns } = trpc.dnsForwarders.getCurrentDns.useQuery(
    undefined,
    { enabled: open }
  );

  // 创建DNS转发器
  const createMutation = trpc.dnsForwarders.create.useMutation({
    onSuccess: () => {
      toast.success("DNS转发器已添加(未应用)");
      utils.dnsForwarders.getAll.invalidate();
      resetForm();
    },
    onError: (error) => {
      toast.error(`添加失败: ${error.message}`);
    },
  });

  // 批量创建DNS转发器
  const createBatchMutation = trpc.dnsForwarders.createBatch.useMutation({
    onSuccess: () => {
      toast.success("DNS转发器已批量添加(未应用)");
      utils.dnsForwarders.getAll.invalidate();
      setShowPresets(false);
    },
    onError: (error) => {
      toast.error(`批量添加失败: ${error.message}`);
    },
  });

  // 更新DNS转发器
  const updateMutation = trpc.dnsForwarders.update.useMutation({
    onSuccess: () => {
      toast.success("DNS转发器已更新(未应用)");
      utils.dnsForwarders.getAll.invalidate();
      setEditingId(null);
    },
    onError: (error) => {
      toast.error(`更新失败: ${error.message}`);
    },
  });

  // 删除DNS转发器
  const deleteMutation = trpc.dnsForwarders.delete.useMutation({
    onSuccess: () => {
      toast.success("DNS转发器已删除(需应用配置)");
      utils.dnsForwarders.getAll.invalidate();
    },
    onError: (error) => {
      toast.error(`删除失败: ${error.message}`);
    },
  });

  // 应用所有配置
  const applyMutation = trpc.dnsForwarders.applyAll.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success(result.message);
        utils.dnsForwarders.getAll.invalidate();
        utils.dnsForwarders.getCurrentDns.invalidate();
      } else {
        toast.error(result.message);
      }
    },
    onError: (error) => {
      toast.error(`应用失败: ${error.message}`);
    },
  });

  // 复位未应用的修改
  const revertMutation = trpc.dnsForwarders.revert.useMutation({
    onSuccess: () => {
      toast.success("已复位未应用的修改");
      utils.dnsForwarders.getAll.invalidate();
    },
    onError: (error) => {
      toast.error(`复位失败: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      dnsServer: "",
      priority: 0,
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSubmit = () => {
    if (!formData.dnsServer) {
      toast.error("DNS服务器地址为必填项");
      return;
    }

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        ...formData,
      });
    } else {
      createMutation.mutate({
        ...formData,
        enabled: 1,
      });
    }
  };

  const handleEdit = (forwarder: any) => {
    setEditingId(forwarder.id);
    setFormData({
      dnsServer: forwarder.dnsServer,
      priority: forwarder.priority || 0,
    });
    setIsAdding(false);
  };

  const handleDelete = (id: number) => {
    if (confirm("确定要删除此DNS转发器吗?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleAddPreset = (preset: typeof COMMON_DNS_SERVERS[0]) => {
    const dnsServers = [preset.primary, preset.secondary];
    createBatchMutation.mutate({ dnsServers });
  };

  const handleApply = () => {
    if (confirm("确定要应用所有DNS转发器配置到系统吗? 这将修改dnsmasq配置。")) {
      applyMutation.mutate();
    }
  };

  const handleRevert = () => {
    if (confirm("确定要放弃所有未应用的修改吗?")) {
      revertMutation.mutate();
    }
  };

  const pendingCount = forwarders?.filter(f => f.pendingChanges === 1).length || 0;
  const hasPendingChanges = pendingCount > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Server className="w-5 h-5" />
            DNS转发器配置
          </DialogTitle>
          <DialogDescription>
            配置上游DNS服务器,用于域名解析
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 当前系统DNS */}
          {currentDns && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  当前系统DNS
                </span>
              </div>
              <div className="text-sm text-blue-800 dark:text-blue-200 font-mono">
                {currentDns.dnsServers?.join(", ") || "未配置"}
              </div>
            </div>
          )}

          {/* 待应用提示 */}
          {hasPendingChanges && (
            <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span className="text-sm text-amber-900 dark:text-amber-100">
                  有 {pendingCount} 条修改未应用到系统
                </span>
              </div>
              <Button onClick={handleRevert} variant="outline" size="sm">
                复位修改
              </Button>
            </div>
          )}

          {/* 添加/编辑表单 */}
          {(isAdding || editingId) && (
            <div className="p-4 border border-border rounded-md space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <Label htmlFor="dnsServer">DNS服务器地址 *</Label>
                  <Input
                    id="dnsServer"
                    placeholder="8.8.8.8 或 2001:4860:4860::8888"
                    value={formData.dnsServer}
                    onChange={(e) =>
                      setFormData({ ...formData, dnsServer: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    支持IPv4、IPv6或域名格式
                  </p>
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
                  <p className="text-xs text-muted-foreground mt-1">
                    数字越小优先级越高
                  </p>
                </div>
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

          {/* 操作按钮 */}
          {!isAdding && !editingId && (
            <div className="flex gap-2">
              <Button onClick={() => setIsAdding(true)} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                添加DNS服务器
              </Button>
              <Button onClick={() => setShowPresets(!showPresets)} variant="outline" size="sm">
                <Server className="w-4 h-4 mr-2" />
                {showPresets ? "隐藏" : "显示"}常用DNS
              </Button>
            </div>
          )}

          {/* 常用DNS预设 */}
          {showPresets && (
            <div className="p-4 border border-border rounded-md space-y-2">
              <h4 className="text-sm font-medium mb-3">常用DNS服务器</h4>
              <div className="grid grid-cols-2 gap-2">
                {COMMON_DNS_SERVERS.map((preset) => (
                  <div
                    key={preset.name}
                    className="p-3 border border-border rounded-md hover:bg-accent cursor-pointer"
                    onClick={() => handleAddPreset(preset)}
                  >
                    <div className="font-medium text-sm mb-1">{preset.name}</div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {preset.primary} / {preset.secondary}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DNS转发器列表 */}
          <div className="border border-border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>优先级</TableHead>
                  <TableHead>DNS服务器</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      加载中...
                    </TableCell>
                  </TableRow>
                ) : forwarders && forwarders.length > 0 ? (
                  forwarders
                    .sort((a, b) => (a.priority || 999) - (b.priority || 999))
                    .map((forwarder: any, index) => (
                      <TableRow key={forwarder.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm">{forwarder.priority || 0}</span>
                            {index === 0 && (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                <ArrowUp className="w-3 h-3 mr-1" />
                                主
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{forwarder.dnsServer}</TableCell>
                        <TableCell>
                          {forwarder.pendingChanges === 1 ? (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                              待应用
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              已应用
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              onClick={() => handleEdit(forwarder)}
                              variant="ghost"
                              size="sm"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={() => handleDelete(forwarder.id)}
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
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      暂无DNS转发器配置
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
