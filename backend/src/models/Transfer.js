const mongoose = require("mongoose");

const transferSchema = new mongoose.Schema({
	transferId: {
		type: String,
		required: true,
		unique: true,
	},
	senderAddress: {
		type: String,
		required: true,
		lowercase: true,
	},
	senderHandle: {
		type: String,
		lowercase: true,
		default: null,
	},
	recipientHandle: {
		type: String,
		required: true,
		lowercase: true,
	},
	recipientAddress: {
		type: String,
		required: true,
		lowercase: true,
	},
	amount: {
		type: String,
		required: true,
	},
	status: {
		type: String,
		enum: ["pending", "confirmed", "claimed", "failed"],
		default: "pending",
	},
	txHash: {
		type: String,
		default: null,
	},
	claimToken: {
		type: String,
		unique: true,
		sparse: true,
	},
	claimedAt: {
		type: Date,
		default: null,
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
});

// Indexes for faster lookups
transferSchema.index({ transferId: 1 });
transferSchema.index({ claimToken: 1 });
transferSchema.index({ senderAddress: 1 });
transferSchema.index({ recipientAddress: 1 });
transferSchema.index({ recipientHandle: 1 });

module.exports = mongoose.model("Transfer", transferSchema);
