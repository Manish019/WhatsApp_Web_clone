import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';

import webhookRouter from './routes/webhook.js';
import convRouter from './routes/conversations.js';

const app = express();
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json({ limit: '5mb' }));

//  Database connect live
mongoose.connect('mongodb+srv://arayanmanish:bHkWOxVoBYnoy5il@cluster0.3xtjatq.mongodb.net/whatsapp')
  .then(() => console.log("DataBase connected"))
 .catch((err) => console.error("MongoDB error:", err.message));

app.get("/", (req, res) => {
  res.send("Welcome to Web WhatsApp");
});

// Create HTTP + Socket.io server
const server = http.createServer(app);
  const io = new SocketIOServer(server, {
  cors: { origin: 'http://localhost:5173', methods: ['GET', 'POST'] }
});
app.set('io', io);
// Socket.io events
io.on("connection", (socket) => {
  console.log("Client Connected =>", socket.id);

  socket.on("disconnect", () => {
    console.log("Client Disconnected =>", socket.id);
  });
});


// Routes connect
app.use('/webhook', webhookRouter);
app.use('/api', convRouter);

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Server is running at port => ${PORT}`);
});
