import { useEffect, useState } from 'react';
import { DollarSign, FileText, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import * as db from '../../db/database';
import { Card, StatCard, PageHeader, Badge, SearchBar, Tabs, AnimatedContainer, AnimatedItem, SkeletonCardGrid, SkeletonTable } from '../../components/ui';
import { generateInvoicePDF } from '../../utils/invoicePdf';
import type { Invoice } from '../../types';

export default function AdminRevenue() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const list = await db.getAllInvoices();
      setInvoices(list);
      setTimeout(() => setLoading(false), 200);
    };
    loadData();
  }, []);

  const tabs = [
    { key: 'all', label: 'All', count: invoices.length },
    { key: 'paid', label: 'Paid', count: invoices.filter(i => i.status === 'paid').length },
    { key: 'pending', label: 'Pending', count: invoices.filter(i => i.status === 'pending').length },
    { key: 'refunded', label: 'Refunded', count: invoices.filter(i => i.status === 'refunded').length },
  ];

  const filtered = invoices
    .filter(i => tab === 'all' || i.status === tab)
    .filter(i => search === '' || (i.user_email || '').toLowerCase().includes(search.toLowerCase()) || i.invoice_number.toLowerCase().includes(search.toLowerCase()));

  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.total, 0);
  const totalPending = invoices.filter(i => i.status === 'pending').reduce((s, i) => s + i.total, 0);
  const totalRefunded = invoices.filter(i => i.status === 'refunded').reduce((s, i) => s + i.total, 0);

  const revenueByMonth = (() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const currentYear = now.getFullYear();
    return months.slice(0, now.getMonth() + 1).map((name, i) => {
      const monthPaid = invoices.filter(inv => inv.status === 'paid' && new Date(inv.created_at).getMonth() === i && new Date(inv.created_at).getFullYear() === currentYear);
      const monthPending = invoices.filter(inv => inv.status === 'pending' && new Date(inv.created_at).getMonth() === i && new Date(inv.created_at).getFullYear() === currentYear);
      return {
        name,
        collected: +monthPaid.reduce((s, i) => s + i.total, 0).toFixed(2),
        pending: +monthPending.reduce((s, i) => s + i.total, 0).toFixed(2),
      };
    });
  })();

  const handleDownload = async (inv: Invoice) => {
    const payments = await db.getAllPayments();
    const payment = payments.find(p => p.invoice_id === inv.id);
    generateInvoicePDF(inv, payment);
  };

  return (
    <div className="animate-fadeIn">
      <PageHeader title="Revenue & Billing" description="Track revenue, manage invoices, and financial analytics" />

      {loading ? (
        <AnimatedContainer>
          <AnimatedItem>
             <SkeletonCardGrid count={4} cols="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" />
          </AnimatedItem>
          <AnimatedItem className="mt-6">
             <SkeletonCardGrid count={1} cols="grid-cols-1" />
          </AnimatedItem>
          <AnimatedItem className="mt-6">
             <SkeletonTable columns={10} rows={6} />
          </AnimatedItem>
        </AnimatedContainer>
      ) : (
        <AnimatedContainer>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard title="Total Revenue" value={`$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} icon={<DollarSign className="w-5 h-5" />} iconBg="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" change="All time" changeType="positive" />
            <StatCard title="Pending" value={`$${totalPending.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} icon={<FileText className="w-5 h-5" />} iconBg="bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" change="Awaiting payment" changeType="negative" />
            <StatCard title="Refunded" value={`$${totalRefunded.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} icon={<FileText className="w-5 h-5" />} iconBg="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400" />
            <StatCard title="Total Invoices" value={invoices.length} icon={<FileText className="w-5 h-5" />} iconBg="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" />
          </div>

      <Card className="lg:col-span-2 mb-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Revenue Overview</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-chart-grid)" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--color-chart-text)' }} stroke="var(--color-chart-axis)" />
              <YAxis tick={{ fontSize: 12, fill: 'var(--color-chart-text)' }} stroke="var(--color-chart-axis)" />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--color-tooltip-bg)', borderColor: 'var(--color-tooltip-border)', borderRadius: '8px', color: 'var(--color-tooltip-text)' }}
                itemStyle={{ color: 'var(--color-tooltip-text)' }}
                labelStyle={{ color: 'var(--color-tooltip-text)', fontWeight: 'bold' }}
                formatter={(v) => [`$${v}`, '']}
              />
              <Legend />
              <Bar dataKey="collected" fill="#10b981" name="Collected" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pending" fill="#f59e0b" name="Pending" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <Tabs tabs={tabs} active={tab} onChange={k => setTab(k)} />
        <div className="w-full sm:w-64"><SearchBar value={search} onChange={setSearch} placeholder="Search invoices..." /></div>
      </div>

      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground dark:text-slate-300 uppercase">Invoice #</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground dark:text-slate-300 uppercase">User</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground dark:text-slate-300 uppercase">Service</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground dark:text-slate-300 uppercase">Plan</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground dark:text-slate-300 uppercase">Amount</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground dark:text-slate-300 uppercase">Tax</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground dark:text-slate-300 uppercase">Total</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground dark:text-slate-300 uppercase">Due Date</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground dark:text-slate-300 uppercase">Status</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground dark:text-slate-300 uppercase"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 50).map(inv => (
                <tr key={inv.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 text-sm font-mono text-foreground/90">{inv.invoice_number.slice(0, 18)}</td>
                  <td className="py-3 px-4 text-sm text-foreground/90">{inv.user_email}</td>
                  <td className="py-3 px-4 text-sm text-foreground/90">{inv.service_name}</td>
                  <td className="py-3 px-4 text-sm text-muted-foreground dark:text-slate-300">{inv.plan_name}</td>
                  <td className="py-3 px-4 text-sm text-foreground/90">${inv.amount.toFixed(2)}</td>
                  <td className="py-3 px-4 text-sm text-muted-foreground dark:text-slate-300">${inv.tax.toFixed(2)}</td>
                  <td className="py-3 px-4 text-sm font-medium text-foreground">${inv.total.toFixed(2)}</td>
                  <td className="py-3 px-4 text-sm text-muted-foreground dark:text-slate-300">{inv.due_date}</td>
                  <td className="py-3 px-4">
                    <Badge variant={inv.status === 'paid' ? 'success' : inv.status === 'pending' ? 'warning' : inv.status === 'refunded' ? 'purple' : 'danger'}>
                      {inv.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <button onClick={() => handleDownload(inv)} className="p-1.5 hover:bg-muted dark:hover:bg-slate-700 rounded-lg" title="Download PDF">
                      <Download className="w-4 h-4 text-muted-foreground dark:text-slate-300" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
        </AnimatedContainer>
      )}
    </div>
  );
}
