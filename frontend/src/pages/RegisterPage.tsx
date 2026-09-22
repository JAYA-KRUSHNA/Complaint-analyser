import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Shield, Eye, EyeOff, UserPlus, ArrowLeft, User, Mail, Phone, Lock, Heart, Sparkles } from 'lucide-react';

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 1, label: 'Weak', color: '#ef4444' };
  if (score <= 2) return { score: 2, label: 'Fair', color: '#f59e0b' };
  if (score <= 3) return { score: 3, label: 'Good', color: '#3b82f6' };
  return { score: 4, label: 'Strong', color: '#10b981' };
}

export default function RegisterPage() {
  const { register } = useAuth();
  const { success: toastSuccess } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);

  const strength = useMemo(() => getPasswordStrength(form.password), [form.password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
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
      setError(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

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
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-civic-50 relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-[20%] right-[10%] w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="w-full max-w-[420px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
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
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors mb-6 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" /> Back to Sign In
          </Link>

          <div className="mb-8">
            <h2 className="text-2xl font-extrabold text-civic-900 tracking-tight font-display">Create account</h2>
            <p className="text-civic-400 mt-1.5 text-sm">Register as a citizen to start filing complaints</p>
          </div>

          {error && (
            <div className="mb-5 px-4 py-3 bg-red-50/80 border border-red-100 rounded-xl text-sm text-red-600 animate-scale-in backdrop-blur-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none group-focus-within:text-indigo-500 transition-colors" />
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
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none group-focus-within:text-indigo-500 transition-colors" />
              </div>
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Min 6 characters"
                  className="input pl-11 pr-11"
                  required
                  minLength={6}
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
                <div className="mt-2.5 animate-scale-in">
                  <div className="flex gap-1.5 mb-1.5">
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

            {/* Terms */}
            <label className="flex items-start gap-2.5 cursor-pointer group pt-1">
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

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 shadow-primary mt-1 group">
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Create Account <UserPlus className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-civic-400">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 font-bold hover:text-primary-700 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>

    {/* Footer */}
    <footer className="py-2.5 px-4 sm:px-6 flex items-center justify-center gap-1.5" style={{ background: 'rgba(248,250,252,0.9)', borderTop: '1px solid rgba(226,232,240,0.35)' }}>
      <Sparkles className="w-2.5 h-2.5 text-indigo-500" />
      <span className="text-[10px] text-slate-400 font-medium">Built by</span>
      <span className="text-[10px] font-bold font-display bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #4f46e5, #0ea5e9, #8b5cf6)' }}>Jayakrushna & Keerthi</span>
      <Heart className="w-2.5 h-2.5 text-rose-500 fill-rose-500" />
    </footer>
    </div>
  );
}
