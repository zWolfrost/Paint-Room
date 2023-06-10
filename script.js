const socket = io(["https://paint-room-server.onrender.com", "http://localhost:3000"][1])

const HEADER = document.getElementById("header")
const JOINSCR = document.getElementById("joinscreen")
const JOINFIELD = document.getElementById("joinfield")
const INFOFIELD = document.getElementById("infofield")
const ROOMNAME = document.getElementById("roomname")
const JOINBTN = document.getElementById("joinbtn")

const PAINTSCR = document.getElementById("paintscreen")
const CANVAS = document.getElementById("sheet");
const CONTEXT = CANVAS.getContext("2d");

const PLAYERCOLORS = ["red", "orange", "yellow", "green", "blue", "purple"]


let roomName;
let playerColor;


socket.on("connect", () =>
{
   INFOFIELD.innerText = `Connection with server established`;
   JOINFIELD.style.display = "inline";
})
socket.on("connect_error", err => INFOFIELD.innerText = `Error: ${err.message}`);



JOINBTN.addEventListener("click", () =>
{
   roomName = ROOMNAME.value || socket.id;

   socket.emit("joinroom", roomName, [window.screen.width, window.screen.height], startPainting)
})



function startPainting(playerID=0, width=window.screen.width, height=window.screen.height)
{
   HEADER.style.display = "none";
   JOINSCR.style.display = "none";

   PAINTSCR.style.display = "inline";
   //document.querySelectorAll(".options").forEach(e => e.style.display = "block")

   CANVAS.width = width;
   CANVAS.height = height;

   CONTEXT.lineCap = "round";
   CONTEXT.lineJoin = "round";
   CONTEXT.filter = "url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxmaWx0ZXIgaWQ9ImZpbHRlciIgeD0iMCIgeT0iMCIgd2lkdGg9IjEwMCU"+
   "iIGhlaWdodD0iMTAwJSIgY29sb3ItaW50ZXJwb2xhdGlvbi1maWx0ZXJzPSJzUkdCIj48ZmVDb21wb25lbnRUcmFuc2Zlcj48ZmVGdW5jUiB0eXBlPSJpZGVudGl0eSIvPjxmZUZ1bmNHIHR5cGU9ImlkZW50aX"+
   "R5Ii8+PGZlRnVuY0IgdHlwZT0iaWRlbnRpdHkiLz48ZmVGdW5jQSB0eXBlPSJkaXNjcmV0ZSIgdGFibGVWYWx1ZXM9IjAgMSIvPjwvZmVDb21wb25lbnRUcmFuc2Zlcj48L2ZpbHRlcj48L3N2Zz4=#filter)";

   CONTEXT.putPixelData(CONTEXT.getPixelData().fill(255));

   socket.emit("savetohistory", roomName)
   saveToHistory(CONTEXT);

   playerColor = PLAYERCOLORS[playerID % PLAYERCOLORS.length]
   document.documentElement.style.setProperty("--player-color", playerColor);
}



CANVAS.addEventListener("touchstart", touchHandler, true);
CANVAS.addEventListener("touchmove", touchHandler, true);
CANVAS.addEventListener("touchend", touchHandler, true);
CANVAS.addEventListener("touchcancel", touchHandler, true);
function touchHandler(event)
{
   let touches = event.changedTouches, first = touches[0], type = "";

   switch(event.type)
   {
      case "touchstart": type = "mousedown"; break;
      case "touchmove":  type = "mousemove"; break;
      case "touchend":   type = "mouseup";   break;
      default: return;
   }

   let simulatedEvent = new MouseEvent(type,
   {
      bubbles: true,
      cancelable: true,
      screenX: first.screenX,
      screenY: first.screenY,
      clientX: first.clientX,
      clientY: first.clientY,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      button: 0,
      relatedTarget: null
   });

   first.target.dispatchEvent(simulatedEvent);
   event.preventDefault();
};



HTMLElement.prototype.animate = function(name, seconds=1, mode="ease-in-out", repetitions=1, reset=true, callback=null)
{
   if (reset == true && this.style.animationName === name)
   {
      this.style.animation = "none";
      this.offsetHeight;
      this.style.animation = "none";
   }

   this.style.animation = `${name} ${seconds}s ${mode} ${repetitions}`;

   this.addEventListener("animationend", function()
   {
      this.style.animation = "none";
      if (callback != null) callback();
   }, {once: true});
};


