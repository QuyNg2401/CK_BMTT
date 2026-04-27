import { Copy, Check, Shield, AlertTriangle, Smartphone, QrCode, KeyRound, CheckCircle2, Download } from 'lucide-react';
import { useState, useRef, KeyboardEvent, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface EnableTwoFactorScreenProps {
  userId: number | null;
  username: string;
  onComplete: () => void;
}

const BACKUP_CODES = [
  'A3F2-9K1P', 'B7X4-2M8Q', 'C1R6-5N3T', 'D9W0-7L4U',
  'E4Y8-6H2V', 'F2Z5-0J9W', 'G6S3-4K7X', 'H8T1-3G5Y',
];

const COMPATIBLE_APPS = [
  { name: 'Google Authenticator', color: '#4285f4', abbr: 'GA' },
  { name: 'Authy', color: '#ec1c24', abbr: 'Au' },
  { name: '1Password', color: '#1e6ebe', abbr: '1P' },
  { name: 'Microsoft', color: '#00a4ef', abbr: 'MS' },
];

const steps = [
  { icon: Smartphone, title: 'Install an authenticator app', desc: 'Google Authenticator, Authy, or 1Password' },
  { icon: QrCode, title: 'Scan the QR code', desc: "Tap '+' → 'Scan a QR code' in your app" },
  { icon: KeyRound, title: 'Or enter the setup key', desc: 'Manually enter the key shown below' },
  { icon: CheckCircle2, title: 'Enter the verification code', desc: 'Type the 6-digit code to confirm setup' },
];

export function EnableTwoFactorScreen({ userId, username, onComplete }: EnableTwoFactorScreenProps) {
  const API_BASE_URL =
    (import.meta as { env?: { VITE_API_BASE_URL?: string } }).env?.VITE_API_BASE_URL ||
    'http://localhost:3000';

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [secretKey, setSecretKey] = useState('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [isLoadingQr, setIsLoadingQr] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const loadMfaSetup = async () => {
    if (!userId) {
      setQrError('Missing userId. Please login again before enabling 2FA.');
      return;
    }

    setIsLoadingQr(true);
    setQrError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/mfa/setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.message || 'Unable to generate QR code.');
      }

      if (typeof payload.secret !== 'string' || typeof payload.qrCodeDataUrl !== 'string') {
        throw new Error('Invalid response while generating 2FA setup.');
      }

      setSecretKey(payload.secret);
      setQrCodeDataUrl(payload.qrCodeDataUrl);
    } catch (error) {
      setQrError(error instanceof Error ? error.message : 'Unable to generate QR code.');
    } finally {
      setIsLoadingQr(false);
    }
  };

  useEffect(() => {
    loadMfaSetup();
  }, [userId]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
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
    const nextEmpty = newCode.findIndex(v => !v);
    inputRefs.current[nextEmpty !== -1 ? nextEmpty : 5]?.focus();
  };

  const handleCopyKey = () => {
    if (!secretKey) return;

    navigator.clipboard.writeText(secretKey.replace(/\s/g, ''));
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleCopyBackupCodes = () => {
    navigator.clipboard.writeText(BACKUP_CODES.join('\n'));
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 2000);
  };

  const handleEnable = () => {
    if (!isFilled || !secretKey || isLoadingQr) return;

    setIsSuccess(true);
    setTimeout(() => onComplete(), 1200);
  };

  const isFilled = code.every(d => d !== '');
  const formattedSecret = secretKey.replace(/(.{4})/g, '$1 ').trim();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f6ff] py-8 px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-5%] left-[30%] w-[350px] h-[350px] rounded-full bg-[#dbeafe]/30 blur-3xl" />
        <div className="absolute bottom-[-5%] right-[20%] w-[280px] h-[280px] rounded-full bg-[#ede9fe]/30 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white w-full max-w-[600px] rounded-3xl shadow-[0_20px_60px_rgba(59,130,246,0.12)] overflow-hidden relative z-10"
      >
        {/* Card header */}
        <div className="bg-gradient-to-r from-[#1e40af] to-[#3b82f6] px-8 py-5">
          <div className="flex items-center gap-3 mb-0.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" strokeWidth={2} />
            </div>
            <h1 className="text-white" style={{ fontSize: '1.125rem', fontWeight: 700 }}>
              Enable Two-Factor Authentication
            </h1>
          </div>
          <p className="text-blue-200 text-xs ml-11">
            Linked to <span className="text-white" style={{ fontWeight: 600 }}>{username || 'current-user'}</span> · SecureAuth Free Plan
          </p>
        </div>

        <div className="p-7">
          {/* Two-column setup area */}
          <div className="grid grid-cols-2 gap-7 mb-6">
            {/* Left: Steps */}
            <div className="space-y-3.5">
              <p className="text-[#64748b] text-xs uppercase tracking-wider" style={{ fontWeight: 600 }}>
                Setup steps
              </p>
              {steps.map(({ icon: Icon, title, desc }, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="flex items-start gap-3"
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-9 h-9 rounded-2xl bg-[#eff6ff] border border-[#bfdbfe] flex items-center justify-center">
                      <Icon className="w-4 h-4 text-[#3b82f6]" strokeWidth={2} />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#3b82f6] flex items-center justify-center border border-white">
                      <span className="text-white" style={{ fontSize: '8px', fontWeight: 700 }}>{i + 1}</span>
                    </div>
                    {i < steps.length - 1 && (
                      <div className="absolute left-1/2 top-full w-px h-2.5 bg-[#e2e8f0] -translate-x-1/2" />
                    )}
                  </div>
                  <div className="pt-1">
                    <p className="text-[#0f172a] text-sm" style={{ fontWeight: 600, lineHeight: 1.3 }}>{title}</p>
                    <p className="text-[#94a3b8] text-xs mt-0.5">{desc}</p>
                  </div>
                </motion.div>
              ))}

              {/* Compatible apps */}
              <div className="pt-1">
                <p className="text-[#94a3b8] text-xs mb-2">Works with:</p>
                <div className="flex flex-wrap gap-1.5">
                  {COMPATIBLE_APPS.map(({ name, color, abbr }) => (
                    <div
                      key={name}
                      className="flex items-center gap-1.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg px-2 py-1"
                    >
                      <div
                        className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: color }}
                      >
                        <span className="text-white" style={{ fontSize: '7px', fontWeight: 800 }}>{abbr}</span>
                      </div>
                      <span className="text-[#374151] text-xs">{name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: QR Code */}
            <div className="flex flex-col items-center">
              <p className="text-[#64748b] text-xs uppercase tracking-wider mb-3 self-start" style={{ fontWeight: 600 }}>
                Scan QR code
              </p>
              <div className="relative mb-3">
                <div className="w-[190px] h-[190px] rounded-2xl border-2 border-[#bfdbfe] bg-white p-3 shadow-[0_4px_20px_rgba(59,130,246,0.10)]">
                  {isLoadingQr ? (
                    <div className="h-full w-full rounded-xl bg-[#f8fafc] flex items-center justify-center text-[#64748b] text-xs">
                      Generating QR...
                    </div>
                  ) : qrCodeDataUrl ? (
                    <img
                      src={qrCodeDataUrl}
                      alt="MFA QR code"
                      className="h-full w-full rounded-xl object-contain"
                    />
                  ) : (
                    <div className="h-full w-full rounded-xl bg-[#fef2f2] border border-[#fecaca] flex items-center justify-center text-[#b91c1c] text-xs text-center px-2">
                      QR unavailable
                    </div>
                  )}
                </div>
                <div className="absolute top-1.5 left-1.5 w-4 h-4 border-l-2 border-t-2 border-[#3b82f6] rounded-tl" />
                <div className="absolute top-1.5 right-1.5 w-4 h-4 border-r-2 border-t-2 border-[#3b82f6] rounded-tr" />
                <div className="absolute bottom-1.5 left-1.5 w-4 h-4 border-l-2 border-b-2 border-[#3b82f6] rounded-bl" />
                <div className="absolute bottom-1.5 right-1.5 w-4 h-4 border-r-2 border-b-2 border-[#3b82f6] rounded-br" />
              </div>

              {qrError && (
                <div className="w-full mb-3 text-xs text-[#b91c1c] bg-[#fef2f2] border border-[#fecaca] rounded-lg px-3 py-2">
                  <p>{qrError}</p>
                  <button
                    onClick={loadMfaSetup}
                    className="mt-2 text-[#1d4ed8] hover:text-[#1e40af]"
                    style={{ fontWeight: 600 }}
                  >
                    Retry QR generation
                  </button>
                </div>
              )}

              {/* Setup key copy */}
              <div className="w-full">
                <p className="text-[#94a3b8] text-xs text-center mb-1.5">Manual setup key</p>
                <button
                  onClick={handleCopyKey}
                  disabled={!secretKey}
                  className="w-full flex items-center justify-between gap-2 bg-[#f8fafc] border border-[#e2e8f0] hover:border-[#93c5fd] hover:bg-[#eff6ff] rounded-xl px-3 py-2.5 transition-all group"
                >
                  <span className="text-[#1e293b] font-mono text-sm tracking-widest">{formattedSecret || '---- ---- ---- ----'}</span>
                  <span className={`flex items-center gap-1 text-xs flex-shrink-0 transition-colors ${copiedKey ? 'text-[#22c55e]' : 'text-[#94a3b8] group-hover:text-[#3b82f6]'}`}>
                    {copiedKey ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-[#f1f5f9] mb-5" />

          {/* OTP entry */}
          <div className="mb-5">
            <p className="text-[#374151] text-sm text-center mb-3" style={{ fontWeight: 600 }}>
              Enter the 6-digit code from your app to confirm
            </p>
            <div className="flex justify-center gap-2" onPaste={handlePaste}>
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={el => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleChange(index, e.target.value)}
                  onKeyDown={e => handleKeyDown(index, e)}
                  className={`w-11 text-center rounded-xl border-2 outline-none transition-all duration-200 ${digit
                      ? 'border-[#3b82f6] bg-[#eff6ff] text-[#1e40af]'
                      : 'border-[#e2e8f0] hover:border-[#93c5fd] bg-white text-[#0f172a]'
                    }`}
                  style={{ fontSize: '1.25rem', fontWeight: 700, height: '50px' }}
                />
              ))}
            </div>
          </div>

          {/* Enable button */}
          <motion.button
            onClick={handleEnable}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            disabled={!isFilled || !secretKey || isLoadingQr || isSuccess}
            className={`w-full py-3.5 rounded-2xl text-white transition-all mb-4 shadow-[0_4px_16px_rgba(59,130,246,0.28)] ${isFilled && secretKey && !isLoadingQr
                ? 'bg-[#3b82f6] hover:bg-[#2563eb]'
                : 'bg-[#93c5fd] cursor-not-allowed'
              }`}
            style={{ fontWeight: 600 }}
          >
            <AnimatePresence mode="wait">
              {isSuccess ? (
                <motion.span key="success" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center justify-center gap-2">
                  <Check className="w-5 h-5" /> 2FA Enabled Successfully!
                </motion.span>
              ) : (
                <motion.span key="default">Confirm & Enable 2FA</motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Warning */}
          <div className="flex items-start gap-3 bg-[#fffbeb] border border-[#fde68a] rounded-2xl px-4 py-3 mb-5">
            <AlertTriangle className="w-4 h-4 text-[#d97706] flex-shrink-0 mt-0.5" />
            <p className="text-[#b45309] text-xs" style={{ lineHeight: '1.6' }}>
              <span style={{ fontWeight: 600 }}>Important:</span> This QR code shows only once. Save your backup codes in a secure location before continuing.
            </p>
          </div>

          {/* Backup codes section */}
          <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl overflow-hidden">
            <button
              onClick={() => setShowBackupCodes(!showBackupCodes)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#f1f5f9] transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#eff6ff] border border-[#bfdbfe] flex items-center justify-center">
                  <Download className="w-3.5 h-3.5 text-[#3b82f6]" />
                </div>
                <div className="text-left">
                  <p className="text-[#0f172a] text-sm" style={{ fontWeight: 600 }}>Backup Recovery Codes</p>
                  <p className="text-[#94a3b8] text-xs">8 single-use codes · Store in a safe place</p>
                </div>
              </div>
              <span className="text-[#3b82f6] text-xs" style={{ fontWeight: 600 }}>
                {showBackupCodes ? 'Hide ↑' : 'View ↓'}
              </span>
            </button>

            <AnimatePresence>
              {showBackupCodes && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 border-t border-[#e2e8f0]">
                    <div className="grid grid-cols-4 gap-2 mt-3">
                      {BACKUP_CODES.map((c, i) => (
                        <div key={i} className="bg-white border border-[#e2e8f0] rounded-xl px-2 py-2 text-center">
                          <span className="text-[#1e293b] font-mono text-xs" style={{ fontWeight: 600 }}>{c}</span>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={handleCopyBackupCodes}
                      className="w-full flex items-center justify-center gap-2 mt-3 py-2.5 bg-white border border-[#e2e8f0] hover:border-[#93c5fd] hover:bg-[#eff6ff] rounded-xl transition-all text-sm"
                    >
                      {copiedCodes
                        ? <><Check className="w-3.5 h-3.5 text-[#22c55e]" /><span className="text-[#22c55e]" style={{ fontWeight: 600 }}>Copied to clipboard</span></>
                        : <><Copy className="w-3.5 h-3.5 text-[#64748b]" /><span className="text-[#64748b]" style={{ fontWeight: 500 }}>Copy all codes</span></>
                      }
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
