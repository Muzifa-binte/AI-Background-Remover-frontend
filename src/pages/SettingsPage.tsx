import { useState, FormEvent, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

type Tab = 'dashboard' | 'profile' | 'security' | 'danger'


function EyeIcon({ visible }: { visible: boolean }) {
  return visible ? (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745a10.029 10.029 0 003.3-4.38 1.651 1.651 0 000-1.185A10.004 10.004 0 009.999 3a9.956 9.956 0 00-4.744 1.194L3.28 2.22zM7.752 6.69l1.092 1.092a2.5 2.5 0 013.374 3.373l1.091 1.092a4 4 0 00-5.557-5.557z" clipRule="evenodd" />
      <path d="M10.748 13.93l2.523 2.523a9.987 9.987 0 01-3.27.547c-4.258 0-7.894-2.66-9.337-6.41a1.651 1.651 0 010-1.186A10.007 10.007 0 012.839 6.02L6.07 9.252a4 4 0 004.678 4.678z" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
      <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41z" clipRule="evenodd" />
    </svg>
  )
}

function PasswordInput({
  id, label, value, onChange, disabled, autoComplete, placeholder,
}: {
  id: string; label: string; value: string
  onChange: (v: string) => void; disabled: boolean
  autoComplete?: string; placeholder?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-secondary">{label}</label>
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          autoComplete={autoComplete}
          placeholder={placeholder || '••••••••'}
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          className="w-full px-3.5 py-2.5 pr-10 rounded-lg border border-border bg-surface-raised
            text-sm text-primary placeholder:text-muted
            focus:outline-none focus:border-magenta focus:ring-1 focus:ring-magenta/30
            disabled:opacity-50"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          disabled={disabled}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors disabled:opacity-50"
          title={show ? "Hide password" : "Show password"}
        >
          <EyeIcon visible={show} />
        </button>
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  )
}

// ---------------- Dashboard Tab ----------------
function DashboardTab() {
  const { user } = useAuth()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await axios.get('/api/auth/stats')
        setStats(res.data)
      } catch (err) {
        console.error("Failed to load stats", err)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner />
      </div>
    )
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const createdDate = user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'
  const quotaPercent = stats?.quota?.limit > 0 ? (stats.quota.used / stats.quota.limit) * 100 : 0

  return (
    <div className="flex flex-col gap-8 animate-fade-up">
      {/* Account Info */}
      <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-surface-raised">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-magenta to-purple flex items-center justify-center text-white text-2xl font-bold shadow-inner">
          {user?.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="text-lg font-bold text-primary">{user?.name}</h2>
          <p className="text-sm text-secondary">{user?.email}</p>
          <p className="text-xs text-muted mt-1">Member since {createdDate}</p>
        </div>
      </div>

      {/* Quota Progress */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-end">
          <h3 className="text-sm font-semibold text-primary">Daily Quota</h3>
          <span className="text-xs text-muted font-medium">
            {stats?.quota?.used} / {stats?.quota?.limit} images used
          </span>
        </div>
        <div className="h-2.5 w-full bg-surface-raised rounded-full overflow-hidden border border-border">
          <div 
            className="h-full bg-gradient-to-r from-teal to-magenta transition-all duration-500 ease-out"
            style={{ width: `${Math.min(quotaPercent, 100)}%` }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        
        {/* Total Images */}
        <div className="p-4 rounded-xl border border-border bg-surface-raised flex flex-col gap-1">
          <span className="text-xs text-muted font-medium uppercase tracking-wider">Total Images</span>
          <span className="text-2xl font-bold text-primary">{stats?.total_images || 0}</span>
        </div>

        {/* Storage */}
        <div className="p-4 rounded-xl border border-border bg-surface-raised flex flex-col gap-1">
          <span className="text-xs text-muted font-medium uppercase tracking-wider">Storage Used</span>
          <span className="text-2xl font-bold text-primary">{formatBytes(stats?.storage_bytes || 0)}</span>
        </div>

        {/* Breakdown */}
        <div className="col-span-2 sm:col-span-3 p-4 rounded-xl border border-border bg-surface-raised">
          <h4 className="text-sm font-semibold text-primary mb-3">Usage Breakdown</h4>
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            <div className="flex flex-col">
              <span className="text-xs text-muted">Remove BG</span>
              <span className="text-lg font-bold text-primary">{stats?.operations?.remove_bg || 0}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted">Enhance</span>
              <span className="text-lg font-bold text-primary">{stats?.operations?.enhance || 0}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted">Replace BG</span>
              <span className="text-lg font-bold text-primary">{stats?.operations?.replace_bg || 0}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted">Smart Crop</span>
              <span className="text-lg font-bold text-primary">{stats?.operations?.smart_crop || 0}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted">Recolor</span>
              <span className="text-lg font-bold text-primary">{stats?.operations?.recolor || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------- Profile Tab ----------------
function ProfileTab() {
  const { user, refreshUser } = useAuth()
  const { showToast } = useToast()
  
  const [name, setName] = useState(user?.name || '')
  const [busy, setBusy] = useState(false)

  async function handleUpdate(e: FormEvent) {
    e.preventDefault()
    if (!name.trim() || name === user?.name) return

    setBusy(true)
    try {
      await axios.patch('/api/auth/profile', { name: name.trim() })
      await refreshUser()
      showToast('Profile updated successfully!', 'success')
    } catch (err) {
      const msg = axios.isAxiosError(err) && err.response?.data?.detail
        ? String(err.response.data.detail)
        : 'Failed to update profile.'
      showToast(msg, 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleUpdate} className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="settings-name" className="text-sm font-medium text-secondary">
          Display Name
        </label>
        <input
          id="settings-name"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          disabled={busy}
          className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-surface-raised
            text-sm text-primary placeholder:text-muted
            focus:outline-none focus:border-magenta focus:ring-1 focus:ring-magenta/30
            disabled:opacity-50"
          placeholder="Enter your name"
          maxLength={80}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="settings-email" className="text-sm font-medium text-secondary">
          Email Address
        </label>
        <input
          id="settings-email"
          type="email"
          value={user?.email || ''}
          disabled
          className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-surface-raised opacity-60 cursor-not-allowed
            text-sm text-primary"
          title="Email cannot be changed"
        />
        <p className="text-xs text-muted mt-1">Your email address cannot be changed.</p>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={busy || !name.trim() || name === user?.name}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg
            bg-primary hover:bg-primary-hover text-surface font-semibold text-sm
            transition-all active:scale-95
            disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          {busy && <Spinner />}
          {busy ? 'Saving...' : 'Save changes'}
        </button>
      </div>
    </form>
  )
}

// ---------------- Security Tab ----------------
function SecurityTab() {
  const { showToast } = useToast()
  
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword,     setNewPassword]     = useState('')
  const [busy,            setBusy]            = useState(false)

  const canSubmit = currentPassword && newPassword.length >= 8 && !busy

  async function handleUpdate(e: FormEvent) {
    e.preventDefault()
    if (!canSubmit) return

    setBusy(true)
    try {
      await axios.patch('/api/auth/password', {
        current_password: currentPassword,
        new_password:     newPassword,
      })
      showToast('Password updated successfully!', 'success')
      setCurrentPassword('')
      setNewPassword('')
    } catch (err) {
      const msg = axios.isAxiosError(err) && err.response?.data?.detail
        ? String(err.response.data.detail)
        : 'Failed to update password.'
      showToast(msg, 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleUpdate} className="flex flex-col gap-5">
      <PasswordInput
        id="settings-current-password"
        label="Current Password"
        value={currentPassword}
        onChange={setCurrentPassword}
        disabled={busy}
        autoComplete="current-password"
      />
      
      <div className="border-t border-border/50 my-1" />

      <PasswordInput
        id="settings-new-password"
        label="New Password"
        value={newPassword}
        onChange={setNewPassword}
        disabled={busy}
        autoComplete="new-password"
      />
      
      <p className="text-xs text-muted -mt-2">Password must be at least 8 characters long.</p>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={!canSubmit}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg
            bg-primary hover:bg-primary-hover text-surface font-semibold text-sm
            transition-all active:scale-95
            disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          {busy && <Spinner />}
          {busy ? 'Updating...' : 'Update password'}
        </button>
      </div>
    </form>
  )
}

// ---------------- Danger Zone Tab ----------------
function DangerTab() {
  const { logout } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [busy,     setBusy]     = useState(false)

  const CONFIRM_PHRASE = 'DELETE'
  const canDelete = password.length > 0 && confirm === CONFIRM_PHRASE && !busy

  async function handleDelete(e: FormEvent) {
    e.preventDefault()
    if (!canDelete) return
    setBusy(true)
    try {
      await axios.delete('/api/auth/account', { data: { password } })
      await logout()
      showToast('Your account has been permanently deleted.', 'success')
      navigate('/login', { replace: true })
    } catch (err) {
      const msg = axios.isAxiosError(err) && err.response?.data?.detail
        ? String(err.response.data.detail)
        : 'Failed to delete account.'
      showToast(msg, 'error')
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleDelete} className="flex flex-col gap-6">
      <div className="flex gap-3 px-4 py-3 rounded-lg bg-danger/5 border border-danger/20 text-sm text-danger">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
          className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true">
          <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
        </svg>
        <div>
          <p className="font-semibold">This action is permanent and cannot be undone.</p>
          <p className="mt-0.5 text-danger/80">All your images, history, and data will be permanently deleted.</p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <PasswordInput
          id="settings-delete-password"
          label="Enter your password to confirm"
          value={password}
          onChange={setPassword}
          disabled={busy}
          autoComplete="current-password"
        />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="settings-delete-confirm" className="text-sm font-medium text-secondary">
            Type <span className="font-mono font-bold text-danger">{CONFIRM_PHRASE}</span> to confirm
          </label>
          <input
            id="settings-delete-confirm"
            type="text"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            disabled={busy}
            placeholder={CONFIRM_PHRASE}
            autoComplete="off"
            spellCheck={false}
            className="w-full px-3.5 py-2.5 rounded-lg border border-danger/30 bg-surface-raised
              text-sm text-primary placeholder:text-muted
              focus:outline-none focus:border-danger focus:ring-1 focus:ring-danger/20
              disabled:opacity-50"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          id="settings-delete-account"
          type="submit"
          disabled={!canDelete}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg
            bg-danger hover:bg-danger/90 text-white font-semibold text-sm
            transition-all active:scale-95
            disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          {busy && <Spinner />}
          {busy ? 'Deleting...' : 'Permanently delete account'}
        </button>
      </div>
    </form>
  )
}

// ---------------- Main Settings Page ----------------
export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('dashboard')

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" aria-hidden="true">
          <path d="M2 4a2 2 0 012-2h3a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2V4zm11-2a2 2 0 00-2 2v10a2 2 0 002 2h3a2 2 0 002-2V4a2 2 0 00-2-2h-3zm-9 10a2 2 0 00-2 2v2a2 2 0 002 2h3a2 2 0 002-2v-2a2 2 0 00-2-2H4z" />
        </svg>
      )
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" aria-hidden="true">
          <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
        </svg>
      ),
    },
    {
      id: 'security',
      label: 'Security',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" aria-hidden="true">
          <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
        </svg>
      ),
    },
    {
      id: 'danger',
      label: 'Danger Zone',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" aria-hidden="true">
          <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
        </svg>
      ),
    },
  ]

  return (
    <main className="flex-1 py-10 px-4">
      <div className="max-w-2xl mx-auto flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-primary tracking-tight">
            Account Settings
          </h1>
          <p className="text-secondary text-sm mt-1.5">
            Manage your profile, password and account preferences.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">
          <div className="flex border-b border-border overflow-x-auto custom-scrollbar">
            {tabs.map(t => (
              <button
                key={t.id}
                id={`settings-tab-${t.id}`}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors
                  border-b-2 focus:outline-none whitespace-nowrap
                  ${tab === t.id
                    ? 'border-magenta text-magenta'
                    : 'border-transparent text-secondary hover:text-primary hover:border-border-strong'
                  }
                  ${t.id === 'danger' && tab !== 'danger' ? 'hover:text-danger hover:border-danger/30' : ''}
                  ${t.id === 'danger' && tab === 'danger'  ? 'border-danger text-danger' : ''}
                `}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>

          <div className="p-6 sm:p-8">
            {tab === 'dashboard' && <DashboardTab />}
            {tab === 'profile'   && <ProfileTab />}
            {tab === 'security'  && <SecurityTab />}
            {tab === 'danger'    && <DangerTab />}
          </div>
        </div>
      </div>
    </main>
  )
}
