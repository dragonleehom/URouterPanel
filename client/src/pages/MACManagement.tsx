/**
 * MAC地址管理页面
 * MAC地址过滤(ACL)、克隆和IP绑定
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check, Copy, Edit, Link, Plus, Shield, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

interface MACFilterRule {
  id: string;
  mac: string;
  description: string;
  action: "allow" | "deny";
  enabled: boolean;
}

interface MACBinding {
  id: string;
  mac: string;
  ip: string;
  hostname: string;
  enabled: boolean;
}

export default function MACManagement() {
  const [filterMode, setFilterMode] = useState<"whitelist" | "blacklist">("whitelist");
  const [filterEnabled, setFilterEnabled] = useState(true);
  const [cloneEnabled, setCloneEnabled] = useState(false);
  const [clonedMAC, setClonedMAC] = useState("00:11:22:33:44:55");
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [showBindingDialog, setShowBindingDialog] = useState(false);
  const [editingFilter, setEditingFilter] = useState<MACFilterRule | null>(null);
  const [editingBinding, setEditingBinding] = useState<MACBinding | null>(null);

  // MAC过滤规则
  const [filterRules, setFilterRules] = useState<MACFilterRule[]>([
    {
      id: "1",
      mac: "AA:BB:CC:DD:EE:FF",
      description: "办公电脑",
      action: "allow",
      enabled: true,
    },
    {
      id: "2",
      mac: "11:22:33:44:55:66",
      description: "家庭设备",
      action: "allow",
      enabled: true,
    },
    {
      id: "3",
      mac: "77:88:99:AA:BB:CC",
      description: "访客设备",
      action: "deny",
      enabled: false,
    },
  ]);

  // MAC-IP绑定
  const [bindings, setBindings] = useState<MACBinding[]>([
    {
      id: "1",
      mac: "AA:BB:CC:DD:EE:FF",
      ip: "192.168.1.100",
      hostname: "Desktop-PC",
      enabled: true,
    },
    {
      id: "2",
      mac: "11:22:33:44:55:66",
      ip: "192.168.1.101",
      hostname: "Laptop",
      enabled: true,
    },
    {
      id: "3",
      mac: "77:88:99:AA:BB:CC",
      ip: "192.168.1.102",
      hostname: "Smart-TV",
      enabled: true,
    },
  ]);

  const handleAddFilter = () => {
    setEditingFilter(null);
    setShowFilterDialog(true);
  };

  const handleEditFilter = (rule: MACFilterRule) => {
    setEditingFilter(rule);
    setShowFilterDialog(true);
  };

  const handleDeleteFilter = (id: string) => {
    setFilterRules(filterRules.filter((r) => r.id !== id));
    toast.success("已删除MAC过滤规则");
  };

  const handleToggleFilter = (id: string) => {
    setFilterRules(
      filterRules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
    toast.success("已更新规则状态");
  };

  const handleAddBinding = () => {
    setEditingBinding(null);
    setShowBindingDialog(true);
  };

  const handleEditBinding = (binding: MACBinding) => {
    setEditingBinding(binding);
    setShowBindingDialog(true);
  };

  const handleDeleteBinding = (id: string) => {
    setBindings(bindings.filter((b) => b.id !== id));
    toast.success("已删除MAC-IP绑定");
  };

  const handleToggleBinding = (id: string) => {
    setBindings(
      bindings.map((b) => (b.id === id ? { ...b, enabled: !b.enabled } : b))
    );
    toast.success("已更新绑定状态");
  };

  const handleCloneMAC = () => {
    toast.success(`已克隆MAC地址: ${clonedMAC}`);
  };

  const handleDetectMAC = () => {
    // 模拟检测当前设备MAC
    const detectedMAC = "AA:BB:CC:DD:EE:FF";
    setClonedMAC(detectedMAC);
    toast.success(`已检测到MAC地址: ${detectedMAC}`);
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* 页面标题 */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">MAC地址管理</h1>
          <p className="text-sm text-gray-600 mt-1">
            MAC地址过滤、克隆和IP绑定配置
          </p>
        </div>

        {/* 标签页内容 */}
        <Tabs defaultValue="filter" className="space-y-4">
          <TabsList>
            <TabsTrigger value="filter">MAC过滤(ACL)</TabsTrigger>
            <TabsTrigger value="clone">MAC克隆</TabsTrigger>
            <TabsTrigger value="binding">MAC-IP绑定</TabsTrigger>
          </TabsList>

          {/* MAC过滤 */}
          <TabsContent value="filter" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>MAC地址过滤</CardTitle>
                    <CardDescription>
                      控制哪些设备可以连接到网络(基于MAC地址)
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="filter-enabled">启用过滤</Label>
                      <Switch
                        id="filter-enabled"
                        checked={filterEnabled}
                        onCheckedChange={setFilterEnabled}
                      />
                    </div>
                    <Button onClick={handleAddFilter}>
                      <Plus className="w-4 h-4 mr-2" />
                      添加规则
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 过滤模式 */}
                <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <div className="flex-1">
                    <Label htmlFor="filter-mode" className="text-sm font-medium">
                      过滤模式
                    </Label>
                    <p className="text-xs text-gray-600 mt-1">
                      {filterMode === "whitelist"
                        ? "白名单模式: 只允许列表中的设备连接"
                        : "黑名单模式: 阻止列表中的设备连接"}
                    </p>
                  </div>
                  <Select value={filterMode} onValueChange={(v: any) => setFilterMode(v)}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="whitelist">白名单</SelectItem>
                      <SelectItem value="blacklist">黑名单</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 规则列表 */}
                <div className="space-y-2">
                  {filterRules.map((rule) => (
                    <div
                      key={rule.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <Switch
                          checked={rule.enabled}
                          onCheckedChange={() => handleToggleFilter(rule.id)}
                        />
                        <div>
                          <div className="font-medium font-mono">{rule.mac}</div>
                          <div className="text-sm text-gray-600">{rule.description}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={rule.action === "allow" ? "default" : "destructive"}>
                          {rule.action === "allow" ? "允许" : "拒绝"}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditFilter(rule)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteFilter(rule.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* MAC克隆 */}
          <TabsContent value="clone" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>MAC地址克隆</CardTitle>
                <CardDescription>
                  克隆其他设备的MAC地址,用于绕过ISP的MAC地址绑定
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 启用开关 */}
                <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Copy className="w-5 h-5 text-amber-600" />
                    <div>
                      <Label htmlFor="clone-enabled" className="text-sm font-medium">
                        启用MAC克隆
                      </Label>
                      <p className="text-xs text-gray-600 mt-1">
                        将WAN接口的MAC地址修改为指定地址
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="clone-enabled"
                    checked={cloneEnabled}
                    onCheckedChange={setCloneEnabled}
                  />
                </div>

                {/* MAC地址输入 */}
                <div className="space-y-2">
                  <Label htmlFor="cloned-mac">克隆的MAC地址</Label>
                  <div className="flex gap-2">
                    <Input
                      id="cloned-mac"
                      value={clonedMAC}
                      onChange={(e) => setClonedMAC(e.target.value)}
                      placeholder="00:11:22:33:44:55"
                      className="font-mono"
                    />
                    <Button variant="outline" onClick={handleDetectMAC}>
                      自动检测
                    </Button>
                  </div>
                  <p className="text-xs text-gray-600">
                    输入要克隆的MAC地址,格式: XX:XX:XX:XX:XX:XX
                  </p>
                </div>

                {/* 当前MAC信息 */}
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">当前WAN MAC:</span>
                    <span className="font-mono font-medium">00:11:22:33:44:55</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">克隆后MAC:</span>
                    <span className="font-mono font-medium text-blue-600">
                      {cloneEnabled ? clonedMAC : "未启用"}
                    </span>
                  </div>
                </div>

                {/* 应用按钮 */}
                <div className="flex justify-end">
                  <Button onClick={handleCloneMAC}>
                    <Check className="w-4 h-4 mr-2" />
                    应用克隆
                  </Button>
                </div>

                {/* 使用说明 */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-sm mb-2">使用说明</h4>
                  <ul className="text-xs text-gray-700 space-y-1 list-disc list-inside">
                    <li>某些ISP会绑定用户设备的MAC地址</li>
                    <li>更换路由器后可能无法上网,需要克隆原设备的MAC地址</li>
                    <li>点击"自动检测"可以获取当前连接设备的MAC地址</li>
                    <li>修改MAC地址后需要重启WAN接口才能生效</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* MAC-IP绑定 */}
          <TabsContent value="binding" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>MAC-IP绑定</CardTitle>
                    <CardDescription>
                      将设备的MAC地址绑定到固定IP,防止IP冲突
                    </CardDescription>
                  </div>
                  <Button onClick={handleAddBinding}>
                    <Plus className="w-4 h-4 mr-2" />
                    添加绑定
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {bindings.map((binding) => (
                  <div
                    key={binding.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <Switch
                        checked={binding.enabled}
                        onCheckedChange={() => handleToggleBinding(binding.id)}
                      />
                      <Link className="w-5 h-5 text-blue-600" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium">{binding.mac}</span>
                          <span className="text-gray-400">→</span>
                          <span className="font-mono font-medium text-blue-600">
                            {binding.ip}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">{binding.hostname}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditBinding(binding)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteBinding(binding.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* 使用说明 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">使用说明</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-700 space-y-2 list-disc list-inside">
                  <li>MAC-IP绑定可以确保设备始终获得相同的IP地址</li>
                  <li>适用于需要固定IP的设备,如服务器、NAS、打印机等</li>
                  <li>绑定的IP地址应该在DHCP地址池之外,避免冲突</li>
                  <li>修改绑定后,设备需要重新获取IP地址才能生效</li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* 添加/编辑过滤规则对话框 */}
        <Dialog open={showFilterDialog} onOpenChange={setShowFilterDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingFilter ? "编辑过滤规则" : "添加过滤规则"}
              </DialogTitle>
              <DialogDescription>
                配置MAC地址过滤规则
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="filter-mac">MAC地址</Label>
                <Input
                  id="filter-mac"
                  placeholder="AA:BB:CC:DD:EE:FF"
                  className="font-mono"
                  defaultValue={editingFilter?.mac}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="filter-desc">描述</Label>
                <Input
                  id="filter-desc"
                  placeholder="设备描述"
                  defaultValue={editingFilter?.description}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="filter-action">动作</Label>
                <Select defaultValue={editingFilter?.action || "allow"}>
                  <SelectTrigger id="filter-action">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="allow">允许</SelectItem>
                    <SelectItem value="deny">拒绝</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowFilterDialog(false)}>
                取消
              </Button>
              <Button onClick={() => {
                toast.success(editingFilter ? "已更新规则" : "已添加规则");
                setShowFilterDialog(false);
              }}>
                {editingFilter ? "更新" : "添加"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 添加/编辑绑定对话框 */}
        <Dialog open={showBindingDialog} onOpenChange={setShowBindingDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingBinding ? "编辑MAC-IP绑定" : "添加MAC-IP绑定"}
              </DialogTitle>
              <DialogDescription>
                配置MAC地址和IP地址的绑定关系
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="binding-mac">MAC地址</Label>
                <Input
                  id="binding-mac"
                  placeholder="AA:BB:CC:DD:EE:FF"
                  className="font-mono"
                  defaultValue={editingBinding?.mac}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="binding-ip">IP地址</Label>
                <Input
                  id="binding-ip"
                  placeholder="192.168.1.100"
                  className="font-mono"
                  defaultValue={editingBinding?.ip}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="binding-hostname">主机名</Label>
                <Input
                  id="binding-hostname"
                  placeholder="Desktop-PC"
                  defaultValue={editingBinding?.hostname}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowBindingDialog(false)}>
                取消
              </Button>
              <Button onClick={() => {
                toast.success(editingBinding ? "已更新绑定" : "已添加绑定");
                setShowBindingDialog(false);
              }}>
                {editingBinding ? "更新" : "添加"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
