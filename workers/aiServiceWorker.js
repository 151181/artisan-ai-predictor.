// backend/app/services/aiService.js
import Campaign from '../models/Campaign.js';

/**
 * Placeholder for triggering asynchronous AI caption generation.
 * In a real app, this would be a worker queue or a dedicated ML service call.
 * * @param {string} campaignId - The ID of the campaign to update
 * @param {string} imageUrl - The URL of the image for VLM
 * @param {string} description - The user-provided product description
 */
export const triggerAICaptionGeneration = async (campaignId, imageUrl, description) => {
    console.log(`[AI SERVICE] Triggering generation for Campaign ${campaignId}...`);
    
    // --- Step 1: Simulate LLM Call ---
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate 2 second LLM delay

    // --- Step 2: Simulate Generated Captions ---
    const mockCaptions = [
        { 
            caption: `Experience the soulful beauty of this handcrafted piece! A true statement for any space. #ArtisanCraft #AfricanArt #HandmadeWithLove`,
            hashtags: ['ArtisanCraft', 'AfricanArt', 'HandmadeWithLove', 'HomeDecor'],
            sentiment: 'Inspiring'
        },
        { 
            caption: `Get 10% off the perfect conversation starter! Limited stock. Use code ART10.`,
            hashtags: ['Sale', 'LimitedStock', 'BuyNow', 'ArtDeals'],
            sentiment: 'Salesy'
        },
        { 
            caption: `When tradition meets modern design. What story does this piece tell you?`,
            hashtags: ['Storytelling', 'CulturalArt', 'ModernTradition'],
            sentiment: 'Reflective'
        },
    ];

    // --- Step 3: Update the Campaign Document ---
    try {
        const campaign = await Campaign.findById(campaignId);

        if (campaign) {
            campaign.suggested_captions = mockCaptions;
            campaign.status = 'Caption_Ready';
            await campaign.save();
            console.log(`[AI SERVICE] Campaign ${campaignId} updated to 'Caption_Ready' with ${mockCaptions.length} captions.`);
        } else {
            console.error(`[AI SERVICE] Failed to find campaign ${campaignId} for update.`);
        }
    } catch (error) {
        console.error(`[AI SERVICE] Database update failed for campaign ${campaignId}:`, error);
    }
};