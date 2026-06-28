const mongoose = require('mongoose');

const siteSettingsSchema = new mongoose.Schema(
  {
    businessName: { type: String, default: 'DGH Tech Solutions' },
    founderName: { type: String, default: '' },
    logoText: { type: String, default: 'DGH' },
    headerLogoUrl: { type: String, default: '' },
    footerLogoUrl: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    location: { type: String, default: '' },
    domain: { type: String, default: '' },
    socialLinks: {
      linkedin: { type: String, default: '' },
      github: { type: String, default: '' },
      twitter: { type: String, default: '' },
      instagram: { type: String, default: '' },
      facebook: { type: String, default: '' },
      youtube: { type: String, default: '' },
    },
    footerText: { type: String, default: '' },
    metaDescription: { type: String, default: '' },
    metaKeywords: { type: String, default: '' },
    // Platform fee deducted from publisher earnings (%)
    platformFeePercent: { type: Number, default: 20, min: 0, max: 100 },
    // Minimum payout balance in USD
    payoutMinimumAmount: { type: Number, default: 20, min: 0 },
    // Days publisher must wait between approved payouts
    payoutWaitingDays: { type: Number, default: 30, min: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SiteSettings', siteSettingsSchema);
