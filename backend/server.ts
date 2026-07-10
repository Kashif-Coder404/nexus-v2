import app from "./app.js";
import dotenv from "dotenv";

dotenv.config();

const PORT: number = 3100;

app.listen(PORT, () => {
  console.log(`Server is running: http://localhost:${PORT}`);
}); 
