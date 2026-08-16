#!/usr/bin/env bash
# TheMasterplan 权威验证入口 — HazePersona
# 非交互；失败返回非零；不依赖本机绝对路径；不执行部署/发布/远端修改。
set -euo pipefail
cd "$(dirname "$0")/.."

fail=0

# 1) 插件语法
if command -v node >/dev/null 2>&1; then
  if node --check plugin/dsh-persona-hazel/index.js; then
    echo "ok: plugin syntax"
  else
    echo "FAIL: plugin syntax"
    fail=1
  fi
else
  echo "skip: node not found"
fi

# 2) 人设卡同步一致性（soul-card.md 与插件 persona.txt 必须一致）
if cmp -s persona/soul-card.md plugin/dsh-persona-hazel/persona.txt; then
  echo "ok: persona.txt in sync with soul-card.md"
else
  echo "FAIL: plugin persona.txt differs from persona/soul-card.md (run deploy.ps1)"
  fail=1
fi

# 3) 人格锚点
if grep -q "永远16岁的风纪委员" persona/soul-card.md; then
  echo "ok: persona anchors present"
else
  echo "FAIL: persona anchors missing"
  fail=1
fi

if [ "$fail" -ne 0 ]; then
  echo "check failed"
  exit 1
fi
echo "all checks passed"
