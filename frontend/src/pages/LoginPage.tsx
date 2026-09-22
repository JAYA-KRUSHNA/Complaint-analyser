import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Shield, Eye, EyeOff, ArrowRight, ArrowLeft, Lock, Mail, Sparkles, Heart } from 'lucide-react';

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
    if (!email || !password) { setError('Please fill in all fields'); return; }
    setLoading(true);
    try {
      await login(email, password);
      toastSuccess('Welcome back!', 'Signed in successfully');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f6f8fc' }}>
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2.5 mb-6 group">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center text-white" style={{ boxShadow: '0 3px 12px -2px rgba(79,70,229,0.3)' }}>
                <Shield className="w-5 h-5" />
              </div>
              <span className="text-lg font-extrabold tracking-tight text-slate-900 font-display">CiviSense</span>
            </Link>
            <h1 className="text-2xl font-bold text-slate-900 font-display">Welcome Back</h1>
            <p className="text-sm text-slate-400 mt-1">Sign in to your account</p>
          </div>

          {/* Card */}
          <div className="p-6 rounded-2xl" style={{ background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(255,255,255,0.95)', boxShadow: '0 1px 3px rgba(15,23,42,0.03), 0 8px 24px -4px rgba(15,23,42,0.06)' }}>
            {error && (
              <div className="mb-4 px-3 py-2.5 rounded-xl text-[12px] font-medium text-rose-700 bg-rose-50 border border-rose-100">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-slate-600 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com" required
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl text-sm bg-slate-50 border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white outline-none transition-all" />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-slate-600 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password" required
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm bg-slate-50 border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white outline-none transition-all" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Demo hint */}
              <div className="flex items-center justify-end">
                <div className="relative">
                  <button type="button" onClick={() => setShowDemo(!showDemo)} className="text-[11px] text-indigo-500 font-semibold hover:text-indigo-700 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Demo credentials
                  </button>
                  {showDemo && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowDemo(false)} />
                      <div className="absolute right-0 top-6 z-50 w-52 p-3 rounded-xl bg-white border border-slate-200 shadow-lg animate-scale-in">
                        <div className="space-y-1.5 text-[11px] mb-2.5">
                          <div className="flex justify-between"><span className="text-slate-400">Email:</span><span className="font-mono font-bold text-slate-700">admin@civisense.ai</span></div>
                          <div className="flex justify-between"><span className="text-slate-400">Password:</span><span className="font-mono font-bold text-slate-700">admin123</span></div>
                        </div>
                        <button type="button" onClick={() => { setEmail('admin@civisense.ai'); setPassword('admin123'); setShowDemo(false); }}
                          className="w-full py-1.5 rounded-lg text-[11px] font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors">
                          Auto-fill
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 group"
                style={{ background: 'linear-gradient(135deg, #4f46e5, #4338ca)', boxShadow: '0 2px 10px -2px rgba(79,70,229,0.3)' }}>
                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Sign In <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" /></>}
              </button>
            </form>

            <p className="mt-5 text-center text-[13px] text-slate-400">
              Don't have an account? <Link to="/register" className="text-indigo-600 font-bold hover:text-indigo-700">Register</Link>
            </p>
          </div>

          <Link to="/" className="mt-4 flex items-center justify-center gap-1.5 text-[12px] text-slate-400 hover:text-slate-600 transition-colors group">
            <ArrowLeft className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform" /> Back to home
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-3 flex items-center justify-center gap-1.5" style={{ borderTop: '1px solid rgba(226,232,240,0.35)' }}>
        <Sparkles className="w-2.5 h-2.5 text-indigo-500" />
        <span className="text-[10px] font-bold font-display bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #4f46e5, #0ea5e9)' }}>Jayakrushna & Keerthi</span>
        <Heart className="w-2.5 h-2.5 text-rose-500 fill-rose-500" />
      </footer>
    </div>
  );
}
