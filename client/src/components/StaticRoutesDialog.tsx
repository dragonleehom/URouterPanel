/**
 * 静态路由管理对话框
 * 用于管理系统静态路由配置
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
import { Plus, Trash2, Edit, Save, X, CheckCircle2, Route, Power, PowerOff } from "lucide-react";

interface StaticRoutesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface RouteFormData {
  name: string;
  interface: string;
  target: string;
  netmask: string;
  gateway: string;
  metric: number;
  mtu: string;
  table: string;
  type: string;
}

const ROUTE_TYPES = [
  { value: "unicast", label: "单播(Unicast)" },
  { value: "local", label: "本地(Local)" },
  { value: "broadcast", label: "广播(Broadcast)" },
  { value: "multicast", label: "多播(Multicast)" },
  { value: "unreachable", label: "不可达(Unreachable)" },
  { value: "prohibit", label: "禁止(Prohibit)" },
  { value: "blackhole", label: "黑洞(Blackhole)" },
  { value: "anycast", label: "任播(Anycast)" },
];

export function StaticRoutesDialog({
  open,
  onOpenChange,
}: StaticRoutesDialogProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<RouteFormData>({
    name: "",
    interface: "",
    target: "",
    netmask: "",
    gateway: "",
    metric: 0,
    mtu: "",
    table: "",
    type: "unicast",
  });

  const utils = trpc.useUtils();

  // 查询静态路由列表
  const { data: routes, isLoading } = trpc.staticRoute.getAll.useQuery(
    undefined,
    { enabled: open }
  );

  // 创建静态路由
  const createMutation = trpc.staticRoute.create.useMutation({
    onSuccess: () => {
      toast.success("静态路由已添加(未应用)");
      utils.staticRoute.getAll.invalidate();
      resetForm();
    },
    onError: (error) => {
      toast.error(`添加失败: ${error.message}`);
    },
  });

  // 更新静态路由
  const updateMutation = trpc.staticRoute.update.useMutation({
    onSuccess: () => {
      toast.success("静态路由已更新(未应用)");
      utils.staticRoute.getAll.invalidate();
      setEditingId(null);
    },
    onError: (error) => {
      toast.error(`更新失败: ${error.message}`);
    },
  });

  // 删除静态路由
  const deleteMutation = trpc.staticRoute.delete.useMutation({
    onSuccess: () => {
      toast.success("静态路由已删除(需应用配置)");
      utils.staticRoute.getAll.invalidate();
    },
    onError: (error) => {
      toast.error(`删除失败: ${error.message}`);
    },
  });

  // 切换启用状态
  const toggleMutation = trpc.staticRoute.toggleEnabled.useMutation({
    onSuccess: () => {
      toast.success("路由状态已更新(需应用配置)");
      utils.staticRoute.getAll.invalidate();
    },
    onError: (error) => {
      toast.error(`更新失败: ${error.message}`);
    },
  });

  // 应用所有配置
  const applyMutation = trpc.staticRoute.applyAll.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success(result.message);
        utils.staticRoute.getAll.invalidate();
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
      interface: "",
      target: "",
      netmask: "",
      gateway: "",
      metric: 0,
      mtu: "",
      table: "",
      type: "unicast",
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.interface || !formData.target) {
      toast.error("路由名称、接口和目标网络为必填项");
      return;
    }

    const data: any = {
      name: formData.name,
      interface: formData.interface,
      target: formData.target,
      metric: formData.metric,
      type: formData.type as any,
    };

    if (formData.netmask) data.netmask = formData.netmask;
    if (formData.gateway) data.gateway = formData.gateway;
    if (formData.mtu) data.mtu = parseInt(formData.mtu);
    if (formData.table) data.table = formData.table;

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...data });
    } else {
      createMutation.mutate({ ...data, enabled: 1 });
    }
  };

  const handleEdit = (route: any) => {
    setEditingId(route.id);
    setFormData({
      name: route.name,
      interface: route.interface,
      target: route.target,
      netmask: route.netmask || "",
      gateway: route.gateway || "",
      metric: route.metric || 0,
      mtu: route.mtu ? String(route.mtu) : "",
      table: route.table || "",
      type: route.type || "unicast",
    });
    setIsAdding(false);
  };

  const handleDelete = (id: number) => {
    if (confirm("确定要删除此静态路由吗?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleToggle = (id: number, currentEnabled: number) => {
    toggleMutation.mutate({ id, enabled: currentEnabled === 1 ? 0 : 1 });
  };

  const handleApply = () => {
    if (confirm("确定要应用所有静态路由配置到系统吗? 这可能会影响网络连接。")) {
      applyMutation.mutate();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Route className="w-5 h-5" />
            静态路由配置
          </DialogTitle>
          <DialogDescription>
            配置系统静态路由规则,控制网络流量走向
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 添加/编辑表单 */}
          {(isAdding || editingId) && (
            <div className="p-4 border border-border rounded-md space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="name">路由名称 *</Label>
                  <Input
                    id="name"
                    placeholder="default-route"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="interface">出口接口 *</Label>
                  <Input
                    id="interface"
                    placeholder="eth0"
                    value={formData.interface}
                    onChange={(e) =>
                      setFormData({ ...formData, interface: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="target">目标网络 *</Label>
                  <Input
                    id="target"
                    placeholder="0.0.0.0/0 或 192.168.1.0/24"
                    value={formData.target}
                    onChange={(e) =>
                      setFormData({ ...formData, target: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="gateway">网关(可选)</Label>
                  <Input
                    id="gateway"
                    placeholder="192.168.1.1"
                    value={formData.gateway}
                    onChange={(e) =>
                      setFormData({ ...formData, gateway: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="metric">Metric</Label>
                  <Input
                    id="metric"
                    type="number"
                    placeholder="0"
                    value={formData.metric}
                    onChange={(e) =>
                      setFormData({ ...formData, metric: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="mtu">MTU(可选)</Label>
                  <Input
                    id="mtu"
                    type="number"
                    placeholder="1500"
                    value={formData.mtu}
                    onChange={(e) =>
                      setFormData({ ...formData, mtu: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="type">路由类型</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROUTE_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="table">路由表(可选)</Label>
                  <Input
                    id="table"
                    placeholder="main"
                    value={formData.table}
                    onChange={(e) =>
                      setFormData({ ...formData, table: e.target.value })
                    }
                  />
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

          {/* 添加按钮 */}
          {!isAdding && !editingId && (
            <Button onClick={() => setIsAdding(true)} variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              添加静态路由
            </Button>
          )}

          {/* 静态路由列表 */}
          <div className="border border-border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名称</TableHead>
                  <TableHead>接口</TableHead>
                  <TableHead>目标网络</TableHead>
                  <TableHead>网关</TableHead>
                  <TableHead>Metric</TableHead>
                  <TableHead>类型</TableHead>
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
                ) : routes && routes.length > 0 ? (
                  routes.map((route: any) => (
                    <TableRow key={route.id}>
                      <TableCell className="font-medium">{route.name}</TableCell>
                      <TableCell className="font-mono text-sm">{route.interface}</TableCell>
                      <TableCell className="font-mono text-sm">{route.target}</TableCell>
                      <TableCell className="font-mono text-sm">{route.gateway || "-"}</TableCell>
                      <TableCell>{route.metric}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {ROUTE_TYPES.find(t => t.value === route.type)?.label || route.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {route.enabled === 1 ? (
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
                            onClick={() => handleToggle(route.id, route.enabled)}
                            variant="ghost"
                            size="sm"
                            title={route.enabled === 1 ? "禁用" : "启用"}
                          >
                            {route.enabled === 1 ? (
                              <PowerOff className="w-4 h-4" />
                            ) : (
                              <Power className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            onClick={() => handleEdit(route)}
                            variant="ghost"
                            size="sm"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => handleDelete(route.id)}
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
                      暂无静态路由
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
              disabled={applyMutation.isPending}
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
