import assert from "node:assert/strict";
import test from "node:test";

import { tasks as seedTasks } from "../src/data.js";
import { ApiError } from "../src/errors.js";
import { findTask, selectTasks } from "../src/task-service.js";
import { parseFilters, parsePositiveId } from "../src/validation.js";

function ids(list) {
  return list.map((task) => task.id);
}

test("parsePositiveId: принимает 1", () => {
  assert.equal(parsePositiveId("1"), 1);
});

test("parsePositiveId: отклоняет 0", () => {
  assert.equal(parsePositiveId("0"), null);
});

test("parsePositiveId: отклоняет -1", () => {
  assert.equal(parsePositiveId("-1"), null);
});

test("parsePositiveId: отклоняет ведущий ноль 01", () => {
  assert.equal(parsePositiveId("01"), null);
});

test("parsePositiveId: отклоняет 1.5", () => {
  assert.equal(parsePositiveId("1.5"), null);
});

test("parsePositiveId: отклоняет 1e2", () => {
  assert.equal(parsePositiveId("1e2"), null);
});

test("parsePositiveId: отклоняет 4abc", () => {
  assert.equal(parsePositiveId("4abc"), null);
});

test("parsePositiveId: отклоняет пробелы", () => {
  assert.equal(parsePositiveId(" 4"), null);
  assert.equal(parsePositiveId("4 "), null);
});

test("parsePositiveId: принимает максимальное безопасное целое", () => {
  const max = String(Number.MAX_SAFE_INTEGER);
  assert.equal(parsePositiveId(max), Number.MAX_SAFE_INTEGER);
});

test("parsePositiveId: отклоняет число больше MAX_SAFE_INTEGER", () => {
  const tooBig = `${Number.MAX_SAFE_INTEGER}0`;
  assert.equal(parsePositiveId(tooBig), null);
});

test("parseFilters: значения по умолчанию без параметров", () => {
  assert.deepEqual(parseFilters(new URLSearchParams()), {
    completed: null,
    priority: null,
    categoryId: null,
    q: "",
  });
});

test("parseFilters: completed=false", () => {
  const filters = parseFilters(new URLSearchParams("completed=false"));
  assert.equal(filters.completed, false);
});

test("parseFilters: completed=true", () => {
  const filters = parseFilters(new URLSearchParams("completed=true"));
  assert.equal(filters.completed, true);
});

test("parseFilters: повтор completed → INVALID_QUERY", () => {
  assert.throws(
    () => parseFilters(new URLSearchParams("completed=true&completed=false")),
    (error) => error instanceof ApiError && error.code === "INVALID_QUERY"
  );
});

test("parseFilters: неизвестный параметр → INVALID_QUERY", () => {
  assert.throws(
    () => parseFilters(new URLSearchParams("sort=id")),
    (error) => error instanceof ApiError && error.code === "INVALID_QUERY"
  );
});

test("parseFilters: пустой completed= → INVALID_QUERY", () => {
  assert.throws(
    () => parseFilters(new URLSearchParams("completed=")),
    (error) => error instanceof ApiError && error.code === "INVALID_QUERY"
  );
});

test("parseFilters: пустой priority= → INVALID_QUERY", () => {
  assert.throws(
    () => parseFilters(new URLSearchParams("priority=")),
    (error) => error instanceof ApiError && error.code === "INVALID_QUERY"
  );
});

test("parseFilters: пустой categoryId= → INVALID_QUERY", () => {
  assert.throws(
    () => parseFilters(new URLSearchParams("categoryId=")),
    (error) => error instanceof ApiError && error.code === "INVALID_QUERY"
  );
});

test("parseFilters: q обрезается по trim", () => {
  const filters = parseFilters(new URLSearchParams("q=  провер  "));
  assert.equal(filters.q, "провер");
});

test("parseFilters: q длиной 100 допустим", () => {
  const q = "a".repeat(100);
  const filters = parseFilters(new URLSearchParams(`q=${q}`));
  assert.equal(filters.q.length, 100);
});

