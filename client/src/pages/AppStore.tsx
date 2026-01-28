/**
 * 应用市场页面
 * 集成1Panel应用市场,提供应用浏览、搜索、安装功能
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Package,
  Search,
  Download,
  Play,
  Square,
  Trash2,
  ExternalLink,
  Github,
  FileText,
  RefreshCw,
  Loader2,
} from "lucide-react";


export default function AppStore() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState("market");

  // 获取应用列表
  const { data: appsData, isLoading: isLoadingApps } = trpc.appStore.list.useQuery({
    page: 1,
    pageSize: 20,
    search: searchQuery || undefined,
    type: selectedType,
  });

  // 获取已安装应用
  const { data: installedApps, isLoading: isLoadingInstalled } = trpc.appStore.installed.useQuery();

  // 安装应用
  const installMutation = trpc.appStore.install.useMutation({
    onSuccess: () => {
      alert("应用正在后台安装,请稍候...");
    },
    onError: (error) => {
      alert(`安装失败: ${error.message}`);
    },
  });

  // 卸载应用
  const uninstallMutation = trpc.appStore.uninstall.useMutation({
    onSuccess: () => {
      alert("应用已成功卸载");
    },
    onError: (error) => {
      alert(`卸载失败: ${error.message}`);
    },
  });

  // 同步应用仓库
  const syncMutation = trpc.appStore.syncRepo.useMutation({
    onSuccess: (data) => {
      alert(data.message);
      // 刷新应用列表
      window.location.reload();
    },
    onError: (error) => {
      alert(`同步失败: ${error.message}`);
    },
  });

  // 控制应用
  const controlMutation = trpc.appStore.control.useMutation({
    onSuccess: (data) => {
      alert(data.message);
    },
    onError: (error) => {
      alert(`操作失败: ${error.message}`);
    },
  });

  const handleInstall = (appKey: string, version: string) => {
    installMutation.mutate({
      appKey,
      version,
    });
  };

  const handleUninstall = (installedId: number) => {
    if (confirm("确定要卸载此应用吗?")) {
      uninstallMutation.mutate({ installedId });
    }
  };

  const handleControl = (installedId: number, action: "start" | "stop" | "restart") => {
    controlMutation.mutate({ installedId, action });
  };

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">应用市场</h1>
          <p className="text-sm text-gray-500 mt-1">集成1Panel应用市场,快速部署各类应用</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${syncMutation.isPending ? "animate-spin" : ""}`} />
          {syncMutation.isPending ? "同步中..." : "同步应用仓库"}
        </Button>
      </div>

      {/* 标签页 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="market">应用市场</TabsTrigger>
          <TabsTrigger value="installed">已安装</TabsTrigger>
        </TabsList>

        {/* 应用市场标签页 */}
        <TabsContent value="market" className="space-y-4">
          {/* 搜索和筛选 */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="搜索应用..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={selectedType === undefined ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedType(undefined)}
              >
                全部
              </Button>
              <Button
                variant={selectedType === "website" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedType("website")}
              >
                网站
              </Button>
              <Button
                variant={selectedType === "tool" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedType("tool")}
              >
                工具
              </Button>
              <Button
                variant={selectedType === "database" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedType("database")}
              >
                数据库
              </Button>
            </div>
          </div>

          {/* 应用列表 */}
          {isLoadingApps ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : appsData && appsData.apps.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {appsData.apps.map((app: any) => (
                <Card key={app.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-lg bg-white border flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {app.iconUrl ? (
                          <img 
                            src={app.iconUrl} 
                            alt={app.name}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              // 图标加载失败时显示默认图标
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.parentElement!.innerHTML = '<svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>';
                            }}
                          />
                        ) : (
                          <Package className="w-6 h-6 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg">{app.name}</CardTitle>
                        <CardDescription className="text-sm line-clamp-2">
                          {app.shortDesc}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* 标签 */}
                    {app.tags && app.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {app.tags.slice(0, 3).map((tag: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* 统计信息 */}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>安装次数: {app.installCount || 0}</span>
                      {app.memoryRequired && <span>内存: {app.memoryRequired}MB</span>}
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleInstall(app.appKey, "latest")}
                        disabled={installMutation.isPending}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        安装
                      </Button>
                      <div className="flex gap-1">
                        {app.website && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(app.website, "_blank")}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        )}
                        {app.github && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(app.github, "_blank")}
                          >
                            <Github className="w-4 h-4" />
                          </Button>
                        )}
                        {app.document && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(app.document, "_blank")}
                          >
                            <FileText className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>暂无应用数据</p>
                <p className="text-sm mt-1">请点击"同步应用仓库"按钮获取应用列表</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* 已安装标签页 */}
        <TabsContent value="installed" className="space-y-4">
          {isLoadingInstalled ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : installedApps && installedApps.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {installedApps.map((app: any) => (
                <Card key={app.id}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-white border flex items-center justify-center overflow-hidden">
                          {app.iconUrl ? (
                            <img 
                              src={app.iconUrl} 
                              alt={app.appName}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement!.innerHTML = '<svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>';
                              }}
                            />
                          ) : (
                            <Package className="w-6 h-6 text-blue-600" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{app.appKey}</h3>
                          <p className="text-sm text-gray-500">版本: {app.version}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant={
                                app.status === "running"
                                  ? "default"
                                  : app.status === "stopped"
                                    ? "secondary"
                                    : "destructive"
                              }
                            >
                              {app.status === "running"
                                ? "运行中"
                                : app.status === "stopped"
                                  ? "已停止"
                                  : app.status === "installing"
                                    ? "安装中"
                                    : "错误"}
                            </Badge>
                            <span className="text-xs text-gray-400">
                              安装于 {new Date(app.installedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {app.status === "stopped" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleControl(app.id, "start")}
                            disabled={controlMutation.isPending}
                          >
                            <Play className="w-4 h-4 mr-1" />
                            启动
                          </Button>
                        )}
                        {app.status === "running" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleControl(app.id, "stop")}
                              disabled={controlMutation.isPending}
                            >
                              <Square className="w-4 h-4 mr-1" />
                              停止
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleControl(app.id, "restart")}
                              disabled={controlMutation.isPending}
                            >
                              <RefreshCw className="w-4 h-4 mr-1" />
                              重启
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUninstall(app.id)}
                          disabled={uninstallMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          卸载
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>暂无已安装应用</p>
                <p className="text-sm mt-1">前往应用市场安装应用</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
