/**
 * dsh-persona-hazel — 灰泽满（Hazel）人格全局注入插件。
 *
 * 把插件内打包的人设卡（persona.txt，同源于 HazePersona/persona/soul-card.md，
 * 由 deploy.ps1 同步）注册为 `hazel:soul` 系统提示词区段。
 *
 * 设计要点：
 * - 区段名刻意**不含 "persona"**：router-flash 预设（当前默认）的
 *   applyPersona（router-core.mjs）会过滤名字匹配 /persona/i 的区段，
 *   dsh-soul-md 的 `soul:persona` 正是因此被清掉而失效；`hazel:soul`
 *   绕过该过滤，在任何预设下都生效。
 * - 全局 prompt 层注册（不依赖 agent preset），所有会话注入。
 * - 文件热重载（fs.watch + debounce）：改 persona.txt 后下一次组装生效。
 *
 * 配置（cordis.patch.yml 的 config 均可选，全部带默认值——缺失默认值会
 * 让配置校验失败并拖垮插件树，dsh web 直接启动失败）：
 * - order:    区段顺序，0 = 紧跟部署人格槽位之后（默认 0）
 * - complete: 把人设卡当作完整系统提示词（默认 false）
 * - fallback: 文件缺失/不可读时的兜底文本，空 = 不注册区段（默认 ""）
 * - watch:    文件变更热重载（默认 true）
 * - debounceMs: 重载防抖毫秒（默认 300）
 */
import { readFileSync, watch } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import z from "@deepseek-ai/schemastery";

/** Cordis 插件名。 */
const name = "persona-hazel";
/** 本行注入的提示词注册表。 */
const inject = ["systemPrompt"];
/** 区段名：刻意不含 "persona"，绕过 router-flash 的 persona 区段过滤。 */
const SECTION_NAME = "hazel:soul";
/** 插件内置的人设卡（与 HazePersona/persona/soul-card.md 同源）。 */
const PERSONA_FILE = join(dirname(fileURLToPath(import.meta.url)), "persona.txt");

/** 运行时 schema：全部字段带默认值，缺省配置也能安全挂载。 */
const Config = z.object({
  order: z.number().default(0),
  complete: z.boolean().default(false),
  fallback: z.string().default(""),
  watch: z.boolean().default(true),
  debounceMs: z.number().default(300),
});

function apply(ctx, config) {
  let active = null;
  let timer = undefined;
  let watcher = undefined;

  const register = (text) => {
    if (active) {
      // systemPrompt.section() 返回的是 Cordis effect 的 DISPOSER 函数，
      // 直接调用它来注销，不要调用 .dispose()。
      active();
      active = null;
    }
    if (text) {
      active = ctx.systemPrompt.section({
        name: SECTION_NAME,
        order: config.order,
        text,
        ...(config.complete ? { complete: true } : {}),
      });
    }
  };

  const refresh = () => {
    let text;
    try {
      text = readFileSync(PERSONA_FILE, "utf8");
    } catch {
      text = config.fallback;
    }
    register(text);
  };

  const stopWatch = () => {
    clearTimeout(timer);
    timer = undefined;
    if (watcher) {
      try {
        watcher.close();
      } catch {
        /* already closed */
      }
      watcher = undefined;
    }
  };

  const startWatch = () => {
    stopWatch();
    if (!config.watch) return;
    try {
      watcher = watch(PERSONA_FILE, { persistent: false }, () => {
        clearTimeout(timer);
        timer = setTimeout(refresh, config.debounceMs);
      });
    } catch {
      // 文件缺失：fallback 已注册；重载尽力而为。
    }
  };

  ctx.effect(() => {
    refresh();
    startWatch();
    return () => {
      stopWatch();
      if (active) {
        active(); // disposer 函数，不是对象
        active = null;
      }
    };
  }, "persona-hazel.section()");
}

export { Config, SECTION_NAME, apply, inject, name };
