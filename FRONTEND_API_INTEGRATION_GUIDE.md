# 前端页面API集成更新指南

## 概述

本指南提供了将前端页面从模拟数据迁移到真实API调用的详细步骤和最佳实践。

---

## 一、通用更新步骤

### 1. 导入必要的依赖

```typescript
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  handleApiError,
  handleApiSuccess,
  adaptList,
  formatBytes,
  getStatusColor,
} from "@/lib/api-helpers";
```

### 2. 替换模拟数据为API调用

**之前 (模拟数据):**
```typescript
const [interfaces, setInterfaces] = useState([
  { id: 1, name: "eth0", status: "up", ... },
  { id: 2, name: "eth1", status: "down", ... },
]);
```

**之后 (API调用):**
```typescript
// 获取数据
const { data: interfaces, isPending, refetch } = trpc.networkInterfaces.list.useQuery();

// 数据适配(如果需要)
const adaptedInterfaces = adaptList(interfaces, (item) => ({
  ...item,
  // 添加前端需要的额外字段
  displayName: `${item.name} (${item.type})`,
}));
```

### 3. 实现Mutation操作

**示例:启用/禁用接口**

```typescript
const toggleMutation = trpc.networkInterfaces.toggle.useMutation({
  onSuccess: () => {
    handleApiSuccess("操作成功");
    refetch(); // 刷新数据
  },
  onError: (error) => {
    handleApiError(error, "操作");
  },
});

const handleToggle = (interfaceId: string) => {
  toggleMutation.mutate({ interfaceId });
};
```

### 4. 添加加载状态

```typescript
{isPending ? (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
) : (
  <div>
    {/* 实际内容 */}
  </div>
)}
```

### 5. 添加错误处理

```typescript
{error && (
  <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
    <p className="text-red-800">加载失败: {error.message}</p>
    <Button onClick={() => refetch()} variant="outline" size="sm" className="mt-2">
      重试
    </Button>
  </div>
)}
```

### 6. 实现自动刷新(可选)

```typescript
useEffect(() => {
  const interval = setInterval(() => {
    refetch();
  }, 5000); // 每5秒刷新一次

  return () => clearInterval(interval);
}, [refetch]);
```

---

## 二、常见场景模式

### 场景1: 列表页面

**特点:** 展示数据列表,支持增删改查

**示例代码:**

```typescript
export default function ListPage() {
  // 获取列表数据
  const { data: items, isPending, error, refetch } = trpc.items.list.useQuery();

  // 删除操作
  const deleteMutation = trpc.items.delete.useMutation({
    onSuccess: () => {
      handleApiSuccess("删除成功");
      refetch();
    },
    onError: (error) => handleApiError(error, "删除"),
  });

  // 添加操作
  const createMutation = trpc.items.create.useMutation({
    onSuccess: () => {
      handleApiSuccess("添加成功");
      refetch();
      setIsDialogOpen(false);
    },
    onError: (error) => handleApiError(error, "添加"),
  });

  const handleDelete = (id: number) => {
    if (confirm("确定要删除吗?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleCreate = (data: any) => {
    createMutation.mutate(data);
  };

  if (isPending) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} onRetry={refetch} />;

  return (
    <div>
      <Button onClick={() => setIsDialogOpen(true)}>添加</Button>
      
      <Table>
        {items?.map((item) => (
          <TableRow key={item.id}>
            <TableCell>{item.name}</TableCell>
            <TableCell>
              <Button onClick={() => handleDelete(item.id)}>删除</Button>
            </TableCell>
          </TableRow>
        ))}
      </Table>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        {/* 添加表单 */}
      </Dialog>
    </div>
  );
}
```

### 场景2: 表单页面

**特点:** 配置表单,提交后保存

**示例代码:**

```typescript
export default function FormPage() {
  const [formData, setFormData] = useState({
    name: "",
    value: "",
  });

  // 获取当前配置
  const { data: config, isPending } = trpc.config.get.useQuery();

  // 更新配置
  const updateMutation = trpc.config.update.useMutation({
    onSuccess: () => {
      handleApiSuccess("保存成功");
    },
    onError: (error) => handleApiError(error, "保存"),
  });

  // 初始化表单数据
  useEffect(() => {
    if (config) {
      setFormData({
        name: config.name,
        value: config.value,
      });
    }
  }, [config]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (isPending) return <LoadingSpinner />;

  return (
    <form onSubmit={handleSubmit}>
      <Input
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      />
      <Button type="submit" disabled={updateMutation.isPending}>
        {updateMutation.isPending ? "保存中..." : "保存"}
      </Button>
    </form>
  );
}
```

### 场景3: 监控页面

