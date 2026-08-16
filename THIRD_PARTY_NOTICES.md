# THIRD PARTY NOTICES

本项目（HazePersona / dsh-persona-hazel）的人格数据与方法论蒸馏自以下上游项目，
各自保留其版权与许可证；本文件按 MIT 许可要求保留上游版权声明。

---

## 1. Hzm-AI-Bot — 灰泽满人格数据来源

- 仓库: https://github.com/MureasAm/Hzm-AI-Bot
- 许可证: MIT
- 版权: Copyright (c) 2026 MureasAm

本项目 `persona/` 下的蒸馏数据（system_prompt / behaviors / phrases / terms /
core_stories / legendary / preferences / statement_final 等）源自该仓库的
`persona/` 数据层，并在其基础上做静态化改写
（`persona/soul-card.md`、`persona/haze-persona.txt`）。

MIT License

Copyright (c) 2026 MureasAm

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

## 2. persona-resound — 蒸馏方法论

- 仓库: https://github.com/MureasAm/persona-resound
- 许可证: MIT
- 版权: Copyright (c) 2026 MureasAm

本项目 `docs/persona-resound/` 为该方法论 skill 的完整副本（含 SKILL.md、
references/、template/），人格蒸馏流程遵循其方法论。

MIT License

Copyright (c) 2026 MureasAm

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

## 3. dsh-soul-md — 插件实现范式参考

- 仓库: https://github.com/Scorp1o117/dsh-soul-md
- 许可证: MIT
- 版权: Copyright (c) 2026 Scorp1o117

`plugin/dsh-persona-hazel/index.js` 的区段注册与文件热重载模式参考了
dsh-soul-md 的实现结构（`soul:persona` 区段、fs.watch + debounce 重载）。

MIT License

Copyright (c) 2026 Scorp1o117

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
