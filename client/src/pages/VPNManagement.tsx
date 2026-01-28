import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Play, Square, RefreshCw, Plus, Trash2, Shield, Key, Users } from "lucide-react";

export default function VPNManagement() {
  const [openVPNClientDialog, setOpenVPNClientDialog] = useState(false);
  const [wgPeerDialog, setWgPeerDialog] = useState(false);

  // 获取所有VPN状态
  const { data: vpnStatus, isLoading: statusLoading, refetch: refetchStatus } = trpc.vpn.getStatus.useQuery();

  // OpenVPN状态和配置
  const { data: ovpnConfig, refetch: refetchOvpnConfig } = trpc.vpn.getOpenVPNConfig.useQuery();
  const startOpenVPN = trpc.vpn.startOpenVPN.useMutation({
    onSuccess: () => {
      toast.success("OpenVPN已启动");
      refetchStatus();
    },
    onError: (error) => toast.error(`启动失败: ${error.message}`),
  });
  const stopOpenVPN = trpc.vpn.stopOpenVPN.useMutation({
    onSuccess: () => {
      toast.success("OpenVPN已停止");
      refetchStatus();
    },
    onError: (error) => toast.error(`停止失败: ${error.message}`),
  });
  const restartOpenVPN = trpc.vpn.restartOpenVPN.useMutation({
    onSuccess: () => {
      toast.success("OpenVPN已重启");
      refetchStatus();
    },
    onError: (error) => toast.error(`重启失败: ${error.message}`),
  });
  const configureOpenVPN = trpc.vpn.configureOpenVPN.useMutation({
    onSuccess: () => {
      toast.success("OpenVPN配置已更新");
      refetchOvpnConfig();
    },
    onError: (error) => toast.error(`配置失败: ${error.message}`),
  });
  const addOpenVPNClient = trpc.vpn.addOpenVPNClient.useMutation({
    onSuccess: () => {
      toast.success("客户端已添加");
      setOpenVPNClientDialog(false);
      refetchStatus();
    },
    onError: (error) => toast.error(`添加失败: ${error.message}`),
  });
  const deleteOpenVPNClient = trpc.vpn.deleteOpenVPNClient.useMutation({
    onSuccess: () => {
      toast.success("客户端已删除");
      refetchStatus();
    },
    onError: (error) => toast.error(`删除失败: ${error.message}`),
  });

  // WireGuard状态和配置
  const { data: wgConfig, refetch: refetchWgConfig } = trpc.vpn.getWireGuardConfig.useQuery();
  const startWireGuard = trpc.vpn.startWireGuard.useMutation({
    onSuccess: () => {
      toast.success("WireGuard已启动");
      refetchStatus();
    },
    onError: (error) => toast.error(`启动失败: ${error.message}`),
  });
  const stopWireGuard = trpc.vpn.stopWireGuard.useMutation({
    onSuccess: () => {
      toast.success("WireGuard已停止");
      refetchStatus();
    },
    onError: (error) => toast.error(`停止失败: ${error.message}`),
  });
  const restartWireGuard = trpc.vpn.restartWireGuard.useMutation({
    onSuccess: () => {
      toast.success("WireGuard已重启");
      refetchStatus();
    },
    onError: (error) => toast.error(`重启失败: ${error.message}`),
  });
  const configureWireGuard = trpc.vpn.configureWireGuard.useMutation({
    onSuccess: () => {
      toast.success("WireGuard配置已更新");
      refetchWgConfig();
    },
    onError: (error) => toast.error(`配置失败: ${error.message}`),
  });
  const addWireGuardPeer = trpc.vpn.addWireGuardPeer.useMutation({
    onSuccess: () => {
      toast.success("对等节点已添加");
      setWgPeerDialog(false);
      refetchStatus();
    },
    onError: (error) => toast.error(`添加失败: ${error.message}`),
  });
  const deleteWireGuardPeer = trpc.vpn.deleteWireGuardPeer.useMutation({
    onSuccess: () => {
      toast.success("对等节点已删除");
      refetchStatus();
    },
    onError: (error) => toast.error(`删除失败: ${error.message}`),
  });

  // Tailscale状态
  const { data: tsStatus, refetch: refetchTsStatus } = trpc.vpn.getTailscaleStatus.useQuery();
  const loginTailscale = trpc.vpn.loginTailscale.useMutation({
    onSuccess: (data) => {
      toast.success(data.message || "请在浏览器中完成认证");
      refetchTsStatus();
    },
    onError: (error) => toast.error(`登录失败: ${error.message}`),
  });
  const logoutTailscale = trpc.vpn.logoutTailscale.useMutation({
    onSuccess: () => {
      toast.success("Tailscale已登出");
      refetchTsStatus();
    },
    onError: (error) => toast.error(`登出失败: ${error.message}`),
  });
  const startTailscale = trpc.vpn.startTailscale.useMutation({
    onSuccess: () => {
      toast.success("Tailscale已启动");
      refetchTsStatus();
    },
    onError: (error) => toast.error(`启动失败: ${error.message}`),
  });
  const stopTailscale = trpc.vpn.stopTailscale.useMutation({
    onSuccess: () => {
      toast.success("Tailscale已停止");
      refetchTsStatus();
    },
    onError: (error) => toast.error(`停止失败: ${error.message}`),
  });

  // 表单状态
  const [ovpnForm, setOvpnForm] = useState({
    port: 1194,
    protocol: "udp",
    network: "10.8.0.0",
    netmask: "255.255.255.0",
    dns: ["8.8.8.8", "8.8.4.4"],
  });
  const [wgForm, setWgForm] = useState({
    port: 51820,
    address: "10.0.0.1/24",
  });
  const [clientName, setClientName] = useState("");
  const [peerForm, setPeerForm] = useState({
    name: "",
    allowed_ips: "10.0.0.2/32",
  });

  if (statusLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">VPN服务器</h1>
        <p className="text-muted-foreground">管理OpenVPN、WireGuard和Tailscale VPN服务</p>
      </div>

      {/* 状态概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">OpenVPN</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {vpnStatus?.openvpn.running ? (
                <Badge variant="default">运行中</Badge>
              ) : (
                <Badge variant="secondary">已停止</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {vpnStatus?.openvpn.clients_connected || 0} 个客户端连接
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">WireGuard</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {vpnStatus?.wireguard.running ? (
                <Badge variant="default">运行中</Badge>
              ) : (
                <Badge variant="secondary">已停止</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {vpnStatus?.wireguard.peers_connected || 0} 个对等节点连接
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tailscale</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {vpnStatus?.tailscale.logged_in ? (
                <Badge variant="default">已登录</Badge>
              ) : (
                <Badge variant="secondary">未登录</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {vpnStatus?.tailscale.hostname || "未配置"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* VPN服务管理标签页 */}
      <Tabs defaultValue="openvpn" className="space-y-4">
        <TabsList>
          <TabsTrigger value="openvpn">OpenVPN</TabsTrigger>
          <TabsTrigger value="wireguard">WireGuard</TabsTrigger>
          <TabsTrigger value="tailscale">Tailscale</TabsTrigger>
        </TabsList>

        {/* OpenVPN标签页 */}
        <TabsContent value="openvpn" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>OpenVPN服务器配置</CardTitle>
              <CardDescription>配置OpenVPN服务器参数</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>监听端口</Label>
                  <Input
                    type="number"
                    value={ovpnForm.port}
                    onChange={(e) => setOvpnForm({ ...ovpnForm, port: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>协议</Label>
                  <Select value={ovpnForm.protocol} onValueChange={(v) => setOvpnForm({ ...ovpnForm, protocol: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="udp">UDP</SelectItem>
                      <SelectItem value="tcp">TCP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>VPN网络</Label>
                  <Input value={ovpnForm.network} onChange={(e) => setOvpnForm({ ...ovpnForm, network: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>子网掩码</Label>
                  <Input value={ovpnForm.netmask} onChange={(e) => setOvpnForm({ ...ovpnForm, netmask: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => configureOpenVPN.mutate(ovpnForm)} disabled={configureOpenVPN.isPending}>
                  {configureOpenVPN.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  保存配置
                </Button>
                <Button variant="outline" onClick={() => startOpenVPN.mutate()} disabled={startOpenVPN.isPending || vpnStatus?.openvpn.running}>
                  <Play className="mr-2 h-4 w-4" />
                  启动
                </Button>
                <Button variant="outline" onClick={() => stopOpenVPN.mutate()} disabled={stopOpenVPN.isPending || !vpnStatus?.openvpn.running}>
                  <Square className="mr-2 h-4 w-4" />
                  停止
                </Button>
                <Button variant="outline" onClick={() => restartOpenVPN.mutate()} disabled={restartOpenVPN.isPending}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  重启
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>客户端管理</CardTitle>
                <CardDescription>管理OpenVPN客户端</CardDescription>
              </div>
              <Dialog open={openVPNClientDialog} onOpenChange={setOpenVPNClientDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    添加客户端
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>添加OpenVPN客户端</DialogTitle>
                    <DialogDescription>创建新的客户端配置和证书</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>客户端名称</Label>
                      <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="例如: laptop-john" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setOpenVPNClientDialog(false)}>
                      取消
                    </Button>
                    <Button
                      onClick={() => addOpenVPNClient.mutate({ name: clientName })}
                      disabled={!clientName || addOpenVPNClient.isPending}
                    >
                      {addOpenVPNClient.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      添加
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>客户端名称</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>IP地址</TableHead>
                    <TableHead>连接时间</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vpnStatus?.openvpn.clients && vpnStatus.openvpn.clients.length > 0 ? (
                    vpnStatus.openvpn.clients.map((client: any) => (
                      <TableRow key={client.name}>
                        <TableCell className="font-medium">{client.name}</TableCell>
                        <TableCell>
                          {client.connected ? <Badge variant="default">已连接</Badge> : <Badge variant="secondary">离线</Badge>}
                        </TableCell>
                        <TableCell>{client.ip || "-"}</TableCell>
                        <TableCell>{client.connected_since || "-"}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteOpenVPNClient.mutate(client.name)}
                            disabled={deleteOpenVPNClient.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        暂无客户端
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* WireGuard标签页 */}
        <TabsContent value="wireguard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>WireGuard服务器配置</CardTitle>
              <CardDescription>配置WireGuard服务器参数</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>监听端口</Label>
                  <Input
                    type="number"
                    value={wgForm.port}
                    onChange={(e) => setWgForm({ ...wgForm, port: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>服务器地址</Label>
                  <Input value={wgForm.address} onChange={(e) => setWgForm({ ...wgForm, address: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => configureWireGuard.mutate(wgForm)} disabled={configureWireGuard.isPending}>
                  {configureWireGuard.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  保存配置
                </Button>
                <Button variant="outline" onClick={() => startWireGuard.mutate()} disabled={startWireGuard.isPending || vpnStatus?.wireguard.running}>
                  <Play className="mr-2 h-4 w-4" />
                  启动
                </Button>
                <Button variant="outline" onClick={() => stopWireGuard.mutate()} disabled={stopWireGuard.isPending || !vpnStatus?.wireguard.running}>
                  <Square className="mr-2 h-4 w-4" />
                  停止
                </Button>
                <Button variant="outline" onClick={() => restartWireGuard.mutate()} disabled={restartWireGuard.isPending}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  重启
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>对等节点管理</CardTitle>
                <CardDescription>管理WireGuard对等节点</CardDescription>
              </div>
              <Dialog open={wgPeerDialog} onOpenChange={setWgPeerDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    添加对等节点
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>添加WireGuard对等节点</DialogTitle>
                    <DialogDescription>创建新的对等节点配置</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>节点名称</Label>
                      <Input
                        value={peerForm.name}
                        onChange={(e) => setPeerForm({ ...peerForm, name: e.target.value })}
                        placeholder="例如: phone-john"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>允许的IP</Label>
                      <Input
                        value={peerForm.allowed_ips}
                        onChange={(e) => setPeerForm({ ...peerForm, allowed_ips: e.target.value })}
                        placeholder="10.0.0.2/32"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setWgPeerDialog(false)}>
                      取消
                    </Button>
                    <Button
                      onClick={() => addWireGuardPeer.mutate(peerForm)}
                      disabled={!peerForm.name || addWireGuardPeer.isPending}
                    >
                      {addWireGuardPeer.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      添加
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>节点名称</TableHead>
                    <TableHead>公钥</TableHead>
                    <TableHead>允许的IP</TableHead>
                    <TableHead>最后握手</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vpnStatus?.wireguard.peers && vpnStatus.wireguard.peers.length > 0 ? (
                    vpnStatus.wireguard.peers.map((peer: any) => (
                      <TableRow key={peer.public_key}>
                        <TableCell className="font-medium">{peer.name || "-"}</TableCell>
                        <TableCell className="font-mono text-xs">{peer.public_key.substring(0, 20)}...</TableCell>
                        <TableCell>{peer.allowed_ips}</TableCell>
                        <TableCell>{peer.last_handshake || "从未"}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteWireGuardPeer.mutate(peer.public_key)}
                            disabled={deleteWireGuardPeer.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        暂无对等节点
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tailscale标签页 */}
        <TabsContent value="tailscale" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tailscale配置</CardTitle>
              <CardDescription>Tailscale零配置VPN服务</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">登录状态</p>
                    <p className="text-sm text-muted-foreground">
                      {tsStatus?.logged_in ? `已登录到 ${tsStatus.tailnet}` : "未登录"}
                    </p>
                  </div>
                  {tsStatus?.logged_in ? (
                    <Badge variant="default">已登录</Badge>
                  ) : (
                    <Badge variant="secondary">未登录</Badge>
                  )}
                </div>
                {tsStatus?.logged_in && (
                  <>
                    <div className="flex items-center justify-between pt-2">
                      <div>
                        <p className="font-medium">主机名</p>
                        <p className="text-sm text-muted-foreground">{tsStatus.hostname}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Tailscale IP</p>
                        <p className="text-sm text-muted-foreground">{tsStatus.ip}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="flex gap-2">
                {!tsStatus?.logged_in ? (
                  <Button onClick={() => loginTailscale.mutate()} disabled={loginTailscale.isPending}>
                    {loginTailscale.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    登录Tailscale
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" onClick={() => logoutTailscale.mutate()} disabled={logoutTailscale.isPending}>
                      {logoutTailscale.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      登出
                    </Button>
                    <Button variant="outline" onClick={() => startTailscale.mutate()} disabled={startTailscale.isPending || vpnStatus?.tailscale.running}>
                      <Play className="mr-2 h-4 w-4" />
                      启动
                    </Button>
                    <Button variant="outline" onClick={() => stopTailscale.mutate()} disabled={stopTailscale.isPending || !vpnStatus?.tailscale.running}>
                      <Square className="mr-2 h-4 w-4" />
                      停止
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
