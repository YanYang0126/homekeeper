# Family Home Page - 项目开发指南

## 项目概述
家庭主页项目，原生 HTML/CSS/JS + PWA 技术栈。

## 技术栈
- **前端**: 原生 HTML5, CSS3, JavaScript (ES6+)
- **PWA**: Service Worker, Web App Manifest
- **部署**: 静态文件托管 (Netlify/Vercel/GitHub Pages)

## 项目结构
```
family_home_page/
├── index.html              # 主页面
├── app.js                  # 应用逻辑
├── styles.css              # 主样式
├── mobile-polish.css       # 移动端优化样式
├── service-worker.js       # PWA Service Worker
├── manifest.webmanifest    # PWA Manifest
├── assets/                 # 静态资源
├── .claude/                # Claude Code 配置
│   ├── settings.local.json # 项目级设置 (Hooks)
│   ├── skills/             # 自定义 Skills
│   └── backups/            # 自动备份目录
└── .mcp.json              # MCP 服务器配置
```

---

## 开发工作流程 (严格执行)

### 每个功能按以下顺序执行:

```
需求分析 → UI设计 → 写代码 → 自动测试 → 修复Bug → 提交版本
```

### 1. 需求分析 (Requirements)
- 理解用户需求，明确功能范围
- 识别影响哪些文件
- 考虑边界情况和错误处理
- 在开始编码前确认需求无误

### 2. UI 设计 (UI Design)
- 使用 `/frontend-design` skill 进行 UI 设计
- 确保移动端响应式 (优先移动端)
- 参考 `mobile-polish.css` 中的移动端样式模式
- 保持与现有设计风格一致
- 使用 Playwright MCP 验证视觉效果

### 3. 写代码 (Implementation)
- 遵循现有代码风格和命名规范
- CSS 变量使用 `:root` 中定义的变量
- JS 使用 ES6+ 语法
- 每个函数保持单一职责
- 添加必要的注释

### 4. 自动测试 (Testing)
- 使用 `/testing` skill 生成测试
- 使用 Playwright MCP 进行浏览器端测试
- 验证移动端和桌面端表现
- 测试 PWA 功能 (离线缓存、安装)

### 5. 修复 Bug (Debugging)
- 使用 `/debugging` skill 分析报错
- 使用 `/code-review` 检查代码质量
- 修复后重新测试确认
- 相似问题全局排查

### 6. 提交版本 (Git Commit)
- 使用 `/commit-commands` 进行 Git 操作
- Commit message 格式: `type: description`
  - `feat:` 新功能
  - `fix:` 修复 Bug
  - `style:` 样式修改
  - `refactor:` 代码重构
  - `docs:` 文档更新
  - `perf:` 性能优化

---

## 可用 Skills 和插件

### 官方插件 (需通过 `/plugin install` 安装)
| 插件 | 用途 | 安装命令 |
|------|------|----------|
| frontend-design | UI/UX 设计、页面布局 | `/plugin install frontend-design` |
| code-review | 代码质量检查 | `/plugin install code-review` |
| code-simplifier | 代码简化和重构 | `/plugin install code-simplifier` |
| feature-dev | 功能开发工作流 | `/plugin install feature-dev` |
| commit-commands | Git 提交管理 | `/plugin install commit-commands` |
| hookify | Hook 规则管理 | `/plugin install hookify` |
| pr-review-toolkit | PR 代码审查 | `/plugin install pr-review-toolkit` |

### 自定义 Skills (已配置)
| Skill | 用途 | 调用方式 |
|-------|------|----------|
| debugging | 自动分析报错、修复运行失败 | `/debugging` 或自动触发 |
| testing | 自动生成测试、检查功能 | `/testing` 或自动触发 |
| documentation | 自动生成文档、README | `/documentation` |
| mobile-dev | React Native/Expo 移动开发 | `/mobile-dev` |
| mini-program-dev | 微信小程序开发 | `/mini-program-dev` |

### MCP 服务器 (已配置在 .mcp.json)
| MCP | 功能 |
|-----|------|
| filesystem | 安全读写项目文件 |
| github | GitHub 仓库管理、PR/Issue |
| playwright | 浏览器自动化测试 |

---

## 自动化 Hooks (已配置)

| 时机 | 操作 |
|------|------|
| 编辑文件前 | 自动备份到 `.claude/backups/` |
| 编辑文件后 | 自动运行 Prettier 格式化 + ESLint 检查 |
| 会话结束时 | 自动 `git commit` 保存进度 |

---

## 编码规范

### HTML
- 语义化标签 (`<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`)
- 图片添加 `alt` 属性
- 表单添加 `label` 和验证属性
- 移动端 viewport 已配置

### CSS
- 使用 CSS 变量 (定义在 `:root`)
- 移动端优先 (@media 断点)
- Flexbox / Grid 布局
- 使用相对单位 (rem, em, %, vw/vh)
- 动画使用 `transform` 和 `opacity` (GPU 加速)

### JavaScript
- 使用 `const` / `let` (禁用 `var`)
- 箭头函数用于回调
- async/await 处理异步
- 事件委托代替多个独立监听器
- DOM 操作缓存引用

### PWA
- Service Worker 更新时通知用户
- 关键资源预缓存
- 离线回退页面
- manifest 图标完整

---

## 移动端适配要点
- 触摸目标最小 44x44px
- 使用 `mobile-polish.css` 中的安全区域适配
- iOS Safari 特殊处理 (`-webkit-tap-highlight-color` 等)
- 滚动流畅 (`-webkit-overflow-scrolling: touch`)
- 输入框缩放防止 (font-size ≥ 16px)
