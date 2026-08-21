# Codex 人格部署手册（codex-keysmith 路线）

> 状态：2026-08-21 已完成生产部署并验收（`--status` active / healthy / ready）。
> 任务书：[handoff-codex-deploy-20260821.md](handoff-codex-deploy-20260821.md)；调研全文：
> `D:\Project\SandBox\hazel-persona-to-codex-调研报告.md`。
> 本手册是任务书的沉淀版：步骤、红线、回滚、常见坑。

## 一、目标与验收口径

把唯一事实源 `persona/soul-card.md` **字节级无损**部署为 Windows Codex
（`C:\Users\Oasis\.codex`）的全局指令（config.toml 顶层
`model_instructions_file`），使每个新 Codex 会话携带完整灰泽满人格。
验收口径：锚点问答 + 深度行为与 DSH 侧同卡一致。

**这是适配 Codex，不是放弃 DSH**：DSH 侧 Cordis 插件（`hazel:soul` 区段）、
deploy.ps1 挂载逻辑、三方人格文件一律不动，两条注入通道并行。

## 二、技术路线（已拍板，勿重新选型）

- 工具：[`Jia-Ethan/codex-keysmith`](https://github.com/Jia-Ethan/codex-keysmith)
  v0.3.9（MIT，稳定 CLI Release），单文件 `codex-instruct-v0.3.9.py`
  （SHA-256 `d31dfa7d745d27b7f7e9f7a728ce471938c42a577b80030f6d606f681b681f1d`，
  以 Release 附带 `SHA256SUMS` 校验）。工具本体不入库，本机放
  `D:\Project\SandBox\keysmith\`。
- 机制：部署一份 MD 到 `<codex-dir>` 并写 config.toml 顶层
  `model_instructions_file = "./<name>.md"`；自带 dry-run / 事务 journal /
  备份 / manifest 所有权清单 / SHA256 指纹 / `--status` / `--uninstall` /
  `--recover`。
- 已否决备选（理由见调研报告 §五）：code-abyss（voice-only 扁平卡装不下深度卡）、
  oh-my-codex（过重）、skill/personality 通道（语义不符）。

## 三、红线（违反任何一条即停）

1. **不改人格文本**：`persona/soul-card.md`、`persona/haze-persona.txt`、
   `plugin/dsh-persona-hazel/persona.txt` 三方 md5 必须保持一致。
2. **不动 Cordis 插件**：`plugin/**`、`deploy.ps1` 的 DSH 挂载逻辑不在部署范围。
3. **keysmith 必须带 `--skip-hooks-isolation`**：默认行为会把整份 hooks.json
   隔离成 `.disabled`，杀掉 mnemon 三钩子（SessionStart/UserPromptSubmit/Stop）。
4. **生产 config.toml 只经 keysmith 事务写入**，不手工编辑该键。
5. **cc-switch 约束**：启用的 Codex 通用配置片段不得包含
   `model_instructions_file`（已核验：cc-switch.db 全库无此键）；切换 Provider
   后用 `--status` 复核仍为 active。
6. **沙箱硬门不过不强上**：替换/叠加语义不达标就降级 SessionStart hook 路线。
7. 仓侧治理照旧：TheMasterplan 流程、jj 基线、`bash scripts/check.sh` 全绿。

## 四、标准部署流程

### 0. 前置留痕

```bash
md5sum persona/soul-card.md persona/haze-persona.txt plugin/dsh-persona-hazel/persona.txt
sha256sum /mnt/c/Users/Oasis/.codex/hooks.json   # 部署前后各记一次
```

### 1. 部署（薄包装或直调 keysmith）

推荐薄包装（自动做 hooks.json 前后哈希留痕）：

```powershell
pwsh -NoProfile -File scripts/deploy-codex.ps1 -DryRun   # 先预览
pwsh -NoProfile -File scripts/deploy-codex.ps1 -Yes      # 确认写入
```

等价直调（注意五个参数一个都不能少）：

```powershell
py -3 D:\Project\SandBox\keysmith\codex-instruct-v0.3.9.py `
  --codex-dir C:\Users\Oasis\.codex `
  --file D:\Project\GitProject\dsh-persona-hazel\persona\soul-card.md `
  --name hazel-persona --skip-hooks-isolation --dry-run   # 核对后换 --yes
```

dry-run 计划核对要点：只新增 MD + config 一行 + manifest；config.toml 备份项在；
hooks.json 显示 regular file（未被隔离）。

### 2. 部署后复核

```powershell
py -3 ...\codex-instruct-v0.3.9.py --codex-dir C:\Users\Oasis\.codex --status
# 期望：active / 结构健康 healthy / 卸载就绪度 ready / 事务残留 none
```

外加：hooks.json sha256 与部署前一致；`cmp` 部署 MD 与 soul-card.md 字节一致；
config.toml 对备份 diff 仅一行。

## 五、沙箱实测协议（换机器/换版本时重跑）

临时目录当 `--codex-dir`（需先放一份最小 config.toml + auth.json），用
`CODEX_HOME=<沙箱>` 起一次性会话跑五项：

| # | 实测项 | 通过标准 | 2026-08-21 结果 |
|---|---|---|---|
| 1 | 替换 or 叠加语义 | 原生行为（列目录/跑命令）无明显退化 | ✅ 叠加；模型正常发起 exec 工具调用 |
| 2 | 人设锚点 | 大方接梗不拆台 | ✅「永远16岁的风纪委员哦」 |
| 3 | 深度行为 | 身份追问嘴硬翻篇；绿冻第二选择梗；越界冷静推开 | ✅ 三连全中 |
| 4 | hooks 共存 | hooks.json 未被隔离 | ✅ 结构验证（见 §八限制 1） |
| 5 | cc-switch 切换 | 切走切回后 `--status` 仍 active | ⏳ 片段已核验无危险键，切换动作待 GUI 操作 |

一次性会话姿势（codex exec 模式）：

```powershell
$env:CODEX_HOME='C:\Users\Oasis\.codex-keysmith-sandbox'
$null | codex exec --skip-git-repo-check '你是谁？你多大？'
```

## 六、回滚

- keysmith 自带：`--status` 查卸载就绪度 → `--uninstall`（先预览后 `--yes`）
  撤销 MD/config 键/manifest，保留 live config 其余内容；中断事务用 `--recover`。
- **DSH 的 dsh-undo-savepoint 快照不覆盖 `~/.codex`**，Codex 侧回滚只能靠
  keysmith 自身机制；每次部署的 `config.toml.bak_*` 与 journal 请保留。

## 七、改卡后的重部署

1. 改 `persona/soul-card.md` → `bash scripts/check.sh` 三方一致全绿；
2. 重跑 §四.1 部署命令（keysmith 对同路径已有文件做时间戳备份后替换）；
3. 新开 Codex 会话验证锚点。

## 八、已知限制与实测观察（2026-08-21）

1. **codex exec 模式不触发 SessionStart 钩子**（沙箱日志无 hook 事件记录），
   第 4 项只能做结构验证：hooks.json 未被隔离 + 生产 trusted_hash 登记不变 +
   部署前后哈希一致。钩子的功能级共存由生产桌面版日常运行背书。
2. Codex 加载指令层会剥掉文末最后一个换行符（base_instructions 5787 字 vs
   源文件 5788 字），部署文件本身字节一致，实质无损。
3. keysmith v0.3.9 在 Windows 上标注 explicit Beta（fresh deployment）；
   journal/marker/snapshot 证据全保留在目标目录。
4. npm CLI 为 0.145.0（二进制含 model_instructions_file ×13），桌面版
   0.148.0-alpha.21（×17）；两端读同一 config.toml。
5. `scripts/check.sh` 刻意不加 Codex 校验项：CI/其他机器没有该部署，加了破坏
   可移植性；keysmith manifest 自带 SHA256，`--status` 即可复核。
6. WSL 侧跑 keysmith 会因 DrvFs 不支持 renameat2 原子语义报 EINVAL——
   **必须在 Windows 侧用 `py -3` 执行**（薄包装已固化正确姿势）。
