$("#btnLogin").on("click", async () => {
  $("#msg").text("");

  const body = {
    username: $("#username").val(),
    password: $("#password").val()
  };

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    // requirement: localStorage session
    localStorage.setItem("chat_user", JSON.stringify(data.user));
    window.location.href = "/view/chat.html";
  } catch (e) {
    $("#msg").text(e.message);
  }
});
