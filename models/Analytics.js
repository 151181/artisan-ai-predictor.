import mongoose from 'mongoose';

const analyticsSchema = new mongoose.Schema({
    campaignID: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true },
    impressions: { type: Number, required: true },
    clicks: { type: Number, required: true },
    engagementRate: { type: Number, required: true },
    dateRecorded: { type: Date, default: Date.now }
});

const Analytics = mongoose.model('Analytics', analyticsSchema);
export default Analytics;
