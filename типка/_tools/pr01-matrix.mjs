// Служебный прогон обязательных таблиц проверок ПР1.
// Подставляет входные значения в копию файла и запускает её через Node.js.
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = new URL("../tip-js-practices/practice-01/js/", import.meta.url);
const workDir = mkdtempSync(join(tmpdir(), "pr01-"));

function run(file, values) {
  let source = readFileSync(new URL(file, root), "utf8");

  for (const [name, literal] of Object.entries(values)) {
    const pattern = new RegExp(`^const ${name} = .*;$`, "m");
    source = source.replace(pattern, `const ${name} = ${literal};`);
  }

  const target = join(workDir, file);
  writeFileSync(target, source, "utf8");

  return execFileSync(process.execPath, [target], { encoding: "utf8" }).trim();
}

const progressCases = [
  { totalTasks: "12", completedTasks: "5" },
  { totalTasks: "0", completedTasks: "0" },
  { totalTasks: "5", completedTasks: "0" },
  { totalTasks: "5", completedTasks: "5" },
  { totalTasks: "5", completedTasks: "6" },
  { totalTasks: "-1", completedTasks: "0" },
  { totalTasks: "5", completedTasks: "2.5" },
  { totalTasks: '"5"', completedTasks: "2" },
  { totalTasks: "1001", completedTasks: "0" },
  { totalTasks: "NaN", completedTasks: "0" },
  { totalTasks: "18", completedTasks: "6" },
];

const planCases = [
  { totalTasks: "12", completedTasks: "5", dailyLimit: "3" },
  { totalTasks: "10", completedTasks: "4", dailyLimit: "3" },
  { totalTasks: "5", completedTasks: "3", dailyLimit: "10" },
  { totalTasks: "5", completedTasks: "5", dailyLimit: "2" },
  { totalTasks: "0", completedTasks: "0", dailyLimit: "2" },
  { totalTasks: "5", completedTasks: "2", dailyLimit: "0" },
  { totalTasks: "5", completedTasks: "2", dailyLimit: "1.5" },
  { totalTasks: "5", completedTasks: "6", dailyLimit: "2" },
  { totalTasks: "5", completedTasks: "2", dailyLimit: '"2"' },
  { totalTasks: "5", completedTasks: "2", dailyLimit: "1001" },
  { totalTasks: "18", completedTasks: "6", dailyLimit: "5" },
];

const weekCases = [
  { totalTasks: "6", completedTasks: "0", dailyLimit: "1" },
  { totalTasks: "18", completedTasks: "6", dailyLimit: "5" },
  { totalTasks: "5", completedTasks: "5", dailyLimit: "2" },
  { totalTasks: "11", completedTasks: "1", dailyLimit: "2" },
  { totalTasks: "5", completedTasks: "2", dailyLimit: "0" },
];

for (const [title, file, cases] of [
  ["progress.js", "progress.js", progressCases],
  ["plan.js", "plan.js", planCases],
  ["plan-week.js", "plan-week.js", weekCases],
]) {
  console.log(`\n########## ${title} ##########`);

  for (const values of cases) {
    console.log(`\n--- ${JSON.stringify(values)}`);
    console.log(run(file, values));
  }
}
