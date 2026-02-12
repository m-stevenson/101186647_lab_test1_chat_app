const user = JSON.parse(localStorage.getItem("chat_user") || "null");
if (!user) window.location.href = "/view/login.html";

$("#myUsername").text(user.username);

const socket = io();
let currentRoom = null;

function appendMessage({ from, text, meta }) {
  const html = `
    <div class="msg">
      <div class="meta"><strong>${from}</strong> • ${meta}</div>
      <div class="text">${$("<div>").text(text).html()}</div>
    </div>
  `;
  $("#chatBox").append(html);
  $("#chatBox").scrollTop($("#chatBox")[0].scrollHeight);
}

// Fetch last 50 messages
async function loadRoomHistory(room) {
  const res = await fetch(
    `/api/messages/room/${encodeURIComponent(room)}?limit=50`,
  );
  const msgs = await res.json();
  $("#chatBox").empty();
  msgs.forEach((m) =>
    appendMessage({
      from: m.from_user,
      text: m.message,
      meta: `${m.room} • ${m.date_sent}`,
    }),
  );
}

// Join room
$("#btnJoin").on("click", () => {
  const displayName = ($("#displayName").val() || "").trim();
  const room = ($("#roomSelect").val() || "").trim();

  if (!displayName) {
    alert("Enter a name before joining");
    return;
  }

  socket.emit("join_room", { username: displayName, room });
});

// Leave room
$("#btnLeave").on("click", () => {
  socket.emit("leave_room");
});

// Send group message
$("#btnSend").on("click", () => {
  const msg = $("#msgText").val();
  $("#msgText").val("");
  socket.emit("typing", { isTyping: false });
  socket.emit("group_message", { message: msg });
});

// Enter to send
$("#msgText").on("keypress", (e) => {
  if (e.key === "Enter") $("#btnSend").click();
});

// Typing indicator
let typingTimer = null;
$("#msgText").on("input", () => {
  if (!currentRoom) return;

  socket.emit("typing", { isTyping: true });
  clearTimeout(typingTimer);
  typingTimer = setTimeout(
    () => socket.emit("typing", { isTyping: false }),
    500,
  );
});

// Private send
$("#btnPmSend").on("click", () => {
  const to_user = $("#pmTo").val().trim();
  const message = $("#pmText").val();
  $("#pmText").val("");

  socket.emit("private_message", {
    from_user: user.username,
    to_user,
    message,
  });
});

// Logout
$("#btnLogout").on("click", () => {
  localStorage.removeItem("chat_user");
  window.location.href = "/view/login.html";
});

// socket listeners
socket.on("joined_room", async ({ room }) => {
  currentRoom = room;
  $("#currentRoom").text(room);
  await loadRoomHistory(room);
  appendMessage({
    from: "SYSTEM",
    text: `You joined ${room}`,
    meta: new Date().toLocaleString(),
  });
});

socket.on("left_room", () => {
  currentRoom = null;
  $("#currentRoom").text("None");
  $("#chatBox").empty();
  $("#typing").text("");
  appendMessage({
    from: "SYSTEM",
    text: "You left the room.",
    meta: new Date().toLocaleString(),
  });
});

socket.on("system_message", (m) => {
  appendMessage({ from: "SYSTEM", text: m.message, meta: m.date_sent });
});

socket.on("group_message", (m) => {
  appendMessage({
    from: m.from_user,
    text: m.message,
    meta: `${m.room} • ${m.date_sent}`,
  });
});

socket.on("typing", ({ username, isTyping }) => {
  if (!currentRoom) return;
  if (!isTyping) {
    $("#typing").text("");
    return;
  }
  $("#typing").text(`${username} is typing...`);
});

// Private messages: client filters relevant ones
socket.on("private_message", (m) => {
  if (m.from_user === user.username || m.to_user === user.username) {
    appendMessage({
      from: `PM ${m.from_user} → ${m.to_user}`,
      text: m.message,
      meta: m.date_sent,
    });
  }
});

socket.on("error_message", (e) => {
  appendMessage({
    from: "ERROR",
    text: e.error,
    meta: new Date().toLocaleString(),
  });
});
