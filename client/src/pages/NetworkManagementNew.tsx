/**
 * 网络管理页面(新版)
 * 集成DHCP静态租约、DNS转发器、静态路由、端口转发等功能
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Network,
  Shield,
  Route,
  Server,
  ArrowRightLeft,
  Settings2,
} from "lucide-react";
import { DhcpStaticLeasesDialog } from "@/components/DhcpStaticLeasesDialog";
import { StaticRoutesDialog } from "@/components/StaticRoutesDialog";
import { PortForwardingDialog } from "@/components/PortForwardingDialog";

export default function NetworkManagementNew() {
  const [dhcpDialogOpen, setDhcpDialogOpen] = useState(false);
  const [routesDialogOpen, setRoutesDialogOpen] = useState(false);
  const [portForwardingDialogOpen, setPortForwardingDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-medium">网络管理</h1>
        <p className="text-sm text-muted-foreground mt-1">
          配置网络接口、防火墙、路由和DNS服务
        </p>
      </div>

      {/* 标签页 */}
      <Tabs defaultValue="interfaces" className="space-y-4">
        <TabsList>
          <TabsTrigger value="interfaces">
            <Network className="w-4 h-4 mr-2" />
            网络接口
          </TabsTrigger>
          <TabsTrigger value="routes">
            <Route className="w-4 h-4 mr-2" />
            路由
          </TabsTrigger>
          <TabsTrigger value="firewall">
            <Shield className="w-4 h-4 mr-2" />
            防火墙
          </TabsTrigger>
          <TabsTrigger value="dhcp">
            <Server className="w-4 h-4 mr-2" />
            DHCP/DNS
          </TabsTrigger>
        </TabsList>

        {/* 网络接口 */}
        <TabsContent value="interfaces" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>物理接口</CardTitle>
                <Button asChild variant="outline" size="sm">
                  <Link href="/network/interfaces">
                    进入接口管理
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                点击"进入接口管理"配置网络接口、IP地址、DHCP服务器等
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 路由 */}
        <TabsContent value="routes" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Route className="w-5 h-5" />
                  静态路由
                </CardTitle>
                <Button onClick={() => setRoutesDialogOpen(true)} size="sm">
                  <Settings2 className="w-4 h-4 mr-2" />
                  配置静态路由
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                配置静态路由规则,控制网络流量走向
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 防火墙 */}
        <TabsContent value="firewall" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <ArrowRightLeft className="w-5 h-5" />
                  端口转发
                </CardTitle>
                <Button onClick={() => setPortForwardingDialogOpen(true)} size="sm">
                  <Settings2 className="w-4 h-4 mr-2" />
                  配置端口转发
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                配置端口转发规则,将外部端口映射到内部网络设备
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  防火墙规则
                </CardTitle>
                <Button asChild variant="outline" size="sm">
                  <Link href="/firewall">
                    进入防火墙管理
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                配置防火墙规则、区域和自定义过滤规则
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* DHCP/DNS */}
        <TabsContent value="dhcp" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Server className="w-5 h-5" />
                  DHCP静态地址分配
                </CardTitle>
                <Button onClick={() => setDhcpDialogOpen(true)} size="sm">
                  <Settings2 className="w-4 h-4 mr-2" />
                  配置静态租约
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                配置MAC地址与IP地址的静态绑定关系
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="w-5 h-5" />
                DNS转发器
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                配置DNS转发器,指定上游DNS服务器
              </p>
              <Button variant="outline" size="sm" className="mt-3">
                <Settings2 className="w-4 h-4 mr-2" />
                配置DNS转发器
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 对话框 */}
      <DhcpStaticLeasesDialog
        open={dhcpDialogOpen}
        onOpenChange={setDhcpDialogOpen}
        networkPortId={1}
      />
      <StaticRoutesDialog
        open={routesDialogOpen}
        onOpenChange={setRoutesDialogOpen}
      />
      <PortForwardingDialog
        open={portForwardingDialogOpen}
        onOpenChange={setPortForwardingDialogOpen}
      />
    </div>
  );
}
