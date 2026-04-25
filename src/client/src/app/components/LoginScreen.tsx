import { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, Shield, CheckCircle, Zap, Globe, Zap as FlashIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LoginScreenProps {
  onContinue: () => void;
  onSignUpClick: () => void;
}

const features = [
  { icon: Shield, text: 'Military-grade AES-256 encryption' },
  { icon: Zap, text: 'Real-time threat detection & alerts' },
  { icon: Globe, text: 'Zero-knowledge security architecture' },
];

const DEMO_ACCOUNT = {
  email: 'jane.smith@secureauth.io',
  password: 'Demo@2024!',
  name: 'Jane Smith',
};

export function LoginScreen({ onContinue, onSignUpClick }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [filledDemo, setFilledDemo] = useState(false);

  const isDemoCredentials = email === DEMO_ACCOUNT.email && password === DEMO_ACCOUNT.password;

  const handleFillDemo = () => {
    setEmail(DEMO_ACCOUNT.email);
    setPassword(DEMO_ACCOUNT.password);
    setHasError(false);
    setAttemptCount(0);
    setFilledDemo(true);
  };

  const handleLogin = () => {
    if (!email || !password) {
      setHasError(true);
      return;
    }
    // Demo account: skip error, go straight through
    if (isDemoCredentials) {
      setHasError(false);
      onContinue();
      return;
    }
    const newCount = attemptCount + 1;
    setAttemptCount(newCount);
    if (newCount === 1) {
      setHasError(true);
    } else {
      setHasError(false);
      onContinue();
    }
  };

  return (
    <div className="min-h-screen flex bg-[#f0f6ff]">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden bg-gradient-to-br from-[#1e40af] via-[#2563eb] to-[#3b82f6] flex-col justify-between p-12">
        {/* Background decorative circles */}
        <div className="absolute top-[-80px] right-[-80px] w-[320px] h-[320px] rounded-full bg-white/5" />
        <div className="absolute bottom-[-60px] left-[-60px] w-[240px] h-[240px] rounded-full bg-white/5" />
        <div className="absolute top-[40%] right-[-40px] w-[160px] h-[160px] rounded-full bg-white/5" />
        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        {/* Brand */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
              <Shield className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-white text-xl tracking-tight" style={{ fontWeight: 600 }}>SecureAuth</span>
          </div>
          <div className="h-px bg-white/20 mb-10" />
          <h2 className="text-white mb-4" style={{ fontSize: '2rem', fontWeight: 700, lineHeight: '1.2' }}>
            Protect what<br />matters most.
          </h2>
          <p className="text-blue-100 text-base" style={{ lineHeight: '1.7' }}>
            Enterprise-grade two-factor authentication that keeps your accounts safe from unauthorized access.
          </p>
        </div>

        {/* Features list */}
        <div className="relative z-10 space-y-4">
          {features.map(({ icon: Icon, text }, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
              className="flex items-center gap-3"
            >
              <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center border border-white/20 flex-shrink-0">
                <Icon className="w-4 h-4 text-white" strokeWidth={2} />
              </div>
              <span className="text-blue-100 text-sm">{text}</span>
            </motion.div>
          ))}
        </div>

        {/* Stats */}
        <div className="relative z-10 grid grid-cols-2 gap-4">
          {[
            { value: '2M+', label: 'Accounts protected' },
            { value: '99.9%', label: 'Uptime guarantee' },
          ].map(({ value, label }) => (
            <div key={label} className="bg-white/10 rounded-2xl p-4 border border-white/20 backdrop-blur-sm">
              <p className="text-white text-2xl" style={{ fontWeight: 700 }}>{value}</p>
              <p className="text-blue-200 text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-[420px]">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-[#3b82f6] flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" strokeWidth={2} />
            </div>
            <span className="text-[#1e293b] text-lg" style={{ fontWeight: 600 }}>SecureAuth</span>
          </div>

          <div className="mb-8">
            <h1 className="text-[#0f172a] mb-2" style={{ fontSize: '1.75rem', fontWeight: 700, lineHeight: '1.2' }}>
              Welcome back
            </h1>
            <p className="text-[#64748b] text-sm">Sign in to your account to continue</p>
          </div>

          {/* Demo account card */}
          <motion.button
            onClick={handleFillDemo}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="w-full mb-5 flex items-center gap-3 bg-gradient-to-r from-[#eff6ff] to-[#f5f3ff] border border-[#bfdbfe] hover:border-[#93c5fd] rounded-2xl px-4 py-3.5 text-left transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#6366f1] flex items-center justify-center flex-shrink-0 shadow-[0_4px_8px_rgba(99,102,241,0.3)]">
              <Shield className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-[#1e293b] text-sm" style={{ fontWeight: 600 }}>Jane Smith</p>
                <span className="bg-[#dbeafe] text-[#1d4ed8] text-xs px-2 py-0.5 rounded-full" style={{ fontWeight: 600 }}>
                  Demo account
                </span>
              </div>
              <p className="text-[#94a3b8] text-xs truncate mt-0.5">{DEMO_ACCOUNT.email}</p>
            </div>
            <AnimatePresence mode="wait">
              {filledDemo && isDemoCredentials ? (
                <motion.div
                  key="check"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="w-6 h-6 rounded-full bg-[#22c55e] flex items-center justify-center flex-shrink-0"
                >
                  <CheckCircle className="w-3.5 h-3.5 text-white" />
                </motion.div>
              ) : (
                <motion.span
                  key="fill"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-[#3b82f6] text-xs group-hover:text-[#2563eb] transition-colors flex-shrink-0"
                  style={{ fontWeight: 600 }}
                >
                  Use →
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Divider */}
          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#e2e8f0]" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-[#f0f6ff] px-3 text-[#94a3b8] text-xs">OR SIGN IN MANUALLY</span>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            {/* Email field */}
            <div>
              <label className="block text-[#374151] text-sm mb-1.5">Email address</label>
              <div
                className={`relative flex items-center rounded-2xl border transition-all duration-200 ${
                  focusedField === 'email'
                    ? 'border-[#3b82f6] shadow-[0_0_0_3px_rgba(59,130,246,0.15)]'
                    : 'border-[#e2e8f0]'
                } bg-white`}
              >
                <Mail className="absolute left-4 w-4 h-4 text-[#94a3b8]" />
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setHasError(false); }}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="you@company.com"
                  className="w-full pl-11 pr-4 py-3.5 bg-transparent outline-none text-[#0f172a] placeholder-[#cbd5e1] rounded-2xl"
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[#374151] text-sm">Password</label>
                <button className="text-[#3b82f6] text-xs hover:text-[#2563eb] transition-colors">
                  Forgot password?
                </button>
              </div>
              <div
                className={`relative flex items-center rounded-2xl border transition-all duration-200 ${
                  hasError
                    ? 'border-[#fca5a5] shadow-[0_0_0_3px_rgba(252,165,165,0.25)]'
                    : focusedField === 'password'
                    ? 'border-[#3b82f6] shadow-[0_0_0_3px_rgba(59,130,246,0.15)]'
                    : 'border-[#e2e8f0]'
                } bg-white`}
              >
                <Lock className="absolute left-4 w-4 h-4 text-[#94a3b8]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setHasError(false); }}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Enter your password"
                  className="w-full pl-11 pr-12 py-3.5 bg-transparent outline-none text-[#0f172a] placeholder-[#cbd5e1] rounded-2xl"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-[#94a3b8] hover:text-[#64748b] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <AnimatePresence>
                {hasError && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -6, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-2"
                  >
                    <div className="flex items-center gap-2 bg-[#fef2f2] border border-[#fecaca] rounded-xl px-3 py-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ef4444] flex-shrink-0" />
                      <p className="text-[#dc2626] text-xs">
                        {!email || !password
                          ? 'Please fill in all fields'
                          : 'Incorrect email or password. Try again.'}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Remember me */}
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-4 h-4 rounded border-2 border-[#e2e8f0] flex items-center justify-center cursor-pointer hover:border-[#3b82f6] transition-colors">
            </div>
            <span className="text-[#64748b] text-sm">Remember me for 30 days</span>
          </div>

          {/* Submit button */}
          <motion.button
            onClick={handleLogin}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full py-3.5 rounded-2xl text-white transition-colors mb-5 shadow-[0_4px_16px_rgba(59,130,246,0.35)] ${
              isDemoCredentials
                ? 'bg-gradient-to-r from-[#3b82f6] to-[#6366f1] hover:from-[#2563eb] hover:to-[#4f46e5]'
                : 'bg-[#3b82f6] hover:bg-[#2563eb]'
            }`}
            style={{ fontWeight: 600 }}
          >
            {isDemoCredentials ? 'Sign in as Jane Smith →' : 'Continue with email'}
          </motion.button>

          {/* OR CONTINUE WITH divider */}
          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#e2e8f0]" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-[#f0f6ff] px-3 text-[#94a3b8] text-xs">OR CONTINUE WITH</span>
            </div>
          </div>

          {/* SSO buttons */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {['Google', 'Microsoft'].map(provider => (
              <button
                key={provider}
                className="flex items-center justify-center gap-2 py-3 bg-white border border-[#e2e8f0] rounded-2xl text-[#374151] text-sm hover:bg-[#f8fafc] hover:border-[#cbd5e1] transition-all"
              >
                <div className="w-4 h-4 rounded-full bg-[#e2e8f0]" />
                {provider}
              </button>
            ))}
          </div>

          {/* Sign up link */}
          <p className="text-center text-[#64748b] text-sm">
            Don't have an account?{' '}
            <button
              onClick={onSignUpClick}
              className="text-[#3b82f6] hover:text-[#2563eb] transition-colors"
              style={{ fontWeight: 600 }}
            >
              Create one free
            </button>
          </p>

          {/* Demo hint — only for non-demo wrong attempts */}
          <AnimatePresence>
            {hasError && attemptCount >= 1 && !isDemoCredentials && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 text-center"
              >
                <p className="text-[#94a3b8] text-xs">
                  Demo mode: click "Continue" again to proceed to 2FA →
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}