import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";

interface InterfaceConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  interface: any;
  onInterfaceChange: (updates: any) => void;
  onSave: () => void;
  isSaving: boolean;
  firewallZones?: string[];
}

export function InterfaceConfigDialog({
  open,
  onOpenChange,
  interface: editingInterface,
  onInterfaceChange,
  onSave,
  isSaving,
  firewallZones = ["wan", "lan", "guest", "dmz"],
}: InterfaceConfigDialogProps) {
  if (!editingInterface) return null;

  const updateField = (field: string, value: any) => {
    onInterfaceChange({ ...editingInterface, [field]: value });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>接口配置 - {editingInterface.name}</DialogTitle>
          <DialogDescription>
            配置接口的网络参数、高级选项和DHCP服务器
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">常规设置</TabsTrigger>
            <TabsTrigger value="advanced">高级设置</TabsTrigger>
            <TabsTrigger value="dhcp">DHCP服务器</TabsTrigger>
          </TabsList>

          {/* 常规设置标签页 */}
          <TabsContent value="general" className="space-y-4 mt-4">
            {/* 接口状态信息 */}
            <div className="rounded-lg border p-4 space-y-2 bg-muted/30">
              <h4 className="font-medium text-sm">状态</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">设备: </span>
                  <span className="font-mono">{editingInterface.ifname || "-"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">MAC: </span>
                  <span className="font-mono text-xs">{editingInterface.macAddress || "-"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">IPv4: </span>
                  <span className="font-mono">{editingInterface.ipaddr || "-"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">MTU: </span>
                  <span>{editingInterface.mtu || 1500}</span>
                </div>
              </div>
            </div>

            {/* 协议选择 */}
            <div className="space-y-2">
              <Label htmlFor="protocol">协议</Label>
              <Select
                value={editingInterface.protocol}
                onValueChange={(value) => updateField("protocol", value)}
              >
                <SelectTrigger id="protocol">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dhcp">DHCP客户端</SelectItem>
                  <SelectItem value="static">静态IP</SelectItem>
                  <SelectItem value="pppoe">PPPoE</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 设备选择 */}
            <div className="space-y-2">
              <Label htmlFor="ifname">设备</Label>
              <Input
                id="ifname"
                value={editingInterface.ifname || ""}
                onChange={(e) => updateField("ifname", e.target.value)}
                placeholder="eth0"
              />
            </div>

            {/* 开机自动运行 */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>开机自动运行</Label>
                <p className="text-sm text-muted-foreground">
                  系统启动时自动启用此接口
                </p>
              </div>
              <Switch
                checked={editingInterface.autoStart !== 0}
                onCheckedChange={(checked) => updateField("autoStart", checked ? 1 : 0)}
              />
            </div>

            {/* DHCP主机名 */}
            {editingInterface.protocol === "dhcp" && (
              <div className="space-y-2">
                <Label htmlFor="dhcpHostname">请求DHCP时发送的主机名</Label>
                <Select
                  value={editingInterface.dhcpHostname || "none"}
                  onValueChange={(value) => updateField("dhcpHostname", value)}
                >
                  <SelectTrigger id="dhcpHostname">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">传输此设备的主机名称</SelectItem>
                    <SelectItem value="system">使用系统主机名</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  不会生成或分配主机名称,选择未启用选项将该接口口接收到的接口名称传输到DHCP服务器
                </p>
              </div>
            )}

            {/* 静态IP配置 */}
            {editingInterface.protocol === "static" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ipaddr">IPv4地址</Label>
                    <Input
                      id="ipaddr"
                      value={editingInterface.ipaddr || ""}
                      onChange={(e) => updateField("ipaddr", e.target.value)}
                      placeholder="192.168.1.1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="netmask">子网掩码</Label>
                    <Input
                      id="netmask"
                      value={editingInterface.netmask || ""}
                      onChange={(e) => updateField("netmask", e.target.value)}
                      placeholder="255.255.255.0"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gateway">网关</Label>
                  <Input
                    id="gateway"
                    value={editingInterface.gateway || ""}
                    onChange={(e) => updateField("gateway", e.target.value)}
                    placeholder="192.168.1.254"
                  />
                </div>
              </>
            )}

            {/* PPPoE配置 */}
            {editingInterface.protocol === "pppoe" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="pppoeUsername">PPPoE用户名</Label>
                  <Input
                    id="pppoeUsername"
                    value={editingInterface.pppoeUsername || ""}
                    onChange={(e) => updateField("pppoeUsername", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pppoePassword">PPPoE密码</Label>
                  <Input
                    id="pppoePassword"
                    type="password"
                    value={editingInterface.pppoePassword || ""}
                    onChange={(e) => updateField("pppoePassword", e.target.value)}
                  />
                </div>
              </>
            )}

            {/* 防火墙区域 */}
            <div className="space-y-2">
              <Label>防火墙区域</Label>
              <Select
                value={editingInterface.firewallZone || ""}
                onValueChange={(value) => updateField("firewallZone", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择防火墙区域" />
                </SelectTrigger>
                <SelectContent>
                  {firewallZones.map((zone) => (
                    <SelectItem key={zone} value={zone}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{zone.toUpperCase()}</span>
                        <span className="text-xs text-muted-foreground">
                          {zone === "wan" && "(外网接口)"}
                          {zone === "lan" && "(内网接口)"}
                          {zone === "guest" && "(访客网络)"}
                          {zone === "dmz" && "(DMZ区)"}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          {/* 高级设置标签页 */}
          <TabsContent value="advanced" className="space-y-4 mt-4">
            {/* DHCP客户端高级选项 */}
            {editingInterface.protocol === "dhcp" && (
              <div className="space-y-4">
                <h4 className="font-medium text-sm">DHCP客户端选项</h4>
                
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label>使用广播标志</Label>
                    <p className="text-sm text-muted-foreground">
                      要求DHCP服务器使用广播
                    </p>
                  </div>
                  <Switch
                    checked={editingInterface.dhcpBroadcast === 1}
                    onCheckedChange={(checked) => updateField("dhcpBroadcast", checked ? 1 : 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dhcpClientId">覆盖DHCP客户端标识符ID</Label>
                  <Input
                    id="dhcpClientId"
                    value={editingInterface.dhcpClientId || ""}
                    onChange={(e) => updateField("dhcpClientId", e.target.value)}
                    placeholder="留空使用默认"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dhcpVendorClass">覆盖DHCP对接收到的包括配置</Label>
                  <Input
                    id="dhcpVendorClass"
                    value={editingInterface.dhcpVendorClass || ""}
                    onChange={(e) => updateField("dhcpVendorClass", e.target.value)}
                    placeholder="留空使用默认"
                  />
                </div>
              </div>
            )}

            {/* 路由和DNS配置 */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm border-t pt-4">路由和DNS</h4>
              
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>使用默认网关</Label>
                  <p className="text-sm text-muted-foreground">
                    使用此接口的网关作为默认路由
                  </p>
                </div>
                <Switch
                  checked={editingInterface.useDefaultGateway !== 0}
                  onCheckedChange={(checked) => updateField("useDefaultGateway", checked ? 1 : 0)}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>使用对端DNS</Label>
                  <p className="text-sm text-muted-foreground">
                    使用DHCP/PPPoE提供的DNS服务器
                  </p>
                </div>
                <Switch
                  checked={editingInterface.peerdns !== 0}
                  onCheckedChange={(checked) => updateField("peerdns", checked ? 1 : 0)}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>自定义DNS服务器</Label>
                  <p className="text-sm text-muted-foreground">
                    启用后可手动指定DNS服务器
                  </p>
                </div>
                <Switch
                  checked={editingInterface.useCustomDns === 1}
                  onCheckedChange={(checked) => updateField("useCustomDns", checked ? 1 : 0)}
                />
              </div>

              {editingInterface.useCustomDns === 1 && (
                <div className="space-y-2">
                  <Label htmlFor="dnsServers">DNS服务器</Label>
                  <Input
                    id="dnsServers"
                    value={editingInterface.dnsServers || ""}
                    onChange={(e) => updateField("dnsServers", e.target.value)}
                    placeholder="8.8.8.8,8.8.4.4"
                  />
                  <p className="text-xs text-muted-foreground">
                    多个DNS服务器用逗号分隔
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mtu">使用网关跃点</Label>
                  <Input
                    id="metric"
                    type="number"
                    value={editingInterface.metric || 0}
                    onChange={(e) => updateField("metric", parseInt(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mtu">MTU</Label>
                  <Input
                    id="mtu"
                    type="number"
                    value={editingInterface.mtu || 1500}
                    onChange={(e) => updateField("mtu", parseInt(e.target.value) || 1500)}
                  />
                </div>
              </div>
            </div>

            {/* IPv6配置 */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm border-t pt-4">IPv6配置</h4>
              
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>委托IPv6前缀</Label>
                  <p className="text-sm text-muted-foreground">
                    从上游获取IPv6前缀并分配给内网
                  </p>
                </div>
                <Switch
                  checked={editingInterface.ipv6Delegation !== 0}
                  onCheckedChange={(checked) => updateField("ipv6Delegation", checked ? 1 : 0)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ipv6Assignment">IPv6分配长度</Label>
                  <Select
                    value={editingInterface.ipv6Assignment || "60"}
                    onValueChange={(value) => updateField("ipv6Assignment", value)}
                  >
                    <SelectTrigger id="ipv6Assignment">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="disabled">未启用</SelectItem>
                      <SelectItem value="64">/64</SelectItem>
                      <SelectItem value="63">/63</SelectItem>
                      <SelectItem value="62">/62</SelectItem>
                      <SelectItem value="61">/61</SelectItem>
                      <SelectItem value="60">/60</SelectItem>
                      <SelectItem value="59">/59</SelectItem>
                      <SelectItem value="58">/58</SelectItem>
                      <SelectItem value="57">/57</SelectItem>
                      <SelectItem value="56">/56</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ipv6PrefixFilter">IPv6前缀过滤器</Label>
                  <Select
                    value={editingInterface.ipv6PrefixFilter || "none"}
                    onValueChange={(value) => updateField("ipv6PrefixFilter", value)}
                  >
                    <SelectTrigger id="ipv6PrefixFilter">
                      <SelectValue placeholder="未启用" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">未启用</SelectItem>
                      <SelectItem value="wan">仅WAN</SelectItem>
                      <SelectItem value="local">仅本地</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ipv6Suffix">IPv6后缀</Label>
                <Input
                  id="ipv6Suffix"
                  value={editingInterface.ipv6Suffix || ""}
                  onChange={(e) => updateField("ipv6Suffix", e.target.value)}
                  placeholder="::1"
                />
                <p className="text-xs text-muted-foreground">
                  示例: 为此地址::1, random或EUI-64生成地址(例如: ::1, ::1a:2b:3c, random或eui64)
                </p>
              </div>
            </div>

            {/* 路由表覆盖 */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm border-t pt-4">路由表覆盖</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ipv4RoutingTable">覆盖IPv4路由表</Label>
                  <Select
                    value={editingInterface.ipv4RoutingTable || "none"}
                    onValueChange={(value) => updateField("ipv4RoutingTable", value)}
                  >
                    <SelectTrigger id="ipv4RoutingTable">
                      <SelectValue placeholder="未启用" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">未启用</SelectItem>
                      <SelectItem value="main">main</SelectItem>
                      <SelectItem value="default">default</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ipv6RoutingTable">覆盖IPv6路由表</Label>
                  <Select
                    value={editingInterface.ipv6RoutingTable || "none"}
                    onValueChange={(value) => updateField("ipv6RoutingTable", value)}
                  >
                    <SelectTrigger id="ipv6RoutingTable">
                      <SelectValue placeholder="未启用" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">未启用</SelectItem>
                      <SelectItem value="main">main</SelectItem>
                      <SelectItem value="default">default</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* DHCP服务器标签页 */}
          <TabsContent value="dhcp" className="space-y-4 mt-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>忽略此接口</Label>
                <p className="text-sm text-muted-foreground">
                  不在此接口提供DHCP服务
                </p>
              </div>
              <Switch
                checked={editingInterface.ignoreDhcpServer === 1}
                onCheckedChange={(checked) => updateField("ignoreDhcpServer", checked ? 1 : 0)}
              />
            </div>

            {editingInterface.ignoreDhcpServer !== 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="dhcpStart">DHCP起始IP</Label>
                  <Input
                    id="dhcpStart"
                    value={editingInterface.dhcpStart || ""}
                    onChange={(e) => updateField("dhcpStart", e.target.value)}
                    placeholder="192.168.1.100"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dhcpEnd">DHCP结束IP</Label>
                  <Input
                    id="dhcpEnd"
                    value={editingInterface.dhcpEnd || ""}
                    onChange={(e) => updateField("dhcpEnd", e.target.value)}
                    placeholder="192.168.1.200"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dhcpTime">租约时间</Label>
                  <Input
                    id="dhcpTime"
                    value={editingInterface.dhcpTime || "12h"}
                    onChange={(e) => updateField("dhcpTime", e.target.value)}
                    placeholder="12h"
                  />
                  <p className="text-xs text-muted-foreground">
                    示例: 12h, 1d, 7d
                  </p>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={onSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
