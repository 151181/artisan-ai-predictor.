import Joi from "joi";

// Artisan validation (for registration)
export const artisanSchema = Joi.object({
  name: Joi.string().min(3).max(50).required(),
  email: Joi.string().min(5).max(255).email().required(),
  password: Joi.string().min(6).max(1024).required(),
  phoneNumber: Joi.string().allow('').optional(),
  location: Joi.string().allow('').optional(),
});

// Login validation (only requires email and password)
export const loginSchema = Joi.object({
  email: Joi.string().min(5).max(255).email().required(),
  password: Joi.string().min(6).max(1024).required(),
});

// Product validation
export const productSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().required(),
  price: Joi.number().positive().required(),
  imagePath: Joi.string().optional(),
  artisanID: Joi.string().required(),
});

// Campaign validation
export const campaignSchema = Joi.object({
  caption: Joi.string().required(),
  hashtags: Joi.array().items(Joi.string()),
  scheduleDate: Joi.date().required(),
  status: Joi.string().valid("scheduled", "active", "completed", "Generation_Ready").default("scheduled"),
  productID: Joi.string().required(),
});

// Analytics validation
export const analyticsSchema = Joi.object({
  impressions: Joi.number().required(),
  clicks: Joi.number().required(),
  engagementRate: Joi.number().required(),
  campaignID: Joi.string().required(),
});