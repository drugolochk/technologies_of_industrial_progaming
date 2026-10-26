import assert from "node:assert/strict";
import { test } from "node:test";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!DOCTYPE html><html><body><div id=\"root\"></div></body></html>", {
  url: "http://127.0.0.1/",
});

globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const { act, createElement, useState } = await import("react");
const { createRoot } = await import("react-dom/client");
const { useTaskData } = await import("../src/hooks/useTaskData.js");
const { createInitialFilters, variantNumber } = await import("../src/variant.js");

function deferred() {
  let resolve;
  let reject;

  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

function createControllableApi() {
  const calls = {
    loadInitialData: [],
    createTask: [],
    updateTask: [],
    setTaskCompleted: [],
    deleteTask: [],
    resetDemoData: [],
  };

  const loadQueue = [];
  const createQueue = [];
  const updateQueue = [];
  const toggleQueue = [];
  const deleteQueue = [];
  const resetQueue = [];

  function shiftOrDefault(queue, fallback) {
    if (queue.length === 0) {
      return fallback;
    }

    return queue.shift();
  }

  const api = {
    calls,
    planLoad(handler) {
      loadQueue.push(handler);
    },
    planCreate(handler) {
      createQueue.push(handler);
    },
    planUpdate(handler) {
      updateQueue.push(handler);
    },
    planToggle(handler) {
      toggleQueue.push(handler);
    },
    planDelete(handler) {
      deleteQueue.push(handler);
    },
    planReset(handler) {
      resetQueue.push(handler);
    },
    async loadInitialData(filters, options = {}) {
      calls.loadInitialData.push({ filters, signal: options.signal });

      const handler = shiftOrDefault(loadQueue, () => ({
        tasks: [],
        categories: [],
        meta: { total: 0 },
      }));

      return handler(filters, options);
    },
    async createTask(value, options = {}) {
      calls.createTask.push({ value, signal: options.signal });

      const handler = shiftOrDefault(createQueue, () => ({ id: 99, completed: false, ...value }));

      return handler(value, options);
    },
    async updateTask(id, value, options = {}) {
      calls.updateTask.push({ id, value, signal: options.signal });

      const handler = shiftOrDefault(updateQueue, () => ({ id, completed: false, ...value }));

      return handler(id, value, options);
    },
    async setTaskCompleted(id, completed, options = {}) {
      calls.setTaskCompleted.push({ id, completed, signal: options.signal });

      const handler = shiftOrDefault(toggleQueue, () => ({ id, completed, title: "x", priority: "low", categoryId: 1 }));

      return handler(id, completed, options);
    },
    async deleteTask(id, options = {}) {
      calls.deleteTask.push({ id, signal: options.signal });

      const handler = shiftOrDefault(deleteQueue, () => null);

      return handler(id, options);
    },
    async resetDemoData(options = {}) {
      calls.resetDemoData.push({ signal: options.signal });

      const handler = shiftOrDefault(resetQueue, () => ({ reset: true, total: 12 }));

      return handler(options);
    },
  };

  return api;
}

let mountedRoot = null;

async function mountTaskData(api, initialFilters = { q: "", completed: "", priority: "", categoryId: "" }) {
  const hostRef = { current: null };

  if (mountedRoot !== null) {
    await act(async () => {
      mountedRoot.unmount();
    });
    mountedRoot = null;
  }

  document.body.innerHTML = "<div id=\"root\"></div>";
  const container = document.getElementById("root");
  const root = createRoot(container);
  mountedRoot = root;

  function Host() {
    const [filters, setFilters] = useState(initialFilters);
    const data = useTaskData({ api, filters });

    hostRef.current = { data, setFilters };

    return null;
  }

  await act(async () => {
    root.render(createElement(Host));
  });

  return {
    get current() {
      return hostRef.current;
    },
    async rerender() {
      await act(async () => {
        root.render(createElement(Host));
      });
    },
    async unmount() {
      await act(async () => {
        root.unmount();
      });
    },
  };
}

async function flushPromises() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

test("1. initial loading then ready with tasks", async () => {
  const api = createControllableApi();
  const load = deferred();

  api.planLoad(() => load.promise);

  const host = await mountTaskData(api);

  assert.equal(host.current.data.status, "loading");

  load.resolve({
    tasks: [{ id: 1, title: "A", completed: false, priority: "low", categoryId: 1 }],
    categories: [{ id: 1, name: "Учёба" }],
    meta: { total: 1 },
  });

  await flushPromises();

  assert.equal(host.current.data.status, "ready");
  assert.equal(host.current.data.snapshot.tasks.length, 1);
});

test("2. empty array is ready not error", async () => {
  const api = createControllableApi();

  api.planLoad(async () => ({
    tasks: [],
    categories: [{ id: 1, name: "Учёба" }],
    meta: { total: 0 },
  }));

  const host = await mountTaskData(api);

  await flushPromises();

  assert.equal(host.current.data.status, "ready");
  assert.equal(host.current.data.error, null);
  assert.deepEqual(host.current.data.snapshot.tasks, []);
});

test("3. load error sets error keeps empty snapshot", async () => {
  const api = createControllableApi();

  api.planLoad(async () => {
    throw new Error("load failed");
  });

  const host = await mountTaskData(api);

  await flushPromises();

  assert.equal(host.current.data.status, "error");
  assert.ok(host.current.data.error);
  assert.deepEqual(host.current.data.snapshot.tasks, []);
});

test("4. refresh after first error loads categories and tasks", async () => {
  const api = createControllableApi();

  api.planLoad(async () => {
    throw new Error("first fail");
  });
  api.planLoad(async () => ({
    tasks: [{ id: 4, title: "T", completed: false, priority: "high", categoryId: 2 }],
    categories: [{ id: 2, name: "Проект" }],
    meta: { total: 1 },
  }));

  const host = await mountTaskData(api);

  await flushPromises();
  assert.equal(host.current.data.status, "error");

  await act(async () => {
    host.current.data.refresh();
  });
  await flushPromises();

  assert.equal(host.current.data.status, "ready");
  assert.equal(host.current.data.snapshot.categories.length, 1);
  assert.equal(host.current.data.snapshot.tasks.length, 1);
});

test("5. filter change starts new load", async () => {
  const api = createControllableApi();

  api.planLoad(async () => ({
    tasks: [],
    categories: [],
    meta: { total: 0 },
  }));
  api.planLoad(async () => ({
    tasks: [],
    categories: [],
    meta: { total: 0 },
  }));

  const host = await mountTaskData(api, { q: "", completed: "", priority: "", categoryId: "" });

  await flushPromises();

  await act(async () => {
    host.current.setFilters({ q: "api", completed: "", priority: "", categoryId: "" });
  });

  await flushPromises();

  assert.equal(api.calls.loadInitialData.length, 2);
  assert.equal(api.calls.loadInitialData[1].filters.q, "api");
});

test("6. stale slower response does not overwrite newer filter result", async () => {
  const api = createControllableApi();
  const first = deferred();
  const second = deferred();

  api.planLoad(() => first.promise);
  api.planLoad(() => second.promise);

  const host = await mountTaskData(api, { q: "", completed: "", priority: "", categoryId: "" });

  await act(async () => {
    host.current.setFilters({ q: "new", completed: "", priority: "", categoryId: "" });
  });

  second.resolve({
    tasks: [{ id: 2, title: "new-filter", completed: false, priority: "low", categoryId: 1 }],
    categories: [],
    meta: { total: 1 },
  });

  await flushPromises();

  first.resolve({
    tasks: [{ id: 1, title: "old-filter", completed: false, priority: "low", categoryId: 1 }],
    categories: [],
    meta: { total: 1 },
  });

  await flushPromises();

  assert.equal(host.current.data.snapshot.tasks[0]?.title, "new-filter");
});

test("7. aborted stale error does not set error", async () => {
  const api = createControllableApi();
  const first = deferred();
  const second = deferred();

  api.planLoad((_filters, options) => {
    options.signal?.addEventListener("abort", () => {
      // Имитация API, которое всё равно отклоняет запрос после abort.
      first.reject(new Error("aborted late"));
    });

    return first.promise;
  });
  api.planLoad(() => second.promise);

  const host = await mountTaskData(api);

  await act(async () => {
    host.current.setFilters({ q: "x", completed: "", priority: "", categoryId: "" });
  });

  second.resolve({ tasks: [], categories: [], meta: { total: 0 } });
  await flushPromises();

  first.reject(new Error("stale failure"));

  await flushPromises();

  assert.equal(host.current.data.error, null);
  assert.equal(host.current.data.status, "ready");
});

test("8. saveTask create triggers revision reload", async () => {
  const api = createControllableApi();

  api.planLoad(async () => ({ tasks: [], categories: [], meta: { total: 0 } }));
  api.planCreate(async () => ({ id: 35, title: "N", completed: false, priority: "low", categoryId: 2 }));
  api.planLoad(async () => ({
    tasks: [{ id: 35, title: "N", completed: false, priority: "low", categoryId: 2 }],
    categories: [],
    meta: { total: 1 },
  }));

  const host = await mountTaskData(api);

  await flushPromises();

  let saved = false;

  await act(async () => {
    saved = await host.current.data.saveTask(null, { title: "N", priority: "low", categoryId: 2 });
  });
  await flushPromises();

  assert.equal(saved, true);
  assert.equal(api.calls.createTask.length, 1);
  assert.equal(api.calls.loadInitialData.length, 2);
});

test("9. double saveTask while pending returns false once", async () => {
  const api = createControllableApi();
  const create = deferred();

  api.planLoad(async () => ({ tasks: [], categories: [], meta: { total: 0 } }));
  api.planCreate(() => create.promise);
  api.planLoad(async () => ({ tasks: [], categories: [], meta: { total: 0 } }));

  const host = await mountTaskData(api);

  await flushPromises();

  let second = true;

  await act(async () => {
    const firstCall = host.current.data.saveTask(null, { title: "A", priority: "low", categoryId: 1 });
    second = await host.current.data.saveTask(null, { title: "B", priority: "low", categoryId: 1 });
    create.resolve({ id: 35, title: "A", completed: false, priority: "low", categoryId: 1 });
    await firstCall;
  });
  await flushPromises();

  assert.equal(second, false);
  assert.equal(api.calls.createTask.length, 1);
});

test("10. mutation error sets mutationError and clears pending", async () => {
  const api = createControllableApi();

  api.planLoad(async () => ({ tasks: [], categories: [], meta: { total: 0 } }));
  api.planCreate(async () => {
    throw new Error("create failed");
  });

  const host = await mountTaskData(api);

  await flushPromises();

  let saved = true;

  await act(async () => {
    saved = await host.current.data.saveTask(null, { title: "A", priority: "low", categoryId: 1 });
  });
  await flushPromises();

  assert.equal(saved, false);
  assert.ok(host.current.data.mutationError);
  assert.equal(host.current.data.pending, false);
});

test("11. toggle delete reset call corresponding api methods", async () => {
  const api = createControllableApi();

  api.planLoad(async () => ({
    tasks: [{ id: 4, title: "T", completed: false, priority: "high", categoryId: 2 }],
    categories: [],
    meta: { total: 1 },
  }));
  api.planToggle(async () => ({ id: 4, title: "T", completed: true, priority: "high", categoryId: 2 }));
  api.planLoad(async () => ({ tasks: [], categories: [], meta: { total: 0 } }));
  api.planDelete(async () => null);
  api.planLoad(async () => ({ tasks: [], categories: [], meta: { total: 0 } }));
  api.planReset(async () => ({ reset: true, total: 12 }));
  api.planLoad(async () => ({ tasks: [], categories: [], meta: { total: 0 } }));

  const host = await mountTaskData(api);

  await flushPromises();

  await act(async () => {
    await host.current.data.toggleTask({ id: 4, completed: false, title: "T", priority: "high", categoryId: 2 });
  });
  await flushPromises();

  await act(async () => {
    await host.current.data.deleteTask(4);
  });
  await flushPromises();

  await act(async () => {
    await host.current.data.resetData();
  });
  await flushPromises();

  assert.equal(api.calls.setTaskCompleted.length, 1);
  assert.equal(api.calls.deleteTask.length, 1);
  assert.equal(api.calls.resetDemoData.length, 1);
});

test("12. successful mutate then failed GET keeps snapshot and sets load error", async () => {
  const api = createControllableApi();

  api.planLoad(async () => ({
    tasks: [{ id: 1, title: "Keep", completed: false, priority: "low", categoryId: 1 }],
    categories: [{ id: 1, name: "Учёба" }],
    meta: { total: 1 },
  }));
  api.planCreate(async () => ({ id: 35, title: "N", completed: false, priority: "low", categoryId: 1 }));
  api.planLoad(async () => {
    throw new Error("reload failed");
  });

  const host = await mountTaskData(api);

  await flushPromises();

  let saved = false;

  await act(async () => {
    saved = await host.current.data.saveTask(null, { title: "N", priority: "low", categoryId: 1 });
  });
  await flushPromises();

  assert.equal(saved, true);
  assert.equal(host.current.data.snapshot.tasks[0].title, "Keep");
  assert.equal(host.current.data.status, "error");
  assert.ok(host.current.data.error);
  assert.equal(host.current.data.mutationError, null);
});

test("13. saveTask with id calls updateTask not createTask", async () => {
  const api = createControllableApi();

  api.planLoad(async () => ({ tasks: [], categories: [], meta: { total: 0 } }));
  api.planUpdate(async () => ({ id: 4, title: "Upd", completed: true, priority: "high", categoryId: 2 }));
  api.planLoad(async () => ({ tasks: [], categories: [], meta: { total: 0 } }));

  const host = await mountTaskData(api);

  await flushPromises();

  await act(async () => {
    await host.current.data.saveTask(4, { title: "Upd", priority: "high", categoryId: 2 });
  });
  await flushPromises();

  assert.equal(api.calls.updateTask.length, 1);
  assert.equal(api.calls.createTask.length, 0);
});

test("14. unmount ignores late load success", async () => {
  const api = createControllableApi();
  const load = deferred();

  api.planLoad(() => load.promise);

  const host = await mountTaskData(api);

  await act(async () => {
    await host.unmount();
  });

  load.resolve({
    tasks: [{ id: 1, title: "Late", completed: false, priority: "low", categoryId: 1 }],
    categories: [],
    meta: { total: 1 },
  });

  await flushPromises();
});

test("15. variant initial filter and refresh after error increments revision", async () => {
  const api = createControllableApi();
  const initial = createInitialFilters(variantNumber);

  assert.equal(variantNumber, 6);
  assert.equal(initial.categoryId, "2");

  api.planLoad(async () => {
    throw new Error("variant load fail");
  });
  api.planLoad(async () => ({
    tasks: [{ id: 4, title: "P", completed: false, priority: "high", categoryId: 2 }],
    categories: [{ id: 2, name: "Проект" }],
    meta: { total: 1 },
  }));

  const host = await mountTaskData(api, initial);

  await flushPromises();
  assert.equal(host.current.data.status, "error");
  assert.equal(api.calls.loadInitialData[0].filters.categoryId, "2");

  await act(async () => {
    host.current.data.refresh();
  });
  await flushPromises();

  assert.equal(host.current.data.status, "ready");
  assert.equal(api.calls.loadInitialData.length, 2);
  assert.equal(host.current.data.snapshot.meta.total, 1);
});
