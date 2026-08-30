# v8-asm — Precise, source-driven README

This README is written from the actual source in ./src. It documents the real API, language features, runtime model, and known quirks so contributors can read the code and start hacking with confidence.

TL;DR — run a file

The repository exports a single ESM entrypoint: `src/v8-asm.js` which provides a default function `compile(fileName)`. It synchronously reads the given file, tokenizes, parses, builds an AST and executes it in the VM.

You can run a file with Node (example):

node -e "import('./src/v8-asm.js').then(m => m.default('examples/hello.asm')).catch(e => { console.error(e); process.exit(1); })"

(There is no bin/ runner in the repo — this reads the code directly.)

Repository layout (what's actually in the repo)

- src/v8-asm.js — public entrypoint: reads a source file, tokenizes, parses, executes.
- src/lexer.js — tokenizer implementation and helper predicates.
- src/parser.js — parser producing a compact AST (DIRECTIVE, VARIABLE_ASSIGNMENT, LABEL, INSTRUCTION).
- src/executor.js — Executor class: in-memory VM implementing registers, memory, labels, instruction execution.
- src/config.js — tokenType enum, INSTRUCTIONS set, MEMORY_SIZE and noOfRegisters defaults.

Public API

- compile(fileName)
  - Default export of `src/v8-asm.js`.
  - Reads the file synchronously (utf-8), calls `tokenize`, `getTokens`, `parse`, constructs `new Executor(ast)` and calls `vm.run()`.

Language overview (syntax supported by the current parser)

- Directives
  - .section_data — marks start of data section (parser records as DIRECTIVE).
  - .global_start — marks beginning of code; parser disallows variable assignments after this directive.

- Variable assignment
  - Format: name = 123
  - Or: name = "string"
  - Unquoted identifiers are sequences of letters and underscores (lexer rule). Strings in double quotes support escapes (\n, \t, \r).
  - String variables are written into VM memory as null-terminated sequences; numeric variables are stored as a single cell.

- Labels
  - Format: label_name:
  - Labels are recorded during VM init and resolve to instruction indices.

- Instructions
  - Supported mnemonics are listed in `src/config.js` (INSTRUCTIONS). At time of writing they include:
    MOV, LOAD, STORE, LOADI, STOREI, ADD, SUB, MUL, DIV, INCR, DECR,
    AND, NOT, OR, XOR, CMPR,
    JMP, JMPE, JMPNE,
    PUSH, POP, CALL, RET, NOP, HLT, PRINT

- Operands
  - Operands can be numbers (tokenized as NUMBER), unquoted identifiers (STRING tokens), or register references.
  - Register references are constructed when the parser sees a STRING token with value "R" followed by a NUMBER token — the parser merges these into a single operand like "R0".
  - Example: MOV R0, 5  (lexer emits "R" then 0 -> parser turns into "R0")

VM / runtime model (src/executor.js)

- Memory and registers
  - MEMORY_SIZE default is 0xFFF (src/config.js).
  - noOfRegisters default is 7 (src/config.js).
  - The Executor stores registers as an Array(noOfRegisters) and memory as an Array(MEMORY_SIZE).
  - `memoryPointer` is used during init to allocate variable storage; string values are stored byte-by-byte with a final 0 terminator.

- Variables and labels
  - `variables` maps a variable name to its address in memory.
  - `labels` maps a label name to an instruction index (counting only INSTRUCTION nodes).

- Instruction dispatch highlights
  - MOV dest, src — writes resolved src value to dest (register, variable address, or memory address).
  - LOAD/STORE/LOADI/STOREI — various direct/indirect memory ops.
  - Arithmetic (ADD/SUB/MUL/DIV) — operate via resolveValue and setValue.
  - CMPR sets an `equalFlag` boolean; JMPE/JMPNE use this flag.
  - CALL pushes the return PC onto the stack and jumps to label; RET pops PC from stack.
  - PUSH/POP operate on a VM-level `stack` array.
  - PRINT: if operand is a variable name, the executor reads a null-terminated string from memory and console.log()s it; otherwise it prints the resolved numeric value.

Important implementation details & quirks (read the code with these in mind)

- Token buffer is module-level
  - `tokens` is a module-level array in `src/lexer.js`. Currently `tokenize` appends tokens to this array but does not clear it at function start — repeated calls to `tokenize` will accumulate tokens. If you run multiple files in the same process, you'd see stale tokens unless you reset `tokens = []` at the start of `tokenize`.

- Lexer character classes
  - isValidStringChar() allows letters a-z and underscore only. That means unquoted identifiers and opcodes must be ASCII letters + underscore.
  - isAlphaNumericalValue() returns true for the string "!@#$%^&*:;,." — this is used to detect punctuation like `.` `,` `:` `;` and single-character operators. The lexer then maps specific characters to token types: '.' -> FULLSTOP, ',' -> COMMA, ':' -> COLON, ';' begins a comment until newline.
  - Double-quoted strings: lexer supports `\n`, `\t`, `\r` escape handling inside strings.

- Parser behavior
  - The parser uppercases opcode and instruction strings, checks INSTRUCTIONS set, and builds INSTRUCTION nodes with opcode and operand array.
  - When parsing operands the parser merges a standalone "R" string followed by a NUMBER into a register string like "R0".
  - Parser enforces `.global_start` semantics: variable assignments after `.global_start` cause a Syntax Error.

- Executor edge cases
  - resolveValue for a variable returns the memory cell at the variable's address (i.e., the first byte of a string) — this means a string variable used where a number is expected will return the first character code.
  - setValue allows writing to registers (R#), named variables (writes into the memory cell at that variable's address), or numeric memory addresses (as raw index). Writing to a variable overwrites the first cell — this isn't a high-level typed store.
  - Division uses Math.floor of integer division.
  - PRINT detects variables and attempts to print them as strings by walking memory until a 0 value.

Small suggestions (easy contributions)

- Clear the `tokens` array at the start of `tokenize` so multiple runs in one process don't append stale tokens.
  - Add at top of `tokenize`: `tokens = [];`

- Add examples/ directory with small programs that exercise:
  - Strings and PRINT
  - Arithmetic and registers
  - Branching with CMPR and JMPE/JMPNE
  - CALL/RET demo

- Improve error messages in lexer & parser to include line/column (lexer currently only throws with character info).

- Add tests that import `src/v8-asm.js` and call the default export for example files; capture console.log to assert expected output.

Concrete example (matches current parser + lexer rules)

examples/hello.asm

.section_data
message = "Hello from v8-asm"
.global_start
main:
  PRINT message
  HLT

Notes on running and experimentation

- Because this project is ESM, use Node >=16 and run via dynamic import (example shown above) or set `"type": "module"` in package.json and `import compile from './src/v8-asm.js'` in your caller.
- If you want to programmatically drive the VM, import the parser and executor directly: call `tokenize`, `getTokens`, `parse` and `new Executor(ast)` to run or to step through instructions.

Good first PR ideas (aligned with the codebase)

- Add `examples/hello.asm` and `examples/math.asm`.
- Add a test that runs `examples/hello.asm` and asserts console output.
- Reset the `tokens` buffer at start of `tokenize`.
- Add a README change that documents the instruction set and operand formats (this file).
- Add better lexer errors (line/column) and tests for parser failures.

How to contribute

1. Fork the repo and create a branch (e.g., `feature/examples`).
2. Keep PRs small and focused.
3. Include an example or a test to demonstrate behavior your change affects.
4. Title the PR with the change and include a short summary of why it helps newcomers.

License

This project uses the repository LICENSE (MIT) — see LICENSE for details.

If you'd like, I will now commit this README into the repository (it will replace the current README.md) so the root README exactly matches the code in `src`. I can also add `examples/hello.asm` next — say yes to add that example, otherwise tell me any wording or content changes you want here.