/**
 * Docker Compose管理页面
 * 支持YAML文件上传、多容器应用部署和管理
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Layers,
  Upload,
  Play,
  Square,
  Trash2,
  FileText,
  Settings,
  Download,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

export default function ComposeManagement() {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isViewYamlOpen, setIsViewYamlOpen] = useState(false);
  const [selectedYaml, setSelectedYaml] = useState("");
  const [projectName, setProjectName] = useState("");
  const [yamlContent, setYamlContent] = useState("");

  const handleAction = (action: string) => {
    toast.info(`功能开发中: ${action}`);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setYamlContent(content);
        toast.success(`已加载文件: ${file.name}`);
      };
      reader.readAsText(file);
    }
  };

  const handleDeploy = () => {
    if (!projectName || !yamlContent) {
      toast.error("请填写项目名称并上传YAML文件");
      return;
    }
    toast.success(`正在部署项目: ${projectName}`);
    setIsUploadOpen(false);
    setProjectName("");
    setYamlContent("");
  };

  const viewYaml = (yaml: string) => {
    setSelectedYaml(yaml);
    setIsViewYamlOpen(true);
  };

  // 示例YAML内容
  const exampleYamls: Record<string, string> = {
    "wordpress-stack": `version: '3.8'

services:
  wordpress:
    image: wordpress:latest
    ports:
      - "8080:80"
    environment:
      WORDPRESS_DB_HOST: db
      WORDPRESS_DB_USER: wordpress
      WORDPRESS_DB_PASSWORD: wordpress
      WORDPRESS_DB_NAME: wordpress
    volumes:
      - wordpress_data:/var/www/html
    depends_on:
      - db

  db:
    image: mysql:8.0
    environment:
      MYSQL_DATABASE: wordpress
      MYSQL_USER: wordpress
      MYSQL_PASSWORD: wordpress
      MYSQL_ROOT_PASSWORD: rootpassword
    volumes:
      - db_data:/var/lib/mysql

volumes:
  wordpress_data:
  db_data:`,
    "monitoring-stack": `version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      GF_SECURITY_ADMIN_PASSWORD: admin
    volumes:
      - grafana_data:/var/lib/grafana
    depends_on:
      - prometheus

  node-exporter:
    image: prom/node-exporter:latest
    ports:
      - "9100:9100"

volumes:
  prometheus_data:
  grafana_data:`,
    "dev-environment": `version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./html:/usr/share/nginx/html

  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: devuser
      POSTGRES_PASSWORD: devpass
      POSTGRES_DB: devdb
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:`,
  };

  return (
    <div className="space-y-6">
      {/* 页面标题和操作 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium">Docker Compose</h1>
          <p className="text-sm text-muted-foreground mt-1">
            通过YAML配置文件部署和管理多容器应用
          </p>
        </div>
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="w-4 h-4 mr-2" />
              部署应用
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>部署Docker Compose应用</DialogTitle>
              <DialogDescription>
                上传docker-compose.yml文件或直接粘贴配置内容
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="project-name">项目名称</Label>
                <Input
                  id="project-name"
                  placeholder="my-app"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="yaml-file">上传YAML文件</Label>
                <Input
                  id="yaml-file"
                  type="file"
                  accept=".yml,.yaml"
                  onChange={handleFileUpload}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="yaml-content">或直接粘贴配置</Label>
                <Textarea
                  id="yaml-content"
                  placeholder="version: '3.8'&#10;services:&#10;  web:&#10;    image: nginx:latest&#10;    ports:&#10;      - '80:80'"
                  className="font-mono text-sm h-64"
                  value={yamlContent}
                  onChange={(e) => setYamlContent(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsUploadOpen(false)}>
                取消
              </Button>
              <Button onClick={handleDeploy}>部署</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              运行中项目
            </CardTitle>
            <Layers className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-medium">3</div>
            <p className="text-xs text-muted-foreground mt-1">总计 5 个项目</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              总容器数
            </CardTitle>
            <Layers className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-medium">12</div>
            <p className="text-xs text-muted-foreground mt-1">8 个运行中</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              总网络数
            </CardTitle>
            <Layers className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-medium">5</div>
            <p className="text-xs text-muted-foreground mt-1">3 个自定义</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              总卷数
            </CardTitle>
            <Layers className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-medium">8</div>
            <p className="text-xs text-muted-foreground mt-1">占用 12.5 GB</p>
          </CardContent>
        </Card>
      </div>

      {/* 运行中的项目 */}
      <Card>
        <CardHeader>
          <CardTitle>运行中的项目</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                name: "wordpress-stack",
                status: "running",
                containers: 2,
                services: ["wordpress", "db"],
                created: "5天前",
                uptime: "5天",
              },
              {
                name: "monitoring-stack",
                status: "running",
                containers: 3,
                services: ["prometheus", "grafana", "node-exporter"],
                created: "12天前",
                uptime: "12天",
              },
              {
                name: "dev-environment",
                status: "running",
                containers: 3,
                services: ["nginx", "postgres", "redis"],
                created: "8天前",
                uptime: "8天",
              },
            ].map((project) => (
              <Card key={project.name}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="status-indicator running"></span>
                        <h3 className="text-lg font-medium">{project.name}</h3>
                        <Badge variant="default">运行中</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">容器数:</span>
                          <span className="ml-2 font-medium">
                            {project.containers}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">运行时间:</span>
                          <span className="ml-2 font-medium">
                            {project.uptime}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">创建时间:</span>
                          <span className="ml-2 font-medium">
                            {project.created}
                          </span>
                        </div>
                      </div>
                      <div className="mt-3">
                        <span className="text-sm text-muted-foreground">
                          服务:
                        </span>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {project.services.map((service) => (
                            <Badge key={service} variant="outline">
                              {service}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => viewYaml(exampleYamls[project.name])}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        查看配置
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAction(`重启${project.name}`)}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        重启
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAction(`停止${project.name}`)}
                      >
                        <Square className="w-4 h-4 mr-2" />
                        停止
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAction(`配置${project.name}`)}
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        配置
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 已停止的项目 */}
      <Card>
        <CardHeader>
          <CardTitle>已停止的项目</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                name: "test-stack",
                status: "stopped",
                containers: 2,
                services: ["web", "db"],
                created: "2天前",
                stopped: "1小时前",
              },
              {
                name: "backup-stack",
                status: "stopped",
                containers: 1,
                services: ["backup"],
                created: "1周前",
                stopped: "3天前",
              },
            ].map((project) => (
              <Card key={project.name}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="status-indicator stopped"></span>
                        <h3 className="text-lg font-medium">{project.name}</h3>
                        <Badge variant="secondary">已停止</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">容器数:</span>
                          <span className="ml-2 font-medium">
                            {project.containers}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">停止时间:</span>
                          <span className="ml-2 font-medium">
                            {project.stopped}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">创建时间:</span>
                          <span className="ml-2 font-medium">
                            {project.created}
                          </span>
                        </div>
                      </div>
                      <div className="mt-3">
                        <span className="text-sm text-muted-foreground">
                          服务:
                        </span>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {project.services.map((service) => (
                            <Badge key={service} variant="outline">
                              {service}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAction(`启动${project.name}`)}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        启动
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAction(`导出${project.name}`)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        导出配置
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAction(`删除${project.name}`)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        删除
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 查看YAML配置对话框 */}
      <Dialog open={isViewYamlOpen} onOpenChange={setIsViewYamlOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>YAML配置文件</DialogTitle>
            <DialogDescription>
              docker-compose.yml配置内容
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={selectedYaml}
              readOnly
              className="font-mono text-sm h-96"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(selectedYaml);
                toast.success("已复制到剪贴板");
              }}
            >
              复制
            </Button>
            <Button onClick={() => setIsViewYamlOpen(false)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
