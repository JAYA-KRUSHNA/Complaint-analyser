import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Eye, EyeOff, UserPlus } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.phone);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ─── Left Panel — Branding ──────────────────────────── */}
      <div className="hidden lg:flex lg:w-[55%] relative bg-gradient-to-br from-primary-950 via-primary-900 to-indigo-900 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-32 right-20 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 left-16 w-64 h-64 bg-primary-400/8 rounded-full blur-3xl animate-float-delayed" />
          <div className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
              backgroundSize: '40px 40px',
            }}
          />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/10">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">CiviSense</h1>
              <p className="text-[10px] text-indigo-300/60 font-medium tracking-[0.2em] uppercase mt-0.5">AI Platform</p>
            </div>
          </div>

          <div className="max-w-md">
            <h2 className="text-4xl font-bold text-white leading-tight">
              Join as a
              <br />
              <span className="bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">
                Digital Citizen
              </span>
            </h2>
            <p className="text-indigo-200/50 mt-5 text-base leading-relaxed">
              Register to submit and track civic complaints with AI-powered prioritization and real-time status updates.
            </p>
          </div>

          <div className="flex gap-12">
            {[
              { value: '✓', label: 'Track Status' },
              { value: '✓', label: 'AI Priority' },
              { value: '✓', label: 'Real-time' },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">{s.value}</span>
                <p className="text-xs text-indigo-300/50 uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Right Panel — Form ─────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-civic-50">
        <div className="w-full max-w-[400px]">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-200/50">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-civic-800 tracking-tight">CiviSense</h1>
              <p className="text-[10px] text-civic-400 font-medium tracking-[0.2em] uppercase">AI Platform</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-civic-900 tracking-tight">Create account</h2>
            <p className="text-civic-500 mt-1.5 text-sm">Register as a citizen to start filing complaints</p>
          </div>

          {error && (
            <div className="mb-5 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 animate-scale-in">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Your full name"
                className="input"
                required
              />
            </div>
            <div>
              <label className="label">Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                className="input"
                required
              />
            </div>
            <div>
              <label className="label">Phone Number</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 9876543210"
                className="input"
              />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Min 6 characters"
                  className="input pr-11"
                  required
                  minLength={6}
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

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Create Account <UserPlus className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-civic-500">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 font-semibold hover:text-primary-700 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
