import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Gift, 
  Check, 
  CheckCheck,
  Loader2, 
  ArrowRight, 
  Wallet,
  TrendingUp,
  Send,
  ExternalLink,
  AlertCircle
} from 'lucide-react'
import { api } from '../utils/api'

export default function ClaimPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [claim, setClaim] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [handle, setHandle] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [claimed, setClaimed] = useState(false)
  const [walletInfo, setWalletInfo] = useState(null)

  useEffect(() => {
    loadClaim()
  }, [token])

  async function loadClaim() {
    try {
      const data = await api.getClaim(token)
      setClaim(data.claim)
      
      if (data.claim.status === 'claimed') {
        setClaimed(true)
      }
    } catch (err) {
      setError('This claim link is invalid or has expired.')
    } finally {
      setLoading(false)
    }
  }

  async function handleClaim() {
    if (!handle.trim()) {
      setError('Please enter your Telegram handle')
      return
    }
    
    setVerifying(true)
    setError('')
    
    try {
      const result = await api.verifyClaim(token, handle.replace('@', ''))
      
      if (result.alreadyClaimed) {
        setClaimed(true)
      } else if (result.claimed) {
        setClaimed(true)
        setWalletInfo(result.wallet)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setVerifying(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-950">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    )
  }

  if (error && !claim) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-dark-950 p-4">
        <div className="glass rounded-2xl p-6 max-w-sm w-full text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-xl font-bold mb-2">Invalid Link</h1>
          <p className="text-dark-400">{error}</p>
        </div>
      </div>
    )
  }

  if (claimed) {
    return (
      <div className="min-h-screen flex flex-col bg-dark-950 safe-top safe-bottom">
        {/* Success Header */}
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6 animate-pulse-slow">
            <CheckCheck className="w-10 h-10 text-emerald-400" />
          </div>
          
          <h1 className="text-2xl font-bold mb-2">Payment Claimed!</h1>
          <p className="text-dark-400 text-center mb-6">
            You've successfully claimed your ETH
          </p>
          
          {/* Balance Card */}
          <div className="glass rounded-2xl p-6 max-w-sm w-full mb-6">
            <p className="text-sm text-dark-400 mb-2 text-center">Your Balance</p>
            <p className="text-4xl font-bold text-center gradient-text">
              ${parseFloat(walletInfo?.balance || claim?.currentBalance || claim?.amount).toFixed(2)}
            </p>
            <p className="text-xs text-dark-500 text-center mt-2">ETH on Arbitrum</p>
          </div>
          
          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-3 max-w-sm w-full">
            <button className="glass rounded-xl p-4 flex flex-col items-center gap-2 hover:bg-white/10 transition-colors">
              <Send className="w-6 h-6 text-primary-400" />
              <span className="text-xs">Send</span>
            </button>
            <button className="glass rounded-xl p-4 flex flex-col items-center gap-2 opacity-50 cursor-not-allowed">
              <Wallet className="w-6 h-6 text-dark-400" />
              <span className="text-xs text-dark-400">Withdraw</span>
              <span className="text-[10px] text-dark-500">Soon</span>
            </button>
            <button className="glass rounded-xl p-4 flex flex-col items-center gap-2 opacity-50 cursor-not-allowed">
              <TrendingUp className="w-6 h-6 text-dark-400" />
              <span className="text-xs text-dark-400">Earn</span>
              <span className="text-[10px] text-dark-500">Soon</span>
            </button>
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4">
          <div className="glass rounded-xl p-3 flex items-center justify-center gap-2">
            <img src="/logo.svg" alt="PingPay" className="w-5 h-5" />
            <span className="text-sm text-dark-400">Powered by PingPay</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-dark-950 safe-top safe-bottom">
      {/* Header */}
      <header className="p-4 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <img src="/logo.svg" alt="PingPay" className="w-8 h-8" />
          <span className="text-xl font-bold gradient-text">PingPay</span>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {/* Gift Animation */}
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500/30 to-indigo-500/30 flex items-center justify-center mb-6 animate-pulse-slow">
          <Gift className="w-12 h-12 text-primary-400" />
        </div>
        
        <h1 className="text-2xl font-bold mb-2">You received</h1>
        <p className="text-5xl font-bold gradient-text mb-2">
          ${parseFloat(claim?.amount || 0).toFixed(2)}
        </p>
        <p className="text-dark-400 mb-1">ETH</p>
        {claim?.senderHandle && (
          <p className="text-sm text-dark-500">from @{claim.senderHandle}</p>
        )}
        
        {/* Transaction Link */}
        {claim?.txHash && (
          <a
            href={`https://sepolia.arbiscan.io/tx/${claim.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 mt-2 text-xs text-primary-400 hover:underline"
          >
            View transaction <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      {/* Claim Form */}
      <div className="p-4">
        {error && (
          <div className="mb-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}
        
        <div className="glass rounded-2xl p-4">
          <p className="text-sm text-dark-400 mb-3">
            Enter your Telegram handle to claim
          </p>
          
          <div className="flex items-center gap-2 mb-4">
            <div className="flex-1 glass rounded-xl p-3">
              <input
                type="text"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="@username"
                className="w-full bg-transparent text-white placeholder-dark-500 outline-none"
              />
            </div>
          </div>
          
          <button
            onClick={handleClaim}
            disabled={verifying || !handle.trim()}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-primary-500 to-indigo-500 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
          >
            {verifying ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                Claim <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
        
        <p className="text-xs text-dark-500 text-center mt-4">
          By claiming, you agree to PingPay's terms of service
        </p>
      </div>
    </div>
  )
}
