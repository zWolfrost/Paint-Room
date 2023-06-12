const io = require("socket.io")(3000, { maxHttpBufferSize: 1e7, cors: { origin: ["https://zwolfrost.github.io", "http://localhost:8000"], methods: ["GET", "POST"] } });


let events = {}


io.on("connection", socket =>
{
   socket.on("disconnect", () =>
   {
      for (roomName of Object.keys(events))
      {
         if (io.sockets.adapter.rooms.get(roomName) === undefined)
         {
            delete events[roomName]
         }
         else
         {
            //send disconnection?
         }
      }
   })
   socket.on("joinroom", (roomName, size, startPainting) =>
   {
      let playerID = io.sockets.adapter.rooms.get(roomName)?.size ?? 0

      socket.join(roomName)

      if (roomName in events == false)
      {
         events[roomName] = [size]
         startPainting(playerID, ...size)
      }
      else startPainting(playerID, ...events[roomName][0])


      for (e of events[roomName].slice(1)) socket.emit(e[0], ...e.slice(1))
   })


   socket.on("save_events", (roomName, id) =>
   {
      const ip = socket.handshake.address
      const fs = require("fs");

      let eventsjson = JSON.parse(fs.readFileSync("events.json"))

      if (ip in eventsjson == false) eventsjson[ip] = []
      eventsjson[ip][id] = events[roomName];

      fs.writeFileSync("events.json", JSON.stringify(eventsjson));
   })
   socket.on("load_events", (roomName, id) =>
   {
      const ip = socket.handshake.address
      const fs = require("fs");

      let eventsjson = JSON.parse(fs.readFileSync("events.json"))

      for (e of eventsjson[ip][id].slice(1))
      {
         events[roomName].push(e)
         io.to(roomName).emit(e[0], ...e.slice(1))
      }
   })
   socket.on("delete_events", () =>
   {
      const ip = socket.handshake.address
      const fs = require("fs");

      let eventsjson = JSON.parse(fs.readFileSync("events.json"))

      eventsjson[ip] = []

      fs.writeFileSync("events.json", JSON.stringify(eventsjson));
   })
   socket.on("getavailablesaves", (setAvailableSaves) =>
   {
      const ip = socket.handshake.address
      const fs = require("fs");

      let eventsjson = JSON.parse(fs.readFileSync("events.json"))
      let availableSaves = []

      for (eventid in eventsjson[ip]) availableSaves.push(+eventid)

      setAvailableSaves(availableSaves)
   })


   function bcEvent(onEvent, emitEvent=onEvent+"_broadcast", saveToEvents=true)
   {
      socket.on(onEvent, function(roomName, ...args)
      {
         if (saveToEvents) events[roomName]?.push([emitEvent, ...args])

         socket.broadcast.to(roomName).emit(emitEvent, ...args)
      })
   }

   bcEvent("drawline")
   bcEvent("drawrect")
   bcEvent("drawellipse")
   bcEvent("drawtext")

   bcEvent("floodfill")
   bcEvent("clear")
   bcEvent("movepixel")
   bcEvent("uploadimage")

   bcEvent("savetohistory")
   bcEvent("undo")
   bcEvent("redo")

   bcEvent("mousemove", "mousemove_broadcast", false)
})