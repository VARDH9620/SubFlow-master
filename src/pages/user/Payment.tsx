import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  CreditCard, Lock, CheckCircle, ArrowLeft, ArrowRight, Shield,
  Plus, Trash2, Star, Wallet, Building, Loader2, AlertCircle,
  Sparkles, FileText, Download, ChevronRight, KeyRound, Clock, BadgeCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import * as db from '../../db/database';
import { Card, Button, Input, Badge, PageHeader, EmptyState } from '../../components/ui';
import { CreditCardVisual } from '../../components/ui/CreditCard';
import { generateInvoicePDF } from '../../utils/invoicePdf';
import type { Invoice, PaymentMethod, Payment } from '../../types';
import emailjs from '@emailjs/browser';

type Step = 'select' | 'method' | 'details' | 'otp' | 'processing' | 'success' | 'failure';

function detectBrand(number: string): string {
  const clean = number.replace(/\s/g, '');
  if (/^4/.test(clean)) return 'visa';
  if (/^5[1-5]/.test(clean)) return 'mastercard';
  if (/^3[47]/.test(clean)) return 'amex';
  if (/^6(?:011|5)/.test(clean)) return 'discover';
  return 'unknown';
}

function formatCardNumber(value: string): string {
  const clean = value.replace(/\D/g, '').slice(0, 16);
  return clean.match(/.{1,4}/g)?.join(' ') || '';
}

function getBrandName(brand?: string) {
  switch (brand) {
    case 'visa': return 'Visa';
    case 'mastercard': return 'Mastercard';
    case 'amex': return 'American Express';
    case 'discover': return 'Discover';
    default: return 'Card';
  }
}