test("parseFilters: q длиной 101 → INVALID_QUERY", () => {
  const q = "a".repeat(101);
  assert.throws(
    () => parseFilters(new URLSearchParams(`q=${q}`)),
    (error) => error instanceof ApiError && error.code === "INVALID_QUERY"
  );
});

test("parseFilters: q= допустим", () => {
  const filters = parseFilters(new URLSearchParams("q="));
  assert.equal(filters.q, "");
});

test("parseFilters: повтор q → INVALID_QUERY", () => {
  assert.throws(
    () => parseFilters(new URLSearchParams("q=a&q=b")),
    (error) => error instanceof ApiError && error.code === "INVALID_QUERY"
  );
});

test("parseFilters: completed=0 → INVALID_QUERY", () => {
  assert.throws(
    () => parseFilters(new URLSearchParams("completed=0")),
    (error) => error instanceof ApiError && error.code === "INVALID_QUERY"
  );
});

test("parseFilters: completed=True → INVALID_QUERY", () => {
  assert.throws(
    () => parseFilters(new URLSearchParams("completed=True")),
    (error) => error instanceof ApiError && error.code === "INVALID_QUERY"
  );
});

test("parseFilters: priority=urgent → INVALID_QUERY", () => {
  assert.throws(
    () => parseFilters(new URLSearchParams("priority=urgent")),
    (error) => error instanceof ApiError && error.code === "INVALID_QUERY"
  );
});

test("parseFilters: categoryId=01 → INVALID_QUERY", () => {
  assert.throws(
    () => parseFilters(new URLSearchParams("categoryId=01")),
    (error) => error instanceof ApiError && error.code === "INVALID_QUERY"
  );
});

test("parseFilters: categoryId=999 допустим", () => {
  const filters = parseFilters(new URLSearchParams("categoryId=999"));
  assert.equal(filters.categoryId, 999);
});

test("selectTasks: q=ПРОВЕР → id 7 и 16", () => {
  assert.deepEqual(
    ids(selectTasks(seedTasks, { q: "ПРОВЕР", completed: null, priority: null, categoryId: null })),
    [7, 16]
  );
});

test("selectTasks: completed=false, priority=high, categoryId=2 → 4 и 34", () => {
  assert.deepEqual(
    ids(
      selectTasks(seedTasks, {
        q: "",
        completed: false,
        priority: "high",
        categoryId: 2,
      })
    ),
    [4, 34]
  );
});

test("selectTasks: categoryId=2 → шесть задач варианта 6", () => {
  assert.deepEqual(
    ids(selectTasks(seedTasks, { q: "", completed: null, priority: null, categoryId: 2 })),
    [4, 16, 22, 25, 28, 34]
  );
});

test("selectTasks: пустой массив данных", () => {
  assert.deepEqual(
    ids(selectTasks([], { q: "", completed: null, priority: null, categoryId: null })),
    []
  );
});

test("selectTasks: не изменяет исходный массив", () => {
  const copy = seedTasks.map((task) => ({ ...task }));
  const before = JSON.stringify(copy);
  selectTasks(copy, { q: "API", completed: true, priority: null, categoryId: null });
  assert.equal(JSON.stringify(copy), before);
});

test("findTask: находит задачу по id", () => {
  assert.equal(findTask(seedTasks, 4)?.title, "Подготовить модель задач");
});

test("findTask: возвращает null для отсутствующего id", () => {
  assert.equal(findTask(seedTasks, 2), null);
});

test("selectTasks: без фильтров возвращает все 12 задач", () => {
  assert.equal(
    selectTasks(seedTasks, { q: "", completed: null, priority: null, categoryId: null }).length,
    12
  );
});

test("selectTasks: completed=false без других фильтров", () => {
  assert.deepEqual(
    ids(selectTasks(seedTasks, { q: "", completed: false, priority: null, categoryId: null })),
    [4, 7, 13, 19, 22, 28, 34]
  );
});

test("selectTasks: priority=high", () => {
  assert.deepEqual(
    ids(selectTasks(seedTasks, { q: "", completed: null, priority: "high", categoryId: null })),
    [4, 13, 16, 25, 34]
  );
});
