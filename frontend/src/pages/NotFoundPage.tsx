import { Link } from 'react-router-dom';
import { Shield, ArrowLeft, Home } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #eef2ff 0%, #f6f8fc 50%, #f8fafc 100%)' }}
    >
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 65%)' }}
        />
      </div>

      <div className="relative z-10 text-center max-w-md">
        {/* Logo */}
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-white mx-auto mb-6"
          style={{
            background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
            boxShadow: '0 4px 14px -2px rgba(79, 70, 229, 0.3)',
          }}
        >
          <Shield className="w-7 h-7" />
        </div>

        {/* 404 */}
        <h1
          className="text-[7rem] font-black leading-none font-display bg-clip-text text-transparent mb-2"
          style={{
            backgroundImage: 'linear-gradient(135deg, #c7d2fe 0%, #e0e7ff 50%, #c7d2fe 100%)',
          }}
        >
          404
        </h1>

        <h2 className="text-xl font-bold text-civic-800 font-display mb-2">Page not found</h2>
        <p className="text-sm text-civic-400 leading-relaxed mb-8">
          The page you're looking for doesn't exist or has been moved.
          Let's get you back to familiar territory.
        </p>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => window.history.back()}
            className="btn-secondary group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> Go Back
          </button>
          <Link to="/" className="btn-primary shadow-primary group">
            <Home className="w-4 h-4" /> Home
          </Link>
        </div>
      </div>
    </div>
  );
}
