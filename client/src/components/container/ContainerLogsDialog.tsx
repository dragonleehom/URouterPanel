/**
 * 容器日志查看对话框组件
 * 显示容器的实时日志输出
 */

import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Download, RefreshCw, Search, X } from "lucide-react";
import { toast } from "sonner";

interface ContainerLogsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  containerId: string;
  containerName: string;
}

export function ContainerLogsDialog({
  open,
  onOpenChange,
  containerId,
  containerName,
}: ContainerLogsDialogProps) {
  const [tailLines, setTailLines] = useState(100);
  const [searchTerm, setSearchTerm] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // 获取容器日志
  const { data: logsData, refetch, isLoading } = trpc.container.getContainerLogs.useQuery(
    {
      containerId,
      tail: tailLines,
    },
    {
      enabled: open,
      refetchInterval: autoRefresh ? 3000 : false,
    }
  );

  const logs = logsData?.logs || "";

  // 自动滚动到底部
  useEffect(() => {
    if (autoRefresh && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, autoRefresh]);

  // 过滤日志
  const filteredLogs = searchTerm
    ? logs
        .split("\n")
        .filter((line) => line.toLowerCase().includes(searchTerm.toLowerCase()))
        .join("\n")
    : logs;

  // 导出日志
  const handleExport = () => {
    const blob = new Blob([logs], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${containerName}-logs-${new Date().toISOString()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("日志已导出");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>容器日志 - {containerName}</DialogTitle>
          <DialogDescription>
            显示最近 {tailLines} 行日志
            {autoRefresh && (
              <Badge variant="outline" className="ml-2">
                自动刷新
              </Badge>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* 工具栏 */}
        <div className="flex items-center gap-2 pb-3 border-b">
          <div className="flex items-center gap-2 flex-1">
            <Search className="w-4 h-4 text-gray-400" />
            <Input
              placeholder="搜索日志..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9"
            />
            {searchTerm && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSearchTerm("")}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={tailLines}
              onChange={(e) => setTailLines(Number(e.target.value))}
              className="h-9 px-3 rounded-md border border-gray-300 text-sm"
            >
              <option value={50}>50行</option>
              <option value={100}>100行</option>
              <option value={200}>200行</option>
              <option value={500}>500行</option>
              <option value={1000}>1000行</option>
            </select>

            <Button
              size="sm"
              variant={autoRefresh ? "default" : "outline"}
              onClick={() => setAutoRefresh(!autoRefresh)}
              title={autoRefresh ? "停止自动刷新" : "启动自动刷新"}
            >
              <RefreshCw className={`w-4 h-4 ${autoRefresh ? "animate-spin" : ""}`} />
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>

            <Button size="sm" variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-1" />
              导出
            </Button>
          </div>
        </div>

        {/* 日志内容 */}
        <div className="flex-1 overflow-y-auto bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm">
          {isLoading && !logs ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <RefreshCw className="w-5 h-5 animate-spin mr-2" />
              加载日志中...
            </div>
          ) : filteredLogs ? (
            <pre className="whitespace-pre-wrap break-words">
              {filteredLogs}
              <div ref={logsEndRef} />
            </pre>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              暂无日志
            </div>
          )}
        </div>

        {/* 统计信息 */}
        <div className="text-xs text-gray-500 pt-2 border-t">
          总行数: {logs.split("\n").filter((line) => line.trim()).length}
          {searchTerm && (
            <>
              {" "}
              | 匹配: {filteredLogs.split("\n").filter((line) => line.trim()).length}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
