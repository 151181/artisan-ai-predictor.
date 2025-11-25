import { fetchJSON, postJSON } from "./api.js";
import { showSuccess, showError } from "./ui.js";

// Utility function to render a single campaign card
function renderCampaignCard(campaign) {
    const statusColor = campaign.status === 'Caption_Ready' ? 'var(--orange)' : 
                        campaign.status === 'Launched' ? 'var(--purple)' : '#666';
    
    const image_url = campaign.art_details.image_url || 'assets/hero-bg.jpg';
    const isReady = campaign.status === 'Caption_Ready';
    const captions = campaign.ai_data?.generated_captions || ["No captions generated yet."];

    return `
        <div class="card" data-campaign-id="${campaign._id}" style="display:flex; gap: 20px; align-items: flex-start;">
            <img src="${image_url}" alt="${campaign.art_details.title}" style="width: 120px; height: 120px; object-fit: cover; border-radius: 8px;" />
            
            <div style="flex-grow: 1;">
                <div style="display:flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <h4 style="color:var(--purple); margin:0;">${campaign.art_details.title}</h4>
                    <span style="font-size: 12px; font-weight: 700; color: ${statusColor};">${campaign.status.replace(/_/g, ' ')}</span>
                </div>
                
                <p class="small-muted">Uploaded: ${new Date(campaign.uploaded_at).toLocaleDateString()}</p>
                
                ${isReady ? `
                    <div style="margin-top: 15px;">
                        <label style="font-weight: 600; display: block; margin-bottom: 5px;">Select AI Caption:</label>
                        <select id="caption-select-${campaign._id}" class="input" style="width: 100%; margin-bottom: 10px;">
                            ${captions.map((c, index) => `<option value="${index}">${c}</option>`).join('')}
                        </select>
                        <button class="btn launch-btn" data-id="${campaign._id}" style="padding: 8px 15px; margin-top: 5px;">Launch Campaign</button>
                    </div>
                ` : `<p style="margin-top: 15px;">AI processing... Check back in a moment.</p>`}
            </div>
        </div>
    `;
}

// Main logic to fetch and display campaigns
async function loadCampaigns() {
    const container = document.getElementById("campaign-list");
    if (!container) return;
    
    container.innerHTML = '<div class="center small-muted">Loading campaigns...</div>';
    
    try {
        // Fetch all campaigns (Backend: GET /api/campaigns)
        const campaigns = await fetchJSON("/campaigns"); 
        
        if (campaigns.length === 0) {
            container.innerHTML = '<div class="center card">You have no campaigns yet. Upload a product to begin!</div>';
            return;
        }

        container.innerHTML = campaigns.map(renderCampaignCard).join("");
        
        // Attach event listeners to the new Launch buttons
        document.querySelectorAll('.launch-btn').forEach(button => {
            button.addEventListener('click', handleLaunch);
        });

    } catch (err) {
        container.innerHTML = '<div class="center card" style="background:var(--cream)">Failed to load campaigns.</div>';
        console.error("Error loading campaigns:", err);
        // Error handled by fetchJSON/showError
    }
}

// Handler for the Launch button click
async function handleLaunch(e) {
    const campaignId = e.target.getAttribute('data-id');
    const selectElement = document.getElementById(`caption-select-${campaignId}`);
    const selectedCaptionIndex = selectElement ? parseInt(selectElement.value, 10) : 0;
    
    if (!campaignId) return showError({ message: "Missing Campaign ID." });

    e.target.disabled = true;
    e.target.textContent = 'Launching...';

    try {
        // Backend: POST /api/campaigns/:id/launch
        await postJSON(`/campaigns/${campaignId}/launch`, { 
            selectedCaptionIndex 
        });
        
        showSuccess("Campaign launched successfully!");
        
        // Reload campaigns to update status
        loadCampaigns(); 

    } catch (err) {
        console.error("Launch failed:", err);
        e.target.disabled = false;
        e.target.textContent = 'Launch Campaign';
        // Error handled by postJSON/showError
    }
}

// Initial load
document.addEventListener("DOMContentLoaded", loadCampaigns);