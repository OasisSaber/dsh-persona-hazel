# 采用记录 — TheMasterplan × HazePersona

来源: TheMasterplan `v4.0.0`（commit `8895a0082358a569012e6be1d490aa91c37a699c`）
采用范围: 最小采用集合（`AGENTS.md` + `core/` + `profiles/jj.md` + `adapters/generic.md`）+ 中央调用 CI（`.github/workflows/check.yml` @v4.0.0）
采用日期: 2026-08-16
首次演练任务: 明确人类授权（用户指令"发布完成后采纳/themasterplan工作流"，2026-08-16；授权范围=采纳安装与仓库初始化）
Jujutsu 版本: 0.43.0
Git 版本: 2.54.0.windows.1
平台与验证入口: Windows / Git Bash `scripts/check.sh` + PowerShell 7 `scripts/check.ps1`
验证状态: VERIFIED（2026-08-17 真实 Windows + Git Bash 采用烟雾测试通过：`scripts/check.sh` 3/3 全过；`themasterplan.py doctor` / `verify` 均 OK）
首次演练: 2026-08-17 修复演练（见下；2026-08-17 删库重建后直接并入初始 commit，不再走 PR）

## 采用卫生修复（2026-08-17）

接管基线检查发现 adopt 状态与 v4.0.0 工具预期不一致，已修复：

- `AGENTS.md` 补回 v4.0.0 managed-block（规则声明入区块，项目内容保留在区块外；block 哈希与上游模板一致）
- `.themasterplan/state.json` 哈希规范化为小写、补全 12 个 executor 条目
- 经 `plan-update` / `apply-update`（源 `v4.0.0`，commit `8895a008`）重建 state 与 executor，纠正 core/workflow.md、adapters/generic.md 及 bin 文件的 CRLF 工作副本（内容与上游一致）
- `.gitignore` 补充 `__pycache__/`、`*.pyc`
- 修复后 `doctor` / `verify` / `scripts/check.sh` 全部通过；`adoption.status` 保持工具写死的 `PARTIAL` 语义

## 说明

- 人格部署与维护规则见 `DSH-WORKSPACE.md`（本仓库专属，TheMasterplan 治理范围之外）。
- 上游人格数据与许可见 `THIRD_PARTY_NOTICES.md`。
- 更新检测：`.themasterplan/bin/themasterplan.py check-update --root . --json`。
