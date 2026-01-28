/**
 * Docker Compose解析器
 * 将docker-compose.yml转换为dockerode API参数
 */

import yaml from "js-yaml";

export interface ParsedService {
  serviceName: string;
  image: string;
  containerName?: string;
  ports: Array<{ host: string; container: string; protocol?: string }>;
  environment: Record<string, string>;
  volumes: Array<{ host?: string; container: string; mode?: string }>;
  networks?: string[];
  restart?: string;
  command?: string | string[];
  entrypoint?: string | string[];
  workingDir?: string;
  user?: string;
  privileged?: boolean;
  labels?: Record<string, string>;
}

export interface ParsedComposeFile {
  version?: string;
  services: ParsedService[];
  networks?: Record<string, any>;
  volumes?: Record<string, any>;
}

/**
 * 解析端口映射
 * 支持格式: "8080:80", "8080:80/tcp", "127.0.0.1:8080:80"
 */
function parsePortMapping(portStr: string): {
  host: string;
  container: string;
  protocol?: string;
} {
  const parts = portStr.split(":");
  let host: string;
  let container: string;
  let protocol: string | undefined;

  if (parts.length === 2) {
    // "8080:80" or "8080:80/tcp"
    [host, container] = parts;
  } else if (parts.length === 3) {
    // "127.0.0.1:8080:80"
    host = parts[1];
    container = parts[2];
  } else {
    throw new Error(`Invalid port mapping: ${portStr}`);
  }

  // 提取协议
  if (container.includes("/")) {
    [container, protocol] = container.split("/");
  }

  return { host, container, protocol };
}

/**
 * 解析卷挂载
 * 支持格式: "/host/path:/container/path", "/host/path:/container/path:ro", "volume_name:/container/path"
 */
function parseVolumeMapping(volumeStr: string): {
  host?: string;
  container: string;
  mode?: string;
} {
  const parts = volumeStr.split(":");
  
  if (parts.length === 1) {
    // 仅容器路径
    return { container: parts[0] };
  } else if (parts.length === 2) {
    // "host:container"
    return { host: parts[0], container: parts[1] };
  } else if (parts.length === 3) {
    // "host:container:mode"
    return { host: parts[0], container: parts[1], mode: parts[2] };
  }

  throw new Error(`Invalid volume mapping: ${volumeStr}`);
}

/**
 * 解析环境变量
 */
function parseEnvironment(env: any): Record<string, string> {
  if (Array.isArray(env)) {
    // ["KEY=value", "KEY2=value2"]
    const result: Record<string, string> = {};
    for (const item of env) {
      const [key, ...valueParts] = item.split("=");
      result[key] = valueParts.join("=");
    }
    return result;
  } else if (typeof env === "object") {
    // {KEY: "value", KEY2: "value2"}
    return env;
  }
  return {};
}

/**
 * 解析Docker Compose文件
 */
export function parseDockerCompose(composeYaml: string): ParsedComposeFile {
  try {
    const compose: any = yaml.load(composeYaml);

    if (!compose || !compose.services) {
      throw new Error("Invalid docker-compose.yml: missing services");
    }

    const services: ParsedService[] = [];

    for (const [serviceName, serviceConfig] of Object.entries<any>(
      compose.services
    )) {
      const parsed: ParsedService = {
        serviceName,
        image: serviceConfig.image || "",
        containerName: serviceConfig.container_name,
        ports: [],
        environment: {},
        volumes: [],
        networks: serviceConfig.networks
          ? Array.isArray(serviceConfig.networks)
            ? serviceConfig.networks
            : Object.keys(serviceConfig.networks)
          : undefined,
        restart: serviceConfig.restart,
        command: serviceConfig.command,
        entrypoint: serviceConfig.entrypoint,
        workingDir: serviceConfig.working_dir,
        user: serviceConfig.user,
        privileged: serviceConfig.privileged,
        labels: serviceConfig.labels,
      };

      // 解析端口
      if (serviceConfig.ports) {
        for (const port of serviceConfig.ports) {
          if (typeof port === "string") {
            parsed.ports.push(parsePortMapping(port));
          } else if (typeof port === "number") {
            // 短格式: 8080 (映射到相同端口)
            parsed.ports.push({
              host: port.toString(),
              container: port.toString(),
            });
          } else if (typeof port === "object") {
            // 长格式: {target: 80, published: 8080, protocol: tcp}
            parsed.ports.push({
              host: port.published?.toString() || port.target.toString(),
              container: port.target.toString(),
              protocol: port.protocol,
            });
          }
        }
      }

      // 解析环境变量
      if (serviceConfig.environment) {
        parsed.environment = parseEnvironment(serviceConfig.environment);
      }

      // 解析卷挂载
      if (serviceConfig.volumes) {
        for (const volume of serviceConfig.volumes) {
          if (typeof volume === "string") {
            parsed.volumes.push(parseVolumeMapping(volume));
          } else if (typeof volume === "object") {
            // 长格式: {type: bind, source: /host, target: /container}
            parsed.volumes.push({
              host: volume.source,
              container: volume.target,
              mode: volume.read_only ? "ro" : undefined,
            });
          }
        }
      }

      services.push(parsed);
    }

    return {
      version: compose.version,
      services,
      networks: compose.networks,
      volumes: compose.volumes,
    };
  } catch (error) {
    console.error("Failed to parse docker-compose.yml:", error);
    throw new Error(
      `Failed to parse docker-compose.yml: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * 将解析后的服务转换为dockerode createContainer参数
 */
export function serviceToDockerodeConfig(service: ParsedService): any {
  const config: any = {
    name: service.containerName || service.serviceName,
    Image: service.image,
    Env: Object.entries(service.environment).map(([k, v]) => `${k}=${v}`),
    ExposedPorts: {},
    HostConfig: {
      PortBindings: {},
      Binds: [],
      RestartPolicy: {},
      Privileged: service.privileged || false,
    },
    Labels: service.labels || {},
  };

  // 配置端口映射
  for (const port of service.ports) {
    const containerPort = `${port.container}/${port.protocol || "tcp"}`;
    config.ExposedPorts[containerPort] = {};
    config.HostConfig.PortBindings[containerPort] = [
      {
        HostPort: port.host,
      },
    ];
  }

  // 配置卷挂载
  for (const volume of service.volumes) {
    if (volume.host) {
      const bind = `${volume.host}:${volume.container}${volume.mode ? `:${volume.mode}` : ""}`;
      config.HostConfig.Binds.push(bind);
    } else {
      // 匿名卷
      config.HostConfig.Binds.push(volume.container);
    }
  }

  // 配置重启策略
  if (service.restart) {
    const restartMap: Record<string, any> = {
      no: { Name: "no" },
      always: { Name: "always" },
      "on-failure": { Name: "on-failure", MaximumRetryCount: 5 },
      "unless-stopped": { Name: "unless-stopped" },
    };
    config.HostConfig.RestartPolicy = restartMap[service.restart] || {
      Name: "no",
    };
  }

  // 配置命令
  if (service.command) {
    config.Cmd = Array.isArray(service.command)
      ? service.command
      : service.command.split(" ");
  }

  // 配置入口点
  if (service.entrypoint) {
    config.Entrypoint = Array.isArray(service.entrypoint)
      ? service.entrypoint
      : service.entrypoint.split(" ");
  }

  // 配置工作目录
  if (service.workingDir) {
    config.WorkingDir = service.workingDir;
  }

  // 配置用户
  if (service.user) {
    config.User = service.user;
  }

  return config;
}
