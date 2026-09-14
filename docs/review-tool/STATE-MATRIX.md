# Component state stories / a11y 矩阵

本轮用独立 HTML 原型及 Playwright，尚未安装/运行 Storybook；以下是可直接落到 Storybook stories 的状态契约，不宣称已部署 Storybook。

| 组件 | stories / 状态 | 检查 |
| --- | --- | --- |
| ReviewLoader | loading / invalid-file / empty | role=status，失败可本地导入，不吞错误 |
| CandidatePanel | example / missing-translation / collocation / polysemy | 来源链接可键盘进入，外部内容 textContent 防注入 |
| Filters | all / selected / no-match | 显式 label，空结果禁用动作 |
| InspectorRail | candidate / auto_verified / quarantine / auto_rejected / published | 只读状态；没有接受操作；输入中禁用全局快捷键 |
| ResultImport | valid / duplicate / missing-score / invalid | schema 与重复 ID 校验；旧人工日志不参与生产 |
| Responsive | 1440 / 390 / long-content | 单列自然滚动，无横向溢出，按钮有焦点描边 |

下一次 Storybook 落地：使用同一纯函数 core 和 UI 小组件 fixture，添加 a11y addon + keyboard interaction stories；不复制 Birdie 主题或打包结构。WCAG/屏幕阅读器尚未正式人工审计，本轮只通过标签、焦点路径和键盘自动检查。
