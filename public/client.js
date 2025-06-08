const joinScreen = document.getElementById("join-screen");
const chatScreen = document.getElementById("chat-screen");
const joinForm = document.getElementById("join-form");
const messageForm = document.getElementById("message-form");
const messagesEl = document.getElementById("messages");
const usersEl = document.getElementById("users");
const roomNameEl = document.getElementById("room-name");
const chatRoomTitle = document.getElementById("chat-room-title");
const messageInput = document.getElementById("message-input");

const socket = io();
let currentRoom = "";

// === Join screen ===
joinForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const username = document.getElementById("username").value.trim();
  const room = document.getElementById("room").value.trim();
  if (!username || !room) return;
  currentRoom = room;
  socket.emit("join", { username, room });
  joinScreen.classList.add("hidden");
  chatScreen.classList.remove("hidden");
  roomNameEl.textContent = `Room: ${room}`;
  chatRoomTitle.textContent = room;
  messageInput.focus();
});

// === Chat events ===
socket.on("system", (text) => addMessage(text, "system"));

socket.on("chat", ({ username, message, time }) => {
  const me = username === document.getElementById("username").value.trim();
  addMessage(`${username} • ${time}<br>${message}`, me ? "me" : "other");
});

socket.on("users", (userList) => {
  usersEl.innerHTML = userList.map((u) => `<li>${u}</li>`).join("");
});

socket.on("typing", ({ username, typing }) => {
  const typingId = "typing-" + username;
  if (typing) {
    if (!document.getElementById(typingId)) {
      const li = document.createElement("li");
      li.id = typingId;
      li.className = "system";
      li.textContent = `${username} is typing…`;
      messagesEl.appendChild(li);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }
  } else {
    const el = document.getElementById(typingId);
    if (el) el.remove();
  }
});

// Send message
messageForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const msg = messageInput.value.trim();
  if (!msg) return;
  socket.emit("chat", { room: currentRoom, message: msg });
  messageInput.value = "";
  messageInput.focus();
});

// Typing indicator
let typingTimeout;
messageInput.addEventListener("input", () => {
  socket.emit("typing", { room: currentRoom, typing: true });
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    socket.emit("typing", { room: currentRoom, typing: false });
  }, 1000);
});

// Helpers
function addMessage(html, cls = "") {
  const li = document.createElement("li");
  li.innerHTML = html;
  if (cls) li.classList.add(cls);
  messagesEl.appendChild(li);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}
