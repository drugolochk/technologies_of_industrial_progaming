import express from "express";

import { categories, tasks } from "./data.js";
import { ApiError, errorHandler } from "./errors.js";
import { createRoutes } from "./routes.js";
import { createStore } from "./store.js";

function applyCommonHeaders(req, res, next) {
  res.set({
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  next();
}

function handleOptions(req, res, next) {
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  next();
}

function guardUriEncoding(req, res, next) {
  try {
    decodeURIComponent(req.path);
    next();
  } catch {
    next(new ApiError(400, "INVALID_ID", "Идентификатор задачи указан неверно."));
  }
}

function requestTiming(req, res, next) {
  const started = process.hrtime.bigint();
  const originalJson = res.json.bind(res);
  const originalEnd = res.end.bind(res);

  function writeDuration() {
    if (res.getHeader("X-Response-Time")) {
      return;
    }

    const elapsedMs = Number(process.hrtime.bigint() - started) / 1e6;
    res.setHeader("X-Response-Time", `${elapsedMs.toFixed(2)}ms`);
  }

  res.json = (body) => {
    writeDuration();
    return originalJson(body);
  };

  res.end = (...args) => {
    writeDuration();
    return originalEnd(...args);
  };

  next();
}

export function createApp(options = {}) {
  const store = options.store ?? createStore({ categories, tasks });
  const app = express();

  app.disable("x-powered-by");
  app.use(requestTiming);
  app.use(applyCommonHeaders);
  app.use(handleOptions);
  app.use(guardUriEncoding);

  app.use("/api", createRoutes(store));

  app.use((req, res, next) => {
    next(new ApiError(404, "ROUTE_NOT_FOUND", "Маршрут не найден."));
  });

  app.use((err, req, res, next) => {
    if (err instanceof URIError) {
      next(new ApiError(400, "INVALID_ID", "Идентификатор задачи указан неверно."));
      return;
    }

    next(err);
  });

  app.use(errorHandler);

  return app;
}
