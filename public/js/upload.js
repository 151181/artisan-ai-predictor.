import { showSuccess, showError } from "./ui.js";
import { postJSON } from "./api.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("uploadForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    // Use the FormData directly for file upload
    const fd = new FormData();
    fd.append("title", document.getElementById("name").value);
    fd.append("category", document.getElementById("category").value);
    fd.append("price", document.getElementById("price").value);
    fd.append("description", document.getElementById("description").value);
    const file = document.getElementById("image").files[0];
    if (file) fd.append("image", file);

    try {
        // --- NEW ENDPOINT: POST /api/campaigns/upload ---
        // This initiates the AI caption generation (status: AI_Processing)
        const token = localStorage.getItem("token");
        const res = await fetch((window.location.hostname === "localhost" ? "http://localhost:5000/api" : "/api") + "/campaigns/upload", {
            method: "POST",
            headers: token ? { "Authorization": `Bearer ${token}` } : {},
            body: fd
        });
        
        if (!res.ok) {
            const err = await res.json();
            showError(err);
            return;
        }

        const data = await res.json();
        
        showSuccess(`Product uploaded! AI is generating captions for Campaign ID: ${data.campaignId}.`);
        // Redirect to the campaign review page to see the pending status
        window.location.href = "campaign.html";
    } catch (err) {
        // Error already handled by fetchJSON/showError if the response was not 2xx
        // This catch block handles network errors
        console.error(err);
    }
  });
});
