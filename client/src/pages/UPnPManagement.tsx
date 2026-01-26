/**
 * UPnP/NAT-PMP服务管理页面
 * 支持自动端口映射和设备发现
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, ExternalLink, Monitor, RefreshCw, Trash2, XCircle } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

interface PortMapping {
  id: string;
  protocol: string;
  externalPort: number;
  internalIP: string;
  internalPort: number;
  description: string;
  device: string;
  expiresAt: string;
}

interface UPnPClient {
  id: string;
  name: string;
  ip: string;
  mac: string;
  manufacturer: string;
  mappingCount: number;
  lastSeen: string;
}

export default function UPnPManagement() {
  const [upnpEnabled, setUpnpEnabled] = useState(true);
  const [natPmpEnabled, setNatPmpEnabled] = useState(true);
  const [secureMode, setSecureMode] = useState(true);

  const [portMappings, setPortMappings] = useState<PortMapping[]>([
    {
      id: "1",
      protocol: "TCP",
      externalPort: 8080,
      internalIP: "192.168.1.100",
      internalPort: 8080,
      description: "Web Server",
      device: "Desktop PC",
      expiresAt: "2024-01-27 14:30:00",
    },
    {
      id: "2",
      protocol: "UDP",
      externalPort: 27015,
      internalIP: "192.168.1.101",
      internalPort: 27015,
      description: "Game Server",
      device: "Gaming PC",
      expiresAt: "永久",
    },
    {
      id: "3",
      protocol: "TCP",
      externalPort: 3389,
      internalIP: "192.168.1.102",
      internalPort: 3389,
      description: "Remote Desktop",
      device: "Workstation",
      expiresAt: "2024-01-26 18:00:00",
    },
  ]);

  const [upnpClients, setUpnpClients] = useState<UPnPClient[]>([
    {
      id: "1",
      name: "Desktop PC",
      ip: "192.168.1.100",
      mac: "00:11:22:33:44:55",
      manufacturer: "Dell",
      mappingCount: 1,
      lastSeen: "2分钟前",
    },
    {
      id: "2",
      name: "Gaming PC",
      ip: "192.168.1.101",
      mac: "AA:BB:CC:DD:EE:FF",
      manufacturer: "ASUS",
      mappingCount: 1,
      lastSeen: "5分钟前",
    },
    {
      id: "3",
      name: "Workstation",
      ip: "192.168.1.102",
      mac: "11:22:33:44:55:66",
      manufacturer: "HP",
      mappingCount: 1,
      lastSeen: "10分钟前",
    },
  ]);

  const handleToggleUPnP = () => {
    setUpnpEnabled(!upnpEnabled);
    toast.success(upnpEnabled ? "UPnP服务已禁用" : "UPnP服务已启用");
  };

  const handleToggleNATPMP = () => {
    setNatPmpEnabled(!natPmpEnabled);
    toast.success(natPmpEnabled ? "NAT-PMP服务已禁用" : "NAT-PMP服务已启用");
  };

  const handleToggleSecureMode = () => {
    setSecureMode(!secureMode);
    toast.success(secureMode ? "安全模式已禁用" : "安全模式已启用");
  };

  const handleDeleteMapping = (mappingId: string) => {
    setPortMappings((mappings) => mappings.filter((m) => m.id !== mappingId));
    toast.success("端口映射已删除");
  };

  const handleRefreshMappings = () => {
    toast.success("正在刷新端口映射列表...");
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* 页面标题 */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">UPnP/NAT-PMP服务</h1>
          <p className="text-sm text-gray-600 mt-1">
            通用即插即用和NAT端口映射协议配置
          </p>
        </div>

        {/* 服务配置 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">UPnP服务</CardTitle>
              <CardDescription>通用即插即用协议</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {upnpEnabled ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-400" />
                  )}
                  <span className="text-sm font-medium">
                    {upnpEnabled ? "已启用" : "已禁用"}
                  </span>
                </div>
                <Switch checked={upnpEnabled} onCheckedChange={handleToggleUPnP} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">NAT-PMP服务</CardTitle>
              <CardDescription>NAT端口映射协议</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {natPmpEnabled ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-400" />
                  )}
                  <span className="text-sm font-medium">
                    {natPmpEnabled ? "已启用" : "已禁用"}
                  </span>
                </div>
                <Switch checked={natPmpEnabled} onCheckedChange={handleToggleNATPMP} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">安全模式</CardTitle>
              <CardDescription>限制端口映射范围</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {secureMode ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-400" />
                  )}
                  <span className="text-sm font-medium">
                    {secureMode ? "已启用" : "已禁用"}
                  </span>
                </div>
                <Switch checked={secureMode} onCheckedChange={handleToggleSecureMode} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 端口映射列表 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>活动的端口映射</CardTitle>
                <CardDescription>当前UPnP/NAT-PMP自动创建的端口映射</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleRefreshMappings}>
                <RefreshCw className="w-4 h-4 mr-2" />
                刷新
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {portMappings.map((mapping) => (
                <div
                  key={mapping.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex-1 grid grid-cols-5 gap-4">
                    <div>
                      <div className="text-xs text-gray-500">协议</div>
                      <Badge variant="outline">{mapping.protocol}</Badge>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">外部端口</div>
                      <div className="font-medium">{mapping.externalPort}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">内部地址</div>
                      <div className="font-medium">
                        {mapping.internalIP}:{mapping.internalPort}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">设备</div>
                      <div className="font-medium">{mapping.device}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">过期时间</div>
                      <div className="font-medium">{mapping.expiresAt}</div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteMapping(mapping.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              ))}

              {portMappings.length === 0 && (
                <div className="py-12 text-center text-gray-500">
                  <ExternalLink className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>暂无活动的端口映射</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* UPnP客户端列表 */}
        <Card>
          <CardHeader>
            <CardTitle>UPnP客户端设备</CardTitle>
            <CardDescription>已发现的支持UPnP的网络设备</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upnpClients.map((client) => (
                <div
                  key={client.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <Monitor className="w-8 h-8 text-blue-600" />
                    <div>
                      <div className="font-medium">{client.name}</div>
                      <div className="text-sm text-gray-600">
                        {client.ip} • {client.mac}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div>
                      <div className="text-xs text-gray-500">制造商</div>
                      <div className="font-medium">{client.manufacturer}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">映射数</div>
                      <div className="font-medium">{client.mappingCount}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">最后活动</div>
                      <div className="font-medium">{client.lastSeen}</div>
                    </div>
                  </div>
                </div>
              ))}

              {upnpClients.length === 0 && (
                <div className="py-12 text-center text-gray-500">
                  <Monitor className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>暂未发现UPnP客户端设备</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 使用说明 */}
        <Card>
          <CardHeader>
            <CardTitle>UPnP/NAT-PMP使用说明</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-700">
                <p className="font-medium mb-1">什么是UPnP/NAT-PMP?</p>
                <p>
                  UPnP (通用即插即用) 和 NAT-PMP (NAT端口映射协议) 允许局域网设备自动配置端口转发规则,
                  无需手动设置即可让外部网络访问内网服务。
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-700">
                <p className="font-medium mb-1">安全模式说明</p>
                <p>
                  启用安全模式后,系统将限制可映射的端口范围(1024-65535),
                  禁止映射系统保留端口,并要求设备认证,提高网络安全性。
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-700">
                <p className="font-medium mb-1">安全建议</p>
                <p>
                  • 如果不需要自动端口映射功能,建议禁用UPnP/NAT-PMP服务<br />
                  • 定期检查端口映射列表,删除不需要的映射<br />
                  • 启用安全模式以限制潜在的安全风险<br />
                  • 对于重要服务,建议使用手动端口转发而非UPnP
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
