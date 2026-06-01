import { useEffect, useState } from 'react';
import { CreditCard, RefreshCw } from 'lucide-react';
import * as db from '../../db/database';
import { Card, PageHeader, Badge, SearchBar, Tabs, Button, EmptyState, ConfirmDialog, Select, AnimatedContainer, AnimatedItem, SkeletonTable } from '../../components/ui';
import type { Subscription, SubscriptionStatus } from '../../types';

const statusBadge: Record<SubscriptionStatus, 'success' | 'warning' | 'danger' | 'default'> = {
  active: 'success', paused: 'warning', cancelled: 'danger', expired: 'default',
};

export default function AdminSubscriptions() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');
  const [actionSub, setActionSub] = useState<Subscription | null>(null);
  const [newStatus, setNewStatus] = useState<SubscriptionStatus>('active');
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    setSubs(await db.getAllSubscriptions());
    setTimeout(() => setLoading(false), 200);
  };
  useEffect(() => { refresh(); }, []);

  const tabs = [
    { key: 'all', label: 'All', count: subs.length },
    { key: 'active', label: 'Active', count: subs.filter(s => s.status === 'active').length },
    { key: 'paused', label: 'Paused', count: subs.filter(s => s.status === 'paused').length },
    { key: 'cancelled', label: 'Cancelled', count: subs.filter(s => s.status === 'cancelled').length },
  ];

  const filtered = subs
    .filter(s => tab === 'all' || s.status === tab)
    .filter(s => search === '' || (s.user_email || '').toLowerCase().includes(search.toLowerCase()) || (s.service_name || '').toLowerCase().includes(search.toLowerCase()));

  const handleStatusChange = async () => {
    if (!actionSub) return;
    await db.updateSubscriptionStatus(actionSub.id, newStatus);
    setActionSub(null);
    await refresh();
  };

  return (
    <div className="animate-fadeIn">
      <PageHeader title="Subscriptions" description="Manage all user subscriptions" action={<Button variant="outline" onClick={refresh} className="gap-2"><RefreshCw className="w-4 h-4" /> Refresh</Button>} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <Tabs tabs={tabs} active={tab} onChange={setTab} />
        <div className="w-full sm:w-64"><SearchBar value={search} onChange={setSearch} placeholder="Search by user or service..." /></div>
      </div>

      {loading ? (
        <AnimatedContainer>
          <AnimatedItem>
            <SkeletonTable columns={9} rows={6} />
          </AnimatedItem>
        </AnimatedContainer>
      ) : filtered.length === 0 ? (
        <AnimatedContainer>
          <AnimatedItem>
            <EmptyState icon={<CreditCard className="w-10 h-10" />} title="No subscriptions" description="No subscriptions match your filters" />
          </AnimatedItem>
        </AnimatedContainer>
      ) : (
        <AnimatedContainer>
          <AnimatedItem>
            <Card padding={false}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border dark:border-dark-surface-3/60">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground dark:text-slate-300 uppercase">User</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground dark:text-slate-300 uppercase">Service</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground dark:text-slate-300 uppercase">Plan</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground dark:text-slate-300 uppercase">Price</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground dark:text-slate-300 uppercase">Status</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground dark:text-slate-300 uppercase">Start</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground dark:text-slate-300 uppercase">End</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground dark:text-slate-300 uppercase">Auto</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground dark:text-slate-300 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(sub => (
                    <tr key={sub.id} className="border-b border-border/50 dark:border-dark-surface-3/40 hover:bg-muted/50 dark:hover:bg-primary-900/10 transition-colors">
                      <td className="py-3 px-4">
                        <div><p className="text-sm font-medium text-foreground">{sub.user_name}</p><p className="text-xs text-muted-foreground/80 dark:text-slate-400">{sub.user_email}</p></div>
                      </td>
                      <td className="py-3 px-4 text-sm text-foreground/90">{sub.service_name}</td>
                      <td className="py-3 px-4 text-sm text-foreground/90">{sub.plan_name}</td>
                      <td className="py-3 px-4 text-sm font-medium text-foreground">${(sub.price || 0).toFixed(2)}</td>
                      <td className="py-3 px-4"><Badge variant={statusBadge[sub.status]}>{sub.status}</Badge></td>
                      <td className="py-3 px-4 text-sm text-muted-foreground dark:text-slate-300">{sub.start_date}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground dark:text-slate-300">{sub.end_date}</td>
                      <td className="py-3 px-4">{sub.auto_renew ? <Badge variant="info">On</Badge> : <Badge>Off</Badge>}</td>
                      <td className="py-3 px-4 text-right">
                        <Button size="sm" variant="ghost" onClick={() => { setActionSub(sub); setNewStatus(sub.status); }}>
                          Change
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </Card>
          </AnimatedItem>
        </AnimatedContainer>
      )}

      {/* Status change dialog */}
      <ConfirmDialog
        open={!!actionSub}
        onClose={() => setActionSub(null)}
        onConfirm={handleStatusChange}
        title="Change Subscription Status"
        message=""
        confirmLabel="Update Status"
        variant="primary"
      >
      </ConfirmDialog>

      {/* Custom status change modal */}
      {actionSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setActionSub(null)}>
          <div className="fixed inset-0 bg-gray-900/20 dark:bg-black/60 backdrop-blur-[2px]" />
          <div className="relative bg-card border border-gray-250 dark:border-dark-surface-3 rounded-xl shadow-2xl dark:shadow-black/40 max-w-sm w-full p-6 animate-scaleIn" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-foreground mb-2">Change Status</h3>
            <p className="text-sm text-muted-foreground dark:text-slate-300 mb-4">
              {actionSub.user_name} — {actionSub.service_name} ({actionSub.plan_name})
            </p>
            <Select
              label="New Status"
              value={newStatus}
              onChange={e => setNewStatus(e.target.value as SubscriptionStatus)}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'paused', label: 'Paused' },
                { value: 'cancelled', label: 'Cancelled' },
                { value: 'expired', label: 'Expired' },
              ]}
            />
            <div className="flex gap-3 justify-end mt-6">
              <Button variant="outline" onClick={() => setActionSub(null)}>Cancel</Button>
              <Button onClick={handleStatusChange}>Update</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
