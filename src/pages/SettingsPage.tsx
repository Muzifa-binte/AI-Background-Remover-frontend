import { useState, FormEvent, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { useThemeSettings, AccentTheme } from '../contexts/ThemeSettingsContext'
import { SHORTCUT_LIST } from '../hooks/useKeyboardShortcuts'
import CustomSlider from '../components/CustomSlider'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

type Tab = 'dashboard' | 'appearance' | 'performance' | 'shortcuts' | 'profile' | 'security' | 'danger'

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
          className="w-full px-3.5 py-2.5 pr-10 rounded-lg border border-border bg-surface-raised text-sm text-primary placeholder:text-muted focus:outline-none focus:border-magenta focus:ring-1 focus:ring-magenta/30 disabled:opacity-50"
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
      <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-surface-raised">
        <div className="w-16 h-16 rounded-full bg-magenta text-white flex items-center justify-center text-2xl font-bold shadow-inner">
          {user?.name?.charAt(0).toUpperCase() || 'U'}
        </div>
        <div>
          <h2 className="text-lg font-bold text-primary">{user?.name}</h2>
          <p className="text-sm text-secondary">{user?.email}</p>
          <p className="text-xs text-muted mt-1">Member since {createdDate}</p>
        </div>
      </div>

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

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-border bg-surface-raised flex flex-col gap-1">
          <span className="text-xs text-muted font-medium uppercase tracking-wider">Total Images</span>
          <span className="text-2xl font-bold text-primary">{stats?.total_images || 0}</span>
        </div>
        <div className="p-4 rounded-xl border border-border bg-surface-raised flex flex-col gap-1">
          <span className="text-xs text-muted font-medium uppercase tracking-wider">Storage Used</span>
          <span className="text-2xl font-bold text-primary">{formatBytes(stats?.storage_bytes || 0)}</span>
        </div>
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
              <span className="text-xs text-muted">Recolor & Eraser</span>
              <span className="text-lg font-bold text-primary">{stats?.operations?.recolor || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------- Appearance Tab ----------------
function AppearanceTab() {
  const { accent, setAccent } = useThemeSettings()
  const { showToast } = useToast()

  const THEMES: { id: AccentTheme; name: string; desc: string; color: string }[] = [
    { id: 'gold', name: 'Amber Gold (Darkroom Luxury)', desc: 'Warm amber tones on ultra-deep black surfaces', color: '#F59E0B' },
    { id: 'cyber', name: 'Cyber Neon (Magenta / Violet)', desc: 'Electric magenta & violet glow aesthetic', color: '#EC4899' },
    { id: 'emerald', name: 'Emerald Mint (Cyan / Green)', desc: 'Crisp green & teal high-contrast matrix', color: '#10B981' },
    { id: 'sapphire', name: 'Sapphire Electric (Blue / Indigo)', desc: 'Modern technical electric blue interface', color: '#3B82F6' },
    { id: 'sunset', name: 'Sunset Coral (Orange / Rose)', desc: 'Warm coral gradient with high punch vibrancy', color: '#F97316' },
  ]

  return (
    <div className="flex flex-col gap-6 animate-fade-up">
      <div>
        <h3 className="text-base font-bold text-primary">Accent Theme Selection</h3>
        <p className="text-xs text-secondary mt-0.5">Customize the primary interface accent color across buttons, indicators, and glow accents.</p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {THEMES.map((th) => {
          const isSelected = accent === th.id
          return (
            <div
              key={th.id}
              onClick={() => {
                setAccent(th.id)
                showToast(`Theme changed to ${th.name}`, 'info')
              }}
              className={`p-4 rounded-xl border cursor-pointer transition-all duration-150 flex items-center justify-between ${
                isSelected
                  ? 'border-magenta bg-magenta/10 shadow-sm ring-1 ring-magenta/40'
                  : 'border-border bg-surface-raised hover:border-border-strong hover:bg-surface'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full shadow-sm border border-white/20" style={{ backgroundColor: th.color }} />
                <div>
                  <h4 className="text-sm font-semibold text-primary">{th.name}</h4>
                  <p className="text-xs text-muted">{th.desc}</p>
                </div>
              </div>
              {isSelected && (
                <span className="text-xs font-bold text-magenta uppercase tracking-wider">Active</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ---------------- Performance Tab ----------------
function PerformanceTab() {
  const {
    clientCompression,
    setClientCompression,
    compressionQuality,
    setCompressionQuality,
    maxDimension,
    setMaxDimension,
  } = useThemeSettings()
  const { showToast } = useToast()

  return (
    <div className="flex flex-col gap-6 animate-fade-up">
      <div>
        <h3 className="text-base font-bold text-primary">Client-Side Compression</h3>
        <p className="text-xs text-secondary mt-0.5">Optimize images in the browser before sending to the AI model to save upload bandwidth and speed up processing.</p>
      </div>

      {/* Toggle */}
      <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-surface-raised">
        <div>
          <h4 className="text-sm font-semibold text-primary">Enable Pre-Upload Compression</h4>
          <p className="text-xs text-muted">Automatically downsamples massive files while preserving alpha masks.</p>
        </div>
        <input
          type="checkbox"
          checked={clientCompression}
          onChange={(e) => {
            setClientCompression(e.target.checked)
            showToast(`Pre-upload compression ${e.target.checked ? 'enabled' : 'disabled'}`, 'info')
          }}
          className="w-5 h-5 accent-magenta cursor-pointer"
        />
      </div>

      {clientCompression && (
        <div className="space-y-5 p-4 rounded-xl border border-border bg-surface">
          <CustomSlider
            label="Target Image Quality"
            value={Math.round(compressionQuality * 100)}
            min={60}
            max={100}
            unit="%"
            presets={[75, 85, 92, 98]}
            onChange={(val) => setCompressionQuality(val / 100)}
          />

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-secondary uppercase tracking-wider">
              Maximum Image Dimension
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[1800, 2500, 4000].map((dim) => (
                <button
                  key={dim}
                  type="button"
                  onClick={() => setMaxDimension(dim)}
                  className={`py-2 px-3 rounded-lg border text-xs font-mono font-medium transition-all ${
                    maxDimension === dim
                      ? 'bg-magenta/15 border-magenta text-magenta font-bold'
                      : 'border-border bg-surface-raised text-secondary hover:border-border-strong'
                  }`}
                >
                  {dim}px ({dim === 4000 ? '4K UHD' : dim === 2500 ? 'Standard HD' : 'Fast Web'})
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------- Shortcuts Tab ----------------
function ShortcutsTab() {
  return (
    <div className="flex flex-col gap-6 animate-fade-up">
      <div>
        <h3 className="text-base font-bold text-primary">Global Keyboard Shortcuts</h3>
        <p className="text-xs text-secondary mt-0.5">Use these keys anywhere in the app to boost your workflow speed.</p>
      </div>

      <div className="rounded-xl border border-border divide-y divide-border overflow-hidden bg-surface-raised">
        {SHORTCUT_LIST.map((item) => (
          <div key={item.key} className="flex items-center justify-between p-3.5 text-xs">
            <span className="text-secondary font-medium">{item.description}</span>
            <kbd className="px-2.5 py-1 font-mono text-[11px] font-bold bg-surface border border-border text-primary rounded shadow-xs">
              {item.key}
            </kbd>
          </div>
        ))}
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
      const msg = axios.isAxiosError(err) && err.response?.data?.detail ? String(err.response.data.detail) : 'Failed to update profile.'
      showToast(msg, 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleUpdate} className="flex flex-col gap-6 animate-fade-up">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="settings-name" className="text-sm font-medium text-secondary">Display Name</label>
        <input
          id="settings-name"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          disabled={busy}
          className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-surface-raised text-sm text-primary placeholder:text-muted focus:outline-none focus:border-magenta disabled:opacity-50"
          placeholder="Enter your name"
          maxLength={80}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="settings-email" className="text-sm font-medium text-secondary">Email Address</label>
        <input
          id="settings-email"
          type="email"
          value={user?.email || ''}
          disabled
          className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-surface-raised opacity-60 cursor-not-allowed text-sm text-primary"
        />
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={busy || !name.trim() || name === user?.name}
          className="btn-primary text-xs py-2.5 px-5"
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
  const [newPassword, setNewPassword] = useState('')
  const [busy, setBusy] = useState(false)

  const canSubmit = currentPassword && newPassword.length >= 8 && !busy

  async function handleUpdate(e: FormEvent) {
    e.preventDefault()
    if (!canSubmit) return

    setBusy(true)
    try {
      await axios.patch('/api/auth/password', {
        current_password: currentPassword,
        new_password: newPassword,
      })
      showToast('Password updated successfully!', 'success')
      setCurrentPassword('')
      setNewPassword('')
    } catch (err) {
      const msg = axios.isAxiosError(err) && err.response?.data?.detail ? String(err.response.data.detail) : 'Failed to update password.'
      showToast(msg, 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleUpdate} className="flex flex-col gap-5 animate-fade-up">
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
          className="btn-primary text-xs py-2.5 px-5"
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
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)

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
      const msg = axios.isAxiosError(err) && err.response?.data?.detail ? String(err.response.data.detail) : 'Failed to delete account.'
      showToast(msg, 'error')
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleDelete} className="flex flex-col gap-6 animate-fade-up">
      <div className="flex gap-3 px-4 py-3 rounded-xl bg-danger/10 border border-danger/25 text-xs text-danger">
        <div>
          <p className="font-bold">Permanent Account Deletion</p>
          <p className="mt-0.5 opacity-90">All your stored images, history, and workspace files will be immediately erased.</p>
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
          <label htmlFor="settings-delete-confirm" className="text-xs font-semibold text-secondary">
            Type <span className="font-mono font-bold text-danger">{CONFIRM_PHRASE}</span> to confirm
          </label>
          <input
            id="settings-delete-confirm"
            type="text"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            disabled={busy}
            placeholder={CONFIRM_PHRASE}
            className="w-full px-3.5 py-2.5 rounded-lg border border-danger/30 bg-surface-raised text-sm text-primary focus:outline-none focus:border-danger disabled:opacity-50"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          id="settings-delete-account"
          type="submit"
          disabled={!canDelete}
          className="px-5 py-2.5 rounded-lg bg-danger hover:bg-danger/90 text-white font-bold text-xs transition-all active:scale-95 disabled:opacity-40"
        >
          {busy && <Spinner />}
          {busy ? 'Deleting...' : 'Permanently Delete Account'}
        </button>
      </div>
    </form>
  )
}

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('appearance')

  const tabs: { id: Tab; label: string }[] = [
    { id: 'appearance', label: 'Appearance & Themes' },
    { id: 'performance', label: 'Client Compression' },
    { id: 'dashboard', label: 'Usage & Quotas' },
    { id: 'shortcuts', label: 'Shortcuts' },
    { id: 'profile', label: 'Profile' },
    { id: 'security', label: 'Security' },
    { id: 'danger', label: 'Danger Zone' },
  ]

  return (
    <main className="flex-1 py-8 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-primary tracking-tight">
            Settings & Preferences
          </h1>
          <p className="text-secondary text-xs sm:text-sm mt-1">
            Configure theme aesthetics, AI defaults, client compression, and account settings.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface shadow-md overflow-hidden glass-modal">
          <div className="flex border-b border-border overflow-x-auto p-1.5 gap-1 bg-surface-raised">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                  tab === t.id
                    ? 'bg-surface text-magenta shadow-xs border border-border'
                    : 'text-secondary hover:text-primary hover:bg-surface/50'
                } ${t.id === 'danger' && tab === 'danger' ? 'text-danger border-danger/30' : ''}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="p-6 sm:p-8">
            {tab === 'appearance' && <AppearanceTab />}
            {tab === 'performance' && <PerformanceTab />}
            {tab === 'dashboard' && <DashboardTab />}
            {tab === 'shortcuts' && <ShortcutsTab />}
            {tab === 'profile' && <ProfileTab />}
            {tab === 'security' && <SecurityTab />}
            {tab === 'danger' && <DangerTab />}
          </div>
        </div>
      </div>
    </main>
  )
}
