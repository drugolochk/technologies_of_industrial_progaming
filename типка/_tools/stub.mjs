// Служебная утилита: создаёт коммит «стартового комплекта» для практической работы.
// Указанные файлы временно заменяются заготовками с заглушками, файлы из списка remove
// временно убираются из индекса, фиксируется коммит стартера, затем восстанавливается
// рабочая версия и фиксируется коммит с решением.
import { readFileSync, writeFileSync, rmSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve, dirname } from "node:path";

const [, , repoRoot, specPath] = process.argv;
const spec = JSON.parse(readFileSync(specPath, "utf8"));

function git(...args) {
  return execFileSync("git", args, { cwd: repoRoot, encoding: "utf8" });
}

const saved = new Map();

for (const [file, stub] of Object.entries(spec.stubs ?? {})) {
  const full = resolve(repoRoot, file);

  saved.set(full, readFileSync(full, "utf8"));
  writeFileSync(full, stub, "utf8");
}

for (const file of spec.remove ?? []) {
  const full = resolve(repoRoot, file);

  saved.set(full, readFileSync(full, "utf8"));
  rmSync(full);
}

git("add", "-A");
git("commit", "-q", "-m", spec.starterMessage);

for (const [full, original] of saved) {
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, original, "utf8");
}

git("add", "-A");
git("commit", "-q", "-m", spec.solutionMessage);

console.log(git("log", "--oneline", "-n", "2"));
