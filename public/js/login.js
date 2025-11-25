document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const response = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (data.success) {
        // Store token/session info
        localStorage.setItem("authToken", data.token);

        // Redirect to artisans page
        window.location.href = "/artisans";
    } else {
        alert("Login failed: " + data.message);
    }
});
// after login success
localStorage.setItem("authToken", "your_generated_token_here");
window.location.href = "/artisans.html";
document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    try {
        const res = await fetch((window.location.hostname === "localhost" ? "http://localhost:5000/api" : "/api") + "/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Login failed");
        localStorage.setItem("token", data.token);
        window.location.href = "artisans.html";
    } catch (err) {
        alert(err.message);
    }   
});