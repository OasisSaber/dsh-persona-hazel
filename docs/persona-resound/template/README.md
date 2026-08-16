# 角色一致性 LLM 对话框架（脚手架）

这是从真实项目 [Hzm-AI-Bot](https://github.com/MureasAm/Hzm-AI-Bot)（灰泽满 · 虚拟主播）抽象出来的**框架模板**——去掉了所有"灰泽满"的具体内容（梗/人设/记忆/样本），只留下**能跑的结构 + 内置工具 + 说明**。

**一句话：填好角色配置 + 人格数据，就能生成一个"像某个人"的对话系统。**

---

## 这个框架解决什么问题

让 LLM 稳定还原一个真实人物的说话方式，核心不在模型多聪明，而在 **数据蒸馏、检索、记忆、评测** 这套体系怎么建。这个框架把这条路固化下来，你只需要提供"素材"和"角色参数"。

## 核心架构（一张图看懂）

```
┌─────────────────────────────────────────────────────────┐
│  role_config.py        角色是谁（名字/自称/粉丝/地点/时区）│
└─────────────────────────────────────────────────────────┘
        ↓ 被所有模块引用（不硬编码角色名）
┌─────────────────────────────────────────────────────────┐
│  persona/              人格数据（按分层职责分子目录）       │
│    core/                  ① 核心人设：她是谁（always-on） │
│      system_prompt.txt        人设核心 + 底线 + 身份机制   │
│      traits.json              性格基底（行为化）          │
│      styles.json              语言特征清单                │
│    behavior/             ② 行为：怎么反应（触发命中才带） │
│      behaviors.json           触发→响应 + 真人示范        │
│    speech/               ③ 说话：怎么说（few-shot 风格）  │
│      voice_samples.json       说话示范（唯一风格层）      │
│      phrases.json             措辞指纹（真实原话）        │
│    world/                ④ 世界/记忆：经历/懂什么         │
│      terms.json               世界名词（lorebook）        │
│      core_stories.json        核心记忆（印象最深的结晶）   │
│      preferences.json         偏好事实（一条一话题）       │
└─────────────────────────────────────────────────────────┘
        ↓ 蒸馏工具生成数据 → precompute 向量化
┌─────────────────────────────────────────────────────────┐
│  src/plugins/chatbot/   运行时（读数据 + 检索 + 注入）     │
│    core.py                  主循环（组装 + 生成 + 记忆）   │
│    reply_style.py           回复风格后处理（清洗/拆句/复读）│
│    routing.py               硬匹配路由（梗库 + 行为 L3）    │
│    retrieval.py             五路检索 + 融合 + 关键词门      │
│    config.py                配置读取 + API 客户端工厂       │
│    persona.py               人格加载 + terms 名词库         │
│    session_memory.py        会话级记忆（话题追踪）         │
│    memory.py + memory_manager.py  短期 + 长期记忆          │
│    context_probe.py         时间/农历/天气感知             │
│    vision.py                看图（glm-4.6v）              │
│    chat_window.py           读秒窗口 + 分批发送            │
│    bili_bridge.py           B站联动推送（可选）            │
│    constants.py             所有可调参数 ★                │
└─────────────────────────────────────────────────────────┘
```

**数据流**：用户消息 → 会话话题探测 → 五路检索（corpus/样本/行为/措辞/偏好/核心记忆）→ RRF 融合 → 预算截断 → 分层注入 → LLM 生成 → 输出清洗 → 记忆更新。

**记忆分层**：`persona/`（角色记忆：world/corpus 等）与 `user_memory/`（对用户的记忆：short_term/long_term/session）分开，`data/` 只留运行时状态（bili_state）。

---

## 快速开始（从零到能跑）

### 1. 填角色配置
改 `role_config.py`：
```python
ROLE_NAME = "你的角色名"        # 角色自称
ROLE_SELF_NAMES = ["你的角色名", "我"]  # 允许的自称
FAN_NAME = "粉丝"               # 粉丝称呼
ROLE_LOCATION = "角色所在地"
DEFAULT_CITY = ""               # 留空跳过天气
ROLE_TIMEZONE = "Asia/Shanghai"
```

### 2. 填人格数据
编辑 `persona/` 下各文件（每个文件顶部有 `_readme` 说明格式和铁律）。核心是：
- `system_prompt.txt`：写角色的核心人格/身份/自我称呼（模板已列好节的骨架）
- `voice_samples.json`：放角色的真实对话对（这是风格层，最重要）

### 3. 蒸馏（从素材生成数据）
```
python scripts/run_tool.py transcribe <音频>        # 转写
python scripts/run_tool.py clean-transcript -i <转写>  # 清洗
python scripts/run_tool.py analyze-pace -i <清洗>      # 节奏地图（判噪声）
python scripts/run_tool.py convert-to-chat -i <清洗>   # 直播→聊天
python scripts/run_tool.py mine-phrases -i <清洗>      # 挖措辞
python scripts/run_tool.py generate-statements -i <清洗>  # 生成场景化陈述
```

### 4. 向量化 + 跑
```
# corpus（背景记忆）向量：从 generate-statements 产物生成（缺了机器人没有背景记忆）
python scripts/run_tool.py generate-vectors -i outputs/statements/generated_statements.json
# 其余各层向量缓存（trigger / 声音样本 / 措辞 / 偏好 / 核心记忆）
python scripts/run_tool.py precompute --all
# 填 .env.prod（API key），然后
python bot.py
```

---

## 每个文件的作用（快速索引）

| 文件 | 作用 | 改动后需 |
|---|---|---|
| `role_config.py` | **角色身份集中定义**（名字/自称/粉丝/地点） | 直接生效 |
| `persona/core/system_prompt.txt` | 核心人设（她是谁、底线、自称、节奏） | 重启 |
| `persona/core/traits.json` | 性格基底（行为化） | 重启 |
| `persona/core/styles.json` | 语言风格清单 | 重启 |
| `persona/behavior/behaviors.json` | 情境反应（触发→响应+真人示范） | `precompute triggers` |
| `persona/speech/voice_samples.json` | 说话示范（few-shot） | `precompute voice-samples` |
| `persona/speech/phrases.json` | 措辞指纹 | `precompute phrases` |
| `persona/world/preferences.json` | 偏好事实 | `precompute preferences` |
| `persona/world/core_stories.json` | 核心记忆 | `precompute core-stories` |
| `persona/world/terms.json` | 世界名词（lorebook） | 重启 |
| `data/*.json` | 运行时数据（向量/记忆，自动生成） | — |
| `src/plugins/chatbot/constants.py` | 阈值/预算/参数 | 重启 |

**分层铁律：一个词只进一层**（懂→terms / 忆→core_stories / 答→梗库），防止重复注入。

## ⚠️ 生成项目后，记得填这几处"角色专属数据"（JSON，不用改代码）

框架保留结构、清空了角色专属内容，**在 persona 数据层填 JSON 即可**（不用改代码）。空模板在数据文件里，填充后对应功能生效：

| 位置 | 是什么 | 不填的后果 |
|---|---|---|
| `persona/world/legendary.json` | 经典梗库（`replies` 关键词→固定原话 + `confirms` LLM 确认） | 硬匹配梗不触发（如"绿冻永远第二选择"） |
| `persona/behavior/behavior_keywords.json` | 行为判别词（行为名→判别词列表） | 语义检索够不到的口语质问不触发行为 |
| `src/plugins/chatbot/reply_style.py` 的 `_get_other_person_names()` 补充集 | 非 terms 的第三人称人物名 | "她"自指兜底可能误替换别人 |

> 梗库/判别词已数据化，填 `persona/` 的 JSON 即可；最后一项是代码里的一处补充集（`names = {...}`），属于极少数的例外。参考完整示例见 [Hzm-AI-Bot](https://github.com/MureasAm/Hzm-AI-Bot) 的 `persona/world/legendary.json` 和 `persona/behavior/behavior_keywords.json`。

---

## 检索与评测（框架的精华）

- **五路检索 + RRF 融合**：多路各自检索 → 加权融合 → 预算截断 → 按需注入，全程只调 1 次 embedding。
- **嵌入的边界**（踩坑才有）：问句 vs 陈述鸿沟（加关键词门）、句式聚团（意图交给 LLM）、指代性消息（话题补全）、纯情绪消息（跳过检索）。
- **评测**：`scripts/retrieval_eval.py`（检索命中率）+ `scripts/persona_eval.py`（人格一致性，匿名化）——把调参从"人肉肉眼"变成"测量"。

## 方法论（决定成败的 8 条）

见主 `SKILL.md` 的"核心原则"。简单说：**样本 > 规则、素材层解决、行为 > 标签、提示词不放台词、确定性兜底只在模型默认习惯压不住时才上。**

---

## 注意

- **代码注释/docstring 里的"灰泽满"是逻辑说明示例**，不影响运行；所有运行逻辑已参数化到 `role_config.py`。
- `scripts/persona_eval.py` 和 `regression_test.py` 是**灰泽满项目的评测示例**，按你的角色重写评测题/弹幕。
- 本框架参考 [Hzm-AI-Bot](https://github.com/MureasAm/Hzm-AI-Bot)（完整落地：83 样本、315 背景记忆、5 路融合、评测闭环、207 测试）。
