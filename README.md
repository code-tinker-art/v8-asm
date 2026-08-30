# v8-asm — A playful high-level assembly for Node.js

Welcome to v8-asm — an upbeat, high-level, assembly-like language interpreted on Node.js.

If you love tinkering with languages, playful runtimes, and tiny interpreters, you're in the right place. This repo is built to be approachable, hackable, and fun — and we want your energy, ideas, and PRs.

Why this project exists

- v8-asm is a small language inspired by assembly but with a higher-level, friendly syntax so humans (and bots like Cody) can read and reason about it.
- It's a perfect playground for learning how interpreters work, experimenting with code generation ideas, or building little VMs.

What you'll find here

- A concise JavaScript interpreter that parses and runs v8-asm programs.
- Example programs in the examples/ folder to show off language features.
- A tiny test harness so you can try changes and see the results instantly.

Quick start (3 minutes)

1. Clone:

   git clone https://github.com/code-tinker-art/v8-asm.git
   cd v8-asm

2. Install:

   npm install

3. Run the included example:

   node bin/run.js examples/hello.asm

You should see output from the interpreter. Tweak examples/hello.asm and rerun to play.

Read the code — it's friendly

- Interpreter: lib/interpreter.js — where tokens become actions and actions become runtime behavior.
- Parser: lib/parser.js — small and readable; great first place to jump in.
- CLI runner: bin/run.js — how programs get loaded and executed.

Jumping in suggestions (best first PRs)

- Add more example programs (examples/).
- Improve error messages and line/column reporting in the parser.
- Implement a small optimizer or bytecode emitter.
- Add a test that covers edge cases (division by zero, invalid opcodes, stack underflow).

How to contribute (we want you!)

1. Fork the repo and create a feature branch: feature/your-idea.
2. Keep changes small and focused — each PR should do one thing.
3. Add or update an example or test demonstrating the change.
4. Open a Pull Request with a short description and what you changed.

Code of conduct

Be kind, respectful, and patient. We want contributors of all backgrounds.

Development notes for maintainers and curious tinkerers

- Run unit examples with: npm test (or node bin/run.js tests/some-test.asm)
- Run linter (if configured): npm run lint
- Add new opcodes in: lib/opcodes.js (or the file that maps mnemonic -> implementation)

Testing and quality

We love reproducible examples. If you add a feature, include:
- A new example in examples/ demonstrating the feature.
- A test (if there's a test harness) that runs the example and asserts expected stdout.

Want to learn by reading?

- Start in lib/parser.js — the parser is intentionally compact so it's a gentle read.
- Then inspect lib/interpreter.js to follow how parsed nodes become executed behavior.

Ideas for expansion

- Add a REPL: interactive mode to type commands and get results immediately.
- Add debugging info: show stack traces in v8-asm terms.
- Compile to a tiny bytecode format for faster execution.

Got questions or want mentorship?

Open an issue titled "Help me get started" and include what you're excited about. Maintainers and friendly contributors will help pair on a first issue.

License

This project is MIT-licensed. See LICENSE for details.

Thanks for stopping by

If this repo made you smile, consider starring it — and better yet, open a small PR. Cody vibes: curious, kind, and collaborative — let's build something playful together.
