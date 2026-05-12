import { ArrowLeft, ShieldCheck, RefreshCw, Smartphone, Monitor, MapPin, Clock } from 'lucide-react';
import { useState, useRef, KeyboardEvent, useEffect, ClipboardEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface TwoFactorScreenProps {
  onBack: () => void;
  onVerified: (session: { userId: number; username: string; accessToken: string }) => void;
  userId: number | null;
  username: string;
}

const getInitials = (value: string) => {
  const base = value.split('@')[0].trim();
  if (!base) return 'U';
  const parts = base.split(/[._\-\s]+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

export function TwoFactorScreen({ onBack, onVerified, userId, username }: TwoFactorScreenProps) {
  console.log('[TwoFactorScreen] Mounted with props:', { userId, username });

  const API_BASE_URL =
    (import.meta as { env?: { VITE_API_BASE_URL?: string } }).env?.VITE_API_BASE_URL ||
    'http://localhost:3000';

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [hasError, setHasError] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [retryUntil, setRetryUntil] = useState<number | null>(null);
  const [retrySecondsLeft, setRetrySecondsLeft] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!retryUntil) {
      setRetrySecondsLeft(0);
      return;
    }
    const tick = () => {
      const secondsLeft = Math.max(0, Math.ceil((retryUntil - Date.now()) / 1000));
      setRetrySecondsLeft(secondsLeft);
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [retryUntil]);

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleResend = () => {
    setIsResending(true);
    setCode(['', '', '', '', '', '']);
    setHasError(false);
    setApiError(null);
    setRemainingAttempts(null);
    setRetryUntil(null);
    setTimeout(() => setIsResending(false), 1000);
    inputRefs.current[0]?.focus();
  };

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    setHasError(false);
    setApiError(null);
    setRemainingAttempts(null);
    setRetryUntil(null);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pasted)) return;
    const newCode = [...code];
    pasted.split('').forEach((char, i) => { if (i < 6) newCode[i] = char; });
    setCode(newCode);
    setHasError(false);
    setApiError(null);
    setRemainingAttempts(null);
    setRetryUntil(null);
    const nextEmpty = newCode.findIndex(v => !v);
    inputRefs.current[nextEmpty !== -1 ? nextEmpty : 5]?.focus();
  };

  const handleVerify = async () => {
    if (!userId) {
      setHasError(true);
      setApiError('Missing login session. Please sign in again.');
      return;
    }

    if (retrySecondsLeft > 0) {
      setHasError(true);
      setApiError(`Too many attempts. Try again in ${formatCountdown(retrySecondsLeft)}.`);
      return;
    }

    const token = code.join('');
    if (token.length !== 6) {
      setHasError(true);
      setApiError('Please enter the full 6-digit code.');
      return;
    }

    setIsSubmitting(true);
    setHasError(false);
    setApiError(null);
    setRemainingAttempts(null);

    try {
      const payload_body = { userId, token };
      console.log('[TwoFactorScreen] Submitting OTP:', { userId, token: '***' });

      const response = await fetch(`${API_BASE_URL}/auth/verify-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload_body),
      });

      const payload = await response.json().catch(() => ({}));
      console.log('[TwoFactorScreen] Verify response:', { status: response.status, payload });

      if (!response.ok) {
        const attemptsLeft = typeof payload?.remainingAttempts === 'number' ? payload.remainingAttempts : null;
        const retryAfter = typeof payload?.retryAfterSeconds === 'number' ? payload.retryAfterSeconds : 0;
        if (attemptsLeft !== null) {
          setRemainingAttempts(attemptsLeft);
        }
        if (retryAfter > 0) {
          setRetryUntil(Date.now() + retryAfter * 1000);
        }
        throw new Error(payload?.message || 'Unable to verify code.');
      }

      const result = payload?.data ?? payload;
      if (
        !result ||
        typeof result.userId !== 'number' ||
        typeof result.username !== 'string' ||
        typeof result.accessToken !== 'string'
      ) {
        throw new Error('Invalid response from server.');
      }

      onVerified({
        userId: result.userId,
        username: result.username,
        accessToken: result.accessToken,
      });
    } catch (error) {
      setHasError(true);
      setApiError(error instanceof Error ? error.message : 'Unable to verify code.');
      setCode(['', '', '', '', '', '']);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFilled = code.every(d => d !== '');
  const isLocked = retrySecondsLeft > 0;
  const displayName = username?.split('@')[0] || 'User';
  const initials = getInitials(username || 'User');

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
                <span className="text-white text-sm" style={{ fontWeight: 700 }}>{initials}</span>
              </div>
              <div>
                <p className="text-[#0f172a] text-sm" style={{ fontWeight: 600 }}>{displayName}</p>
                <p className="text-[#94a3b8] text-xs">{username}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="flex items-start gap-1.5">
                <Monitor className="w-3.5 h-3.5 text-[#94a3b8] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[#64748b] text-xs" style={{ fontWeight: 500 }}>Desktop device</p>
                  <p className="text-[#94a3b8] text-xs">Chrome</p>
                </div>
              </div>
              <div className="flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#94a3b8] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[#64748b] text-xs" style={{ fontWeight: 500 }}>Current location</p>
                  <p className="text-[#94a3b8] text-xs">IP hidden</p>
                </div>
              </div>
              <div className="flex items-start gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#94a3b8] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[#64748b] text-xs" style={{ fontWeight: 500 }}>Just now</p>
                  <p className="text-[#94a3b8] text-xs">Session active</p>
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
                  className={`w-12 h-14 text-center rounded-2xl border-2 outline-none transition-all duration-200 text-[#0f172a] ${hasError
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
                      {apiError || 'Invalid or expired code.'}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            {typeof remainingAttempts === 'number' && !isLocked && (
              <div className="mt-2 text-center text-xs text-[#b45309]">
                Remaining attempts: {remainingAttempts}
              </div>
            )}
            {isLocked && (
              <div className="mt-2 text-center text-xs text-[#b45309]">
                Try again in {formatCountdown(retrySecondsLeft)}
              </div>
            )}
          </div>

          <div className="flex justify-end mb-6 px-1">
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
            disabled={!isFilled || isSubmitting || isLocked}
            className={`w-full py-3.5 rounded-2xl text-white transition-all duration-200 shadow-[0_4px_16px_rgba(59,130,246,0.3)] ${isFilled && !isSubmitting && !isLocked
              ? 'bg-[#3b82f6] hover:bg-[#2563eb]'
              : 'bg-[#93c5fd] cursor-not-allowed'
              }`}
            style={{ fontWeight: 600 }}
          >
            {isSubmitting ? 'Verifying…' : isLocked ? `Try again in ${formatCountdown(retrySecondsLeft)}` : 'Verify & Continue'}
          </motion.button>

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
