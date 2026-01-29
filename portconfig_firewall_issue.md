# 网口配置弹框防火墙区域问题

## 发现时间
2026-01-29 18:27

## 问题描述

用户反馈正确:**网口配置标签页(PortConfigTab)的WAN/LAN编辑弹框中,防火墙区域仍然是复选框,而不是下拉菜单。**

## 浏览器截图证据

从浏览器截图可以看到:
- 弹框标题: "编辑接口 - 配置WAN接口参数"
- 防火墙区域部分显示为4个复选框:
  - ☑ WAN
  - ☑ LAN
  - ☐ GUEST
  - ☐ DMZ

## 代码检查结果

之前检查的代码(第756-783行)确实是Select下拉菜单,但这可能是另一个弹框。

需要查找:
1. 网口配置标签页中的WAN/LAN编辑弹框
2. 这个弹框可能在NetworkInterfaces_PortConfigTab_New.tsx文件中
3. 或者在NetworkInterfaces.tsx的另一个位置

## 下一步

1. 查找正确的WAN/LAN编辑弹框代码
2. 将防火墙区域复选框改为Select下拉菜单
3. 与InterfaceConfigTab保持一致
