import mongoose from "mongoose";

// This model stores calculated, aggregated results (e.g., daily/weekly summaries)
const aggregatedReportSchema = new mongoose.Schema({
    impressions: { type: Number, required: true },
    clicks: { type: Number, required: true },
    engagementRate: { type: Number, required: true },
    // Renamed campaignID to campaignId for consistency with Mongoose naming conventions
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: "Campaign", required: true, index: true }, 
    generatedOn: { type: Date, default: Date.now }
});

const AggregatedReport = mongoose.models.AggregatedReport || mongoose.model("AggregatedReport", aggregatedReportSchema);

export default AggregatedReport;