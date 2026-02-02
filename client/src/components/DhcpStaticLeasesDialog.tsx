/**
 * DHCP静态租约管理对话框
 * 用于管理DHCP静态地址分配
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, Edit, Save, X, CheckCircle2, AlertCircle } from "lucide-react";

interface DhcpStaticLeasesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  networkPortId: number;
}

interface LeaseFormData {
  macAddress: string;
  ipAddress: string;
  hostname: string;
  description: string;
}

export function DhcpStaticLeasesDialog({
  open,
  onOpenChange,
  networkPortId,
}: DhcpStaticLeasesDialogProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<LeaseFormData>({
    macAddress: "",
    ipAddress: "",
    hostname: "",
    description: "",
  });

  const utils = trpc.useUtils();

  // 查询静态租约列表
  const { data: leases, isLoading } = trpc.dhcpStaticLeases.getAll.useQuery(
    { networkPortId },
    { enabled: open }
  );

  // 查询待应用数量
  const { data: pendingData } = trpc.dhcpStaticLeases.getPendingCount.useQuery(
    undefined,
    { enabled: open, refetchInterval: 3000 }
  );

  // 创建静态租约
  const createMutation = trpc.dhcpStaticLeases.create.useMutation({
    onSuccess: () => {
      toast.success("静态租约已添加(未应用)");
      utils.dhcpStaticLeases.getAll.invalidate();
      utils.dhcpStaticLeases.getPendingCount.invalidate();
      resetForm();
    },
    onError: (error) => {
      toast.error(`添加失败: ${error.message}`);
    },
  });

  // 更新静态租约
  const updateMutation = trpc.dhcpStaticLeases.update.useMutation({
    onSuccess: () => {
      toast.success("静态租约已更新(未应用)");
      utils.dhcpStaticLeases.getAll.invalidate();
      utils.dhcpStaticLeases.getPendingCount.invalidate();
      setEditingId(null);
    },
    onError: (error) => {
      toast.error(`更新失败: ${error.message}`);
    },
  });

  // 删除静态租约
  const deleteMutation = trpc.dhcpStaticLeases.delete.useMutation({
    onSuccess: () => {
      toast.success("静态租约已删除(需应用配置)");
      utils.dhcpStaticLeases.getAll.invalidate();
      utils.dhcpStaticLeases.getPendingCount.invalidate();
    },
    onError: (error) => {
      toast.error(`删除失败: ${error.message}`);
    },
  });

  // 应用所有配置
  const applyMutation = trpc.dhcpStaticLeases.applyAll.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success(result.message);
        utils.dhcpStaticLeases.getAll.invalidate();
        utils.dhcpStaticLeases.getPendingCount.invalidate();
      } else {
        toast.error(result.message);
      }
    },
    onError: (error) => {
      toast.error(`应用失败: ${error.message}`);
    },
  });

  // 复位未应用的修改
  const revertMutation = trpc.dhcpStaticLeases.revert.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success(result.message);
        utils.dhcpStaticLeases.getAll.invalidate();
        utils.dhcpStaticLeases.getPendingCount.invalidate();
      } else {
        toast.error(result.message);
      }
    },
    onError: (error) => {
      toast.error(`复位失败: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      macAddress: "",
      ipAddress: "",
      hostname: "",
      description: "",
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSubmit = () => {
    if (!formData.macAddress || !formData.ipAddress) {
      toast.error("MAC地址和IP地址为必填项");
      return;
    }

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        ...formData,
      });
    } else {
      createMutation.mutate({
        networkPortId,
        ...formData,
        enabled: 1,
      });
    }
  };

  const handleEdit = (lease: any) => {
    setEditingId(lease.id);
    setFormData({
      macAddress: lease.macAddress,
      ipAddress: lease.ipAddress,
      hostname: lease.hostname || "",
      description: lease.description || "",
    });
    setIsAdding(false);
  };

  const handleDelete = (id: number) => {
    if (confirm("确定要删除此静态租约吗?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleApply = () => {
    if (confirm("确定要应用所有静态租约配置到系统吗? 这将重启dnsmasq服务。")) {
      applyMutation.mutate();
    }
  };

  const handleRevert = () => {
    if (confirm("确定要放弃所有未应用的修改吗?")) {
      revertMutation.mutate();
    }
  };

  const pendingCount = pendingData?.count || 0;
  const hasPendingChanges = pendingCount > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>DHCP静态地址分配</DialogTitle>
          <DialogDescription>
            配置MAC地址与IP地址的静态绑定关系
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="macAddress">MAC地址 *</Label>
                  <Input
                    id="macAddress"
                    placeholder="aa:bb:cc:dd:ee:ff"
                    value={formData.macAddress}
                    onChange={(e) =>
                      setFormData({ ...formData, macAddress: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="ipAddress">IP地址 *</Label>
                  <Input
                    id="ipAddress"
                    placeholder="192.168.1.100"
                    value={formData.ipAddress}
                    onChange={(e) =>
                      setFormData({ ...formData, ipAddress: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="hostname">主机名(可选)</Label>
                <Input
                  id="hostname"
                  placeholder="my-device"
                  value={formData.hostname}
                  onChange={(e) =>
                    setFormData({ ...formData, hostname: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="description">描述(可选)</Label>
                <Textarea
                  id="description"
                  placeholder="设备描述信息"
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
              添加静态租约
            </Button>
          )}

          {/* 静态租约列表 */}
          <div className="border border-border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>MAC地址</TableHead>
                  <TableHead>IP地址</TableHead>
                  <TableHead>主机名</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      加载中...
                    </TableCell>
                  </TableRow>
                ) : leases && leases.length > 0 ? (
                  leases.map((lease: any) => (
                    <TableRow key={lease.id}>
                      <TableCell className="font-mono text-sm">
                        {lease.macAddress}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {lease.ipAddress}
                      </TableCell>
                      <TableCell>{lease.hostname || "-"}</TableCell>
                      <TableCell>
                        {lease.pendingChanges === 1 ? (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                            待应用
                          </Badge>
                        ) : lease.applyStatus === "success" ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            已应用
                          </Badge>
                        ) : lease.applyStatus === "failed" ? (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            应用失败
                          </Badge>
                        ) : (
                          <Badge variant="outline">未知</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            onClick={() => handleEdit(lease)}
                            variant="ghost"
                            size="sm"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => handleDelete(lease.id)}
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
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      暂无静态租约
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <DialogFooter>
          <div className="flex justify-between w-full">
            <div className="flex gap-2">
              {hasPendingChanges && (
                <Button
                  onClick={handleRevert}
                  variant="outline"
                  disabled={revertMutation.isPending}
                >
                  <X className="w-4 h-4 mr-2" />
                  复位
                </Button>
              )}
            </div>
            <div className="flex gap-2">
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
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
