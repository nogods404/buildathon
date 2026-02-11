const API_BASE = import.meta.env.VITE_API_URL || "/api";

async function request(endpoint, options = {}) {
	const response = await fetch(`${API_BASE}${endpoint}`, {
		headers: {
			"Content-Type": "application/json",
			...options.headers,
		},
		...options,
	});

	const data = await response.json();

	if (!response.ok) {
		const errorMsg = data.details
			? `${data.error}: ${data.details}`
			: data.error || "Request failed";
		throw new Error(errorMsg);
	}

	return data;
}

export const api = {
	// Wallet endpoints
	getBalance: (address) => request(`/wallets/balance/${address}`),
	getWalletByHandle: (handle) => request(`/wallets/handle/${handle}`),
	createWallet: (handle) =>
		request("/wallets/create", {
			method: "POST",
			body: JSON.stringify({ handle }),
		}),

	// Transfer endpoints
	parseCommand: (command) =>
		request("/transfers/parse", {
			method: "POST",
			body: JSON.stringify({ command }),
		}),
	prepareTransfer: (data) =>
		request("/transfers/prepare", {
			method: "POST",
			body: JSON.stringify(data),
		}),
	confirmTransfer: (transferId, txHash, senderAddress) =>
		request("/transfers/confirm", {
			method: "POST",
			body: JSON.stringify({ transferId, txHash, senderAddress }),
		}),
	estimateGas: (recipient, amount, senderAddress) =>
		request("/transfers/estimate", {
			method: "POST",
			body: JSON.stringify({ recipient, amount, senderAddress }),
		}),
	getTransfer: (id) => request(`/transfers/${id}`),
	getHistory: (address) => request(`/transfers/history/${address}`),
	getHistoryByHandle: (handle) => request(`/transfers/handle/${handle}`),

	// Claim endpoints
	getClaim: (token) => request(`/claims/${token}`),
	verifyClaim: (token, handle) =>
		request(`/claims/${token}/verify`, {
			method: "POST",
			body: JSON.stringify({ handle }),
		}),
	getClaimWallet: (handle) => request(`/claims/wallet/${handle}`),
	getPendingClaims: (handle) => request(`/claims/pending/${handle}`),
	withdraw: (handle, toAddress, amount, withdrawMax = false) =>
		request("/claims/withdraw", {
			method: "POST",
			body: JSON.stringify({ handle, toAddress, amount, withdrawMax }),
		}),
};
