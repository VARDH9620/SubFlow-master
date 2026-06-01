import { useEffect, useState } from 'react';
import { CreditCard, Pause, Play, XCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import * as db from '../../db/database';
import { Card, Badge, Button, PageHeader, EmptyState, ConfirmDialog, AnimatedContainer, AnimatedItem, SkeletonCardGrid } from '../../components/ui';
import type { Subscription, SubscriptionStatus } from '../../types';

const statusConfig: Record<SubscriptionStatus, { variant: 'success' | 'warning' | 'danger' | 'default'; label: string }> = {
  active: { variant: 'success', label: 'Active' },
  paused: { variant: 'warning', label: 'Paused' },
  cancelled: { variant: 'danger', label: 'Cancelled' },
  expired: { variant: 'default', label: 'Expired' },
};

export default function Subscriptions() {
  const { user, addToast } = useAuth();
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [filter, setFilter] = useState<SubscriptionStatus | 'all'>('all');
  const [confirmAction, setConfirmAction] = useState<{ id: string; action: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!user) return;
    setLoading(true);
    const userSubs = await db.getSubscriptionsByUser(user.id);
    setSubs(userSubs);
    setTimeout(() => setLoading(false), 200);
  };

  useEffect(() => { refresh(); }, [user]);

  const filtered = filter === 'all' ? subs : subs.filter(s => s.status === filter);

  const handleAction = async (id: string, action: string) => {
    switch (action) {
      case 'pause':
        await db.updateSubscriptionStatus(id, 'paused');
        addToast('Subscription paused', 'info');
        break;
      case 'resume':
        await db.updateSubscriptionStatus(id, 'active');
        addToast('Subscription resumed', 'success');
        break;
      case 'cancel':
        await db.updateSubscriptionStatus(id, 'cancelled');
        addToast('Subscription cancelled', 'warning');
        break;
      case 'toggle_renew':
        await db.toggleAutoRenew(id);
        addToast('Auto-renew toggled', 'info');
        break;
    }
    setConfirmAction(null);
    await refresh();
  };

  const counts = {
    all: subs.length,
    active: subs.filter(s => s.status === 'active').length,
    paused: subs.filter(s => s.status === 'paused').length,
    cancelled: subs.filter(s => s.status === 'cancelled').length,
    expired: subs.filter(s => s.status === 'expired').length,
  };

  return (
    <div className="animate-fadeIn">
      <PageHeader title="My Subscriptions" description="Manage your active and past subscriptions" />

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(['all', 'active', 'paused', 'cancelled'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm font-medium rounded-lg cursor-pointer transition-colors ${filter === f ? 'bg-primary-50 dark:bg-primary-500/10 text-primary/90 dark:text-primary-400' : 'text-muted-foreground dark:text-slate-300 hover:bg-muted dark:hover:bg-dark-surface-3/60'}`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
            <span className="ml-1.5 text-xs opacity-60">{counts[f]}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <AnimatedContainer>
          <AnimatedItem>
            <SkeletonCardGrid count={3} cols="grid-cols-1" />
          </AnimatedItem>
        </AnimatedContainer>
      ) : filtered.length === 0 ? (
        <AnimatedContainer>
          <AnimatedItem>
            <EmptyState
              icon={<CreditCard className="w-10 h-10" />}
              title="No subscriptions found"
              description={filter === 'all' ? "You haven't subscribed to any plans yet" : `No ${filter} subscriptions`}
              action={<Button onClick={() => window.location.href = '/services'}>Browse Services</Button>}
            />
          </AnimatedItem>
        </AnimatedContainer>
      ) : (
        <AnimatedContainer className="grid gap-4">
          {filtered.map(sub => {
            const cfg = statusConfig[sub.status];
            return (
              <AnimatedItem key={sub.id}>
                <Card className="hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-primary-50 dark:bg-primary-500/10 text-primary rounded-xl">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{sub.service_name}</h3>
                        <p className="text-sm text-muted-foreground dark:text-slate-300">{sub.plan_name} · ${sub.price}/mo</p>
                        <div className="flex gap-4 mt-2 text-xs text-muted-foreground/80 dark:text-slate-400">
                          <span>Started: {sub.start_date}</span>
                          <span>Ends: {sub.end_date}</span>
                          {sub.trial_end && <span>Trial until: {sub.trial_end}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge variant={cfg.variant}>{cfg.label}</Badge>
                      {sub.auto_renew && (
                        <Badge variant="info">
                          <RefreshCw className="w-3 h-3 mr-1" /> Auto-renew
                        </Badge>
                      )}

                      <div className="flex gap-1">
                        {sub.status === 'active' && (
                          <>
                            <button onClick={() => setConfirmAction({ id: sub.id, action: 'pause' })} className="p-2 hover:bg-muted dark:hover:bg-dark-surface-3/60 rounded-lg cursor-pointer" title="Pause">
                              <Pause className="w-4 h-4 text-muted-foreground dark:text-slate-300" />
                            </button>
                            <button onClick={() => setConfirmAction({ id: sub.id, action: 'cancel' })} className="p-2 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg cursor-pointer" title="Cancel">
                              <XCircle className="w-4 h-4 text-red-500" />
                            </button>
                          </>
                        )}
                        {sub.status === 'paused' && (
                          <>
                            <button onClick={() => setConfirmAction({ id: sub.id, action: 'resume' })} className="p-2 hover:bg-muted dark:hover:bg-dark-surface-3/60 rounded-lg cursor-pointer" title="Resume">
                              <Play className="w-4 h-4 text-emerald-500" />
                            </button>
                            <button onClick={() => setConfirmAction({ id: sub.id, action: 'cancel' })} className="p-2 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg cursor-pointer" title="Cancel">
                              <XCircle className="w-4 h-4 text-red-500" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </AnimatedItem>
            );
          })}
        </AnimatedContainer>
      )}

      <ConfirmDialog
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => confirmAction && handleAction(confirmAction.id, confirmAction.action)}
        title={confirmAction?.action === 'cancel' ? 'Cancel Subscription' : confirmAction?.action === 'pause' ? 'Pause Subscription' : 'Resume Subscription'}
        message={confirmAction?.action === 'cancel'
          ? 'Are you sure you want to cancel this subscription? This action cannot be undone.'
          : confirmAction?.action === 'pause'
          ? 'This will pause your subscription. You can resume it anytime.'
          : 'This will resume your subscription immediately.'}
        confirmLabel={confirmAction?.action === 'cancel' ? 'Cancel Subscription' : 'Confirm'}
        variant={confirmAction?.action === 'cancel' ? 'danger' : 'primary'}
      />
    </div>
  );
}
