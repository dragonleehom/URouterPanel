import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import NetworkManagement from "./pages/NetworkManagement";
import ContainerManagement from "./pages/ContainerManagement";
import ComposeManagement from "./pages/ComposeManagement";
import Monitoring from "./pages/Monitoring";
import DashboardBuilder from "./pages/DashboardBuilder";
import NetworkInterfaces from "./pages/NetworkInterfaces";
import FirewallManagement from "@/pages/FirewallManagement";
import FirewallExample from "@/pages/FirewallExample";
import DHCPDNSManagement from "./pages/DHCPDNSManagement";
import SystemSettings from "./pages/SystemSettings";
import NetworkDiagnosticsOptimized from "./pages/NetworkDiagnosticsOptimized";
import WirelessManagement from "./pages/WirelessManagement";
import QoSManagement from "./pages/QoSManagement";
import MultiWANManagement from "./pages/MultiWANManagement";
import VPNManagement from "./pages/VPNManagement";
import IPv6Management from "./pages/IPv6Management";
import DDNSManagement from "./pages/DDNSManagement";
import UPnPManagement from "./pages/UPnPManagement";
import TrafficStatistics from "./pages/TrafficStatistics";
import MACManagement from "./pages/MACManagement";
import WOLManagement from "./pages/WOLManagement";
import RoutingManagement from "./pages/RoutingManagement";
import PlaceholderPage from "./pages/PlaceholderPage";
import AppStore from "./pages/AppStore";
import DockerNetworkManagement from "./pages/DockerNetworkManagement";
import VMManagement from "./pages/VMManagement";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/network" component={NetworkManagement} />
        <Route path="/containers" component={ContainerManagement} />
        <Route path="/compose" component={ComposeManagement} />
        <Route path="/monitoring" component={Monitoring} />
        <Route path="/dashboard-builder" component={DashboardBuilder} />
        <Route path="/network-interfaces" component={NetworkInterfaces} />
        <Route path="/firewall" component={FirewallManagement} />
        <Route path="/firewall-example" component={FirewallExample} />
        <Route path="/dhcp-dns" component={DHCPDNSManagement} />
        <Route path="/settings" component={SystemSettings} />
        <Route path="/diagnostics" component={NetworkDiagnosticsOptimized} />
        <Route path="/wireless" component={WirelessManagement} />
        <Route path="/qos" component={QoSManagement} />
        <Route path="/routing" component={RoutingManagement} />
        <Route path="/multiwan" component={MultiWANManagement} />
        <Route path="/vpn" component={VPNManagement} />
        <Route path="/ipv6" component={IPv6Management} />
        <Route path="/ddns" component={DDNSManagement} />
        <Route path="/upnp" component={UPnPManagement} />
        <Route path="/traffic" component={TrafficStatistics} />
        <Route path="/mac" component={MACManagement} />
        <Route path="/wol" component={WOLManagement} />
        <Route path="/appstore" component={AppStore} />
         <Route path="/docker-network" component={DockerNetworkManagement} />
        <Route path="/vms" component={VMManagement} />
        <Route path="/hardware">
          <PlaceholderPage
            title="硬件监控"
            description="监控CPU、内存、磁盘、网卡、GPU等硬件资源"
          />
        </Route>
        <Route path="/system">
          <PlaceholderPage
            title="系统状态"
            description="查看系统信息、进程列表、日志等"
          />
        </Route>
        <Route path="/settings">
          <PlaceholderPage
            title="系统设置"
            description="配置系统参数、用户管理、备份恢复等"
          />
        </Route>
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster position="top-right" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
