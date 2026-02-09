const TelegramBot = require('node-telegram-bot-api');

let bot = null;
// Store mapping of username -> chatId (in production, save this to database)
const userChatIds = new Map();

function initTelegramBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  
  if (!token || token === 'your_telegram_bot_token_here') {
    console.log('⚠️  Telegram bot token not configured. Bot features disabled.');
    return null;
  }
  
  try {
    bot = new TelegramBot(token, { polling: true });
    
    // Handle /start command - register user's chat ID
    bot.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id;
      const username = msg.from.username;
      
      if (username) {
        userChatIds.set(username.toLowerCase(), chatId);
        console.log(`📝 Registered @${username} with chatId ${chatId}`);
      }
      
      bot.sendMessage(chatId, 
        `👋 Welcome to PingPay${username ? `, @${username}` : ''}!\n\n` +
        `✅ You're now registered to receive notifications when someone sends you ETH.\n\n` +
        `Just share your Telegram handle with friends and they can send you ETH instantly!`
      );
    });
    
    // Handle any message - ensure we have user's chat ID
    bot.on('message', (msg) => {
      const username = msg.from.username;
      const chatId = msg.chat.id;
      if (username && !userChatIds.has(username.toLowerCase())) {
        userChatIds.set(username.toLowerCase(), chatId);
        console.log(`📝 Auto-registered @${username} with chatId ${chatId}`);
      }
    });
    
    // Handle /balance command
    bot.onText(/\/balance/, async (msg) => {
      const chatId = msg.chat.id;
      bot.sendMessage(chatId, 
        '💰 To check your balance, go to the PingPay Receive page and enter your Telegram handle!'
      );
    });
    
    console.log('✅ Telegram bot started');
    return bot;
  } catch (error) {
    console.error('Failed to initialize Telegram bot:', error);
    return null;
  }
}

// Send claim notification to recipient
async function sendClaimNotification(recipientHandle, amount, claimToken, senderHandle) {
  if (!bot) {
    console.log('Telegram bot not initialized. Skipping notification.');
    return { success: false, reason: 'Bot not initialized' };
  }
  
  const claimUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/receive`;
  const cleanHandle = recipientHandle.toLowerCase();
  const chatId = userChatIds.get(cleanHandle);
  
  if (!chatId) {
    console.log(`⚠️ @${recipientHandle} hasn't started the bot yet. Cannot send notification.`);
    return {
      success: false,
      reason: 'User has not started bot conversation',
      claimUrl
    };
  }
  
  try {
    const message = 
      `💰 You received ${amount} ETH${senderHandle ? ` from @${senderHandle}` : ''}!\n\n` +
      `Go to PingPay to withdraw to your wallet.`;
    
    await bot.sendMessage(chatId, message);
    
    console.log(`✅ Notification sent to @${recipientHandle}`);
    return { success: true, claimUrl };
  } catch (error) {
    console.error(`Failed to send notification to @${recipientHandle}:`, error.message);
    return { success: false, reason: error.message };
  }
}

// Get bot instance
function getBot() {
  return bot;
}

module.exports = {
  initTelegramBot,
  sendClaimNotification,
  getBot
};
