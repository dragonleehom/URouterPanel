import { describe, it, expect, beforeAll } from "vitest";
import * as staticRoutesService from "./services/staticRoutesService";

describe("Static Routes Service", () => {
  let createdRouteId: number;

  beforeAll(async () => {
    // 清理测试数据
    const routes = await staticRoutesService.listStaticRoutes();
    for (const route of routes) {
      if (route.name.startsWith("test-")) {
        await staticRoutesService.deleteStaticRoute(route.id);
      }
    }
  });

  it("should list all static routes", async () => {
    const routes = await staticRoutesService.listStaticRoutes();
    expect(Array.isArray(routes)).toBe(true);
  });

  it("should create a static route", async () => {
    const newRoute = await staticRoutesService.createStaticRoute({
      name: "test-default-route",
      interface: "wan",
      target: "0.0.0.0/0",
      gateway: "192.168.1.1",
      metric: 100,
      enabled: 0, // 禁用以避免实际应用
    });

    expect(newRoute).toBeDefined();
    expect(newRoute.name).toBe("test-default-route");
    expect(newRoute.interface).toBe("wan");
    expect(newRoute.target).toBe("0.0.0.0/0");
    expect(newRoute.gateway).toBe("192.168.1.1");
    expect(newRoute.metric).toBe(100);

    createdRouteId = newRoute.id;
  });

  it("should get a static route by id", async () => {
    const route = await staticRoutesService.getStaticRoute(createdRouteId);
    expect(route).toBeDefined();
    expect(route?.name).toBe("test-default-route");
  });

  it("should update a static route", async () => {
    const updatedRoute = await staticRoutesService.updateStaticRoute(createdRouteId, {
      metric: 200,
      gateway: "192.168.1.254",
    });

    expect(updatedRoute.metric).toBe(200);
    expect(updatedRoute.gateway).toBe("192.168.1.254");
  });

  it("should delete a static route", async () => {
    await staticRoutesService.deleteStaticRoute(createdRouteId);
    const route = await staticRoutesService.getStaticRoute(createdRouteId);
    expect(route).toBeUndefined();
  });

  it("should get system routes", async () => {
    const systemRoutes = await staticRoutesService.getSystemRoutes();
    expect(typeof systemRoutes).toBe("string");
  });
});
