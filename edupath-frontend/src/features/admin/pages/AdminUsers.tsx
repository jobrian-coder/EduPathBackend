import { useEffect, useState } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import { DataTable, type Column } from '../components/DataTable';
import { useToast } from '../hooks/useToast';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import api, { type User as ApiUser } from '../../../services/api';
import { useAuth } from '../../../hooks/useAuth';
import { downloadUsersPdf } from '../utils/adminPdf';
import { 
  Plus, 
  X,
  Check,
  XCircle,
  Shield,
  Trash2,
  User as UserIcon
} from 'lucide-react';

type UserData = ApiUser & { date_joined: string };

interface UserFormData {
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  role: ApiUser['role'];
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  password?: string;
}

const ROLES = [
  { value: 'novice', label: 'Novice', color: 'bg-gray-500/20 text-gray-400' },
  { value: 'contributor', label: 'Contributor', color: 'bg-blue-500/20 text-blue-400' },
  { value: 'expert', label: 'Expert', color: 'bg-purple-500/20 text-purple-400' },
];

const initialFormData: UserFormData = {
  email: '',
  username: '',
  first_name: '',
  last_name: '',
  role: 'novice',
  is_active: true,
  is_staff: false,
  is_superuser: false,
};

export default function AdminUsers() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | ApiUser['role']>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [formData, setFormData] = useState<UserFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { addToast } = useToast();
  const { user: currentUser } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers().catch(() => undefined);
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, roleFilter, statusFilter]);

  const normalizeUser = (user: ApiUser): UserData => ({
    ...user,
    date_joined: user.date_joined ?? user.created_at,
    is_active: user.is_active ?? true,
    is_staff: user.is_staff ?? false,
    is_superuser: user.is_superuser ?? false,
    email_verified: user.email_verified ?? false,
  }) as UserData;

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.admin.listUsers({
        search: searchQuery.trim() || undefined,
        role: roleFilter === 'all' ? undefined : roleFilter,
        is_active:
          statusFilter === 'all' ? undefined : statusFilter === 'active' ? 'true' : 'false',
      });
      setUsers(response.results.map(normalizeUser));
    } catch (err) {
      console.error('Failed to fetch users:', err);
      addToast('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (user?: UserData) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        email: user.email,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        is_active: user.is_active ?? true,
        is_staff: user.is_staff ?? false,
        is_superuser: user.is_superuser ?? false,
      });
    } else {
      setEditingUser(null);
      setFormData(initialFormData);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setFormData(initialFormData);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setRoleFilter('all');
    setStatusFilter('all');
  };

  const getBulkTargets = () => {
    const targets = selectedIds.filter((id) => id !== currentUser?.id);

    if (currentUser && selectedIds.includes(currentUser.id)) {
      addToast('Your own account is excluded from bulk actions.', 'error');
    }

    return targets;
  };

  const applyBulkUpdate = async (updates: Partial<ApiUser>, successLabel: string) => {
    const targets = getBulkTargets();
    if (targets.length === 0) return;

    setIsBulkProcessing(true);
    try {
      await Promise.all(targets.map((id) => api.admin.updateUser(id, updates)));
      addToast(`${targets.length} users ${successLabel}`, 'success');
      await fetchUsers();
      setSelectedIds([]);
    } catch (err) {
      console.error('Failed to apply bulk update:', err);
      addToast('Failed to apply bulk update to some users', 'error');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    const targets = getBulkTargets();
    if (targets.length === 0) return;

    if (!confirm(`Are you sure you want to delete ${targets.length} selected users?`)) return;

    setIsBulkProcessing(true);
    try {
      await Promise.all(targets.map((id) => api.admin.deleteUser(id)));
      addToast(`${targets.length} users deleted successfully`, 'success');
      await fetchUsers();
      setSelectedIds([]);
    } catch (err) {
      console.error('Failed to delete users:', err);
      addToast('Failed to delete some users', 'error');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkActivate = () => applyBulkUpdate({ is_active: true }, 'activated');
  const handleBulkDeactivate = () => applyBulkUpdate({ is_active: false }, 'deactivated');
  const handleBulkGrantStaff = () => applyBulkUpdate({ is_staff: true }, 'granted staff access to');
  const handleBulkRevokeStaff = () => applyBulkUpdate({ is_staff: false }, 'revoked staff access from');
  const handleBulkGrantSuperuser = () => applyBulkUpdate({ is_superuser: true, is_staff: true }, 'promoted to superuser');
  const handleBulkRevokeSuperuser = () => applyBulkUpdate({ is_superuser: false }, 'demoted from superuser');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        password: formData.password || undefined,
      };

      if (editingUser) {
        await api.admin.updateUser(editingUser.id, payload as Partial<ApiUser> & { password?: string });
        addToast('User updated successfully', 'success');
      } else {
        if (!formData.password) {
          addToast('Please set an initial password for the new user', 'error');
          setIsSubmitting(false);
          return;
        }
        await api.admin.createUser(payload as Partial<ApiUser> & { password: string });
        addToast('User created successfully', 'success');
      }

      await fetchUsers();
      handleCloseModal();
    } catch (err) {
      console.error('Failed to save user:', err);
      addToast('Failed to save user', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (user: UserData) => {
    if (!confirm(`Are you sure you want to delete ${user.email}?`)) return;

    try {
      await api.admin.deleteUser(user.id);
      addToast('User deleted successfully', 'success');
      await fetchUsers();
    } catch (err) {
      console.error('Failed to delete user:', err);
      addToast('Failed to delete user', 'error');
    }
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = ROLES.find((r) => r.value === role);
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleConfig?.color || 'bg-gray-500/20 text-gray-400'}`}>
        {roleConfig?.label || role}
      </span>
    );
  };

  const columns: Column<UserData>[] = [
    {
      key: 'email',
      header: 'Email',
      sortable: true,
      render: (user) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
            <span className="text-xs font-medium text-white">
              {user.first_name?.[0] || user.email?.[0]?.toUpperCase() || '?'}
            </span>
          </div>
          <span className="text-white">{user.email}</span>
        </div>
      ),
    },
    {
      key: 'first_name',
      header: 'Name',
      sortable: true,
      render: (user) => (
        <span className="text-slate-300">
          {user.first_name} {user.last_name}
        </span>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      sortable: true,
      render: (user) => getRoleBadge(user.role),
    },
    {
      key: 'is_staff',
      header: 'Access',
      render: (user) => (
        <div className="flex flex-wrap gap-2">
          {user.is_staff && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-teal-500/20 text-teal-300">Staff</span>
          )}
          {user.is_superuser && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300">Superuser</span>
          )}
          {!user.is_staff && !user.is_superuser && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-700 text-slate-300">Standard</span>
          )}
        </div>
      ),
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (user) => (
        <span className={`flex items-center gap-1 text-sm ${user.is_active ? 'text-green-400' : 'text-red-400'}`}>
          {user.is_active ? <Check className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {user.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'date_joined',
      header: 'Joined',
      sortable: true,
      render: (user) => (
        <span className="text-slate-500 text-sm">
          {new Date(user.date_joined).toLocaleDateString()}
        </span>
      ),
    },
  ];

  const handleDownloadPdf = () => downloadUsersPdf(users);

  return (
    <AdminLayout onDownloadPdf={handleDownloadPdf}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Users</h1>
          <p className="text-slate-400">Manage system users, access levels, and account status</p>
        </div>
        <Button
          onClick={() => handleOpenModal()}
          className="bg-teal-600 hover:bg-teal-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Search & Filters */}
      <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/50 p-4 md:p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-300">Search users</label>
            <Input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by email, username, or name"
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Role</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as 'all' | ApiUser['role'])}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">All roles</option>
              {ROLES.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">All accounts</option>
              <option value="active">Active only</option>
              <option value="inactive">Inactive only</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-slate-400">
            Showing <span className="text-white font-medium">{users.length}</span> users
          </div>
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:border-teal-500 hover:text-teal-300"
          >
            Clear filters
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="mb-6 rounded-2xl border border-teal-500/20 bg-teal-500/5 p-4 md:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-medium text-white">
                {selectedIds.length} user{selectedIds.length === 1 ? '' : 's'} selected
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Apply a bulk action to the selected accounts. Your own account is excluded automatically.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={handleBulkActivate}
                disabled={isBulkProcessing}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Check className="mr-2 h-4 w-4" />
                Activate
              </Button>
              <Button
                type="button"
                onClick={handleBulkDeactivate}
                disabled={isBulkProcessing}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Deactivate
              </Button>
              <Button
                type="button"
                onClick={handleBulkGrantStaff}
                disabled={isBulkProcessing}
                className="bg-teal-600 hover:bg-teal-700 text-white"
              >
                <Shield className="mr-2 h-4 w-4" />
                Grant Staff
              </Button>
              <Button
                type="button"
                onClick={handleBulkRevokeStaff}
                disabled={isBulkProcessing}
                className="bg-slate-700 hover:bg-slate-600 text-white"
              >
                <Shield className="mr-2 h-4 w-4" />
                Revoke Staff
              </Button>
              <Button
                type="button"
                onClick={handleBulkGrantSuperuser}
                disabled={isBulkProcessing}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Shield className="mr-2 h-4 w-4" />
                Promote Superuser
              </Button>
              <Button
                type="button"
                onClick={handleBulkRevokeSuperuser}
                disabled={isBulkProcessing}
                className="bg-slate-700 hover:bg-slate-600 text-white"
              >
                <Shield className="mr-2 h-4 w-4" />
                Demote Superuser
              </Button>
              <Button
                type="button"
                onClick={handleBulkDelete}
                disabled={isBulkProcessing}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {ROLES.map((role) => {
          const count = users.filter((u) => u.role === role.value).length;
          return (
            <div
              key={role.value}
              className={`p-4 rounded-lg border ${role.color} bg-slate-900/50`}
            >
              <div className="flex items-center gap-3">
                {role.value === 'expert' ? <Shield className="w-5 h-5" /> : <UserIcon className="w-5 h-5" />}
                <div>
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-xs opacity-80">{role.label}s</p>
                </div>
              </div>
            </div>
          );
        })}
        <div className="p-4 rounded-lg border bg-slate-900/50 border-slate-800">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-teal-400" />
            <div>
              <p className="text-2xl font-bold text-white">{users.filter((u) => u.is_staff || u.is_superuser).length}</p>
              <p className="text-xs opacity-80 text-slate-300">Privileged</p>
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        data={users}
        columns={columns}
        keyExtractor={(user) => user.id}
        loading={loading}
        searchable={false}
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onEdit={handleOpenModal}
        onDelete={handleDelete}
        emptyMessage="No users found. Add your first user to get started."
      />

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-xl border border-slate-800 w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <h2 className="text-xl font-semibold text-white">
                {editingUser ? 'Edit User' : 'Add New User'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">
                  Email *
                </label>
                <Input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="user@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">
                  Username *
                </label>
                <Input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="username"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">
                    First Name
                  </label>
                  <Input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">
                    Last Name
                  </label>
                  <Input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <label className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded border-slate-600 text-teal-600 focus:ring-teal-500"
                  />
                  Active account
                </label>
                <label className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200">
                  <input
                    type="checkbox"
                    checked={formData.is_staff}
                    onChange={(e) => setFormData({ ...formData, is_staff: e.target.checked })}
                    className="rounded border-slate-600 text-teal-600 focus:ring-teal-500"
                  />
                  Staff access
                </label>
                <label className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200">
                  <input
                    type="checkbox"
                    checked={formData.is_superuser}
                    onChange={(e) => setFormData({ ...formData, is_superuser: e.target.checked })}
                    className="rounded border-slate-600 text-teal-600 focus:ring-teal-500"
                  />
                  Superuser
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">
                  Role *
                </label>
                <select
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as ApiUser['role'] })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {ROLES.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">
                    Password *
                  </label>
                  <Input
                    type="password"
                    required={!editingUser}
                    value={formData.password || ''}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                    placeholder="Set initial password"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseModal}
                  className="border-slate-600 text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-teal-600 hover:bg-teal-700 text-white"
                >
                  {isSubmitting ? 'Saving...' : editingUser ? 'Update User' : 'Create User'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
