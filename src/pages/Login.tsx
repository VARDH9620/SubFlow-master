import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Eye, EyeOff, Shield, Users, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { Button, Input } from '../components/ui';
import { motion, AnimatePresence } from 'framer-motion';

export default function Login() {
  const { login, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      navigate(user.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    // login returns a string on error, null on success
    const errString = await login(email, password, rememberMe);
    if (errString) { 
      setError(errString); 
      setLoading(false);
    } else { 
      navigate(email === 'admin@subflow.io' ? '/admin' : '/dashboard'); 
    }
  };

  return (
    <div className="min-h-screen flex bg-background relative overflow-hidden">
      {/* Left Panel - Auth Form */}
      <div className="w-full lg:w-[45%] flex flex-col relative z-20 shadow-[8px_0_40px_rgba(0,0,0,0.05)] dark:shadow-[8px_0_40px_rgba(0,0,0,0.5)] bg-card border-r border-border">
        
        {/* Navigation / Header */}
        <div className="flex items-center justify-between p-6 sm:px-12 pt-8">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xl font-bold text-foreground tracking-tight group-hover:text-primary transition-colors">SubFlow</span>
          </Link>
          <ThemeToggle compact />
        </div>

        {/* Form Container */}
        <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 max-w-[520px] w-full mx-auto pb-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
            
            <div className="mb-10">
              <h1 className="text-4xl font-extrabold tracking-tight text-foreground mb-3 leading-tight">
                Welcome back
              </h1>
              <p className="text-muted-foreground text-base">
                Sign in to manage your subscriptions and track performance.
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

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground tracking-tight">Email</label>
                  <Input 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    required 
                    placeholder="name@company.com" 
                    className="h-12 bg-muted/30 focus:bg-card"
                  />
                </div>
                
                <div className="space-y-2 relative">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-foreground tracking-tight">Password</label>
                    <Link to="/forgot-password" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input 
                      type={showPw ? 'text' : 'password'} 
                      value={password} 
                      onChange={e => setPassword(e.target.value)} 
                      required 
                      placeholder="••••••••" 
                      className="h-12 bg-muted/30 focus:bg-card pr-10"
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1">
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center w-5 h-5 rounded border border-input bg-card group-hover:border-primary transition-colors">
                    <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} className="peer sr-only" />
                    <div className="absolute inset-0 rounded bg-primary scale-0 peer-checked:scale-100 transition-transform duration-200 ease-out flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground font-medium group-hover:text-foreground transition-colors">Keep me signed in</span>
                </label>
              </div>

              <Button type="submit" disabled={loading} className="w-full h-12 text-base font-semibold group overflow-hidden">
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? 'Signing in...' : 'Sign in'}
                  {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-white/20 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              </Button>
            </form>

            <p className="mt-10 text-center text-sm font-medium text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary hover:text-primary/80 transition-colors">Create one now</Link>
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right Panel - Visual Showcase */}
      <div className="hidden lg:flex w-[55%] relative items-center justify-center bg-[#0a0f1e] overflow-hidden">
        {/* Deep ambient background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/40 via-[#0a0f1e] to-[#0a0f1e]" />
        
        {/* Animated glowing orbs */}
        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-primary/30 rounded-full blur-[100px]" />
        <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px]" />

        {/* Cyber grid overlay */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_20%,transparent_100%)]" />

        {/* Floating UI Elements */}
        <div className="relative z-10 w-full max-w-xl perspective-1000">
          <motion.div 
            initial={{ rotateX: 10, rotateY: -15, scale: 0.9, opacity: 0 }}
            animate={{ rotateX: 5, rotateY: -10, scale: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="relative"
          >
            {/* Glass Card Main */}
            <div className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-2xl p-8 shadow-2xl overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
              
              <div className="flex items-center justify-between mb-8">
                <div className="space-y-1">
                  <div className="text-white/60 text-sm font-medium">Monthly Revenue</div>
                  <div className="text-white text-3xl font-bold tracking-tight">$124,592.00</div>
                </div>
                <div className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-sm font-semibold flex items-center gap-1">
                  ↑ 14.5%
                </div>
              </div>

              {/* Fake Chart */}
              <div className="h-32 flex items-end gap-2 mb-6">
                {[40, 70, 45, 90, 65, 110, 85].map((h, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ duration: 1, delay: 0.5 + i * 0.1, ease: "easeOut" }}
                    className="flex-1 bg-gradient-to-t from-primary/20 to-primary rounded-t-sm"
                  />
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                  <div className="text-white/60 text-xs mb-1">Active Subs</div>
                  <div className="text-white text-lg font-semibold">10,482</div>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                  <div className="text-white/60 text-xs mb-1">Churn Rate</div>
                  <div className="text-white text-lg font-semibold">1.2%</div>
                </div>
              </div>
            </div>

            {/* Floating Element 1 */}
            <motion.div 
              animate={{ y: [-10, 10, -10] }} 
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -right-12 -bottom-12 p-5 rounded-2xl border border-white/10 bg-white/10 backdrop-blur-xl shadow-2xl flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <div className="text-white text-sm font-bold">+124 New Users</div>
                <div className="text-white/60 text-xs">Past 24 hours</div>
              </div>
            </motion.div>
            
            {/* Floating Element 2 */}
            <motion.div 
              animate={{ y: [10, -10, 10] }} 
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute -left-12 -top-12 p-4 rounded-2xl border border-white/10 bg-white/10 backdrop-blur-xl shadow-2xl flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="text-white text-sm font-semibold pr-2">Secure Login</div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
