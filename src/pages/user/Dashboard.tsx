import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, TrendingUp, Calendar, Package, ArrowRight, Zap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import * as db from '../../db/database';
import { Card, StatCard, Badge, Button, PageHeader } from '../../components/ui';
import type { Subscription, Invoice } from '../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../../design/animation';

export default function UserDashboard() {
  const { user } = useAuth();
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [monthlySpend, setMonthlySpend] = useState(0);

  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      // Parallel fetch for snappier load
      const [userSubs, userInvoices] = await Promise.all([
        db.getSubscriptionsByUser(user.id),
        db.getInvoicesByUser(user.id),
      ]);
      setSubs(userSubs);
      setInvoices(userInvoices);
      const activeSpend = userSubs.filter(s => s.status === 'active').reduce((sum, s) => sum + (s.price || 0), 0);
      setMonthlySpend(activeSpend);
    };
    loadData();
  }, [user]);

  const activeSubs = subs.filter(s => s.status === 'active');
  const pendingInvoices = invoices.filter(i => i.status === 'pending');

  const spendData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const monthName = d.toLocaleString('default', { month: 'short' });
    const targetMonth = d.getMonth();
    const targetYear = d.getFullYear();
    const monthInvoices = invoices.filter(inv => {
      const id = new Date(inv.created_at);
      // Fixed: compare both month AND year to avoid cross-year pollution
      return id.getMonth() === targetMonth && id.getFullYear() === targetYear && inv.status === 'paid';
    });
    return { name: monthName, amount: +monthInvoices.reduce((s, inv) => s + inv.total, 0).toFixed(2) };
  });

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
    >
      <PageHeader
        title={`Welcome back, ${user?.first_name} 👋`}
        description="Here's an overview of your subscriptions and billing."
        action={<Link to="/services"><Button size="sm" className="gap-2"><Package className="w-4 h-4" /> Browse Services</Button></Link>}
      />

      {/* Stats Grid */}
      <motion.div variants={staggerItem} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Active Plans" value={activeSubs.length} icon={<CreditCard className="w-5 h-5" />} change={`${subs.length} total subscriptions`} />
        <StatCard title="Monthly Spend" value={`$${monthlySpend.toFixed(2)}`} icon={<TrendingUp className="w-5 h-5" />} change="Based on active plans" />
        <StatCard title="Pending Invoices" value={pendingInvoices.length} icon={<Calendar className="w-5 h-5" />} change={pendingInvoices.length > 0 ? 'Action required' : 'All clear'} changeType={pendingInvoices.length > 0 ? 'negative' : 'positive'} />
        <StatCard title="Next Billing" value={activeSubs[0]?.end_date || 'N/A'} icon={<Zap className="w-5 h-5" />} />
      </motion.div>

      <motion.div variants={staggerItem} className="grid lg:grid-cols-3 gap-6">
        {/* Chart — Premium styling */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-foreground">Monthly Spending</h3>
            <span className="text-[10px] text-muted-foreground/60 bg-muted/50 px-2 py-0.5 rounded-md font-mono border border-border/30">Last 6 months</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={spendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.3} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} stroke="var(--border)" strokeOpacity={0.3} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} stroke="var(--border)" strokeOpacity={0.3} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    borderColor: 'var(--border)',
                    borderRadius: '12px',
                    color: 'var(--foreground)',
                    boxShadow: 'var(--shadow-elevated)',
                    backdropFilter: 'blur(12px)',
                  }}
                  itemStyle={{ color: 'var(--foreground)' }}
                  labelStyle={{ color: 'var(--foreground)', fontWeight: 'bold' }}
                  formatter={(v) => [`$${v}`, 'Amount']}
                />
                <Bar dataKey="amount" fill="var(--primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Active Subscriptions */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-foreground">Active Plans</h3>
            <Link to="/subscriptions" className="text-xs text-primary font-semibold hover:text-primary/80 transition-colors">View all →</Link>
          </div>
          <div className="space-y-2.5">
            {activeSubs.length === 0 ? (
              <div className="text-sm text-muted-foreground/60 py-8 text-center">
                <CreditCard className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                No active subscriptions
              </div>
            ) : (
              activeSubs.slice(0, 5).map(sub => (
                <motion.div
                  key={sub.id}
                  whileHover={{ x: 2 }}
                  className="flex items-center justify-between p-3 bg-muted/20 hover:bg-muted/40 rounded-xl transition-colors border border-border/30 cursor-pointer"
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">{sub.service_name}</p>
                    <p className="text-xs text-muted-foreground/70">{sub.plan_name} · ${sub.price}/mo</p>
                  </div>
                  <Badge variant="success">Active</Badge>
                </motion.div>
              ))
            )}
          </div>
        </Card>
      </motion.div>

      {/* Recent Invoices */}
      <motion.div variants={staggerItem}>
        <Card className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-foreground">Recent Invoices</h3>
            <Link to="/billing" className="text-xs text-primary font-semibold hover:text-primary/80 flex items-center gap-1 transition-colors">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="overflow-x-auto rounded-xl border border-border/30">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/30 bg-muted/20">
                  <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-muted-foreground/80 uppercase tracking-wider">Invoice</th>
                  <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-muted-foreground/80 uppercase tracking-wider">Service</th>
                  <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-muted-foreground/80 uppercase tracking-wider">Amount</th>
                  <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-muted-foreground/80 uppercase tracking-wider">Date</th>
                  <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-muted-foreground/80 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.slice(0, 5).map((inv, idx) => (
                  <motion.tr
                    key={inv.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04, duration: 0.2 }}
                    className="border-b border-border/20 hover:bg-muted/20 transition-colors"
                  >
                    <td className="py-3 px-4 text-sm text-muted-foreground font-mono text-xs">{inv.invoice_number.slice(0, 16)}</td>
                    <td className="py-3 px-4 text-sm text-foreground/80">{inv.service_name}</td>
                    <td className="py-3 px-4 text-sm font-semibold text-foreground">${inv.total.toFixed(2)}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground/70">{new Date(inv.created_at).toLocaleDateString()}</td>
                    <td className="py-3 px-4">
                      <Badge variant={inv.status === 'paid' ? 'success' : inv.status === 'pending' ? 'warning' : 'danger'}>
                        {inv.status}
                      </Badge>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
