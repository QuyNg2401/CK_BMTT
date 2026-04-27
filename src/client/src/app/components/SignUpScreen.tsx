import { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, User, Shield, ArrowLeft, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SignUpScreenProps {
  onSignUp: () => void;
  onLoginClick: () => void;
}

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: '8+ characters', pass: password.length >= 8 },
    { label: 'Uppercase letter', pass: /[A-Z]/.test(password) },
    { label: 'Number', pass: /\d/.test(password) },
    { label: 'Special character', pass: /[^a-zA-Z0-9]/.test(password) },
  ];
  const score = checks.filter(c => c.pass).length;
  const colors = ['#e2e8f0', '#ef4444', '#f59e0b', '#3b82f6', '#22c55e'];
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];

  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1.5">
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{ backgroundColor: i <= score ? colors[score] : '#e2e8f0' }}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <p className="text-xs" style={{ color: colors[score] }}>
          {labels[score]}
        </p>
        <div className="flex gap-2">
          {checks.map(({ label, pass }) => (
            <span
              key={label}
              className="text-xs flex items-center gap-1"
              style={{ color: pass ? '#22c55e' : '#94a3b8' }}
            >
              <CheckCircle className="w-2.5 h-2.5" />
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SignUpScreen({ onSignUp, onLoginClick }: SignUpScreenProps) {
  const API_BASE_URL =
    (import.meta as { env?: { VITE_API_BASE_URL?: string } }).env?.VITE_API_BASE_URL ||
    'http://localhost:3000';

  const [name, setName] = useState('Jane Smith');
  const [email, setEmail] = useState('jane.smith@secureauth.io');
  const [password, setPassword] = useState('Secure@2024!');
  const [confirmPassword, setConfirmPassword] = useState('Secure@2024!');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      setApiError('Please fill in all required fields.');
      setApiSuccess(null);
      return;
    }

    if (password !== confirmPassword) {
      setApiError('Passwords do not match.');
      setApiSuccess(null);
      return;
    }

    if (!agreed) {
      setApiError('Please accept Terms of Service and Privacy Policy.');
      setApiSuccess(null);
      return;
    }

    setIsSubmitting(true);
    setApiError(null);
    setApiSuccess(null);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: email.trim(),
          password,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.message || 'Unable to create account.');
      }

      setApiSuccess('Account created successfully. Redirecting to login...');
      setTimeout(() => onSignUp(), 600);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Unable to create account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#f0f6ff]">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden bg-gradient-to-br from-[#4338ca] via-[#6366f1] to-[#818cf8] flex-col justify-between p-12">
        <div className="absolute top-[-80px] right-[-80px] w-[320px] h-[320px] rounded-full bg-white/5" />
        <div className="absolute bottom-[-60px] left-[-60px] w-[240px] h-[240px] rounded-full bg-white/5" />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
              <Shield className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-white text-xl" style={{ fontWeight: 600 }}>SecureAuth</span>
          </div>
          <div className="h-px bg-white/20 mb-10" />
          <h2 className="text-white mb-4" style={{ fontSize: '2rem', fontWeight: 700, lineHeight: '1.2' }}>
            Join millions<br />staying secure.
          </h2>
          <p className="text-indigo-100 text-base" style={{ lineHeight: '1.7' }}>
            Set up two-factor authentication in under 2 minutes and protect your account forever.
          </p>
        </div>

        <div className="relative z-10 space-y-4">
          {[
            { step: '01', title: 'Create your account', desc: 'Quick email & password setup' },
            { step: '02', title: 'Scan the QR code', desc: 'Use any authenticator app' },
            { step: '03', title: "You're protected", desc: 'Instant 2FA coverage' },
          ].map(({ step, title, desc }, i) => (
            <motion.div
              key={step}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="flex items-start gap-4"
            >
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center border border-white/20 flex-shrink-0 mt-0.5">
                <span className="text-white/70 text-xs" style={{ fontWeight: 700 }}>{step}</span>
              </div>
              <div>
                <p className="text-white text-sm" style={{ fontWeight: 600 }}>{title}</p>
                <p className="text-indigo-200 text-xs">{desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="relative z-10 bg-white/10 rounded-2xl p-4 border border-white/20 backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-300 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-white text-sm" style={{ fontWeight: 600 }}>Free forever plan</p>
              <p className="text-indigo-200 text-xs mt-0.5">No credit card required • Unlimited logins</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-[420px]">
          <button
            onClick={onLoginClick}
            className="flex items-center gap-1.5 text-[#64748b] hover:text-[#1e293b] transition-colors mb-8 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </button>

          <div className="mb-8">
            <h1 className="text-[#0f172a] mb-2" style={{ fontSize: '1.75rem', fontWeight: 700, lineHeight: '1.2' }}>
              Create your account
            </h1>
            <p className="text-[#64748b] text-sm">Start your free account — no credit card needed</p>
          </div>

          <div className="space-y-4 mb-6">
            {/* Name */}
            <div>
              <label className="block text-[#374151] text-sm mb-1.5">Full name</label>
              <div
                className={`relative flex items-center rounded-2xl border transition-all duration-200 ${focusedField === 'name'
                    ? 'border-[#6366f1] shadow-[0_0_0_3px_rgba(99,102,241,0.15)]'
                    : 'border-[#e2e8f0]'
                  } bg-white`}
              >
                <User className="absolute left-4 w-4 h-4 text-[#94a3b8]" />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Jane Smith"
                  className="w-full pl-11 pr-4 py-3.5 bg-transparent outline-none text-[#0f172a] placeholder-[#cbd5e1] rounded-2xl"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-[#374151] text-sm mb-1.5">Email address</label>
              <div
                className={`relative flex items-center rounded-2xl border transition-all duration-200 ${focusedField === 'email'
                    ? 'border-[#6366f1] shadow-[0_0_0_3px_rgba(99,102,241,0.15)]'
                    : 'border-[#e2e8f0]'
                  } bg-white`}
              >
                <Mail className="absolute left-4 w-4 h-4 text-[#94a3b8]" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="you@company.com"
                  className="w-full pl-11 pr-4 py-3.5 bg-transparent outline-none text-[#0f172a] placeholder-[#cbd5e1] rounded-2xl"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[#374151] text-sm mb-1.5">Password</label>
              <div
                className={`relative flex items-center rounded-2xl border transition-all duration-200 ${focusedField === 'password'
                    ? 'border-[#6366f1] shadow-[0_0_0_3px_rgba(99,102,241,0.15)]'
                    : 'border-[#e2e8f0]'
                  } bg-white`}
              >
                <Lock className="absolute left-4 w-4 h-4 text-[#94a3b8]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Create a strong password"
                  className="w-full pl-11 pr-12 py-3.5 bg-transparent outline-none text-[#0f172a] placeholder-[#cbd5e1] rounded-2xl"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-[#94a3b8] hover:text-[#64748b] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <PasswordStrength password={password} />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-[#374151] text-sm mb-1.5">Confirm password</label>
              <div
                className={`relative flex items-center rounded-2xl border transition-all duration-200 ${confirmPassword && confirmPassword !== password
                    ? 'border-[#fca5a5] shadow-[0_0_0_3px_rgba(252,165,165,0.2)]'
                    : confirmPassword && confirmPassword === password
                      ? 'border-[#86efac] shadow-[0_0_0_3px_rgba(134,239,172,0.2)]'
                      : focusedField === 'confirm'
                        ? 'border-[#6366f1] shadow-[0_0_0_3px_rgba(99,102,241,0.15)]'
                        : 'border-[#e2e8f0]'
                  } bg-white`}
              >
                <Lock className="absolute left-4 w-4 h-4 text-[#94a3b8]" />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  onFocus={() => setFocusedField('confirm')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Repeat your password"
                  className="w-full pl-11 pr-12 py-3.5 bg-transparent outline-none text-[#0f172a] placeholder-[#cbd5e1] rounded-2xl"
                />
                <button
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-4 text-[#94a3b8] hover:text-[#64748b] transition-colors"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <AnimatePresence>
                {confirmPassword && confirmPassword !== password && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="text-[#ef4444] text-xs mt-1.5 ml-1"
                  >
                    Passwords don't match
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Terms */}
          <div className="flex items-start gap-2.5 mb-6 cursor-pointer" onClick={() => setAgreed(!agreed)}>
            <div
              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${agreed ? 'bg-[#6366f1] border-[#6366f1]' : 'border-[#e2e8f0]'
                }`}
            >
              {agreed && <CheckCircle className="w-3 h-3 text-white" />}
            </div>
            <p className="text-[#64748b] text-sm">
              I agree to the{' '}
              <span className="text-[#6366f1] cursor-pointer hover:underline">Terms of Service</span>
              {' '}and{' '}
              <span className="text-[#6366f1] cursor-pointer hover:underline">Privacy Policy</span>
            </p>
          </div>

          <motion.button
            onClick={handleSubmit}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            disabled={isSubmitting}
            className="w-full py-3.5 bg-[#6366f1] text-white rounded-2xl hover:bg-[#4f46e5] transition-colors mb-5 shadow-[0_4px_16px_rgba(99,102,241,0.35)]"
            style={{ fontWeight: 600 }}
          >
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </motion.button>

          <AnimatePresence>
            {apiError && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="text-[#dc2626] text-sm text-center mb-4"
              >
                {apiError}
              </motion.p>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {apiSuccess && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="text-[#16a34a] text-sm text-center mb-4"
              >
                {apiSuccess}
              </motion.p>
            )}
          </AnimatePresence>

          <p className="text-center text-[#64748b] text-sm">
            Already have an account?{' '}
            <button
              onClick={onLoginClick}
              className="text-[#6366f1] hover:text-[#4f46e5] transition-colors"
              style={{ fontWeight: 600 }}
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}