import json
import asyncio
import re
import sys
from pathlib import Path
from openai import AsyncOpenAI

# 项目根目录（scripts/ 的上一级），所有路径基于它构建
PROJECT_ROOT = Path(__file__).resolve().parent.parent
ENV_FILE = PROJECT_ROOT / ".env.prod"
OUTPUT_VECTOR_FILE = PROJECT_ROOT / "persona" / "world" / "corpus_vectors.json"

# 角色配置层：RAW_CORPUS 示例里的占位符替换需要角色名/粉丝称呼
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))
from role_config import ROLE_NAME, FAN_NAME  # noqa: E402

def clean_timestamps(text: str) -> str:
    """
    删除场景化陈述中的时间描述杂质，并清理残留的生成痕迹。
    """
    # 1. 删除 "在直播进行到第XX分钟时" 等变体
    text = re.sub(r'在直播[^，,。]*[分钟秒][，,。]?\s*', '', text)

    # 2. 删除 "在直播的第X分Y秒" 等变体
    text = re.sub(r'在直播[^，,。]*分[^，,。]*秒[，,。]?\s*', '', text)

    # 3. 删除可能残留的句首逗号或句号
    text = re.sub(r'^[，,。]\s*', '', text)

    # 4. 清理多余的空格
    text = re.sub(r'\s+', ' ', text).strip()

    return text

# 1. 场景化陈述（内置示例）
# ⚠️ 这里只是「格式示例」，不是真实数据。场景化陈述是角色的背景记忆（corpus），
#    每个角色各不相同，直接拿来用会把示例内容当成角色经历注入回复。
#    真实数据请走蒸馏流水线：generate-statements 生成 → 用 `-i <产物.json>` 传入本工具。
#    留空会向量化 0 条（机器人对缺失 corpus 有兜底），示例条目运行时会替换占位符。
RAW_CORPUS = [
  {
    "statement": "在某次深夜闲聊里，{ROLE_NAME}被{FAN_NAME}夸了一句，嘴上说着\"也没有啦\"，却在括号里小声补了一句\"其实有点开心\"——她习惯用否认来藏住被认可的窃喜。"
  },
  {
    "statement": "被{FAN_NAME}催更/催直播时，{ROLE_NAME}先是嘴硬说\"知道了知道了\"，转头又在第二天准时出现——她答应过的事，别扭着也会做到。"
  }
]




# 2. 从 .env.prod 中手动读取 ZHIPU_API_KEY
def get_zhipu_key():
    if ENV_FILE.exists():
        with open(ENV_FILE, "r", encoding="utf-8") as f:
            for line in f:
                if line.startswith("ZHIPU_API_KEY"):
                    return line.split("=")[1].replace('"', '').strip()
    return None

def _load_corpus(input_path) -> list:
    """加载场景化陈述列表。input_path 为空用内置 RAW_CORPUS（仅示例）。"""
    if not input_path:
        return RAW_CORPUS
    with open(input_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    if isinstance(data, list):
        return data
    if isinstance(data, dict) and isinstance(data.get("statements"), list):
        # 兼容 generate-statements 的 {"statements": ["..."]} 输出格式
        return [{"statement": s} for s in data["statements"] if s]
    raise ValueError(f"无法识别的场景化陈述结构: {input_path}")


async def run(input_path: str | None = None, output_file: str | None = None):
    """参数化入口（供 run_tool 调用）。"""
    out_path = Path(output_file) if output_file else OUTPUT_VECTOR_FILE
    corpus = _load_corpus(input_path)
    # 占位符替换：RAW_CORPUS 示例里的 {ROLE_NAME}/{FAN_NAME} → 当前角色名
    corpus = [
        {"statement": item["statement"].replace("{ROLE_NAME}", ROLE_NAME).replace("{FAN_NAME}", FAN_NAME)}
        for item in corpus
    ]

    zhipu_key = get_zhipu_key()
    if not zhipu_key:
        print("❌ 未能在 .env.prod 中找到 ZHIPU_API_KEY，请检查文件！")
        return

    print("🚀 正在连接智谱 AI 向量生成服务...")
    client = AsyncOpenAI(api_key=zhipu_key, base_url="https://open.bigmodel.cn/api/paas/v4/")

    vectorized_db = []

    for i, item in enumerate(corpus):
        try:
            print(f"正在向量化第 {i+1}/{len(corpus)} 条场景化陈述...")
            response = await client.embeddings.create(
                model="embedding-3",
                input=item["statement"]
            )
            vector = response.data[0].embedding
            vectorized_db.append({
                "text": item["statement"],
                "vector": vector
            })
        except Exception as e:
            print(f"❌ 向量化失败: {e}")
            return

    # 保存为最终的数据库文件
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(vectorized_db, f, ensure_ascii=False, indent=2)

    print(f"\n✅ 恭喜！`{out_path.name}` 向量数据库成功生成！{ROLE_NAME}记住这些了。")


async def main():
    await run()


if __name__ == "__main__":
    asyncio.run(main())
