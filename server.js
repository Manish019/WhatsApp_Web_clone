import express from "express";
import cors from "cors";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import webhookRouter from "./routes/webhook.js";
import convRouter from "./routes/conversations.js";
import "./Data/db.js"; 

const app = express();
//app.use(cors({ origin: "http://localhost:5173" }));
app.use(cors({ origin: "https://whats-app-web-front-end.vercel.app" }));

app.use(express.json({ limit: "5mb" }));

app.get("/", (req, res) => {
  res.send("Welcome to Web WhatsApp");
});

const server = http.createServer(app);
const io = new SocketIOServer(server, {
   //cors: { origin: "http://localhost:5173", methods: ["GET", "POST"] }
  cors: { origin: "https://whats-app-web-front-end.vercel.app", methods: ["GET", "POST"] }

});

app.set("io", io);

io.on("connection", (socket) => {
  console.log("Client Connected =>", socket.id);
  socket.on("disconnect", () => {
    console.log("Client Disconnected =>", socket.id);
  });
});

app.use("/webhook", webhookRouter);
app.use("/api", convRouter);

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Server is running at port => ${PORT}`);
});