CanvasRenderingContext2D.prototype.getPixelData = function(begX=0, begY=0, endX=this.canvas.width, endY=this.canvas.height)
{
   return this.getImageData(begX, begY, endX - begX, endY - begY).data;
};
CanvasRenderingContext2D.prototype.putPixelData = function(pixelData, begX=0, begY=0, endX=this.canvas.width, endY=this.canvas.height, putX=begX, putY=begY)
{
   let imgData = this.getImageData(begX, begY, endX - begX, endY - begY);

   imgData.data.set(pixelData);

   this.putImageData(imgData, putX, putY);
};



let history = [0];
let cutData = {canCut: true, pixels: null, width: 0, height: 0, ctrlv: false};
let onModeChange;


document.getElementById("pencil").addEventListener("click", function()
{
   this.animate("shake", 0.25);
   document.querySelector(".selectedtop")?.classList.remove("selectedtop")
   this.classList.add("selectedtop")

   CANVAS.style.cursor = "url(assets/pencil.cur), auto";

   onModeChange?.()
   let mode = (e) => drawMode(e, getSize(), getColor());

   CANVAS.addEventListener("mousedown", mode);
   onModeChange = () => CANVAS.removeEventListener("mousedown", mode);
});
function drawMode(e, width, color)
{
   let ctx = e.target.getContext("2d");
   let mouse = {x: mousePosX(e), y: mousePosY(e)};

   function pencilSession(e)
   {
      mouse = {oldx: mouse.x, oldy: mouse.y, x: mousePosX(e), y: mousePosY(e)};

      drawLine(ctx, [mouse.oldx, mouse.oldy], [mouse.x, mouse.y], width, color)
      socket.emit("drawline", roomName, [mouse.oldx, mouse.oldy], [mouse.x, mouse.y], width, color)
   }

   pencilSession(e);

   window.addEventListener("mousemove", pencilSession);

   window.addEventListener("mouseup", () =>
   {
      window.removeEventListener("mousemove", pencilSession)

      socket.emit("savetohistory", roomName)
      saveToHistory(ctx);
   }, {once: true});
};

document.getElementById("eraser").addEventListener("click", function()
{
   this.animate("shake", 0.25);
   document.querySelector(".selectedtop")?.classList.remove("selectedtop")
   this.classList.add("selectedtop")

   CANVAS.style.cursor = "url(assets/eraser.cur), auto";

   onModeChange?.()
   let mode = (e) => eraseMode(e, "white");

   CANVAS.addEventListener("mousedown", mode);
   onModeChange = () => CANVAS.removeEventListener("mousedown", mode);
});
function eraseMode(e, color)
{
   let ctx = e.target.getContext("2d");
   let mouse = {x: mousePosX(e), y: mousePosY(e)};
   let sizeAverage = 2;

   function pencilSession(e)
   {
      mouse = {oldx: mouse.x, oldy: mouse.y, x: mousePosX(e), y: mousePosY(e)};

      let curSize = Math.abs(mouse.x - mouse.oldx + mouse.y - mouse.oldy);
      if (curSize < 1) curSize = 1;
      else if (curSize > 10) curSize = 10;

      sizeAverage = (sizeAverage * 14 + curSize) / 15;

      drawLine(ctx, [mouse.oldx, mouse.oldy], [mouse.x, mouse.y], sizeAverage*5, color, roomName)
      socket.emit("drawline", roomName, [mouse.oldx, mouse.oldy], [mouse.x, mouse.y], sizeAverage*5, color)
   }

   pencilSession(e);

   window.addEventListener("mousemove", pencilSession);

   window.addEventListener("mouseup", () =>
   {
      window.removeEventListener("mousemove", pencilSession)

      socket.emit("savetohistory", roomName)
      saveToHistory(ctx);
   }, {once: true});
};

document.getElementById("bucket").addEventListener("click", function()
{
   this.animate("shake", 0.25);
   document.querySelector(".selectedtop")?.classList.remove("selectedtop")
   this.classList.add("selectedtop")

   CANVAS.style.cursor = "url(assets/bucket.cur), auto";

   onModeChange?.()
   let mode = (e) => fillMode(e, getColor(), getTollerance());

   CANVAS.addEventListener("mousedown", mode);

   document.getElementById("tollerance").style.display = "inline"
   document.getElementById("right").style.display = "inline"

   onModeChange = () =>
   {
      CANVAS.removeEventListener("mousedown", mode);
      document.getElementById("tollerance").style.display = "none"
      document.getElementById("right").style.display = "none"
   }
});
function fillMode(e, color, tollerance)
{
   function hexToRGB(hex)
   {
      return [parseInt(hex.substring(1, 3), 16), parseInt(hex.substring(3, 5), 16), parseInt(hex.substring(5, 7), 16)];
   }

   let ctx = e.target.getContext("2d");
   let rgb = hexToRGB(color);

   socket.emit("floodfill", roomName, mousePosX(e), mousePosY(e), rgb, tollerance)
   floodFill(ctx, mousePosX(e), mousePosY(e), rgb, tollerance)

   socket.emit("savetohistory", roomName)
   saveToHistory(ctx);
};

