const mongoose = require("mongoose");
const Wallet = require("./models/Wallet");
const Transfer = require("./models/Transfer");

async function connectDatabase() {
	try {
		await mongoose.connect(process.env.MONGODB_URI);
		console.log("✅ Connected to MongoDB");
	} catch (error) {
		console.error("❌ MongoDB connection error:", error);
		throw error;
	}
}

// Wallet operations
async function createWallet(telegramHandle, walletAddress, privateKey) {
	try {
		const wallet = await Wallet.findOneAndUpdate(
			{ telegramHandle: telegramHandle.toLowerCase() },
			{
				telegramHandle: telegramHandle.toLowerCase(),
				walletAddress: walletAddress.toLowerCase(),
				privateKey,
			},
			{ upsert: true, new: true },
		);
		return wallet;
	} catch (error) {
		console.error("Error creating wallet:", error);
		throw error;
	}
}

async function getWalletByHandle(telegramHandle) {
	try {
		return await Wallet.findOne({
			telegramHandle: telegramHandle.toLowerCase(),
		});
	} catch (error) {
		console.error("Error getting wallet by handle:", error);
		throw error;
	}
}

async function getWalletByAddress(address) {
	try {
		return await Wallet.findOne({ walletAddress: address.toLowerCase() });
	} catch (error) {
		console.error("Error getting wallet by address:", error);
		throw error;
	}
}

async function updateWalletChatId(telegramHandle, chatId) {
	try {
		return await Wallet.findOneAndUpdate(
			{ telegramHandle: telegramHandle.toLowerCase() },
			{ telegramChatId: chatId },
			{ new: true },
		);
	} catch (error) {
		console.error("Error updating wallet chat ID:", error);
		throw error;
	}
}

// Transfer operations
async function createTransfer(transfer) {
	try {
		const newTransfer = new Transfer({
			transferId: transfer.id,
			senderAddress: transfer.senderAddress.toLowerCase(),
			senderHandle: transfer.senderHandle?.toLowerCase() || null,
			recipientHandle: transfer.recipientHandle.toLowerCase(),
			recipientAddress: transfer.recipientAddress.toLowerCase(),
			amount: transfer.amount,
			status: transfer.status || "pending",
			claimToken: transfer.claimToken,
		});
		return await newTransfer.save();
	} catch (error) {
		console.error("Error creating transfer:", error);
		throw error;
	}
}

async function updateTransferStatus(transferId, status, txHash = null) {
	try {
		const update = { status };
		if (txHash) update.txHash = txHash;

		return await Transfer.findOneAndUpdate({ transferId }, update, {
			new: true,
		});
	} catch (error) {
		console.error("Error updating transfer status:", error);
		throw error;
	}
}

async function markTransferClaimed(claimToken) {
	try {
		return await Transfer.findOneAndUpdate(
			{ claimToken },
			{ status: "claimed", claimedAt: new Date() },
			{ new: true },
		);
	} catch (error) {
		console.error("Error marking transfer claimed:", error);
		throw error;
	}
}

async function getTransferByClaimToken(claimToken) {
	try {
		return await Transfer.findOne({ claimToken });
	} catch (error) {
		console.error("Error getting transfer by claim token:", error);
		throw error;
	}
}

async function getTransferById(transferId) {
	try {
		return await Transfer.findOne({ transferId });
	} catch (error) {
		console.error("Error getting transfer by ID:", error);
		throw error;
	}
}

async function getTransfersByAddress(address) {
	try {
		// Only return transfers where this address is the SENDER
		// Received transfers are tied to Telegram handles, not wallet addresses
		return await Transfer.find({
			senderAddress: address.toLowerCase(),
			status: { $in: ["confirmed", "claimed"] }, // Only show confirmed/claimed, not pending
		}).sort({ createdAt: -1 });
	} catch (error) {
		console.error("Error getting transfers by address:", error);
		throw error;
	}
}

async function getTransfersByHandle(handle) {
	try {
		return await Transfer.find({
			$or: [
				{ senderHandle: handle.toLowerCase() },
				{ recipientHandle: handle.toLowerCase() },
			],
		}).sort({ createdAt: -1 });
	} catch (error) {
		console.error("Error getting transfers by handle:", error);
		throw error;
	}
}

async function getPendingTransfersForRecipient(recipientHandle) {
	try {
		return await Transfer.find({
			recipientHandle: recipientHandle.toLowerCase(),
			status: "confirmed",
		}).sort({ createdAt: -1 });
	} catch (error) {
		console.error("Error getting pending transfers:", error);
		throw error;
	}
}

module.exports = {
	connectDatabase,
	createWallet,
	getWalletByHandle,
	getWalletByAddress,
	updateWalletChatId,
	createTransfer,
	updateTransferStatus,
	markTransferClaimed,
	getTransferByClaimToken,
	getTransferById,
	getTransfersByAddress,
	getTransfersByHandle,
	getPendingTransfersForRecipient,
};
