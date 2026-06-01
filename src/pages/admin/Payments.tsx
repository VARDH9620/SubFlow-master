import { useEffect, useState } from 'react';
import {
  DollarSign, CreditCard, Wallet, Building, TrendingUp,
  AlertCircle, Eye, RotateCcw, ArrowUpDown, Download
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import * as db from '../../db/database';
import { Card, StatCard, PageHeader, Badge, SearchBar, Tabs, Button, Modal, Textarea, EmptyState, AnimatedContainer, AnimatedItem, SkeletonCardGrid, SkeletonTable } from '../../components/ui';
import { generateInvoicePDF } from '../../utils/invoicePdf';
import type { Payment, PaymentStats } from '../../types';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
const methodIcons: Record<string, React.ReactNode> = {
  card: <CreditCard className="w-4 h-4" />,
  paypal: <Wallet className="w-4 h-4" />,
  bank_transfer: <Building className="w-4 h-4" />,
};

export default function AdminPayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [tab, setTab] = useState<'all' | 'paid' | 'refunded' | 'failed'>('all');
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<'date' | 'amount'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Detail modal
  const [detailPayment, setDetailPayment] = useState<Payment | null>(null);

  // Refund modal
  const [refundPaymentId, setRefundPaymentId] = useState<string | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    const [list, statsData] = await Promise.all([
      db.getAllPayments(),
      db.getPaymentStats()
    ]);
    setPayments(list);
    setStats(statsData);
    setTimeout(() => setLoading(false), 200);
  };

  useEffect(() => { refresh(); }, []);

  const filtered = payments
    .filter(p => tab === 'all' || p.status === tab)
    .filter(p => search === '' ||
      (p.user_email || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.user_name || '').toLowerCase().includes(search.toLowerCase()) ||
      p.transaction_id.toLowerCase().includes(search.toLowerCase()) ||
      (p.service_name || '').toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const mul = sortDir === 'desc' ? -1 : 1;
      if (sortField === 'date') return mul * (new Date(a.paid_at).getTime() - new Date(b.paid_at).getTime());
      return mul * (a.total - b.total);
    });

  const handleRefund = async () => {
    if (!refundPaymentId || !refundReason.trim()) return;
    await db.refundPayment(refundPaymentId, refundReason, 'admin-001');
    setRefundPaymentId(null);
    setRefundReason('');
    await refresh();
  };

  const toggleSort = (field: 'date' | 'amount') => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  return (
    <div className="animate-fadeIn">
      <PageHeader title="Payments" description="All platform payments — synced with user billing in real-time" />

      {loading || !stats ? (
        <AnimatedContainer>
          <AnimatedItem>
             <SkeletonCardGrid count={4} cols="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" />
          </AnimatedItem>
          <AnimatedItem className="mt-6">
             <SkeletonCardGrid count={2} cols="grid-cols-1 lg:grid-cols-2" />
          </AnimatedItem>
          <AnimatedItem className="mt-6">
             <SkeletonTable columns={8} rows={6} />
          </AnimatedItem>
        </AnimatedContainer>
      ) : (
        <AnimatedContainer>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Collected" value={`$${stats.total_collected.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} icon={<DollarSign className="w-5 h-5" />} iconBg="bg-emerald-50 text-emerald-600" change={`${stats.successful_payments} transactions`} changeType="positive" />
        <StatCard title="Pending Invoices" value={`$${stats.total_pending.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} icon={<AlertCircle className="w-5 h-5" />} iconBg="bg-amber-50 text-amber-600" change="Awaiting payment" changeType="negative" />
        <StatCard title="Refunded" value={`$${stats.total_refunded.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} icon={<RotateCcw className="w-5 h-5" />} iconBg="bg-red-50 text-red-600" change={`${payments.filter(p => p.status === 'refunded').length} refunds`} />
        <StatCard title="This Month" value={`$${stats.this_month_revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} icon={<TrendingUp className="w-5 h-5" />} iconBg="bg-purple-50 text-purple-600" change={`Avg $${stats.avg_transaction}/txn`} changeType="positive" />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2">
          <h3 className="text-sm font-semibold text-foreground mb-4">Daily Revenue (Last 14 days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.daily_revenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-chart-grid)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-chart-text)' }} stroke="var(--color-chart-axis)" angle={-30} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--color-chart-text)' }} stroke="var(--color-chart-axis)" />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--color-tooltip-bg)', borderColor: 'var(--color-tooltip-border)', borderRadius: '8px', color: 'var(--color-tooltip-text)' }}
                  itemStyle={{ color: 'var(--color-tooltip-text)' }}
                  labelStyle={{ color: 'var(--color-tooltip-text)', fontWeight: 'bold' }}
                  formatter={(v) => [`$${v}`, 'Revenue']}
                />
                <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-foreground mb-4">Payment Methods</h3>
          {stats.by_method.length > 0 ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats.by_method.map(m => ({ name: m.method, value: m.count }))} cx="50%" cy="50%" outerRadius={60} dataKey="value" label={({ name }) => name}>
                    {stats.by_method.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--color-tooltip-bg)', borderColor: 'var(--color-tooltip-border)', borderRadius: '8px', color: 'var(--color-tooltip-text)' }}
                    itemStyle={{ color: 'var(--color-tooltip-text)' }}
                    labelStyle={{ color: 'var(--color-tooltip-text)', fontWeight: 'bold' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground/80 text-center py-8">No payment data yet</p>
          )}
          <div className="mt-2 space-y-2">
            {stats.by_method.map((m, i) => (
              <div key={m.method} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-muted-foreground capitalize flex items-center gap-1">{methodIcons[m.method]} {m.method.replace('_', ' ')}</span>
                </div>
                <div className="text-right">
                  <span className="font-medium text-foreground">{m.count}</span>
                  <span className="text-muted-foreground/80 ml-1">${m.total.toFixed(0)}</span>
                </div>
              </div>
            ))}
          </div>

          {stats.by_brand.length > 0 && (
            <div className="mt-4 pt-3 border-t">
              <p className="text-xs font-medium text-muted-foreground mb-2">Card Brands</p>
              {stats.by_brand.map(b => (
                <div key={b.brand} className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground capitalize">{b.brand}</span>
                  <span className="text-foreground">{b.count} · ${b.total.toFixed(0)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Payments table */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <Tabs
          tabs={[
            { key: 'all', label: 'All', count: payments.length },
            { key: 'paid', label: 'Paid', count: payments.filter(p => p.status === 'paid').length },
            { key: 'refunded', label: 'Refunded', count: payments.filter(p => p.status === 'refunded').length },
            { key: 'failed', label: 'Failed', count: payments.filter(p => p.status === 'failed').length },
          ]}
          active={tab}
          onChange={k => setTab(k as 'all' | 'paid' | 'refunded' | 'failed')}
        />
        <div className="w-full sm:w-64"><SearchBar value={search} onChange={setSearch} placeholder="Search by user, txn, service..." /></div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<DollarSign className="w-10 h-10" />} title="No payments found" description="Payments will appear here when users pay invoices" />
      ) : (
        <Card padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Transaction</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">User</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Service</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase cursor-pointer select-none" onClick={() => toggleSort('amount')}>
                    <span className="flex items-center gap-1">Amount <ArrowUpDown className="w-3 h-3" /></span>
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Method</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase cursor-pointer select-none" onClick={() => toggleSort('date')}>
                    <span className="flex items-center gap-1">Date <ArrowUpDown className="w-3 h-3" /></span>
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Status</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 50).map(p => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-muted/50/50">
                    <td className="py-3 px-4">
                      <p className="text-sm font-mono text-muted-foreground">{p.transaction_id.slice(0, 22)}</p>
                      <p className="text-xs text-muted-foreground/80 font-mono">{p.invoice_number?.slice(0, 16)}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm text-foreground font-medium">{p.user_name}</p>
                      <p className="text-xs text-muted-foreground/80">{p.user_email}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm text-muted-foreground">{p.service_name || '—'}</p>
                      <p className="text-xs text-muted-foreground/80">{p.plan_name}</p>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm">
                        <div className="text-muted-foreground">${p.amount.toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground/80">+${p.tax.toFixed(2)} tax</div>
                        <div className="font-semibold text-foreground">${p.total.toFixed(2)}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        {methodIcons[p.method_type] || <CreditCard className="w-4 h-4" />}
                        <span>{p.method}</span>
                      </div>
                      {p.card_brand && <p className="text-xs text-muted-foreground/80 capitalize">{p.card_brand} •••• {p.card_last4}</p>}
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {new Date(p.paid_at).toLocaleDateString()}
                      <p className="text-xs text-muted-foreground/80">{new Date(p.paid_at).toLocaleTimeString()}</p>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={p.status === 'paid' ? 'success' : p.status === 'refunded' ? 'warning' : 'danger'}>
                        {p.status === 'refunded' ? 'Refunded' : p.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => setDetailPayment(p)} className="p-1.5 hover:bg-muted rounded-lg" title="View details">
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        </button>
                        {p.status === 'paid' && (
                          <button onClick={() => { setRefundPaymentId(p.id); setRefundReason(''); }} className="p-1.5 hover:bg-red-50 rounded-lg" title="Refund">
                            <RotateCcw className="w-4 h-4 text-red-500" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
        </AnimatedContainer>
      )}

      {/* Detail Modal */}
      <Modal open={!!detailPayment} onClose={() => setDetailPayment(null)} title="Payment Details" size="lg">
        {detailPayment && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground/80 uppercase tracking-wider">Transaction ID</p>
                <p className="text-sm font-mono text-foreground mt-0.5">{detailPayment.transaction_id}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground/80 uppercase tracking-wider">Invoice</p>
                <p className="text-sm font-mono text-foreground mt-0.5">{detailPayment.invoice_number}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground/80 uppercase tracking-wider">User</p>
                <p className="text-sm text-foreground mt-0.5">{detailPayment.user_name} <span className="text-muted-foreground/80">({detailPayment.user_email})</span></p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground/80 uppercase tracking-wider">Service / Plan</p>
                <p className="text-sm text-foreground mt-0.5">{detailPayment.service_name} — {detailPayment.plan_name}</p>
              </div>
            </div>

            <div className="bg-muted/50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>${detailPayment.amount.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Tax (18%)</span><span>${detailPayment.tax.toFixed(2)}</span></div>
              {detailPayment.discount > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Discount</span><span className="text-emerald-600">-${detailPayment.discount.toFixed(2)}</span></div>}
              <div className="flex justify-between text-sm font-bold pt-2 border-t"><span>Total</span><span>${detailPayment.total.toFixed(2)}</span></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground/80 uppercase tracking-wider">Payment Method</p>
                <p className="text-sm text-foreground mt-0.5 flex items-center gap-1.5">
                  {methodIcons[detailPayment.method_type]} {detailPayment.method}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground/80 uppercase tracking-wider">Status</p>
                <div className="mt-0.5">
                  <Badge variant={detailPayment.status === 'paid' ? 'success' : detailPayment.status === 'refunded' ? 'warning' : 'danger'}>
                    {detailPayment.status}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground/80 uppercase tracking-wider">Date</p>
                <p className="text-sm text-foreground mt-0.5">{new Date(detailPayment.paid_at).toLocaleString()}</p>
              </div>
              {detailPayment.card_brand && (
                <div>
                  <p className="text-xs text-muted-foreground/80 uppercase tracking-wider">Card</p>
                  <p className="text-sm text-foreground mt-0.5 capitalize">{detailPayment.card_brand} •••• {detailPayment.card_last4} · {detailPayment.card_holder}</p>
                </div>
              )}
            </div>

            {detailPayment.billing_address && (
              <div>
                <p className="text-xs text-muted-foreground/80 uppercase tracking-wider">Billing Address</p>
                <p className="text-sm text-foreground mt-0.5">{detailPayment.billing_address}, {detailPayment.billing_city}, {detailPayment.billing_state} {detailPayment.billing_zip}, {detailPayment.billing_country}</p>
              </div>
            )}

            {detailPayment.status === 'refunded' && (
              <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4">
                <p className="text-xs text-red-400 dark:text-red-500 uppercase tracking-wider mb-1">Refund Details</p>
                <p className="text-sm text-red-700 dark:text-red-400"><strong>Reason:</strong> {detailPayment.refund_reason}</p>
                <p className="text-xs text-red-500 dark:text-red-500 mt-1">Refunded at: {detailPayment.refunded_at ? new Date(detailPayment.refunded_at).toLocaleString() : 'N/A'}</p>
              </div>
            )}

            <div className="pt-4 border-t border-border/50 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => {
                  // Invoices mapping updated via async load
                  const inv = null;
                  if (inv) generateInvoicePDF(inv, detailPayment, { mode: detailPayment.status === 'paid' ? 'receipt' : 'invoice' });
                }}
              >
                <Download className="w-4 h-4" /> Download PDF
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Refund Modal */}
      <Modal open={!!refundPaymentId} onClose={() => setRefundPaymentId(null)} title="Process Refund" size="md">
        <div className="space-y-4">
          <div className="bg-red-50 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-800">This action cannot be undone</p>
              <p className="text-xs text-red-600 mt-1">The payment will be marked as refunded and the linked invoice will be updated. The user will be notified.</p>
            </div>
          </div>

          {(() => {
            const p = payments.find(p => p.id === refundPaymentId);
            if (!p) return null;
            return (
              <div className="bg-muted/50 rounded-xl p-4 space-y-1">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Transaction</span><span className="font-mono text-xs">{p.transaction_id.slice(0, 22)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">User</span><span>{p.user_name}</span></div>
                <div className="flex justify-between text-sm font-bold"><span>Refund Amount</span><span className="text-red-600">${p.total.toFixed(2)}</span></div>
              </div>
            );
          })()}

          <Textarea
            label="Refund Reason"
            value={refundReason}
            onChange={e => setRefundReason(e.target.value)}
            placeholder="Explain why this payment is being refunded..."
            rows={3}
          />

          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setRefundPaymentId(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleRefund} disabled={!refundReason.trim()}>
              <RotateCcw className="w-4 h-4 mr-2" /> Process Refund
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
