import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { otpApi } from '../lib/api';
import { auth, RecaptchaVerifier, signInWithPhoneNumber } from '../lib/firebase';
import { Shield, Eye, EyeOff, UserPlus, ArrowLeft, User, Mail, Phone, Lock, Heart, Sparkles, Smartphone, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { ConfirmationResult } from 'firebase/auth';

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 1, label: 'Weak', color: '#ef4444' };
  if (score <= 2) return { score: 2, label: 'Fair', color: '#f59e0b' };
  if (score <= 3) return { score: 3, label: 'Good', color: '#3b82f6' };
  return { score: 4, label: 'Strong', color: '#10b981' };
}

type VerifyMethod = 'phone' | 'email';
type VerifyStep = 'idle' | 'sending' | 'sent' | 'verifying' | 'verified';

export default function RegisterPage() {
  const { register } = useAuth();
  const { success: toastSuccess } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);

  // ─── Verification State ─────────────────────────────────
  const [verifyMethod, setVerifyMethod] = useState<VerifyMethod>('phone');
  const [verifyStep, setVerifyStep] = useState<VerifyStep>('idle');
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [smsQuotaExceeded, setSmsQuotaExceeded] = useState(false);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Firebase
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const recaptchaVerifierRef = useRef<any>(null);

  const strength = useMemo(() => getPasswordStrength(form.password), [form.password]);

  // ─── Countdown Timer ────────────────────────────────────
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // ─── OTP Input Handlers ─────────────────────────────────
  const handleOtpChange = useCallback((index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otpCode];
    newOtp[index] = value.slice(-1);
    setOtpCode(newOtp);
    setOtpError('');
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  }, [otpCode]);

  const handleOtpKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  }, [otpCode]);

  const handleOtpPaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData.length === 6) {
      setOtpCode(pastedData.split(''));
      otpInputRefs.current[5]?.focus();
    }
  }, []);

  // ─── Send Phone OTP (Firebase) ──────────────────────────
  const sendPhoneOTP = async () => {
    if (!form.phone) {
      setOtpError('Please enter your phone number first');
      return;
    }
    setOtpError('');
    setVerifyStep('sending');

    try {
      // Format phone to E.164
      let phoneNumber = form.phone.replace(/\s/g, '');
      if (!phoneNumber.startsWith('+')) {
        phoneNumber = `+91${phoneNumber}`;
      }

      // Create invisible reCAPTCHA
      if (!recaptchaVerifierRef.current && recaptchaRef.current) {
        recaptchaVerifierRef.current = new RecaptchaVerifier(auth, recaptchaRef.current, {
          size: 'invisible',
        });
      }

      const result = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifierRef.current);
      setConfirmationResult(result);
      setVerifyStep('sent');
      setCountdown(60);
    } catch (err: any) {
      console.error('Firebase Phone Auth error:', err);

      // Check for quota exceeded
      if (
        err.code === 'auth/quota-exceeded' ||
        err.code === 'auth/too-many-requests' ||
        err.message?.includes('quota') ||
        err.message?.includes('QUOTA_EXCEEDED')
      ) {
        setSmsQuotaExceeded(true);
        setVerifyMethod('email');
        setOtpError('');
        setVerifyStep('idle');
        return;
      }

      setOtpError(err.message || 'Failed to send SMS. Try email verification.');
      setVerifyStep('idle');
    }
  };

  // ─── Send Email OTP (Backend) ───────────────────────────
  const sendEmailOTP = async () => {
    if (!form.email) {
      setOtpError('Please enter your email address first');
      return;
    }
    setOtpError('');
    setVerifyStep('sending');

    try {
      const res = await otpApi.sendEmailOTP(form.email);
      setVerifyStep('sent');
      setCountdown(60);
    } catch (err: any) {
      const detail = err.response?.data?.detail || 'Failed to send email OTP';
      setOtpError(detail);
      setVerifyStep('idle');
    }
  };

  // ─── Verify OTP ─────────────────────────────────────────
  const verifyOTP = async () => {
    const code = otpCode.join('');
    if (code.length !== 6) {
      setOtpError('Please enter all 6 digits');
      return;
    }

    setOtpError('');
    setVerifyStep('verifying');

    try {
      if (verifyMethod === 'phone') {
        if (!confirmationResult) {
          setOtpError('No OTP session found. Please resend.');
          setVerifyStep('sent');
          return;
        }
        await confirmationResult.confirm(code);
      } else {
        await otpApi.verifyEmailOTP(form.email, code);
      }

      setVerifyStep('verified');
    } catch (err: any) {
      const detail =
        verifyMethod === 'phone'
          ? 'Invalid OTP code. Please try again.'
          : err.response?.data?.detail || 'Invalid OTP code';
      setOtpError(detail);
      setVerifyStep('sent');
    }
  };

  // ─── Handle Registration ────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (!/\d/.test(form.password)) {
      setError('Password must contain at least one digit');
      return;
    }
    if (!/[a-zA-Z]/.test(form.password)) {
      setError('Password must contain at least one letter');
      return;
    }
    if (!agreedTerms) {
      setError('Please agree to the terms of service');
      return;
    }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.phone);
      toastSuccess('Account created!', 'Welcome to CiviSense. Start filing your first complaint.');
      navigate('/dashboard');
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.response?.data?.error || 'Registration failed';
      if (typeof detail === 'object' && Array.isArray(detail)) {
        setError(detail.map((d: any) => d.msg || d.message || JSON.stringify(d)).join(', '));
      } else {
        setError(String(detail));
      }
    } finally {
      setLoading(false);
    }
  };

  const isVerified = verifyStep === 'verified';

  return (
    <div className="min-h-screen flex flex-col">
    <div className="flex-1 flex noise-overlay">
      {/* ─── Left Panel — Branding ──────────────────────────── */}
      <div className="hidden lg:flex lg:w-[55%] relative bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-32 right-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-[120px] animate-float" />
          <div className="absolute bottom-20 left-16 w-64 h-64 bg-violet-400/8 rounded-full blur-[100px] animate-float-delayed" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-sky-500/5 rounded-full blur-[150px] animate-breathe" />
          <div className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
              backgroundSize: '40px 40px',
            }}
          />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-white/8 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/8 group-hover:bg-white/12 transition-colors">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-white tracking-tight font-display">CiviSense</h1>
              <p className="text-[10px] text-indigo-300/40 font-semibold tracking-[0.2em] uppercase mt-0.5">AI Platform</p>
            </div>
          </Link>

          <div className="max-w-md">
            <h2 className="text-4xl font-extrabold text-white leading-tight font-display">
              Join as a
              <br />
              <span className="bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">
                Digital Citizen
              </span>
            </h2>
            <p className="text-indigo-200/40 mt-5 text-base leading-relaxed">
              Register to submit and track civic complaints with AI-powered prioritization and real-time status updates.
            </p>
          </div>

          <div className="flex gap-10">
            {[
              { value: '✓', label: 'Track Status' },
              { value: '✓', label: 'AI Priority' },
              { value: '✓', label: 'Real-time' },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-2.5">
                <span className="text-emerald-400 font-bold text-sm">{s.value}</span>
                <p className="text-xs text-indigo-300/40 uppercase tracking-wider font-semibold">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Right Panel — Form ─────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 bg-civic-50 relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-[20%] right-[10%] w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="w-full max-w-[420px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-civic-800 tracking-tight font-display">CiviSense</h1>
              <p className="text-[10px] text-civic-400 font-semibold tracking-[0.2em] uppercase">AI Platform</p>
            </div>
          </div>

          {/* Back link */}
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors mb-5 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" /> Back to Sign In
          </Link>

          <div className="mb-6">
            <h2 className="text-2xl font-extrabold text-civic-900 tracking-tight font-display">Create account</h2>
            <p className="text-civic-400 mt-1 text-sm">Register as a citizen to start filing complaints</p>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50/80 border border-red-100 rounded-xl text-sm text-red-600 animate-scale-in backdrop-blur-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="label">Full Name</label>
              <div className="relative group">
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Your full name"
                  className="input pl-11"
                  required
                />
                <User className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none group-focus-within:text-indigo-500 transition-colors" />
              </div>
            </div>
            <div>
              <label className="label">Email Address</label>
              <div className="relative group">
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                  className="input pl-11"
                  required
                  disabled={isVerified && verifyMethod === 'email'}
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none group-focus-within:text-indigo-500 transition-colors" />
                {isVerified && verifyMethod === 'email' && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 absolute right-4 top-1/2 -translate-y-1/2" />
                )}
              </div>
            </div>
            <div>
              <label className="label">Phone Number</label>
              <div className="relative group">
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+91 9876543210"
                  className="input pl-11"
                  disabled={isVerified && verifyMethod === 'phone'}
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none group-focus-within:text-indigo-500 transition-colors" />
                {isVerified && verifyMethod === 'phone' && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 absolute right-4 top-1/2 -translate-y-1/2" />
                )}
              </div>
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Min 8 characters (letter + digit)"
                  className="input pl-11 pr-11"
                  required
                  minLength={8}
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none group-focus-within:text-indigo-500 transition-colors" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-civic-400 hover:text-civic-600 transition-colors p-1 rounded-lg hover:bg-slate-100"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Meter */}
              {form.password.length > 0 && (
                <div className="mt-2 animate-scale-in">
                  <div className="flex gap-1.5 mb-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className="strength-bar flex-1"
                        style={{
                          background: level <= strength.score ? strength.color : 'rgba(226, 232, 240, 0.5)',
                        }}
                      />
                    ))}
                  </div>
                  <p className="text-[11px] font-semibold" style={{ color: strength.color }}>
                    {strength.label}
                  </p>
                </div>
              )}
            </div>

            {/* ─── Identity Verification Section ─────────────── */}
            {!isVerified && (
              <div className="rounded-xl border border-slate-200 bg-white/60 backdrop-blur-sm overflow-hidden">
                {/* SMS Quota Exceeded Warning */}
                {smsQuotaExceeded && (
                  <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-100 flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                    <p className="text-xs text-amber-700 font-medium">
                      Daily SMS limit reached. Please verify with email instead.
                    </p>
                  </div>
                )}

                {/* Verification Tabs */}
                <div className="flex border-b border-slate-100">
                  <button
                    type="button"
                    onClick={() => { if (!smsQuotaExceeded) { setVerifyMethod('phone'); setVerifyStep('idle'); setOtpCode(['','','','','','']); setOtpError(''); } }}
                    disabled={smsQuotaExceeded}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold transition-all ${
                      verifyMethod === 'phone' && !smsQuotaExceeded
                        ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                        : smsQuotaExceeded
                        ? 'text-slate-300 cursor-not-allowed line-through'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" /> Phone (SMS)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setVerifyMethod('email'); setVerifyStep('idle'); setOtpCode(['','','','','','']); setOtpError(''); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold transition-all ${
                      verifyMethod === 'email'
                        ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" /> Email
                  </button>
                </div>

                {/* Verification Content */}
                <div className="p-4">
                  {verifyStep === 'idle' && (
                    <button
                      type="button"
                      onClick={verifyMethod === 'phone' ? sendPhoneOTP : sendEmailOTP}
                      disabled={verifyMethod === 'phone' ? !form.phone : !form.email}
                      className="w-full py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
                    >
                      {verifyMethod === 'phone' ? '📱 Send SMS OTP' : '✉️ Send Email OTP'}
                    </button>
                  )}

                  {verifyStep === 'sending' && (
                    <div className="flex items-center justify-center gap-2 py-3">
                      <div className="w-4 h-4 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                      <span className="text-sm text-slate-500">Sending verification code...</span>
                    </div>
                  )}

                  {(verifyStep === 'sent' || verifyStep === 'verifying') && (
                    <div className="space-y-3">
                      <p className="text-xs text-slate-500 text-center">
                        {verifyMethod === 'phone'
                          ? `Code sent to ${form.phone}`
                          : `Code sent to ${form.email}`
                        }
                      </p>

                      {/* OTP Input Boxes */}
                      <div className="flex justify-center gap-2">
                        {otpCode.map((digit, index) => (
                          <input
                            key={index}
                            ref={(el) => { otpInputRefs.current[index] = el; }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpChange(index, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                            onPaste={index === 0 ? handleOtpPaste : undefined}
                            className={`w-10 h-12 text-center text-lg font-bold rounded-lg border-2 transition-all focus:outline-none focus:ring-0 ${
                              otpError
                                ? 'border-red-300 bg-red-50 text-red-600'
                                : digit
                                ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                                : 'border-slate-200 bg-white text-slate-800 focus:border-indigo-400'
                            }`}
                          />
                        ))}
                      </div>

                      {otpError && (
                        <p className="text-xs text-red-500 text-center font-medium">{otpError}</p>
                      )}

                      <button
                        type="button"
                        onClick={verifyOTP}
                        disabled={verifyStep === 'verifying' || otpCode.join('').length !== 6}
                        className="w-full py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      >
                        {verifyStep === 'verifying' ? (
                          <span className="flex items-center justify-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Verifying...
                          </span>
                        ) : 'Verify Code'}
                      </button>

                      {/* Resend */}
                      <div className="text-center">
                        {countdown > 0 ? (
                          <p className="text-xs text-slate-400">
                            Resend in <span className="font-bold text-indigo-500">{countdown}s</span>
                          </p>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setOtpCode(['','','','','','']);
                              setOtpError('');
                              verifyMethod === 'phone' ? sendPhoneOTP() : sendEmailOTP();
                            }}
                            className="text-xs text-indigo-600 font-semibold hover:text-indigo-700"
                          >
                            Resend Code
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Verified Badge */}
            {isVerified && (
              <div className="flex items-center gap-2.5 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl animate-scale-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <div>
                  <p className="text-sm font-semibold text-emerald-700">Identity Verified</p>
                  <p className="text-xs text-emerald-500">
                    {verifyMethod === 'phone' ? `Phone: ${form.phone}` : `Email: ${form.email}`} verified successfully
                  </p>
                </div>
              </div>
            )}

            {/* Terms */}
            <label className="flex items-start gap-2.5 cursor-pointer group pt-0.5">
              <input
                type="checkbox"
                checked={agreedTerms}
                onChange={(e) => setAgreedTerms(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0 mt-0.5"
              />
              <span className="text-[12px] text-slate-400 leading-relaxed">
                I agree to the{' '}
                <span className="text-indigo-600 font-semibold hover:text-indigo-700 cursor-pointer">Terms of Service</span>
                {' '}and{' '}
                <span className="text-indigo-600 font-semibold hover:text-indigo-700 cursor-pointer">Privacy Policy</span>
              </span>
            </label>

            <button
              type="submit"
              disabled={loading || !agreedTerms}
              className="btn-primary w-full justify-center py-3 shadow-primary mt-1 group disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Create Account <UserPlus className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-civic-400">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 font-bold hover:text-primary-700 transition-colors">
              Sign in
            </Link>
          </p>
        </div>

        {/* Invisible reCAPTCHA container */}
        <div ref={recaptchaRef} id="recaptcha-container" />
      </div>
    </div>

    {/* Footer */}
    <footer className="py-4 px-4 sm:px-6 flex items-center justify-center" style={{ background: 'rgba(248,250,252,0.92)', borderTop: '1px solid rgba(226,232,240,0.6)' }}>
      <div
        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[12px] font-medium"
        style={{
          background: 'rgba(255, 255, 255, 0.9)',
          border: '1px solid rgba(129, 140, 248, 0.3)',
          boxShadow: '0 2px 8px rgba(79, 70, 229, 0.05)',
        }}
      >
        <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
        <span className="text-slate-500">Engineered by</span>
        <strong
          className="font-black text-[13px]"
          style={{
            background: 'linear-gradient(135deg, #1E1B4B 0%, #4338CA 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Jaya Krushna
        </strong>
        <span className="text-indigo-400 font-bold">&</span>
        <strong
          className="font-black text-[13px]"
          style={{
            background: 'linear-gradient(135deg, #701A75 0%, #BE185D 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Keerthi
        </strong>
        <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 animate-pulse ml-0.5" />
      </div>
    </footer>
    </div>
  );
}
