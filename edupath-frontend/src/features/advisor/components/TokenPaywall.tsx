import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, Loader, GraduationCap, CheckCircle2, Lock, 
  CreditCard, ShieldCheck, Coins, Wallet, LogIn 
} from 'lucide-react';
import api, { type User } from '../../../services/api';

interface TokenPaywallProps {
  user: User | null;
  onPaymentSuccess: (newBalance: number) => void;
}

export const TokenPaywall: React.FC<TokenPaywallProps> = ({ user, onPaymentSuccess }) => {
  const [activeTab, setActiveTab] = useState<'mpesa' | 'card' | 'paypal'>('mpesa');
  
  // M-Pesa states
  const [mpesaPhone, setMpesaPhone] = useState(user?.phone_number || '');
  const [isProcessingMpesa, setIsProcessingMpesa] = useState(false);
  const [mpesaStatusMsg, setMpesaStatusMsg] = useState('');
  const [mpesaTimer, setMpesaTimer] = useState(15);
  
  // Card states
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [cardName, setCardName] = useState('');
  const [isProcessingCard, setIsProcessingCard] = useState(false);
  
  // PayPal states
  const [isProcessingPaypal, setIsProcessingPaypal] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Sync phone number
  useEffect(() => {
    if (user?.phone_number) {
      setMpesaPhone(user.phone_number);
    }
  }, [user]);

  // M-Pesa STK countdown simulator
  useEffect(() => {
    let interval: any;
    if (isProcessingMpesa && mpesaTimer > 0) {
      interval = setInterval(() => {
        setMpesaTimer(prev => prev - 1);
      }, 1000);
    } else if (mpesaTimer === 0 && isProcessingMpesa) {
      handleCompletePayment('mpesa');
    }
    return () => clearInterval(interval);
  }, [isProcessingMpesa, mpesaTimer]);

  const handleMpesaPay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mpesaPhone) return;
    setIsProcessingMpesa(true);
    setMpesaTimer(15);
    setMpesaStatusMsg('Initiating M-Pesa Daraja STK Push...');
    
    setTimeout(() => {
      setMpesaStatusMsg('STK Push sent! Please enter your PIN on your phone.');
    }, 2000);
  };

  const handleCardPay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardNumber || !expiry || !cvc || !cardName) return;
    setIsProcessingCard(true);
    
    setTimeout(() => {
      handleCompletePayment('card');
    }, 3000);
  };

  const handlePaypalPay = () => {
    setIsProcessingPaypal(true);
    setTimeout(() => {
      handleCompletePayment('paypal');
    }, 2000);
  };

  const handleCompletePayment = async (method: string) => {
    try {
      const res = await api.auth.purchaseTrial(method, method === 'mpesa' ? mpesaPhone : undefined, 45);
      setIsSuccess(true);
      setTimeout(() => {
        onPaymentSuccess(res.ai_trials_balance);
        setIsProcessingMpesa(false);
        setIsProcessingCard(false);
        setIsProcessingPaypal(false);
        setIsSuccess(false);
      }, 1500);
    } catch (err) {
      console.error(err);
      alert('Payment processing failed. Please try again.');
      setIsProcessingMpesa(false);
      setIsProcessingCard(false);
      setIsProcessingPaypal(false);
    }
  };

  // Input formatters
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').substring(0, 16);
    const formatted = val.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').substring(0, 4);
    if (val.length >= 3) {
      setExpiry(`${val.substring(0, 2)}/${val.substring(2)}`);
    } else {
      setExpiry(val);
    }
  };

  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').substring(0, 3);
    setCvc(val);
  };

  if (isSuccess) {
    return (
      <div className="p-16 text-center space-y-6">
        <div className="inline-flex p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-full border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 animate-bounce">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Payment Verified!</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto">
            1 Trial Token has been added to your account. Unlocking your session...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-850 bg-white dark:bg-slate-900">
      {/* Left side: Package & Details */}
      <div className="p-8 sm:p-10 space-y-6 bg-slate-50/50 dark:bg-slate-900/10 flex flex-col justify-center">
        <div className="space-y-2">
          <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 border border-teal-200/50 dark:border-teal-800">
            Secure checkout
          </span>
          <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">EduGuide AI Trial Token</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
            To cover API and advanced database indexing cost, every new career analysis session consumes one trial token.
          </p>
        </div>

        {/* Price Tag */}
        <div className="bg-white dark:bg-slate-800 border-2 border-teal-500 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <span className="font-bold text-slate-800 dark:text-white text-base">Single Trial Token</span>
            <div className="text-right">
              <div className="text-2xl font-extrabold text-teal-600 dark:text-teal-400">KES 45</div>
              <div className="text-xs text-slate-400 dark:text-slate-500">~ $0.45 USD</div>
            </div>
          </div>
          <div className="border-t border-slate-100 dark:border-slate-700/50 pt-3 space-y-2.5">
            {[
              'Full 10-Question Adaptive Interview',
              'Top 5 Kenyan University Matches',
              'KCSE Academic Eligibility Filter',
              'PDF Career Report Export',
              '24/7 AI Advisor Chat Session'
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 justify-center">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Secure SSL Encrypted Transaction</span>
        </div>
      </div>

      {/* Right side: Payment form */}
      <div className="p-8 sm:p-10 space-y-6">
        <h4 className="font-bold text-slate-800 dark:text-white text-lg">Select Payment Method</h4>
        
        {/* Payment tabs */}
        <div className="grid grid-cols-3 gap-2 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
          {(['mpesa', 'card', 'paypal'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              disabled={isProcessingMpesa || isProcessingCard || isProcessingPaypal}
              className={`py-2 text-xs font-bold rounded-lg transition-all capitalize ${
                activeTab === tab
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {tab === 'mpesa' ? 'M-Pesa' : tab === 'card' ? 'Card' : 'PayPal'}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="min-h-[220px] flex flex-col justify-between">
          {activeTab === 'mpesa' && (
            <form onSubmit={handleMpesaPay} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  M-Pesa Mobile Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. 0712345678"
                  required
                  value={mpesaPhone}
                  onChange={(e) => setMpesaPhone(e.target.value)}
                  disabled={isProcessingMpesa}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:outline-none transition-all"
                />
                <p className="text-[10px] text-slate-400 dark:text-slate-500">
                  A Daraja STK Push PIN request will be sent to this phone.
                </p>
              </div>

              {isProcessingMpesa ? (
                <div className="p-4 bg-teal-50/50 dark:bg-slate-800 border border-teal-100 dark:border-teal-900/50 rounded-xl space-y-3">
                  <div className="flex items-center gap-2.5">
                    <Loader className="w-4.5 h-4.5 animate-spin text-teal-600 dark:text-teal-400" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {mpesaStatusMsg}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-teal-500 h-full transition-all duration-1000"
                      style={{ width: `${(15 - mpesaTimer) * 6.67}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 text-right">
                    Waiting for M-Pesa response... {mpesaTimer}s
                  </p>
                </div>
              ) : (
                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                >
                  Pay KES 45 via M-Pesa
                </button>
              )}
            </form>
          )}

          {activeTab === 'card' && (
            <form onSubmit={handleCardPay} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Cardholder Name</label>
                <input
                  type="text"
                  placeholder="Name on card"
                  required
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  disabled={isProcessingCard}
                  className="w-full px-3.5 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Card Number</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="0000 0000 0000 0000"
                    required
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    disabled={isProcessingCard}
                    className="w-full pl-3.5 pr-10 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                  <CreditCard className="w-4 h-4 text-slate-400 absolute right-3.5 top-2.5" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Expiry Date</label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    required
                    value={expiry}
                    onChange={handleExpiryChange}
                    disabled={isProcessingCard}
                    className="w-full px-3.5 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-none text-center"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">CVC</label>
                  <input
                    type="password"
                    placeholder="***"
                    required
                    value={cvc}
                    onChange={handleCvcChange}
                    disabled={isProcessingCard}
                    className="w-full px-3.5 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-none text-center"
                  />
                </div>
              </div>

              <div className="pt-2">
                {isProcessingCard ? (
                  <button
                    type="button"
                    disabled
                    className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                  >
                    <Loader className="w-4 h-4 animate-spin text-teal-600" />
                    Processing Secure Card Checkout...
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <CreditCard className="w-4 h-4" />
                    Pay $0.45 USD Securely
                  </button>
                )}
              </div>
            </form>
          )}

          {activeTab === 'paypal' && (
            <div className="space-y-6 flex flex-col justify-center items-center h-full">
              <p className="text-xs text-slate-500 text-center">
                Pay instantly using your PayPal balance, bank account, or credit cards.
              </p>
              {isProcessingPaypal ? (
                <button
                  disabled
                  className="w-full py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                >
                  <Loader className="w-4 h-4 animate-spin text-teal-600" />
                  Authorizing PayPal Transaction...
                </button>
              ) : (
                <button
                  onClick={handlePaypalPay}
                  className="w-full py-3.5 bg-[#FFC439] hover:bg-[#F2B522] text-[#003087] rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Coins className="w-4.5 h-4.5" />
                  Pay with PayPal ($0.45)
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface AuthGateProps {
  onLearnMore: () => void;
}

export const AuthGate: React.FC<AuthGateProps> = ({ onLearnMore }) => {
  const navigate = useNavigate();
  return (
    <div className="p-8 sm:p-12 text-center max-w-xl mx-auto space-y-6 bg-white dark:bg-slate-900">
      <div className="inline-flex p-4 bg-teal-50 dark:bg-teal-900/30 rounded-full border border-teal-200 dark:border-teal-800 text-teal-600 dark:text-teal-400 mb-2">
        <Lock className="w-10 h-10 animate-pulse" />
      </div>
      <div className="space-y-2">
        <div className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-200 mb-2">
          🎁 Free Demo Trial Included
        </div>
        <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Unlock EduGuide AI Advisor</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
          Access specialized matches from 2,000+ university programs. All registered users receive **1 Free Demo Session** to explore recommended fields.
        </p>
      </div>
      <div className="pt-4 flex flex-col sm:flex-row justify-center gap-3">
        <button
          onClick={() => navigate('/auth?redirect=/advisor')}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-full font-semibold shadow-md shadow-teal-500/25 transition-all hover:scale-105 active:scale-95"
        >
          <LogIn className="w-4 h-4" /> Log In / Register
        </button>
        <button
          onClick={onLearnMore}
          className="inline-flex items-center justify-center px-6 py-3 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full font-semibold transition-all"
        >
          Learn More
        </button>
      </div>
    </div>
  );
};
