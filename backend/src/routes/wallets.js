const express = require("express");
const router = express.Router();
const {
	createWallet,
	getWalletByHandle,
	getWalletByAddress,
} = require("../database");
const { createNewWallet, getEthBalance } = require("../services/blockchain");

// GET /api/wallets/balance/:address - Get wallet balance
router.get("/balance/:address", async (req, res) => {
	try {
		const { address } = req.params;
		const ethBalance = await getEthBalance(address);

		res.json({
			success: true,
			balance: {
				eth: ethBalance,
			},
		});
	} catch (error) {
		console.error("Balance error:", error);
		res.status(500).json({ error: "Failed to get balance" });
	}
});

// GET /api/wallets/handle/:handle - Get wallet by Telegram handle
router.get("/handle/:handle", async (req, res) => {
	try {
		const wallet = await getWalletByHandle(req.params.handle);

		if (!wallet) {
			return res
				.status(404)
				.json({ error: "Wallet not found for this handle" });
		}

		const ethBalance = await getEthBalance(wallet.walletAddress);

		res.json({
			success: true,
			wallet: {
				handle: wallet.telegramHandle,
				address: wallet.walletAddress,
				ethBalance,
			},
		});
	} catch (error) {
		console.error("Get wallet error:", error);
		res.status(500).json({ error: "Failed to get wallet" });
	}
});

// POST /api/wallets/create - Create a new wallet for a handle
router.post("/create", async (req, res) => {
	const { handle } = req.body;

	if (!handle) {
		return res.status(400).json({ error: "Telegram handle is required" });
	}

	try {
		// Check if wallet already exists
		const existing = await getWalletByHandle(handle);

		if (existing) {
			const ethBalance = await getEthBalance(existing.walletAddress);

			return res.json({
				success: true,
				wallet: {
					handle: existing.telegramHandle,
					address: existing.walletAddress,
					ethBalance,
					isNew: false,
				},
			});
		}

		// Create new wallet
		const newWallet = createNewWallet();
		const wallet = await createWallet(
			handle,
			newWallet.address,
			newWallet.privateKey,
		);

		res.json({
			success: true,
			wallet: {
				handle: wallet.telegramHandle,
				address: wallet.walletAddress,
				ethBalance: "0",
				isNew: true,
			},
		});
	} catch (error) {
		console.error("Create wallet error:", error);
		res.status(500).json({ error: "Failed to create wallet" });
	}
});

// GET /api/wallets/usdc-address - Get USDC contract address
router.get("/usdc-address", (req, res) => {
	res.json({
		success: true,
		address: getUsdcAddress(),
		network: "Arbitrum Sepolia",
		chainId: 421614,
	});
});

module.exports = router;
