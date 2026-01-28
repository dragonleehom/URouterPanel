import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload, FileText, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface ComposeProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ComposeProjectDialog({
  open,
  onOpenChange,
  onSuccess,
}: ComposeProjectDialogProps) {
  const [projectName, setProjectName] = useState("");
  const [composeContent, setComposeContent] = useState("");
  const [uploadMethod, setUploadMethod] = useState<"paste" | "file">("paste");

  const createMutation = trpc.container.createComposeProject.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Compose项目创建成功");
        onSuccess();
        onOpenChange(false);
        resetForm();
      } else {
        toast.error(data.message);
      }
    },
    onError: (error) => {
      toast.error(`创建失败: ${error.message}`);
    },
  });

  const resetForm = () => {
    setProjectName("");
    setComposeContent("");
    setUploadMethod("paste");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setComposeContent(content);
      };
      reader.readAsText(file);
    }
  };

  const handleCreate = () => {
    if (!projectName.trim()) {
      toast.error("请输入项目名称");
      return;
    }
    if (!composeContent.trim()) {
      toast.error("请提供docker-compose.yml内容");
      return;
    }

    // 简单的YAML语法验证
    if (!composeContent.includes("version:") && !composeContent.includes("services:")) {
      toast.error("docker-compose.yml格式不正确");
      return;
    }

    createMutation.mutate({
      projectName: projectName.trim(),
      composeContent: composeContent.trim(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>创建Compose项目</DialogTitle>
          <DialogDescription>
            上传或粘贴docker-compose.yml文件内容来创建多容器应用
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 项目名称 */}
          <div>
            <Label htmlFor="projectName">项目名称 *</Label>
            <Input
              id="projectName"
              placeholder="my-app"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              disabled={createMutation.isPending}
            />
            <p className="text-xs text-gray-500 mt-1">
              只能包含小写字母、数字、连字符和下划线
            </p>
          </div>

          {/* 上传方式选择 */}
          <div>
            <Label>docker-compose.yml内容 *</Label>
            <div className="flex gap-2 mt-2">
              <Button
                type="button"
                variant={uploadMethod === "paste" ? "default" : "outline"}
                size="sm"
                onClick={() => setUploadMethod("paste")}
                disabled={createMutation.isPending}
              >
                <FileText className="w-4 h-4 mr-2" />
                粘贴内容
              </Button>
              <Button
                type="button"
                variant={uploadMethod === "file" ? "default" : "outline"}
                size="sm"
                onClick={() => setUploadMethod("file")}
                disabled={createMutation.isPending}
              >
                <Upload className="w-4 h-4 mr-2" />
                上传文件
              </Button>
            </div>
          </div>

          {/* 粘贴内容 */}
          {uploadMethod === "paste" && (
            <div>
              <Textarea
                placeholder="version: '3.8'&#10;services:&#10;  web:&#10;    image: nginx:latest&#10;    ports:&#10;      - '80:80'"
                value={composeContent}
                onChange={(e) => setComposeContent(e.target.value)}
                rows={15}
                className="font-mono text-sm"
                disabled={createMutation.isPending}
              />
            </div>
          )}

          {/* 上传文件 */}
          {uploadMethod === "file" && (
            <div>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <input
                  type="file"
                  accept=".yml,.yaml"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="compose-file-upload"
                  disabled={createMutation.isPending}
                />
                <label
                  htmlFor="compose-file-upload"
                  className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium"
                >
                  点击选择文件
                </label>
                <p className="text-sm text-gray-500 mt-1">
                  支持 .yml 和 .yaml 文件
                </p>
              </div>
              {composeContent && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                  <div className="flex items-center gap-2 text-green-700">
                    <FileText className="w-4 h-4" />
                    <span className="text-sm font-medium">文件已加载</span>
                  </div>
                  <pre className="mt-2 text-xs text-gray-600 max-h-32 overflow-y-auto">
                    {composeContent.slice(0, 200)}
                    {composeContent.length > 200 && "..."}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* 提示信息 */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded">
            <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">提示:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>确保docker-compose.yml格式正确</li>
                <li>项目将在后台自动启动</li>
                <li>可以在项目列表中管理已创建的项目</li>
              </ul>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              resetForm();
            }}
            disabled={createMutation.isPending}
          >
            取消
          </Button>
          <Button
            onClick={handleCreate}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending && (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            )}
            创建项目
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
