import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import {
  Shield, Eye, EyeOff, ArrowRight, Lock, Mail,
  ArrowLeft, ChevronDown, Sparkles, AlertTriangle, Heart
} from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const { success: toastSuccess } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please check your email and password and try again.');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      toastSuccess('Welcome back!', 'Signed in successfully');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Please check your email and password and try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = async (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
    setShowDemo(false);
    setLoading(true);
    try {
      await login(demoEmail, demoPassword);
      toastSuccess('Welcome back!', `Signed in as ${demoEmail.startsWith('admin') ? 'Administrator' : 'Officer'}`);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Please check your email and password and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between relative overflow-hidden" style={{ background: '#F6F8FC' }}>
      {/* ── Background Vibrant Ambient Lighting (Refracts through Glass) ─ */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[250px] left-1/2 -translate-x-1/2 w-[850px] h-[850px] rounded-full opacity-45" style={{ background: 'radial-gradient(circle, rgba(79,70,229,0.08) 0%, rgba(124,58,237,0.04) 50%, transparent 70%)' }} />
        <div className="absolute bottom-[5%] right-[10%] w-[550px] h-[550px] rounded-full opacity-35" style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.06) 0%, transparent 70%)' }} />
        <div className="absolute top-[30%] left-[5%] w-[500px] h-[500px] rounded-full opacity-30" style={{ background: 'radial-gradient(circle, rgba(8,145,178,0.05) 0%, transparent 70%)' }} />
      </div>

      {/* ── Top Navigation Bar ──────────────────────────────── */}
      <header className="relative z-10 w-full max-w-[1240px] mx-auto px-6 pt-6 flex items-center justify-between">
        <Link to="/" className="inline-flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-[10px] flex items-center justify-center text-white transition-transform group-hover:scale-105 shadow-sm shadow-indigo-500/20" style={{ background: '#4F46E5' }}>
            <Shield className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[16px] font-bold text-[#172033] tracking-tight">CiviSense</span>
            <span className="hidden sm:inline-block text-[12px] text-[#64748B] font-medium border-l border-[#E2E8F0] pl-2">Civic Intelligence</span>
          </div>
        </Link>

        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#64748B] hover:text-[#172033] transition-colors group px-3.5 py-1.5 rounded-full hover:bg-white/70"
          style={{
            background: 'rgba(255, 255, 255, 0.50)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.70)',
          }}
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Home</span>
        </Link>
      </header>

      {/* ── Centered Glassmorphic Authentication Card ───────── */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div
          className="w-full max-w-[420px] rounded-[24px] p-8 sm:p-9 relative overflow-hidden transition-all duration-300"
          style={{
            background: 'rgba(255, 255, 255, 0.78)',
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.90)',
            boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.6) inset',
          }}
        >
          {/* Subtle top inner gradient highlight */}
          <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(79,70,229,0.4) 50%, transparent)' }} />

          {/* Greeting */}
          <div className="text-center mb-6">
            <h1 className="text-[25px] sm:text-[27px] font-bold text-[#172033] tracking-tight">
              Welcome back 👋
            </h1>
            <p className="text-[14px] text-[#64748B] mt-1.5">
              Let's get your civic workspace ready.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-5 px-4 py-3 rounded-[12px] text-[13px] flex items-start gap-2.5" style={{ background: '#FEF2F2', border: '1px solid rgba(220,38,38,0.15)' }}>
              <AlertTriangle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-[#DC2626]">We couldn't sign you in.</p>
                <p className="text-[#64748B] text-[12px] mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-[13px] font-semibold text-[#172033] mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail className="w-[18px] h-[18px] text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  autoComplete="email"
                  className="w-full pl-11 pr-4 py-2.5 rounded-[12px] text-[14px] text-[#172033] placeholder:text-[#94A3B8] outline-none transition-all duration-150"
                  style={{
                    background: 'rgba(248, 250, 252, 0.85)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid #E2E8F0'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#4F46E5';
                    e.target.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.1)';
                    e.target.style.background = '#FFFFFF';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#E2E8F0';
                    e.target.style.boxShadow = 'none';
                    e.target.style.background = 'rgba(248, 250, 252, 0.85)';
                  }}
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="block text-[13px] font-semibold text-[#172033] mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-[18px] h-[18px] text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  className="w-full pl-11 pr-11 py-2.5 rounded-[12px] text-[14px] text-[#172033] placeholder:text-[#94A3B8] outline-none transition-all duration-150"
                  style={{
                    background: 'rgba(248, 250, 252, 0.85)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid #E2E8F0'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#4F46E5';
                    e.target.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.1)';
                    e.target.style.background = '#FFFFFF';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#E2E8F0';
                    e.target.style.boxShadow = 'none';
                    e.target.style.background = 'rgba(248, 250, 252, 0.85)';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B] transition-colors p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-[17px] h-[17px]" /> : <Eye className="w-[17px] h-[17px]" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-[12px] text-[14px] font-semibold text-white transition-all duration-150 hover:-translate-y-[1px] hover:shadow-lg hover:shadow-indigo-500/25 disabled:opacity-60 disabled:translate-y-0 disabled:shadow-none group mt-1"
              style={{ background: '#4F46E5' }}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Create account link */}
          <p className="mt-5 text-[13px] text-[#64748B] text-center">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#4F46E5] font-semibold hover:text-[#4338CA] transition-colors">
              Create account
            </Link>
          </p>

          {/* Demo access section with frosted glass */}
          <div className="mt-6 pt-5" style={{ borderTop: '1px solid rgba(226, 232, 240, 0.8)' }}>
            <button
              type="button"
              onClick={() => setShowDemo(!showDemo)}
              className="flex items-center justify-between text-[13px] font-medium text-[#64748B] hover:text-[#172033] transition-colors w-full py-1 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#4F46E5]" />
                <span className="font-semibold text-[#172033]">Demo access</span>
                <span className="text-[11px] text-[#94A3B8] font-normal">(Instant 1-Click Login)</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showDemo ? 'rotate-180' : ''}`} />
            </button>

            {showDemo && (
              <div className="mt-3 grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => fillDemo('admin@civisense.ai', 'admin123')}
                  className="p-3 rounded-[12px] text-left transition-all hover:-translate-y-[1px] hover:shadow-sm group cursor-pointer"
                  style={{
                    background: 'rgba(255, 255, 255, 0.90)',
                    border: '1px solid #E2E8F0',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[12px] font-bold text-[#172033]">Administrator</p>
                    <span className="text-[10px] font-semibold text-[#4F46E5] group-hover:underline">Sign In →</span>
                  </div>
                  <p className="text-[11px] text-[#64748B] mt-0.5 truncate">admin@civisense.ai</p>
                </button>
                <button
                  type="button"
                  onClick={() => fillDemo('officer@civisense.ai', 'officer123')}
                  className="p-3 rounded-[12px] text-left transition-all hover:-translate-y-[1px] hover:shadow-sm group cursor-pointer"
                  style={{
                    background: 'rgba(255, 255, 255, 0.90)',
                    border: '1px solid #E2E8F0',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[12px] font-bold text-[#172033]">Officer</p>
                    <span className="text-[10px] font-semibold text-[#4F46E5] group-hover:underline">Sign In →</span>
                  </div>
                  <p className="text-[11px] text-[#64748B] mt-0.5 truncate">officer@civisense.ai</p>
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ── Ultra-Premium Glassmorphic Footer & Creator Attribution ──── */}
      <footer
        className="relative z-10 w-full max-w-[1240px] mx-auto px-6 py-6"
      >
        <div
          className="p-4 sm:p-5 rounded-[20px] flex flex-col md:flex-row items-center justify-between gap-4 transition-all duration-300"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.88) 0%, rgba(248, 250, 252, 0.82) 100%)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.9)',
            boxShadow: '0 8px 32px -4px rgba(15, 23, 42, 0.04), 0 0 0 1px rgba(99, 102, 241, 0.08)',
          }}
        >
          {/* Left Brand Identity */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[8px] flex items-center justify-center text-white shadow-xs" style={{ background: '#4F46E5' }}>
              <Shield className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2 text-[13px]">
              <span className="font-extrabold text-[#172033] tracking-tight">CiviSense AI</span>
              <span className="text-[#94A3B8]">·</span>
              <span className="text-[#64748B] font-medium hidden sm:inline">Municipal Operations Portal</span>
            </div>
          </div>

          {/* Center: THE SHOWCASE - Jaya Krushna & Keerthi */}
          <div
            className="inline-flex items-center gap-3 px-4 py-2 rounded-full transition-transform hover:scale-[1.02]"
            style={{
              background: 'linear-gradient(135deg, rgba(238, 242, 255, 0.95) 0%, rgba(253, 244, 255, 0.95) 100%)',
              border: '1px solid rgba(129, 140, 248, 0.35)',
              boxShadow: '0 2px 10px rgba(79, 70, 229, 0.08)',
            }}
          >
            {/* Dual Monograms */}
            <div className="flex items-center -space-x-1.5">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-black shadow-xs ring-2 ring-white"
                style={{ background: 'linear-gradient(135deg, #1E1B4B 0%, #4338CA 100%)' }}
              >
                JK
              </div>
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-black shadow-xs ring-2 ring-white"
                style={{ background: 'linear-gradient(135deg, #701A75 0%, #BE185D 100%)' }}
              >
                K
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[12px] sm:text-[13px] font-medium text-[#334155]">
              <span>Engineered by</span>
              <strong
                className="font-black text-[14px] sm:text-[15px]"
                style={{
                  background: 'linear-gradient(135deg, #1E1B4B 0%, #4338CA 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Jaya Krushna
              </strong>
              <span className="font-bold text-[#818CF8]">&</span>
              <strong
                className="font-black text-[14px] sm:text-[15px]"
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
          </div>

          {/* Right Status */}
          <div className="text-[12px] text-[#94A3B8] font-medium flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Civic Platform · © 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
