import {
  Shield, CheckCircle, Activity, Users, LogOut, Bell, Settings,
  TrendingUp, Clock, MapPin, Smartphone, Monitor, AlertCircle,
  Lock, ChevronRight, BarChart3, Laptop, Tablet, Wifi, WifiOff
} from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';

interface DashboardProps {
  onLogout: () => void;
  username?: string;
}

/* ── Seeded data ── */

const weeklyLogins = [
  { day: 'Mon', logins: 4, blocked: 1 },
  { day: 'Tue', logins: 7, blocked: 0 },
  { day: 'Wed', logins: 3, blocked: 2 },
  { day: 'Thu', logins: 9, blocked: 0 },
  { day: 'Fri', logins: 6, blocked: 1 },
  { day: 'Sat', logins: 2, blocked: 0 },
  { day: 'Sun', logins: 5, blocked: 0 },
];

const recentActivity = [
  { device: 'MacBook Pro 16"', browser: 'Chrome 121', location: 'San Francisco, US', time: 'Just now', status: 'success', icon: Monitor },
  { device: 'iPhone 15 Pro', browser: 'Safari 17', location: 'San Francisco, US', time: '2 hours ago', status: 'success', icon: Smartphone },
  { device: 'Windows PC', browser: 'Chrome 120', location: 'Austin, TX', time: 'Yesterday', status: 'success', icon: Monitor },
  { device: 'Unknown device', browser: 'Firefox 121', location: 'Moscow, RU', time: '3 days ago', status: 'blocked', icon: AlertCircle },
  { device: 'iPad Pro 12.9"', browser: 'Safari 17', location: 'New York, US', time: '5 days ago', status: 'success', icon: Tablet },
  { device: 'Linux Workstation', browser: 'Firefox 120', location: 'Berlin, DE', time: '1 week ago', status: 'success', icon: Monitor },
];

const trustedDevices = [
  { name: 'MacBook Pro 16"', os: 'macOS Sonoma 14.3', lastSeen: 'Now', icon: Laptop, trusted: true, online: true },
  { name: 'iPhone 15 Pro', os: 'iOS 17.3', lastSeen: '2 hrs ago', icon: Smartphone, trusted: true, online: false },
  { name: 'iPad Pro 12.9"', os: 'iPadOS 17.2', lastSeen: '5 days ago', icon: Tablet, trusted: true, online: false },
  { name: 'Windows PC', os: 'Windows 11 23H2', lastSeen: 'Yesterday', icon: Monitor, trusted: false, online: false },
];

const securityAlerts = [
  { type: 'blocked', msg: 'Blocked login attempt from Moscow, RU', time: '3 days ago', color: '#ef4444', bg: '#fef2f2' },
  { type: 'info', msg: 'New device added: iPhone 15 Pro', time: '1 week ago', color: '#3b82f6', bg: '#eff6ff' },
  { type: 'success', msg: 'Password changed successfully', time: '2 weeks ago', color: '#22c55e', bg: '#f0fdf4' },
];

const stats = [
  { icon: Shield, label: 'Security Score', value: '98', unit: '%', change: '+2%', positive: true, bg: '#eff6ff', color: '#3b82f6', desc: 'Excellent' },
  { icon: CheckCircle, label: 'Verified Sessions', value: '24', unit: '', change: '+8', positive: true, bg: '#f0fdf4', color: '#22c55e', desc: 'This month' },
  { icon: Activity, label: 'Threats Blocked', value: '3', unit: '', change: '-5', positive: true, bg: '#faf5ff', color: '#a855f7', desc: 'This month' },
  { icon: Smartphone, label: 'Trusted Devices', value: '3', unit: '', change: '+1', positive: true, bg: '#fff7ed', color: '#f97316', desc: 'Active' },
];

const securityChecklist = [
  { text: 'Two-factor authentication is active', done: true },
  { text: 'Recovery codes saved', done: true },
  { text: 'Backup email configured', done: true },
  { text: 'Hardware security key not added', done: false },
];