// ====================================================================
// MAIN COMPONENT
// ====================================================================
export default function PaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, addToast } = useAuth();

  // --- Data ---
  const [pendingInvoices, setPendingInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [savedMethods, setSavedMethods] = useState<PaymentMethod[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<Payment[]>([]);
  const [activeTab, setActiveTab] = useState<'pay' | 'methods' | 'history'>('pay');

  // --- Steps ---
  const [step, setStep] = useState<Step>('select');
  const [paymentType, setPaymentType] = useState<'saved' | 'card' | 'paypal' | 'bank'>('card');
  const [selectedSavedId, setSelectedSavedId] = useState('');

  // --- Card form ---
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [cvv, setCvv] = useState('');
  const [saveCard, setSaveCard] = useState(false);
  const [billingAddress, setBillingAddress] = useState('');
  const [billingCity, setBillingCity] = useState('');
  const [billingState, setBillingState] = useState('');
  const [billingZip, setBillingZip] = useState('');
  const [billingCountry, setBillingCountry] = useState('US');
  const [isFlipped, setIsFlipped] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // --- OTP ---
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [otpResendTimer, setOtpResendTimer] = useState(30);
  const [paymentOtp, setPaymentOtp] = useState('');
  const [emailSending, setEmailSending] = useState(false);

  // --- Result ---
  const [completedPayment, setCompletedPayment] = useState<Payment | null>(null);

  const brand = detectBrand(cardNumber);

  // ---- Load data ----
  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      const allInvoices = await db.getInvoicesByUser(user.id);
      const invoices = allInvoices.filter(i => i.status === 'pending');
      setPendingInvoices(invoices);
      const navInvoice = (location.state as { invoice?: Invoice })?.invoice;
      if (navInvoice && navInvoice.status === 'pending') {
        setSelectedInvoice(navInvoice);
        setStep('method');
      } else if (invoices.length > 0) {
        setSelectedInvoice(invoices[0]);
      }
      const methods = await db.getPaymentMethods(user.id);
      setSavedMethods(methods);
      const history = await db.getPaymentsByUser(user.id);
      setPaymentHistory(history);
    };
    loadData();
  }, [user, location.state]);

  // OTP timer countdown
  useEffect(() => {
    if (step !== 'otp' || otpResendTimer <= 0) return;
    const timer = setInterval(() => setOtpTimer(prev => {
      if (prev <= 1) { clearInterval(timer); return 0; }
      return prev - 1;
    }), 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, otpResendTimer]);

  // Fix: use a separate state setter name to avoid confusion
  const setOtpTimer = setOtpResendTimer;

  const sendPaymentOtp = async () => {
    if (!user) return;
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setPaymentOtp(code);
    setEmailSending(true);
    try {
      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID || 'default_service',
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'default_template',
        {
          email: user.email,
          passcode: code,
          time: new Date(Date.now() + 10 * 60000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        },
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'default_public_key'
      );
    } catch (e) {
      console.error("Failed to send payment OTP email via EmailJS:", e);
    } finally {
      setEmailSending(false);
    }
  };

  useEffect(() => {
    if (step === 'otp') {
      sendPaymentOtp();
    }
  }, [step]);

  // ---- Helpers ----
  const refreshData = async () => {
    if (!user) return;
    const allInvoices = await db.getInvoicesByUser(user.id);
    setPendingInvoices(allInvoices.filter(i => i.status === 'pending'));
    const methods = await db.getPaymentMethods(user.id);
    setSavedMethods(methods);
    const history = await db.getPaymentsByUser(user.id);
    setPaymentHistory(history);
  };

  const resetForm = () => {
    setCardNumber(''); setCardHolder(''); setExpiryMonth(''); setExpiryYear('');
    setCvv(''); setSaveCard(false); setBillingAddress(''); setBillingCity('');
    setBillingState(''); setBillingZip(''); setBillingCountry('US');
    setFormErrors({}); setOtp(['', '', '', '', '', '']); setOtpError('');
    setCompletedPayment(null);
  };

  const goBack = () => {
    if (step === 'method') setStep('select');
    else if (step === 'details') setStep('method');
    else if (step === 'otp') setStep('details');
    else if (step === 'failure') setStep('details');
  };

  // ---- Validate ----
  const validateCard = (): boolean => {
    const errors: Record<string, string> = {};
    const cleanNumber = cardNumber.replace(/\s/g, '');
    if (cleanNumber.length < 15) errors.cardNumber = 'Enter a valid card number';
    if (!cardHolder.trim()) errors.cardHolder = 'Enter the cardholder name';
    if (!expiryMonth) errors.expiry = 'Select month';
    if (!expiryYear) errors.expiry = 'Select year';
    if (cvv.length < 3) errors.cvv = 'Enter CVV';
    if (!billingAddress.trim()) errors.address = 'Enter billing address';
    if (!billingCity.trim()) errors.city = 'Enter city';
    if (!billingZip.trim()) errors.zip = 'Enter ZIP code';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateOtp = (): boolean => {
    const code = otp.join('');
    if (code.length !== 6) { setOtpError('Enter the 6-digit code'); return false; }
    if (code !== paymentOtp) { setOtpError('Invalid verification code'); return false; }
    return true;
  };

  // ---- Step handlers ----
  const handleSelectInvoice = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setStep('method');
  };

  const handleProceedToDetails = () => {
    if (paymentType === 'saved' && selectedSavedId) {
      setStep('otp');
      setOtpResendTimer(30);
    } else if (paymentType === 'card') {
      setStep('details');
    } else if (paymentType === 'paypal' || paymentType === 'bank') {
      setStep('otp');
      setOtpResendTimer(30);
    }
  };

  const handleDetailsToOtp = () => {
    if (!validateCard()) return;
    setStep('otp');
    setOtpResendTimer(30);
  };

  const handleOtpSubmit = async () => {
    if (!validateOtp()) return;
    if (!selectedInvoice || !user) return;

    setStep('processing');

    // Simulate processing delay
    await new Promise(r => setTimeout(r, 2200));

    // Simulate 92% success rate
    const success = Math.random() > 0.08;

    if (success) {
      let methodLabel = '';
      let methodType: 'card' | 'paypal' | 'bank_transfer' = 'card';
      let cBrand = '';
      let cLast4 = '';
      let cHolder = '';

      if (paymentType === 'saved') {
        const m = savedMethods.find(m => m.id === selectedSavedId);
        methodLabel = m?.label || 'Saved Card';
        methodType = m?.type || 'card';
        cBrand = m?.brand || '';
        cLast4 = m?.last4 || '';
        cHolder = m?.holder_name || '';
      } else if (paymentType === 'card') {
        const clean = cardNumber.replace(/\s/g, '');
        methodLabel = `•••• ${clean.slice(-4)}`;
        cBrand = brand;
        cLast4 = clean.slice(-4);
        cHolder = cardHolder;
      } else if (paymentType === 'paypal') {
        methodLabel = 'PayPal';
        methodType = 'paypal';
      } else {
        methodLabel = 'Bank Transfer';
        methodType = 'bank_transfer';
      }

      const payment = await db.processPayment(user.id, selectedInvoice.id, {
        method: methodLabel,
        method_type: methodType,
        card_brand: cBrand,
        card_last4: cLast4,
        card_holder: cHolder,
        billing_address: billingAddress,
        billing_city: billingCity,
        billing_state: billingState,
        billing_zip: billingZip,
        billing_country: billingCountry,
      });

      // Save card if requested
      if (saveCard && paymentType === 'card') {
        await db.addPaymentMethod(user.id, {
          type: 'card',
          label: `•••• ${cLast4}`,
          last4: cLast4,
          brand: cBrand,
          expiry_month: parseInt(expiryMonth),
          expiry_year: parseInt('20' + expiryYear),
          holder_name: cardHolder,
        });
      }

      setCompletedPayment(payment);
      setStep('success');
      addToast('Payment processed successfully!', 'success');
      refreshData();
    } else {
      setStep('failure');
      addToast('Payment failed. Please try again.', 'error');
    }
  };

  // ---- Payment Methods tab ----
  const handleDeleteMethod = async (id: string) => {
    await db.deletePaymentMethod(id);
    if (user) {
      const methods = await db.getPaymentMethods(user.id);
      setSavedMethods(methods);
    }
    if (selectedSavedId === id) setSelectedSavedId('');
  };

  const handleSetDefault = async (id: string) => {
    if (!user) return;
    await db.setDefaultPaymentMethod(user.id, id);
    const methods = await db.getPaymentMethods(user.id);
    setSavedMethods(methods);
  };

  // ====================================================================
  // STEP WIZARD HEADER
  // ====================================================================
  const steps = [
    { key: 'select', label: 'Invoice', num: 1 },
    { key: 'method', label: 'Method', num: 2 },
    { key: 'details', label: 'Details', num: 3 },
    { key: 'otp', label: 'Verify', num: 4 },
    { key: 'processing', label: 'Process', num: 5 },
    { key: 'success', label: 'Done', num: 6 },
  ];

  const currentStepIdx = steps.findIndex(s => s.key === step);

  const StepWizard = () => (
    <div className="flex items-center justify-center gap-1 mb-8">
      {steps.filter(s => !(['details'].includes(s.key) && paymentType !== 'card')).map((s, i) => {
        const actualIdx = steps.indexOf(s);
        const active = actualIdx === currentStepIdx;
        const done = actualIdx < currentStepIdx;
        return (
          <div key={s.key} className="flex items-center">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              done ? 'bg-emerald-50 text-emerald-700' : active ? 'bg-primary-50 text-primary/90' : 'bg-muted text-muted-foreground/80'
            }`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                done ? 'bg-emerald-500 text-white' : active ? 'bg-primary text-white' : 'bg-gray-300 text-white'
              }`}>
                {done ? '✓' : s.num}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </div>
            {i < (paymentType === 'card' ? 5 : 4) - 1 && <ChevronRight className="w-4 h-4 text-gray-300 mx-0.5" />}
          </div>
        );
      })}
    </div>
  );

  // ====================================================================
  // RENDER: Processing
  // ====================================================================
  if (step === 'processing') {
    return (
      <div className="max-w-lg mx-auto animate-fadeIn">
        <StepWizard />
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="text-center">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 border-4 border-border rounded-full" />
              <div className="absolute inset-0 border-4 border-primary-600 rounded-full border-t-transparent animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Lock className="w-7 h-7 text-primary" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Processing Payment</h2>
            <p className="text-sm text-muted-foreground mb-4">Securing your transaction...</p>
            <div className="space-y-2.5">
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/80">
                <CheckCircle className="w-4 h-4 text-emerald-500" /> Card details verified
              </div>
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/80">
                <Loader2 className="w-4 h-4 animate-spin" /> Contacting bank...
              </div>
              <div className="flex items-center justify-center gap-2 text-xs text-gray-300">
                <Clock className="w-4 h-4" /> Awaiting confirmation...
              </div>
            </div>
            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground/80">
              <Shield className="w-3.5 h-3.5" /> 256-bit SSL Encrypted · PCI DSS Compliant
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ====================================================================
  // RENDER: Success
  // ====================================================================
  if (step === 'success' && completedPayment) {
    return (
      <div className="max-w-lg mx-auto animate-fadeIn">
        <StepWizard />
        <Card className="text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5 animate-scaleIn">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-1">Payment Successful!</h2>
          <p className="text-sm text-muted-foreground mb-6">A receipt has been generated for your records.</p>

          {/* Receipt */}
          <div className="bg-muted/50 rounded-xl p-5 text-left mb-6 border border-border">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-border border-dashed">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-foreground">SubFlow</span>
              </div>
              <Badge variant="success">PAID</Badge>
            </div>

            <div className="space-y-2.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Transaction ID</span>
                <span className="font-mono text-xs text-foreground">{completedPayment.transaction_id}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Invoice</span>
                <span className="font-mono text-xs text-foreground">{completedPayment.invoice_number?.slice(0, 18)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Service</span>
                <span className="text-foreground">{completedPayment.service_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Plan</span>
                <span className="text-foreground">{completedPayment.plan_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-foreground">${completedPayment.amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax (18%)</span>
                <span className="text-foreground">${completedPayment.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-border">
                <span className="font-semibold text-foreground">Total Paid</span>
                <span className="text-lg font-bold text-emerald-600">${completedPayment.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm pt-1">
                <span className="text-muted-foreground">Method</span>
                <span className="text-foreground flex items-center gap-1.5">
                  {completedPayment.method_type === 'card' && <CreditCard className="w-3.5 h-3.5" />}
                  {completedPayment.method_type === 'paypal' && <Wallet className="w-3.5 h-3.5" />}
                  {completedPayment.method_type === 'bank_transfer' && <Building className="w-3.5 h-3.5" />}
                  {completedPayment.method}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Date</span>
                <span className="text-foreground">{new Date(completedPayment.paid_at).toLocaleString()}</span>
              </div>
              {completedPayment.card_brand && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Card</span>
                  <span className="text-foreground">{getBrandName(completedPayment.card_brand)} •••• {completedPayment.card_last4}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate('/billing')} className="flex-1">
              <FileText className="w-4 h-4 mr-2" /> Billing
            </Button>
            <Button
              onClick={() => {
                if (selectedInvoice && completedPayment) {
                  generateInvoicePDF({ ...selectedInvoice, status: 'paid', paid_at: new Date().toISOString() }, completedPayment, { mode: 'receipt' });
                  addToast('Receipt downloaded!', 'success');
                }
              }}
              className="flex-1"
            >
              <Download className="w-4 h-4 mr-2" /> Download Receipt
            </Button>
            <Button onClick={() => { resetForm(); setStep('select'); refreshData(); setActiveTab('history'); }} variant="secondary" className="flex-1">
              History
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // ====================================================================
  // RENDER: Failure
  // ====================================================================
  if (step === 'failure') {
    return (
      <div className="max-w-lg mx-auto animate-fadeIn">
        <StepWizard />
        <Card className="text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Payment Failed</h2>
          <p className="text-sm text-muted-foreground mb-4">Your payment was not processed.</p>
          <div className="bg-red-50 rounded-lg p-4 text-left mb-6 space-y-1.5">
            <p className="text-xs text-red-700"><strong>Transaction was declined.</strong></p>
            <p className="text-xs text-red-600">Possible reasons: insufficient funds, incorrect card details, expired card, or bank rejection.</p>
            <p className="text-xs text-red-600">No amount has been charged. Please try again.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate('/billing')} className="flex-1">Back to Billing</Button>
            <Button onClick={goBack} className="flex-1">Try Again</Button>
          </div>
        </Card>
      </div>
    );
  }

  // ====================================================================
  // RENDER: OTP Verification
  // ====================================================================
  if (step === 'otp') {
    return (
      <div className="max-w-lg mx-auto animate-fadeIn">
        <StepWizard />
        <Card>
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <KeyRound className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-1">Verify Your Identity</h2>
            <p className="text-sm text-muted-foreground">
              We've sent a 6-digit verification code to your registered email and phone.
            </p>
            {emailSending ? (
              <p className="text-xs text-primary mt-2 animate-pulse">
                Sending verification code via email...
              </p>
            ) : (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">
                Verification code sent to your email.
              </p>
            )}
          </div>

          {/* OTP Input */}
          <div className="flex justify-center gap-3 mb-4">
            {otp.map((digit, i) => (
              <input
                key={i}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '');
                  const newOtp = [...otp];
                  newOtp[i] = val;
                  setOtp(newOtp);
                  if (val && i < 5) {
                    (e.target.nextElementSibling as HTMLInputElement)?.focus();
                  }
                }}
                onKeyDown={e => {
                  if (e.key === 'Backspace' && !otp[i] && i > 0) {
                    const prev = (e.target as HTMLElement).previousElementSibling as HTMLInputElement;
                    prev?.focus();
                  }
                }}
                className={`w-12 h-14 text-center text-xl font-bold border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
                  otpError ? 'border-red-300 bg-red-50' : 'border-input'
                }`}
              />
            ))}
          </div>

          {otpError && <p className="text-center text-xs text-red-600 mb-3">{otpError}</p>}

          <div className="text-center mb-6">
            {otpResendTimer > 0 ? (
              <p className="text-xs text-muted-foreground/80">
                Resend code in <span className="font-medium text-muted-foreground">{otpResendTimer}s</span>
              </p>
            ) : (
              <button
                onClick={() => {
                  setOtpResendTimer(30);
                  sendPaymentOtp();
                  setOtp(['', '', '', '', '', '']);
                  setOtpError('');
                }}
                className="text-xs text-primary font-medium hover:text-primary/90"
              >
                Resend Verification Code
              </button>
            )}
          </div>

          {/* Payment summary in OTP step */}
          {selectedInvoice && (
            <div className="bg-muted/50 rounded-xl p-4 mb-6">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-bold text-foreground">${selectedInvoice.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground/80">
                <span>{selectedInvoice.service_name} — {selectedInvoice.plan_name}</span>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={goBack} className="flex-1">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <Button onClick={handleOtpSubmit} className="flex-1" disabled={otp.join('').length !== 6}>
              <Lock className="w-4 h-4 mr-1" /> Confirm & Pay
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // ====================================================================
  // RENDER: Card Details step
  // ====================================================================
  if (step === 'details') {
    return (
      <div className="max-w-3xl mx-auto animate-fadeIn">
        <StepWizard />
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Card Visual */}
          <div>
            <Card className="bg-gradient-to-br from-gray-50 to-gray-100 mb-4">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">Card Preview</h3>
              <CreditCardVisual
                cardNumber={cardNumber}
                cardHolder={cardHolder}
                expiryMonth={expiryMonth}
                expiryYear={expiryYear}
                cvv={cvv}
                isFlipped={isFlipped}
                brand={brand}
              />
            </Card>

            {/* Order Summary */}
            {selectedInvoice && (
              <Card className="border-primary-200">
                <h3 className="text-sm font-semibold text-foreground mb-3">Order Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Service</span>
                    <span className="text-foreground">{selectedInvoice.service_name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Plan</span>
                    <span className="text-foreground">{selectedInvoice.plan_name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${selectedInvoice.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax (18%)</span>
                    <span>${selectedInvoice.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t font-semibold">
                    <span>Total</span>
                    <span className="text-lg">${selectedInvoice.total.toFixed(2)}</span>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Form */}
          <div>
            <Card>
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-500" /> Enter Card Details
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1.5">Card Number</label>
                  <div className="relative">
                    <input
                      type="text" value={cardNumber}
                      onChange={e => setCardNumber(formatCardNumber(e.target.value))}
                      placeholder="1234 5678 9012 3456" maxLength={19}
                      className={`w-full pl-11 pr-24 py-2.5 border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500 ${formErrors.cardNumber ? 'border-red-300' : 'border-input'}`}
                    />
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/80" />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                      {['visa', 'mastercard', 'amex'].map(b => (
                        <span key={b} className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${brand === b ? 'bg-primary-100 text-primary/90' : 'bg-muted text-muted-foreground/80'}`}>
                          {b === 'visa' ? 'VISA' : b === 'mastercard' ? 'MC' : 'AMEX'}
                        </span>
                      ))}
                    </div>
                  </div>
                  {formErrors.cardNumber && <p className="text-xs text-red-600 mt-1">{formErrors.cardNumber}</p>}
                </div>

                <Input label="Cardholder Name" value={cardHolder} onChange={e => setCardHolder(e.target.value)} placeholder="JOHN DOE" error={formErrors.cardHolder} />

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1.5">Month</label>
                    <select value={expiryMonth} onChange={e => setExpiryMonth(e.target.value)} className="w-full px-3 py-2.5 border border-input rounded-lg text-sm bg-white">
                      <option value="">MM</option>
                      {Array.from({ length: 12 }, (_, i) => <option key={i} value={String(i + 1).padStart(2, '0')}>{String(i + 1).padStart(2, '0')}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1.5">Year</label>
                    <select value={expiryYear} onChange={e => setExpiryYear(e.target.value)} className="w-full px-3 py-2.5 border border-input rounded-lg text-sm bg-white">
                      <option value="">YY</option>
                      {Array.from({ length: 10 }, (_, i) => { const yr = new Date().getFullYear() + i; return <option key={yr} value={String(yr).slice(-2)}>{yr}</option>; })}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1.5">CVV</label>
                    <input type="password" value={cvv} onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))} onFocus={() => setIsFlipped(true)} onBlur={() => setIsFlipped(false)} placeholder="•••" maxLength={4}
                      className={`w-full px-3 py-2.5 border rounded-lg text-sm font-mono ${formErrors.cvv ? 'border-red-300' : 'border-input'}`} />
                  </div>
                </div>
                {formErrors.expiry && <p className="text-xs text-red-600 -mt-2">{formErrors.expiry}</p>}

                <div className="pt-2 border-t">
                  <p className="text-sm font-medium text-foreground mb-3">Billing Address</p>
                  <div className="space-y-3">
                    <Input value={billingAddress} onChange={e => setBillingAddress(e.target.value)} placeholder="123 Main Street" error={formErrors.address} />
                    <div className="grid grid-cols-3 gap-3">
                      <Input value={billingCity} onChange={e => setBillingCity(e.target.value)} placeholder="City" error={formErrors.city} />
                      <Input value={billingState} onChange={e => setBillingState(e.target.value)} placeholder="State" />
                      <Input value={billingZip} onChange={e => setBillingZip(e.target.value)} placeholder="ZIP" error={formErrors.zip} />
                    </div>
                    <select value={billingCountry} onChange={e => setBillingCountry(e.target.value)} className="w-full px-3 py-2.5 border border-input rounded-lg text-sm bg-white">
                      <option value="US">United States</option>
                      <option value="CA">Canada</option>
                      <option value="GB">United Kingdom</option>
                      <option value="AU">Australia</option>
                      <option value="DE">Germany</option>
                      <option value="IN">India</option>
                    </select>
                  </div>
                </div>

                <label className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl cursor-pointer">
                  <input type="checkbox" checked={saveCard} onChange={e => setSaveCard(e.target.checked)} className="w-4 h-4 rounded border-input text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Save this card</p>
                    <p className="text-xs text-muted-foreground">For faster checkout next time</p>
                  </div>
                </label>
              </div>

              <div className="flex gap-3 mt-6">
                <Button variant="outline" onClick={goBack} className="flex-1"><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
                <Button onClick={handleDetailsToOtp} className="flex-1">
                  Continue to Verify <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // ====================================================================
  // RENDER: Method selection
  // ====================================================================
  if (step === 'method') {
    return (
      <div className="max-w-2xl mx-auto animate-fadeIn">
        <StepWizard />

        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={goBack}><ArrowLeft className="w-4 h-4" /></Button>
          <div>
            <h2 className="text-lg font-bold text-foreground">Choose Payment Method</h2>
            <p className="text-sm text-muted-foreground">For {selectedInvoice?.service_name} — {selectedInvoice?.plan_name} · ${selectedInvoice?.total.toFixed(2)}</p>
          </div>
        </div>

        {/* Saved methods */}
        {savedMethods.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <BadgeCheck className="w-4 h-4 text-emerald-500" /> Saved Payment Methods
            </h3>
            <div className="space-y-2">
              {savedMethods.map(m => (
                <button key={m.id} onClick={() => { setPaymentType('saved'); setSelectedSavedId(m.id); }}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${
                    paymentType === 'saved' && selectedSavedId === m.id ? 'border-primary-500 bg-primary-50' : 'border-border hover:border-input'
                  }`}>
                  <div className="p-2.5 bg-white rounded-lg border">
                    <CreditCard className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{getBrandName(m.brand)} {m.label}</p>
                    <p className="text-xs text-muted-foreground">Expires {String(m.expiry_month).padStart(2, '0')}/{m.expiry_year} · {m.holder_name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {m.is_default && <Badge variant="info">Default</Badge>}
                    {paymentType === 'saved' && selectedSavedId === m.id && <CheckCircle className="w-5 h-5 text-primary" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Other methods */}
        <h3 className="text-sm font-semibold text-muted-foreground mb-3">Other Payment Methods</h3>
        <div className="grid gap-3 mb-6">
          {[
            { type: 'card' as const, icon: <CreditCard className="w-6 h-6" />, label: 'Credit / Debit Card', desc: 'Visa, Mastercard, Amex, Discover' },
            { type: 'paypal' as const, icon: <Wallet className="w-6 h-6" />, label: 'PayPal', desc: 'Pay securely with your PayPal account' },
            { type: 'bank' as const, icon: <Building className="w-6 h-6" />, label: 'Bank Transfer', desc: 'Direct bank-to-bank wire transfer' },
          ].map(pm => (
            <button key={pm.type} onClick={() => { setPaymentType(pm.type); setSelectedSavedId(''); }}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${
                paymentType === pm.type && !selectedSavedId ? 'border-primary-500 bg-primary-50' : 'border-border hover:border-input'
              }`}>
              <div className={`p-2.5 rounded-lg border ${paymentType === pm.type && !selectedSavedId ? 'bg-primary-100 text-primary border-primary-200' : 'bg-muted/50 text-muted-foreground border-border'}`}>
                {pm.icon}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{pm.label}</p>
                <p className="text-xs text-muted-foreground">{pm.desc}</p>
              </div>
              {paymentType === pm.type && !selectedSavedId && <CheckCircle className="w-5 h-5 text-primary ml-auto" />}
            </button>
          ))}
        </div>

        <Button onClick={handleProceedToDetails} className="w-full py-3" disabled={paymentType === 'saved' ? !selectedSavedId : false}>
          Continue <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    );
  }

  // ====================================================================
  // RENDER: Invoice selection (default tab)
  // ====================================================================
  if (step === 'select' && activeTab === 'pay') {
    return (
      <div className="max-w-2xl mx-auto animate-fadeIn">
        <StepWizard />
        <h2 className="text-lg font-bold text-foreground mb-1">Select Invoice to Pay</h2>
        <p className="text-sm text-muted-foreground mb-6">{pendingInvoices.length} pending invoice{pendingInvoices.length !== 1 ? 's' : ''}</p>

        {pendingInvoices.length === 0 ? (
          <EmptyState
            icon={<CheckCircle className="w-10 h-10" />}
            title="All paid up!"
            description="No pending invoices — you're all caught up."
            action={<Button onClick={() => navigate('/billing')}>View Billing</Button>}
          />
        ) : (
          <div className="space-y-3">
            {pendingInvoices.map(inv => (
              <button key={inv.id} onClick={() => handleSelectInvoice(inv)}
                className="w-full text-left p-4 rounded-xl border-2 border-border hover:border-primary-300 hover:bg-primary-50/50 transition-all group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground group-hover:text-primary/90">{inv.service_name}</p>
                      <p className="text-xs text-muted-foreground">{inv.plan_name} · <span className="font-mono">{inv.invoice_number.slice(0, 18)}</span></p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-foreground">${inv.total.toFixed(2)}</p>
                    <Badge variant="warning">Due {inv.due_date}</Badge>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Security badges */}
        <div className="flex items-center justify-center gap-6 mt-8 py-3 border-t">
          {[
            { icon: <Shield className="w-4 h-4" />, text: 'SSL Encrypted' },
            { icon: <Lock className="w-4 h-4" />, text: 'PCI Compliant' },
            { icon: <Sparkles className="w-4 h-4" />, text: 'Secure Payments' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground/80">{item.icon} {item.text}</div>
          ))}
        </div>
      </div>
    );
  }

  // ====================================================================
  // RENDER: Main tabbed interface (when not in payment flow)
  // ====================================================================
  return (
    <div className="animate-fadeIn">
      <PageHeader
        title="Payments"
        description="Manage payment methods, pay invoices, and view history"
        action={<Button variant="ghost" onClick={() => navigate('/billing')} className="gap-2"><ArrowLeft className="w-4 h-4" /> Billing</Button>}
      />

      {/* Tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-lg mb-6 max-w-xl">
        {[
          { key: 'pay' as const, label: 'Make Payment', icon: <CreditCard className="w-4 h-4" />, count: pendingInvoices.length },
          { key: 'methods' as const, label: 'My Cards', icon: <Wallet className="w-4 h-4" />, count: savedMethods.length },
          { key: 'history' as const, label: 'History', icon: <Building className="w-4 h-4" />, count: paymentHistory.length },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md transition-all flex-1 justify-center ${
              activeTab === tab.key ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}>
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
            {tab.count > 0 && <span className={`px-1.5 py-0.5 rounded-full text-xs ${activeTab === tab.key ? 'bg-primary-100 text-primary/90' : 'bg-gray-200'}`}>{tab.count}</span>}
          </button>
        ))}
      </div>

      {/* Pay tab */}
      {activeTab === 'pay' && (
        <div className="max-w-2xl mx-auto">
          <h2 className="text-lg font-bold text-foreground mb-1">Select Invoice to Pay</h2>
          <p className="text-sm text-muted-foreground mb-6">{pendingInvoices.length} pending</p>
          {pendingInvoices.length === 0 ? (
            <EmptyState icon={<CheckCircle className="w-10 h-10" />} title="All paid up!" description="No pending invoices." action={<Button onClick={() => navigate('/billing')}>View Billing</Button>} />
          ) : (
            <div className="space-y-3">
              {pendingInvoices.map(inv => (
                <button key={inv.id} onClick={() => handleSelectInvoice(inv)}
                  className="w-full text-left p-4 rounded-xl border-2 border-border hover:border-primary-300 hover:bg-primary-50/50 transition-all group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><FileText className="w-5 h-5" /></div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{inv.service_name}</p>
                        <p className="text-xs text-muted-foreground">{inv.plan_name} · <span className="font-mono">{inv.invoice_number.slice(0, 18)}</span></p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-foreground">${inv.total.toFixed(2)}</p>
                      <Badge variant="warning">Due {inv.due_date}</Badge>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Methods tab */}
      {activeTab === 'methods' && (
        <div className="max-w-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground">Saved Payment Methods</h3>
            <Button onClick={() => { setActiveTab('pay'); }} className="gap-2"><Plus className="w-4 h-4" /> Add During Payment</Button>
          </div>
          {savedMethods.length === 0 ? (
            <EmptyState icon={<Wallet className="w-10 h-10" />} title="No saved cards" description="Save a card during your next payment for faster checkout" />
          ) : (
            <div className="space-y-3">
              {savedMethods.map(m => (
                <Card key={m.id} className={m.is_default ? 'border-primary-200' : ''}>
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-muted/50 rounded-xl border"><CreditCard className="w-6 h-6 text-muted-foreground" /></div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">{getBrandName(m.brand)} {m.label}</p>
                        {m.is_default && <Badge variant="info">Default</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{m.holder_name} · Exp {String(m.expiry_month).padStart(2, '0')}/{m.expiry_year}</p>
                    </div>
                    <div className="flex gap-2">
                      {!m.is_default && <Button size="sm" variant="ghost" onClick={() => handleSetDefault(m.id)}><Star className="w-4 h-4" /></Button>}
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteMethod(m.id)} className="text-red-500 hover:bg-red-50"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* History tab */}
      {activeTab === 'history' && (
        <div>
          {paymentHistory.length === 0 ? (
            <EmptyState icon={<Building className="w-10 h-10" />} title="No payment history" description="Completed payments appear here" />
          ) : (
            <Card padding={false}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Transaction</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Service</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Total</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Method</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Date</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentHistory.map(p => (
                      <tr key={p.id} className="border-b border-gray-50 hover:bg-muted/50/50">
                        <td className="py-3 px-4"><p className="text-sm font-mono text-muted-foreground">{p.transaction_id.slice(0, 22)}</p><p className="text-xs text-muted-foreground/80 font-mono">{p.invoice_number?.slice(0, 16)}</p></td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">{p.service_name}<p className="text-xs text-muted-foreground/80">{p.plan_name}</p></td>
                        <td className="py-3 px-4 text-sm font-medium text-foreground">${p.total.toFixed(2)}</td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">{p.method}</td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">{new Date(p.paid_at).toLocaleDateString()}</td>
                        <td className="py-3 px-4"><Badge variant={p.status === 'paid' ? 'success' : p.status === 'refunded' ? 'warning' : 'danger'}>{p.status === 'refunded' ? 'Refunded' : p.status}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
