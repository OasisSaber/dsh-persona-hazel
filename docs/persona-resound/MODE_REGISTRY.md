# Mode Registry · 单一事实来源

本 skill 的能力域。SKILL.md 和 Claude 路由都引用这里——加新能力先改本文件。

> 核心定位：**人格工程（Persona Engineering）**——"让 AI 稳定还原/分析/评测某个人的说话方式"。构建 bot 只是其中一个出口，不是全部。

## 六个能力域

| 能力 | 是什么 | 触发词 | Oversight | 产出 | 建 bot? |
|------|--------|--------|-----------|------|---------|
| `distill` 蒸馏 | 从素材提炼人格数据 | 提炼 XX 的说话风格 / 分析语言特征 / 蒸馏人格 | **High**（每步审批） | 人格数据（样本/措辞/陈述） | ❌ |
| `build` 构建 | 搭完整角色对话系统 | 做一个 XX 的 bot / 还原 XX 说话方式 / 数字分身 | **High**（每步审批） | 能跑的项目 | ✅ |
| `embody` 扮演 | Claude 直接扮演（不建 bot） | 用 XX 的口吻回复 / 扮演 XX / 以 XX 身份说话 | Medium | 直接对话 | ❌ |
| `extract` 提炼风格 | 提炼措辞/风格用于文案 | 用 XX 的风格写文案 / 给 XX 账号写标题 | Medium | 文案 / 标题 | ❌ |
| `evaluate` 评测 | 测角色系统/人格像不像 | 像不像 XX / 测人格一致性 / 跑评测 | Low | 评测报告 | 已有 |
| `diagnose` 诊断 | 定位角色系统跑偏 | 检索不准 / 回复跑偏 / 不像本人 | Medium | 定位报告 | 已有 |

**共用底座**（前四个能力都靠它）：
- `template/` 脚手架（build 专用）+ `references/` 方法论 + `scripts/` 蒸馏/评测工具
- 蒸馏流水线：transcribe → clean → analyze-pace → convert-to-chat → mine-phrases → generate-statements → generate-vectors（corpus 向量）

**Oversight 级别**：
- **High** = 每步产物（转写/清洗/转化/陈述）展示给用户审批，通过才往前（方法论第 8 条）。
- **Medium** = 结构化产出 + 有限决策点。
- **Low** = 跑脚本出报告。

## 标准工作流（build 模式，最完整）

```
1. 复制 template/ 成新项目
2. 填 role_config.py（角色名/自称/粉丝/地点/时区）
3. 填 persona/ 人格数据（见各文件 _readme）
4. 有素材则蒸馏：transcribe → clean → analyze-pace → convert-to-chat → mine-phrases → generate-statements
5. 向量化：generate-vectors -i <statements产物>（corpus）+ precompute --all（其余各层）
6. 填 .env.prod，跑 bot.py
7. 评测闭环：retrieval_eval + persona_eval
```

## 非 build 能力怎么复用底座

- **distill / extract**：只走蒸馏流水线（第 4 步），产出人格数据或文案，不建 bot。
- **embody**：直接读 `persona/` + `references/data-schema.md`，用方法论现场扮演，不复制脚手架。
- **evaluate / diagnose**：跑 `scripts/retrieval_eval.py` / `persona_eval.py`，定位哪层锅。

详细步骤见 SKILL.md 和 references/。
