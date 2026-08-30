# v8-asm — Tiny VM, big vibes

v8-asm is a compact, high-level assembly-like language implemented in Node.js. It’s small, readable, and built for playing — learn, tinker, and give you low level vibes fast.

What we built
- src/v8-asm.js — the ESM entrypoint (compile(file)).
- src/lexer.js — tokenizer.
- src/parser.js — parser -> AST.
- src/executor.js — registers, memory, stack, and instruction set.
- src/config.js — constants and instruction list.

Quick run (one-liner)
node -e "import('./src/v8-asm.js').then(m => m.default('examples/your.asm')).catch(e => { console.error(e); process.exit(1); })"

Want to be a part of this?
We need examples, tests, docs, and small fixes — and we want your energy. Fork the repo, add a focused change (an example, a test, or a tiny fix), and open a PR. New here? Open an issue titled “Help me get started” and someone will pair with you.

Short contribution ideas
- Add examples/hello.asm that uses PRINT and a data section.
- Add tests that run examples and assert output.
- Fix the lexer token buffer so consecutive runs don't accumulate tokens.
- Improve parser/lexer errors with line/column info.

Why contribute
- Learn interpreters and VMs in a compact, readable codebase.
- Ship small features quickly and get friendly feedback.
- Help make this project easier for future tinkerers.

License
MIT — see LICENSE.
