import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Settings,
  Clock,
  Globe,
  Palette,
  Download,
  Upload,
  Power,
  RefreshCw,
  Save,
  AlertTriangle,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

export default function SystemSettings() {
  const { theme, toggleTheme } = useTheme();
  
  // 系统时间设置
  const [systemTime, setSystemTime] = useState({
    timezone: "Asia/Shanghai",
    ntpEnabled: true,
    ntpServer: "pool.ntp.org",
    currentTime: new Date().toISOString().slice(0, 16),
  });

  // 界面设置
  const [interfaceSettings, setInterfaceSettings] = useState({
    language: "zh-CN",
    dateFormat: "YYYY-MM-DD",
    timeFormat: "24h",
  });

  // 对话框状态
  const [isRestartDialogOpen, setIsRestartDialogOpen] = useState(false);
  const [isShutdownDialogOpen, setIsShutdownDialogOpen] = useState(false);
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);

  const handleSaveTimeSettings = () => {
    // TODO: 调用后端API保存时间设置
    toast.success("时间设置已保存");
  };

  const handleSaveInterfaceSettings = () => {
    // TODO: 调用后端API保存界面设置
    toast.success("界面设置已保存");
  };

  const handleThemeChange = (newTheme: "light" | "dark") => {
    if (theme !== newTheme && toggleTheme) {
      toggleTheme();
      toast.success(`已切换到${newTheme === "light" ? "浅色" : "深色"}主题`);
    }
  };

  const handleExportConfig = () => {
    // 模拟导出配置
    const config = {
      version: "1.0.0",
      exportTime: new Date().toISOString(),
      network: {
        interfaces: [],
        firewall: [],
        dhcp: [],
        dns: [],
      },
      system: {
        time: systemTime,
        interface: interfaceSettings,
      },
    };

    const blob = new Blob([JSON.stringify(config, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `urouteros-config-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success("配置已导出");
  };

  const handleImportConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const config = JSON.parse(e.target?.result as string);
        console.log("导入的配置:", config);
        setIsRestoreDialogOpen(true);
      } catch (error) {
        toast.error("配置文件格式错误");
      }
    };
    reader.readAsText(file);
  };

  const handleRestoreConfig = () => {
    // TODO: 调用后端API恢复配置
    setIsRestoreDialogOpen(false);
    toast.success("配置已恢复,系统将在3秒后重启");
    setTimeout(() => {
      toast.info("系统重启中...");
    }, 3000);
  };

  const handleRestart = () => {
    // TODO: 调用后端API重启系统
    setIsRestartDialogOpen(false);
    toast.success("系统将在10秒后重启");
  };

  const handleShutdown = () => {
    // TODO: 调用后端API关机
    setIsShutdownDialogOpen(false);
    toast.success("系统将在10秒后关机");
  };

  const timezones = [
    { value: "Asia/Shanghai", label: "中国标准时间 (UTC+8)" },
    { value: "Asia/Tokyo", label: "日本标准时间 (UTC+9)" },
    { value: "Asia/Seoul", label: "韩国标准时间 (UTC+9)" },
    { value: "Asia/Hong_Kong", label: "香港时间 (UTC+8)" },
    { value: "Asia/Singapore", label: "新加坡时间 (UTC+8)" },
    { value: "America/New_York", label: "美国东部时间 (UTC-5)" },
    { value: "America/Los_Angeles", label: "美国西部时间 (UTC-8)" },
    { value: "Europe/London", label: "格林威治时间 (UTC+0)" },
    { value: "Europe/Paris", label: "中欧时间 (UTC+1)" },
  ];

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">系统设置</h1>
          <p className="text-sm text-gray-500 mt-1">
            配置系统时间、界面语言、主题和备份恢复
          </p>
        </div>
      </div>

      {/* 标签页 */}
      <Tabs defaultValue="time" className="space-y-4">
        <TabsList>
          <TabsTrigger value="time">
            <Clock className="w-4 h-4 mr-2" />
            时间设置
          </TabsTrigger>
          <TabsTrigger value="interface">
            <Globe className="w-4 h-4 mr-2" />
            界面设置
          </TabsTrigger>
          <TabsTrigger value="theme">
            <Palette className="w-4 h-4 mr-2" />
            主题设置
          </TabsTrigger>
          <TabsTrigger value="backup">
            <Download className="w-4 h-4 mr-2" />
            备份恢复
          </TabsTrigger>
          <TabsTrigger value="power">
            <Power className="w-4 h-4 mr-2" />
            电源管理
          </TabsTrigger>
        </TabsList>

        {/* 时间设置标签页 */}
        <TabsContent value="time" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>系统时间</CardTitle>
              <CardDescription>
                配置系统时区和NTP时间同步
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="current-time">当前时间</Label>
                  <Input
                    id="current-time"
                    type="datetime-local"
                    value={systemTime.currentTime}
                    onChange={(e) =>
                      setSystemTime({ ...systemTime, currentTime: e.target.value })
                    }
                    disabled={systemTime.ntpEnabled}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {systemTime.ntpEnabled
                      ? "NTP同步已启用,时间自动更新"
                      : "手动设置系统时间"}
                  </p>
                </div>

                <div>
                  <Label htmlFor="timezone">时区</Label>
                  <Select
                    value={systemTime.timezone}
                    onValueChange={(value) =>
                      setSystemTime({ ...systemTime, timezone: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timezones.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <Label htmlFor="ntp-enabled">NTP时间同步</Label>
                    <p className="text-xs text-gray-500 mt-1">
                      自动从互联网时间服务器同步时间
                    </p>
                  </div>
                  <Switch
                    id="ntp-enabled"
                    checked={systemTime.ntpEnabled}
                    onCheckedChange={(checked) =>
                      setSystemTime({ ...systemTime, ntpEnabled: checked })
                    }
                  />
                </div>

                {systemTime.ntpEnabled && (
                  <div>
                    <Label htmlFor="ntp-server">NTP服务器</Label>
                    <Input
                      id="ntp-server"
                      value={systemTime.ntpServer}
                      onChange={(e) =>
                        setSystemTime({ ...systemTime, ntpServer: e.target.value })
                      }
                      placeholder="pool.ntp.org"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      常用NTP服务器: pool.ntp.org, time.google.com, ntp.aliyun.com
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveTimeSettings}>
                  <Save className="w-4 h-4 mr-2" />
                  保存设置
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 界面设置标签页 */}
        <TabsContent value="interface" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>界面设置</CardTitle>
              <CardDescription>
                配置界面语言和显示格式
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="language">界面语言</Label>
                <Select
                  value={interfaceSettings.language}
                  onValueChange={(value) =>
                    setInterfaceSettings({ ...interfaceSettings, language: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="zh-CN">简体中文</SelectItem>
                    <SelectItem value="zh-TW">繁體中文</SelectItem>
                    <SelectItem value="en-US">English</SelectItem>
                    <SelectItem value="ja-JP">日本語</SelectItem>
                    <SelectItem value="ko-KR">한국어</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  更改语言后需要刷新页面
                </p>
              </div>

              <div>
                <Label htmlFor="date-format">日期格式</Label>
                <Select
                  value={interfaceSettings.dateFormat}
                  onValueChange={(value) =>
                    setInterfaceSettings({ ...interfaceSettings, dateFormat: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (2026-01-26)</SelectItem>
                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY (26/01/2026)</SelectItem>
                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (01/26/2026)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="time-format">时间格式</Label>
                <Select
                  value={interfaceSettings.timeFormat}
                  onValueChange={(value) =>
                    setInterfaceSettings({ ...interfaceSettings, timeFormat: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24h">24小时制 (13:00)</SelectItem>
                    <SelectItem value="12h">12小时制 (1:00 PM)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveInterfaceSettings}>
                  <Save className="w-4 h-4 mr-2" />
                  保存设置
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 主题设置标签页 */}
        <TabsContent value="theme" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>主题设置</CardTitle>
              <CardDescription>
                选择界面主题和配色方案
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>当前主题</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <button
                    onClick={() => handleThemeChange("light")}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      theme === "light"
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">浅色主题</span>
                      {theme === "light" && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full" />
                      )}
                    </div>
                    <div className="bg-white border border-gray-200 rounded p-3 space-y-2">
                      <div className="h-2 bg-gray-900 rounded w-1/2" />
                      <div className="h-2 bg-gray-400 rounded w-3/4" />
                      <div className="h-2 bg-gray-400 rounded w-2/3" />
                    </div>
                  </button>

                  <button
                    onClick={() => handleThemeChange("dark")}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      theme === "dark"
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">深色主题</span>
                      {theme === "dark" && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full" />
                      )}
                    </div>
                    <div className="bg-gray-900 border border-gray-700 rounded p-3 space-y-2">
                      <div className="h-2 bg-white rounded w-1/2" />
                      <div className="h-2 bg-gray-500 rounded w-3/4" />
                      <div className="h-2 bg-gray-500 rounded w-2/3" />
                    </div>
                  </button>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="font-medium mb-2">主题说明</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 浅色主题: 适合白天使用,减少眼睛疲劳</li>
                  <li>• 深色主题: 适合夜间使用,降低屏幕亮度</li>
                  <li>• 主题设置会立即生效,无需重启</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 备份恢复标签页 */}
        <TabsContent value="backup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>配置备份</CardTitle>
              <CardDescription>
                导出当前系统配置到本地文件
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                备份文件包含网络配置、防火墙规则、DHCP/DNS设置等所有系统配置。
                建议在进行重大配置更改前先备份。
              </p>
              <Button onClick={handleExportConfig}>
                <Download className="w-4 h-4 mr-2" />
                导出配置
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>配置恢复</CardTitle>
              <CardDescription>
                从备份文件恢复系统配置
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">警告</p>
                  <p>
                    恢复配置将覆盖当前所有设置,系统会自动重启。请确保备份文件来源可靠。
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="config-file">选择备份文件</Label>
                <Input
                  id="config-file"
                  type="file"
                  accept=".json"
                  onChange={handleImportConfig}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 电源管理标签页 */}
        <TabsContent value="power" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>电源管理</CardTitle>
              <CardDescription>
                重启或关闭系统
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <RefreshCw className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">重启系统</h3>
                      <p className="text-xs text-gray-500">重新启动路由器</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    重启系统会中断所有网络连接,通常需要1-2分钟完成。
                  </p>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setIsRestartDialogOpen(true)}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    重启
                  </Button>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <Power className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">关闭系统</h3>
                      <p className="text-xs text-gray-500">安全关闭路由器</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    关闭系统会停止所有服务,需要手动开机才能恢复。
                  </p>
                  <Button
                    variant="outline"
                    className="w-full border-red-200 text-red-600 hover:bg-red-50"
                    onClick={() => setIsShutdownDialogOpen(true)}
                  >
                    <Power className="w-4 h-4 mr-2" />
                    关机
                  </Button>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">注意事项</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• 重启或关机前请确保没有重要的数据传输</li>
                  <li>• 建议先备份配置再进行电源操作</li>
                  <li>• 重启过程中请勿断电,以免损坏系统</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 重启确认对话框 */}
      <Dialog open={isRestartDialogOpen} onOpenChange={setIsRestartDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认重启系统</DialogTitle>
            <DialogDescription>
              系统将在10秒后重启,所有网络连接会暂时中断。
            </DialogDescription>
          </DialogHeader>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-800">
              重启过程通常需要1-2分钟,请耐心等待系统恢复。
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRestartDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleRestart}>
              确认重启
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 关机确认对话框 */}
      <Dialog open={isShutdownDialogOpen} onOpenChange={setIsShutdownDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认关闭系统</DialogTitle>
            <DialogDescription>
              系统将在10秒后关机,需要手动开机才能恢复。
            </DialogDescription>
          </DialogHeader>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">
              关机后所有服务将停止,网络连接将完全中断。
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsShutdownDialogOpen(false)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleShutdown}
            >
              确认关机
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 恢复配置确认对话框 */}
      <Dialog open={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认恢复配置</DialogTitle>
            <DialogDescription>
              恢复配置将覆盖当前所有设置,系统会自动重启。
            </DialogDescription>
          </DialogHeader>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-800">
              请确保备份文件来源可靠,错误的配置可能导致系统无法正常工作。
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRestoreDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleRestoreConfig}>
              确认恢复
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
