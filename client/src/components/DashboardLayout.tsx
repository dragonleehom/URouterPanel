/**
 * DashboardLayout 组件
 * 左侧固定侧边栏(支持二级菜单) + 顶部工具栏 + 主内容区
 */

import { ReactNode, useState } from "react";
import {
  Activity,
  BarChart2,
  BarChart3,
  Box,
  CircleDot,
  ChevronDown,
  ChevronRight,
  Cloud,
  ExternalLink,
  Gauge,
  GitBranch,
  Globe,
  HardDrive,
  Home,
  KeyRound,
  Network,
  Package,
  RefreshCw,
  Route,
  Server,
  Settings,
  Shield,
  Stethoscope,
  Wifi,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: ReactNode;
}

interface MenuItem {
  icon: typeof Home;
  label: string;
  path?: string;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  { icon: Home, label: "仪表盘", path: "/" },
  {
    icon: Network,
    label: "网络管理",
    children: [
      { icon: Network, label: "接口配置", path: "/network-interfaces" },
      { icon: Wifi, label: "无线网络", path: "/wireless" },
      { icon: Shield, label: "防火墙", path: "/firewall" },
      { icon: Network, label: "DHCP/DNS", path: "/dhcp-dns" },
      { icon: Route, label: "路由管理", path: "/routing" },
      { icon: Globe, label: "IPv6配置", path: "/ipv6" },
      { icon: GitBranch, label: "多WAN", path: "/multiwan" },
      { icon: CircleDot, label: "MAC地址", path: "/mac" },
      { icon: Stethoscope, label: "网络诊断", path: "/diagnostics" },
      { icon: Network, label: "虚拟网络", path: "/virtual-networks" },
    ],
  },
  {
    icon: Cloud,
    label: "网络服务",
    children: [
      { icon: Gauge, label: "QoS流控", path: "/qos" },
      { icon: KeyRound, label: "VPN服务", path: "/vpn" },
      { icon: RefreshCw, label: "DDNS", path: "/ddns" },
      { icon: ExternalLink, label: "UPnP", path: "/upnp" },
      { icon: BarChart2, label: "流量统计", path: "/traffic" },
      { icon: CircleDot, label: "网络唤醒", path: "/wol" },
    ],
  },
  { icon: Package, label: "应用市场", path: "/appstore" },
  { icon: Box, label: "容器管理", path: "/containers" },
  { icon: Server, label: "虚拟机", path: "/vms" },
  { icon: HardDrive, label: "硬件监控", path: "/hardware-monitor" },
  { icon: BarChart3, label: "系统监控", path: "/monitoring" },
  { icon: Activity, label: "系统状态", path: "/status" },
  { icon: Settings, label: "系统设置", path: "/settings" },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [location] = useLocation();
  const [expandedMenus, setExpandedMenus] = useState<string[]>(["网络管理", "网络服务"]);

  const toggleMenu = (label: string) => {
    setExpandedMenus((prev) =>
      prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]
    );
  };

  const isActive = (path?: string) => {
    if (!path) return false;
    return location === path;
  };

  const isParentActive = (children?: MenuItem[]) => {
    if (!children) return false;
    return children.some((child) => child.path && location === child.path);
  };

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedMenus.includes(item.label);
    const Icon = item.icon;
    const active = item.path ? isActive(item.path) : isParentActive(item.children);

    if (hasChildren) {
      return (
        <div key={item.label}>
          <button
            onClick={() => toggleMenu(item.label)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors",
              "hover:bg-gray-50",
              active && "bg-blue-50 text-blue-600 font-medium"
            )}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span className="flex-1 text-left">{item.label}</span>
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
          {isExpanded && (
            <div className="bg-gray-50">
              {item.children!.map((child) => renderMenuItem(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link key={item.path} href={item.path!}>
        <a
          className={cn(
            "flex items-center gap-3 px-4 py-2.5 text-sm transition-colors",
            level > 0 && "pl-12",
            "hover:bg-gray-50",
            active && "bg-blue-50 text-blue-600 font-medium border-r-2 border-blue-600"
          )}
        >
          <Icon className="w-5 h-5 flex-shrink-0" />
          <span>{item.label}</span>
        </a>
      </Link>
    );
  };

  return (
    <div className="flex h-screen bg-white">
      {/* 侧边栏 */}
      <aside className="w-60 border-r border-gray-200 flex flex-col">
        {/* Logo区域 */}
        <div className="h-16 flex items-center gap-3 px-4 border-b border-gray-200">
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
            <Network className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="text-base font-semibold text-gray-900">URouterOS</div>
            <div className="text-xs text-gray-500">企业级路由系统</div>
          </div>
        </div>

        {/* 菜单列表 */}
        <nav className="flex-1 overflow-y-auto py-4">
          {menuItems.map((item) => renderMenuItem(item))}
        </nav>

        {/* 底部信息 */}
        <div className="border-t border-gray-200 p-4 text-xs text-gray-500">
          <div>系统版本 v1.0.0</div>
          <div>运行时间 24天</div>
        </div>
      </aside>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 顶部工具栏 */}
        <header className="h-16 border-b border-gray-200 flex items-center justify-between px-6">
          <div className="text-lg font-semibold text-gray-900">
            {menuItems
              .flatMap((item) => [item, ...(item.children || [])])
              .find((item) => item.path === location)?.label || "仪表盘"}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-sm text-gray-600">系统正常</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
              A
            </div>
            <span className="text-sm text-gray-700">管理员</span>
          </div>
        </header>

        {/* 页面内容 */}
        <main className="flex-1 overflow-auto bg-gray-50">{children}</main>
      </div>
    </div>
  );
}
