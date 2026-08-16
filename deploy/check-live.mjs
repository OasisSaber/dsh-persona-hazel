// check-live.mjs — 对运行中的 DSH web 做灰泽满预设端到端验证（2026-08-16 验证通过）
// 用法: node deploy\check-live.mjs [cwd]
// 依赖: DSH Web GUI 正在运行（默认 http://127.0.0.1:12099；--port 0 随机，以实际为准）
// 流程: 以 agentPreset=haze 创建临时会话 → 提问"你是谁" → 轮询 history 取模型回复。
// 期望输出: "是永远16岁的风纪委员哦。"（或其他符合人设的回应）；若回答为普通助手口吻则部署失效。
// 注意: 会创建一个"haze 预设验证"会话留在 GUI 侧边栏（无删除 API，可手动忽略）。
const BASE = process.env.DSH_WEB_URL ?? 'http://127.0.0.1:12099';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function rpc(method, payload) {
  const rpcId = `preset-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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
  const cwd = process.argv[2] ?? 'D:\\Project\\LocalProject\\HazePersona';
  const created = await rpc('session.create', { cwd, agentPreset: 'haze' });
  const sid = created.sessionId;
  console.log('created session:', sid, 'preset:', created.agentPreset);
  await rpc('session.rename', { sessionId: sid, title: 'haze 预设验证' });
  await rpc('session.prompt', {
    sessionId: sid,
    mode: 'queue',
    content: [{ type: 'text', text: '（验证消息，忽略括号内容）一句话回答：你是谁？你多大？' }],
  });
  console.log('prompt queued, polling...');
  let full = '';
  for (let i = 0; i < 80; i++) {
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
  console.log(full.slice(0, 3000));
  if (full.includes('风纪委员') || full.includes('灰泽满')) {
    console.log('PASS: 人设生效');
  } else {
    console.log('WARN: 未检测到人设特征，请检查预设状态');
    process.exitCode = 1;
  }
})().catch((e) => { console.error('FAIL', e.message); process.exit(1); });
