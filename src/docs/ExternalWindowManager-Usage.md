# 全局 ExternalWindowManager 使用指南

## 概述

通过使用 React Context，我们现在拥有了一个全局唯一的 ExternalWindowManager，确保无论有多少个组件，都只会有一个外部窗口实例在运行。

## 架构设计

### 1. ExternalWindowContext (`src/contexts/ExternalWindowContext.tsx`)
- 提供全局的 ExternalWindowManager 状态管理
- 确保同一时间只有一个外部窗口打开
- 当打开新窗口时，自动关闭已存在的窗口

### 2. useExternalWindow Hook
- 提供 `openWindow`, `closeWindow`, `isWindowOpen` 等方法
- 所有组件通过此 hook 访问全局窗口管理器

### 3. ExternalWindowProvider
- 包装在应用根部 (`src/pages/_app.tsx`)
- 为整个应用提供外部窗口状态

## 使用方法

### 基本使用

```tsx
import { useExternalWindow } from '@/contexts/ExternalWindowContext';

function MyComponent() {
    const { openWindow, closeWindow, isWindowOpen } = useExternalWindow();

    const handleOpenWindow = () => {
        const success = openWindow('https://example.com', {
            onVisitStart: (visited) => {
                console.log('开始访问:', visited);
            },
            onVisitEnd: (visited, totalTime) => {
                console.log('访问结束:', visited, '总时间:', totalTime);
            },
            onWindowClosed: () => {
                console.log('窗口已关闭');
            }
        });

        if (!success) {
            console.error('打开窗口失败');
        }
    };

    return (
        <div>
            <button onClick={handleOpenWindow}>打开外部窗口</button>
            <button onClick={closeWindow} disabled={!isWindowOpen}>
                关闭窗口
            </button>
            {isWindowOpen && <p>外部窗口正在运行</p>}
        </div>
    );
}
```

### 在 LinkActions 中的使用

LinkActions 组件已经更新为使用全局管理器：

```tsx
// 旧方式 - 每个组件有自己的 windowManager
const [externalWindowManager, setExternalWindowManager] = useState<ExternalWindowManager | null>(null);

// 新方式 - 使用全局管理器
const { openWindow, closeWindow, isWindowOpen } = useExternalWindow();
```

### 状态指示器

使用 `ExternalWindowIndicator` 组件来显示全局窗口状态：

```tsx
import { ExternalWindowIndicator } from '@/components/preview/ExternalWindowIndicator';

function Layout() {
    return (
        <div>
            <header>
                <ExternalWindowIndicator className="ml-auto" showCloseButton={true} />
            </header>
            {/* 其他内容 */}
        </div>
    );
}
```

## 主要优势

1. **全局唯一性**: 确保同一时间只有一个外部窗口打开
2. **统一管理**: 所有组件共享同一个窗口实例
3. **自动清理**: 组件卸载时不会影响窗口状态
4. **一致性**: 避免多个窗口同时打开造成的混乱
5. **易用性**: 通过 hook 提供简洁的 API

## 迁移指南

### 从本地状态迁移

如果你有使用本地 ExternalWindowManager 状态的组件：

```tsx
// 旧代码
const [externalWindowManager, setExternalWindowManager] = useState<ExternalWindowManager | null>(null);

const handleOpenWindow = () => {
    const windowManager = openExternalWindow(url, callbacks);
    setExternalWindowManager(windowManager);
};

// 新代码
const { openWindow } = useExternalWindow();

const handleOpenWindow = () => {
    const success = openWindow(url, callbacks);
};
```

### 清理代码

删除以下不再需要的代码：
- 本地 `externalWindowManager` 状态
- 组件卸载时关闭窗口的 `useEffect`
- 手动的窗口实例管理逻辑

## 注意事项

1. 确保在 `_app.tsx` 中包装了 `ExternalWindowProvider`
2. 只在需要外部窗口功能的组件中使用 `useExternalWindow`
3. 不要在 Provider 外部使用 hook（会抛出错误）
4. 窗口关闭回调会自动清理内部状态，无需手动处理 