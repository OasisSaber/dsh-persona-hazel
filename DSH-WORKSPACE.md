# DSH-WORKSPACE.md — HazePersona 接管层（DSH agent 维护）

本文件承载项目专属的 DSH 部署与人格维护规则，是 `AGENTS.md` 权威顺序第 6 层引用的项目资料。TheMasterplan 规则（`AGENTS.md` + `core/` + `profiles/` + `adapters/`）是交付治理层；本文件只管"灰泽满人格怎么部署进 DSH、怎么改"。

## 事实来源与唯一性

- `persona/` 是人格数据的**唯一事实来源**：
  - `persona/soul-card.md` — **部署源**：soul.md 风格全局人设卡（当前生效版本），deploy.ps1 同步为 `plugin/dsh-persona-hazel/persona.txt`
  - `persona/haze-persona.txt` — soul-card.md 的纯文本镜像（完整版存档；check.sh/check.ps1 强制与 soul-card.md 字节一致，改人格只改 soul-card.md 再同步）
  - `persona/` 子目录（core/behavior/speech/world）是 Hzm-AI-Bot 原始蒸馏 JSON，只读参照，不要当注入口改
- 运行时副本：`plugin\dsh-persona-hazel\persona.txt`（由 deploy.ps1 从 soul-card.md 单向同步，不要直接改）

## 硬规则

1. 部署一律走 `.\deploy.ps1`，不要手工复制。
2. 不修改 `persona/` 下任何 Hzm-AI-Bot 原始 JSON 的内容（那是上游证据）。
3. **部署通道只有 `dsh-persona-hazel` 插件**（区段名 `hazel:soul`）：
   - **不要用 dsh-soul-md / `$DSH_HOME\soul.md` 部署**——router-flash（默认预设）的 `applyPersona` 会过滤名字匹配 `/persona/i` 的区段，`soul:persona` 会被清掉（实测失效）。
   - **不要用 agent preset 方案**（用户已明确拒绝，2026-08-16）。
   - **插件区段名不能含 "persona"**（会被 router-flash 过滤）；不能与 `hazel:soul` 重名。
   - 不要重复部署（另一个同机制插件/文件会造成双注入）。
4. 蒸馏原则（来自 persona-resound 方法论）：样本 > 规则；提示词不放具体台词（原话下沉到行为/措辞层）；行为 > 标签（写"什么情境怎么反应"）；措辞/括号等从素材层根治，不靠提示词硬约束堆砌。
5. soul-card.md 的开头声明（"你是灰泽满，但也是用户装进 DSH 的协作者"）是全局注入的必要设计——所有会话都带人设，包括干活会话；不要把它改成纯扮演版。

## 维护命令

- 部署：`powershell -File .\deploy.ps1`（同步 persona.txt + junction + patch 行幂等）
- 首次安装：重启 dsh web（桌面端杀 dsh web 进程 → 弹窗点重新启动）；之后 persona.txt 变更热重载
- 关闭人设：删 patch insert 行 + junction + package.json link 条目（见 plugin/dsh-persona-hazel/README.md）
- 端到端验证：`node deploy\verify-live.mjs`（对运行中的 DSH web 建会话提问，默认 router-flash 预设）
- 静态一致性：`scripts/check.sh` / `scripts/check.ps1`（TheMasterplan 权威验证入口）