document.getElementById("clear").addEventListener("click", function()
{
   this.animate("shake", 0.25);

   socket.emit("clear", roomName)
   clear(CONTEXT)

   socket.emit("savetohistory", roomName)
   saveToHistory(CONTEXT);
});

document.getElementById("cut").addEventListener("click", function()
{
   this.animate("shake", 0.25);
   document.querySelector(".selectedtop")?.classList.remove("selectedtop")
   this.classList.add("selectedtop")

   CANVAS.style.cursor = "crosshair";

   onModeChange?.()
   let mode = (e) => {if (cutData.canCut) cutMode(e)};

   CANVAS.addEventListener("mousedown", mode);
   onModeChange = () => CANVAS.removeEventListener("mousedown", mode);
});
function cutMode(e)
{
   let ctx = e.target.getContext("2d");
   let mouse = {begX: mousePosX(e), begY: mousePosY(e)};
   let tempPixelData = ctx.getPixelData();

   function cutSession(e)
   {
      mouse.x = mousePosX(e);
      mouse.y = mousePosY(e);

      if (mouse.x < 0) mouse.x = 0;
      else if (mouse.x > ctx.canvas.width) mouse.x = ctx.canvas.width;

      if (mouse.y < 0) mouse.y = 0;
      else if (mouse.y > ctx.canvas.height) mouse.y = ctx.canvas.height;

      ctx.putPixelData(tempPixelData);

      drawRect(ctx, [mouse.begX-1, mouse.begY-1], [mouse.x, mouse.y], 1, "black", 5);
   }

   window.addEventListener("mousemove", cutSession);


   function moveCutSession()
   {
      cutData.canCut = false;
      cutData.ctrlv = false;

      window.removeEventListener("mousemove", cutSession);

      ctx.putPixelData(tempPixelData);

      if (mouse.begX > mouse.x) [mouse.begX, mouse.x] = [++mouse.x, --mouse.begX];
      if (mouse.begY > mouse.y) [mouse.begY, mouse.y] = [++mouse.y, --mouse.begY];

      if (mouse.x == mouse.begX) mouse.x++;
      if (mouse.y == mouse.begY) mouse.y++;

      let cut = {pixels: ctx.getPixelData(mouse.begX, mouse.begY, mouse.x, mouse.y),
         begX: mouse.begX, begY: mouse.begY, endX: mouse.x, endY: mouse.y}

      drawRect(ctx, [cut.begX-1, cut.begY-1], [cut.endX, cut.endY], 1, "black", 5)


      let waitDrag = function(e)
      {
         window.removeEventListener("keydown", keyDown);

         if (mousePosX(e) > cut.begX && mousePosX(e) < cut.endX && mousePosY(e) > cut.begY && mousePosY(e) < cut.endY)
         {
            ctx.putPixelData(tempPixelData);
            ctx.putPixelData([...cut.pixels].fill(255), cut.begX, cut.begY, cut.endX, cut.endY);
            if (cutData.ctrlv == false) tempPixelData = ctx.getPixelData();

            ctx.putPixelData(cut.pixels, cut.begX, cut.begY, cut.endX, cut.endY);
            drawRect(ctx, [cut.begX-1, cut.begY-1], [cut.endX, cut.endY], 1, "black", 5);

            mouse.begX = mousePosX(e);
            mouse.begY = mousePosY(e);

            let cutMove = function(e)
            {
               mouse.x = mousePosX(e);
               mouse.y = mousePosY(e);

               cut.newBegX = cut.begX + mouse.x - mouse.begX;
               cut.newBegY = cut.begY + mouse.y - mouse.begY;
               cut.newEndX = cut.endX + mouse.x - mouse.begX;
               cut.newEndY = cut.endY + mouse.y - mouse.begY;

               ctx.putPixelData(tempPixelData);
               ctx.putPixelData(cut.pixels, cut.begX, cut.begY, cut.endX, cut.endY, cut.newBegX, cut.newBegY);

               drawRect(ctx, [cut.newBegX-1, cut.newBegY-1], [cut.newEndX, cut.newEndY], 1, "black", 5);
            }

            window.addEventListener("mousemove", cutMove);

            window.addEventListener("mouseup", function()
            {
               window.removeEventListener("mousemove", cutMove);

               if (cutData.ctrlv) socket.emit("movepixel", roomName, cutData.begX, cutData.begY, cutData.endX, cutData.endY, cut.newBegX, cut.newBegY, false)
               else socket.emit("movepixel", roomName, cut.begX, cut.begY, cut.endX, cut.endY, cut.newBegX, cut.newBegY)

               ctx.putPixelData(tempPixelData);
               ctx.putPixelData(cut.pixels, cut.begX, cut.begY, cut.endX, cut.endY, cut.newBegX, cut.newBegY);

               cutData.canCut = true;

               socket.emit("savetohistory", roomName)
               saveToHistory(ctx);
            }, {once: true});
         }

         else
         {
            ctx.putPixelData(tempPixelData);

            if (cutData.ctrlv == true)
            {
               socket.emit("movepixel", roomName, cutData.begX, cutData.begY, cutData.endX, cutData.endY, cut.newBegX, cut.newBegY, false)
               ctx.putPixelData(cut.pixels, cut.begX, cut.begY, cut.endX, cut.endY);

               socket.emit("savetohistory", roomName)
               saveToHistory(ctx);
            }

            if (mousePosX(e) >= 0 && mousePosX(e) <= e.target.width && mousePosY(e) >= 0 && mousePosY(e) <= e.target.height) cutMode(e);
            else cutData.canCut = true;
         }
      }
      window.addEventListener("mousedown", waitDrag, {once: true});


      let keyDown = function(e)
      {
         if (e.ctrlKey || e.metaKey)
         {
            switch (e.key)
            {
               case "c":
               {
                  window.removeEventListener("mousedown", waitDrag);

                  ctx.putPixelData(tempPixelData);

                  Object.assign(cutData, cut)

                  break;
               }

               case "v":
               {
                  if (cutData.pixels != undefined)
                  {
                     window.addEventListener("mousedown", waitDrag, {once: true});

                     let begX = ctx.canvas.width/2 - (cutData.endX - cutData.begX)/2;
                     let begY = ctx.canvas.height/2 - (cutData.endY - cutData.begY)/2;
                     let endX = begX + (cutData.endX - cutData.begX);
                     let endY = begY + (cutData.endY - cutData.begY);

                     ctx.putPixelData(tempPixelData);
                     ctx.putPixelData(cutData.pixels, begX, begY, endX, endY);

                     drawRect(ctx, [begX-1, begY-1], [endX, endY], 1, "black", 5);

                     cut.pixels = ctx.getPixelData(begX, begY, endX, endY);
                     cut.begX = begX;
                     cut.begY = begY;
                     cut.endX = endX;
                     cut.endY = endY;

                     cutData.ctrlv = true;
                  }

                  break;
               }
            }
         }

         else
         {
            switch (e.key)
            {
               case "Delete":
               {
                  window.removeEventListener("keydown", keyDown);
                  window.removeEventListener("mousedown", waitDrag);

                  cutData.canCut = true;

                  socket.emit("movepixel", roomName, cut.begX, cut.begY, cut.endX, cut.endY, cut.newBegX, cut.newBegY, true, false)
                  ctx.putPixelData(tempPixelData);
                  ctx.putPixelData([...cut.pixels].fill(255), cut.begX, cut.begY, cut.endX, cut.endY);

                  socket.emit("savetohistory", roomName)
                  saveToHistory(ctx);

                  break;
               }
            }
         }
      }
      window.addEventListener("keydown", keyDown);
   }

   window.addEventListener("mouseup", moveCutSession, {once: true});
};

