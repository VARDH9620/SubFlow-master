import { useEffect, useState } from 'react';
import { Users, CreditCard, DollarSign, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import * as db from '../../db/database';
import { Card, StatCard, Badge, PageHeader } from '../../components/ui';
import type { DashboardStats, ChartDataPoint } from '../../types';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1'];

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenueData, setRevenueData] = useState<ChartDataPoint[]>([]);
  const [userData, setUserData] = useState<ChartDataPoint[]>([]);
  const [subData, setSubData] = useState<ChartDataPoint[]>([]);
  const [catData, setCatData] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const [statsRes, revRes, usersRes, subsRes, catRes] = await Promise.all([
        db.getAdminDashboardStats(),
        db.getRevenueChartData(),
        db.getUserGrowthChartData(),
        db.getSubscriptionChartData(),
        db.getCategoryDistribution(),
      ]);
      setStats(statsRes);
      setRevenueData(revRes);
      setUserData(usersRes);
      setSubData(subsRes);
      setCatData(catRes);
    };
    loadData();
  }, []);

  if (!stats) return (
    <div className="animate-fadeIn">
      <div className="h-8 w-48 skeleton rounded-lg mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => <div key={i} className="h-28 skeleton rounded-xl" />)}
      </div>
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {[...Array(2)].map((_, i) => <div key={i} className="h-80 skeleton rounded-xl" />)}
      </div>
    </div>
  );

  return (
    <div className="animate-fadeIn">
      <PageHeader
        title="Admin Dashboard"
        description="Overview of platform performance and metrics"
      />

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Users"
          value={stats.total_users}
          icon={<Users className="w-5 h-5" />}
          iconBg="bg-blue-50 text-blue-600"
          change={`+${stats.new_users_this_month} this month`}
          changeType="positive"
        />
        <StatCard
          title="Active Subscriptions"
          value={stats.active_subscriptions}
          icon={<CreditCard className="w-5 h-5" />}
          iconBg="bg-emerald-50 text-emerald-600"
          change={`${stats.churn_rate}% churn rate`}
          changeType={stats.churn_rate > 5 ? 'negative' : 'positive'}
        />
        <StatCard
          title="Monthly Revenue"
          value={`$${stats.monthly_revenue.toLocaleString()}`}
          icon={<DollarSign className="w-5 h-5" />}
          iconBg="bg-purple-50 text-purple-600"
          change={`+${stats.revenue_growth}% growth`}
          changeType="positive"
        />
        <StatCard
          title="Open Tickets"
          value={stats.pending_tickets}
          icon={<AlertCircle className="w-5 h-5" />}
          iconBg="bg-amber-50 text-amber-600"
          change={`${stats.total_services} services`}
          changeType="neutral"
        />
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Revenue Chart */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Revenue Overview</h3>
            <Badge variant="info">Monthly</Badge>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-chart-grid)" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--color-chart-text)' }} stroke="var(--color-chart-axis)" />
                <YAxis tick={{ fontSize: 12, fill: 'var(--color-chart-text)' }} stroke="var(--color-chart-axis)" />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--color-tooltip-bg)', borderColor: 'var(--color-tooltip-border)', borderRadius: '8px', color: 'var(--color-tooltip-text)' }}
                  itemStyle={{ color: 'var(--color-tooltip-text)' }}
                  labelStyle={{ color: 'var(--color-tooltip-text)', fontWeight: 'bold' }}
                  formatter={(v) => [`$${v}`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* User Growth Chart */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">User Growth</h3>
            <Badge variant="success">Cumulative</Badge>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={userData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-chart-grid)" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--color-chart-text)' }} stroke="var(--color-chart-axis)" />
                <YAxis tick={{ fontSize: 12, fill: 'var(--color-chart-text)' }} stroke="var(--color-chart-axis)" />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--color-tooltip-bg)', borderColor: 'var(--color-tooltip-border)', borderRadius: '8px', color: 'var(--color-tooltip-text)' }}
                  itemStyle={{ color: 'var(--color-tooltip-text)' }}
                  labelStyle={{ color: 'var(--color-tooltip-text)', fontWeight: 'bold' }}
                />
                <Line type="monotone" dataKey="users" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Subscription trend */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">New Subscriptions</h3>
            <Badge>Monthly</Badge>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-chart-grid)" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--color-chart-text)' }} stroke="var(--color-chart-axis)" />
                <YAxis tick={{ fontSize: 12, fill: 'var(--color-chart-text)' }} stroke="var(--color-chart-axis)" />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--color-tooltip-bg)', borderColor: 'var(--color-tooltip-border)', borderRadius: '8px', color: 'var(--color-tooltip-text)' }}
                  itemStyle={{ color: 'var(--color-tooltip-text)' }}
                  labelStyle={{ color: 'var(--color-tooltip-text)', fontWeight: 'bold' }}
                />
                <Bar dataKey="subscriptions" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Category Distribution */}
        <Card>
          <h3 className="text-sm font-semibold text-foreground mb-4">By Category</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={catData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name }) => name}>
                  {catData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-1">
            {catData.map((cat, i) => (
              <div key={cat.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-muted-foreground">{cat.name}</span>
                </div>
                <span className="font-medium text-foreground">{cat.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
