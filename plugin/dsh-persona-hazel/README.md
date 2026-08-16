# dsh-persona-hazel

灰泽满（Hazel）人格**全局注入插件**：注册 `hazel:soul` 系统提示词区段，所有会话生效，不依赖 agent preset。

- 区段名刻意**不含 "persona"**：router-flash（默认预设）的 `applyPersona` 会过滤名字匹配 `/persona/i` 的区段（`soul:persona` 因此失效），`hazel:soul` 绕过该过滤。
- 人格文本打包在 `persona.txt`（同源于 HazePersona/persona/soul-card.md，由 deploy.ps1 同步），fs.watch 热重载。
- 全部配置字段可选（order / complete / fallback / watch / debounceMs），缺失不炸插件树。

## 安装（本机 web profile）

```powershell
.\deploy.ps1        # 同步 persona.txt + 建 node_modules junction + 幂等写入 cordis.patch.yml insert 行
```

新增插件后需**重启 dsh web**（桌面端：杀 dsh web 进程 → 弹窗点"重新启动"）。

## 卸载

1. 删 `profiles\web\cordis.patch.yml` 的 `persona-hazel` insert 行
2. 删 `profiles\web\package.json` 的 `dsh-persona-hazel` link 条目
3. `cmd /c rmdir "profiles\web\node_modules\dsh-persona-hazel"`
