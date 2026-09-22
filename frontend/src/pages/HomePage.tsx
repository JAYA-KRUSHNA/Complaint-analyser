import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Shield, ArrowRight, Heart, Sparkles, Brain, MapPin, BarChart3 } from 'lucide-react';

export default function HomePage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #eef2ff 0%, #f8fafc 100%)' }}>
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full" style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 60%)' }} />
      </div>

      {/* Navbar */}
      <header className="relative z-20 px-6 py-4">
        <nav className="max-w-5xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center text-white" style={{ boxShadow: '0 3px 12px -2px rgba(79,70,229,0.35)' }}>
              <Shield className="w-4.5 h-4.5" />
            </div>
            <span className="text-base font-extrabold tracking-tight text-slate-900 font-display">CiviSense</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/register" className="hidden sm:block text-[13px] font-semibold text-slate-500 hover:text-slate-800 transition-colors">Register</Link>
            <Link
              to={isAuthenticated ? '/dashboard' : '/login'}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-[13px] font-semibold text-white group transition-all hover:scale-[1.02]"
              style={{ background: 'linear-gradient(135deg, #4f46e5, #4338ca)', boxShadow: '0 2px 10px -2px rgba(79,70,229,0.35)' }}
            >
              {isAuthenticated ? 'Dashboard' : 'Sign In'}
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 -mt-10">
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-6 text-[11px] font-bold text-indigo-600 uppercase tracking-wide animate-fade-in" style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(99,102,241,0.1)' }}>
            <Sparkles className="w-3 h-3 text-indigo-500" />
            AI-Powered Civic Platform
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-black tracking-tight leading-[1.1] font-display animate-slide-up">
            <span className="text-slate-900">Smart Civic</span>
            <br />
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #4f46e5, #0ea5e9, #8b5cf6)', backgroundSize: '200% auto', animation: 'shimmer 4s linear infinite' }}>
              Complaint System
            </span>
          </h1>

          <p className="mt-4 text-[15px] text-slate-500 max-w-lg mx-auto leading-relaxed animate-fade-in" style={{ animationDelay: '200ms' }}>
            AI categorization, priority scoring, and real-time tracking — making civic governance smarter and faster.
          </p>

          <div className="mt-8 flex items-center justify-center gap-3 animate-fade-in" style={{ animationDelay: '350ms' }}>
            <Link to="/login" className="inline-flex items-center gap-2 px-7 py-3 rounded-xl text-[14px] font-bold text-white group transition-all hover:scale-[1.03] active:scale-[0.97]" style={{ background: 'linear-gradient(135deg, #4f46e5, #4338ca)', boxShadow: '0 4px 16px -2px rgba(79,70,229,0.3)' }}>
              Get Started <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/register" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-[14px] font-semibold text-slate-700 hover:text-slate-900 transition-all" style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(226,232,240,0.6)' }}>
              Create Account
            </Link>
          </div>
        </div>

        {/* 3 Feature Pills */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto w-full animate-fade-in" style={{ animationDelay: '500ms' }}>
          {[
            { icon: Brain, title: 'AI Classification', desc: '12 categories with 98% accuracy', color: '#6366f1', bg: '#eef2ff' },
            { icon: BarChart3, title: 'Priority Scoring', desc: 'Civic Impact Score 0–100', color: '#f59e0b', bg: '#fffbeb' },
            { icon: MapPin, title: 'Geo Tracking', desc: 'Real-time location mapping', color: '#0ea5e9', bg: '#f0f9ff' },
          ].map((f) => (
            <div key={f.title} className="flex items-center gap-3.5 px-5 py-4 rounded-2xl transition-all hover:-translate-y-0.5" style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.9)', boxShadow: '0 2px 12px -4px rgba(15,23,42,0.06)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: f.bg }}>
                <f.icon className="w-5 h-5" style={{ color: f.color }} />
              </div>
              <div>
                <p className="text-[13px] font-bold text-slate-800 font-display">{f.title}</p>
                <p className="text-[11px] text-slate-400 font-medium">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-20 py-4 px-6" style={{ borderTop: '1px solid rgba(226,232,240,0.3)' }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            <span className="font-bold text-slate-600 font-display">CiviSense</span> — Smart Civic Complaint Management
          </span>
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-2.5 h-2.5 text-indigo-500" />
            <span className="text-[10px] font-bold font-display bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #4f46e5, #0ea5e9)' }}>Jayakrushna & Keerthi</span>
            <Heart className="w-2.5 h-2.5 text-rose-500 fill-rose-500" />
          </div>
        </div>
      </footer>
    </div>
  );
}
