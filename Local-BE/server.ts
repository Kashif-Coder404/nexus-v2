import app from "./app";

const PORT = 4100;

const server = app.listen(PORT, () => {
  console.log(`[SERVER] Running on http://localhost:${PORT}`);
});

server.on("error", (error) => {
  console.error("Server error:", error);
  process.exit(1);
});