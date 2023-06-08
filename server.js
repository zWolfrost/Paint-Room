const io = require("socket.io")(3000, { cors: { origin: ["https://zwolfrost.github.io", "http://localhost:8000"], methods: ["GET", "POST"] } });



io.on("connection", socket =>
{
   socket.on("leaveroom", roomName => socket.leave(roomName))
   socket.on("joinroom", roomName => socket.join(roomName))

   let broadcastEvent = (onEvent, emitEvent=onEvent+"_broadcast") => socket.on(onEvent, (roomName, ...args) => socket.broadcast.to(roomName).emit(emitEvent, ...args))

   broadcastEvent("drawline")
   broadcastEvent("drawrect")
   broadcastEvent("drawellipse")
   broadcastEvent("drawtext")

   broadcastEvent("floodfill")
   broadcastEvent("clear")
   broadcastEvent("movepixel")

   broadcastEvent("savetohistory")
   broadcastEvent("undo")
   broadcastEvent("redo")
})