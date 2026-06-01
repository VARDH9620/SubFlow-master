import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ThemeToggle } from '../ui/ThemeToggle';
import { CommandPalette } from '../ui/CommandPalette';
import GlobalBackground from '../Background/GlobalBackground';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, CreditCard, FileText, LifeBuoy, User,
  Settings, Users, BarChart3, Server, Package, MessageSquare,
  LogOut, Menu, Bell, ChevronDown, Zap, DollarSign, Wallet,
  Activity, Gift, CheckCircle, X, Search,
} from 'lucide-react';
import * as db from '../../db/database';

// ====================================================================
// PUBLIC LAYOUT (Landing, Login, Register)
// ====================================================================
export function PublicLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Outlet />
    </div>
  );
}

// ====================================================================
// SIDEBAR NAV ITEM — Premium glass with animated active state
// ====================================================================
function SidebarItem({ item, active, onClick }: { item: { key: string; label: string; icon: React.ComponentType<{ className?: string }> }; active: boolean; onClick: () => void; }) {
  const Icon = item.icon;
  return (
    <Link to={item.key} onClick={onClick}
      className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
        active
          ? 'bg-primary/10 text-primary font-semibold'
          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
      }`}
    >
      {/* Active indicator bar */}
      {active && (
        <motion.div
          layoutId="sidebar-indicator"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full"
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}
      <Icon className={`w-[18px] h-[18px] transition-colors ${active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`} />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

// ====================================================================
// USER LAYOUT (Dashboard, Services, Subscriptions, etc.)
// ====================================================================
const userNav = [
  { key: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: '/services', label: 'Services', icon: Server },
  { key: '/subscriptions', label: 'My Plans', icon: CreditCard },
  { key: '/billing', label: 'Billing', icon: FileText },
  { key: '/payment', label: 'Payments', icon: Wallet },
  { key: '/activity', label: 'Activity', icon: Activity },
  { key: '/notifications', label: 'Alerts', icon: Bell },
  { key: '/referrals', label: 'Referrals', icon: Gift },
  { key: '/support', label: 'Support', icon: LifeBuoy },
  { key: '/profile', label: 'Settings', icon: Settings },
];

export function UserLayout() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const [notifs, setNotifs] = useState<{ id: string; title: string; message: string; read: boolean; type: string; created_at: string }[]>([]);
  const [onboarding, setOnboarding] = useState<{ progress: number; steps: { id: string; title: string; completed: boolean; link: string }[] }>({ progress: 100, steps: [] });
  const [showOnboarding, setShowOnboarding] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const notifCacheRef = useRef<{ ts: number; count: number; list: typeof notifs }>({ ts: 0, count: 0, list: [] });

  const loadNotifs = useCallback(async () => {
    if (!user) return;
    const now = Date.now();
    // 30-second cache — avoid hammering the API on every route change
    if (now - notifCacheRef.current.ts < 30_000) {
      setNotifCount(notifCacheRef.current.count);
      setNotifs(notifCacheRef.current.list);
      return;
    }
    try {
      const [n, prog, steps] = await Promise.all([
        db.getNotifications(user.id),
        db.getOnboardingProgress(user.id),
        db.getOnboardingSteps(user.id),
      ]);
      const unread = n.filter(x => !x.read).length;
      const recent = n.slice(0, 5);
      notifCacheRef.current = { ts: now, count: unread, list: recent };
      setNotifCount(unread);
      setNotifs(recent);
      setOnboarding({ progress: prog, steps });
      if (prog < 100) setShowOnboarding(true);
    } catch (err) {
      console.error(err);
    }
  }, [user]);

  useEffect(() => {
    loadNotifs();
  }, [loadNotifs, location.pathname]);

  const handleNotifClick = async (id: string) => {
    if (user) {
      try {
        await db.markNotificationRead(id);
        // Invalidate cache so next load fetches fresh data
        notifCacheRef.current.ts = 0;
        const n = await db.getNotifications(user.id);
        const unread = n.filter(x => !x.read).length;
        const recent = n.slice(0, 5);
        notifCacheRef.current = { ts: Date.now(), count: unread, list: recent };
        setNotifCount(unread);
        setNotifs(recent);
      } catch (err) {
        console.error(err);
      }
    }
    setNotifOpen(false);
    navigate('/notifications');
  };

  return (
    <GlobalBackground intensity="subtle">
      <div className="min-h-screen flex">
        <CommandPalette />

        {/* ==================== GLASS SIDEBAR ==================== */}
        <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-card/70 backdrop-blur-xl border-r border-border/50 flex flex-col transition-transform duration-300 ease-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
          {/* Logo */}
          <div className="h-16 flex items-center gap-2.5 px-6 border-b border-border/30">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-md shadow-primary/20">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-foreground tracking-tight">SubFlow</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
            {userNav.map(item => {
              const active = location.pathname.startsWith(item.key);
              return (
                <SidebarItem key={item.key} item={item} active={active} onClick={() => setSidebarOpen(false)} />
              );
            })}
          </nav>

          {/* User info */}
          <div className="p-4 border-t border-border/30">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-primary/20 to-primary/10 text-primary rounded-xl flex items-center justify-center text-sm font-semibold border border-primary/10">{user?.first_name?.[0]}{user?.last_name?.[0]}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{user?.first_name} {user?.last_name}</p>
                <p className="text-xs text-muted-foreground/70 truncate">{user?.email}</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* ==================== MAIN CONTENT ==================== */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Glass Header */}
          <header className="h-16 bg-card/50 backdrop-blur-xl border-b border-border/30 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-20">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-muted/50 rounded-xl transition-colors">
              <Menu className="w-5 h-5 text-muted-foreground" />
            </button>
            <div className="flex-1" />
            <div className="flex items-center gap-1.5">
              {/* Command palette trigger — uses proper keyboard event dispatch */}
              <button
                onClick={() => {
                  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }));
                }}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground/60 bg-muted/30 rounded-lg border border-border/50 hover:bg-muted/50 hover:text-muted-foreground transition-all"
              >
                <Search className="w-3 h-3" />
                <span>Search</span>
                <kbd className="font-mono text-[10px] opacity-60 ml-1">⌘K</kbd>
              </button>
              <ThemeToggle />

              {/* Notification bell */}
              <div className="relative">
                <button onClick={() => setNotifOpen(!notifOpen)} className="relative p-2 hover:bg-muted/50 rounded-xl transition-colors">
                  <Bell className="w-5 h-5 text-muted-foreground" />
                  {notifCount > 0 && <span className="absolute top-1 right-1 min-w-[16px] h-[16px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-sm shadow-red-500/30">{notifCount}</span>}
                </button>
                <AnimatePresence>
                  {notifOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="absolute right-0 mt-2 w-80 bg-card/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/30 border border-border/50 z-50 overflow-hidden"
                      >
                        <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between">
                          <span className="text-sm font-bold text-foreground">Notifications</span>
                          {notifCount > 0 && <span className="text-xs text-primary font-semibold">{notifCount} new</span>}
                        </div>
                        <div className="max-h-72 overflow-y-auto">
                          {notifs.length === 0 ? (
                            <p className="text-sm text-muted-foreground/60 text-center py-8">No notifications</p>
                          ) : (
                            notifs.map(n => (
                              <button key={n.id} onClick={() => handleNotifClick(n.id)} className={`w-full text-left px-4 py-3 hover:bg-muted/30 border-b border-border/20 transition-colors ${!n.read ? 'bg-primary/[0.03]' : ''}`}>
                                <p className="text-sm font-medium text-foreground truncate">{n.title}</p>
                                <p className="text-xs text-muted-foreground/70 truncate mt-0.5">{n.message}</p>
                                <p className="text-[10px] text-muted-foreground/50 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                              </button>
                            ))
                          )}
                        </div>
                        <Link to="/notifications" onClick={() => setNotifOpen(false)} className="block text-center px-4 py-2.5 text-xs font-semibold text-primary hover:bg-muted/30 border-t border-border/30 transition-colors">View all notifications</Link>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Profile dropdown */}
              <div className="relative">
                <button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center gap-2 p-1.5 hover:bg-muted/50 rounded-xl transition-colors">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-primary/10 text-primary rounded-lg flex items-center justify-center text-xs font-semibold border border-primary/10">{user?.first_name?.[0]}{user?.last_name?.[0]}</div>
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/60" />
                </button>
                <AnimatePresence>
                  {profileOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="absolute right-0 mt-2 w-48 bg-card/95 backdrop-blur-xl rounded-xl shadow-xl border border-border/50 py-1 z-50"
                      >
                        <Link to="/profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground/90 hover:bg-muted/40 transition-colors"><User className="w-4 h-4" /> Profile</Link>
                        <Link to="/referrals" onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground/90 hover:bg-muted/40 transition-colors"><Gift className="w-4 h-4" /> Referrals</Link>
                        <div className="border-t border-border/30 my-1" />
                        <button onClick={() => { logout(); navigate('/login'); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/5 transition-colors"><LogOut className="w-4 h-4" /> Logout</button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 lg:p-6 overflow-auto">
            {/* Onboarding checklist */}
            {showOnboarding && onboarding.progress < 100 && location.pathname === '/dashboard' && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 bg-card/60 backdrop-blur-sm rounded-2xl border border-border/50 p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">🚀 Get started with SubFlow</h3>
                    <p className="text-xs text-muted-foreground/70 mt-0.5">Complete these steps to set up your account</p>
                  </div>
                  <button onClick={() => setShowOnboarding(false)} className="text-muted-foreground/50 hover:text-muted-foreground p-1 rounded-lg hover:bg-muted/50 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="w-full bg-muted/50 rounded-full h-1.5 mb-4 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${onboarding.progress}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="bg-gradient-to-r from-primary to-primary/70 rounded-full h-1.5"
                  />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {onboarding.steps.map(s => (
                    <Link key={s.id} to={s.link} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all ${s.completed ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-card/50 text-foreground/80 hover:bg-muted/50 border border-border/50'}`}>
                      {s.completed ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <span className="w-4 h-4 rounded-full border-2 border-border" />}
                      <span className="truncate">{s.title}</span>
                    </Link>
                  ))}
                </div>
              </motion.div>
            )}
            <Outlet />
          </main>
        </div>
      </div>
    </GlobalBackground>
  );
}

