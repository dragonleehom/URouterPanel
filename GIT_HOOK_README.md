# Git Hook 自动推送配置

## 功能说明

已配置 `post-commit` Git Hook,在每次 commit 后自动将代码推送到 GitHub 仓库。

## Hook 位置

`.git/hooks/post-commit`

## 工作原理

1. 每次执行 `git commit` 后自动触发
2. 检查当前分支是否为 `main`
3. 如果是 `main` 分支,自动执行 `git push github main`
4. 推送成功显示 ✅,失败显示 ⚠️ 但不阻止 commit 完成

## 使用方式

正常使用 git 命令即可,无需额外操作:

```bash
git add .
git commit -m "your commit message"
# 👆 commit 完成后会自动推送到 GitHub
```

或使用 webdev_save_checkpoint:

```bash
# webdev_save_checkpoint 会创建 commit
# commit 完成后自动触发 hook 推送到 GitHub
```

## 注意事项

1. **仅在 main 分支生效** - 其他分支不会自动推送
2. **需要 GitHub 认证** - 确保 `gh auth login` 已配置
3. **推送失败不阻止 commit** - 如果网络问题导致推送失败,commit 仍会成功,需手动推送

## 禁用自动推送

如果需要临时禁用自动推送:

```bash
# 方法1: 删除 hook
rm .git/hooks/post-commit

# 方法2: 移除可执行权限
chmod -x .git/hooks/post-commit
```

## 重新启用

```bash
# 恢复可执行权限
chmod +x .git/hooks/post-commit
```

## 测试状态

✅ Hook 已测试并正常工作 (2026-01-29)
