import Campaign from '../models/Campaign.js';
// Note: This file will contain the actual fetch logic to your Python/Colab endpoint.

/**
 * Triggers external AI service to generate marketing captions.
 * Placeholder for now to prevent import errors.
 * @param {string} campaignId - The ID of the campaign to update
 * @param {string} imageUrl - The URL of the image for VLM 
 * @param {string} description - The user-provided product description
 */
export const triggerAICaptionGeneration = async (campaignId, imageUrl, description) => {
    console.log(`[AI SERVICE] Mock trigger for Campaign ${campaignId}.`);

    // --- MOCK DATA ---
    const mockCaptions = [
        { text: `🌟 Handcrafted perfection! Get 20% off this stunning piece.`, score: 0.85 },
        { text: `The detail on this is breathtaking. Shop local, shop artisan.`, score: 0.79 },
    ];
    
    try {
        // Simulate waiting for the AI response
        await new Promise(resolve => setTimeout(resolve, 2000)); 

        const campaign = await Campaign.findById(campaignId);

        if (campaign) {
            campaign.suggested_captions = mockCaptions;
            campaign.status = 'Generation_Ready';
            await campaign.save();
            console.log(`[AI SERVICE] Campaign ${campaignId} successfully updated with mock captions.`);
        } else {
            console.error(`[AI SERVICE] Failed to find campaign ${campaignId}.`);
        }
    } catch (error) {
        console.error(`[AI SERVICE] Mock generation failed:`, error.message);
    }
};