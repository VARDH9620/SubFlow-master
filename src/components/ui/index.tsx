import { type ReactNode, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { Toast } from '../../types';
import { motion, AnimatePresence, useMotionValue, useMotionTemplate, type HTMLMotionProps } from 'framer-motion';
import {
  springSnappy,
  springGentle,
  toastVariants,
  overlayVariants,
  modalVariants,
  staggerItem,
} from '../../design/animation';

/* ================================================================
   BUTTON — Premium with glow, lift, shine sweep
   ================================================================ */
interface ButtonProps extends Omit<HTMLMotionProps<"button">, 'ref'> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: ReactNode;
}

export function Button({ variant = 'primary', size = 'md', loading, children, className = '', disabled, ...props }: ButtonProps) {
  const base = 'inline-flex relative items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden shine-sweep';

  const v: Record<string, string> = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary shadow-md shadow-primary/15 hover:shadow-lg hover:shadow-primary/20',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 focus:ring-secondary shadow-sm',
    danger: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:ring-destructive shadow-md shadow-destructive/15',
    ghost: 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted/60 focus:ring-muted shadow-none',
    outline: 'border border-border bg-transparent text-foreground hover:bg-accent/50 hover:border-primary/30 focus:ring-ring shadow-sm',
  };

  const s: Record<string, string> = {
    sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-lg',
    md: 'h-10 px-5 text-[14px] gap-2',
    lg: 'h-12 px-8 text-[15px] gap-2.5',
  };

  return (
    <motion.button
      whileHover={disabled || loading ? {} : { y: -2 }}
      whileTap={disabled || loading ? {} : { y: 1, scale: 0.98 }}
      transition={springSnappy}
      className={`${base} ${v[variant]} ${s[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4 relative z-10" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      <span className="relative z-10 flex items-center gap-inherit">{children}</span>
    </motion.button>
  );
}

/* ================================================================
   INPUT — Animated focus glow, glass background
   ================================================================ */
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string; error?: string; helper?: string;
}
export function Input({ label, error, helper, className = '', id, ...props }: InputProps) {
  const elId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="w-full space-y-1.5">
      {label && <label htmlFor={elId} className="block text-[13px] font-medium text-foreground tracking-tight">{label}</label>}
      <div className="relative group">
        <input
          id={elId}
          className={`flex h-10 w-full rounded-xl border bg-card/70 px-3.5 py-2 text-[14px] ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground/60 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 aura-glow-focus ${error ? 'border-destructive' : 'border-border hover:border-primary/30'} ${className}`}
          {...props}
        />
      </div>
      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="text-[13px] font-medium text-destructive flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> {error}
          </motion.p>
        )}
      </AnimatePresence>
      {helper && !error && <p className="text-[12px] text-muted-foreground/70">{helper}</p>}
    </div>
  );
}

/* ================================================================
   SELECT — Premium styled
   ================================================================ */
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}
export function Select({ label, options, className = '', id, ...props }: SelectProps) {
  const elId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="w-full space-y-2">
      {label && <label htmlFor={elId} className="text-sm font-semibold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground/90">{label}</label>}
      <select id={elId} className={`flex h-10 w-full rounded-xl border border-border bg-card/70 px-3.5 py-2 text-[14px] ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 hover:border-primary/30 aura-glow-focus focus:outline-none ${className}`} {...props}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

/* ================================================================
   TEXTAREA — Premium
   ================================================================ */
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string; error?: string;
}
export function Textarea({ label, error, className = '', id, ...props }: TextareaProps) {
  const elId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="w-full space-y-2">
      {label && <label htmlFor={elId} className="text-sm font-semibold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground/90">{label}</label>}
      <textarea id={elId} className={`flex min-h-[80px] w-full rounded-xl border bg-card/70 px-3.5 py-2.5 text-[14px] ring-offset-background placeholder:text-muted-foreground/60 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 aura-glow-focus focus:outline-none ${error ? 'border-destructive' : 'border-border hover:border-primary/30'} ${className}`} {...props} />
      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="text-[13px] font-medium text-destructive flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ================================================================
   CARD — Layered depth, glow borders, hover effects
   ================================================================ */
interface CardProps { children: ReactNode; className?: string; padding?: boolean; interactive?: boolean; glow?: boolean }
export function Card({ children, className = '', padding = true, interactive = false, glow = false }: CardProps) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const { left, top } = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - left);
    mouseY.set(e.clientY - top);
  }

  return (
    <motion.div
      onMouseMove={interactive ? handleMouseMove : undefined}
      whileHover={interactive ? { y: -4 } : {}}
      transition={springSnappy}
      className={`group relative overflow-hidden rounded-xl border border-border bg-card/80 text-card-foreground transition-all duration-300 ${interactive ? 'hover:shadow-lg hover:shadow-primary/[0.04] hover:border-primary/20 cursor-pointer' : 'shadow-sm'} ${glow ? 'pulse-glow' : ''} ${className}`}
    >
      {interactive && (
        <motion.div
          className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 group-hover:opacity-100"
          style={{
            background: useMotionTemplate`radial-gradient(400px circle at ${mouseX}px ${mouseY}px, var(--glow-primary), transparent 80%)`,
            zIndex: 0,
          }}
        />
      )}
      <div className={`relative z-10 h-full w-full ${padding ? 'p-6' : ''}`}>
        {children}
      </div>
    </motion.div>
  );
}

/* ================================================================
   BADGE — Premium rounded pills
   ================================================================ */
interface BadgeProps { variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple'; children: ReactNode; className?: string }
export function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  const v: Record<string, string> = {
    default:   'bg-secondary/80 text-secondary-foreground ring-1 ring-inset ring-foreground/10',
    success:   'bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 ring-1 ring-inset ring-emerald-500/20',
    warning:   'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 ring-1 ring-inset ring-amber-500/20',
    danger:    'bg-red-100/80 text-red-700 dark:bg-red-900/30 dark:text-red-400 ring-1 ring-inset ring-red-500/20',
    info:      'bg-blue-100/80 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 ring-1 ring-inset ring-blue-500/20',
    purple:    'bg-indigo-100/80 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 ring-1 ring-inset ring-indigo-500/20',
  };
  return <span className={`inline-flex items-center rounded-full border border-transparent px-2.5 py-0.5 text-xs font-semibold transition-all ${v[variant]} ${className}`}>{children}</span>;
}

/* ================================================================
   MODAL — Cinematic backdrop blur, scale animation, glass panel
   ================================================================ */
interface ModalProps { open: boolean; onClose: () => void; title: string; children: ReactNode; size?: 'sm' | 'md' | 'lg' }
export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [open, onClose]);

  const w: Record<string, string> = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl' };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-16 sm:pt-24 p-4 overflow-y-auto overflow-x-hidden">
          <motion.div
            variants={overlayVariants}
            initial="hidden" animate="show" exit="exit"
            className="fixed inset-0 bg-background/60 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            ref={ref}
            variants={modalVariants}
            initial="hidden" animate="show" exit="exit"
            className={`relative w-full rounded-2xl border border-border bg-card shadow-2xl shadow-black/10 dark:shadow-black/30 overflow-hidden flex flex-col mb-16 max-h-[85vh] ${w[size]}`}
          >
            <div className="flex flex-col space-y-1 p-6 border-b border-border/50 shrink-0 bg-card z-10">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold tracking-tight text-foreground">{title}</h3>
                <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

/* ================================================================
   STAT CARD — Animated metric with glow
   ================================================================ */
interface StatCardProps {
  title: string; value: string | number;
  change?: string; changeType?: 'positive' | 'negative' | 'neutral';
  icon: ReactNode; iconBg?: string;
}
export function StatCard({ title, value, change, changeType = 'neutral', icon, iconBg = 'text-muted-foreground' }: StatCardProps) {
  return (
    <Card interactive={true} className="relative group overflow-hidden">
      {/* Spotlight hover glow */}
      <div className="absolute -inset-1 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-xl" />
      <div className="relative">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <h3 className="tracking-tight text-sm font-medium text-muted-foreground">{title}</h3>
          <div className={`p-2 rounded-lg bg-muted/50 ${iconBg}`}>{icon}</div>
        </div>
        <div>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, ...springGentle }} className="text-2xl font-bold text-foreground tracking-tight">
            {value}
          </motion.div>
          {change && <p className={`text-xs mt-1.5 font-medium ${changeType === 'positive' ? 'text-emerald-600 dark:text-emerald-400' : changeType === 'negative' ? 'text-destructive' : 'text-muted-foreground'}`}>
            {changeType === 'positive' ? '↑' : changeType === 'negative' ? '↓' : '→'} {change}
          </p>}
        </div>
      </div>
    </Card>
  );
}

/* ================================================================
   TABLE — Premium enterprise dashboard look
   ================================================================ */
interface Column<T> { key: string; header: string; render?: (item: T) => ReactNode; className?: string }
interface TableProps<T> { columns: Column<T>[]; data: T[]; keyExtractor: (item: T) => string; emptyMessage?: string }
export function Table<T>({ columns, data, keyExtractor, emptyMessage = 'No results found.' }: TableProps<T>) {
  return (
    <div className="rounded-xl border border-border bg-card/90 overflow-hidden shadow-sm">
      <div className="w-full overflow-auto">
        <table className="w-full caption-bottom text-sm">
          <thead>
            <tr className="border-b border-border/50 bg-muted/30">
              {columns.map(c => (
                <th key={c.key} className={`h-11 px-4 text-left align-middle font-semibold text-xs text-muted-foreground uppercase tracking-wider ${c.className || ''}`}>{c.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0
              ? <tr><td colSpan={columns.length} className="h-24 text-center text-muted-foreground/70 text-sm">
                  <div className="flex flex-col items-center gap-2 py-8">
                    <Search className="w-5 h-5 text-muted-foreground/40" />
                    {emptyMessage}
                  </div>
                </td></tr>
              : data.map((item, index) => (
                <motion.tr
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.025, duration: 0.15, ease: 'easeOut' }}
                  key={keyExtractor(item)}
                  className="border-b border-border/30 transition-colors hover:bg-muted/30 group"
                >
                  {columns.map(c => (
                    <td key={c.key} className={`p-4 align-middle ${c.className || ''}`}>
                      {c.render ? c.render(item) : String((item as Record<string, unknown>)[c.key] ?? '')}
                    </td>
                  ))}
                </motion.tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ================================================================
   TOAST CONTAINER — Elegant motion with contextual glow
   ================================================================ */
export function ToastContainer() {
  const { toasts, removeToast } = useAuth();
  const icons: Record<Toast['type'], ReactNode> = {
    success: <CheckCircle className="w-5 h-5 text-emerald-500" />,
    error: <AlertCircle className="w-5 h-5 text-destructive" />,
    info: <Info className="w-5 h-5 text-primary" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
  };

  const glowColors: Record<Toast['type'], string> = {
    success: 'shadow-emerald-500/10',
    error: 'shadow-destructive/10',
    info: 'shadow-primary/10',
    warning: 'shadow-amber-500/10',
  };

  return (
    <div className="fixed bottom-0 right-0 z-[100] flex flex-col p-6 gap-2.5 max-w-[420px] w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            className={`group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-xl border border-border/80 p-4 pr-8 shadow-lg ${glowColors[t.type]} bg-card/95 text-foreground`}
          >
            <div className="flex gap-3 w-full items-center">
              <div className="shrink-0">{icons[t.type]}</div>
              <p className="text-sm font-medium leading-tight">{t.message}</p>
            </div>
            <button onClick={() => removeToast(t.id)} className="absolute right-2 top-2 rounded-lg p-1 text-foreground/40 opacity-0 transition-all hover:text-foreground hover:bg-muted/50 group-hover:opacity-100">
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ================================================================
   EMPTY STATE — Premium with glow icon
   ================================================================ */
interface EmptyStateProps { icon: ReactNode; title: string; description: string; action?: ReactNode }
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      variants={staggerItem}
      initial="hidden" animate="show"
      className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 p-8 text-center bg-card/30 backdrop-blur-sm"
    >
      <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted/50 mb-4 relative">
          <div className="absolute inset-0 rounded-2xl bg-primary/5 animate-pulse" />
          <div className="text-muted-foreground w-10 h-10 relative z-10">{icon}</div>
        </div>
        <h3 className="mt-4 text-lg font-bold text-foreground">{title}</h3>
        <p className="mb-6 mt-2 text-sm text-muted-foreground/80 leading-relaxed">{description}</p>
        {action}
      </div>
    </motion.div>
  );
}

/* ================================================================
   LOADING SPINNER — Futuristic
   ================================================================ */
export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const s = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className="flex items-center justify-center py-8 w-full">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        className={`${s[size]} rounded-full border-2 border-muted border-t-primary`}
      />
    </div>
  );
}

/* ================================================================
   SKELETON LOADER — Premium shimmer
   ================================================================ */
export function Skeleton({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`skeleton h-4 ${className}`} {...props} />;
}

/* ================================================================
   PAGE HEADER — Premium typography
   ================================================================ */
interface PageHeaderProps { title: string; description?: string; action?: ReactNode }
export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: 'easeOut' }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        {description && <p className="text-sm text-muted-foreground/80">{description}</p>}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </motion.div>
  );
}

/* ================================================================
   SEARCH BAR — Premium glass search
   ================================================================ */
interface SearchBarProps { value: string; onChange: (v: string) => void; placeholder?: string }
export function SearchBar({ value, onChange, placeholder = 'Search...' }: SearchBarProps) {
  return (
    <div className="relative group aura-glow-focus rounded-xl focus-within:ring-0">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 group-focus-within:text-primary/70 transition-colors" />
      <input type="search" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="flex h-9 w-full rounded-xl border border-border bg-card/70 pl-9 pr-4 py-2 text-sm ring-offset-background placeholder:text-muted-foreground/50 focus:outline-none transition-all duration-200 hover:border-primary/20 bg-transparent" />
    </div>
  );
}

/* ================================================================
   TABS — Animated pill indicator
   ================================================================ */
interface TabsProps { tabs: { key: string; label: string; count?: number }[]; active: string; onChange: (key: string) => void }
export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="inline-flex h-10 items-center justify-center rounded-xl bg-muted/70 p-1 text-muted-foreground mb-6 border border-border/50">
      {tabs.map(t => {
        const isActive = active === t.key;
        return (
          <button key={t.key} onClick={() => onChange(t.key)}
            className={`relative inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all duration-200 ${isActive ? 'bg-card text-foreground shadow-sm border border-border/50' : 'hover:text-foreground/80 hover:bg-muted/30'}`}
          >
            {t.label}
            {t.count !== undefined && (
              <span className={`ml-2 inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold ${isActive ? 'bg-primary/10 text-primary' : 'bg-muted-foreground/10 text-muted-foreground'}`}>{t.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ================================================================
   CONFIRM DIALOG — Premium glass
   ================================================================ */
interface ConfirmDialogProps {
  open: boolean; onClose: () => void; onConfirm: () => void;
  title: string; message: string; confirmLabel?: string; variant?: 'danger' | 'primary';
}
export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', variant = 'danger' }: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-muted-foreground/80 mb-6 leading-relaxed">{message}</p>
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
        <Button variant="outline" onClick={onClose} className="mt-2 sm:mt-0">Cancel</Button>
        <Button variant={variant === 'danger' ? 'danger' : 'primary'} onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</Button>
      </div>
    </Modal>
  );
}

/* ================================================================
   ANIMATIONS & SKELETONS — Global rollout components
   ================================================================ */

export function AnimatedContainer({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedItem({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: 'spring', damping: 20, stiffness: 300 } }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function SkeletonCardGrid({ count = 6, cols = 'sm:grid-cols-2 lg:grid-cols-3' }: { count?: number; cols?: string }) {
  return (
    <div className={`grid gap-6 ${cols}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-card/50 p-6 h-[220px] flex flex-col justify-between">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl skeleton flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-3/4 rounded skeleton" />
              <div className="h-4 w-1/3 rounded skeleton" />
            </div>
          </div>
          <div className="space-y-2 mb-4">
            <div className="h-4 w-full rounded skeleton" />
            <div className="h-4 w-5/6 rounded skeleton" />
          </div>
          <div className="flex justify-between items-center pt-4 border-t border-border/50">
            <div className="h-6 w-24 rounded skeleton" />
            <div className="h-8 w-24 rounded skeleton" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({ columns = 5, rows = 5 }: { columns?: number; rows?: number }) {
  return (
    <Card padding={false}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i} className="text-left py-3 px-4"><div className="h-3 w-16 skeleton rounded" /></th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, i) => (
              <tr key={i} className="border-b border-gray-50/10">
                {Array.from({ length: columns }).map((_, j) => (
                  <td key={j} className="py-4 px-4">
                    {j === 0 ? (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full skeleton shrink-0" />
                        <div className="h-4 w-24 skeleton rounded" />
                      </div>
                    ) : (
                      <div className={`h-4 skeleton rounded ${j === columns - 1 ? 'w-8 ml-auto' : 'w-20'}`} />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
