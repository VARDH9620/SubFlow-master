import { useEffect, useState } from 'react';
import { Plus, Trash2, Edit, Cloud, GitBranch, BarChart3, Shield, Users, Mail, ToggleLeft, ToggleRight } from 'lucide-react';
import * as db from '../../db/database';
import { Card, Button, PageHeader, Badge, Modal, Input, Textarea, Select, ConfirmDialog, EmptyState, SearchBar, AnimatedContainer, AnimatedItem, SkeletonCardGrid } from '../../components/ui';
import type { Service } from '../../types';

const iconOptions = [
  { value: 'Cloud', label: 'Cloud', icon: <Cloud className="w-4 h-4" /> },
  { value: 'GitBranch', label: 'Developer', icon: <GitBranch className="w-4 h-4" /> },
  { value: 'BarChart3', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
  { value: 'Shield', label: 'Security', icon: <Shield className="w-4 h-4" /> },
  { value: 'Users', label: 'Team', icon: <Users className="w-4 h-4" /> },
  { value: 'Mail', label: 'Marketing', icon: <Mail className="w-4 h-4" /> },
];

const iconMap: Record<string, React.ReactNode> = {
  Cloud: <Cloud className="w-5 h-5" />,
  GitBranch: <GitBranch className="w-5 h-5" />,
  BarChart3: <BarChart3 className="w-5 h-5" />,
  Shield: <Shield className="w-5 h-5" />,
  Users: <Users className="w-5 h-5" />,
  Mail: <Mail className="w-5 h-5" />,
};

const emptyForm = { name: '', description: '', category: 'Cloud', icon: 'Cloud', status: 'active' as 'active' | 'inactive' };

export default function AdminServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    setServices(await db.getAllServices());
    setTimeout(() => setLoading(false), 200);
  };
  useEffect(() => { refresh(); }, []);

  const filtered = services.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.category.toLowerCase().includes(search.toLowerCase()));

  const openCreate = () => { setEditId(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (svc: Service) => { setEditId(svc.id); setForm({ name: svc.name, description: svc.description, category: svc.category, icon: svc.icon, status: svc.status }); setShowModal(true); };

  const handleSave = () => {
    if (editId) {
      db.updateService(editId, form);
    } else {
      db.createService(form);
    }
    setShowModal(false);
    refresh();
  };

  const handleDelete = () => {
    if (deleteId) { db.deleteService(deleteId); setDeleteId(null); refresh(); }
  };

  const toggleStatus = (svc: Service) => {
    db.updateService(svc.id, { status: svc.status === 'active' ? 'inactive' : 'active' });
    refresh();
  };

  return (
    <div className="animate-fadeIn">
      <PageHeader title="Services" description="Manage available services" action={<Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> Add Service</Button>} />

      <div className="mb-6 max-w-sm">
        <SearchBar value={search} onChange={setSearch} placeholder="Search services..." />
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
            <EmptyState icon={<Cloud className="w-10 h-10" />} title="No services found" description="Create your first service to get started" action={<Button onClick={openCreate}>Add Service</Button>} />
          </AnimatedItem>
        </AnimatedContainer>
      ) : (
        <AnimatedContainer className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(svc => (
            <AnimatedItem key={svc.id}>
              <Card className="relative h-full flex flex-col">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-primary-50 dark:bg-primary-500/10 text-primary rounded-xl">{iconMap[svc.icon] || <Cloud className="w-5 h-5" />}</div>
                    <div>
                      <h3 className="font-semibold text-foreground">{svc.name}</h3>
                      <Badge className="mt-1">{svc.category}</Badge>
                    </div>
                  </div>
                  <Badge variant={svc.status === 'active' ? 'success' : 'danger'}>{svc.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground dark:text-slate-300 mt-3 line-clamp-2 flex-grow">{svc.description}</p>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50 dark:border-dark-surface-3/60">
                  <button onClick={() => toggleStatus(svc)} className="flex items-center gap-1.5 text-xs text-muted-foreground dark:text-slate-300 hover:text-muted-foreground dark:hover:text-slate-200 cursor-pointer">
                    {svc.status === 'active' ? <ToggleRight className="w-5 h-5 text-emerald-500" /> : <ToggleLeft className="w-5 h-5 text-muted-foreground/80 dark:text-slate-400" />}
                    {svc.status === 'active' ? 'Active' : 'Inactive'}
                  </button>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(svc)} className="p-1.5 hover:bg-muted dark:hover:bg-dark-surface-3/60 rounded-lg cursor-pointer"><Edit className="w-4 h-4 text-muted-foreground dark:text-slate-300" /></button>
                    <button onClick={() => setDeleteId(svc.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg cursor-pointer"><Trash2 className="w-4 h-4 text-red-500" /></button>
                  </div>
                </div>
              </Card>
            </AnimatedItem>
          ))}
        </AnimatedContainer>
      )}

      {/* Create/Edit Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editId ? 'Edit Service' : 'Add Service'}>
        <div className="space-y-4">
          <Input label="Name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required placeholder="Service name" />
          <Textarea label="Description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} required rows={3} placeholder="Service description" />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Category" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
              options={[{ value: 'Cloud', label: 'Cloud' }, { value: 'Developer Tools', label: 'Developer Tools' }, { value: 'Analytics', label: 'Analytics' }, { value: 'Security', label: 'Security' }, { value: 'Communication', label: 'Communication' }, { value: 'Marketing', label: 'Marketing' }]} />
            <Select label="Icon" value={form.icon} onChange={e => setForm(p => ({ ...p, icon: e.target.value }))}
              options={iconOptions.map(o => ({ value: o.value, label: o.label }))} />
          </div>
          <Select label="Status" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as 'active' | 'inactive' }))}
            options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name || !form.description}>{editId ? 'Update' : 'Create'}</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Service" message="This will permanently delete the service and all its plans. This action cannot be undone." confirmLabel="Delete" />
    </div>
  );
}
