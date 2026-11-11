import assert from "node:assert/strict";
import { after, test } from "node:test";

import { createApp } from "../src/app.js";
import { categories, tasks } from "../src/data.js";
import { createStore } from "../src/store.js";

function ids(items) {
  return items.map((item) => item.id);
}

async function listen(app) {
  return new Promise((resolve) => {
    const server = app.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      resolve({ server, baseUrl: `http://127.0.0.1:${port}` });
    });
  });
}

const { server, baseUrl } = await listen(createApp());

async function request(path, init = {}) {
  const response = await fetch(`${baseUrl}${path}`, init);
  const buffer = await response.arrayBuffer();
  const text = new TextDecoder().decode(buffer);

  return {
    status: response.status,
    headers: response.headers,
    text,
    json: () => (text ? JSON.parse(text) : null),
  };
}

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("GET /api/health возвращает 200", async () => {
  const response = await request("/api/health");
  assert.equal(response.status, 200);
  assert.equal(response.json().data.status, "ok");
});

test("GET /api/categories возвращает 3 категории", async () => {
  const payload = (await request("/api/categories")).json();
  assert.equal(payload.data.length, 3);
  assert.equal(payload.meta.total, 3);
  assert.deepEqual(
    payload.data.map((item) => item.name),
    ["Учёба", "Проект", "Организация"]
  );
});

test("GET /api/tasks возвращает JSON-массив из 12 задач", async () => {
  const payload = (await request("/api/tasks")).json();
  assert.ok(Array.isArray(payload));
  assert.deepEqual(ids(payload), [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34]);
});

test("HEAD /api/health не имеет тела", async () => {
  const response = await request("/api/health", { method: "HEAD" });
  assert.equal(response.status, 200);
  assert.equal(response.text, "");
});

test("HEAD /api/tasks не имеет тела", async () => {
  const response = await request("/api/tasks", { method: "HEAD" });
  assert.equal(response.status, 200);
  assert.equal(response.text, "");
});

test("OPTIONS /api/tasks возвращает 204", async () => {
  const response = await request("/api/tasks", { method: "OPTIONS" });
  assert.equal(response.status, 204);
  assert.equal(response.text, "");
});

test("OPTIONS неизвестного пути возвращает 204", async () => {
  const response = await request("/api/unknown", { method: "OPTIONS" });
  assert.equal(response.status, 204);
});

test("CORS: Access-Control-Allow-Origin *", async () => {
  const response = await request("/api/health");
  assert.equal(response.headers.get("access-control-allow-origin"), "*");
});

test("GET /api/tasks?completed=false", async () => {
  const payload = (await request("/api/tasks?completed=false")).json();
  assert.deepEqual(ids(payload), [4, 7, 13, 19, 22, 28, 34]);
});

test("GET /api/tasks?completed=true", async () => {
  const payload = (await request("/api/tasks?completed=true")).json();
  assert.deepEqual(ids(payload), [1, 10, 16, 25, 31]);
});

test("GET /api/tasks?priority=high", async () => {
  const payload = (await request("/api/tasks?priority=high")).json();
  assert.deepEqual(ids(payload), [4, 13, 16, 25, 34]);
});

test("вариант 6: GET /api/tasks?categoryId=2", async () => {
  const payload = (await request("/api/tasks?categoryId=2")).json();
  assert.deepEqual(ids(payload), [4, 16, 22, 25, 28, 34]);
  assert.equal(payload.length, 6);
});

test("GET /api/tasks?q=ПРОВЕР", async () => {
  const payload = (await request(`/api/tasks?${new URLSearchParams({ q: "ПРОВЕР" })}`)).json();
  assert.deepEqual(ids(payload), [7, 16]);
});

test("комбинация completed=false&priority=high&categoryId=2", async () => {
  const response = await request("/api/tasks?completed=false&priority=high&categoryId=2");
  const payload = response.json();
  assert.deepEqual(ids(payload), [4, 34]);
});

test("categoryId=999 возвращает 200 и пустой массив", async () => {
  const response = await request("/api/tasks?categoryId=999");
  assert.equal(response.status, 200);
  assert.deepEqual(response.json(), []);
});

test("completed=0 → 400 INVALID_QUERY", async () => {
  const response = await request("/api/tasks?completed=0");
  assert.equal(response.status, 400);
  assert.equal(response.json().error.code, "INVALID_QUERY");
});

