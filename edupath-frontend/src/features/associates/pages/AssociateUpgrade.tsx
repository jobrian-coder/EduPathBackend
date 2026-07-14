import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Sparkles, Lock, CreditCard, ShieldCheck, CheckCircle2,
  Coins, Loader, X, ArrowLeft, Globe, MapPin
} from 'lucide-react'
import api from '../../../services/api'
import type { Associate } from '../../../services/api'

export default function AssociateUpgrade() {
  const navigate = useNavigate()

  const [associate, setAssociate] = useState<Associate | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Subscription states
  const [selectedTier, setSelectedTier] = useState<'FREE' | 'STANDARD' | 'PREMIUM'>('STANDARD')
  const [activePaymentTab, setActivePaymentTab] = useState<'mpesa' | 'card' | 'paypal'>('mpesa')
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [mpesaPhone, setMpesaPhone] = useState('')
  const [paymentMsg, setPaymentMsg] = useState('')

  // Card fields
  const [cardName, setCardName] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvc, setCvc] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const assoc = await api.associates.getMe()
        setAssociate(assoc)
        setMpesaPhone(assoc.website || '') // placeholder or fallback
      } catch {
        navigate('/associates/dashboard')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [navigate])

  const handleUpgrade = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setIsProcessingPayment(true)
    setPaymentMsg(activePaymentTab === 'mpesa' ? 'Initiating M-Pesa STK Push...' : 'Authorizing secure transaction...')
    
    // Simulate transaction delay
    setTimeout(async () => {
      try {
        const updated = await api.associates.upgradeTier(selectedTier)
        setAssociate(updated)
        setPaymentSuccess(true)
        setTimeout(() => {
          setPaymentSuccess(false)
          navigate('/associates/dashboard')
        }, 2000)
      } catch (err: any) {
        alert(err?.message || 'Payment simulation failed. Please try again.')
        setIsProcessingPayment(false)
      }
    }, 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!associate) return null

  return (
    <div className="min-h-screen bg-slate-950 text-white py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Back Link */}
        <button
          onClick={() => navigate('/associates/dashboard')}
          className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        {/* Heading */}
        <div className="text-center space-y-2">
          <span className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
            Premium Associate Upgrades
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Choose Your Growth Plan
          </h1>
          <p className="text-slate-400 text-sm max-w-xl mx-auto leading-relaxed">
            Upgrade your associate space to reach thousands of students, unlock advanced resource uploads, and publish events.
          </p>
        </div>

        {paymentSuccess ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-16 text-center space-y-6 shadow-2xl">
            <div className="inline-flex p-4 bg-emerald-500/10 rounded-full border border-emerald-500/20 text-emerald-400 animate-bounce">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-white">Plan Upgraded Successfully!</h3>
              <p className="text-slate-400 text-sm max-w-md mx-auto">
                Your associate profile is upgraded to the **{selectedTier}** plan. Redirecting you back to your dashboard...
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800">
              
              {/* Left Side: Pricing details */}
              <div className="p-8 sm:p-10 bg-slate-900/40 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="text-sm font-semibold text-slate-400">
                    Current Plan: <span className="text-white uppercase font-bold">{associate.tier}</span>
                  </div>

                  <div className="space-y-3">
                    {[
                      {
                        value: 'STANDARD',
                        title: 'Standard Plan',
                        price: 'KES 1,000/mo',
                        desc: 'Up to 10 posts/mo, all post types unlocked.',
                      },
                      {
                        value: 'PREMIUM',
                        title: 'Premium Plan',
                        price: 'KES 2,500/mo',
                        desc: 'Unlimited posts/mo, priority hub feeds.',
                      },
                    ].map(plan => (
                      <button
                        key={plan.value}
                        onClick={() => setSelectedTier(plan.value as any)}
                        disabled={isProcessingPayment}
                        className={`w-full text-left p-4 rounded-xl border transition-all ${
                          selectedTier === plan.value
                            ? 'border-yellow-500 bg-yellow-500/5 shadow-md'
                            : 'border-slate-800 bg-slate-950/20 hover:border-slate-700 text-slate-350'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-white text-sm">{plan.title}</span>
                          <span className="text-sm font-bold text-yellow-400">{plan.price}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">{plan.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-6 space-y-3">
                  <div className="flex items-center gap-2.5 text-xs text-slate-400">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Unlock Opportunities, Events, and Resources</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-400">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Reach verified students matching your hubs</span>
                  </div>
                </div>
              </div>

              {/* Right Side: Payment Form */}
              <div className="p-8 sm:p-10 space-y-6 flex flex-col justify-between">
                <h4 className="font-bold text-white text-base">Select Payment Method</h4>

                {/* Tabs */}
                <div className="grid grid-cols-3 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  {(['mpesa', 'card', 'paypal'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActivePaymentTab(tab)}
                      disabled={isProcessingPayment}
                      className={`py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${
                        activePaymentTab === tab
                          ? 'bg-slate-800 text-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-350'
                      }`}
                    >
                      {tab === 'mpesa' ? 'M-Pesa' : tab === 'card' ? 'Card' : 'PayPal'}
                    </button>
                  ))}
                </div>

                <div className="min-h-[180px] flex flex-col justify-center">
                  {activePaymentTab === 'mpesa' && (
                    <form onSubmit={handleUpgrade} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-400">
                          M-Pesa Phone Number
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 0712345678"
                          required
                          disabled={isProcessingPayment}
                          value={mpesaPhone}
                          onChange={e => setMpesaPhone(e.target.value)}
                          className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-800 bg-slate-950 text-white focus:ring-2 focus:ring-yellow-500 focus:outline-none placeholder-slate-650 transition-all"
                        />
                      </div>
                      
                      {isProcessingPayment ? (
                        <div className="p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-xl flex items-center gap-3">
                          <Loader className="w-5 h-5 animate-spin text-yellow-400 flex-shrink-0" />
                          <span className="text-xs text-slate-350">{paymentMsg}</span>
                        </div>
                      ) : (
                        <button
                          type="submit"
                          className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                        >
                          Pay via M-Pesa
                        </button>
                      )}
                    </form>
                  )}

                  {activePaymentTab === 'card' && (
                    <form onSubmit={handleUpgrade} className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-400">Cardholder Name</label>
                        <input
                          type="text"
                          required
                          placeholder="Name on card"
                          disabled={isProcessingPayment}
                          value={cardName}
                          onChange={e => setCardName(e.target.value)}
                          className="w-full px-3.5 py-1.5 text-xs rounded-lg border border-slate-800 bg-slate-950 text-white focus:ring-2 focus:ring-yellow-500 focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-400">Card Number</label>
                          <input
                            type="text"
                            required
                            placeholder="0000 0000 0000 0000"
                            disabled={isProcessingPayment}
                            value={cardNumber}
                            onChange={e => setCardNumber(e.target.value)}
                            className="w-full px-3.5 py-1.5 text-xs rounded-lg border border-slate-800 bg-slate-950 text-white focus:ring-2 focus:ring-yellow-500 focus:outline-none"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-400">Expiry</label>
                            <input
                              type="text"
                              required
                              placeholder="MM/YY"
                              disabled={isProcessingPayment}
                              value={expiry}
                              onChange={e => setExpiry(e.target.value)}
                              className="w-full px-3.5 py-1.5 text-xs rounded-lg border border-slate-800 bg-slate-950 text-white focus:ring-2 focus:ring-yellow-500 focus:outline-none text-center"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-400">CVC</label>
                            <input
                              type="password"
                              required
                              placeholder="***"
                              disabled={isProcessingPayment}
                              value={cvc}
                              onChange={e => setCvc(e.target.value)}
                              className="w-full px-3.5 py-1.5 text-xs rounded-lg border border-slate-800 bg-slate-950 text-white focus:ring-2 focus:ring-yellow-500 focus:outline-none text-center"
                            />
                          </div>
                        </div>
                      </div>

                      {isProcessingPayment ? (
                        <div className="p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-xl flex items-center gap-3">
                          <Loader className="w-5 h-5 animate-spin text-yellow-400 flex-shrink-0" />
                          <span className="text-xs text-slate-355">{paymentMsg}</span>
                        </div>
                      ) : (
                        <button
                          type="submit"
                          className="w-full py-3 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                        >
                          <CreditCard className="w-4 h-4" /> Pay with Card
                        </button>
                      )}
                    </form>
                  )}

                  {activePaymentTab === 'paypal' && (
                    <div className="space-y-4 text-center">
                      <p className="text-xs text-slate-500">
                        Complete your subscription upgrade instantly via PayPal checkout.
                      </p>
                      {isProcessingPayment ? (
                        <div className="p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-xl flex items-center justify-center gap-3">
                          <Loader className="w-5 h-5 animate-spin text-yellow-400 flex-shrink-0" />
                          <span className="text-xs text-slate-350">{paymentMsg}</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleUpgrade()}
                          className="w-full py-3 bg-[#FFC439] hover:bg-[#F2B522] text-[#003087] rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                        >
                          <Coins className="w-4.5 h-4.5" /> Pay with PayPal
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 text-[10px] text-slate-550 justify-center">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Secure SSL Encrypted Transaction</span>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  )
}
