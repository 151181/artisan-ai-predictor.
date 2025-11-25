document.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user) {
    window.location.href = "login.html";
    return;
  }

  document.getElementById("usernameDisplay").innerText = user.name;
});

async function loadRecommendations() {
  const container = document.getElementById("recommendations");

  try {
    const res = await fetch("http://localhost:5000/api/recommendations/1");
    const data = await res.json();

    container.innerHTML = data.map(item => `
      <div class="bg-white p-6 rounded-xl shadow">
        <img src="${item.image_url}" class="h-40 w-full object-cover rounded-lg mb-4">
        <h3 class="text-lg font-bold">${item.name}</h3>
        <p class="text-gray-600">${item.category}</p>
        <p class="text-blue-600 font-semibold mt-2">$${item.price}</p>
      </div>
    `).join("");

  } catch (error) {
    container.innerHTML = "<p class='text-red-600'>Failed to load recommendations.</p>";
  }
}

loadRecommendations();
import { fetchJSON } from "./api.js";

document.addEventListener("DOMContentLoaded", async () => {
  const el = document.getElementById("recommendations");
  if (!el) return;
  try {
    // example: use productId 1 or use user's last product
    const resp = await fetchJSON("/recommendations/1"); // backend: GET /api/recommendations/:id
    const items = resp.recommendations || resp; // adapt to your backend payload
    el.innerHTML = items.map(i => `
      <div class="card center">
        <img src="${i.image_url || 'assets/hero-bg.jpg'}" style="width:100%;height:160px;object-fit:cover;border-radius:10px;margin-bottom:10px" />
        <h4 style="color:var(--purple)">${i.name}</h4>
        <p class="small-muted">${i.category}</p>
        <p style="font-weight:800;color:var(--orange)">KES ${i.price}</p>
      </div>
    `).join("");
  } catch (err) {
    el.innerHTML = `<div class="card">Failed to load recommendations</div>`;
    console.error(err);
  }
});
