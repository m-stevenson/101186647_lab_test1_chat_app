$("#btnSignup").on("click", async () => {
  $("#msg").text("");

  const body = {
    username: $("#username").val().trim(),
    firstname: $("#firstname").val().trim(),
    lastname: $("#lastname").val().trim(),
    password: $("#password").val()
  };

  try {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Signup failed");

    window.location.href = "/view/login.html";
  } catch (e) {
    $("#msg").text(e.message);
  }
});