document.getElementById("line").addEventListener("click", function()
{
   this.animate("bounce", 0.15);
   document.querySelector(".selectedtop")?.classList.remove("selectedtop")
   this.classList.add("selectedtop")

   CANVAS.style.cursor = "crosshair";

   onModeChange?.()
   let mode = (e) => lineMode(e, getSize(), getColor());

   CANVAS.addEventListener("mousedown", mode);
   onModeChange = () => CANVAS.removeEventListener("mousedown", mode);
});
function lineMode(e, width, color)
{
   let ctx = e.target.getContext("2d");
   let mouse = {begx: mousePosX(e), begy: mousePosY(e)};

   let tempData = ctx.getPixelData();

   function lineSession(e)
   {
      mouse.x = mousePosX(e);
      mouse.y = mousePosY(e);

      ctx.putPixelData(tempData);

      drawLine(ctx, [mouse.begx, mouse.begy], [mouse.x, mouse.y], width, color);
   }

   lineSession(e);

   window.addEventListener("mousemove", lineSession);

   window.addEventListener("mouseup", () =>
   {
      socket.emit("drawline", roomName, [mouse.begx, mouse.begy], [mouse.x, mouse.y], width, color)
      window.removeEventListener("mousemove", lineSession)

      socket.emit("savetohistory", roomName)
      saveToHistory(ctx);
   }, {once: true});
};

