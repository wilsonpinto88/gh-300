// Parses practice test markdown (questions + answer sheets) into questions.js.
// Usage: node scripts/build-questions.mjs <practice-dir>
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const practice = process.argv[2];
if (!practice) throw new Error("usage: build-questions.mjs <practice-dir>");

const splitBlocks = (md) =>
  md.split(/^## (\d+)\s*$/m).slice(1).reduce((acc, v, i, a) => (i % 2 ? acc : [...acc, [v, a[i + 1]]]), []);

const read = (p) => readFileSync(p, "utf8").replaceAll("\r\n", "\n");
const tests = [];
const files = readdirSync(join(practice, "detailed")).filter((f) => f.endsWith(".md")).sort();
for (const f of files) {
  const num = f.slice(0, 2);
  const ans = read(join(practice, "Answer Sheets", `${num}-practice-test.answer-sheet.md`));
  const answers = {};
  for (const [id, body] of splitBlocks(ans)) {
    const m = body.match(/\*\*Correct Answer\(s\):\*\*\s*([A-Z](?:\s*,\s*[A-Z])*)/);
    const e = body.match(/\*\*Explanation:\*\*\s*([\s\S]*)$/);
    answers[id] = { correct: m ? m[1].split(/\s*,\s*/) : [], explanation: e ? e[1].trim() : "" };
  }
  const questions = [];
  for (const [id, body] of splitBlocks(read(join(practice, "detailed", f)))) {
    const lines = body.trim().split("\n");
    const firstOpt = lines.findIndex((l) => /^- \[[ x]\] [A-Z]\. /.test(l));
    if (firstOpt < 0) throw new Error(`${f} #${id}: no options`);
    const options = [];
    for (const l of lines.slice(firstOpt)) {
      const m = l.match(/^- \[[ x]\] ([A-Z])\. (.*)$/);
      if (m) options.push({ key: m[1], text: m[2] });
      else if (l.trim() && options.length) options[options.length - 1].text += "\n" + l.trim();
    }
    const a = answers[id];
    if (!a || !a.correct.length) throw new Error(`${f} #${id}: missing answer`);
    for (const k of a.correct) if (!options.some((o) => o.key === k)) throw new Error(`${f} #${id}: answer ${k} not in options`);
    questions.push({ id, stem: lines.slice(0, firstOpt).join("\n").trim(), options, correct: a.correct, explanation: a.explanation });
  }
  tests.push({ test: Number(num), questions });
}

writeFileSync(join(root, "questions.js"), "window.GH300_TESTS = " + JSON.stringify(tests) + ";\n");
console.log(tests.map((t) => `test ${t.test}: ${t.questions.length}`).join("\n"));
