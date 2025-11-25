// ==================== CONFIG ====================
const BACKEND_URL = "http://localhost:5000"; // your backend URL

// ==================== REGISTER ====================
async function registerUser(e) {
  e.preventDefault();
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const location = document.getElementById("location") ? document.getElementById("location").value.trim() : "";

  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, location }),
    });
    const data = await res.json();
    if (res.ok) {
      alert("Registration successful! Please log in.");
      window.location.href = "login.html";
    } else {
      alert("Registration failed: " + (data.message || "Unknown error"));
    }
  } catch (err) {
    console.error(err);
    alert("Something went wrong during registration.");
  }
}

// Attach registration handler
const registerForm = document.getElementById("registerForm");
if (registerForm) registerForm.addEventListener("submit", registerUser);

// ==================== LOGIN ====================
async function loginUser(e) {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("username", data.user.name);
      window.location.href = "artisans.html"; // redirect after login
    } else {
      alert("Login failed: " + (data.message || "Unknown error"));
    }
  } catch (err) {
    console.error(err);
    alert("Something went wrong during login.");
  }
}

// Attach login handler
const loginForm = document.getElementById("loginForm");
if (loginForm) loginForm.addEventListener("submit", loginUser);

// ==================== LOGOUT ====================
function logoutUser() {
  localStorage.removeItem("authToken");
  localStorage.removeItem("username");
  window.location.href = "login.html";
}

const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) logoutBtn.addEventListener("click", (e) => {
  e.preventDefault();
  logoutUser();
});
