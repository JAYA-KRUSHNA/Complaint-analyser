import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Shield, ArrowRight, Brain, MapPin, BarChart3, Zap,
  FileText, CheckCircle, Droplets, Construction, Trash2, HeartHandshake,
  Sparkles, Heart
} from 'lucide-react';

export default function HomePage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen flex flex-col justify-between" style={{ background: '#F6F8FC' }}>
      {/* ── Background Vibrant Ambient Lighting (Refracts through Glass) ─ */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[200px] left-1/2 -translate-x-1/2 w-[850px] h-[850px] rounded-full opacity-45" style={{ background: 'radial-gradient(circle, rgba(79,70,229,0.09) 0%, rgba(124,58,237,0.04) 50%, transparent 70%)' }} />
        <div className="absolute top-[35%] right-[-80px] w-[650px] h-[650px] rounded-full opacity-35" style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.07) 0%, transparent 70%)' }} />
        <div className="absolute top-[60%] left-[-100px] w-[600px] h-[600px] rounded-full opacity-30" style={{ background: 'radial-gradient(circle, rgba(8,145,178,0.06) 0%, transparent 70%)' }} />
        <div className="absolute -bottom-[200px] right-[20%] w-[700px] h-[700px] rounded-full opacity-25" style={{ background: 'radial-gradient(circle, rgba(79,70,229,0.06) 0%, transparent 70%)' }} />
      </div>

      {/* ── Floating Glass Navbar ───────────────────────────── */}
      <header className="relative z-30 px-6 pt-6">
        <nav
          className="max-w-[1240px] mx-auto px-6 sm:px-8 py-3.5 flex items-center justify-between rounded-2xl transition-all duration-300"
          style={{
            background: 'rgba(255, 255, 255, 0.72)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.85)',
            boxShadow: '0 10px 30px rgba(15, 23, 42, 0.04)',
          }}
        >
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-[10px] flex items-center justify-center text-white transition-transform group-hover:scale-105 shadow-md shadow-indigo-500/20" style={{ background: '#4F46E5' }}>
              <Shield className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-[17px] font-bold text-[#172033] tracking-tight">CiviSense</span>
              <span className="hidden sm:inline-block text-[12px] text-[#64748B] font-medium border-l border-[#E2E8F0] pl-2.5">Civic Intelligence</span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-[14px] font-medium text-[#64748B] hover:text-[#172033] transition-colors rounded-[10px] hover:bg-white/60"
            >
              Sign In
            </Link>
            <Link
              to={isAuthenticated ? '/dashboard' : '/complaints/new'}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[10px] text-[14px] font-semibold text-white transition-all hover:shadow-lg hover:shadow-indigo-500/25 hover:-translate-y-[1px] group"
              style={{ background: '#4F46E5' }}
            >
              <span>{isAuthenticated ? 'Dashboard' : 'Get Started'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </nav>
      </header>

      {/* ── 1. Hero Section (Spacious, Glass Accents) ────────── */}
      <section className="relative z-10 flex flex-col items-center justify-center px-6 pt-24 pb-28 lg:pt-32 lg:pb-36 text-center">
        <div className="max-w-[880px] mx-auto">
          {/* Eyebrow badge with glassmorphism */}
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 text-[12px] font-semibold text-[#4F46E5] uppercase tracking-[0.08em]"
            style={{
              background: 'rgba(255, 255, 255, 0.70)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(79, 70, 229, 0.15)',
              boxShadow: '0 4px 15px rgba(79, 70, 229, 0.05)'
            }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Civic Intelligence, Simplified</span>
          </div>

          {/* Main headline */}
          <h1 className="text-[46px] sm:text-[60px] lg:text-[70px] font-extrabold leading-[1.05] tracking-tight text-[#172033]">
            Report problems.
            <br />
            <span className="text-[#4F46E5]">Make your community better.</span>
          </h1>

          {/* Subtitle */}
          <p className="mt-8 text-[17px] sm:text-[19px] leading-[1.65] text-[#64748B] max-w-2xl mx-auto">
            CiviSense uses AI to understand civic complaints, identify their urgency, and help municipal teams focus on what needs attention.
          </p>

          {/* Dual CTAs with Glass Secondary */}
          <div className="mt-10 flex items-center justify-center gap-4 flex-wrap">
            <Link
              to="/complaints/new"
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-[12px] text-[15px] font-semibold text-white transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/25 group"
              style={{ background: '#4F46E5' }}
            >
              <span>Report an Issue</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-7 py-4 rounded-[12px] text-[15px] font-medium text-[#172033] transition-all hover:-translate-y-1 hover:bg-white"
              style={{
                background: 'rgba(255, 255, 255, 0.75)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.90)',
                boxShadow: '0 4px 20px rgba(15, 23, 42, 0.04)',
              }}
            >
              Explore CiviSense
            </Link>
          </div>

          {/* Personality tagline */}
          <p className="mt-7 text-[14px] text-[#94A3B8] italic">
            Spot it. Report it. We'll help make sense of it.
          </p>

          {/* Frosted Glass Civic Domain Pills */}
          <div className="mt-16 pt-10 flex items-center justify-center gap-3 flex-wrap border-t border-[#E2E8F0]/70 max-w-2xl mx-auto">
            <span className="text-[12px] text-[#94A3B8] font-medium mr-1 uppercase tracking-wider">Covering:</span>
            {[
              { label: 'Water Supply', icon: Droplets, color: '#0891B2' },
              { label: 'Power & Grid', icon: Zap, color: '#D97706' },
              { label: 'Road Hazards', icon: Construction, color: '#4F46E5' },
              { label: 'Sanitation', icon: Trash2, color: '#059669' },
              { label: 'Public Safety', icon: HeartHandshake, color: '#DC2626' },
            ].map((d) => (
              <div
                key={d.label}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-[13px] font-medium text-[#1E293B] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-default"
                style={{
                  background: 'rgba(255, 255, 255, 0.75)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.85)',
                  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)',
                }}
              >
                <d.icon className="w-3.5 h-3.5" style={{ color: d.color }} />
                <span>{d.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 2. How CiviSense Works (Glass Container) ─────────── */}
      <section className="relative z-10 px-6 py-28 lg:py-32">
        <div
          className="max-w-[1240px] mx-auto rounded-[32px] p-8 sm:p-12 lg:p-16"
          style={{
            background: 'rgba(255, 255, 255, 0.65)',
            backdropFilter: 'blur(20px) saturate(160%)',
            WebkitBackdropFilter: 'blur(20px) saturate(160%)',
            border: '1px solid rgba(255, 255, 255, 0.85)',
            boxShadow: '0 20px 50px -15px rgba(15, 23, 42, 0.04)',
          }}
        >
          <div className="text-center mb-16 lg:mb-20">
            <span className="text-[12px] font-bold text-[#4F46E5] uppercase tracking-wider">Simple Process</span>
            <h2 className="text-[28px] sm:text-[34px] font-bold text-[#172033] mt-2">How CiviSense works</h2>
            <p className="text-[16px] text-[#64748B] mt-2.5 max-w-xl mx-auto">
              From the moment a citizen spots an issue to verified municipal resolution.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8 relative">
            {/* Guide line */}
            <div className="hidden lg:block absolute top-[36px] left-[12%] right-[12%] h-[2px] z-0" style={{ background: 'linear-gradient(90deg, transparent, #CBD5E1 15%, #CBD5E1 85%, transparent)' }} />

            {[
              { num: '01', title: 'Report', desc: 'Tell us what happened with photos and location details in seconds.', icon: FileText, color: '#4F46E5' },
              { num: '02', title: 'Understand', desc: 'AI identifies complaint category, severity level, and impact context.', icon: Brain, color: '#7C3AED' },
              { num: '03', title: 'Prioritize', desc: 'Civic impact scoring highlights critical hazards that need immediate focus.', icon: BarChart3, color: '#0891B2' },
              { num: '04', title: 'Act', desc: 'Municipal departments dispatch teams and track status through completion.', icon: CheckCircle, color: '#059669' },
            ].map((step) => (
              <div key={step.num} className="relative text-center lg:text-left z-10 flex flex-col items-center lg:items-start">
                <div
                  className="rounded-2xl mb-6 flex items-center justify-center transition-all duration-300 hover:scale-105"
                  style={{
                    background: 'rgba(255, 255, 255, 0.90)',
                    backdropFilter: 'blur(10px)',
                    border: `1px solid ${step.color}25`,
                    boxShadow: '0 6px 16px rgba(15, 23, 42, 0.04)',
                    width: '64px',
                    height: '64px',
                  }}
                >
                  <step.icon className="w-7 h-7" style={{ color: step.color }} />
                </div>
                <span className="text-[12px] font-bold text-[#94A3B8] uppercase tracking-widest">{step.num}</span>
                <h3 className="text-[18px] font-bold text-[#172033] mt-1.5">{step.title}</h3>
                <p className="text-[14px] text-[#64748B] mt-2 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. What CiviSense Does (Frosted Glass Cards) ───── */}
      <section className="relative z-10 px-6 py-28 lg:py-32">
        <div className="max-w-[1240px] mx-auto">
          <div className="text-center mb-16 lg:mb-20">
            <span className="text-[12px] font-bold text-[#7C3AED] uppercase tracking-wider">Core Capabilities</span>
            <h2 className="text-[28px] sm:text-[34px] font-bold text-[#172033] mt-2">What CiviSense does</h2>
            <p className="text-[16px] text-[#64748B] mt-2.5 max-w-xl mx-auto">
              Transforming raw complaints into understanding, priority, and verified action.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-[960px] mx-auto">
            {[
              {
                icon: Brain,
                title: 'AI Complaint Analysis',
                desc: 'Automatically understands complaint category, urgency, and hazard severity from citizen reports.',
                color: '#7C3AED',
                bg: 'rgba(124,58,237,0.08)'
              },
              {
                icon: BarChart3,
                title: 'Smart Prioritization',
                desc: 'Calculates Civic Impact Scores to surface acute safety risks before routine maintenance backlog.',
                color: '#4F46E5',
                bg: 'rgba(79,70,229,0.08)'
              },
              {
                icon: MapPin,
                title: 'Civic Map & Geotagging',
                desc: 'Visualizes complaints spatially across wards, helping teams pinpoint clusters and repeat failures.',
                color: '#0891B2',
                bg: 'rgba(8,145,178,0.08)'
              },
              {
                icon: Zap,
                title: 'Civic Intelligence',
                desc: 'Empowers department leaders with actionable operational insights, response times, and resolution metrics.',
                color: '#D97706',
                bg: 'rgba(217,119,6,0.08)'
              },
            ].map((f) => (
              <div
                key={f.title}
                className="p-8 rounded-[24px] transition-all duration-300 hover:-translate-y-1.5 group"
                style={{
                  background: 'rgba(255, 255, 255, 0.72)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255, 255, 255, 0.85)',
                  boxShadow: '0 10px 30px rgba(15, 23, 42, 0.04)',
                }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-transform group-hover:scale-105" style={{ background: f.bg }}>
                  <f.icon className="w-6 h-6" style={{ color: f.color }} />
                </div>
                <h3 className="text-[18px] font-bold text-[#172033] mb-2">{f.title}</h3>
                <p className="text-[15px] text-[#64748B] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. Transformation Pipeline (Frosted Glass Pill) ── */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-[880px] mx-auto text-center">
          <p className="text-[13px] font-semibold text-[#64748B] uppercase tracking-wider mb-2">Not just complaint collection</p>
          <h3 className="text-[22px] sm:text-[26px] font-bold text-[#172033] mb-7">CiviSense helps turn reports into real results:</h3>

          <div
            className="inline-flex items-center justify-center gap-3 sm:gap-6 flex-wrap text-[15px] sm:text-[16px] font-bold text-[#172033] px-8 py-4 rounded-full transition-all duration-300"
            style={{
              background: 'rgba(255, 255, 255, 0.75)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.90)',
              boxShadow: '0 8px 25px rgba(15, 23, 42, 0.04)',
            }}
          >
            <span className="text-[#4F46E5]">Reports</span>
            <ArrowRight className="w-4 h-4 text-[#94A3B8]" />
            <span className="text-[#7C3AED]">Understanding</span>
            <ArrowRight className="w-4 h-4 text-[#94A3B8]" />
            <span className="text-[#0891B2]">Priority</span>
            <ArrowRight className="w-4 h-4 text-[#94A3B8]" />
            <span className="text-[#059669]">Action</span>
          </div>
        </div>
      </section>

      {/* ── 5. Final Call to Action ─────────────────────────── */}
      <section className="relative z-10 px-6 py-28 text-center">
        <div
          className="max-w-[760px] mx-auto rounded-[32px] p-12 lg:p-16 relative overflow-hidden"
          style={{
            background: 'rgba(255, 255, 255, 0.70)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.85)',
            boxShadow: '0 20px 60px -15px rgba(79, 70, 229, 0.08)',
          }}
        >
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none opacity-20" style={{ background: 'radial-gradient(circle, #4F46E5 0%, transparent 70%)' }} />
          <h2 className="text-[28px] sm:text-[36px] font-bold text-[#172033] tracking-tight mb-3">
            Have something that needs attention?
          </h2>
          <p className="text-[16px] text-[#64748B] mb-9 leading-relaxed max-w-lg mx-auto">
            Tell CiviSense about it. A better community starts with noticing what needs fixing.
          </p>
          <Link
            to="/complaints/new"
            className="inline-flex items-center gap-2.5 px-9 py-4 rounded-[12px] text-[16px] font-semibold text-white transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/25 group"
            style={{ background: '#4F46E5' }}
          >
            <span>Report an Issue</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* ── Premium Footer ─────────────────────────────────── */}
      <footer
        className="relative z-10 border-t border-[#E2E8F0]/90 pt-14 pb-10 overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.88) 0%, rgba(248,250,252,0.98) 100%)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
        }}
      >
        {/* Top accent ribbon */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{
            background: 'linear-gradient(90deg, transparent 5%, #4F46E5 30%, #7C3AED 50%, #EC4899 70%, transparent 95%)',
          }}
        />

        <div className="max-w-[1240px] mx-auto px-6 sm:px-8">
          {/* Footer Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12 pb-10 border-b border-[#E2E8F0]">
            {/* Column 1: Brand (5 cols) */}
            <div className="lg:col-span-5">
              <Link to="/" className="inline-flex items-center gap-3 group mb-4">
                <div className="w-9 h-9 rounded-[10px] flex items-center justify-center text-white shadow-md shadow-indigo-500/25" style={{ background: '#4F46E5' }}>
                  <Shield className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[20px] font-extrabold text-[#172033] tracking-tight">CiviSense</span>
                  <span className="text-[11px] font-bold text-[#4F46E5] bg-indigo-50/80 px-2.5 py-0.5 rounded-full border border-indigo-200/60 uppercase tracking-wide">AI Platform</span>
                </div>
              </Link>
              <p className="text-[14px] text-[#64748B] leading-relaxed max-w-sm mb-6 font-normal">
                Civic Intelligence Platform powered by explainable AI. Delivering automated public grievance triage, impact-driven prioritization, and transparent resolution tracking.
              </p>
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full text-[12px] font-semibold text-[#059669] bg-[#ECFDF5] border border-[#A7F3D0] shadow-sm">
                <span className="w-2 h-2 rounded-full bg-[#059669] animate-pulse" />
                <span>All Municipal Services Active</span>
              </div>
            </div>

            {/* Column 2: Platform (2 cols) */}
            <div className="lg:col-span-2">
              <h4 className="text-[12px] font-bold text-[#172033] uppercase tracking-wider mb-4">Platform</h4>
              <ul className="space-y-3 text-[14px] text-[#64748B]">
                <li><Link to="/complaints/new" className="hover:text-[#4F46E5] transition-colors font-medium">Report an Issue</Link></li>
                <li><Link to="/login" className="hover:text-[#4F46E5] transition-colors font-medium">Civic Heatmap</Link></li>
                <li><Link to="/login" className="hover:text-[#4F46E5] transition-colors font-medium">Priority Queue</Link></li>
                <li><Link to="/login" className="hover:text-[#4F46E5] transition-colors font-medium">Analytics & SLA</Link></li>
              </ul>
            </div>

            {/* Column 3: Civic Domains (3 cols) */}
            <div className="lg:col-span-3">
              <h4 className="text-[12px] font-bold text-[#172033] uppercase tracking-wider mb-4">Civic Domains</h4>
              <ul className="space-y-3 text-[14px] text-[#64748B]">
                <li className="flex items-center gap-2 font-medium hover:text-[#172033] transition-colors"><Droplets className="w-4 h-4 text-[#0891B2]" /> Water Supply & Drainage</li>
                <li className="flex items-center gap-2 font-medium hover:text-[#172033] transition-colors"><Zap className="w-4 h-4 text-[#D97706]" /> Electrical & Power Grid</li>
                <li className="flex items-center gap-2 font-medium hover:text-[#172033] transition-colors"><Construction className="w-4 h-4 text-[#4F46E5]" /> Roads & Public Transit</li>
                <li className="flex items-center gap-2 font-medium hover:text-[#172033] transition-colors"><Trash2 className="w-4 h-4 text-[#059669]" /> Sanitation & Waste</li>
              </ul>
            </div>

            {/* Column 4: Access (2 cols) */}
            <div className="lg:col-span-2">
              <h4 className="text-[12px] font-bold text-[#172033] uppercase tracking-wider mb-4">Access</h4>
              <ul className="space-y-3 text-[14px] text-[#64748B]">
                <li><Link to="/login" className="hover:text-[#4F46E5] transition-colors font-medium">Officer Sign In</Link></li>
                <li><Link to="/register" className="hover:text-[#4F46E5] transition-colors font-medium">Create Account</Link></li>
                <li><Link to="/login" className="hover:text-[#4F46E5] transition-colors font-medium">Demo Credentials</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom Row: Copyright + Names + Legal */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[13px] text-[#94A3B8] pt-6">
            <div className="flex items-center gap-1.5 flex-wrap justify-center sm:justify-start">
              <span>© 2026 CiviSense · Developed by</span>
              <span
                className="font-black text-[14px]"
                style={{
                  background: 'linear-gradient(135deg, #1E1B4B 0%, #4338CA 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Jaya Krushna
              </span>
              <span className="text-[#818CF8] font-bold">&</span>
              <span
                className="font-black text-[14px]"
                style={{
                  background: 'linear-gradient(135deg, #701A75 0%, #BE185D 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Keerthi
              </span>
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 animate-pulse" />
            </div>

            <div className="flex items-center gap-6 text-[13px] text-[#64748B]">
              <span className="hover:text-[#172033] cursor-pointer transition-colors font-medium">Privacy Policy</span>
              <span className="hover:text-[#172033] cursor-pointer transition-colors font-medium">Terms of Service</span>
              <span className="hover:text-[#172033] cursor-pointer transition-colors font-medium">Security</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
