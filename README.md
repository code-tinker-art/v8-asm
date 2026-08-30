# v8-asm — Playful, readable high-level assembly for Node.js

Welcome to v8-asm — a compact, high-level assembly-like language interpreted in Node.js. This README now reflects the actual layout of the repository (look in ./src) and gives quick, accurate instructions for running and contributing.

If you like small interpreters, assembly-inspired syntax, and playful runtimes, you belong here. We try to stay friendly, curious, and contribution-ready — the Cody vibes.

Project layout (what actually exists)

- src/v8-asm.js — the public entrypoint: exports default function compile(fileName). This reads a source file, tokenizes, parses, and executes it.
- src/lexer.js — tokenizer: converts plain text into tokens the parser understands.
- src/parser.js — parser: converts tokens into an AST of directives, labels, and instructions.
- src/executor.js — executor/VM: implements registers, memory, labels, instructions and runtime behavior.
- src/config.js — constants: token enums, supported instructions, memory size, number of registers.

There is no `bin/run.js` or `lib/` directory in this repo — earlier README references were inaccurate. Sorry about that; this one is accurate.

Quick start — run an example without changing package.json

If you don't have a package.json that sets "type": "module", you can still invoke the ESM entrypoint from Node using a dynamic import:

1. Ensure you have Node 16+ installed.
2. Add a small example file at `examples/hello.asm` (see "Examples" below) or create one.
3. Run this one-liner from the project root:

   node -e "import('./src/v8-asm.js').then(m => m.default('examples/hello.asm')).catch(e => { console.error(e); process.exit(1); })"

If your project has package.json, add "type": "module" and add a script for convenience:

  {
    "type": "module",
    "scripts": {
      "run:example": "node -e \"import('./src/v8-asm.js').then(m => m.default('examples/hello.asm'))\""
    }
  }

Or create a tiny CLI helper file (recommended):

- bin/run.js
  ```js
  // bin/run.js
  import compile from '../src/v8-asm.js';
  const file = process.argv[2];
  if (!file) { console.error('Usage: node bin/run.js <file.asm>'); process.exit(1); }
  compile(file);
  ```

Examples

This repo doesn't ship examples yet. Great first task: add `examples/hello.asm` with a few lines that exercise PRINT, variables and a label. Example suggestion you can add in a PR:

    .section_data
    greeting = "Hello, v8-asm!"
    .global_start
    start:
      PRINT greeting
      HLT

Reading the code (where to start)

- Start with src/lexer.js to see how tokens are produced from text. It's compact and easy to follow.
- Move to src/parser.js to learn how tokens become AST nodes: labels, directives, variables, and instructions.
- Finally open src/executor.js — that's where runtime behavior (registers, memory, opcodes like MOV/ADD/PRINT) lives.

Accurate implementation notes

- The language uses directives like `.section_data` and `.global_start`.
- Variable assignments are of the form `name = 123` or `name = "text"`. String variables are stored into the VM's memory and referenced by address.
- Registers are named `R0`, `R1`, etc. The number of registers and memory size are defined in `src/config.js`.
- Supported opcodes are declared in `INSTRUCTIONS` in `src/config.js`. Add new opcodes by implementing behavior in `src/executor.js` and adding the mnemonic to the set.

Suggested first PRs (good, bite-sized tasks)

- Add three example programs under examples/: hello.asm, math.asm, factorial.asm.
- Add a `bin/run.js` CLI helper (like the snippet above) so running is one command: `node bin/run.js examples/hello.asm`.
- Add tests that run examples and assert expected stdout (a tiny test runner or a mocha/jest wrapper).
- Improve lexer/parser error messages to include line/column numbers.
- Add a CONTRIBUTING.md and issue/PR templates to help onboard new contributors.

How to contribute

1. Fork the repo and create a branch: `feature/your-idea`.
2. Keep PRs focused and small.
3. Include an example or a test that demonstrates the change.
4. Open a PR and explain why the change helps newcomers or makes the VM more fun to hack.

Community and tone

Be kind, curious, and helpful. We celebrate small wins and good explanations. If you're new to interpreters, open an issue asking "Help me get started" and say what you want to learn — someone will pair with you.

License

This project is MIT licensed. See LICENSE.

What's next (if you want help)

- I can add the recommended `examples/hello.asm` and a `bin/run.js` helper in a follow-up commit.
- I can add a CONTRIBUTING.md and a tiny test that runs examples/hello.asm and asserts output.

Tell me which follow-ups you want and I'll open a PR with the changes.
