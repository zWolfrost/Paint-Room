const HEADER = document.getElementById("header")
const JOINSCR = document.getElementById("joinscreen")
const JOINFIELD = document.getElementById("joinfield")
const INFOFIELD = document.getElementById("infofield")
const ROOMNAME = document.getElementById("roomname")
const JOINBTN = document.getElementById("joinbtn")

const PAINTSCR = document.getElementById("paintscreen")
const CANVAS = document.getElementById("sheet");
const CONTEXT = CANVAS.getContext("2d");
const TOOLSTOP = document.querySelector(".tools.top")
const TOOLSBOT = document.querySelector(".tools.bottom")

const socket = io(["https://paint-room-server.onrender.com", "http://localhost:3000"][1])


let roomName;


socket.on("connect", () =>
{
   INFOFIELD.innerText = `Connection with server established`;
   JOINFIELD.style.display = "inline";
})
socket.on("connect_error", err => INFOFIELD.innerText = `Error: ${err.message}`);



JOINBTN.addEventListener("click", () =>
{
   socket.emit("leaveroom", roomName)

   roomName = ROOMNAME.value;

   if (roomName !== "") socket.emit("joinroom", roomName)

   startPainting()
})



function startPainting()
{
   HEADER.style.display = "none";
   JOINSCR.style.display = "none";

   PAINTSCR.style.display = "inline";
   TOOLSTOP.style.display = "inline";
   TOOLSBOT.style.display = "inline";
   
   CANVAS.width = window.screen.width;
   CANVAS.height = window.screen.height;

   CONTEXT.lineCap = "round";
   CONTEXT.lineJoin = "round";
   CONTEXT.filter = "url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxmaWx0ZXIgaWQ9ImZpbHRlciIgeD0iMCIgeT0iMCIgd2lkdGg9IjEwMCU"+
   "iIGhlaWdodD0iMTAwJSIgY29sb3ItaW50ZXJwb2xhdGlvbi1maWx0ZXJzPSJzUkdCIj48ZmVDb21wb25lbnRUcmFuc2Zlcj48ZmVGdW5jUiB0eXBlPSJpZGVudGl0eSIvPjxmZUZ1bmNHIHR5cGU9ImlkZW50aX"+
   "R5Ii8+PGZlRnVuY0IgdHlwZT0iaWRlbnRpdHkiLz48ZmVGdW5jQSB0eXBlPSJkaXNjcmV0ZSIgdGFibGVWYWx1ZXM9IjAgMSIvPjwvZmVDb21wb25lbnRUcmFuc2Zlcj48L2ZpbHRlcj48L3N2Zz4=#filter)";

   CONTEXT.putPixelData(CONTEXT.getPixelData().fill(255));

   socket.emit("savetohistory", roomName)
   saveToHistory(CONTEXT);
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
let opt = {fun: null, color: "black", width: 3};


document.getElementById("pencil").addEventListener("click", function()
{
   this.animate("shake", 0.25);
   document.querySelector(".selectedtop")?.classList.remove("selectedtop")
   this.classList.add("selectedtop")

   CANVAS.style.cursor = "url(assets/pencil.cur), auto";

   CANVAS.removeEventListener("mousedown", opt.fun);

   opt.fun = () => drawMode(CONTEXT, opt.width, opt.color);

   CANVAS.addEventListener("mousedown", opt.fun);
});
function drawMode(ctx, width, color)
{
   let mouse = {x: window.event.x, y: window.event.y};

   let pencilSession = function()
   {
      mouse = {oldx: mouse.x, oldy: mouse.y, x: window.event.x, y: window.event.y};

      drawLine(ctx, [mouse.oldx, mouse.oldy], [mouse.x, mouse.y], width, color)
      socket.emit("drawline", roomName, [mouse.oldx, mouse.oldy], [mouse.x, mouse.y], width, color)
   }

   pencilSession();

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

   CANVAS.removeEventListener("mousedown", opt.fun);

   opt.fun = () => eraseMode(CONTEXT, "white");

   CANVAS.addEventListener("mousedown", opt.fun);
});
function eraseMode(ctx, color)
{
   let mouse = {x: window.event.x, y: window.event.y};
   let sizeAverage = 2;

   let pencilSession = function()
   {
      mouse = {oldx: mouse.x, oldy: mouse.y, x: window.event.x, y: window.event.y};

      let curSize = Math.abs(mouse.x - mouse.oldx + mouse.y - mouse.oldy);
      if (curSize < 1) curSize = 1;
      else if (curSize > 10) curSize = 10;

      sizeAverage = (sizeAverage * 14 + curSize) / 15;

      drawLine(ctx, [mouse.oldx, mouse.oldy], [mouse.x, mouse.y], sizeAverage*5, color, roomName)
      socket.emit("drawline", roomName, [mouse.oldx, mouse.oldy], [mouse.x, mouse.y], sizeAverage*5, color)
   }

   pencilSession();

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

   CANVAS.removeEventListener("mousedown", opt.fun);

   opt.fun = () => fillMode(CANVAS, opt.color, 0);

   CANVAS.addEventListener("mousedown", opt.fun);
});
function fillMode(canvas, color, tollerance)
{
   const COLORSRGB =
   {
      "red":    [255, 0,   0  ],
      "orange": [255, 165, 0  ],
      "yellow": [255, 255, 0  ],
      "green":  [0,   128, 0  ],
      "blue":   [0,   0,   255],
      "purple": [128, 0,   128],
      "gray":   [128, 128, 128],
      "brown":  [165, 42,  42 ],
      "black":  [0,   0,   0  ],
      "white":  [255, 255, 255],
   };

   let ctx = canvas.getContext("2d");
   let rgb = color[0] == "#" ? hexToRGB(color) : COLORSRGB[color];

   socket.emit("floodfill", roomName, window.event.x, window.event.y, rgb, tollerance)
   floodFill(ctx, window.event.x, window.event.y, rgb, tollerance, roomName)

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

   CANVAS.removeEventListener("mousedown", opt.fun);

   opt.fun = () => {if (cutData.canCut) cutMode(CANVAS)};

   CANVAS.addEventListener("mousedown", opt.fun);
});
function cutMode(canvas)
{
   let ctx = canvas.getContext("2d");
   let mouse = {begX: window.event.x, begY: window.event.y};
   let tempPixelData = ctx.getPixelData();

   let cutSession = function()
   {
      mouse.x = window.event.x;
      mouse.y = window.event.y;

      ctx.putPixelData(tempPixelData);

      drawRect(ctx, [mouse.begX-1, mouse.begY-1], [mouse.x, mouse.y], 1, "black", 5);
   }

   window.addEventListener("mousemove", cutSession);


   let moveCutSession = function()
   {
      cutData.canCut = false;
      cutData.ctrlv = false;

      window.removeEventListener("mousemove", cutSession);

      ctx.putPixelData(tempPixelData);

      if (mouse.x == mouse.begX) mouse.x++;
      if (mouse.y == mouse.begY) mouse.y++;

      if (mouse.begX > mouse.x) [mouse.begX, mouse.x] = [++mouse.x, --mouse.begX];
      if (mouse.begY > mouse.y) [mouse.begY, mouse.y] = [++mouse.y, --mouse.begY];

      let cut = {pixels: ctx.getPixelData(mouse.begX, mouse.begY, mouse.x, mouse.y),
         begX: mouse.begX, begY: mouse.begY, endX: mouse.x, endY: mouse.y}

      drawRect(ctx, [cut.begX-1, cut.begY-1], [cut.endX, cut.endY], 1, "black", 5)

      let waitDrag = function()
      {
         window.removeEventListener("keydown", keyDown);

         if (window.event.x > cut.begX && window.event.x < cut.endX && window.event.y > cut.begY && window.event.y < cut.endY)
         {
            ctx.putPixelData(tempPixelData);
            ctx.putPixelData([...cut.pixels].fill(255), cut.begX, cut.begY, cut.endX, cut.endY);
            if (cutData.ctrlv == false) tempPixelData = ctx.getPixelData();

            ctx.putPixelData(cut.pixels, cut.begX, cut.begY, cut.endX, cut.endY);
            drawRect(ctx, [cut.begX-1, cut.begY-1], [cut.endX, cut.endY], 1, "black", 5);

            mouse.begX = window.event.x;
            mouse.begY = window.event.y;

            let cutMove = function()
            {
               mouse.x = window.event.x;
               mouse.y = window.event.y;

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

               socket.emit("movepixel", roomName, cut.begX, cut.begY, cut.endX, cut.endY, cut.newBegX, cut.newBegY)
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
               ctx.putPixelData(cut.pixels, cut.begX, cut.begY, cut.endX, cut.endY);

               socket.emit("savetohistory", roomName)
               saveToHistory(ctx);
            }

            if (window.event.x >= 0 && window.event.x <= canvas.width && window.event.y >= 0 && window.event.y <= canvas.height) cutMode(canvas);
            else cutData.canCut = true;
         }
      }

      let keyDown = function(e)
      {
         if (e.ctrlKey || e.metaKey)
         {
            switch (e.key)
            {
               case "c":
               {
                  ctx.putPixelData(tempPixelData);

                  cutData.pixels = cut.pixels;
                  cutData.width = cut.endX - cut.begX;
                  cutData.height = cut.endY - cut.begY;

                  break;
               }

               case "v":
               {
                  ctx.putPixelData(tempPixelData);
                  ctx.putPixelData(cutData.pixels, 0, 0, cutData.width, cutData.height);

                  cut.pixels = ctx.getPixelData(0, 0, cutData.width, cutData.height);
                  cut.begX = 0;
                  cut.begY = 0;
                  cut.endX = cutData.width;
                  cut.endY = cutData.height;

                  drawRect(ctx, [0, 0], [cutData.width, cutData.height], 1, "black", 5);

                  cutData.ctrlv = true;

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

                  ctx.putPixelData(tempPixelData);
                  ctx.putPixelData([...cut.pixels].fill(255), cut.begX, cut.begY, cut.endX, cut.endY);

                  cutData.canCut = true;

                  socket.emit("savetohistory", roomName)
                  saveToHistory(ctx);

                  break;
               }
            }
         }
      }

      window.addEventListener("mousedown", waitDrag, {once: true});

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

   CANVAS.removeEventListener("mousedown", opt.fun);

   opt.fun = () => lineMode(CANVAS, opt.width, opt.color);

   CANVAS.addEventListener("mousedown", opt.fun);
});
function lineMode(canvas, width, color)
{
   let ctx = canvas.getContext("2d");
   let mouse = {begx: window.event.x, begy: window.event.y};

   let tempData = ctx.getPixelData();

   let lineSession = function()
   {
      mouse.x = window.event.x;
      mouse.y = window.event.y;

      ctx.putPixelData(tempData);

      drawLine(ctx, [mouse.begx, mouse.begy], [mouse.x, mouse.y], width, color);
   }

   lineSession();

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

   CANVAS.removeEventListener("mousedown", opt.fun);

   opt.fun = () => rectMode(CANVAS, opt.width, opt.color);

   CANVAS.addEventListener("mousedown", opt.fun);
});
function rectMode(canvas, width, color)
{
   let ctx = canvas.getContext("2d");
   let mouse = {begx: window.event.x, begy: window.event.y};

   let tempData = ctx.getPixelData();

   let rectSession = function()
   {
      mouse.x = window.event.x;
      mouse.y = window.event.y;

      ctx.putPixelData(tempData);

      drawRect(ctx, [mouse.begx, mouse.begy], [mouse.x, mouse.y], width, color);
   }

   rectSession();

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

   CANVAS.removeEventListener("mousedown", opt.fun);

   opt.fun = () => ellipseMode(CANVAS, opt.width, opt.color);

   CANVAS.addEventListener("mousedown", opt.fun);
});
function ellipseMode(canvas, width, color)
{
   let ctx = canvas.getContext("2d");
   let mouse = {begx: window.event.x, begy: window.event.y};
   let center, radius;

   let tempData = ctx.getPixelData();

   let ellipseSession = function()
   {
      mouse.x = window.event.x;
      mouse.y = window.event.y;

      ctx.putPixelData(tempData);

      center = [mouse.begx + (mouse.x - mouse.begx)/2, mouse.begy + (mouse.y - mouse.begy)/2];
      radius = [Math.abs(mouse.x - mouse.begx)/2, Math.abs(mouse.y - mouse.begy)/2];
      drawEllipse(ctx, center, radius, width, color)
   }

   ellipseSession();

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

   CANVAS.removeEventListener("mousedown", opt.fun);

   opt.fun = () => textMode(CANVAS, opt.width, opt.color);

   CANVAS.addEventListener("mousedown", opt.fun);
});
function textMode(canvas, size, color)
{
   let ctx = canvas.getContext("2d");

   const INPUT = document.createElement("input")
   PAINTSCR.append(INPUT)
   INPUT.id = "drawtextinput";


   const fontSize = (Math.log(size) / Math.log(1.05)) + 16;
   const font = "monospace";

   const begX = window.event.x
   const begY = window.event.y;


   INPUT.style.display = "inline";
   INPUT.style.fontSize = `${fontSize}px`

   INPUT.style.margin = `${begY-(INPUT.offsetHeight/2)}px 0px 0px ${begX}px`


   let txtInput = function()
   {
      if (window.event.code === "Enter")
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
      window.addEventListener("mousedown", () => INPUT.remove(), {once: true});
   }, {once: true})
};