test("completed=True → 400 INVALID_QUERY", async () => {
  const response = await request("/api/tasks?completed=True");
  assert.equal(response.status, 400);
  assert.equal(response.json().error.code, "INVALID_QUERY");
});

test("повторяющийся параметр → 400 INVALID_QUERY", async () => {
  const response = await request("/api/tasks?q=a&q=b");
  assert.equal(response.status, 400);
  assert.equal(response.json().error.code, "INVALID_QUERY");
});

test("неизвестный параметр sort → 400 INVALID_QUERY", async () => {
  const response = await request("/api/tasks?sort=id");
  assert.equal(response.status, 400);
  assert.equal(response.json().error.code, "INVALID_QUERY");
});

test("categoryId=01 → 400 INVALID_QUERY", async () => {
  const response = await request("/api/tasks?categoryId=01");
  assert.equal(response.status, 400);
  assert.equal(response.json().error.code, "INVALID_QUERY");
});

test("completed= → 400 INVALID_QUERY", async () => {
  const response = await request("/api/tasks?completed=");
  assert.equal(response.status, 400);
  assert.equal(response.json().error.code, "INVALID_QUERY");
});

test("q длиной 101 → 400 INVALID_QUERY", async () => {
  const response = await request(`/api/tasks?q=${"а".repeat(101)}`);
  assert.equal(response.status, 400);
  assert.equal(response.json().error.code, "INVALID_QUERY");
});

test("q= не ограничивает выборку", async () => {
  const payload = (await request("/api/tasks?q=")).json();
  assert.equal(payload.length, 12);
});

test("GET /api/tasks/4 возвращает задачу", async () => {
  const response = await request("/api/tasks/4");
  assert.equal(response.status, 200);
  assert.equal(response.json().data.title, "Подготовить модель задач");
});

test("GET /api/tasks/2 → 404 TASK_NOT_FOUND с details.id", async () => {
  const response = await request("/api/tasks/2");
  assert.equal(response.status, 404);
  const payload = response.json();
  assert.equal(payload.error.code, "TASK_NOT_FOUND");
  assert.equal(payload.error.details.id, 2);
});

test("GET /api/tasks/4abc → 400 INVALID_ID", async () => {
  const response = await request("/api/tasks/4abc");
  assert.equal(response.status, 400);
  assert.equal(response.json().error.code, "INVALID_ID");
});

test("GET /api/tasks/0 → 400 INVALID_ID", async () => {
  const response = await request("/api/tasks/0");
  assert.equal(response.status, 400);
  assert.equal(response.json().error.code, "INVALID_ID");
});

test("GET /api/tasks/01 → 400 INVALID_ID", async () => {
  const response = await request("/api/tasks/01");
  assert.equal(response.status, 400);
  assert.equal(response.json().error.code, "INVALID_ID");
});

test("GET /api/unknown → 404 ROUTE_NOT_FOUND", async () => {
  const response = await request("/api/unknown");
  assert.equal(response.status, 404);
  assert.equal(response.json().error.code, "ROUTE_NOT_FOUND");
});

test("POST /api/tasks без title → 400 VALIDATION_ERROR", async () => {
  const response = await request("/api/tasks", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: "{}"
  });
  assert.equal(response.status, 400);
  assert.equal(response.json().error.code, "VALIDATION_ERROR");
  assert.ok(response.json().error.details.title);
});

test("DELETE /api/tasks/999 → 405 без проверки существования", async () => {
  const response = await request("/api/tasks/999", { method: "DELETE" });
  assert.equal(response.status, 405);
  assert.equal(response.json().error.code, "METHOD_NOT_ALLOWED");
});

test("PATCH /api/health → 405", async () => {
  const response = await request("/api/health", { method: "PATCH" });
  assert.equal(response.status, 405);
});

test("POST /api/categories → 405", async () => {
  const response = await request("/api/categories", { method: "POST" });
  assert.equal(response.status, 405);
});

test("JSON Content-Type и charset", async () => {
  const response = await request("/api/health");
  assert.match(response.headers.get("content-type"), /application\/json/);
  assert.match(response.headers.get("content-type"), /charset=utf-8/i);
});

test("Cache-Control: no-store", async () => {
  const response = await request("/api/tasks");
  assert.equal(response.headers.get("cache-control"), "no-store");
});

