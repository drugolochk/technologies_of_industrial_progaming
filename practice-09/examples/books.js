import express from "express";

const PORT = 5510;
const HOST = "127.0.0.1";

const books = new Map([
  [1, { id: 1, title: "JavaScript для начинающих" }],
  [2, { id: 2, title: "Node.js в действии" }],
  [3, { id: 3, title: "Express 5" }],
]);

const app = express();

app.get("/books/:id", (req, res) => {
  const id = Number(req.params.id);
  const book = books.get(id);

  if (book === undefined) {
    res.status(404).json({ error: { message: "Книга не найдена." } });
    return;
  }

  res.status(200).json({ data: book });
});

app.listen(PORT, HOST, () => {
  console.log(`Пример: http://${HOST}:${PORT}/books/3`);
});
