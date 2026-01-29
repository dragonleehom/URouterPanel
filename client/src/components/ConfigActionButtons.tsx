/**
 * 配置管理按钮组
 * 提供保存并应用、保存、复位三个按钮
 */

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { Loader2, Save, Play, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface ConfigActionButtonsProps {
  /**
   * 保存配置(不应用)
   */
  onSave?: () => Promise<void>;
  
  /**
   * 保存并应用配置
   */
  onSaveAndApply: () => Promise<void>;
  
  /**
   * 复位配置到最后应用的版本
   */
  onReset: () => Promise<void>;
  
  /**
   * 是否禁用所有按钮
   */
  disabled?: boolean;
  
  /**
   * 是否显示保存按钮(默认true)
   */
  showSaveButton?: boolean;
}

export function ConfigActionButtons({
  onSave,
  onSaveAndApply,
  onReset,
  disabled = false,
  showSaveButton = true,
}: ConfigActionButtonsProps) {
  const [loading, setLoading] = useState(false);
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);

  const handleSave = async () => {
    if (!onSave) return;
    
    setLoading(true);
    try {
      await onSave();
      toast.success("配置已保存", {
        description: "配置将在下次重启后生效",
      });
    } catch (error: any) {
      toast.error("保存失败", {
        description: error.message || "未知错误",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAndApply = async () => {
    setShowApplyDialog(false);
    setLoading(true);
    try {
      await onSaveAndApply();
      toast.success("配置已应用", {
        description: "配置已生效",
      });
    } catch (error: any) {
      toast.error("应用失败", {
        description: error.message || "未知错误",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setShowResetDialog(false);
    setLoading(true);
    try {
      await onReset();
      toast.success("配置已复位", {
        description: "已恢复到最后一次应用的版本",
      });
    } catch (error: any) {
      toast.error("复位失败", {
        description: error.message || "未知错误",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-3">
        {/* 保存并应用 - 主要操作 */}
        <Button
          onClick={() => setShowApplyDialog(true)}
          disabled={disabled || loading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Play className="h-4 w-4 mr-2" />
          )}
          保存并应用
        </Button>

        {/* 保存 - 次要操作 */}
        {showSaveButton && onSave && (
          <Button
            onClick={handleSave}
            disabled={disabled || loading}
            variant="outline"
          >
            <Save className="h-4 w-4 mr-2" />
            保存
          </Button>
        )}

        {/* 复位 - 危险操作 */}
        <Button
          onClick={() => setShowResetDialog(true)}
          disabled={disabled || loading}
          variant="outline"
          className="text-red-600 border-red-600 hover:bg-red-50"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          复位
        </Button>
      </div>

      {/* 保存并应用确认对话框 */}
      <AlertDialog open={showApplyDialog} onOpenChange={setShowApplyDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确定应用配置?</AlertDialogTitle>
            <AlertDialogDescription>
              服务将重启,可能导致短暂网络中断。请确保配置正确。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveAndApply}>
              确定应用
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 复位确认对话框 */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确定复位配置?</AlertDialogTitle>
            <AlertDialogDescription>
              将恢复到最后一次应用的版本,当前未保存的修改将丢失。服务将重启。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReset}
              className="bg-red-600 hover:bg-red-700"
            >
              确定复位
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
