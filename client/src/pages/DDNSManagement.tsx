/**
 * DDNS动态DNS管理页面
 * 支持多种DDNS服务提供商配置
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertCircle, CheckCircle, Clock, Globe, Plus, RefreshCw, Save, Trash2, XCircle } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

interface DDNSConfig {
  id: string;
  enabled: boolean;
  provider: string;
  hostname: string;
  username: string;
  password: string;
  updateInterval: number;
  lastUpdate: string;
  lastIP: string;
  status: "success" | "failed" | "pending";
}

export default function DDNSManagement() {
  const [ddnsConfigs, setDDNSConfigs] = useState<DDNSConfig[]>([
    {
      id: "1",
      enabled: true,
      provider: "cloudflare",
      hostname: "home.example.com",
      username: "user@example.com",
      password: "********",
      updateInterval: 300,
      lastUpdate: "2024-01-26 14:30:00",
      lastIP: "203.0.113.1",
      status: "success",
    },
    {
      id: "2",
      enabled: false,
      provider: "dyndns",
      hostname: "myrouter.dyndns.org",
      username: "myuser",
      password: "********",
      updateInterval: 600,
      lastUpdate: "2024-01-25 10:15:00",
      lastIP: "203.0.113.2",
      status: "failed",
    },
  ]);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newConfig, setNewConfig] = useState({
    provider: "cloudflare",
    hostname: "",
    username: "",
    password: "",
    updateInterval: "300",
  });

  const ddnsProviders = [
    { value: "cloudflare", label: "Cloudflare" },
    { value: "dyndns", label: "DynDNS" },
    { value: "noip", label: "No-IP" },
    { value: "dnspod", label: "DNSPod (腾讯云)" },
    { value: "aliyun", label: "阿里云 DNS" },
    { value: "he", label: "Hurricane Electric" },
    { value: "custom", label: "自定义" },
  ];

  const handleToggleConfig = (configId: string) => {
    setDDNSConfigs((configs) =>
      configs.map((config) =>
        config.id === configId ? { ...config, enabled: !config.enabled } : config
      )
    );
    toast.success("DDNS配置已更新");
  };

  const handleDeleteConfig = (configId: string) => {
    setDDNSConfigs((configs) => configs.filter((config) => config.id !== configId));
    toast.success("DDNS配置已删除");
  };

  const handleAddConfig = () => {
    const newDDNSConfig: DDNSConfig = {
      id: Date.now().toString(),
      enabled: true,
      provider: newConfig.provider,
      hostname: newConfig.hostname,
      username: newConfig.username,
      password: newConfig.password,
      updateInterval: parseInt(newConfig.updateInterval),
      lastUpdate: "-",
      lastIP: "-",
      status: "pending",
    };
    setDDNSConfigs([...ddnsConfigs, newDDNSConfig]);
    setShowAddDialog(false);
    setNewConfig({
      provider: "cloudflare",
      hostname: "",
      username: "",
      password: "",
      updateInterval: "300",
    });
    toast.success("DDNS配置已添加");
  };

  const handleForceUpdate = (configId: string) => {
    toast.success("正在强制更新DDNS...");
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-600" />;
      case "pending":
        return <Clock className="w-4 h-4 text-gray-400" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge variant="default" className="bg-green-600">成功</Badge>;
      case "failed":
        return <Badge variant="destructive">失败</Badge>;
      case "pending":
        return <Badge variant="secondary">等待中</Badge>;
      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">动态DNS (DDNS)</h1>
            <p className="text-sm text-gray-600 mt-1">
              配置DDNS服务自动更新公网IP地址到域名
            </p>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                添加DDNS配置
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>添加DDNS配置</DialogTitle>
                <DialogDescription>
                  配置新的动态DNS服务
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="provider">服务提供商</Label>
                  <Select
                    value={newConfig.provider}
                    onValueChange={(value) => setNewConfig({ ...newConfig, provider: value })}
                  >
                    <SelectTrigger id="provider">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ddnsProviders.map((provider) => (
                        <SelectItem key={provider.value} value={provider.value}>
                          {provider.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hostname">域名/主机名</Label>
                  <Input
                    id="hostname"
                    value={newConfig.hostname}
                    onChange={(e) => setNewConfig({ ...newConfig, hostname: e.target.value })}
                    placeholder="home.example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">用户名/API Key</Label>
                  <Input
                    id="username"
                    value={newConfig.username}
                    onChange={(e) => setNewConfig({ ...newConfig, username: e.target.value })}
                    placeholder="user@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">密码/API Secret</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newConfig.password}
                    onChange={(e) => setNewConfig({ ...newConfig, password: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="interval">更新间隔(秒)</Label>
                  <Input
                    id="interval"
                    type="number"
                    value={newConfig.updateInterval}
                    onChange={(e) => setNewConfig({ ...newConfig, updateInterval: e.target.value })}
                    placeholder="300"
                  />
                  <p className="text-xs text-gray-500">
                    建议: 300秒 (5分钟)
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  取消
                </Button>
                <Button onClick={handleAddConfig}>
                  <Save className="w-4 h-4 mr-2" />
                  保存配置
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* DDNS配置列表 */}
        <div className="space-y-4">
          {ddnsConfigs.map((config) => (
            <Card key={config.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-blue-600" />
                    <div>
                      <CardTitle className="text-base">{config.hostname}</CardTitle>
                      <CardDescription>
                        {ddnsProviders.find((p) => p.value === config.provider)?.label}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(config.status)}
                    <Switch
                      checked={config.enabled}
                      onCheckedChange={() => handleToggleConfig(config.id)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-xs text-gray-500">当前IP</div>
                    <div className="font-medium">{config.lastIP}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">最后更新</div>
                    <div className="font-medium">{config.lastUpdate}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">更新间隔</div>
                    <div className="font-medium">{config.updateInterval}秒</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleForceUpdate(config.id)}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    强制更新
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteConfig(config.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-600 mr-2" />
                    删除配置
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {ddnsConfigs.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">还没有配置DDNS服务</p>
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  添加DDNS配置
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 使用说明 */}
        <Card>
          <CardHeader>
            <CardTitle>DDNS使用说明</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-700">
                <p className="font-medium mb-1">什么是DDNS?</p>
                <p>
                  动态DNS (DDNS) 服务可以自动将您的动态公网IP地址更新到域名记录,
                  即使IP地址变化也能通过固定域名访问您的路由器和内网服务。
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-700">
                <p className="font-medium mb-1">如何配置?</p>
                <p>
                  1. 在DDNS服务提供商注册账号并获取API凭证<br />
                  2. 添加DDNS配置,填写域名和凭证信息<br />
                  3. 启用配置后系统将自动定期更新IP地址
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-700">
                <p className="font-medium mb-1">注意事项</p>
                <p>
                  • 更新间隔不要设置过短,避免频繁请求被服务商限制<br />
                  • 确保路由器能够获取到真实的公网IP地址<br />
                  • 部分服务商需要在域名管理后台预先创建DNS记录
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
