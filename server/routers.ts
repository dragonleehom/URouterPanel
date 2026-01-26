import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { pythonAPI } from "./api-client";
import { z } from "zod";

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

  // 网络管理路由
  network: router({
    getInterfaces: publicProcedure.query(async () => {
      return await pythonAPI.getInterfaces();
    }),
    getInterface: publicProcedure
      .input(z.object({ name: z.string() }))
      .query(async ({ input }) => {
        return await pythonAPI.getInterface(input.name);
      }),
    enableInterface: publicProcedure
      .input(z.object({ name: z.string() }))
      .mutation(async ({ input }) => {
        return await pythonAPI.enableInterface(input.name);
      }),
    disableInterface: publicProcedure
      .input(z.object({ name: z.string() }))
      .mutation(async ({ input }) => {
        return await pythonAPI.disableInterface(input.name);
      }),
    getFirewallRules: publicProcedure.query(async () => {
      return await pythonAPI.getFirewallRules();
    }),
    getRoutes: publicProcedure.query(async () => {
      return await pythonAPI.getRoutes();
    }),
    getDHCPConfig: publicProcedure.query(async () => {
      return await pythonAPI.getDHCPConfig();
    }),
  }),

  // 容器管理路由
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

  // 镜像管理路由
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

  // 虚拟机管理路由
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

  // 硬件监控路由
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
