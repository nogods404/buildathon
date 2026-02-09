const { ethers } = require('ethers');

// Initialize provider
function getProvider() {
  return new ethers.JsonRpcProvider(process.env.RPC_URL);
}

// Create a new wallet for recipient
function createNewWallet() {
  const wallet = ethers.Wallet.createRandom();
  return {
    address: wallet.address,
    privateKey: wallet.privateKey
  };
}

// Get wallet from private key
function getWalletFromPrivateKey(privateKey) {
  const provider = getProvider();
  return new ethers.Wallet(privateKey, provider);
}

// Get ETH balance for an address
async function getEthBalance(address) {
  try {
    const provider = getProvider();
    const balance = await provider.getBalance(address);
    return ethers.formatEther(balance);
  } catch (error) {
    console.error('Error getting ETH balance:', error);
    return '0';
  }
}

// Verify a transaction was sent to the correct address with correct amount
async function verifyTransaction(txHash, expectedTo, expectedAmount) {
  try {
    const provider = getProvider();
    
    console.log(`Verifying tx: ${txHash}`);
    console.log(`Expected to: ${expectedTo}, amount: ${expectedAmount} ETH`);
    
    // Get transaction - retry a few times as it may not be immediately available
    let tx = null;
    for (let i = 0; i < 10; i++) {
      tx = await provider.getTransaction(txHash);
      if (tx) break;
      console.log(`Transaction not found, retrying in 2s... (${i + 1}/10)`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    if (!tx) {
      return { success: false, error: 'Transaction not found after retries' };
    }
    
    // Wait for confirmation (at least 1 block)
    console.log('Waiting for transaction confirmation...');
    const receipt = await tx.wait(1);
    
    if (receipt.status !== 1) {
      return { success: false, error: 'Transaction failed on chain' };
    }
    
    console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
    
    // Verify recipient and amount
    const actualTo = tx.to?.toLowerCase();
    const actualAmount = ethers.formatEther(tx.value);
    
    console.log(`Actual to: ${actualTo}, amount: ${actualAmount} ETH`);
    
    if (actualTo !== expectedTo.toLowerCase()) {
      return { success: false, error: `Wrong recipient: expected ${expectedTo}, got ${actualTo}` };
    }
    
    if (parseFloat(actualAmount) < parseFloat(expectedAmount) * 0.99) { // Allow 1% tolerance for rounding
      return { success: false, error: `Amount too low: expected ${expectedAmount}, got ${actualAmount}` };
    }
    
    return {
      success: true,
      from: tx.from,
      to: actualTo,
      amount: actualAmount,
      blockNumber: receipt.blockNumber,
      txHash: txHash
    };
  } catch (error) {
    console.error('Error verifying transaction:', error);
    return { success: false, error: error.message };
  }
}

// Send ETH from a wallet (for withdrawals)
async function sendEthFromWallet(privateKey, toAddress, amount) {
  try {
    const wallet = getWalletFromPrivateKey(privateKey);
    
    const amountInWei = ethers.parseEther(amount.toString());
    
    console.log(`Sending ${amount} ETH to ${toAddress}`);
    
    // Send transaction
    const tx = await wallet.sendTransaction({
      to: toAddress,
      value: amountInWei
    });
    
    console.log(`Transaction sent: ${tx.hash}`);
    
    // Wait for confirmation
    const receipt = await tx.wait();
    console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
    
    return {
      success: true,
      txHash: tx.hash,
      amount: amount.toString(),
      blockNumber: receipt.blockNumber
    };
  } catch (error) {
    console.error('Error sending ETH:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Send maximum ETH from a wallet (balance minus gas)
async function sendMaxEthFromWallet(privateKey, toAddress) {
  try {
    const wallet = getWalletFromPrivateKey(privateKey);
    const provider = getProvider();
    
    // Get current balance
    const balance = await provider.getBalance(wallet.address);
    
    // Get fee data
    const feeData = await provider.getFeeData();
    
    // Use maxFeePerGas with 100% buffer
    const maxFeePerGas = feeData.maxFeePerGas ? feeData.maxFeePerGas * 2n : feeData.gasPrice * 2n;
    // maxPriorityFeePerGas must be <= maxFeePerGas
    const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas 
      ? (feeData.maxPriorityFeePerGas > maxFeePerGas ? maxFeePerGas : feeData.maxPriorityFeePerGas)
      : maxFeePerGas / 10n;
    
    // Estimate gas for this specific transaction
    const gasEstimate = await provider.estimateGas({
      from: wallet.address,
      to: toAddress,
      value: 1n // placeholder value
    });
    const gasLimit = gasEstimate * 12n / 10n; // 20% buffer on gas limit
    
    const gasCost = gasLimit * maxFeePerGas;
    
    // Calculate amount to send (balance - gas)
    const amountToSend = balance - gasCost;
    
    if (amountToSend <= 0n) {
      return {
        success: false,
        error: 'Balance too low to cover gas fees'
      };
    }
    
    console.log(`Balance: ${ethers.formatEther(balance)} ETH`);
    console.log(`Gas limit: ${gasLimit}, maxFeePerGas: ${maxFeePerGas}`);
    console.log(`Gas cost estimate: ${ethers.formatEther(gasCost)} ETH`);
    console.log(`Sending: ${ethers.formatEther(amountToSend)} ETH to ${toAddress}`);
    
    // Send transaction with EIP-1559 parameters
    const tx = await wallet.sendTransaction({
      to: toAddress,
      value: amountToSend,
      gasLimit: gasLimit,
      maxFeePerGas: maxFeePerGas,
      maxPriorityFeePerGas: maxPriorityFeePerGas
    });
    
    console.log(`Transaction sent: ${tx.hash}`);
    
    // Wait for confirmation
    const receipt = await tx.wait();
    console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
    
    return {
      success: true,
      txHash: tx.hash,
      amount: ethers.formatEther(amountToSend),
      blockNumber: receipt.blockNumber
    };
  } catch (error) {
    console.error('Error sending max ETH:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Estimate gas for ETH transfer
async function estimateGas(fromAddress, toAddress, amount) {
  try {
    const provider = getProvider();
    
    // Standard ETH transfer gas
    const gasLimit = 21000n;
    
    const feeData = await provider.getFeeData();
    const gasCost = gasLimit * feeData.gasPrice;
    
    return {
      gasLimit: gasLimit.toString(),
      gasPrice: ethers.formatUnits(feeData.gasPrice, 'gwei'),
      estimatedCost: ethers.formatEther(gasCost)
    };
  } catch (error) {
    console.error('Error estimating gas:', error);
    return {
      gasLimit: '21000',
      gasPrice: '0.1',
      estimatedCost: '0.00001'
    };
  }
}

// Get explorer URL for transaction
function getExplorerUrl(txHash) {
  return `https://sepolia.arbiscan.io/tx/${txHash}`;
}

module.exports = {
  getProvider,
  createNewWallet,
  getWalletFromPrivateKey,
  getEthBalance,
  verifyTransaction,
  sendEthFromWallet,
  sendMaxEthFromWallet,
  estimateGas,
  getExplorerUrl
};
