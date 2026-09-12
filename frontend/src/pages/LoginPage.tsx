import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Eye, EyeOff, ArrowRight, Sparkles, BarChart3, Zap, Lock } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ─── Left Panel — Branding ──────────────────────────── */}
      <div className="hidden lg:flex lg:w-[55%] relative bg-gradient-to-br from-primary-950 via-primary-900 to-indigo-900 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-32 right-16 w-96 h-96 bg-indigo-400/8 rounded-full blur-3xl animate-float-delayed" />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-violet-500/6 rounded-full blur-2xl animate-float" />
          
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
              backgroundSize: '40px 40px',
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/10">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">CiviSense</h1>
              <p className="text-[10px] text-indigo-300/60 font-medium tracking-widest uppercase">AI Platform</p>
            </div>
          </div>

          {/* Hero */}
          <div className="max-w-md">
            <h2 className="text-4xl font-bold text-white leading-tight">
              Intelligent Civic
              <br />
              <span className="bg-gradient-to-r from-indigo-300 to-violet-300 bg-clip-text text-transparent">
                Complaint Management
              </span>
            </h2>
            <p className="text-indigo-200/50 mt-5 text-base leading-relaxed">
              AI-powered prioritization system that ensures every citizen's voice is heard and acted upon efficiently.
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-3 mt-8">
              {[
                { icon: Sparkles, text: 'AI Classification' },
                { icon: BarChart3, text: 'Smart Priority' },
                { icon: Zap, text: 'Real-time Analysis' },
              ].map((f) => (
                <div key={f.text} className="flex items-center gap-2 px-3.5 py-2 bg-white/5 backdrop-blur-sm rounded-full border border-white/8 text-sm text-indigo-200/70">
                  <f.icon className="w-3.5 h-3.5" />
                  {f.text}
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-12">
            {[
              { value: '12', label: 'Categories' },
              { value: '3', label: 'AI Models' },
              { value: '8', label: 'Priority Factors' },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-indigo-300/40 mt-0.5 uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Right Panel — Form ─────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-civic-50">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-200/50">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-civic-800 tracking-tight">CiviSense</h1>
              <p className="text-[10px] text-civic-400 font-medium tracking-widest uppercase">AI Platform</p>
            </div>
          </div>

          {/* Welcome */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-civic-900 tracking-tight">Welcome back</h2>
            <p className="text-civic-500 mt-1.5 text-sm">Sign in to continue to your dashboard</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 animate-scale-in">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Email Address</label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@civisense.ai"
                className="input"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-civic-700">Password</label>
                <button type="button" className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="input pr-11"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-civic-400 hover:text-civic-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Register link */}
          <p className="mt-8 text-center text-sm text-civic-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-600 font-semibold hover:text-primary-700 transition-colors">
              Create account
            </Link>
          </p>

          {/* Demo credentials */}
          <div className="mt-6 p-4 bg-civic-100/60 rounded-xl border border-civic-200/40">
            <div className="flex items-center gap-2 text-xs font-medium text-civic-500 mb-2">
              <Lock className="w-3 h-3" /> Demo Credentials
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-civic-600">
              <div>
                <span className="text-civic-400">Email:</span>
                <br />
                <code className="text-primary-600 font-medium">admin@civisense.ai</code>
              </div>
              <div>
                <span className="text-civic-400">Password:</span>
                <br />
                <code className="text-primary-600 font-medium">admin123</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
