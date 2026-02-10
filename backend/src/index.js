require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { connectDatabase } = require("./database");
const transferRoutes = require("./routes/transfers");
const walletRoutes = require("./routes/wallets");
const claimRoutes = require("./routes/claims");
const { initTelegramBot } = require("./services/telegram");
const { initOpenAI } = require("./services/ai");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/transfers", transferRoutes);
app.use("/api/wallets", walletRoutes);
app.use("/api/claims", claimRoutes);

// Health check
app.get("/health", (req, res) => {
	res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Initialize database and start server
async function start() {
	try {
		await connectDatabase();
		console.log("✅ Database connected");

		initTelegramBot();
		console.log("✅ Telegram bot initialized");

		initOpenAI();
		console.log("✅ OpenAI initialized");

		app.listen(PORT, () => {
			console.log(`🚀 PingPay backend running on port ${PORT}`);
		});
	} catch (error) {
		console.error("Failed to start server:", error);
		process.exit(1);
	}
}

start();
