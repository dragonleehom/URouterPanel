import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { appStoreRouter } from "./appStoreRouter";
import { containerRouter } from "./containerRouter";
import { containerMonitorRouter } from "./containerMonitorRouter";
import { networkRouter } from "./networkRouter";
import { virtualNetworkRouter } from "./virtualNetworkRouter";
import { vmRouter } from "./vmRouter";
import { getSystemStats, getSystemHistory, getServiceStatus } from "./systemMonitor";
import { getAllHardwareInfo, getCPUInfo, getMemoryInfo, getDiskInfo, getGPUInfo } from "./hardwareMonitor";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { pythonAPI } from "./api-client";
import { z } from "zod";
import {
  executePing,
  executeTraceroute,
  executePortScan,
  executeDNSQuery,
  executeNslookup,
} from "./diagnostics";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  systemMonitor: router({
    getStats: publicProcedure.query(async () => {
      return await getSystemStats();
    }),
    getHistory: publicProcedure
      .input(z.object({ minutes: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return getSystemHistory(input?.minutes);
      }),
    getServiceStatus: publicProcedure.query(async () => {
      return await getServiceStatus();
    }),
  }),
  hardwareMonitor: router({
    getAll: publicProcedure.query(async () => {
      return await getAllHardwareInfo();
    }),
    getCPU: publicProcedure.query(async () => {
      return await getCPUInfo();
    }),
    getMemory: publicProcedure.query(async () => {
      return await getMemoryInfo();
    }),
    getDisks: publicProcedure.query(async () => {
      return await getDiskInfo();
    }),
    getGPUs: publicProcedure.query(async () => {
      return await getGPUInfo();
    }),
  }),
  appStore: appStoreRouter,
  container: containerRouter,
  containerMonitor: containerMonitorRouter,
  network: networkRouter,
  virtualNetwork: virtualNetworkRouter,
  vm: vmRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ==================== 网络接口管理路由 ====================
  networkInterfaces: router({
    list: publicProcedure.query(async () => {
      return await pythonAPI.getInterfaces();
    }),
    listPhysical: publicProcedure.query(async () => {
      return await pythonAPI.getPhysicalInterfaces();
    }),
    get: publicProcedure
      .input(z.object({ name: z.string() }))
      .query(async ({ input }) => {
        return await pythonAPI.getInterface(input.name);
      }),
    getStats: publicProcedure
      .input(z.object({ name: z.string() }))
      .query(async ({ input }) => {
        return await pythonAPI.getInterfaceStats(input.name);
      }),
    configure: publicProcedure
      .input(z.object({ 
        name: z.string(),
        config: z.any()
      }))
      .mutation(async ({ input }) => {
        return await pythonAPI.configureInterface(input.name, input.config);
      }),
    enable: publicProcedure
      .input(z.object({ name: z.string() }))
      .mutation(async ({ input }) => {
        return await pythonAPI.enableInterface(input.name);
      }),
    disable: publicProcedure
      .input(z.object({ name: z.string() }))
      .mutation(async ({ input }) => {
        return await pythonAPI.disableInterface(input.name);
      }),
    createBridge: publicProcedure
      .input(z.any())
      .mutation(async ({ input }) => {
        return await pythonAPI.createBridge(input);
      }),
    deleteBridge: publicProcedure
      .input(z.object({ name: z.string() }))
      .mutation(async ({ input }) => {
        return await pythonAPI.deleteBridge(input.name);
      }),
    createVLAN: publicProcedure
      .input(z.any())
      .mutation(async ({ input }) => {
        return await pythonAPI.createVLAN(input);
      }),
    deleteVLAN: publicProcedure
      .input(z.object({ name: z.string() }))
      .mutation(async ({ input }) => {
        return await pythonAPI.deleteVLAN(input.name);
      }),
  }),

  // ==================== 防火墙管理路由 ====================
  firewall: router({
    getRules: publicProcedure
      .query(async () => {
        return await pythonAPI.getFirewallRules();
      }),
    getRule: publicProcedure
      .input(z.object({ ruleId: z.string() }))
      .query(async ({ input }) => {
        return await pythonAPI.getFirewallRule(input.ruleId);
      }),
    addRule: publicProcedure
      .input(z.any())
      .mutation(async ({ input }) => {
        return await pythonAPI.addFirewallRule(input);
      }),
    updateRule: publicProcedure
      .input(z.object({ ruleId: z.string(), rule: z.any() }))
      .mutation(async ({ input }) => {
        return await pythonAPI.updateFirewallRule(input.ruleId, input.rule);
      }),
    deleteRule: publicProcedure
      .input(z.object({ ruleId: z.string() }))
      .mutation(async ({ input }) => {
        return await pythonAPI.deleteFirewallRule(input.ruleId);
      }),
    enableRule: publicProcedure
      .input(z.object({ ruleId: z.string() }))
      .mutation(async ({ input }) => {
        return await pythonAPI.enableFirewallRule(input.ruleId);
      }),
    disableRule: publicProcedure
      .input(z.object({ ruleId: z.string() }))
      .mutation(async ({ input }) => {
        return await pythonAPI.disableFirewallRule(input.ruleId);
      }),
    getTemplates: publicProcedure
      .query(async () => {
        return await pythonAPI.getFirewallTemplates();
      }),
    getStatus: publicProcedure
      .query(async () => {
        return await pythonAPI.getFirewallStatus();
      }),
    addMasquerade: publicProcedure
      .input(z.any())
      .mutation(async ({ input }) => {
        return await pythonAPI.addMasqueradeRule(input);
      }),
    addPortForward: publicProcedure
      .input(z.any())
      .mutation(async ({ input }) => {
        return await pythonAPI.addPortForwardRule(input);
      }),
    enableIPForward: publicProcedure.mutation(async () => {
      return await pythonAPI.enableIPForward();
    }),
    disableIPForward: publicProcedure.mutation(async () => {
      return await pythonAPI.disableIPForward();
    }),
  }),

  // ==================== 路由管理路由 ====================
  routes: router({
    list: publicProcedure
      .query(async () => {
        return await pythonAPI.getRoutes();
      }),
    add: publicProcedure
      .input(z.any())
      .mutation(async ({ input }) => {
        return await pythonAPI.addStaticRoute(input);
      }),
    delete: publicProcedure
      .input(z.object({ destination: z.string() }))
      .mutation(async ({ input }) => {
        return await pythonAPI.deleteStaticRoute(input.destination);
      }),
    getDefaultGateway: publicProcedure.query(async () => {
      return await pythonAPI.getDefaultGateway();
    }),
    setDefaultGateway: publicProcedure
      .input(z.object({
        gateway: z.string(),
        interface: z.string().optional(),
        metric: z.number().optional()
      }))
      .mutation(async ({ input }) => {
        return await pythonAPI.setDefaultGateway(input.gateway, input.interface, input.metric);
      }),
    getArpTable: publicProcedure.query(async () => {
      return await pythonAPI.getArpTable();
    }),
    getStatus: publicProcedure.query(async () => {
      return await pythonAPI.getRoutingStatus();
    }),
  }),

  // ==================== DHCP/DNS管理路由 ====================
  dhcpDns: router({
    getConfig: publicProcedure.query(async () => {
      return await pythonAPI.getDHCPConfig();
    }),
    configure: publicProcedure
      .input(z.any())
      .mutation(async ({ input }) => {
        return await pythonAPI.configureDHCP(input);
      }),
    getLeases: publicProcedure.query(async () => {
      return await pythonAPI.getDHCPLeases();
    }),
    getStaticLeases: publicProcedure.query(async () => {
      return await pythonAPI.getStaticLeases();
    }),
    addStaticLease: publicProcedure
      .input(z.any())
      .mutation(async ({ input }) => {
        return await pythonAPI.addStaticLease(input);
      }),
    deleteStaticLease: publicProcedure
      .input(z.object({ mac: z.string() }))
      .mutation(async ({ input }) => {
        return await pythonAPI.deleteStaticLease(input.mac);
      }),
    getStatus: publicProcedure.query(async () => {
      return await pythonAPI.getDHCPDNSStatus();
    }),
    start: publicProcedure.mutation(async () => {
      return await pythonAPI.startDHCPDNS();
    }),
    stop: publicProcedure.mutation(async () => {
      return await pythonAPI.stopDHCPDNS();
    }),
    restart: publicProcedure.mutation(async () => {
      return await pythonAPI.restartDHCPDNS();
    }),
  }),

  // ==================== 无线网络管理路由 ====================
  wireless: router({
    getInterfaces: publicProcedure.query(async () => {
      return await pythonAPI.getWirelessInterfaces();
    }),
    getInterfaceInfo: publicProcedure
      .input(z.object({ iface: z.string() }))
      .query(async ({ input }) => {
        return await pythonAPI.getWirelessInterfaceInfo(input.iface);
      }),
    scan: publicProcedure
      .input(z.object({ iface: z.string() }))
      .query(async ({ input }) => {
        return await pythonAPI.scanWiFiNetworks(input.iface);
      }),
    getConfig: publicProcedure.query(async () => {
      return await pythonAPI.getWiFiConfig();
    }),
    configure: publicProcedure
      .input(z.any())
      .mutation(async ({ input }) => {
        return await pythonAPI.configureWiFi(input);
      }),
    getClients: publicProcedure
      .input(z.object({ iface: z.string() }))
      .query(async ({ input }) => {
        return await pythonAPI.getWiFiClients(input.iface);
      }),
    disconnectClient: publicProcedure
      .input(z.object({ iface: z.string(), mac: z.string() }))
      .mutation(async ({ input }) => {
        return await pythonAPI.disconnectWiFiClient(input.iface, input.mac);
      }),
    getStatus: publicProcedure.query(async () => {
      return await pythonAPI.getWirelessStatus();
    }),
    start: publicProcedure.mutation(async () => {
      return await pythonAPI.startWiFi();
    }),
    stop: publicProcedure.mutation(async () => {
      return await pythonAPI.stopWiFi();
    }),
    restart: publicProcedure.mutation(async () => {
      return await pythonAPI.restartWiFi();
    }),
  }),

  // ==================== QoS流控管理路由 ====================
  qos: router({
    getConfig: publicProcedure.query(async () => {
      return await pythonAPI.getQoSConfig();
    }),
    configure: publicProcedure
      .input(z.any())
      .mutation(async ({ input }) => {
        return await pythonAPI.configureQoS(input);
      }),
    getRules: publicProcedure.query(async () => {
      return await pythonAPI.getQoSRules();
    }),
    addRule: publicProcedure
      .input(z.any())
      .mutation(async ({ input }) => {
        return await pythonAPI.addQoSRule(input);
      }),
    deleteRule: publicProcedure
      .input(z.object({ ruleId: z.string() }))
      .mutation(async ({ input }) => {
        return await pythonAPI.deleteQoSRule(input.ruleId);
      }),
    updateRule: publicProcedure
      .input(z.object({ ruleId: z.string(), rule: z.any() }))
      .mutation(async ({ input }) => {
        return await pythonAPI.updateQoSRule(input.ruleId, input.rule);
      }),
    toggleRule: publicProcedure
      .input(z.object({ ruleId: z.string() }))
      .mutation(async ({ input }) => {
        return await pythonAPI.toggleQoSRule(input.ruleId);
      }),
    getStatus: publicProcedure.query(async () => {
      return await pythonAPI.getQoSStatus();
    }),
    enable: publicProcedure.mutation(async () => {
      return await pythonAPI.enableQoS();
    }),
    disable: publicProcedure.mutation(async () => {
      return await pythonAPI.disableQoS();
    }),
    getStatistics: publicProcedure
      .input(z.object({ iface: z.string() }))
      .query(async ({ input }) => {
        return await pythonAPI.getQoSStatistics(input.iface);
      }),
  }),

  // ==================== 多WAN管理路由 ====================
  multiwan: router({
    getConfig: publicProcedure.query(async () => {
      return await pythonAPI.getMultiWANConfig();
    }),
    configure: publicProcedure
      .input(z.any())
      .mutation(async ({ input }) => {
        return await pythonAPI.configureMultiWAN(input);
      }),
    getStatus: publicProcedure.query(async () => {
      return await pythonAPI.getWANStatus();
    }),
  }),

  // ==================== VPN管理路由 ====================
  vpn: router({
    // 获取所有VPN服务状态
    getStatus: publicProcedure.query(async () => {
      return await pythonAPI.getVPNStatus();
    }),

    // OpenVPN
    getOpenVPNStatus: publicProcedure.query(async () => {
      return await pythonAPI.getOpenVPNStatus();
    }),
    getOpenVPNConfig: publicProcedure.query(async () => {
      return await pythonAPI.getOpenVPNConfig();
    }),
    configureOpenVPN: publicProcedure
      .input(z.any())
      .mutation(async ({ input }) => {
        return await pythonAPI.configureOpenVPN(input);
      }),
    addOpenVPNClient: publicProcedure
      .input(z.any())
      .mutation(async ({ input }) => {
        return await pythonAPI.addOpenVPNClient(input);
      }),
    deleteOpenVPNClient: publicProcedure
      .input(z.string())
      .mutation(async ({ input }) => {
        return await pythonAPI.deleteOpenVPNClient(input);
      }),
    startOpenVPN: publicProcedure.mutation(async () => {
      return await pythonAPI.startOpenVPN();
    }),
    stopOpenVPN: publicProcedure.mutation(async () => {
      return await pythonAPI.stopOpenVPN();
    }),
    restartOpenVPN: publicProcedure.mutation(async () => {
      return await pythonAPI.restartOpenVPN();
    }),

    // WireGuard
    getWireGuardStatus: publicProcedure.query(async () => {
      return await pythonAPI.getWireGuardStatus();
    }),
    getWireGuardConfig: publicProcedure.query(async () => {
      return await pythonAPI.getWireGuardConfig();
    }),
    configureWireGuard: publicProcedure
      .input(z.any())
      .mutation(async ({ input }) => {
        return await pythonAPI.configureWireGuard(input);
      }),
    addWireGuardPeer: publicProcedure
      .input(z.any())
      .mutation(async ({ input }) => {
        return await pythonAPI.addWireGuardPeer(input);
      }),
    deleteWireGuardPeer: publicProcedure
      .input(z.string())
      .mutation(async ({ input }) => {
        return await pythonAPI.deleteWireGuardPeer(input);
      }),
    startWireGuard: publicProcedure.mutation(async () => {
      return await pythonAPI.startWireGuard();
    }),
    stopWireGuard: publicProcedure.mutation(async () => {
      return await pythonAPI.stopWireGuard();
    }),
    restartWireGuard: publicProcedure.mutation(async () => {
      return await pythonAPI.restartWireGuard();
    }),

    // Tailscale
    getTailscaleStatus: publicProcedure.query(async () => {
      return await pythonAPI.getTailscaleStatus();
    }),
    loginTailscale: publicProcedure.mutation(async () => {
      return await pythonAPI.loginTailscale();
    }),
    logoutTailscale: publicProcedure.mutation(async () => {
      return await pythonAPI.logoutTailscale();
    }),
    startTailscale: publicProcedure.mutation(async () => {
      return await pythonAPI.startTailscale();
    }),
    stopTailscale: publicProcedure.mutation(async () => {
      return await pythonAPI.stopTailscale();
    }),
  }),

  // ==================== IPv6管理路由 ====================
  ipv6: router({
    getConfig: publicProcedure.query(async () => {
      return await pythonAPI.getIPv6Config();
    }),
    configure: publicProcedure
      .input(z.any())
      .mutation(async ({ input }) => {
        return await pythonAPI.configureIPv6(input);
      }),
    enable: publicProcedure.mutation(async () => {
      return await pythonAPI.enableIPv6();
    }),
    disable: publicProcedure.mutation(async () => {
      return await pythonAPI.disableIPv6();
    }),
  }),

  // ==================== DDNS管理路由 ====================
  ddns: router({
    getConfig: publicProcedure.query(async () => {
      return await pythonAPI.getDDNSConfig();
    }),
    configure: publicProcedure
      .input(z.any())
      .mutation(async ({ input }) => {
        return await pythonAPI.configureDDNS(input);
      }),
    enable: publicProcedure.mutation(async () => {
      return await pythonAPI.enableDDNS();
    }),
    disable: publicProcedure.mutation(async () => {
      return await pythonAPI.disableDDNS();
    }),
    update: publicProcedure.mutation(async () => {
      return await pythonAPI.updateDDNS();
    }),
  }),

  // ==================== UPnP管理路由 ====================
  upnp: router({
    getConfig: publicProcedure.query(async () => {
      return await pythonAPI.getUPnPConfig();
    }),
    configure: publicProcedure
      .input(z.any())
      .mutation(async ({ input }) => {
        return await pythonAPI.configureUPnP(input);
      }),
    enable: publicProcedure.mutation(async () => {
      return await pythonAPI.enableUPnP();
    }),
    disable: publicProcedure.mutation(async () => {
      return await pythonAPI.disableUPnP();
    }),
    getMappings: publicProcedure.query(async () => {
      return await pythonAPI.getUPnPMappings();
    }),
  }),

  // ==================== 流量统计路由 ====================
  traffic: router({
    getStats: publicProcedure.query(async () => {
      return await pythonAPI.getTrafficStats();
    }),
    getHistory: publicProcedure
      .input(z.object({ period: z.string().default('24h') }))
      .query(async ({ input }) => {
        return await pythonAPI.getTrafficHistory(input.period);
      }),
    getByDevice: publicProcedure.query(async () => {
      return await pythonAPI.getTrafficByDevice();
    }),
    getByInterface: publicProcedure.query(async () => {
      return await pythonAPI.getTrafficByInterface();
    }),
  }),

  // ==================== MAC地址管理路由 ====================
  mac: router({
    list: publicProcedure.query(async () => {
      return await pythonAPI.getMACAddresses();
    }),
    addFilter: publicProcedure
      .input(z.any())
      .mutation(async ({ input }) => {
        return await pythonAPI.addMACFilter(input);
      }),
    deleteFilter: publicProcedure
      .input(z.object({ mac: z.string() }))
      .mutation(async ({ input }) => {
        return await pythonAPI.deleteMACFilter(input.mac);
      }),
    clone: publicProcedure
      .input(z.object({
        iface: z.string(),
        mac: z.string()
      }))
      .mutation(async ({ input }) => {
        return await pythonAPI.cloneMAC(input.iface, input.mac);
      }),
    bind: publicProcedure
      .input(z.object({
        mac: z.string(),
        ip: z.string()
      }))
      .mutation(async ({ input }) => {
        return await pythonAPI.bindMACIP(input.mac, input.ip);
      }),
  }),

  // ==================== WOL网络唤醒路由 ====================
  wol: router({
    wake: publicProcedure
      .input(z.object({ mac: z.string() }))
      .mutation(async ({ input }) => {
        return await pythonAPI.sendWOL(input.mac);
      }),
    getDevices: publicProcedure.query(async () => {
      return await pythonAPI.getWOLDevices();
    }),
    addDevice: publicProcedure
      .input(z.any())
      .mutation(async ({ input }) => {
        return await pythonAPI.addWOLDevice(input);
      }),
    deleteDevice: publicProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        return await pythonAPI.deleteWOLDevice(input.id);
      }),
  }),

  // ==================== 网络诊断工具路由 ====================
  diagnostics: router({
    ping: protectedProcedure
      .input(
        z.object({
          target: z.string(),
          count: z.number().min(1).max(100).default(4),
        })
      )
      .mutation(async ({ input }) => {
        return await executePing(input.target, input.count);
      }),

    traceroute: protectedProcedure
      .input(
        z.object({
          target: z.string(),
          maxHops: z.number().min(1).max(64).default(30),
        })
      )
      .mutation(async ({ input }) => {
        return await executeTraceroute(input.target, input.maxHops);
      }),

    portScan: protectedProcedure
      .input(
        z.object({
          target: z.string(),
          ports: z.array(z.number()),
        })
      )
      .mutation(async ({ input }) => {
        return await executePortScan(input.target, input.ports);
      }),

    dnsQuery: protectedProcedure
      .input(
        z.object({
          domain: z.string(),
          type: z.string().default("A"),
        })
      )
      .mutation(async ({ input }) => {
        return await executeDNSQuery(input.domain, input.type);
      }),

    nslookup: protectedProcedure
      .input(
        z.object({
          domain: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        return await executeNslookup(input.domain);
      }),
  }),

  // ==================== 容器管理路由 ====================
  containers: router({
    list: publicProcedure.query(async () => {
      return await pythonAPI.getContainers();
    }),
    get: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        return await pythonAPI.getContainer(input.id);
      }),
    start: publicProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        return await pythonAPI.startContainer(input.id);
      }),
    stop: publicProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        return await pythonAPI.stopContainer(input.id);
      }),
    restart: publicProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        return await pythonAPI.restartContainer(input.id);
      }),
    delete: publicProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        return await pythonAPI.deleteContainer(input.id);
      }),
    stats: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        return await pythonAPI.getContainerStats(input.id);
      }),
  }),

  // ==================== 镜像管理路由 ====================
  images: router({
    list: publicProcedure.query(async () => {
      return await pythonAPI.getImages();
    }),
    pull: publicProcedure
      .input(z.object({ name: z.string() }))
      .mutation(async ({ input }) => {
        return await pythonAPI.pullImage(input.name);
      }),
    delete: publicProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        return await pythonAPI.deleteImage(input.id);
      }),
  }),

  // ==================== 虚拟机管理路由 ====================
  vms: router({
    list: publicProcedure.query(async () => {
      return await pythonAPI.getVMs();
    }),
    get: publicProcedure
      .input(z.object({ name: z.string() }))
      .query(async ({ input }) => {
        return await pythonAPI.getVM(input.name);
      }),
    start: publicProcedure
      .input(z.object({ name: z.string() }))
      .mutation(async ({ input }) => {
        return await pythonAPI.startVM(input.name);
      }),
    stop: publicProcedure
      .input(z.object({ name: z.string() }))
      .mutation(async ({ input }) => {
        return await pythonAPI.stopVM(input.name);
      }),
    reboot: publicProcedure
      .input(z.object({ name: z.string() }))
      .mutation(async ({ input }) => {
        return await pythonAPI.rebootVM(input.name);
      }),
    delete: publicProcedure
      .input(z.object({ name: z.string() }))
      .mutation(async ({ input }) => {
        return await pythonAPI.deleteVM(input.name);
      }),
  }),

  // ==================== 硬件监控路由 ====================
  hardware: router({
    overview: publicProcedure.query(async () => {
      return await pythonAPI.getSystemOverview();
    }),
    cpu: publicProcedure.query(async () => {
      return await pythonAPI.getCPUInfo();
    }),
    memory: publicProcedure.query(async () => {
      return await pythonAPI.getMemoryInfo();
    }),
    disk: publicProcedure.query(async () => {
      return await pythonAPI.getDiskInfo();
    }),
    network: publicProcedure.query(async () => {
      return await pythonAPI.getNetworkInfo();
    }),
    gpu: publicProcedure.query(async () => {
      return await pythonAPI.getGPUInfo();
    }),
  }),
});

export type AppRouter = typeof appRouter;
