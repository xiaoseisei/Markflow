# MarkFlow 测试使用指南

## 快速开始

### 运行所有测试
```bash
pnpm test
```

### 监听模式（开发时使用）
```bash
pnpm test:watch
```

### 生成覆盖率报告
```bash
pnpm test:coverage
```

报告将生成在 `coverage/` 目录下。

### UI 模式（可视化测试结果）
```bash
pnpm test:ui
```

---

## 测试文件结构

```
src/
├── components/
│   ├── Tabs/
│   │   ├── Tab.test.tsx
│   │   └── TabBar.test.tsx
│   ├── Sidebar/
│   │   └── FileTree.test.tsx
│   └── Preview/
│       └── MarkdownPreview.test.tsx
├── store/
│   └── appStore.test.ts
└── utils/
    ├── markdown.test.ts
    ├── fileTree.test.ts
    ├── tauri.test.ts
    └── cn.test.ts
```

---

## 添加新测试

### 组件测试示例

```typescript
// src/components/YourComponent.test.tsx
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { YourComponent } from '@/components/YourComponent'

describe('YourComponent', () => {
  it('renders correctly', () => {
    render(<YourComponent />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })
})
```

### 工具函数测试示例

```typescript
// src/utils/yourUtil.test.ts
import { describe, expect, it } from 'vitest'
import { yourFunction } from '@/utils/yourUtil'

describe('yourFunction', () => {
  it('returns expected result', () => {
    expect(yourFunction('input')).toBe('output')
  })
})
```

### Store 测试示例

```typescript
// src/store/yourStore.test.ts
import { describe, expect, it, beforeEach } from 'vitest'
import { useYourStore } from '@/store/yourStore'

describe('useYourStore', () => {
  beforeEach(() => {
    // 重置 store 状态
    useYourStore.getState().reset()
  })

  it('updates state correctly', () => {
    const store = useYourStore.getState()
    store.setValue('new value')
    expect(useYourStore.getState().value).toBe('new value')
  })
})
```

---

## Mock 技巧

### Mock Tauri API

```typescript
import { vi } from 'vitest'

// Mock Tauri invoke
const mockInvoke = vi.fn()
vi.mock('@tauri-apps/api/core', () => ({
  invoke: (command: string, args?: unknown) => mockInvoke(command, args),
}))
```

### Mock 组件

```typescript
import { vi } from 'vitest'

vi.mock('@/components/ComplexComponent', () => ({
  ComplexComponent: () => <div>Mocked</div>,
}))
```

### Mock Hook

```typescript
import { vi } from 'vitest'

vi.mock('@/hooks/useYourHook', () => ({
  useYourHook: () => ({ value: 'mocked' }),
}))
```

---

## 最佳实践

1. **测试命名清晰**
   ```typescript
   // ✅ 好
   it('returns null when file is not found', () => {})

   // ❌ 差
   it('works correctly', () => {})
   ```

2. **使用 describe 分组**
   ```typescript
   describe('ComponentName', () => {
     describe('when user clicks button', () => {
       it('shows dialog', () => {})
     })
     describe('when user cancels', () => {
       it('hides dialog', () => {})
     })
   })
   ```

3. **遵循 AAA 模式**
   ```typescript
   it('calculates sum correctly', () => {
     // Arrange（准备）
     const a = 1
     const b = 2

     // Act（执行）
     const result = add(a, b)

     // Assert（断言）
     expect(result).toBe(3)
   })
   ```

4. **测试边界条件**
   ```typescript
   describe('boundary conditions', () => {
     it('handles empty input', () => {})
     it('handles null input', () => {})
     it('handles maximum value', () => {})
     it('handles minimum value', () => {})
   })
   ```

---

## 调试测试

### 使用 debug

```typescript
import { screen } from '@testing-library/react'

it('debug example', () => {
  render(<Component />)
  screen.debug() // 打印当前 DOM
})
```

### 只运行特定测试

```typescript
it.only('only run this test', () => {
  // 这个测试会运行
})

it('this test will be skipped', () => {
  // 这个测试会被跳过
})
```

### 跳过特定测试

```typescript
it.skip('skip this test for now', () => {
  // 这个测试会被跳过
})
```

---

## CI/CD 集成

### GitHub Actions 示例

```yaml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm test:coverage
      - uses: codecov/codecov-action@v4
        with:
          files: ./coverage/lcov.info
```

---

## 常见问题

### Q: 测试超时怎么办？
A: 增加超时时间
```typescript
it('slow test', async () => {
  // 测试代码
}, 30000) // 30 秒超时
```

### Q: 如何测试异步代码？
A: 使用 async/await
```typescript
it('async test', async () => {
  const result = await asyncFunction()
  expect(result).toBe('expected')
})
```

### Q: 如何测试用户交互？
A: 使用 fireEvent 或 userEvent
```typescript
import { fireEvent } from '@testing-library/react'

it('handles click', () => {
  render(<Button onClick={handleClick} />)
  fireEvent.click(screen.getByText('Click me'))
  expect(handleClick).toHaveBeenCalled()
})
```
