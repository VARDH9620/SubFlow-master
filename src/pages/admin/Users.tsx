import { useEffect, useState } from 'react';
import { Trash2, Edit, Shield, Search, UserCheck, UserX } from 'lucide-react';
import * as db from '../../db/database';
import { Card, Button, PageHeader, SearchBar, Badge, Modal, Input, ConfirmDialog, EmptyState, AnimatedContainer, AnimatedItem, SkeletonTable } from '../../components/ui';
import type { User, UserRole } from '../../types';

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selected, setSelected] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ first_name: '', last_name: '', email: '', phone: '', role: 'user' as UserRole });
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    setUsers(await db.getAllUsers());
    setTimeout(() => setLoading(false), 200);
  };

  useEffect(() => { refresh(); }, []);

  const filtered = users
    .filter(u => roleFilter === 'all' || u.role === roleFilter)
    .filter(u => search === '' || u.email.toLowerCase().includes(search.toLowerCase()) || `${u.first_name} ${u.last_name}`.toLowerCase().includes(search.toLowerCase()));

  const handleEdit = (user: User) => {
    setSelected(user);
    setEditForm({ first_name: user.first_name, last_name: user.last_name, email: user.email, phone: user.phone, role: user.role });
    setShowEdit(true);
  };

  const handleSaveEdit = async () => {
    if (!selected) return;
    await db.updateUser(selected.id, editForm);
    setShowEdit(false);
    await refresh();
  };

  const handleDelete = async () => {
    if (!selected) return;
    await db.deleteUser(selected.id);
    setShowDelete(false);
    setSelected(null);
    await refresh();
  };

  return (
    <div className="animate-fadeIn">
      <PageHeader title="User Management" description={`${users.filter(u => u.role === 'user').length} users · ${users.filter(u => u.role === 'admin').length} admins`} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex gap-2">
          {(['all', 'user', 'admin'] as const).map(r => (
            <button key={r} onClick={() => setRoleFilter(r)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${roleFilter === r ? 'bg-primary-50 text-primary/90' : 'text-muted-foreground hover:bg-muted'}`}>
              {r === 'all' ? 'All' : r === 'user' ? 'Users' : 'Admins'}
              <span className="ml-1.5 text-xs opacity-60">{r === 'all' ? users.length : users.filter(u => u.role === r).length}</span>
            </button>
          ))}
        </div>
        <div className="w-full sm:w-64">
          <SearchBar value={search} onChange={setSearch} placeholder="Search users..." />
        </div>
      </div>

      {loading ? (
        <AnimatedContainer>
          <AnimatedItem>
            <SkeletonTable columns={7} rows={6} />
          </AnimatedItem>
        </AnimatedContainer>
      ) : filtered.length === 0 ? (
        <AnimatedContainer>
          <AnimatedItem>
            <EmptyState icon={<Search className="w-10 h-10" />} title="No users found" description="No users match your search criteria" />
          </AnimatedItem>
        </AnimatedContainer>
      ) : (
        <AnimatedContainer>
          <AnimatedItem>
            <Card padding={false}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">User</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Email</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Phone</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Role</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Status</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Joined</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(user => (
                      <tr key={user.id} className="border-b border-gray-50 hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${user.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-primary-100 text-primary/90 dark:bg-primary-900/30 dark:text-primary-400'}`}>
                              {user.first_name[0]}{user.last_name[0]}
                            </div>
                            <span className="text-sm font-medium text-foreground">{user.first_name} {user.last_name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">{user.email}</td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">{user.phone || '—'}</td>
                        <td className="py-3 px-4">
                          <Badge variant={user.role === 'admin' ? 'purple' : 'default'}>
                            {user.role === 'admin' && <Shield className="w-3 h-3 mr-1" />}
                            {user.role}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          {user.is_verified ? (
                            <Badge variant="success"><UserCheck className="w-3 h-3 mr-1" /> Verified</Badge>
                          ) : (
                            <Badge variant="warning"><UserX className="w-3 h-3 mr-1" /> Unverified</Badge>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">{new Date(user.created_at).toLocaleDateString()}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex gap-1 justify-end">
                            <button onClick={() => handleEdit(user)} className="p-1.5 hover:bg-muted rounded-lg transition-colors" title="Edit">
                              <Edit className="w-4 h-4 text-muted-foreground" />
                            </button>
                            {user.role !== 'admin' && (
                              <button onClick={() => { setSelected(user); setShowDelete(true); }} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Delete">
                                <Trash2 className="w-4 h-4 text-red-500" />
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
          </AnimatedItem>
        </AnimatedContainer>
      )}

      {/* Edit Modal */}
      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Edit User" size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="First Name" value={editForm.first_name} onChange={e => setEditForm(p => ({ ...p, first_name: e.target.value }))} />
            <Input label="Last Name" value={editForm.last_name} onChange={e => setEditForm(p => ({ ...p, last_name: e.target.value }))} />
          </div>
          <Input label="Email" value={editForm.email} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} />
          <Input label="Phone" value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} />
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Role</label>
            <select value={editForm.role} onChange={e => setEditForm(p => ({ ...p, role: e.target.value as UserRole }))} className="w-full px-3 py-2 border border-input rounded-lg text-sm">
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowEdit(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={showDelete}
        onClose={() => { setShowDelete(false); setSelected(null); }}
        onConfirm={handleDelete}
        title="Delete User"
        message={`Are you sure you want to delete ${selected?.first_name} ${selected?.last_name}? This will also delete all their subscriptions, invoices, and support tickets.`}
        confirmLabel="Delete User"
      />
    </div>
  );
}
