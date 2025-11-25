import mongoose from 'mongoose';
import Campaign from '../models/Campaign.js'; 

// NOTE: Replace this with your actual connection URL
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/artisan_ai_db'; 

// --- Configuration for the Gemini API Call ---
const API_KEY = process.env.GEMINI_API_KEY || ""; // Using an empty string for the API key as per instructions
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${API_KEY}`;

/**
 * Creates the robust prompt string for the Gemini model.
 * @param {string} title - The art piece title.
 * @param {string} description - The art piece description.
 * @returns {string} The complete, structured prompt.
 */
const createAIPrompt = (title, description) => {
    return `
    **Role:** You are a professional, highly creative marketing copywriter specializing in fine art and handmade goods for online sales.

    **Context:** The artisan has uploaded a new piece of art.
    * **Art Title:** ${title}
    * **Art Description:** ${description}
    * **Visual Analysis:** [The image is available for analysis by the model.]

    **Task:** Generate exactly 5 distinct, engaging social media captions for a promotional campaign.
    1.  **Caption 1 (Story-Focused):** Must focus on the creation process or inspiration behind the art.
    2.  **Caption 2 (Witty/Engaging):** Must be short, attention-grabbing, and include a question to encourage comments.
    3.  **Caption 3 (Value/Aesthetic Focus):** Must highlight how the piece would transform a home or space.
    4.  **Caption 4 (Call-to-Action):** Must be direct and focus on urgency or scarcity (e.g., "Only one available," "Last chance").
    5.  **Caption 5 (Thought-Provoking/Emotional):** Must evoke a strong feeling related to the art's theme.

    **Format:** Provide the output as a single, valid JSON array of objects. Do not include any text, headers, or explanations outside the JSON block.

    **JSON Schema for Output:**
    [
        {
            "caption_text": "...",
            "suggested_hashtags": ["#tag1", "#tag2", "...", "#tag5"]
        },
        // ... 4 more objects
    ]
    `;
};


/**
 * Calls the Gemini API to generate structured social media captions.
 * @param {string} title 
 * @param {string} description 
 * @param {string} imageUrl - The URL for the model to analyze the image
 * @returns {Array} An array of caption objects.
 */
const generateCaptions = async (title, description, imageUrl) => {
    const promptText = createAIPrompt(title, description);
    
    // NOTE: In a real app, you would fetch the image data from the URL, 
    // convert it to base64, and pass it as inlineData.
    // For this demonstration, we are only passing the prompt text, as image handling
    // adds significant complexity to this simple worker structure.
    
    // The model is instructed to imagine the visual analysis based on the description/title.
    const payload = {
        contents: [{ parts: [{ text: promptText }] }],
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
                type: "ARRAY",
                items: {
                    type: "OBJECT",
                    properties: {
                        "caption_text": { "type": "STRING" },
                        "suggested_hashtags": {
                            "type": "ARRAY",
                            "items": { "type": "STRING" }
                        }
                    },
                    "propertyOrdering": ["caption_text", "suggested_hashtags"]
                }
            }
        },
    };

    let responseJson;
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`API call failed with status: ${response.status}`);
        }

        responseJson = await response.json();
        
        const candidate = responseJson.candidates?.[0];

        if (candidate && candidate.content?.parts?.[0]?.text) {
            const jsonString = candidate.content.parts[0].text;
            return JSON.parse(jsonString);
        }

    } catch (error) {
        console.error("Error generating captions from Gemini API:", error);
        // Fallback: return an empty array on error
        return [];
    }

    return [];
};


/**
 * Main worker function to execute the AI task and update the database.
 * This function simulates what your background job would execute.
 * @param {string} campaignId - The ID of the document to update.
 */
export const processAICaptionTask = async (campaignId) => {
    if (mongoose.connection.readyState !== 1) {
        await mongoose.connect(MONGO_URI);
    }

    try {
        // 1. Fetch the Campaign Data
        const campaign = await Campaign.findById(campaignId);

        if (!campaign) {
            console.error(`Worker failed: Campaign ID ${campaignId} not found.`);
            return;
        }

        const { title, description, image_url } = campaign.art_details;

        console.log(`[AI Worker] Starting generation for campaign: ${title}`);

        // 2. Generate Captions
        const generatedCaptions = await generateCaptions(title, description, image_url);

        if (generatedCaptions.length === 0) {
            console.warn(`[AI Worker] No captions generated. Campaign status set to Drafting.`);
            // If API failed, set status back to Drafting so the artisan can retry
            campaign.status = 'Drafting';
            await campaign.save();
            return;
        }

        // 3. Update the Database
        campaign.suggested_captions = generatedCaptions;
        campaign.status = 'Caption_Ready'; // New status: Ready for artisan review
        
        await campaign.save();
        
        console.log(`[AI Worker] Successfully updated campaign ${campaignId} with ${generatedCaptions.length} captions. Status: Caption_Ready.`);

    } catch (error) {
        console.error("Critical error in AI worker process:", error);
    } finally {
        // In a real dedicated worker, you might keep the connection open.
        // For a simple demo, we close it.
        // await mongoose.connection.close();
    }
};