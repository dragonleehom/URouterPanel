/**
 * 技术极简主义 - Dashboard布局
 * 左侧固定侧边栏 + 顶部工具栏 + 主内容区
 */

import { ReactNode } from "react";
import {
  Activity,
  BarChart3,
  Box,
  HardDrive,
  Home,
  Network,
  Server,
  Settings,
  Shield,
  Stethoscope,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: ReactNode;
}

const navItems = [
  { icon: Home, label: "仪表盘", path: "/" },
  { icon: Network, label: "网络管理", path: "/network" },
  { icon: Shield, label: "防火墙", path: "/firewall" },
  { icon: Box, label: "容器管理", path: "/containers" },
  { icon: Server, label: "虚拟机", path: "/vms" },
  { icon: HardDrive, label: "硬件监控", path: "/hardware" },
  { icon: BarChart3, label: "系统监控", path: "/monitoring" },
  { icon: Stethoscope, label: "网络诊断", path: "/diagnostics" },
  { icon: Activity, label: "系统状态", path: "/system" },
  { icon: Settings, label: "系统设置", path: "/settings" },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [location] = useLocation();

  return (
    <div className="flex h-screen bg-background">
      {/* 侧边栏 */}
      <aside className="w-60 border-r border-border bg-sidebar flex flex-col">
        {/* Logo区域 */}
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Network className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-medium text-sidebar-foreground">
                URouterOS
              </h1>
              <p className="text-xs text-sidebar-foreground/60">
                企业级路由系统
              </p>
            </div>
          </div>
        </div>

        {/* 导航菜单 */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path;

              return (
                <li key={item.path}>
                  <Link href={item.path}>
                    <a
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                        "text-sm font-normal",
                        isActive
                          ? "bg-sidebar-primary text-sidebar-primary-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-accent"
                      )}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span>{item.label}</span>
                    </a>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* 底部信息 */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="text-xs text-sidebar-foreground/60">
            <div className="flex justify-between mb-1">
              <span>系统版本</span>
              <span className="font-mono">v1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span>运行时间</span>
              <span className="font-mono">24天</span>
            </div>
          </div>
        </div>
      </aside>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 顶部工具栏 */}
        <header className="h-16 border-b border-border bg-background flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-medium text-foreground">
              {navItems.find((item) => item.path === location)?.label ||
                "仪表盘"}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* 系统状态指示器 */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted">
              <span className="status-indicator running"></span>
              <span className="text-sm text-muted-foreground">系统正常</span>
            </div>

            {/* 用户信息 */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <span className="text-sm font-medium text-primary-foreground">
                  A
                </span>
              </div>
              <span className="text-sm text-foreground">管理员</span>
            </div>
          </div>
        </header>

        {/* 内容区域 */}
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
