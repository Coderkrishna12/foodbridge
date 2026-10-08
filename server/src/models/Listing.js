import mongoose from 'mongoose';

export const FOOD_TYPES = ['veg', 'non-veg', 'mixed'];
export const STATUSES = ['available', 'claimed', 'completed'];

const listingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 500, default: '' },
    foodType: { type: String, enum: FOOD_TYPES, required: true },
    quantity: { type: Number, required: true, min: 1, max: 5000 }, // servings
    pickupAddress: { type: String, required: true, trim: true, maxlength: 200 },
    city: { type: String, required: true, trim: true, maxlength: 50 },
    expiresAt: { type: Date, required: true },
    status: { type: String, enum: STATUSES, default: 'available', index: true },
    donor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    claimedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    claimedAt: Date,
    completedAt: Date,
    // 4-digit handover code: shown only to the claiming NGO, entered by the donor at pickup
    pickupCode: { type: String, select: false },
    pickupAttempts: { type: Number, default: 0, select: false },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

// Still "available" but past its expiry time -> nobody can claim it any more
listingSchema.virtual('isExpired').get(function () {
  return this.status === 'available' && this.expiresAt < new Date();
});

export default mongoose.model('Listing', listingSchema);