document.getElementById("square").addEventListener("click", function()
{
   this.animate("bounce", 0.15);
   document.querySelector(".selectedtop")?.classList.remove("selectedtop")
   this.classList.add("selectedtop")

   CANVAS.style.cursor = "crosshair";

   onModeChange?.()
   let mode = (e) => rectMode(e, getSize(), getColor());

   CANVAS.addEventListener("mousedown", mode);
   onModeChange = () => CANVAS.removeEventListener("mousedown", mode);
});
function rectMode(e, width, color)
{
   let ctx = e.target.getContext("2d");
   let mouse = {begx: mousePosX(e), begy: mousePosY(e)};

   let tempData = ctx.getPixelData();

   function rectSession(e)
   {
      mouse.x = mousePosX(e);
      mouse.y = mousePosY(e);

      ctx.putPixelData(tempData);

      drawRect(ctx, [mouse.begx, mouse.begy], [mouse.x, mouse.y], width, color);
   }

   rectSession(e);

   window.addEventListener("mousemove", rectSession);

   window.addEventListener("mouseup", () =>
   {
      socket.emit("drawrect", roomName, [mouse.begx, mouse.begy], [mouse.x, mouse.y], width, color)
      window.removeEventListener("mousemove", rectSession)

      socket.emit("savetohistory", roomName)
      saveToHistory(ctx);
   }, {once: true});
};

document.getElementById("circle").addEventListener("click", function()
{
   this.animate("bounce", 0.15);
   document.querySelector(".selectedtop")?.classList.remove("selectedtop")
   this.classList.add("selectedtop")

   CANVAS.style.cursor = "crosshair";

   onModeChange?.()
   let mode = (e) => ellipseMode(e, getSize(), getColor());

   CANVAS.addEventListener("mousedown", mode);
   onModeChange = () => CANVAS.removeEventListener("mousedown", mode);
});
function ellipseMode(e, width, color)
{
   let ctx = e.target.getContext("2d");
   let mouse = {begx: mousePosX(e), begy: mousePosY(e)};
   let center, radius;

   let tempData = ctx.getPixelData();

   function ellipseSession(e)
   {
      mouse.x = mousePosX(e);
      mouse.y = mousePosY(e);

      ctx.putPixelData(tempData);

      center = [mouse.begx + (mouse.x - mouse.begx)/2, mouse.begy + (mouse.y - mouse.begy)/2];
      radius = [Math.abs(mouse.x - mouse.begx)/2, Math.abs(mouse.y - mouse.begy)/2];
      drawEllipse(ctx, center, radius, width, color)
   }

   ellipseSession(e);

   window.addEventListener("mousemove", ellipseSession);

   window.addEventListener("mouseup", () =>
   {
      socket.emit("drawellipse", roomName, center, radius, width, color)
      window.removeEventListener("mousemove", ellipseSession)

      socket.emit("savetohistory", roomName)
      saveToHistory(ctx);
   }, {once: true});
};