/* ── Custom tooltip for chart ── */
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#e2e8f0] rounded-xl p-3 shadow-lg text-xs">
      <p className="text-[#0f172a] mb-1" style={{ fontWeight: 600 }}>{label}</p>
      <p className="text-[#3b82f6]">✓ {payload[0]?.value} logins</p>
      {payload[1]?.value > 0 && <p className="text-[#ef4444]">✗ {payload[1]?.value} blocked</p>}
    </div>
  );
}

/* ── Component ── */
const getDisplayName = (value?: string) => {
  if (!value) return 'User';
  const name = value.split('@')[0].trim();
  return name || value;
};

const getInitials = (value?: string) => {
  const name = getDisplayName(value);
  const parts = name.split(/[._\-\s]+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

export function Dashboard({ onLogout, username }: DashboardProps) {
  const [showBanner, setShowBanner] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [activeTab, setActiveTab] = useState<'activity' | 'devices' | 'alerts'>('activity');
  const displayName = getDisplayName(username);
  const initials = getInitials(username);

  return (
    <div className="min-h-screen bg-[#f0f6ff]">

      {/* ── Navbar ── */}
      <nav className="bg-white border-b border-[#e8f0fe] sticky top-0 z-40 shadow-[0_2px_12px_rgba(59,130,246,0.07)]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2563eb] to-[#3b82f6] flex items-center justify-center shadow-[0_4px_8px_rgba(59,130,246,0.3)]">
              <Shield className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-[#0f172a] text-lg" style={{ fontWeight: 700 }}>SecureAuth</span>
            <div className="hidden md:flex items-center gap-1 ml-2 bg-[#f0fdf4] border border-[#bbf7d0] rounded-full px-2.5 py-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
              <span className="text-[#16a34a] text-xs" style={{ fontWeight: 600 }}>Protected</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-1">
            {['Dashboard', 'Security', 'Devices', 'Activity'].map((item, i) => (
              <button
                key={item}
                className={`px-4 py-2 rounded-xl text-sm transition-all ${i === 0 ? 'bg-[#eff6ff] text-[#3b82f6]' : 'text-[#64748b] hover:text-[#1e293b] hover:bg-[#f8fafc]'
                  }`}
                style={{ fontWeight: i === 0 ? 600 : 500 }}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button className="relative w-9 h-9 rounded-xl bg-[#f8fafc] hover:bg-[#f1f5f9] border border-[#e2e8f0] flex items-center justify-center text-[#64748b] transition-all">
              <Bell className="w-4 h-4" />
              <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#ef4444] border border-white" />
            </button>
            <button className="w-9 h-9 rounded-xl bg-[#f8fafc] hover:bg-[#f1f5f9] border border-[#e2e8f0] flex items-center justify-center text-[#64748b] transition-all">
              <Settings className="w-4 h-4" />
            </button>

            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2.5 bg-[#f8fafc] hover:bg-[#f1f5f9] border border-[#e2e8f0] rounded-xl pl-1 pr-3 py-1 transition-all"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#3b82f6] to-[#6366f1] flex items-center justify-center">
                  <span className="text-white text-xs" style={{ fontWeight: 700 }}>{initials}</span>
                </div>
                <span className="text-[#374151] text-sm" style={{ fontWeight: 500 }}>{displayName}</span>
              </button>

              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.12)] border border-[#f1f5f9] overflow-hidden z-50"
                  >
                    <div className="px-4 py-3 border-b border-[#f1f5f9]">
                      <p className="text-[#0f172a] text-sm" style={{ fontWeight: 600 }}>{displayName}</p>
                      <p className="text-[#94a3b8] text-xs">{username || 'unknown'}</p>
                      <div className="flex items-center gap-1.5 mt-1.5 bg-[#f0fdf4] rounded-lg px-2 py-1 w-fit">
                        <Shield className="w-3 h-3 text-[#22c55e]" />
                        <span className="text-[#16a34a] text-xs" style={{ fontWeight: 600 }}>2FA Active</span>
                      </div>
                    </div>
                    {['Profile Settings', 'Security Center', 'Billing & Plan'].map(item => (
                      <button key={item} className="w-full text-left px-4 py-2.5 text-sm text-[#374151] hover:bg-[#f8fafc] flex items-center justify-between group">
                        {item}
                        <ChevronRight className="w-3.5 h-3.5 text-[#cbd5e1] group-hover:text-[#64748b] transition-colors" />
                      </button>
                    ))}
                    <div className="border-t border-[#f1f5f9]">
                      <button
                        onClick={() => { setShowUserMenu(false); onLogout(); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-[#ef4444] hover:bg-[#fef2f2] flex items-center gap-2"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Main content ── */}
      <main className="max-w-7xl mx-auto px-6 py-8">

        {/* Success banner */}
        <AnimatePresence>
          {showBanner && (
            <motion.div
              initial={{ opacity: 0, y: -12, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -12, height: 0 }}
              className="mb-6"
            >
              <div className="bg-gradient-to-r from-[#f0fdf4] to-[#dcfce7] border border-[#86efac] rounded-2xl px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#22c55e]/15 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-[#22c55e]" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-[#166534] text-sm" style={{ fontWeight: 600 }}>Login successful — 2FA verified</p>
                    <p className="text-[#4ade80] text-xs mt-0.5">
                      Welcome back, {displayName} · Session active · Just now
                    </p>
                  </div>
                </div>
                <button onClick={() => setShowBanner(false)} className="text-[#86efac] hover:text-[#4ade80] transition-colors text-xl leading-none">×</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Page header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-[#0f172a] mb-1" style={{ fontSize: '1.75rem', fontWeight: 700, lineHeight: '1.2' }}>
              Good morning, Jane 👋
            </h1>
            <p className="text-[#64748b] text-sm">Here's your security overview for today — Wednesday, April 22</p>
          </div>
          <button className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-[#3b82f6] text-white rounded-xl hover:bg-[#2563eb] transition-colors text-sm shadow-[0_4px_12px_rgba(59,130,246,0.3)]" style={{ fontWeight: 600 }}>
            <BarChart3 className="w-4 h-4" />
            Security Report
          </button>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.07 }}
                className="bg-white rounded-2xl p-5 shadow-[0_4px_20px_rgba(59,130,246,0.07)] border border-[#f1f5f9] hover:shadow-[0_8px_30px_rgba(59,130,246,0.11)] transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: stat.bg }}>
                    <Icon className="w-5 h-5" style={{ color: stat.color }} strokeWidth={2} />
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: stat.positive ? '#f0fdf4' : '#fef2f2', color: stat.positive ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                    {stat.change}
                  </span>
                </div>
                <p className="text-[#64748b] text-xs mb-1">{stat.label}</p>
                <div className="flex items-end gap-1">
                  <span className="text-[#0f172a]" style={{ fontSize: '1.75rem', fontWeight: 700, lineHeight: 1 }}>{stat.value}</span>
                  {stat.unit && <span className="text-[#64748b] text-sm mb-0.5">{stat.unit}</span>}
                </div>
                <p className="text-[#94a3b8] text-xs mt-1">{stat.desc}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Middle row: chart + 2FA status */}
        <div className="grid lg:grid-cols-3 gap-5 mb-5">
          {/* Weekly logins chart */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 }}
            className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-[0_4px_20px_rgba(59,130,246,0.07)] border border-[#f1f5f9]"
          >
            <div className="flex items-center justify-between mb-1">
              <div>
                <p className="text-[#0f172a] text-sm" style={{ fontWeight: 600 }}>Weekly Login Activity</p>
                <p className="text-[#94a3b8] text-xs mt-0.5">36 total logins · 4 blocked this week</p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-[#64748b]"><span className="w-2.5 h-2.5 rounded-sm inline-block bg-[#3b82f6]" /> Verified</span>
                <span className="flex items-center gap-1 text-[#64748b]"><span className="w-2.5 h-2.5 rounded-sm inline-block bg-[#fca5a5]" /> Blocked</span>
              </div>
            </div>
            <div style={{ height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyLogins} barGap={3} barCategoryGap="30%">
                  <CartesianGrid vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="logins" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="blocked" fill="#fca5a5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* 2FA Status card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32 }}
            className="bg-gradient-to-br from-[#1e40af] via-[#2563eb] to-[#3b82f6] rounded-2xl p-5 text-white relative overflow-hidden"
          >
            <div className="absolute top-[-20px] right-[-20px] w-[100px] h-[100px] rounded-full bg-white/10" />
            <div className="absolute bottom-[-30px] left-[-10px] w-[80px] h-[80px] rounded-full bg-white/5" />
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Lock className="w-4 h-4 text-blue-200" />
                  <span className="text-blue-200 text-xs" style={{ fontWeight: 600 }}>2FA STATUS</span>
                </div>
                <p className="text-white mb-1" style={{ fontSize: '1.125rem', fontWeight: 700 }}>Fully Protected</p>
                <p className="text-blue-200 text-xs mb-4" style={{ lineHeight: '1.5' }}>
                  Authenticator app (TOTP) is active and protecting your account.
                </p>
              </div>
              <div className="space-y-2">
                {[
                  { label: 'Method', value: 'Google Authenticator' },
                  { label: 'Enabled', value: 'Apr 18, 2025' },
                  { label: 'Backup codes', value: '8 remaining' },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-white/12 rounded-xl px-3 py-2 flex items-center justify-between">
                    <p className="text-blue-200 text-xs">{label}</p>
                    <p className="text-white text-xs" style={{ fontWeight: 600 }}>{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom row: activity / devices / alerts tabs + security checklist */}
        <div className="grid lg:grid-cols-3 gap-5">
          {/* Tabbed panel */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.36 }}
            className="lg:col-span-2 bg-white rounded-2xl shadow-[0_4px_20px_rgba(59,130,246,0.07)] border border-[#f1f5f9] overflow-hidden"
          >
            {/* Tabs */}
            <div className="flex border-b border-[#f1f5f9] px-5 pt-4 gap-1">
              {(['activity', 'devices', 'alerts'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-t-xl text-sm capitalize transition-all -mb-px ${activeTab === tab
                      ? 'bg-[#eff6ff] text-[#3b82f6] border-b-2 border-[#3b82f6]'
                      : 'text-[#64748b] hover:text-[#1e293b]'
                    }`}
                  style={{ fontWeight: activeTab === tab ? 600 : 400 }}
                >
                  {tab === 'activity' ? 'Login Activity' : tab === 'devices' ? 'Devices' : 'Alerts'}
                  {tab === 'alerts' && (
                    <span className="ml-1.5 bg-[#ef4444] text-white text-xs rounded-full px-1.5 py-0.5" style={{ fontSize: '10px', fontWeight: 700 }}>1</span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <AnimatePresence mode="wait">
              {activeTab === 'activity' && (
                <motion.div key="activity" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                  <div className="divide-y divide-[#f8fafc]">
                    {recentActivity.map(({ device, browser, location, time, status, icon: DeviceIcon }, i) => (
                      <div key={i} className="px-5 py-3 flex items-center justify-between hover:bg-[#fafcff] transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${status === 'blocked' ? 'bg-[#fef2f2]' : 'bg-[#f0f6ff]'}`}>
                            <DeviceIcon className={`w-4 h-4 ${status === 'blocked' ? 'text-[#ef4444]' : 'text-[#3b82f6]'}`} />
                          </div>
                          <div>
                            <p className="text-[#0f172a] text-sm" style={{ fontWeight: 500 }}>{device}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[#94a3b8] text-xs">{browser}</span>
                              <span className="text-[#e2e8f0]">·</span>
                              <span className="text-[#94a3b8] text-xs flex items-center gap-0.5">
                                <MapPin className="w-2.5 h-2.5" />{location}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="text-[#94a3b8] text-xs">{time}</span>
                          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${status === 'blocked' ? 'bg-[#fef2f2] text-[#dc2626]' : 'bg-[#f0fdf4] text-[#16a34a]'}`} style={{ fontWeight: 600 }}>
                            {status === 'blocked' ? 'Blocked' : 'Verified'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'devices' && (
                <motion.div key="devices" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                  <div className="divide-y divide-[#f8fafc]">
                    {trustedDevices.map(({ name, os, lastSeen, icon: DevIcon, trusted, online }, i) => (
                      <div key={i} className="px-5 py-3.5 flex items-center justify-between hover:bg-[#fafcff] transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${trusted ? 'bg-[#f0f6ff]' : 'bg-[#f8fafc]'}`}>
                              <DevIcon className={`w-5 h-5 ${trusted ? 'text-[#3b82f6]' : 'text-[#94a3b8]'}`} />
                            </div>
                            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${online ? 'bg-[#22c55e]' : 'bg-[#e2e8f0]'}`} />
                          </div>
                          <div>
                            <p className="text-[#0f172a] text-sm" style={{ fontWeight: 500 }}>{name}</p>
                            <p className="text-[#94a3b8] text-xs mt-0.5">{os} · Last seen {lastSeen}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {online
                            ? <span className="flex items-center gap-1 text-xs text-[#22c55e]"><Wifi className="w-3 h-3" />Online</span>
                            : <span className="flex items-center gap-1 text-xs text-[#94a3b8]"><WifiOff className="w-3 h-3" />Offline</span>
                          }
                          {trusted
                            ? <span className="text-xs bg-[#f0fdf4] text-[#16a34a] border border-[#bbf7d0] px-2 py-0.5 rounded-full" style={{ fontWeight: 600 }}>Trusted</span>
                            : <span className="text-xs bg-[#fef2f2] text-[#dc2626] border border-[#fecaca] px-2 py-0.5 rounded-full" style={{ fontWeight: 600 }}>Unknown</span>
                          }
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'alerts' && (
                <motion.div key="alerts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                  <div className="divide-y divide-[#f8fafc]">
                    {securityAlerts.map(({ type, msg, time, color, bg }, i) => (
                      <div key={i} className="px-5 py-3.5 flex items-start gap-3 hover:bg-[#fafcff] transition-colors">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: bg }}>
                          {type === 'blocked' ? <AlertCircle className="w-4 h-4" style={{ color }} /> : type === 'success' ? <CheckCircle className="w-4 h-4" style={{ color }} /> : <Shield className="w-4 h-4" style={{ color }} />}
                        </div>
                        <div className="flex-1">
                          <p className="text-[#0f172a] text-sm" style={{ fontWeight: 500 }}>{msg}</p>
                          <p className="text-[#94a3b8] text-xs mt-0.5">{time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Security checklist */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.42 }}
            className="bg-white rounded-2xl p-5 shadow-[0_4px_20px_rgba(59,130,246,0.07)] border border-[#f1f5f9]"
          >
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-[#94a3b8]" />
              <h3 className="text-[#0f172a] text-sm" style={{ fontWeight: 600 }}>Security Checklist</h3>
            </div>
            <div className="space-y-3 mb-4">
              {securityChecklist.map(({ text, done }, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${done ? 'bg-[#22c55e]' : 'bg-[#f1f5f9] border-2 border-[#e2e8f0]'}`}>
                    {done && <CheckCircle className="w-3 h-3 text-white" />}
                  </div>
                  <p className={`text-sm ${done ? 'text-[#374151]' : 'text-[#94a3b8]'}`}>{text}</p>
                </div>
              ))}
            </div>
            <div className="h-1.5 bg-[#f1f5f9] rounded-full overflow-hidden mb-1.5">
              <div
                className="h-full bg-gradient-to-r from-[#3b82f6] to-[#22c55e] rounded-full"
                style={{ width: `${(securityChecklist.filter(t => t.done).length / securityChecklist.length) * 100}%` }}
              />
            </div>
            <p className="text-[#94a3b8] text-xs text-right">
              {securityChecklist.filter(t => t.done).length}/{securityChecklist.length} complete
            </p>

            {/* Account info */}
            <div className="mt-5 pt-4 border-t border-[#f1f5f9] space-y-2">
              <p className="text-[#64748b] text-xs uppercase tracking-wider mb-2" style={{ fontWeight: 600 }}>Account</p>
              {[
                { label: 'Name', value: 'Jane Smith' },
                { label: 'Email', value: 'jane.smith@secureauth.io' },
                { label: 'Plan', value: 'Free' },
                { label: 'Member since', value: 'Apr 18, 2025' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="text-[#94a3b8] text-xs">{label}</span>
                  <span className="text-[#374151] text-xs" style={{ fontWeight: 500 }}>{value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
