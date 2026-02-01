# Select.Item Error

错误信息: `A <Select.Item /> must have a value prop that is not an empty string.`

**原因**: InterfaceConfigDialog组件中的某些Select.Item使用了空字符串作为value

**需要修复的位置**:
1. IPv6分配长度 Select - "未启用"选项的value为空字符串
2. IPv6前缀过滤器 Select - "未启用"选项的value为空字符串
3. IPv4路由表 Select - "未启用"选项的value为空字符串
4. IPv6路由表 Select - "未启用"选项的value为空字符串

**解决方案**: 将空字符串改为有意义的值(如"disabled"或"none")