test("ошибка тоже JSON с charset и без stack", async () => {
  const response = await request("/api/tasks/2");
  assert.match(response.headers.get("content-type"), /charset=utf-8/i);
  assert.equal(response.text.includes("stack"), false);
  assert.equal(response.json().error.message.length > 0, true);
});

test("CORS Allow-Methods включает GET HEAD OPTIONS", async () => {
  const response = await request("/api/tasks");
  const methods = response.headers.get("access-control-allow-methods");
  assert.match(methods, /GET/);
  assert.match(methods, /HEAD/);
  assert.match(methods, /OPTIONS/);
});

test("HEAD /api/categories", async () => {
  const response = await request("/api/categories", { method: "HEAD" });
  assert.equal(response.status, 200);
  assert.equal(response.text, "");
});

test("OPTIONS /api/health", async () => {
  const response = await request("/api/health", { method: "OPTIONS" });
  assert.equal(response.status, 204);
});

test("поиск без учёта регистра: провер", async () => {
  const payload = (await request(`/api/tasks?${new URLSearchParams({ q: "провер" })}`)).json();
  assert.deepEqual(ids(payload), [7, 16]);
});

test("поля задачи соответствуют контракту", async () => {
  const task = (await request("/api/tasks/4")).json().data;
  assert.deepEqual(Object.keys(task).sort(), ["categoryId", "completed", "id", "priority", "title"]);
});

test("GET /api/tasks/1e2 → 400 INVALID_ID", async () => {
  const response = await request("/api/tasks/1e2");
  assert.equal(response.status, 400);
  assert.equal(response.json().error.code, "INVALID_ID");
});

test("чтение не изменяет исходный набор", async () => {
  await request("/api/tasks?completed=true");
  const payload = (await request("/api/tasks")).json();
  assert.equal(payload.length, 12);
  assert.equal(tasks.length, 12);
  assert.equal(categories.length, 3);
});

test("вариант 6: GET отдельной задачи из выборки /api/tasks/28", async () => {
  const response = await request("/api/tasks/28");
  assert.equal(response.status, 200);
  assert.equal(response.json().data.categoryId, 2);
});

test("вариант 6: отсутствующий id 80 → 404", async () => {
  const response = await request("/api/tasks/80");
  assert.equal(response.status, 404);
  assert.equal(response.json().error.code, "TASK_NOT_FOUND");
});

test("X-Response-Time присутствует (доп. задание)", async () => {
  const response = await request("/api/health");
  assert.ok(response.headers.get("x-response-time"));
});

test("исключение хранилища → 500 INTERNAL_ERROR без служебного текста", async () => {
  const broken = createStore({ categories, tasks });
  broken.listTasks = () => {
    throw new Error("секретный stack pg://user:pass@host");
  };

  const { server: localServer, baseUrl: localBase } = await listen(createApp({ store: broken }));

  try {
    const response = await fetch(`${localBase}/api/tasks`);
    const payload = await response.json();
    assert.equal(response.status, 500);
    assert.equal(payload.error.code, "INTERNAL_ERROR");
    const body = JSON.stringify(payload);
    assert.equal(body.includes("stack"), false);
    assert.equal(body.includes("pg://"), false);
    assert.equal(body.includes("секретный"), false);
  } finally {
    await new Promise((resolve, reject) => {
      localServer.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("priority=medium возвращает ожидаемые id", async () => {
  const payload = (await request("/api/tasks?priority=medium")).json();
  assert.deepEqual(ids(payload), [1, 10, 19, 28]);
});

test("повторяющийся priority → 400", async () => {
  const response = await request("/api/tasks?priority=medium&priority=medium");
  assert.equal(response.status, 400);
  assert.equal(response.json().error.code, "INVALID_QUERY");
});

test("GET /api/tasks?categoryId=1", async () => {
  const payload = (await request("/api/tasks?categoryId=1")).json();
  assert.deepEqual(ids(payload), [1, 7, 13]);
});

test("PUT /api/tasks/4 → 405", async () => {
  const response = await request("/api/tasks/4", { method: "PUT" });
  assert.equal(response.status, 405);
  assert.equal(response.headers.get("allow"), "GET, HEAD, OPTIONS");
});

test("GET /api/tasks/1.5 → 400 INVALID_ID", async () => {
  const response = await request("/api/tasks/1.5");
  assert.equal(response.status, 400);
  assert.equal(response.json().error.code, "INVALID_ID");
});

