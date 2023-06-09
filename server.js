const io = require("socket.io")(3000, { cors: { origin: ["https://zwolfrost.github.io", "http://localhost:8000"], methods: ["GET", "POST"] } });


let events = {}


io.on("connection", socket =>
{
   socket.on("disconnect", () =>
   {
      for (roomName of Object.keys(events))
      {
         if (io.sockets.adapter.rooms[roomName] === undefined)
         {
            delete events[roomName]
         }
      }
   })

   socket.on("joinroom", (roomName, size, startPainting) =>
   {
      socket.join(roomName)

      if (roomName in events == false)
      {
         events[roomName] = [size]
         startPainting(...size)
      }
      else startPainting(...events[roomName][0])


      for (e of events[roomName].slice(1)) socket.emit(e[0], ...e.slice(1))
   })

   function broadcastEvent(onEvent, emitEvent=onEvent+"_broadcast")
   {
      socket.on(onEvent, function(roomName, ...args)
      {
         events[roomName].push([emitEvent, ...args])

         socket.broadcast.to(roomName).emit(emitEvent, ...args)
      })
   }

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