---
name: persona-resound
description: 人格回响（让 AI 忠实还原/分析/评测某个人的说话方式）。6 个能力域（distill 蒸馏/build 构建/embody 扮演/extract 提炼风格/evaluate 评测/diagnose 诊断，见 MODE_REGISTRY.md）。从真人素材（音频转写、文字稿、聊天记录）提炼说话方式、行为模式、情感表达——只还原既有的人，不原创设计人格。内置可复制的项目脚手架（template/，含运行时框架代码 + 蒸馏工具 + 人格数据空模板）+ 检索-记忆-评测架构。Triggers: 角色还原, 人设工程, 虚拟主播, 数字分身, 说话风格还原, 角色一致性, 人物克隆, 提炼说话风格, 用XX的口吻, 扮演XX, 给XX写文案, 人格回响, 还原某人说话, 做一个像XX的bot, 这个bot像不像XX.
metadata:
  version: "1.2.1"
  status: active
  task_type: open-ended
  related_skills: []
---

# Persona Resound · 从真人素材忠实还原一个人的说话方式

一个把「让 LLM 稳定还原一个人的说话方式」这件事**系统性工程化**的方法论 + 可复用脚手架。

**核心信念：角色的像与不像，不取决于模型多聪明，而取决于数据蒸馏、检索、记忆、评测这套体系怎么建。**

## 这个 skill 是什么

分两部分：

1. **`template/` —— 可复制的项目脚手架**：一个能跑的角色 bot 框架（去掉了具体角色内容），含运行时框架代码、蒸馏工具、人格数据空模板。
2. **`references/` —— 方法论**：数据架构、蒸馏管线、检索架构、踩坑清单。

**用它的方式**：用户说"帮我做一个 XX 的角色 bot"时，照着下面的流程，从 template/ 生成一个新项目，填角色参数 + 人格数据，就能跑。

## 项目结构（重整后，一眼抓住重点）

```
role_config.py        角色是谁（名字/自称/粉丝/地点/时区）——换角色只改这里
persona/              角色的一切（人格 + 她的记忆，源文件 + 向量放一起）
├── core/                她是谁：system_prompt + traits + styles
├── behavior/            怎么反应：behaviors + trigger_vectors
├── speech/              怎么说：voice_samples + phrases + 向量
└── world/               她的世界：terms + core_stories + preferences + corpus（人物记忆）
user_memory/          对用户的记忆（与 persona 分开）
├── short_term.json / long_term.json / session.json
src/plugins/chatbot/  运行时（模块职责清晰）
├── core.py              主循环组装 + 生成
├── reply_style.py       回复风格后处理（清洗/拆句/复读）
├── routing.py           硬匹配路由（梗库双路由 + 行为 L3）
├── retrieval.py         五路检索 + RRF 融合 + 关键词门
└── config.py / persona.py / memory.py / session_memory.py / context_probe.py / vision.py / chat_window.py / bili_bridge.py
outputs/              分析产物（按阶段分：transcribe/clean/pace/convert/mine/statements/eval）
data/                 运行时状态（bili_state）
scripts/              蒸馏工具 + 评测（run_tool.py 16 命令分组）
```

**核心心智**：三类数据职责分明——`persona/`（角色）、`user_memory/`（用户）、`data/`（运行时状态）；运行时模块各司其职（core 组装 / reply_style 清洗 / routing 路由 / retrieval 检索）。

## 能力路由（先判断用户要哪个能力，再决定要不要建 bot）

本 skill 有 6 个能力域，先看 `MODE_REGISTRY.md` 判断用户要哪个。**构建 bot 只是其中一个出口**：

- **`build`**（做一个 XX 的 bot）→ 走下面的"从零构建"完整流程，每步产物先审批
- **`distill`**（提炼 XX 的说话风格）→ 只走蒸馏流水线，产出人格数据，不建 bot
- **`embody`**（用 XX 的口吻回复/扮演）→ 直接读 persona + 方法论现场扮演
- **`extract`**（用 XX 的风格写文案）→ 蒸馏措辞/风格，产出文案标题
- **`evaluate`**（这个 bot 像不像 XX）→ 跑 `persona_eval.py` / `retrieval_eval.py`
- **`diagnose`**（检索不准/跑偏）→ 用 `scripts/retrieval_eval.py` 定位哪层锅

## 核心原则（决定成败，违反任何一条都会在后期付出代价）

