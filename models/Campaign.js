import mongoose from 'mongoose';

const campaignSchema = new mongoose.Schema({
    productID: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    caption: { type: String, required: true },
    hashtags: [{ type: String }],
    scheduleDate: { type: Date, required: true },
    status: { type: String, enum: ['scheduled', 'active', 'completed', 'Generation_Ready'], default: 'scheduled' },
    // Field for storing captions suggested by the AI
    suggested_captions: [{
        text: String,
        score: Number // e.g., engagement score from the AI
    }],
    createdAt: { type: Date, default: Date.now }
});

const Campaign = mongoose.model('Campaign', campaignSchema);
export default Campaign;
