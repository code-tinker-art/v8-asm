import { execFileSync } from "node:child_process";
import assert from "node:assert";

const node = process.execPath;
const script = "main.js";

const tests = [
  { path: "test/hello.v8asm", expected: "hello" },
  { path: "test/arithmetic.v8asm", expected: "5" },
  { path: "test/labels_loop.v8asm", expected: "5" },
  { path: "test/call_ret.v8asm", expected: "2" }
];

for (const t of tests) {
  try {
    const out = execFileSync(node, [script, t.path], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
    assert.strictEqual(out, t.expected, `Mismatch for ${t.path}: expected ${JSON.stringify(t.expected)}, got ${JSON.stringify(out)}`);
    console.log(`${t.path} → OK (${out})`);
  } catch (err) {
    console.error(`Test failed: ${t.path}`);
    if (err.stdout) console.error("stdout:", err.stdout.toString());
    if (err.stderr) console.error("stderr:", err.stderr.toString());
    console.error(err.message);
    process.exit(1);
  }
}

console.log("All tests passed.");
process.exit(0);
