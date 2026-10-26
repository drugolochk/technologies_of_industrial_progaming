import { Router } from "express";

import { ApiError } from "./errors.js";
import { parseFilters, parsePositiveId } from "./validation.js";

const ALLOW = "GET, HEAD, OPTIONS";

function rejectMethod(req, res, next) {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
    next("route");
    return;
  }

  res.set("Allow", ALLOW);
  next(new ApiError(405, "METHOD_NOT_ALLOWED", "Метод не поддерживается."));
}

export function createRoutes(store) {
  const router = Router();

  router.get("/health", (req, res) => {
    res.status(200).json({ data: { status: "ok" } });
  });

  router.get("/categories", (req, res) => {
    const data = store.listCategories();
    res.status(200).json({ data, meta: { total: data.length } });
  });

  router.get("/tasks", (req, res) => {
    const url = new URL(req.originalUrl, "http://localhost");
    const filters = parseFilters(url.searchParams);
    const data = store.listTasks(filters);

    res.status(200).json({
      data,
      meta: { total: data.length, filters },
    });
  });

  router.get("/tasks/:id", (req, res, next) => {
    const id = parsePositiveId(req.params.id);

    if (id === null) {
      next(new ApiError(400, "INVALID_ID", "Идентификатор задачи указан неверно."));
      return;
    }

    const task = store.getTask(id);

    if (task === null) {
      next(new ApiError(404, "TASK_NOT_FOUND", "Задача не найдена.", { id }));
      return;
    }

    res.status(200).json({ data: task });
  });

  router.all("/health", rejectMethod);
  router.all("/categories", rejectMethod);
  router.all("/tasks", rejectMethod);
  router.all("/tasks/:id", rejectMethod);

  return router;
}