document.getElementById("text").addEventListener("click", function()
{
   this.animate("bounce", 0.15);
   document.querySelector(".selectedtop")?.classList.remove("selectedtop")
   this.classList.add("selectedtop")

   CANVAS.style.cursor = "text";

   onModeChange?.()
   let mode = (e) => textMode(e, getSize(), getColor());

   CANVAS.addEventListener("mousedown", mode);
   onModeChange = () => CANVAS.removeEventListener("mousedown", mode);
});
function textMode(e, size, color)
{
   let ctx = e.target.getContext("2d");

   const INPUT = document.createElement("input")
   PAINTSCR.append(INPUT)
   INPUT.id = "drawtextinput";


   const fontSize = size*3 + 20;
   const font = "monospace";

   const begX = mousePosX(e)
   const begY = mousePosY(e);


   INPUT.style.display = "inline";
   INPUT.style.fontSize = `${fontSize}px`
   INPUT.style.color = color

   INPUT.style.left = e.target.offsetLeft + e.target.clientLeft + begX
   INPUT.style.top = e.target.offsetTop + e.target.clientTop + begY-(INPUT.offsetHeight/2)


   function txtInput(e)
   {
      if (e.code === "Enter")
      {
         INPUT.style.display = "none";
         //INPUT.removeEventListener("keydown", txtInput);

         if (INPUT.value == "") return;


         let tempPixelData = ctx.getPixelData();

         ctx.font = `${fontSize}px ${font}`;


         socket.emit("drawtext", roomName, INPUT.value, begX+4, begY+(fontSize/3), fontSize, color, font)

         ctx.putPixelData(tempPixelData);
         drawText(ctx, INPUT.value, begX+4, begY+(fontSize/3), fontSize, color, font);

         socket.emit("savetohistory", roomName)
         saveToHistory(ctx);


         INPUT.remove()
      }
   }
   INPUT.addEventListener("keydown", txtInput);


   let dynamicInput = () => INPUT.style.width = `calc(${INPUT.value.length}ch + 7px)`
   INPUT.addEventListener("input", dynamicInput)


   window.addEventListener("mouseup", () =>
   {
      INPUT.focus()
      e.target.addEventListener("mousedown", () => INPUT.remove(), {once: true});
   }, {once: true})
};

document.getElementById("save").addEventListener("click", function()
{
   let option = this.value.slice(0, -1);
   let id = this.value.slice(-1);
   this.value = "0";

   switch (option)
   {
      case "save":
      {
         socket.emit("save_events", roomName, id)

         setSaveAvailability(id, true)
         break;
      }

      case "load":
      {
         socket.emit("load_events", id)
         break;
      }

      case "clear":
      {
         socket.emit("delete_events")

         setAvailableSaves()
         break;
      }

      case "download":
      {
         const link = document.createElement("a");

         link.download = "canvas.png";
         link.href = CANVAS.toDataURL("image/png");

         link.click();

         break;
      }

      case "upload":
      {
         function uploadImage(ctx, imgsrc)
         {
            let img = new Image();

            img.onload = function()
            {
               ctx.putPixelData(ctx.getPixelData().fill(255));

               let scale = Math.min(ctx.canvas.width/img.width, ctx.canvas.height/img.height)
               ctx.drawImage(img, 0, 0, img.width * scale, img.height * scale);

               saveToHistory(ctx);
            };

            img.src = URL.createObjectURL(imgsrc);
         };

         const UPLOADIMG = document.getElementById("uploadimg")

         UPLOADIMG.click();

         UPLOADIMG.addEventListener("change", function()
         {
            uploadImage(CONTEXT, this.files[0]);
            this.value = "";
         }, {once: true});

         break;
      }
   }

   //checkStorage(["canvas1data", "canvas2data", "canvas3data"], [LOAD1, LOAD2, LOAD3]);
});
document.getElementById("undo").addEventListener("click", function()
{
   if (history[0] >= 2)
   {
      this.animate("left", 0.15);

      socket.emit("undo", roomName, CONTEXT)
      undoHistory(CONTEXT, false);
   }
   else this.animate("bigShake", 0.2);
});
document.getElementById("redo").addEventListener("click", function()
{
   if (history[0] < history.length - 1)
   {
      this.animate("right", 0.15);

      socket.emit("redo", roomName, CONTEXT)
      redoHistory(CONTEXT, false);
   }
   else this.animate("bigShake", 0.2);
});

