import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
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
      .input(z.object({ table: z.string().default('main') }))
      .query(async ({ input }) => {
        return await pythonAPI.getRoutes(input.table);
      }),
    add: publicProcedure
      .input(z.any())
      .mutation(async ({ input }) => {
        return await pythonAPI.addRoute(input);
      }),
    delete: publicProcedure
      .input(z.any())
      .mutation(async ({ input }) => {
        return await pythonAPI.deleteRoute(input);
      }),
    getDefaultGateway: publicProcedure.query(async () => {
      return await pythonAPI.getDefaultGateway();
    }),
    setDefaultGateway: publicProcedure
      .input(z.object({
        gateway: z.string(),
        device: z.string().optional()
      }))
      .mutation(async ({ input }) => {
        return await pythonAPI.setDefaultGateway(input.gateway, input.device);
      }),
    getPolicyRules: publicProcedure.query(async () => {
      return await pythonAPI.getPolicyRules();
    }),
    addPolicyRule: publicProcedure
      .input(z.any())
      .mutation(async ({ input }) => {
        return await pythonAPI.addPolicyRule(input);
      }),
  }),

  // ==================== DHCP/DNS管理路由 ====================
  dhcpDns: router({
    configureDHCP: publicProcedure
      .input(z.any())
      .mutation(async ({ input }) => {
        return await pythonAPI.configureDHCP(input);
      }),
    getLeases: publicProcedure.query(async () => {
      return await pythonAPI.getDHCPLeases();
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
    configureDNS: publicProcedure
      .input(z.any())
      .mutation(async ({ input }) => {
        return await pythonAPI.configureDNS(input);
      }),
    getDNSRecords: publicProcedure.query(async () => {
      return await pythonAPI.getDNSRecords();
    }),
    addDNSRecord: publicProcedure
      .input(z.any())
      .mutation(async ({ input }) => {
        return await pythonAPI.addDNSRecord(input);
      }),
    deleteDNSRecord: publicProcedure
      .input(z.object({ hostname: z.string() }))
      .mutation(async ({ input }) => {
        return await pythonAPI.deleteDNSRecord(input.hostname);
      }),
    getDNSStatus: publicProcedure.query(async () => {
      return await pythonAPI.getDNSStatus();
    }),
    startDNS: publicProcedure.mutation(async () => {
      return await pythonAPI.startDNSService();
    }),
    stopDNS: publicProcedure.mutation(async () => {
      return await pythonAPI.stopDNSService();
    }),
    restartDNS: publicProcedure.mutation(async () => {
      return await pythonAPI.restartDNSService();
    }),
  }),

  // ==================== 无线网络管理路由 ====================
  wireless: router({
    getInterfaces: publicProcedure.query(async () => {
      return await pythonAPI.getWirelessInterfaces();
    }),
    configure: publicProcedure
      .input(z.any())
      .mutation(async ({ input }) => {
        return await pythonAPI.configureWireless(input);
      }),
    enable: publicProcedure
      .input(z.object({ iface: z.string() }))
      .mutation(async ({ input }) => {
        return await pythonAPI.enableWireless(input.iface);
      }),
    disable: publicProcedure
      .input(z.object({ iface: z.string() }))
      .mutation(async ({ input }) => {
        return await pythonAPI.disableWireless(input.iface);
      }),
    getClients: publicProcedure
      .input(z.object({ iface: z.string() }))
      .query(async ({ input }) => {
        return await pythonAPI.getWirelessClients(input.iface);
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
    enable: publicProcedure.mutation(async () => {
      return await pythonAPI.enableQoS();
    }),
    disable: publicProcedure.mutation(async () => {
      return await pythonAPI.disableQoS();
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
    getOpenVPNConfig: publicProcedure.query(async () => {
      return await pythonAPI.getOpenVPNConfig();
    }),
    configureOpenVPN: publicProcedure
      .input(z.any())
      .mutation(async ({ input }) => {
        return await pythonAPI.configureOpenVPN(input);
      }),
    startOpenVPN: publicProcedure.mutation(async () => {
      return await pythonAPI.startOpenVPN();
    }),
    stopOpenVPN: publicProcedure.mutation(async () => {
      return await pythonAPI.stopOpenVPN();
    }),
    getWireGuardConfig: publicProcedure.query(async () => {
      return await pythonAPI.getWireGuardConfig();
    }),
    configureWireGuard: publicProcedure
      .input(z.any())
      .mutation(async ({ input }) => {
        return await pythonAPI.configureWireGuard(input);
      }),
    startWireGuard: publicProcedure.mutation(async () => {
      return await pythonAPI.startWireGuard();
    }),
    stopWireGuard: publicProcedure.mutation(async () => {
      return await pythonAPI.stopWireGuard();
    }),
    getClients: publicProcedure.query(async () => {
      return await pythonAPI.getVPNClients();
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
