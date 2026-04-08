/**
 * User.js
 * Unified schema for both Buyers and Sellers.
 *
 * Design Decision: Single collection with a `role` discriminator.
 * Both roles share auth fields (email, password, phone).
 * Role-specific data lives in BuyerPreferences / SellerInsights — not here.
 * This keeps the User document lean and auth queries fast.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    // ── Identity ──────────────────────────────────────────────────────────
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,       // Enforced at DB level — also creates the index
      lowercase: true,    // Normalize before storing to prevent duplicates like User@email.com
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,      // NEVER returned in queries by default — must be explicitly requested
    },

    phone: {
      type: String,
      trim: true,
      match: [/^[+\d\s\-()]{7,20}$/, 'Please provide a valid phone number'],
    },

    // ── Role ──────────────────────────────────────────────────────────────
    /**
     * Role determines which module the user accesses.
     * 'buyer'  → BuyerPreferences, property search/compare
     * 'seller' → Property listings, SellerInsights dashboard
     * 'admin'  → Platform management (future use)
     */
    role: {
      type: String,
      enum: {
        values: ['buyer', 'seller', 'admin'],
        message: 'Role must be buyer, seller, or admin',
      },
      default: 'buyer',
    },

    // ── Profile ───────────────────────────────────────────────────────────
    avatar: {
      type: String,         // URL to profile image (cloud storage)
      default: null,
    },

    isVerified: {
      type: Boolean,
      default: false,       // Set to true after email verification (Step N)
    },

    isActive: {
      type: Boolean,
      default: true,        // Soft-delete flag — deactivated accounts are not deleted
    },

    // ── Auth Tokens (for refresh / password reset flows) ──────────────────
    passwordResetToken: {
      type: String,
      select: false,        // Sensitive — never returned by default
    },

    passwordResetExpires: {
      type: Date,
      select: false,
    },

    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    // Automatically adds `createdAt` and `updatedAt` fields
    timestamps: true,

    // When converting document to JSON (e.g., res.json()), apply transforms
    toJSON: {
      transform(doc, ret) {
        delete ret.password;                // Extra safety — never expose password
        delete ret.passwordResetToken;
        delete ret.passwordResetExpires;
        delete ret.__v;                     // Internal Mongoose version key — not useful to clients
        return ret;
      },
    },
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────
/**
 * email: Already unique (index auto-created by `unique: true`).
 * role:  Compound index for admin queries like "list all sellers".
 * Sparse compound for active users by role — common admin/filter query pattern.
 */
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ createdAt: -1 });

// ── Middleware: Password Hashing ─────────────────────────────────────────
userSchema.pre('save', async function () {
  // Only hash the password if it's modified (or new)
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// ── Instance Method: Compare Password ──────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
