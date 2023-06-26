const io = require("socket.io")(3000, { maxHttpBufferSize: 1e7, cors: { origin: ["https://zwolfrost.github.io", "http://localhost:8000"], methods: ["GET", "POST"] } });


let paintrooms = {}


function addSocketID(id, roomName)
{
   let indexOfSocket = paintrooms[roomName].players.indexOf(id)

   if (indexOfSocket !== -1) return indexOfSocket
   else
   {
      indexOfSocket = paintrooms[roomName].players.indexOf(null)

      if (indexOfSocket !== -1)
      {
         paintrooms[roomName].players[indexOfSocket] = id
         return indexOfSocket
      }
      else
      {
         paintrooms[roomName].players.push(id)
         return paintrooms[roomName].players.length - 1
      }
   }
}
function removeSocketID(id, roomName)
{
   let indexOfSocket = paintrooms[roomName].players.indexOf(id)
   paintrooms[roomName].players[indexOfSocket] = null

   return indexOfSocket
}
function getPlayerIDs(roomName)
{
   let players = paintrooms[roomName].players;

   let playerIDs = [];
   for (let i=0; i<players.length; i++)
   {
      if (players[i] !== null) playerIDs.push(i)
   }

   return playerIDs
}


io.on("connection", (socket) =>
{
   socket.on("disconnecting", () =>
   {
      let rooms = Array.from(socket.rooms)

      if (rooms.length >= 2)
      {
         let roomName = rooms.pop();

         if (getPlayerIDs(roomName).length == 1)
         {
            delete paintrooms[roomName]
         }
         else
         {
            removeSocketID(socket.id, roomName)
            io.to(roomName).emit("playerids", getPlayerIDs(roomName))
         }
      }
   })
   socket.on("joinroom", (roomName, resolution, startPainting) =>
   {
      socket.join(roomName)

      if (roomName in paintrooms == false)
      {
         paintrooms[roomName] = {
            resolution: resolution,
            players: [],
            events: []
         }
      }

      startPainting(addSocketID(socket.id, roomName), paintrooms[roomName].resolution)

      io.to(roomName).emit("playerids", getPlayerIDs(roomName))

      for (e of paintrooms[roomName].events) socket.emit(...e)
   })


   socket.on("save_events", (roomName, id) =>
   {
      const ip = socket.handshake.address
      const fs = require("fs");

      let eventsjson = JSON.parse(fs.readFileSync("events.json"))

      if (ip in eventsjson == false) eventsjson[ip] = []
      eventsjson[ip][id] = paintrooms[roomName].events;

      fs.writeFileSync("events.json", JSON.stringify(eventsjson));
   })
   socket.on("load_events", (roomName, id) =>
   {
      const ip = socket.handshake.address
      const fs = require("fs");

      let eventsjson = JSON.parse(fs.readFileSync("events.json"))

      for (e of eventsjson[ip][id])
      {
         paintrooms[roomName].events.push(e)
         io.to(roomName).emit(...e)
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
         if (saveToEvents) paintrooms[roomName].events.push([emitEvent, ...args])

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