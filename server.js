const io = require("socket.io")(3000, {
   cors: {
      origin: ["https://zwolfrost.github.io", "http://localhost:8000"],
      methods: ["GET", "POST"]
   }
});

io.on("connection", socket =>
{
   socket.on("leaveroom", roomName => socket.leave(roomName))
   socket.on("joinroom", roomName => socket.join(roomName))

   function broadcastArgs(onName, emitName)
   {
      socket.on(onName, (roomName, args) => io.to(roomName).emit(emitName, args))
   }

   broadcastArgs("drawline", "drawlinebroadcast")
})