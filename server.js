const http = require("http");
const WebSocket = require("ws");
const PORT = Number(process.env.PORT || 10000);

const server = http.createServer((req, res) => {
  if (req.url === "/" || req.url === "/health") {
    res.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
    res.end("OPERATION STRIKE 2D multiplayer server online");
  } else {
    res.writeHead(404);
    res.end("Not found");
  }
});

const wss = new WebSocket.Server({ server });
const rooms = new Map();
const MAX_MESSAGE_BYTES = 128 * 1024;

function send(ws, obj) {
  if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(obj));
}
function sendRaw(ws, data) {
  if (ws && ws.readyState === WebSocket.OPEN) ws.send(data);
}
function leave(ws) {
  const code = ws.roomCode;
  if (!code) return;
  ws.roomCode = null;
  const room = rooms.get(code);
  if (!room) return;
  if (room.host === ws) {
    room.host = null;
    send(room.client, { op: "left" });
    if (room.client) room.client.roomCode = null;
  } else if (room.client === ws) {
    room.client = null;
    send(room.host, { op: "left" });
  }
  if (!room.host && !room.client) rooms.delete(code);
}

wss.on("connection", (ws) => {
  ws.roomCode = null;
  ws.isAlive = true;
  ws.on("pong", () => { ws.isAlive = true; });

  ws.on("message", (data, isBinary) => {
    if (isBinary || data.length > MAX_MESSAGE_BYTES) {
      send(ws, { op: "err", m: "MENSAGEM INVÁLIDA" });
      return;
    }
    const raw = data.toString();
    let msg;
    try { msg = JSON.parse(raw); } catch (_) { return; }

    if (msg && (msg.op === "host" || msg.op === "join")) {
      if (ws.roomCode) leave(ws);
      const code = String(msg.room || "").trim().toUpperCase();
      if (!/^[A-HJ-NP-Z2-9]{5}$/.test(code)) {
        send(ws, { op: "err", m: "CÓDIGO DE SALA INVÁLIDO" });
        return;
      }
      if (msg.op === "host") {
        if (rooms.has(code) && rooms.get(code).host) {
          send(ws, { op: "err", m: "ESSE CÓDIGO JÁ ESTÁ EM USO" });
          return;
        }
        rooms.set(code, { code, host: ws, client: null });
        ws.roomCode = code;
        send(ws, { op: "ok", room: code });
        return;
      }
      const room = rooms.get(code);
      if (!room || !room.host || room.host.readyState !== WebSocket.OPEN) {
        send(ws, { op: "err", m: "SALA NÃO ENCONTRADA. PEÇA UM NOVO CÓDIGO." });
        return;
      }
      if (room.client && room.client.readyState === WebSocket.OPEN) {
        send(ws, { op: "err", m: "ESSA SALA JÁ ESTÁ CHEIA" });
        return;
      }
      room.client = ws;
      ws.roomCode = code;
      send(ws, { op: "peer" });
      send(room.host, { op: "peer" });
      return;
    }

    const room = ws.roomCode && rooms.get(ws.roomCode);
    if (!room) return;
    const other = room.host === ws ? room.client : room.host;
    if (other && other.readyState === WebSocket.OPEN) sendRaw(other, raw);
  });

  ws.on("close", () => leave(ws));
  ws.on("error", () => leave(ws));
});

const heartbeat = setInterval(() => {
  for (const ws of wss.clients) {
    if (!ws.isAlive) { ws.terminate(); continue; }
    ws.isAlive = false;
    ws.ping();
  }
}, 30000);

server.listen(PORT, "0.0.0.0", () => {
  console.log(`OPERATION STRIKE 2D server listening on port ${PORT}`);
});