**特点:** 实时数据展示,自动刷新

**示例代码:**

```typescript
export default function MonitorPage() {
  const [autoRefresh, setAutoRefresh] = useState(true);

  // 获取监控数据
  const { data: stats, refetch } = trpc.monitor.stats.useQuery();

  // 自动刷新
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refetch();
    }, 2000); // 每2秒刷新

    return () => clearInterval(interval);
  }, [autoRefresh, refetch]);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1>系统监控</h1>
        <div className="flex items-center gap-2">
          <Switch
            checked={autoRefresh}
            onCheckedChange={setAutoRefresh}
          />
          <span>自动刷新</span>
          <Button onClick={() => refetch()}>手动刷新</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>CPU使用率</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.cpu}%</div>
          </CardContent>
        </Card>
        {/* 更多监控卡片 */}
      </div>
    </div>
  );
}
```

### 场景4: 带搜索和筛选的列表

**特点:** 支持搜索、筛选、分页

**示例代码:**

```typescript
export default function SearchableListPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>();
  const [page, setPage] = useState(1);

  // 获取列表数据(带参数)
  const { data, isPending } = trpc.items.search.useQuery({
    search: searchTerm,
    type: filterType,
    page,
    pageSize: 20,
  });

  // 防抖搜索
  const debouncedSearch = useMemo(
    () => debounce((value: string) => {
      setSearchTerm(value);
      setPage(1); // 重置到第一页
    }, 300),
    []
  );

  return (
    <div>
      <div className="flex gap-4 mb-4">
        <Input
          placeholder="搜索..."
          onChange={(e) => debouncedSearch(e.target.value)}
        />
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger>
            <SelectValue placeholder="类型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="type1">类型1</SelectItem>
            <SelectItem value="type2">类型2</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isPending ? (
        <LoadingSpinner />
      ) : (
        <>
          <Table>
            {data?.items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.name}</TableCell>
              </TableRow>
            ))}
          </Table>

          <Pagination
            currentPage={page}
            totalPages={data?.totalPages || 1}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
```

---

## 三、数据适配模式

### 模式1: 简单字段映射

```typescript
const adapter = (backendData: BackendType): FrontendType => ({
  id: backendData.id,
  name: backendData.name,
  displayName: `${backendData.name} (${backendData.type})`,
  statusColor: getStatusColor(backendData.status),
});

const adaptedData = adaptList(data, adapter);
```

### 模式2: 复杂数据转换

```typescript
const adapter = (backendData: BackendInterface): FrontendInterface => {
  // 转换IP地址列表
  const ipAddresses = backendData.ip_addresses?.map(ip => ({
    address: ip.address,
    netmask: ip.netmask,
    cidr: `${ip.address}/${ip.prefix_length}`,
  })) || [];

  // 计算额外字段
  const totalTraffic = (backendData.rx_bytes || 0) + (backendData.tx_bytes || 0);

  return {
    id: backendData.id,
    name: backendData.name,
    type: backendData.type,
    status: backendData.status === 'up' ? 'running' : 'stopped',
    ipAddresses,
    totalTraffic,
    formattedTraffic: formatBytes(totalTraffic),
    isPhysical: backendData.type === 'physical',
  };
};
```

### 模式3: 处理嵌套数据

```typescript
const adapter = (backendData: BackendFirewallRule): FrontendFirewallRule => ({
  id: backendData.id,
  name: backendData.name,
  enabled: backendData.enabled,
  source: {
    ip: backendData.source_ip,
    port: backendData.source_port,
    zone: backendData.source_zone,
  },
  destination: {
    ip: backendData.dest_ip,
    port: backendData.dest_port,
    zone: backendData.dest_zone,
  },
  action: backendData.action,
  protocol: backendData.protocol,
  // 添加前端显示用的字段
  sourceDisplay: `${backendData.source_ip}:${backendData.source_port}`,
  destDisplay: `${backendData.dest_ip}:${backendData.dest_port}`,
});
```

---

## 四、错误处理最佳实践

### 1. 全局错误处理

```typescript
// 在main.tsx中已配置全局错误处理
// 401错误会自动跳转到登录页面
// 其他错误会在控制台输出
```

### 2. 页面级错误处理

```typescript
const { data, error, refetch } = trpc.items.list.useQuery();

if (error) {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
      <h3 className="text-lg font-semibold mb-2">加载失败</h3>
      <p className="text-gray-600 mb-4">{error.message}</p>
      <Button onClick={() => refetch()}>重试</Button>
    </div>
  );
}
```

### 3. Mutation错误处理

