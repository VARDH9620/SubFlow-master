import { useEffect, useState } from 'react';
import { FileText, Download, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import * as db from '../../db/database';
import { Card, Badge, Button, PageHeader, EmptyState, SearchBar, Tabs } from '../../components/ui';
import { generateInvoicePDF } from '../../utils/invoicePdf';
import type { Invoice } from '../../types';

export default function Billing() {
  const { user, addToast } = useAuth();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const list = await db.getInvoicesByUser(user.id);
      setInvoices(list);
    };
    load();
  }, [user]);

  const tabs = [
    { key: 'all', label: 'All', count: invoices.length },
    { key: 'paid', label: 'Paid', count: invoices.filter(i => i.status === 'paid').length },
    { key: 'pending', label: 'Pending', count: invoices.filter(i => i.status === 'pending').length },
    { key: 'refunded', label: 'Refunded', count: invoices.filter(i => i.status === 'refunded').length },
  ];

  const filtered = invoices
    .filter(i => tab === 'all' || i.status === tab)
    .filter(i => search === '' || i.invoice_number.toLowerCase().includes(search.toLowerCase()) || (i.service_name || '').toLowerCase().includes(search.toLowerCase()));

  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.total, 0);
  const totalPending = invoices.filter(i => i.status === 'pending').reduce((s, i) => s + i.total, 0);

  const handlePay = (inv: Invoice) => {
    navigate('/payment', { state: { invoice: inv } });
  };

  const handleDownloadPDF = async (inv: Invoice) => {
    // Get payment details if available
    const payments = await db.getPaymentsByUser(user?.id || '');
    const payment = payments.find(p => p.invoice_id === inv.id);
    const filename = generateInvoicePDF(inv, payment);
    addToast(`Downloaded ${filename}`, 'success');
  };

  return (
    <div className="animate-fadeIn">
      <PageHeader
        title="Billing & Invoices"
        description="View and manage your payment history"
        action={
          <Button onClick={() => navigate('/payment')} className="gap-2">
            <CreditCard className="w-4 h-4" /> Make a Payment
          </Button>
        }
      />

      {/* Summary cards */}
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <p className="text-sm text-muted-foreground dark:text-slate-300">Total Paid</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">${totalPaid.toFixed(2)}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted-foreground dark:text-slate-300">Pending</p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">${totalPending.toFixed(2)}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted-foreground dark:text-slate-300">Total Invoices</p>
          <p className="text-2xl font-bold text-foreground mt-1">{invoices.length}</p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <Tabs tabs={tabs} active={tab} onChange={setTab} />
        <div className="w-full sm:w-64">
          <SearchBar value={search} onChange={setSearch} placeholder="Search invoices..." />
        </div>
      </div>

      {/* Invoices table */}
      {filtered.length === 0 ? (
        <EmptyState icon={<FileText className="w-10 h-10" />} title="No invoices found" description="No invoices match your current filters" />
      ) : (
        <Card padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground dark:text-slate-300 uppercase">Invoice #</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground dark:text-slate-300 uppercase">Service</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground dark:text-slate-300 uppercase">Plan</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground dark:text-slate-300 uppercase">Amount</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground dark:text-slate-300 uppercase">Tax</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground dark:text-slate-300 uppercase">Total</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground dark:text-slate-300 uppercase">Date</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground dark:text-slate-300 uppercase">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground dark:text-slate-300 uppercase">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(inv => (
                  <tr key={inv.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 text-sm font-mono text-foreground/90">{inv.invoice_number.slice(0, 18)}</td>
                    <td className="py-3 px-4 text-sm text-foreground/90">{inv.service_name}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground dark:text-slate-300">{inv.plan_name}</td>
                    <td className="py-3 px-4 text-sm text-foreground/90">${inv.amount.toFixed(2)}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground dark:text-slate-300">${inv.tax.toFixed(2)}</td>
                    <td className="py-3 px-4 text-sm font-medium text-foreground">${inv.total.toFixed(2)}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground dark:text-slate-300">{new Date(inv.created_at).toLocaleDateString()}</td>
                    <td className="py-3 px-4">
                      <Badge variant={inv.status === 'paid' ? 'success' : inv.status === 'pending' ? 'warning' : inv.status === 'failed' ? 'danger' : inv.status === 'refunded' ? 'purple' : 'default'}>
                        {inv.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      {inv.status === 'pending' ? (
                        <Button size="sm" onClick={() => handlePay(inv)}>Pay Now</Button>
                      ) : inv.status === 'refunded' ? (
                        <div className="flex gap-1">
                          <Badge variant="purple">Refunded</Badge>
                          <Button size="sm" variant="ghost" onClick={() => handleDownloadPDF(inv)} className="gap-1 text-muted-foreground dark:text-slate-300">
                            <Download className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => handleDownloadPDF(inv)} className="gap-1 text-primary hover:bg-primary/10">
                          <Download className="w-3.5 h-3.5" /> PDF
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
