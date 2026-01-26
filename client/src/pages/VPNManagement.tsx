/**
 * VPN服务器管理页面
 * 支持OpenVPN和WireGuard两种VPN协议
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Download, Key, Plus, Power, Shield, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

interface VPNClient {
  id: string;
  name: string;
  type: "openvpn" | "wireguard";
  ipAddress: string;
  status: "connected" | "disconnected";
  connectedAt?: string;
  dataTransferred: { upload: string; download: string };
}

export default function VPNManagement() {
  const [activeTab, setActiveTab] = useState("openvpn");

  // OpenVPN状态
  const [openVPNEnabled, setOpenVPNEnabled] = useState(false);
  const [openVPNPort, setOpenVPNPort] = useState("1194");
  const [openVPNProtocol, setOpenVPNProtocol] = useState("udp");
  const [openVPNSubnet, setOpenVPNSubnet] = useState("10.8.0.0/24");
  const [openVPNDNS, setOpenVPNDNS] = useState("8.8.8.8");
  const [openVPNCompression, setOpenVPNCompression] = useState(true);

  // WireGuard状态
  const [wireguardEnabled, setWireguardEnabled] = useState(false);
  const [wireguardPort, setWireguardPort] = useState("51820");
  const [wireguardSubnet, setWireguardSubnet] = useState("10.9.0.0/24");
  const [wireguardDNS, setWireguardDNS] = useState("1.1.1.1");
  const [wireguardPublicKey, setWireguardPublicKey] = useState("generated_public_key_here");

  // 模拟VPN客户端列表
  const [vpnClients] = useState<VPNClient[]>([
    {
      id: "1",
      name: "client1",
      type: "openvpn",
      ipAddress: "10.8.0.2",
      status: "connected",
      connectedAt: "2024-01-26 14:30:00",
      dataTransferred: { upload: "125 MB", download: "450 MB" },
    },
    {
      id: "2",
      name: "mobile-device",
      type: "wireguard",
      ipAddress: "10.9.0.2",
      status: "connected",
      connectedAt: "2024-01-26 10:15:00",
      dataTransferred: { upload: "80 MB", download: "320 MB" },
    },
    {
      id: "3",
      name: "laptop",
      type: "openvpn",
      ipAddress: "10.8.0.3",
      status: "disconnected",
      dataTransferred: { upload: "0 MB", download: "0 MB" },
    },
  ]);

  const handleSaveOpenVPN = () => {
    toast.success("OpenVPN配置已保存");
  };

  const handleSaveWireGuard = () => {
    toast.success("WireGuard配置已保存");
  };

  const handleGenerateClientConfig = (type: "openvpn" | "wireguard") => {
    toast.success(`${type === "openvpn" ? "OpenVPN" : "WireGuard"}客户端配置已生成`);
  };

  const handleDeleteClient = (clientId: string) => {
    toast.success("客户端已删除");
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* 页面标题 */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">VPN服务器</h1>
          <p className="text-sm text-gray-600 mt-1">
            配置OpenVPN和WireGuard服务器,管理VPN客户端连接
          </p>
        </div>

        {/* VPN服务器配置 */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="openvpn">OpenVPN</TabsTrigger>
            <TabsTrigger value="wireguard">WireGuard</TabsTrigger>
            <TabsTrigger value="clients">客户端管理</TabsTrigger>
          </TabsList>

          {/* OpenVPN配置 */}
          <TabsContent value="openvpn" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>OpenVPN服务器</CardTitle>
                    <CardDescription>
                      配置OpenVPN服务器参数和网络设置
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="openvpn-enabled">启用服务</Label>
                    <Switch
                      id="openvpn-enabled"
                      checked={openVPNEnabled}
                      onCheckedChange={setOpenVPNEnabled}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="openvpn-port">监听端口</Label>
                    <Input
                      id="openvpn-port"
                      value={openVPNPort}
                      onChange={(e) => setOpenVPNPort(e.target.value)}
                      placeholder="1194"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="openvpn-protocol">协议</Label>
                    <Select value={openVPNProtocol} onValueChange={setOpenVPNProtocol}>
                      <SelectTrigger id="openvpn-protocol">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="udp">UDP</SelectItem>
                        <SelectItem value="tcp">TCP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="openvpn-subnet">VPN子网</Label>
                  <Input
                    id="openvpn-subnet"
                    value={openVPNSubnet}
                    onChange={(e) => setOpenVPNSubnet(e.target.value)}
                    placeholder="10.8.0.0/24"
                  />
                  <p className="text-xs text-gray-500">
                    VPN客户端将从此子网分配IP地址
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="openvpn-dns">DNS服务器</Label>
                  <Input
                    id="openvpn-dns"
                    value={openVPNDNS}
                    onChange={(e) => setOpenVPNDNS(e.target.value)}
                    placeholder="8.8.8.8"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="openvpn-compression">启用压缩</Label>
                    <p className="text-xs text-gray-500">
                      使用LZ4压缩算法减少数据传输量
                    </p>
                  </div>
                  <Switch
                    id="openvpn-compression"
                    checked={openVPNCompression}
                    onCheckedChange={setOpenVPNCompression}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSaveOpenVPN}>
                    <Shield className="w-4 h-4 mr-2" />
                    保存配置
                  </Button>
                  <Button variant="outline" onClick={() => handleGenerateClientConfig("openvpn")}>
                    <Download className="w-4 h-4 mr-2" />
                    生成客户端配置
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 证书管理 */}
            <Card>
              <CardHeader>
                <CardTitle>证书管理</CardTitle>
                <CardDescription>
                  管理OpenVPN服务器和客户端证书
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Key className="w-4 h-4 text-blue-600" />
                      <span className="font-medium">服务器证书</span>
                    </div>
                    <p className="text-xs text-gray-600">
                      有效期: 2024-01-01 至 2025-01-01
                    </p>
                    <Button variant="outline" size="sm" className="mt-2">
                      重新生成
                    </Button>
                  </div>
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Key className="w-4 h-4 text-green-600" />
                      <span className="font-medium">CA证书</span>
                    </div>
                    <p className="text-xs text-gray-600">
                      有效期: 2024-01-01 至 2034-01-01
                    </p>
                    <Button variant="outline" size="sm" className="mt-2">
                      下载证书
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* WireGuard配置 */}
          <TabsContent value="wireguard" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>WireGuard服务器</CardTitle>
                    <CardDescription>
                      配置WireGuard服务器参数和密钥
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="wireguard-enabled">启用服务</Label>
                    <Switch
                      id="wireguard-enabled"
                      checked={wireguardEnabled}
                      onCheckedChange={setWireguardEnabled}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="wireguard-port">监听端口</Label>
                    <Input
                      id="wireguard-port"
                      value={wireguardPort}
                      onChange={(e) => setWireguardPort(e.target.value)}
                      placeholder="51820"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wireguard-subnet">VPN子网</Label>
                    <Input
                      id="wireguard-subnet"
                      value={wireguardSubnet}
                      onChange={(e) => setWireguardSubnet(e.target.value)}
                      placeholder="10.9.0.0/24"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="wireguard-dns">DNS服务器</Label>
                  <Input
                    id="wireguard-dns"
                    value={wireguardDNS}
                    onChange={(e) => setWireguardDNS(e.target.value)}
                    placeholder="1.1.1.1"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="wireguard-publickey">服务器公钥</Label>
                  <Textarea
                    id="wireguard-publickey"
                    value={wireguardPublicKey}
                    readOnly
                    className="font-mono text-xs"
                    rows={2}
                  />
                  <p className="text-xs text-gray-500">
                    客户端配置时需要使用此公钥
                  </p>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSaveWireGuard}>
                    <Shield className="w-4 h-4 mr-2" />
                    保存配置
                  </Button>
                  <Button variant="outline" onClick={() => handleGenerateClientConfig("wireguard")}>
                    <Download className="w-4 h-4 mr-2" />
                    生成客户端配置
                  </Button>
                  <Button variant="outline">
                    <Key className="w-4 h-4 mr-2" />
                    重新生成密钥对
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* WireGuard对等节点 */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>对等节点(Peers)</CardTitle>
                    <CardDescription>
                      管理WireGuard客户端对等节点
                    </CardDescription>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        添加对等节点
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>添加WireGuard对等节点</DialogTitle>
                        <DialogDescription>
                          配置新的WireGuard客户端对等节点
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="peer-name">节点名称</Label>
                          <Input id="peer-name" placeholder="my-device" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="peer-publickey">客户端公钥</Label>
                          <Textarea
                            id="peer-publickey"
                            placeholder="客户端生成的公钥"
                            rows={2}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="peer-ip">分配IP地址</Label>
                          <Input id="peer-ip" placeholder="10.9.0.2/32" />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button>添加节点</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { name: "mobile-device", ip: "10.9.0.2", status: "active" },
                    { name: "laptop", ip: "10.9.0.3", status: "inactive" },
                  ].map((peer, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Users className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="font-medium">{peer.name}</div>
                          <div className="text-xs text-gray-500">{peer.ip}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={peer.status === "active" ? "default" : "secondary"}>
                          {peer.status === "active" ? "活跃" : "离线"}
                        </Badge>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 客户端管理 */}
          <TabsContent value="clients" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>VPN客户端连接</CardTitle>
                <CardDescription>
                  查看当前连接的VPN客户端和连接历史
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {vpnClients.map((client) => (
                    <div
                      key={client.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-2 h-2 rounded-full ${
                          client.status === "connected" ? "bg-green-500" : "bg-gray-300"
                        }`}></div>
                        <div>
                          <div className="font-medium">{client.name}</div>
                          <div className="text-xs text-gray-500">
                            {client.ipAddress} • {client.type === "openvpn" ? "OpenVPN" : "WireGuard"}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-sm">
                          <div className="text-gray-500">上传/下载</div>
                          <div className="font-medium">
                            {client.dataTransferred.upload} / {client.dataTransferred.download}
                          </div>
                        </div>
                        {client.status === "connected" && (
                          <div className="text-sm">
                            <div className="text-gray-500">连接时间</div>
                            <div className="font-medium">{client.connectedAt}</div>
                          </div>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClient(client.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 使用说明 */}
            <Card>
              <CardHeader>
                <CardTitle>客户端配置说明</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-700">
                    <p className="font-medium mb-1">OpenVPN客户端</p>
                    <p>
                      下载生成的.ovpn配置文件,使用OpenVPN Connect或其他OpenVPN客户端导入配置文件即可连接。
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-700">
                    <p className="font-medium mb-1">WireGuard客户端</p>
                    <p>
                      下载生成的配置文件或扫描二维码,使用WireGuard官方客户端导入配置即可连接。
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