1. **样本 > 规则**：真实对话示范"怎么说话"，比规则规定有效得多。让模型"看样本学"，不是"读规则学"。
2. **素材层解决，别用提示词打补丁**：措辞/括号/重复/跳题问题从素材层根治。提示词硬约束是堆砌，无效且走老路。
3. **原始素材 ≠ 聊天格式**：直播/演讲是"独白+读弹幕"，IM 是"一来一往"。必须转格式（分离转述/回答、切分压缩成 15-50 字短回复）。
4. **先筛选后分析**：从素材提炼前先判噪声（寒暄/礼物/转述/重复），只提炼高质量话轮。
5. **行为 > 标签**：人格标签（"乐观的悲观主义者"）是 tell，模型会当行为模板过度执行。写"在什么情境怎么反应"（show）。
6. **提示词不放具体台词**：带引号的原话放提示词 = "点名口癖 → 每条都加"。例句下沉到行为/措辞/样本层（条件注入 + 真人原话）。
7. **确定性兜底只在模型默认习惯压不住时才上**：括号、省略号、第三人称自指，提示词管不住 → 输出后处理 clean。
8. **每步产物先展示审批**：不一次性跑完流水线。素材质量决定样本上限。

## 从零构建一个角色 bot（标准流程）

### 第一步：复制脚手架

把 `template/` 复制成一个新项目目录，改名为角色相关。

### 第二步：填角色配置 `role_config.py`

```python
ROLE_NAME = "角色名"                    # 角色自称（第三人称）
ROLE_SELF_NAMES = ["角色名", "我"]       # 允许的自称列表
FAN_NAME = "粉丝"                       # 粉丝称呼
ROLE_LOCATION = "角色所在地"             # 注入感知行
DEFAULT_CITY = ""                       # 天气城市（留空跳过）
ROLE_TIMEZONE = "Asia/Shanghai"         # 所在地时区
```

**换角色只改这一个文件 + 填 persona/ 数据，运行代码不用动**（运行逻辑已全部参数化到这里）。

### 第三步：填人格数据（`persona/`）

每个文件顶部有 `_readme` 说明格式和铁律。核心优先级：

| 文件（按子目录） | 作用 | 关键铁律 |
|---|---|---|
| `core/system_prompt.txt` | 她是谁 + 底线 + 身份机制 | 只放不可压缩的；不放台词例句 |
| `core/traits.json` / `core/styles.json` | 性格基底 / 语言风格 | 行为化，不贴标签 |
| `behavior/behaviors.json` | 情境反应 | trigger 具体 + samples 真人原话 |
| `speech/voice_samples.json` | 说话示范（few-shot） | **最重要**：真实对话对，user 精确限定触发语境，reply 必须原话 |
| `speech/phrases.json` | 措辞指纹 | 同一意思→真实原话，只从素材提取 |
| `world/core_stories.json` | 核心记忆 | 作品原文必须真入库 |
| `world/terms.json` | 世界名词 | 一个词只进一层 |

**分层铁律：一个词只进一层**（懂→terms / 忆→core_stories / 答→梗库）。

### 第四步：蒸馏（有素材时）

```
transcribe → clean-transcript → analyze-pace → convert-to-chat → mine-phrases → generate-statements
```
详见 `references/pipeline.md`。**核心：先判噪声，再转聊天（直播≠聊天），措辞从素材提取。**

### 第五步：向量化 + 跑

```
# corpus（背景记忆）向量：从 generate-statements 产物生成，缺了机器人没有背景记忆
python scripts/run_tool.py generate-vectors -i outputs/statements/generated_statements.json
# 其余各层向量缓存（trigger / 声音样本 / 措辞 / 偏好 / 核心记忆）
python scripts/run_tool.py precompute --all
# 填 .env.prod，然后
python bot.py
```

### 第六步：评测（别人没有，但最值钱）

- `scripts/retrieval_eval.py`：建标注集量化检索命中率，调阈值从"玄学"变"测量"。
- `scripts/persona_eval.py`：InCharacter 式大五人格题 + 匿名化防名字作弊。

## 嵌入的边界（踩坑才有，教科书没有）

- **问句 vs 陈述鸿沟**：用户问句与叙述式记忆嵌入天然拉远（相关 0.51 vs 无关 0.62），单一阈值无法分开 → 加**区分性词重叠门**。
- **句式聚团**：embedding 聚的是句式不是意图（"你唱歌好听"夸 vs "你怎么迟到"质问挤一起）→ **意图判断交给 LLM**。
- **指代性消息**："能读给我听听吗"不带话题词 → 检索要带会话话题补全。
- **纯情绪消息**："可惜🤭"补全成"用户发了个偷笑的表情"会误命中 → 跳过语义检索。

详见 `references/retrieval-architecture.md`。

## 各参考文档

- `references/pipeline.md` — 蒸馏管线（素材 → 人格数据）
- `references/data-schema.md` — 数据架构（分层职责 + 设计铁律）
- `references/retrieval-architecture.md` — 检索架构 + 嵌入边界 + 输出清洗
- `references/pitfalls.md` — 踩坑清单（每一条都是真金白银）

## 参考实现

本 skill 从 [Hzm-AI-Bot](https://github.com/MureasAm/Hzm-AI-Bot) 抽象而来：83 个声音样本、315 条背景记忆、5 路检索融合、LLM 行为意图分类、检索评测 + 人格评测、207 个单测。完整方法论与踩坑见其 ROADMAP.md。