document.querySelectorAll(".colorbtn").forEach(color => color.addEventListener("click", function()
{
   document.querySelector(".selectedbottom")?.classList.remove("selectedbottom")
   color.classList.add("selectedbottom")

   color.animate("bounce", 0.15);
}));
document.getElementById("sizebar").addEventListener("input", function()
{
   const SIZECOUNT = document.getElementById("sizecount");

   SIZECOUNT.style.display = "inline";
   SIZECOUNT.innerText = this.value;

   SIZECOUNT.style.fontSize = (+this.value * 0.8) + 10 + "px";

   SIZECOUNT.style.left = -59 + this.value*16 + this.offsetLeft + this.clientLeft
   SIZECOUNT.style.top = -30 - this.value*0.8 + this.offsetTop + this.clientTop + "px";

   this.addEventListener("mouseup", () => SIZECOUNT.style.display = "none", {once: true});
});
document.getElementById("tollerancebar").addEventListener("input", function()
{
   const TOLLERANCECOUNT = document.getElementById("tollerancecount");

   TOLLERANCECOUNT.style.display = "inline";
   TOLLERANCECOUNT.innerText = this.value;

   TOLLERANCECOUNT.style.left = -43 + this.value*2.88 + this.offsetLeft + this.clientLeft
   TOLLERANCECOUNT.style.top = 30 + this.offsetTop + this.clientTop + "px";

   document.documentElement.style.setProperty("--tollerance-gradient", 100/this.max*this.value + "%");

   this.addEventListener("mouseup", () => TOLLERANCECOUNT.style.display = "none", {once: true});
});
document.getElementById("colorpicker").addEventListener("input", function()
{
   this.classList.remove("transparent")
}, {once: true});


window.addEventListener("keydown", function(e)
{
   if (e.ctrlKey || e.metaKey)
   {
      switch (e.key)
      {
         case "z":
         {
            document.getElementById("undo").click()

            break;
         }

         case "y":
         {
            document.getElementById("redo").click()

            break;
         }
      }
   }
});



socket.on("drawline_broadcast", (...args) => drawLine(CONTEXT, ...args))
function drawLine(ctx, begpoints, endpoints, width=2, color="black")
{
   ctx.beginPath();

   ctx.strokeStyle = color;
   ctx.lineWidth = width;

   ctx.moveTo(begpoints[0], begpoints[1]);
   ctx.lineTo(endpoints[0], endpoints[1]);
   ctx.stroke();

   ctx.closePath();
}
socket.on("drawrect_broadcast", (...args) => drawRect(CONTEXT, ...args))
function drawRect(ctx, begpoints, endpoints, width=2, color="black", ...linedash)
{
   ctx.beginPath();

   ctx.strokeStyle = color;
   ctx.lineWidth = width;
   ctx.setLineDash(linedash);

   ctx.rect(begpoints[0], begpoints[1], endpoints[0] - begpoints[0], endpoints[1] - begpoints[1]);
   ctx.stroke();

   ctx.closePath();

   ctx.setLineDash([]);
}
socket.on("drawellipse_broadcast", (...args) => drawEllipse(CONTEXT, ...args))
function drawEllipse(ctx, center, radius, width=2, color="black")
{
   ctx.beginPath();

   ctx.strokeStyle = color;
   ctx.lineWidth = width;
   ctx.setLineDash([]);

   ctx.ellipse(center[0], center[1], radius[0], radius[1], Math.PI * 2, 0, Math.PI * 2);
   ctx.stroke();

   ctx.closePath();
}
socket.on("drawtext_broadcast", (...args) => drawText(CONTEXT, ...args))
function drawText(ctx, text, x, y, fontSize=20, color="black", font="arial")
{
   let tempFilter = ctx.filter;
   ctx.filter = "none";

   ctx.font = `${fontSize}px ${font}`;
   ctx.fillStyle = color;
   ctx.fillText(text, x, y);

   ctx.filter = tempFilter;
}


