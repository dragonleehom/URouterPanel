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
import { Wifi, RefreshCw, Power, PowerOff, UserX } from "lucide-react";
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

export default function WirelessManagement() {
  const [showPassword, setShowPassword] = useState(false);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);

  // 检测无线硬件支持
  const { data: capability, isLoading: capabilityLoading } = 
    trpc.wireless.checkCapability.useQuery();

  // 获取无线接口列表
  const { data: interfaces, isLoading: interfacesLoading, refetch: refetchInterfaces } = 
    trpc.wireless.getInterfaces.useQuery(
      undefined,
      { enabled: capability?.hasWirelessHardware === true }
    );

  // 获取WiFi配置
  const { data: config, isLoading: configLoading, refetch: refetchConfig } = 
    trpc.wireless.getConfig.useQuery();

  // 获取WiFi状态
  const { data: status, refetch: refetchStatus } = 
    trpc.wireless.getStatus.useQuery();

  // 获取客户端列表(使用第一个接口)
  const firstInterface = interfaces?.[0]?.interface || "wlan0";
  const { data: clients, refetch: refetchClients } = 
    trpc.wireless.getClients.useQuery(
      { iface: firstInterface },
      { enabled: !!interfaces && interfaces.length > 0 }
    );

  // 配置WiFi mutation
  const configureWiFiMutation = trpc.wireless.configure.useMutation({
    onSuccess: () => {
      toast.success("WiFi配置成功");
      refetchConfig();
      refetchStatus();
      setConfigDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`配置失败: ${error.message}`);
    },
  });

  // 启动WiFi mutation
  const startWiFiMutation = trpc.wireless.start.useMutation({
    onSuccess: () => {
      toast.success("WiFi已启动");
      refetchStatus();
    },
    onError: (error) => {
      toast.error(`启动失败: ${error.message}`);
    },
  });

  // 停止WiFi mutation
  const stopWiFiMutation = trpc.wireless.stop.useMutation({
    onSuccess: () => {
      toast.success("WiFi已停止");
      refetchStatus();
    },
    onError: (error) => {
      toast.error(`停止失败: ${error.message}`);
    },
  });

  // 重启WiFi mutation
  const restartWiFiMutation = trpc.wireless.restart.useMutation({
    onSuccess: () => {
      toast.success("WiFi已重启");
      refetchStatus();
      refetchClients();
    },
    onError: (error) => {
      toast.error(`重启失败: ${error.message}`);
    },
  });

  // 断开客户端mutation
  const disconnectClientMutation = trpc.wireless.disconnectClient.useMutation({
    onSuccess: () => {
      toast.success("客户端已断开");
      refetchClients();
    },
    onError: (error) => {
      toast.error(`断开失败: ${error.message}`);
    },
  });

  // 配置表单状态
  const [formData, setFormData] = useState({
    ssid: "",
    password: "",
    channel: "auto",
    encryption: "wpa2",
    hidden: false,
  });

  // 加载配置到表单
  const loadConfigToForm = () => {
    if (config) {
      setFormData({
        ssid: config.ssid || "",
        password: config.password || "",
        channel: config.channel?.toString() || "auto",
        encryption: config.encryption || "wpa2",
        hidden: config.hidden || false,
      });
      setConfigDialogOpen(true);
    }
  };

  // 提交配置
  const handleSubmitConfig = () => {
    if (!formData.ssid) {
      toast.error("请输入SSID");
      return;
    }
    if (!formData.password || formData.password.length < 8) {
      toast.error("密码至少8位");
      return;
    }

    configureWiFiMutation.mutate({
      ssid: formData.ssid,
      password: formData.password,
      channel: formData.channel === "auto" ? 0 : parseInt(formData.channel),
      encryption: formData.encryption,
      hidden: formData.hidden,
    });
  };

  // 断开客户端
  const handleDisconnectClient = (mac: string) => {
    if (confirm(`确定要断开客户端 ${mac} 吗?`)) {
      disconnectClientMutation.mutate({
        iface: firstInterface,
        mac: mac,
      });
    }
  };

  if (interfacesLoading || configLoading) {
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
          <h1 className="text-3xl font-bold">无线网络</h1>
          <p className="text-muted-foreground mt-1">
            管理WiFi热点和客户端连接
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetchInterfaces();
              refetchConfig();
              refetchStatus();
              refetchClients();
            }}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            刷新
          </Button>
          {status?.running ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => stopWiFiMutation.mutate()}
              disabled={stopWiFiMutation.isPending}
            >
              <PowerOff className="w-4 h-4 mr-2" />
              停止WiFi
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => startWiFiMutation.mutate()}
              disabled={startWiFiMutation.isPending}
            >
              <Power className="w-4 h-4 mr-2" />
              启动WiFi
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => restartWiFiMutation.mutate()}
            disabled={restartWiFiMutation.isPending}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            重启WiFi
          </Button>
        </div>
      </div>

      {/* 硬件检测提示 */}
      {capabilityLoading && (
        <Card className="p-6 bg-blue-50 border-blue-200">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
            <p className="text-blue-900">正在检测无线硬件...</p>
          </div>
        </Card>
      )}

      {!capabilityLoading && capability && !capability.hasWirelessHardware && (
        <Card className="p-6 bg-yellow-50 border-yellow-200">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Wifi className="w-6 h-6 text-yellow-600" />
              <h3 className="text-lg font-semibold text-yellow-900">未检测到无线网卡</h3>
            </div>
            <p className="text-yellow-800 whitespace-pre-line">{capability.message}</p>
            <div className="mt-4 p-4 bg-white rounded-md border border-yellow-200">
              <p className="text-sm font-medium text-gray-900 mb-2">解决方案:</p>
              <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                <li>检查硬件是否正确安装并连接</li>
                <li>确认无线网卡驱动已加载: <code className="bg-gray-100 px-1 rounded">lsmod | grep -i wifi</code></li>
                <li>尝试安装驱动: <code className="bg-gray-100 px-1 rounded">sudo apt install linux-firmware</code></li>
                <li>考虑使用USB无线网卡</li>
              </ul>
            </div>
          </div>
        </Card>
      )}

      {!capabilityLoading && capability && capability.hasWirelessHardware && capability.devices.length > 0 && (
        <Card className="p-6 bg-green-50 border-green-200">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Wifi className="w-6 h-6 text-green-600" />
              <h3 className="text-lg font-semibold text-green-900">检测到无线硬件</h3>
            </div>
            <p className="text-green-800">{capability.message}</p>
            <div className="mt-4 space-y-2">
              {capability.devices.map((device, index) => (
                <div key={index} className="p-3 bg-white rounded-md border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{device.interface}</p>
                      <p className="text-sm text-gray-600">驱动: {device.driver} | 芯片: {device.chipset}</p>
                    </div>
                    {device.supported ? (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">已支持</span>
                    ) : (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">需配置</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* 状态卡片 */}
      {capability?.hasWirelessHardware && (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Wifi className="w-8 h-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">WiFi状态</p>
              <p className="text-2xl font-bold">
                {status?.running ? "运行中" : "已停止"}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div>
            <p className="text-sm text-muted-foreground">接口数量</p>
            <p className="text-2xl font-bold">{status?.interface_count || 0}</p>
          </div>
        </Card>
        <Card className="p-4">
          <div>
            <p className="text-sm text-muted-foreground">已连接客户端</p>
            <p className="text-2xl font-bold">{clients?.length || 0}</p>
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
      )}

      {capability?.hasWirelessHardware && (
      <Tabs defaultValue="config" className="space-y-4">
        <TabsList>
          <TabsTrigger value="config">WiFi配置</TabsTrigger>
          <TabsTrigger value="interfaces">无线接口</TabsTrigger>
          <TabsTrigger value="clients">已连接客户端</TabsTrigger>
        </TabsList>

        {/* WiFi配置标签页 */}
        <TabsContent value="config" className="space-y-4">
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">当前配置</h3>
                <Button onClick={loadConfigToForm}>编辑配置</Button>
              </div>

              {config ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>SSID</Label>
                    <p className="text-sm mt-1">{config.ssid || "未配置"}</p>
                  </div>
                  <div>
                    <Label>加密方式</Label>
                    <p className="text-sm mt-1">{config.encryption || "未配置"}</p>
                  </div>
                  <div>
                    <Label>信道</Label>
                    <p className="text-sm mt-1">
                      {config.channel === 0 ? "自动" : config.channel || "未配置"}
                    </p>
                  </div>
                  <div>
                    <Label>隐藏SSID</Label>
                    <p className="text-sm mt-1">{config.hidden ? "是" : "否"}</p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">暂无配置信息</p>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* 无线接口标签页 */}
        <TabsContent value="interfaces" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">无线接口列表</h3>
            {interfaces && interfaces.length > 0 ? (
              <div className="space-y-2">
                {interfaces.map((iface: any) => (
                  <div
                    key={iface.name}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{iface.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {iface.mac || "无MAC地址"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">{iface.type || "未知类型"}</p>
                      <p className="text-xs text-muted-foreground">
                        {iface.status || "未知状态"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">未检测到无线接口</p>
            )}
          </Card>
        </TabsContent>

        {/* 已连接客户端标签页 */}
        <TabsContent value="clients" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">已连接客户端</h3>
            {clients && clients.length > 0 ? (
              <div className="space-y-2">
                {clients.map((client: any) => (
                  <div
                    key={client.mac}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{client.mac}</p>
                      <p className="text-sm text-muted-foreground">
                        信号: {client.signal || "未知"}dBm
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDisconnectClient(client.mac)}
                      disabled={disconnectClientMutation.isPending}
                    >
                      <UserX className="w-4 h-4 mr-2" />
                      断开
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">暂无客户端连接</p>
            )}
          </Card>
        </TabsContent>
      </Tabs>
      )}

      {/* 配置对话框 */}
      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>WiFi配置</DialogTitle>
            <DialogDescription>
              配置WiFi热点参数
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="ssid">SSID</Label>
              <Input
                id="ssid"
                value={formData.ssid}
                onChange={(e) => setFormData({ ...formData, ssid: e.target.value })}
                placeholder="输入WiFi名称"
              />
            </div>
            <div>
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="至少8位"
              />
            </div>
            <div>
              <Label htmlFor="encryption">加密方式</Label>
              <Select
                value={formData.encryption}
                onValueChange={(value) => setFormData({ ...formData, encryption: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wpa2">WPA2</SelectItem>
                  <SelectItem value="wpa3">WPA3</SelectItem>
                  <SelectItem value="wpa2-wpa3">WPA2/WPA3混合</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="channel">信道</Label>
              <Select
                value={formData.channel}
                onValueChange={(value) => setFormData({ ...formData, channel: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">自动</SelectItem>
                  <SelectItem value="1">1 (2.4GHz)</SelectItem>
                  <SelectItem value="6">6 (2.4GHz)</SelectItem>
                  <SelectItem value="11">11 (2.4GHz)</SelectItem>
                  <SelectItem value="36">36 (5GHz)</SelectItem>
                  <SelectItem value="40">40 (5GHz)</SelectItem>
                  <SelectItem value="44">44 (5GHz)</SelectItem>
                  <SelectItem value="48">48 (5GHz)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="hidden">隐藏SSID</Label>
              <Switch
                id="hidden"
                checked={formData.hidden}
                onCheckedChange={(checked) => setFormData({ ...formData, hidden: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfigDialogOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleSubmitConfig}
              disabled={configureWiFiMutation.isPending}
            >
              {configureWiFiMutation.isPending ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
