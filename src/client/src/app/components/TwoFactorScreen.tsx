import { ArrowLeft, ShieldCheck, RefreshCw, Smartphone, Monitor, MapPin, Clock } from 'lucide-react';
import { useState, useRef, KeyboardEvent, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface TwoFactorScreenProps {
  onBack: () => void;
  onVerified: () => void;
}

const TOTAL_SECONDS = 60;
const RADIUS = 36;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const LOGIN_CONTEXT = {
  user: 'Jane Smith',
  email: 'jane.smith@secureauth.io',
  device: 'MacBook Pro 16"',
  browser: 'Chrome 121',
  os: 'macOS Sonoma',
  location: 'San Francisco, CA',
  ip: '104.28.112.47',
  time: 'Just now',
};

export function TwoFactorScreen({ onBack, onVerified }: TwoFactorScreenProps) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [hasError, setHasError] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TOTAL_SECONDS);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft]);

  const handleResend = () => {
    setIsResending(true);
    setTimeLeft(TOTAL_SECONDS);
    setCode(['', '', '', '', '', '']);
    setHasError(false);
    setTimeout(() => setIsResending(false), 1000);
    inputRefs.current[0]?.focus();
  };

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    setHasError(false);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pasted)) return;
    const newCode = [...code];
    pasted.split('').forEach((char, i) => { if (i < 6) newCode[i] = char; });
    setCode(newCode);
    setHasError(false);
    const nextEmpty = newCode.findIndex(v => !v);
    inputRefs.current[nextEmpty !== -1 ? nextEmpty : 5]?.focus();
  };

  const handleVerify = () => {
    const newCount = attemptCount + 1;
    setAttemptCount(newCount);
    if (newCount === 1) {
      setHasError(true);
      setCode(['', '', '', '', '', '']);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } else {
      setHasError(false);
      onVerified();
    }
  };

  const progress = timeLeft / TOTAL_SECONDS;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);
  const timerColor = timeLeft > 20 ? '#3b82f6' : timeLeft > 10 ? '#f59e0b' : '#ef4444';
  const isFilled = code.every(d => d !== '');

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f6ff] p-6">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-[#dbeafe]/40 blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[300px] h-[300px] rounded-full bg-[#ede9fe]/40 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-white w-full max-w-[480px] rounded-3xl shadow-[0_20px_60px_rgba(59,130,246,0.12)] relative z-10 overflow-hidden"
      >
        {/* Top accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-[#3b82f6] via-[#6366f1] to-[#8b5cf6]" />

        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-[#64748b] hover:text-[#1e293b] transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <div className="flex items-center gap-1.5 bg-[#f0fdf4] border border-[#bbf7d0] rounded-full px-3 py-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
              <span className="text-[#16a34a] text-xs" style={{ fontWeight: 600 }}>Secure Connection</span>
            </div>
          </div>

          {/* Login attempt context card */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-4 mb-6"
          >
            <p className="text-[#94a3b8] text-xs uppercase tracking-wider mb-3" style={{ fontWeight: 600 }}>
              Login Request
            </p>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#6366f1] flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm" style={{ fontWeight: 700 }}>JS</span>
              </div>
              <div>
                <p className="text-[#0f172a] text-sm" style={{ fontWeight: 600 }}>{LOGIN_CONTEXT.user}</p>
                <p className="text-[#94a3b8] text-xs">{LOGIN_CONTEXT.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="flex items-start gap-1.5">
                <Monitor className="w-3.5 h-3.5 text-[#94a3b8] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[#64748b] text-xs" style={{ fontWeight: 500 }}>{LOGIN_CONTEXT.device}</p>
                  <p className="text-[#94a3b8] text-xs">{LOGIN_CONTEXT.browser}</p>
                </div>
              </div>
              <div className="flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#94a3b8] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[#64748b] text-xs" style={{ fontWeight: 500 }}>{LOGIN_CONTEXT.location}</p>
                  <p className="text-[#94a3b8] text-xs">{LOGIN_CONTEXT.ip}</p>
                </div>
              </div>
              <div className="flex items-start gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#94a3b8] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[#64748b] text-xs" style={{ fontWeight: 500 }}>{LOGIN_CONTEXT.time}</p>
                  <p className="text-[#94a3b8] text-xs">{LOGIN_CONTEXT.os}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Icon + Title */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative mb-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#dbeafe] to-[#ede9fe] flex items-center justify-center shadow-[0_8px_24px_rgba(59,130,246,0.2)]">
                <ShieldCheck className="w-8 h-8 text-[#3b82f6]" strokeWidth={1.5} />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#22c55e] flex items-center justify-center border-2 border-white">
                <Smartphone className="w-2.5 h-2.5 text-white" />
              </div>
            </div>
            <h1 className="text-[#0f172a] text-center mb-1" style={{ fontSize: '1.375rem', fontWeight: 700 }}>
              Two-Factor Authentication
            </h1>
            <p className="text-[#64748b] text-sm text-center" style={{ lineHeight: '1.6' }}>
              Enter the 6-digit code from your <span style={{ fontWeight: 600 }}>Google Authenticator</span> app
            </p>
          </div>

          {/* OTP inputs */}
          <div className="mb-5" onPaste={handlePaste}>
            <div className="flex justify-center gap-2.5 mb-2">
              {code.map((digit, index) => (
                <motion.input
                  key={index}
                  ref={el => inputRefs.current[index] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleChange(index, e.target.value)}
                  onKeyDown={e => handleKeyDown(index, e)}
                  animate={hasError ? { x: [0, -6, 6, -4, 4, 0] } : {}}
                  transition={{ duration: 0.4 }}
                  className={`w-12 h-14 text-center rounded-2xl border-2 outline-none transition-all duration-200 text-[#0f172a] ${
                    hasError
                      ? 'border-[#fca5a5] bg-[#fff5f5] shadow-[0_0_0_3px_rgba(252,165,165,0.2)]'
                      : digit
                      ? 'border-[#3b82f6] bg-[#eff6ff] shadow-[0_0_0_3px_rgba(59,130,246,0.12)]'
                      : 'border-[#e2e8f0] bg-white hover:border-[#93c5fd]'
                  }`}
                  style={{ fontSize: '1.375rem', fontWeight: 700 }}
                />
              ))}
            </div>

            <AnimatePresence>
              {hasError && (
                <motion.div
                  initial={{ opacity: 0, y: -6, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -6, height: 0 }}
                  className="mt-3"
                >
                  <div className="flex items-center justify-center gap-2 bg-[#fef2f2] border border-[#fecaca] rounded-xl px-4 py-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#ef4444]" />
                    <p className="text-[#dc2626] text-sm">
                      Invalid or expired code.{' '}
                      <span className="underline cursor-pointer">Try again →</span>
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Timer + resend row */}
          <div className="flex items-center justify-between mb-6 px-1">
            <div className="flex items-center gap-2">
              <div className="relative w-10 h-10">
                <svg className="w-10 h-10 transform -rotate-90" viewBox="0 0 40 40">
                  <circle cx="20" cy="20" r="16" stroke="#f1f5f9" strokeWidth="3" fill="none" />
                  <circle
                    cx="20" cy="20" r="16"
                    stroke={timerColor}
                    strokeWidth="3"
                    fill="none"
                    strokeDasharray={2 * Math.PI * 16}
                    strokeDashoffset={2 * Math.PI * 16 * (1 - progress)}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span style={{ fontSize: '9px', fontWeight: 700, color: timerColor }}>{timeLeft}</span>
                </div>
              </div>
              <div>
                <p className="text-[#0f172a] text-xs" style={{ fontWeight: 600 }}>Code expires in {timeLeft}s</p>
                <p className="text-[#94a3b8] text-xs">New code every 30 seconds</p>
              </div>
            </div>
            <button
              onClick={handleResend}
              disabled={isResending}
              className="flex items-center gap-1.5 text-[#3b82f6] hover:text-[#2563eb] text-xs transition-colors disabled:opacity-50"
              style={{ fontWeight: 600 }}
            >
              <RefreshCw className={`w-3 h-3 ${isResending ? 'animate-spin' : ''}`} />
              {isResending ? 'Sending…' : 'Resend code'}
            </button>
          </div>

          {/* Verify button */}
          <motion.button
            onClick={handleVerify}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full py-3.5 rounded-2xl text-white transition-all duration-200 shadow-[0_4px_16px_rgba(59,130,246,0.3)] ${
              isFilled
                ? 'bg-[#3b82f6] hover:bg-[#2563eb]'
                : 'bg-[#93c5fd] cursor-not-allowed'
            }`}
            style={{ fontWeight: 600 }}
          >
            Verify & Continue
          </motion.button>

          <AnimatePresence>
            {hasError && attemptCount >= 1 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-[#94a3b8] text-xs mt-3"
              >
                Demo: click verify again to access the dashboard →
              </motion.p>
            )}
          </AnimatePresence>

          <div className="mt-4 text-center">
            <button className="text-[#94a3b8] text-xs hover:text-[#64748b] transition-colors">
              Use a backup code instead
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
