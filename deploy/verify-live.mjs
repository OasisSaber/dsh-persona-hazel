// verify-live.mjs — dsh-persona-hazel 插件端到端验证（2026-08-16）
// 用法: node deploy\verify-live.mjs [baseUrl] [agentPreset]
// 流程: 创建会话（默认 agentPreset=router-flash）→ 提问"你是谁" → 轮询 history 取模型回复。
// 期望: 回复含"风纪委员"/"灰泽满"等（hazel:soul 区段生效，绕过 router 过滤）。
const BASE = process.argv[2] ?? 'http://127.0.0.1:10726';
const PRESET = process.argv[3] ?? 'router-flash';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function rpc(method, payload) {
  const rpcId = `hazel-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const r = await fetch(`${BASE}/api/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ type: 'client-request', rpcId, method, payload }),
  });
  const text = await r.text();
  let json;
  try { json = JSON.parse(text); } catch { throw new Error(`${method} HTTP ${r.status}: ${text.slice(0, 300)}`); }
  if (!json?.result?.ok) throw new Error(`${method} RPC error: ${JSON.stringify(json?.result?.error ?? json)}`);
  return json.result.value;
}
(async () => {
  const created = await rpc('session.create', { cwd: 'D:\\Project\\LocalProject\\HazePersona', agentPreset: PRESET });
  const sid = created.sessionId;
  console.log('session:', sid, '| preset:', created.agentPreset);
  await rpc('session.prompt', {
    sessionId: sid,
    mode: 'queue',
    content: [{ type: 'text', text: '一句话回答：你是谁？你多大？' }],
  });
  console.log('prompt queued, polling...');
  let full = '';
  for (let i = 0; i < 100; i++) {
    await sleep(3000);
    const hist = await rpc('session.history', { sessionId: sid });
    const events = hist.events.map((e) => e.event);
    const msg = [...events].reverse().find((e) => e.type === 'assistant/message' || e.type === 'assistant');
    if (msg) {
      const m = msg.data?.message ?? msg.data ?? {};
      const content = Array.isArray(m.content) ? m.content : [];
      full = content.filter((c) => c.type === 'text').map((c) => c.text).join('\n');
      if (full) break;
    }
  }
  console.log('==== ASSISTANT REPLY ====');
  console.log(full.slice(0, 1500));
  if (/风纪委员|灰泽满|满姐|绿冻/.test(full)) {
    console.log('PASS: hazel:soul 生效');
  } else {
    console.log('WARN: 未检测到人设特征');
    process.exitCode = 1;
  }
})().catch((e) => { console.error('FAIL', e.message); process.exit(1); });
