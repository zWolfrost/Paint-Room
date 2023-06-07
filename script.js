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

const socket = io(["https://paint-room-server.onrender.com", "http://localhost:3000"][0])


let roomName


socket.on("connect", () =>
{
   INFOFIELD.innerText = `Connection with server established`;
   JOINFIELD.style.display = "inline";
   ROOMNAME.value = socket.id;
})
socket.on("connect_error", err => INFOFIELD.innerText = `Error: ${err.message}`);



JOINBTN.addEventListener("click", () =>
{
   socket.emit("leaveroom", roomName)

   roomName = ROOMNAME.value;

   socket.emit("joinroom", roomName)

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
}



let opt = {obj: null, event: null, fun: null, color: "black", size: 3};

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


document.getElementById("pencil").addEventListener("click", function()
{
   this.animate("shake", 0.25);
   if (opt.obj !== null) opt.obj.style.outline = "none";
   opt.obj = this;
   opt.obj.style.outline = "2px dashed darkgray";

   CANVAS.style.cursor = "url(assets/pencil.cur), auto";

   CANVAS.removeEventListener("mousedown", opt.fun);

   opt.fun = function()
   {
      //window.addEventListener("mouseup", () => CONTEXT.saveToHistory(), {once: true});
      drawMode(opt.size, opt.color);
   };

   CANVAS.addEventListener("mousedown", opt.fun);
});
function drawMode(size, color)
{
   let mouse = {x: window.event.x, y: window.event.y};

   let pencilSession = function()
   {
      mouse = {oldx: mouse.x, oldy: mouse.y, x: window.event.x, y: window.event.y};

      socket.emit("drawline", roomName, [[mouse.oldx, mouse.oldy], [mouse.x, mouse.y], size, color])
   }

   pencilSession();

   window.addEventListener("mousemove", pencilSession);

   window.addEventListener("mouseup", () => window.removeEventListener("mousemove", pencilSession), {once: true});
};

document.getElementById("eraser").addEventListener("click", function()
{
   this.animate("shake", 0.25);
   if (opt.obj !== null) opt.obj.style.outline = "none";
   opt.obj = this;
   opt.obj.style.outline = "2px dashed darkgray";

   CANVAS.style.cursor = "url(assets/eraser.cur), auto";

   CANVAS.removeEventListener("mousedown", opt.fun);

   opt.fun = function()
   {
      //window.addEventListener("mouseup", () => CONTEXT.saveToHistory(), {once: true});
      eraseMode("white")
   };

   CANVAS.addEventListener("mousedown", opt.fun);
});
function eraseMode(color)
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

      socket.emit("drawline", roomName, [[mouse.oldx, mouse.oldy], [mouse.x, mouse.y], sizeAverage*5, color])
   }

   pencilSession();

   window.addEventListener("mousemove", pencilSession);

   window.addEventListener("mouseup", () => window.removeEventListener("mousemove", pencilSession), {once: true});
};




socket.on("drawlinebroadcast", args => drawLine(CONTEXT, ...args))
function drawLine(ctx, begpoints, endpoints, width=2, color="black")
{
   ctx.beginPath();

   ctx.strokeStyle = color;
   ctx.lineWidth = width;

   ctx.moveTo(begpoints[0], begpoints[1]);
   ctx.lineTo(endpoints[0], endpoints[1]);
   ctx.stroke();

   ctx.closePath();
};
