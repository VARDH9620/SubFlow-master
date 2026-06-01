import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Eye, EyeOff, Shield, ArrowRight, CheckCircle, Code, Layers } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { Button, Input } from '../components/ui';
import { OTPInput, PasswordStrength } from '../components/ui/OTPInput';
import * as db from '../db/database';
import { motion, AnimatePresence } from 'framer-motion';

type Step = 'form' | 'otp' | 'success';

export default function Register() {
  const { login, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('form');
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '', password: '', confirm_password: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      navigate(user.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
    }
  }, [user, authLoading, navigate]);

  // OTP state
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [otpError, setOtpError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [resendCount, setResendCount] = useState(0);

  const set = (key: string, val: string) => setForm(p => ({ ...p, [key]: val }));

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirm_password) { setError('Passwords do not match'); return; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (!/[a-z]/.test(form.password) || !/[A-Z]/.test(form.password)) { setError('Password must contain uppercase and lowercase letters'); return; }
    if (!/\d/.test(form.password)) { setError('Password must contain at least one number'); return; }

    setLoading(true);
    try {
      const exists = await db.checkEmailExists(form.email);
      if (exists) {
        setError('An account with this email already exists');
        setLoading(false);
        return;
      }
      await db.generateOTP(form.email);
      setStep('otp');
      setResendTimer(30);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    const code = otp.join('');
    if (code.length !== 6) { setOtpError('Please enter the complete 6-digit code'); return; }

    setVerifying(true);
    setOtpError('');

    try {
      const result = await db.verifyOTP(form.email, code);
      if (!result.valid) {
        setOtpError(result.error || 'Invalid OTP');
        setVerifying(false);
        return;
      }

      const user = await db.registerUser({ ...form, is_verified: true });
      if (!user) {
        setOtpError('Failed to create account. Please try again.');
        setVerifying(false);
        return;
      }

      await login(form.email, form.password);
      setStep('success');
    } catch (err: any) {
      setOtpError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      await db.generateOTP(form.email);
      setResendTimer(30);
      setResendCount(c => c + 1);
      setOtp(Array(6).fill(''));
      setOtpError('');
    } catch (err: any) {
      setOtpError(err instanceof Error ? err.message : 'Failed to resend OTP');
    }
  };

  const maskedEmail = form.email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + '*'.repeat(b.length) + c);

  return (
    <div className="min-h-screen flex bg-background relative overflow-hidden">
      {/* Left Panel - Visual Showcase */}
      <div className="hidden lg:flex w-[55%] relative items-center justify-center bg-[#0a0f1e] overflow-hidden order-2 lg:order-1 border-r border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/40 via-[#0a0f1e] to-[#0a0f1e]" />
        
        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[150px]" />
        <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }} className="absolute top-1/4 -left-1/4 w-[500px] h-[500px] bg-indigo-600/30 rounded-full blur-[120px]" />

        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_20%,transparent_100%)]" />

        {/* Floating UI Elements */}
        <div className="relative z-10 w-full max-w-xl perspective-1000 pl-12">
          <motion.div 
            initial={{ rotateY: 15, rotateX: 5, x: -20, opacity: 0 }}
            animate={{ rotateY: 10, rotateX: 2, x: 0, opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="relative space-y-6"
          >
            <div className="space-y-2 mb-12">
              <h2 className="text-4xl font-bold text-white tracking-tight">Build faster.</h2>
              <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 tracking-tight">Scale infinitely.</h2>
              <p className="text-white/60 text-lg max-w-md mt-4 leading-relaxed">
                Join thousands of businesses managing their subscriptions, billing, and analytics in one unified platform.
              </p>
            </div>

            <div className="grid gap-4">
              <motion.div 
                whileHover={{ x: 10, backgroundColor: "rgba(255,255,255,0.1)" }}
                className="flex items-start gap-4 p-5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md transition-colors"
              >
                <div className="p-3 rounded-xl bg-blue-500/20 text-blue-400">
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Unified Dashboard</h3>
                  <p className="text-white/60 text-sm">Everything you need to run your SaaS business in one place.</p>
                </div>
              </motion.div>
              
              <motion.div 
                whileHover={{ x: 10, backgroundColor: "rgba(255,255,255,0.1)" }}
                className="flex items-start gap-4 p-5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md transition-colors"
              >
                <div className="p-3 rounded-xl bg-purple-500/20 text-purple-400">
                  <Code className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Developer First</h3>
                  <p className="text-white/60 text-sm">Powerful APIs and webhooks designed for modern engineering teams.</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="w-full lg:w-[45%] flex flex-col relative z-20 shadow-[-8px_0_40px_rgba(0,0,0,0.05)] dark:shadow-[-8px_0_40px_rgba(0,0,0,0.5)] bg-card order-1 lg:order-2">
        
        <div className="flex items-center justify-between p-6 sm:px-12 pt-8">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xl font-bold text-foreground tracking-tight group-hover:text-primary transition-colors">SubFlow</span>
          </Link>
          <ThemeToggle compact />
        </div>

        <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 max-w-[520px] w-full mx-auto pb-12">
          
          <AnimatePresence mode="wait">
            {step === 'form' && (
              <motion.div key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.4, ease: "easeOut" }}>
                <div className="mb-10">
                  <h1 className="text-4xl font-extrabold tracking-tight text-foreground mb-3 leading-tight">
                    Create account
                  </h1>
                  <p className="text-muted-foreground text-base">
                    Already have an account? <Link to="/login" className="text-primary font-medium hover:text-primary/80 transition-colors">Sign in here</Link>
                  </p>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-6">
                      <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm rounded-xl flex items-start gap-3">
                        <Shield className="w-4 h-4 mt-0.5 shrink-0" />
                        <p>{error}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleFormSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-foreground tracking-tight">First Name</label>
                      <Input value={form.first_name} onChange={e => set('first_name', e.target.value)} required placeholder="John" className="h-12 bg-muted/30 focus:bg-card" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-foreground tracking-tight">Last Name</label>
                      <Input value={form.last_name} onChange={e => set('last_name', e.target.value)} required placeholder="Doe" className="h-12 bg-muted/30 focus:bg-card" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground tracking-tight">Email</label>
                    <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} required placeholder="name@company.com" className="h-12 bg-muted/30 focus:bg-card" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground tracking-tight">Phone (Optional)</label>
                    <Input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+1 (555) 000-0000" className="h-12 bg-muted/30 focus:bg-card" />
                  </div>

                  <div className="space-y-2 relative">
                    <label className="text-sm font-semibold text-foreground tracking-tight">Password</label>
                    <div className="relative">
                      <Input type={showPw ? 'text' : 'password'} value={form.password} onChange={e => set('password', e.target.value)} required placeholder="Create a strong password" className="h-12 bg-muted/30 focus:bg-card pr-10" />
                      <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-[14px] text-muted-foreground hover:text-foreground transition-colors p-1">
                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <PasswordStrength password={form.password} />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground tracking-tight">Confirm Password</label>
                    <Input type="password" value={form.confirm_password} onChange={e => set('confirm_password', e.target.value)} required placeholder="Repeat password" className="h-12 bg-muted/30 focus:bg-card" />
                  </div>
                  
                  <div className="pt-2">
                    <Button type="submit" loading={loading} className="w-full h-12 text-base font-semibold group shine-sweep">
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        Continue
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </Button>
                  </div>

                  <p className="text-[13px] text-muted-foreground text-center pt-2">
                    By creating an account, you agree to our <a href="#" className="text-foreground hover:text-primary transition-colors underline decoration-border underline-offset-4">Terms of Service</a> & <a href="#" className="text-foreground hover:text-primary transition-colors underline decoration-border underline-offset-4">Privacy Policy</a>.
                  </p>
                </form>
              </motion.div>
            )}

            {step === 'otp' && (
              <motion.div key="otp" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, ease: "easeOut" }}>
                <ResendTimerWrapper resendCount={resendCount} onTimerReady={setResendTimer}>
                  <div className="mb-10">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                      <Shield className="w-6 h-6 text-primary" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-foreground mb-3 tracking-tight">Check your email</h2>
                    <p className="text-muted-foreground text-base">
                      We sent a verification code to <span className="font-semibold text-foreground bg-muted/50 px-1.5 py-0.5 rounded">{maskedEmail}</span>
                    </p>
                  </div>

                  <div className="mb-8">
                    <OTPInput value={otp} onChange={setOtp} error={otpError} disabled={verifying} />
                  </div>

                  <Button onClick={handleVerifyOTP} loading={verifying} disabled={otp.join('').length !== 6} className="w-full h-12 text-base font-semibold">
                    Verify & Create Account
                  </Button>

                  <div className="mt-8 pt-6 border-t border-border flex items-center justify-between text-sm">
                    {resendTimer > 0 ? (
                      <span className="text-muted-foreground">Resend code in <span className="font-semibold text-foreground">{resendTimer}s</span></span>
                    ) : (
                      <button onClick={handleResendOTP} className="font-medium text-primary hover:text-primary/80 transition-colors">
                        Resend Code
                      </button>
                    )}
                    
                    <button onClick={() => { setStep('form'); setOtp(Array(6).fill('')); setOtpError(''); }} className="font-medium text-muted-foreground hover:text-foreground transition-colors">
                      Change email
                    </button>
                  </div>
                </ResendTimerWrapper>
              </motion.div>
            )}

            {step === 'success' && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-10">
                <div className="flex justify-center mb-8">
                  <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center animate-pulse relative">
                    <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping" />
                    <CheckCircle className="w-12 h-12 text-emerald-500 relative z-10" />
                  </div>
                </div>
                <h2 className="text-3xl font-extrabold text-foreground mb-3 tracking-tight">You're all set!</h2>
                <p className="text-muted-foreground text-base mb-10">
                  Your account has been created successfully. Redirecting you to the dashboard...
                </p>
                <Button onClick={() => navigate('/dashboard')} className="w-full h-12 text-base font-semibold">
                  Go to Dashboard Now
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function ResendTimerWrapper({ resendCount, onTimerReady, children }: {
  resendCount: number; onTimerReady: (v: number) => void; children: React.ReactNode;
}) {
  const [timer, setTimer] = useState(30);

  useEffect(() => {
    setTimer(30);
    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCount]);

  useEffect(() => { onTimerReady(timer); }, [timer, onTimerReady]);

  return <>{children}</>;
}
