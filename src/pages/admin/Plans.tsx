import { useEffect, useState } from 'react';
import { Plus, Trash2, Edit, Check, Package } from 'lucide-react';
import * as db from '../../db/database';
import { Card, Button, PageHeader, Badge, Modal, Input, Textarea, Select, ConfirmDialog, EmptyState, SearchBar, AnimatedContainer, AnimatedItem, SkeletonCardGrid } from '../../components/ui';
import type { Plan, Service, BillingCycle } from '../../types';

const emptyForm = { service_id: '', name: '', description: '', price: 9.99, billing_cycle: 'monthly' as BillingCycle, features: [''], trial_days: 14, status: 'active' as 'active' | 'archived', max_users: 1 };

export default function AdminPlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [search, setSearch] = useState('');
  const [filterSvc, setFilterSvc] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    const [plns, svcs] = await Promise.all([db.getAllPlans(), db.getAllServices()]);
    setPlans(plns);
    setServices(svcs);
    setTimeout(() => setLoading(false), 200);
  };
  useEffect(() => { refresh(); }, []);

  const filtered = plans
    .filter(p => filterSvc === 'all' || p.service_id === filterSvc)
    .filter(p => search === '' || p.name.toLowerCase().includes(search.toLowerCase()));

  const openCreate = () => { setEditId(null); setForm({ ...emptyForm, service_id: services[0]?.id || '' }); setShowModal(true); };
  const openEdit = (plan: Plan) => { setEditId(plan.id); setForm({ service_id: plan.service_id, name: plan.name, description: plan.description, price: plan.price, billing_cycle: plan.billing_cycle, features: plan.features.length ? plan.features : [''], trial_days: plan.trial_days, status: plan.status, max_users: plan.max_users }); setShowModal(true); };

  const handleSave = () => {
    const data = { ...form, features: form.features.filter(f => f.trim()) };
    if (editId) { db.updatePlan(editId, data); } else { db.createPlan(data); }
    setShowModal(false);
    refresh();
  };

  const handleDelete = async () => {
    if (deleteId) {
      await db.deletePlan(deleteId);
      setDeleteId(null);
      await refresh();
    }
  };

  const addFeature = () => setForm(p => ({ ...p, features: [...p.features, ''] }));
  const removeFeature = (i: number) => setForm(p => ({ ...p, features: p.features.filter((_, j) => j !== i) }));
  const updateFeature = (i: number, val: string) => setForm(p => ({ ...p, features: p.features.map((f, j) => j === i ? val : f) }));

  const getSvcName = (id: string) => services.find(s => s.id === id)?.name || 'Unknown';

  return (
    <div className="animate-fadeIn">
      <PageHeader title="Plans" description="Manage subscription plans for all services" action={<Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> Add Plan</Button>} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setFilterSvc('all')} className={`px-3 py-1.5 text-sm rounded-lg cursor-pointer transition-colors ${filterSvc === 'all' ? 'bg-primary-50 dark:bg-primary-500/10 text-primary/90 dark:text-primary-400' : 'text-muted-foreground dark:text-slate-300 hover:bg-muted dark:hover:bg-dark-surface-3/60'}`}>All</button>
          {services.map(s => (
            <button key={s.id} onClick={() => setFilterSvc(s.id)} className={`px-3 py-1.5 text-sm rounded-lg cursor-pointer transition-colors ${filterSvc === s.id ? 'bg-primary-50 dark:bg-primary-500/10 text-primary/90 dark:text-primary-400' : 'text-muted-foreground dark:text-slate-300 hover:bg-muted dark:hover:bg-dark-surface-3/60'}`}>{s.name}</button>
          ))}
        </div>
        <div className="w-full sm:w-64"><SearchBar value={search} onChange={setSearch} /></div>
      </div>

      {loading ? (
        <AnimatedContainer>
          <AnimatedItem>
            <SkeletonCardGrid count={6} />
          </AnimatedItem>
        </AnimatedContainer>
      ) : filtered.length === 0 ? (
        <AnimatedContainer>
          <AnimatedItem>
            <EmptyState icon={<Package className="w-10 h-10" />} title="No plans found" description="Create your first plan" action={<Button onClick={openCreate}>Add Plan</Button>} />
          </AnimatedItem>
        </AnimatedContainer>
      ) : (
        <AnimatedContainer className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(plan => (
            <AnimatedItem key={plan.id}>
              <Card>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-foreground">{plan.name}</h3>
                    <p className="text-xs text-muted-foreground dark:text-slate-300">{getSvcName(plan.service_id)}</p>
                  </div>
                  <Badge variant={plan.status === 'active' ? 'success' : 'default'}>{plan.status}</Badge>
                </div>
                <div className="my-3">
                  <span className="text-2xl font-bold text-foreground dark:text-white">${plan.price.toFixed(2)}</span>
                  <span className="text-sm text-muted-foreground dark:text-slate-300">/{plan.billing_cycle === 'monthly' ? 'mo' : plan.billing_cycle === 'annual' ? 'yr' : 'qtr'}</span>
                </div>
                <ul className="space-y-1 mb-4">
                  {plan.features.slice(0, 3).map((f, i) => (
                    <li key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground dark:text-slate-300"><Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" /> {f}</li>
                  ))}
                  {plan.features.length > 3 && <li className="text-xs text-muted-foreground/80 dark:text-slate-400">+{plan.features.length - 3} more</li>}
                </ul>
                <div className="flex items-center justify-between pt-3 border-t border-border/50 dark:border-dark-surface-3/60">
                  <span className="text-xs text-muted-foreground/80 dark:text-slate-400">Trial: {plan.trial_days}d · Max: {plan.max_users} users</span>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(plan)} className="p-1.5 hover:bg-muted dark:hover:bg-dark-surface-3/60 rounded-lg cursor-pointer"><Edit className="w-4 h-4 text-muted-foreground dark:text-slate-300" /></button>
                    <button onClick={() => setDeleteId(plan.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg cursor-pointer"><Trash2 className="w-4 h-4 text-red-500" /></button>
                  </div>
                </div>
              </Card>
            </AnimatedItem>
          ))}
        </AnimatedContainer>
      )}

      {/* Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editId ? 'Edit Plan' : 'Add Plan'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select label="Service" value={form.service_id} onChange={e => setForm(p => ({ ...p, service_id: e.target.value }))}
              options={services.map(s => ({ value: s.id, label: s.name }))} />
            <Input label="Name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
          </div>
          <Textarea label="Description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} />
          <div className="grid grid-cols-3 gap-4">
            <Input label="Price ($)" type="number" step="0.01" value={form.price} onChange={e => setForm(p => ({ ...p, price: +e.target.value }))} />
            <Select label="Billing Cycle" value={form.billing_cycle} onChange={e => setForm(p => ({ ...p, billing_cycle: e.target.value as BillingCycle }))}
              options={[{ value: 'monthly', label: 'Monthly' }, { value: 'quarterly', label: 'Quarterly' }, { value: 'annual', label: 'Annual' }]} />
            <Input label="Trial Days" type="number" value={form.trial_days} onChange={e => setForm(p => ({ ...p, trial_days: +e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Max Users" type="number" value={form.max_users} onChange={e => setForm(p => ({ ...p, max_users: +e.target.value }))} />
            <Select label="Status" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as 'active' | 'archived' }))}
              options={[{ value: 'active', label: 'Active' }, { value: 'archived', label: 'Archived' }]} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-muted-foreground">Features</label>
              <button type="button" onClick={addFeature} className="text-xs text-primary font-medium hover:text-primary/90">+ Add Feature</button>
            </div>
            <div className="space-y-2">
              {form.features.map((f, i) => (
                <div key={i} className="flex gap-2">
                  <input value={f} onChange={e => updateFeature(i, e.target.value)} className="flex-1 px-3 py-1.5 border border-input rounded-lg text-sm" placeholder="Feature name" />
                  {form.features.length > 1 && <button onClick={() => removeFeature(i)} className="text-red-400 hover:text-red-600 px-2">×</button>}
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name || !form.service_id}>{editId ? 'Update' : 'Create'}</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Plan" message="This will permanently delete this plan. Active subscriptions will not be affected." confirmLabel="Delete" />
    </div>
  );
}