socket.on("floodfill_broadcast", (...args) => floodFill(CONTEXT, ...args))
function floodFill(ctx, startX, startY, newRGB, tollerance=0)
{
   function substitute(data, sub = [], index = 0)
   {
      for (let i=0; i<sub.length; i++) data[index+i] = sub[i];
   };
   function matchesSubAt(data, sub = [], index = 0, tollerance = 0)
   {
      for (let i=0; i<sub.length; i++) if (Math.abs(data[index+i] - sub[i]) > tollerance) return false;
      return true;
   };

   let width = ctx.canvas.width;
   let height = ctx.canvas.height;
   let widthIndex = width * 4;

   let imgData = ctx.getPixelData();

   let startIndex = (startX + startY * width) * 4;

   let startRGB = imgData.slice(startIndex, startIndex + 3);

   let pixelStack = [[startX, startY]];
   let pixelCords, pixelInd, x, y;
   let reachLeft, reachRight;

   while(pixelStack.length)
   {
      pixelCords = pixelStack.pop();

      x = pixelCords[0];
      y = pixelCords[1];

      pixelInd = (x + y * width) * 4;

      while(y >= 0 && matchesSubAt(imgData, startRGB, pixelInd, tollerance))
      {
         y--;
         pixelInd -= widthIndex;
      }

      pixelInd += widthIndex;
      y++;

      reachLeft = false;
      reachRight = false;

      do
      {
         substitute(imgData, newRGB, pixelInd);

         if (x > 0)
         {
            if (matchesSubAt(imgData, startRGB, pixelInd - 4, tollerance) && matchesSubAt(imgData, newRGB, pixelInd - 4) == false)
            {
               if (!reachLeft)
               {
                  pixelStack.push([x - 1, y]);
                  reachLeft = true;
               }
            }

            else if (reachLeft) reachLeft = false;
         }

         if (x < width-1)
         {
            if (matchesSubAt(imgData, startRGB, pixelInd + 4, tollerance) && matchesSubAt(imgData, newRGB, pixelInd + 4) == false)
            {
               if (!reachRight)
               {
                  pixelStack.push([x + 1, y]);
                  reachRight = true;
               }
            }

            else if (reachRight) reachRight = false;
         }

         pixelInd += widthIndex;
      } while (y++ <= height-1 && matchesSubAt(imgData, startRGB, pixelInd, tollerance));
   }

   ctx.putPixelData(imgData);
}
socket.on("clear_broadcast", () => clear(CONTEXT))
function clear(ctx)
{
   ctx.putPixelData(ctx.getPixelData().fill(255));
}
socket.on("movepixel_broadcast", (...args) => movePixelData(CONTEXT, ...args))
function movePixelData(ctx, begX, begY, endX, endY, putX, putY, delsource=true, keepend=true)
{
   console.log(begX, begY, endX, endY, putX, putY, delsource, keepend)

   let pixelData = ctx.getPixelData(begX, begY, endX, endY)
   if (delsource) ctx.putPixelData([...pixelData].fill(255), begX, begY, endX, endY);
   if (keepend) ctx.putPixelData(pixelData, begX, begY, endX, endY, putX, putY);
}


socket.on("savetohistory_broadcast", () => saveToHistory(CONTEXT))
function saveToHistory(ctx)
{
   history = history.slice(0, ++history[0]);
   history.push({pixels: ctx.getPixelData(), width: ctx.canvas.width, height: ctx.canvas.height});
}
socket.on("undo_broadcast", () => undoHistory(CONTEXT))
function undoHistory(ctx, safe=true)
{
   if (safe == false || history[0] >= 2)
   {
      let prevSave = history[--history[0]];

      ctx.putPixelData(prevSave.pixels, 0, 0, prevSave.width, prevSave.height);
   }
}
socket.on("redo_broadcast", () => redoHistory(CONTEXT))
function redoHistory(ctx, safe=true)
{
   if (safe == false || history[0] < history.length-1)
   {
      let succSave = history[++history[0]];

      ctx.putPixelData(succSave.pixels, 0, 0, succSave.width, succSave.height);
   }
}


socket.emit("getavailablesaves", setAvailableSaves)
function setAvailableSaves(ids = [])
{
   const totalSaves = 3
   for (let i=0; i<totalSaves; i++) setSaveAvailability(i, false)
   for (i of ids) setSaveAvailability(i, true)
}
function setSaveAvailability(id, available)
{
   document.querySelector(`#save option[value="load${id}"]`).disabled = !available
}


function mousePosX(e, obj=CANVAS)
{
   return e.pageX - obj.offsetLeft - obj.clientLeft
}
function mousePosY(e, obj=CANVAS)
{
   return e.pageY - obj.offsetTop - obj.clientTop
}


function getColor()
{
   return document.querySelector(".selectedbottom").value
}
function getSize()
{
   return document.getElementById("sizebar").value;
}
function getTollerance()
{
   return document.getElementById("tollerancebar").value;
}



window.addEventListener("mousemove", e => socket.emit("mousemove", roomName, mousePosX(e), mousePosY(e), playerColor))
socket.on("mousemove_broadcast", (mouseX, mouseY, playerColor) =>
{
   const width = 16;

   let pointer = document.querySelector(`.${playerColor}`)

   if (pointer == undefined)
   {
      pointer = document.createElement("img")
      pointer.src = "pointer.png"
      pointer.width = width
      pointer.classList.add("pointer", playerColor)
      PAINTSCR.append(pointer)
   }

   pointer.style.left = mouseX - width/2 + CANVAS.offsetLeft + CANVAS.clientLeft + "px"
   pointer.style.top = mouseY - width/2 + CANVAS.offsetTop + CANVAS.clientTop + "px"
})