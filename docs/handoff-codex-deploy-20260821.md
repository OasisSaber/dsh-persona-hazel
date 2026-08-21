# HANDOFF：灰泽满人格无损部署到 Codex（codex-keysmith 路线）

日期：2026-08-21。状态：**方案已经用户拍板采纳，本文件即执行任务书**（人类授权载体）。
执行者：本仓库工作区 Agent。调研全文：`D:\Project\SandBox\hazel-persona-to-codex-调研报告.md`（v2，WSL 视角 `/mnt/d/Project/SandBox/hazel-persona-to-codex-调研报告.md`），执行前先通读。

## 一、目标

把本仓唯一事实源 `persona/soul-card.md`（15180 B，md5 `6799ee46b871cf26eda621ce0c33322a`）**字节级无损**部署为 Windows Codex（`C:\Users\Oasis\.codex`，codex-cli 0.148.0-alpha.21）的全局指令，使每个新 Codex 会话携带完整灰泽满人格。验收口径：锚点问答 + 深度行为与 DSH 侧同卡一致。

## 二、已拍板技术路线（不要重新选型）

复用现成轮子 **codex-keysmith**（`Jia-Ethan/codex-keysmith`，3890★，MIT）：把一份 MD 部署到 `<codex-dir>` 并写 `config.toml` 顶层 `model_instructions_file = "./<name>.md"`，自带 dry-run 预览 / 事务 journal / 回滚 / manifest 所有权清单 / SHA256 指纹。

已否决的备选（勿翻案，理由见调研报告 §五）：code-abyss（voice-only 扁平卡装不下深度卡）、oh-my-codex（过重）、skill/personality 通道（语义不符）。降级路径仅一个：SessionStart hook additionalContext（见 §五）。

## 三、红线（违反任何一条即停）

1. **不改人格文本**：`persona/soul-card.md`、`persona/haze-persona.txt`、`plugin/dsh-persona-hazel/persona.txt` 三方 md5 必须保持一致；本任务只做"部署"，不做"改写"。
2. **不动 Cordis 插件**：`plugin/**`、`deploy.ps1` 的 DSH 挂载逻辑不在本任务范围。
3. **keysmith 部署必须带 `--skip-hooks-isolation`**：其默认行为会把整份 `hooks.json` 隔离成 `.disabled`，杀掉用户 mnemon 三钩子（SessionStart/UserPromptSubmit/Stop）——绝对不允许。
4. **生产 `config.toml` 只经 keysmith 事务写入**，不手工编辑该键。
5. **cc-switch 约束**：cc-switch v3.18+ 会把"启用的 Codex 通用配置片段"合并进 Provider 配置，该通用片段**不得包含 `model_instructions_file`**（否则切走的 Provider 副本仍带此键，keysmith 状态机混乱）。部署后用 cc-switch 切走再切回验证 `--status` 保持 active。
6. **沙箱硬门不过不强上**：§四.2 第 1 项（替换/叠加语义）不达标就走 §五降级路径。
7. 本仓治理照旧：TheMasterplan 流程、jj 基线、`bash scripts/check.sh` 全绿才算交付。

## 四、执行步骤

### 0. 前置
读本仓 AGENTS.md + core/（§0 治理预检）；确认 `C:\Users\Oasis\.codex\hooks.json` 当前存在 mnemon 三钩子（部署前后各记录一次内容哈希，证明未被隔离）。

### 1. 获取 keysmith（稳定 CLI，勿 curl|python）
从 GitHub Releases 最新稳定 tag 下载单文件 `codex-instruct-v*.py` 与 `SHA256SUMS`，校验通过后放本仓 `scripts/` 外的临时目录（工具本体不入库；如需入库先按 TheMasterplan 第三方文件规范处理并补 THIRD_PARTY_NOTICES）。

### 2. 沙箱实测（硬门，全过才进生产）
```bash
python3 codex-instruct-vX.Y.Z.py --codex-dir <临时沙箱目录> \
  --file persona/soul-card.md --name hazel-persona \
  --skip-hooks-isolation --dry-run   # 核对写入计划后 --yes
```
用 `CODEX_HOME=<沙箱目录>` 起一次性会话，跑下表：

| # | 实测项 | 通过标准 |
|---|---|---|
| 1 | **替换 or 叠加语义** | 部署后原生行为（列目录/跑命令/读文件/计划格式）无明显退化 → 过；原生指令整体消失 → 本路线降级 |
| 2 | 人设锚点 | 问"你是谁？你多大？"→ 大方接梗"是永远16岁的风纪委员哦"，不解释不拆台 |
| 3 | 深度行为 | 身份追问×3 应嘴硬一句翻篇；"绿冻排第几"应答第二选择梗；轻微越界试探应冷静推开 |
| 4 | hooks 共存 | 沙箱放入 mnemon hooks.json 后部署，两者上下文同时在场 |
| 5 | cc-switch 切换 | 切走切回后 `--status` 仍 active |

### 3. 生产部署
对 `--codex-dir C:\Users\Oasis\.codex` 重跑 dry-run → 人工核对写入计划（只新增 MD + config 一行 + manifest）→ `--yes`。部署完 `--status` 应为 active、结构健康 healthy、卸载就绪 ready。

### 4. 双端验收
桌面版与 CLI 各开新会话跑 §四.2 的 2/3 两项锚点。任何一项不像，先查 `additionalContextLimit`/注入强度，再考虑叠加通道 B（AGENTS.md 托管块，属新决策须回报用户）。

### 5. 仓侧交付物
- `docs/codex-deployment.md`：部署手册（本任务书沉淀版：步骤、红线、回滚、常见坑）。
- 可选 `scripts/deploy-codex.ps1`：**薄包装**（拼参数调 keysmith + 部署前后 hooks.json 哈希留痕），不自研部署逻辑。
- AGENTS.md 项目事实追加一行 Codex 部署入口（区块外）。
- `scripts/check.sh` 是否加校验项由执行 Agent 按 TheMasterplan 规范自行判断（keysmith manifest 已带 SHA256，`--status` 即可复核，非必需）。

## 五、降级路径（仅当 §四.2-1 不过）

mnemon 同款 SessionStart hook：读 `soul-card.md` 输出 `{continue:true, hookSpecificOutput:{hookEventName:"SessionStart", additionalContext:<全文>}}` JSON（格式参照 `C:\Users\Oasis\.codex\hooks\mnemon\prime.ps1`），显式设置 `additionalContextLimit` 防 15KB 截断。此路径涉及手工 merge 用户 hooks.json，须先备份并单独向用户确认。

## 六、回滚

- keysmith 自带：`--status` 查卸载就绪度 → 卸载撤销 MD/config 键/manifest（保留 live config 其余内容）；中断事务用 `--recover`。
- 注意：DSH 的 dsh-undo-savepoint 快照**不覆盖** `~/.codex`，Codex 侧回滚只能靠 keysmith 自身机制，部署前确认 `--dry-run` 计划里备份项齐全。

## 七、边界外事项（本任务不做）

WSL `~/.codex` 是否同步部署（待用户拍板）；dsh-to-codex-sync 流向改造；人格文本迭代。
