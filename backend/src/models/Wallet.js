const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema({
	telegramHandle: {
		type: String,
		required: true,
		unique: true,
		lowercase: true,
		trim: true,
	},
	walletAddress: {
		type: String,
		required: true,
		lowercase: true,
	},
	privateKey: {
		type: String,
		required: true,
	},
	telegramChatId: {
		type: String,
		default: null,
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
});

// Index for faster lookups
walletSchema.index({ telegramHandle: 1 });
walletSchema.index({ walletAddress: 1 });

module.exports = mongoose.model("Wallet", walletSchema);