```typescript
const mutation = trpc.items.create.useMutation({
  onSuccess: () => {
    handleApiSuccess("创建成功");
    refetch();
  },
  onError: (error) => {
    // 根据错误类型显示不同的提示
    if (error.message.includes("already exists")) {
      toast.error("该项目已存在");
    } else if (error.message.includes("permission")) {
      toast.error("没有权限执行此操作");
    } else {
      handleApiError(error, "创建");
    }
  },
});
```

---

## 五、性能优化

### 1. 使用乐观更新

```typescript
const utils = trpc.useUtils();

const toggleMutation = trpc.items.toggle.useMutation({
  onMutate: async (variables) => {
    // 取消正在进行的查询
    await utils.items.list.cancel();

    // 保存当前数据
    const previousData = utils.items.list.getData();

    // 乐观更新
    utils.items.list.setData(undefined, (old) =>
      old?.map((item) =>
        item.id === variables.id
          ? { ...item, enabled: !item.enabled }
          : item
      )
    );

    return { previousData };
  },
  onError: (err, variables, context) => {
    // 回滚
    if (context?.previousData) {
      utils.items.list.setData(undefined, context.previousData);
    }
    handleApiError(err, "操作");
  },
  onSettled: () => {
    // 重新获取数据
    utils.items.list.invalidate();
  },
});
```

### 2. 条件查询

```typescript
// 只在需要时才发起查询
const { data } = trpc.items.detail.useQuery(
  { id: selectedId! },
  { enabled: !!selectedId } // 只有当selectedId存在时才查询
);
```

### 3. 数据缓存

```typescript
// tRPC会自动缓存查询结果
// 可以通过staleTime和cacheTime控制缓存行为
const { data } = trpc.items.list.useQuery(undefined, {
  staleTime: 60000, // 数据在60秒内被认为是新鲜的
  cacheTime: 300000, // 缓存保留5分钟
});
```

---

## 六、测试建议

### 1. 测试加载状态

- 确保加载时显示loading动画
- 确保加载完成后正确显示数据

### 2. 测试错误状态

- 模拟API错误,确保错误提示正确显示
- 测试重试功能

### 3. 测试操作功能

- 测试增删改查操作
- 确保操作成功后数据正确刷新
- 确保操作失败时显示错误提示

### 4. 测试边界情况

- 空数据列表
- 超长文本
- 特殊字符
- 并发操作

---

## 七、常见问题

### Q1: 如何处理Python后端返回的snake_case字段?

**A:** 在数据适配器中转换:

```typescript
const adapter = (data: any) => ({
  interfaceName: data.interface_name,
  ipAddress: data.ip_address,
  macAddress: data.mac_address,
});
```

### Q2: 如何处理后端返回的时间戳?

**A:** 使用Date对象或date-fns库:

```typescript
import { format } from 'date-fns';

const adapter = (data: any) => ({
  ...data,
  createdAt: new Date(data.created_at * 1000), // Unix timestamp to Date
  formattedDate: format(new Date(data.created_at * 1000), 'yyyy-MM-dd HH:mm:ss'),
});
```

### Q3: 如何处理大量数据的性能问题?

**A:** 使用虚拟滚动或分页:

```typescript
// 分页
const { data } = trpc.items.list.useQuery({
  page: currentPage,
  pageSize: 50,
});

// 或使用react-window进行虚拟滚动
import { FixedSizeList } from 'react-window';
```

### Q4: 如何在多个组件间共享数据?

**A:** 使用tRPC的缓存机制:

```typescript
// 组件A中查询
const { data } = trpc.items.list.useQuery();

// 组件B中使用相同的查询,会使用缓存的数据
const { data: sameData } = trpc.items.list.useQuery();
```

---

## 八、检查清单

更新页面时,请确保完成以下检查:

- [ ] 导入必要的依赖(trpc, toast, api-helpers)
- [ ] 替换所有模拟数据为API调用
- [ ] 添加加载状态(isPending)
- [ ] 添加错误处理(error)
- [ ] 实现数据刷新功能(refetch)
- [ ] 实现Mutation操作(create, update, delete)
- [ ] 添加成功/失败提示(toast)
- [ ] 实现数据适配(如果后端格式与前端不同)
- [ ] 测试所有功能
- [ ] 更新todo.md标记任务完成

---

## 九、参考资源

- [tRPC文档](https://trpc.io/docs)
- [TanStack Query文档](https://tanstack.com/query/latest)
- [API集成工具库](/client/src/lib/api-helpers.ts)
- [网络接口配置页面示例](/client/src/pages/NetworkInterfaces.tsx)

---

**文档版本**: v1.0  
**创建日期**: 2026-01-27  
**作者**: Manus AI Assistant
