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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Shield,
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Edit,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { handleApiError } from "@/lib/api-helpers";

// 类型定义
type Protocol = "tcp" | "udp" | "both" | "all";
type Action = "ACCEPT" | "DROP" | "REJECT";

interface FirewallRule {
  id: string;
  name: string;
  chain: string;
  protocol: Protocol;
  sourceIp: string;
  sourcePort: string;
  destIp: string;
  destPort: string;
  action: Action;
  enabled: boolean;
}

export default function FirewallExample() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<FirewallRule | null>(null);
  const [selectedChain, setSelectedChain] = useState<string>("INPUT");

  // 使用tRPC hooks获取数据
  const {
    data: rawRules,
    isPending: isLoading,
    error,
    refetch,
  } = trpc.firewall.getRules.useQuery(
    undefined,
    {
      refetchInterval: 5000, // 每5秒自动刷新
    }
  );

  // 数据适配:将Python API返回的数据转换为前端格式
  const rules: FirewallRule[] = (rawRules as any)?.map((rule: any) => ({
    id: rule.id || rule.num || `rule-${Math.random()}`,
    name: rule.name || rule.comment || '未命名规则',
    chain: rule.chain || selectedChain,
    protocol: rule.protocol || 'all',
    sourceIp: rule.source || rule.src || '0.0.0.0/0',
    sourcePort: rule.sport || rule.source_port || '*',
    destIp: rule.destination || rule.dst || '*',
    destPort: rule.dport || rule.dest_port || '*',
    action: rule.target || rule.action || 'ACCEPT',
    enabled: rule.enabled !== false,
  })) || [];

  // 添加规则mutation
  const addRuleMutation = trpc.firewall.addRule.useMutation({
    onSuccess: () => {
      toast.success("防火墙规则添加成功");
      setIsAddDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      handleApiError(error, "添加防火墙规则");
    },
  });

  // 删除规则mutation
  const deleteRuleMutation = trpc.firewall.deleteRule.useMutation({
    onSuccess: () => {
      toast.success("防火墙规则删除成功");
      refetch();
    },
    onError: (error) => {
      handleApiError(error, "删除防火墙规则");
    },
  });

  // 更新规则mutation
  const updateRuleMutation = trpc.firewall.updateRule.useMutation({
    onSuccess: () => {
      toast.success("防火墙规则更新成功");
      setIsEditDialogOpen(false);
      setSelectedRule(null);
      refetch();
    },
    onError: (error) => {
      handleApiError(error, "更新防火墙规则");
    },
  });

  // 启用规则mutation
  const enableRuleMutation = trpc.firewall.enableRule.useMutation({
    onSuccess: () => {
      toast.success("规则已启用");
      refetch();
    },
    onError: (error: any) => {
      handleApiError(error, "启用规则");
    },
  });

  // 禁用规则mutation
  const disableRuleMutation = trpc.firewall.disableRule.useMutation({
    onSuccess: () => {
      toast.success("规则已禁用");
      refetch();
    },
    onError: (error: any) => {
      handleApiError(error, "禁用规则");
    },
  });

  const handleAddRule = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const rule = {
      name: formData.get("name") as string,
      chain: formData.get("chain") as string,
      protocol: formData.get("protocol") as Protocol,
      sourceIp: formData.get("sourceIp") as string,
      sourcePort: formData.get("sourcePort") as string,
      destIp: formData.get("destIp") as string,
      destPort: formData.get("destPort") as string,
      action: formData.get("action") as Action,
      enabled: true,
    };
    addRuleMutation.mutate(rule);
  };

  const handleUpdateRule = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedRule) return;
    
    const formData = new FormData(e.currentTarget);
    const updatedRule = {
      ...selectedRule,
      name: formData.get("name") as string,
      protocol: formData.get("protocol") as Protocol,
      sourceIp: formData.get("sourceIp") as string,
      sourcePort: formData.get("sourcePort") as string,
      destIp: formData.get("destIp") as string,
      destPort: formData.get("destPort") as string,
      action: formData.get("action") as Action,
    };
    
    updateRuleMutation.mutate({
      ruleId: selectedRule.id,
      rule: updatedRule,
    });
  };

  const handleDeleteRule = (ruleId: string) => {
    if (confirm("确定要删除这条规则吗?")) {
      deleteRuleMutation.mutate({ ruleId });
    }
  };

  const handleToggleRule = (ruleId: string, enabled: boolean) => {
    if (enabled) {
      disableRuleMutation.mutate({ ruleId });
    } else {
      enableRuleMutation.mutate({ ruleId });
    }
  };

  const handleEditRule = (rule: FirewallRule) => {
    setSelectedRule(rule);
    setIsEditDialogOpen(true);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            防火墙管理(API集成示例)
          </h1>
          <p className="text-muted-foreground mt-1">
            这是一个使用真实API的简化示例页面,展示如何集成tRPC API
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            刷新
          </Button>
          <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            添加规则
          </Button>
        </div>
      </div>

      {/* 链选择器 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Label>防火墙链:</Label>
            <Select value={selectedChain} onValueChange={setSelectedChain}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INPUT">INPUT</SelectItem>
                <SelectItem value="OUTPUT">OUTPUT</SelectItem>
                <SelectItem value="FORWARD">FORWARD</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 规则列表 */}
      <Card>
        <CardHeader>
          <CardTitle>防火墙规则列表</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-4">
              加载失败: {error.message}
            </div>
          )}

          {isLoading && (
            <div className="text-center py-8 text-muted-foreground">
              加载中...
            </div>
          )}

          {!isLoading && rules.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              暂无规则
            </div>
          )}

          {!isLoading && rules.length > 0 && (
            <div className="space-y-2">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{rule.name}</span>
                      <Badge variant={rule.enabled ? "default" : "secondary"}>
                        {rule.enabled ? "启用" : "禁用"}
                      </Badge>
                      <Badge variant="outline">{rule.chain}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {rule.protocol.toUpperCase()} | {rule.sourceIp}:{rule.sourcePort} → {rule.destIp}:{rule.destPort} | {rule.action}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleRule(rule.id, rule.enabled)}
                      disabled={enableRuleMutation.isPending || disableRuleMutation.isPending}
                    >
                      {rule.enabled ? (
                        <XCircle className="h-4 w-4" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditRule(rule)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteRule(rule.id)}
                      disabled={deleteRuleMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 添加规则对话框 */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>添加防火墙规则</DialogTitle>
            <DialogDescription>
              配置新的防火墙规则
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddRule}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">规则名称</Label>
                  <Input id="name" name="name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="chain">链</Label>
                  <Select name="chain" defaultValue="INPUT" required>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INPUT">INPUT</SelectItem>
                      <SelectItem value="OUTPUT">OUTPUT</SelectItem>
                      <SelectItem value="FORWARD">FORWARD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="protocol">协议</Label>
                  <Select name="protocol" defaultValue="tcp" required>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tcp">TCP</SelectItem>
                      <SelectItem value="udp">UDP</SelectItem>
                      <SelectItem value="both">TCP+UDP</SelectItem>
                      <SelectItem value="all">ALL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="action">动作</Label>
                  <Select name="action" defaultValue="ACCEPT" required>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACCEPT">ACCEPT</SelectItem>
                      <SelectItem value="DROP">DROP</SelectItem>
                      <SelectItem value="REJECT">REJECT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sourceIp">源IP</Label>
                  <Input
                    id="sourceIp"
                    name="sourceIp"
                    placeholder="0.0.0.0/0"
                    defaultValue="0.0.0.0/0"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sourcePort">源端口</Label>
                  <Input
                    id="sourcePort"
                    name="sourcePort"
                    placeholder="*"
                    defaultValue="*"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="destIp">目标IP</Label>
                  <Input
                    id="destIp"
                    name="destIp"
                    placeholder="*"
                    defaultValue="*"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="destPort">目标端口</Label>
                  <Input
                    id="destPort"
                    name="destPort"
                    placeholder="80"
                    required
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
                取消
              </Button>
              <Button type="submit" disabled={addRuleMutation.isPending}>
                {addRuleMutation.isPending ? "添加中..." : "添加"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 编辑规则对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>编辑防火墙规则</DialogTitle>
            <DialogDescription>
              修改现有的防火墙规则
            </DialogDescription>
          </DialogHeader>
          {selectedRule && (
            <form onSubmit={handleUpdateRule}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">规则名称</Label>
                    <Input
                      id="edit-name"
                      name="name"
                      defaultValue={selectedRule.name}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>链</Label>
                    <Input value={selectedRule.chain} disabled />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-protocol">协议</Label>
                    <Select
                      name="protocol"
                      defaultValue={selectedRule.protocol}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tcp">TCP</SelectItem>
                        <SelectItem value="udp">UDP</SelectItem>
                        <SelectItem value="both">TCP+UDP</SelectItem>
                        <SelectItem value="all">ALL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-action">动作</Label>
                    <Select
                      name="action"
                      defaultValue={selectedRule.action}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACCEPT">ACCEPT</SelectItem>
                        <SelectItem value="DROP">DROP</SelectItem>
                        <SelectItem value="REJECT">REJECT</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-sourceIp">源IP</Label>
                    <Input
                      id="edit-sourceIp"
                      name="sourceIp"
                      defaultValue={selectedRule.sourceIp}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-sourcePort">源端口</Label>
                    <Input
                      id="edit-sourcePort"
                      name="sourcePort"
                      defaultValue={selectedRule.sourcePort}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-destIp">目标IP</Label>
                    <Input
                      id="edit-destIp"
                      name="destIp"
                      defaultValue={selectedRule.destIp}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-destPort">目标端口</Label>
                    <Input
                      id="edit-destPort"
                      name="destPort"
                      defaultValue={selectedRule.destPort}
                      required
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setSelectedRule(null);
                  }}
                >
                  取消
                </Button>
                <Button type="submit" disabled={updateRuleMutation.isPending}>
                  {updateRuleMutation.isPending ? "更新中..." : "更新"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
