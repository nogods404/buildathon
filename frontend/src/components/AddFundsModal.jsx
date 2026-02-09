import { useState } from 'react'
import { X, Copy, Check, QrCode } from 'lucide-react'

export default function AddFundsModal({ address, onClose }) {
  const [copied, setCopied] = useState(false)

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg glass rounded-t-3xl p-6 animate-slide-up safe-bottom">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Add Funds</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Instructions */}
        <p className="text-dark-400 mb-4 text-center">
          Send USDC on <span className="text-primary-400">Arbitrum Sepolia</span> to this address
        </p>

        {/* QR Code Placeholder */}
        <div className="flex justify-center mb-6">
          <div className="w-48 h-48 rounded-2xl bg-white p-3 flex items-center justify-center">
            <div className="w-full h-full rounded-xl bg-dark-100 flex items-center justify-center">
              <QrCode className="w-16 h-16 text-dark-400" />
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="glass rounded-xl p-4 mb-6">
          <p className="text-xs text-dark-400 mb-2">Wallet Address</p>
          <div className="flex items-center justify-between gap-2">
            <p className="font-mono text-sm truncate flex-1">{address}</p>
            <button
              onClick={copyAddress}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
            >
              {copied ? (
                <Check className="w-5 h-5 text-emerald-400" />
              ) : (
                <Copy className="w-5 h-5 text-dark-400" />
              )}
            </button>
          </div>
        </div>

        {/* Network Badge */}
        <div className="flex justify-center">
          <div className="px-4 py-2 rounded-full glass text-sm">
            <span className="text-dark-400">Network:</span>{' '}
            <span className="text-emerald-400">Arbitrum Sepolia (Testnet)</span>
          </div>
        </div>

        {/* Faucet Link */}
        <p className="text-xs text-dark-500 text-center mt-4">
          Need testnet USDC?{' '}
          <a 
            href="https://faucet.circle.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary-400 hover:underline"
          >
            Get from Circle Faucet
          </a>
        </p>
      </div>
    </div>
  )
}