// ====================================================================
// ADMIN LAYOUT — Premium glass enterprise
// ====================================================================
const adminNav = [
  { key: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { key: '/admin/users', label: 'Users', icon: Users },
  { key: '/admin/services', label: 'Services', icon: Server },
  { key: '/admin/plans', label: 'Plans', icon: Package },
  { key: '/admin/subscriptions', label: 'Subscriptions', icon: CreditCard },
  { key: '/admin/revenue', label: 'Revenue', icon: DollarSign },
  { key: '/admin/payments', label: 'Payments', icon: Wallet },
  { key: '/admin/tickets', label: 'Support', icon: MessageSquare },
  { key: '/admin/status', label: 'System Status', icon: Activity },
  { key: '/admin/settings', label: 'Settings', icon: Settings },
];

export function AdminLayout() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <GlobalBackground intensity="subtle">
      <div className="min-h-screen flex">
        <CommandPalette />

        {/* ==================== ADMIN GLASS SIDEBAR ==================== */}
        <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-card/70 backdrop-blur-xl border-r border-border/50 flex flex-col transition-transform duration-300 ease-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
          <div className="h-16 flex items-center gap-2.5 px-6 border-b border-border/30">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-md shadow-primary/20">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-foreground tracking-tight">SubFlow</span>
            <span className="ml-auto px-2 py-0.5 bg-amber-500/15 text-amber-500 dark:text-amber-400 text-[10px] font-bold rounded-full border border-amber-500/20">ADMIN</span>
          </div>

          <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
            {adminNav.map(item => {
              const active = item.exact ? location.pathname === item.key : location.pathname.startsWith(item.key);
              return (
                <SidebarItem key={item.key} item={item} active={active} onClick={() => setSidebarOpen(false)} />
              );
            })}
          </nav>

          <div className="p-4 border-t border-border/30">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-primary/20 to-primary/10 text-primary rounded-xl flex items-center justify-center text-sm font-semibold border border-primary/10">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{user?.first_name} {user?.last_name}</p>
                <p className="text-xs text-muted-foreground/70 truncate">{user?.email}</p>
              </div>
            </div>
          </div>
        </aside>

        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 bg-card/50 backdrop-blur-xl border-b border-border/30 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-20">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-muted/50 rounded-xl transition-colors">
              <Menu className="w-5 h-5 text-muted-foreground" />
            </button>
            <div className="flex items-center gap-2 text-sm text-muted-foreground/70">
              <BarChart3 className="w-4 h-4" />
              <span className="font-medium">Admin Panel</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ThemeToggle />
              <button className="relative p-2 hover:bg-muted/50 rounded-xl transition-colors">
                <Bell className="w-5 h-5 text-muted-foreground" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full shadow-sm shadow-red-500/30" />
              </button>
              <button onClick={() => { logout(); navigate('/login'); }} className="flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/5 rounded-xl transition-colors font-medium">
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          </header>

          <main className="flex-1 p-4 lg:p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </GlobalBackground>
  );
}
