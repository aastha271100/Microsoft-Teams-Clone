const express = require("express");
const app = express();
const server = require("http").Server(app);
const { v4: uuidv4 } = require("uuid");
app.set("view engine", "ejs");

// Socket and Peer Setup
const io = require("socket.io")(server, {
  cors: {
    origin: '*'
  }
});


const { ExpressPeerServer } = require("peer");
const peerServer = ExpressPeerServer(server, {
  debug: true,
});

app.use("/peerjs", peerServer);
app.use(express.static("public"));


// Get Requests
app.get("/", (req, res) => {
  res.redirect(`/${uuidv4()}`); // Creates a unique random ID and redirects it.
});

app.get("/:room", (req, res) => {
  res.render("room", { roomId: req.params.room });
});

app.get("/", (req, res) => {
    res.render("room");
});

// Socket io connection

io.on("connection", (socket) => {
  // When a new user joins, "user-connected" event is emitted to all others. 
  socket.on("join-room", (roomId, userId, userName) => {
    socket.join(roomId);
    //socket.to(roomId).emit("user-connected", userId);
    //socket.to(roomId).emit("user-connected", userId, userName)
    socket.broadcast.to(roomId).emit("user-connected", userId, userName);

    socket.on("message", (message) => {
      io.to(roomId).emit("createMessage", message, userName);
    });

    // When a user leaves, "user-disconnected" event is emitted to all others. 
    socket.on("disconnect", () => {
      socket.to(roomId).emit("user-disconnected", userId, userName);
    });
  });
});

// Specifying the port
server.listen(process.env.PORT || 443);