document.getElementById("save").addEventListener("click", function()
{
   this.animate("shake", 0.25);

   const link = document.createElement("a");

   link.download = "canvas.png";
   link.href = CANVAS.toDataURL("image/png");

   link.click();
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

document.querySelectorAll(".colors").forEach(color => color.addEventListener("click", function()
{
   document.querySelector(".selectedbottom")?.classList.remove("selectedbottom")
   color.classList.add("selectedbottom")

   color.animate("bounce", 0.15);
   opt.color = color.id;
}));
document.getElementById("sizebar").addEventListener("input", function()
{
   const SIZECOUNT = document.getElementById("sizecount");

   opt.width = this.value;

   TOOLSBOT.style.height = "70px";

   SIZECOUNT.style.display = "block";
   SIZECOUNT.innerText = this.value;

   SIZECOUNT.style.fontSize = (+this.value * 0.8) + 10 + "px";
   SIZECOUNT.style.left = -62 + +this.value*16.2 + "px";

   this.addEventListener("change", () =>
   {
      SIZECOUNT.style.display = "none";
      TOOLSBOT.style.height = "max-content";
   }, {once: true});
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
   ctx.font = `${fontSize}px ${font}`;
   ctx.fillStyle = color;
   ctx.fillText(text, x, y);
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
function movePixelData(ctx, begX, begY, endX, endY, putX, putY)
{
   let pixelData = ctx.getPixelData(begX, begY, endX, endY)
   ctx.putPixelData([...pixelData].fill(255), begX, begY, endX, endY);
   ctx.putPixelData(pixelData, begX, begY, endX, endY, putX, putY);
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
