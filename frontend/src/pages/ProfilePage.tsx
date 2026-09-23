import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { authApi } from '../lib/api';
import {
  User, Mail, Phone, Lock, Save, Shield, Calendar,
  Eye, EyeOff, CheckCircle2, Globe,
} from 'lucide-react';

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  DEPARTMENT_OFFICER: 'Department Officer',
  CITIZEN: 'Citizen',
};

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const toast = useToast();

  // Profile form
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [language, setLanguage] = useState(user?.preferred_language || 'en');
  const [profileLoading, setProfileLoading] = useState(false);

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [profileError, setProfileError] = useState('');

  // ─── Update Profile ─────────────────────────────────────
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileLoading(true);
    try {
      await authApi.updateProfile({ name, phone, preferred_language: language });
      toast.success('Profile Updated', 'Your profile has been saved successfully.');
      // Refresh user data
      window.location.reload();
    } catch (err: any) {
      const msg = err.response?.data?.error || err.response?.data?.detail || 'Failed to update profile';
      setProfileError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setProfileLoading(false);
    }
  };

  // ─── Change Password ───────────────────────────────────
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return;
    }
    if (!/\d/.test(newPassword)) {
      setPasswordError('New password must contain at least one digit');
      return;
    }
    if (!/[a-zA-Z]/.test(newPassword)) {
      setPasswordError('New password must contain at least one letter');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setPasswordLoading(true);
    try {
      await authApi.changePassword({ current_password: currentPassword, new_password: newPassword });
      toast.success('Password Changed', 'Your password has been updated. Please log in again.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      // Log out after password change for security
      setTimeout(() => logout(), 1500);
    } catch (err: any) {
      const msg = err.response?.data?.error || err.response?.data?.detail || 'Failed to change password';
      setPasswordError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setPasswordLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-civic-900 tracking-tight font-display flex items-center gap-2.5">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl shadow-lg shadow-indigo-500/20">
            <User className="w-5 h-5 text-white" />
          </div>
          My Profile
        </h1>
        <p className="text-civic-400 mt-1 text-sm">Manage your account settings and preferences</p>
      </div>

      {/* Account Overview Card */}
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-500 to-indigo-700 px-6 py-8 relative">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 right-8 w-32 h-32 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-12 w-24 h-24 bg-white rounded-full blur-2xl" />
          </div>
          <div className="relative flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl font-bold text-white border-2 border-white/30">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{user.name}</h2>
              <p className="text-indigo-100 text-sm flex items-center gap-1.5 mt-0.5">
                <Mail className="w-3.5 h-3.5" /> {user.email}
              </p>
              <div className="flex items-center gap-3 mt-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-white/15 backdrop-blur-sm rounded-full text-xs font-semibold text-white border border-white/20">
                  <Shield className="w-3 h-3" /> {ROLE_LABELS[user.role] || user.role}
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-indigo-200">
                  <Calendar className="w-3 h-3" /> Joined {new Date(user.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Form */}
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-civic-800">Edit Profile</h3>
          <p className="text-xs text-slate-400 mt-0.5">Update your name, phone, and language preference</p>
        </div>
        <form onSubmit={handleProfileUpdate} className="p-6 space-y-4">
          {profileError && (
            <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
              {profileError}
            </div>
          )}

          <div>
            <label className="label">Full Name</label>
            <div className="relative group">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input pl-11"
                required
                minLength={2}
              />
              <User className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none group-focus-within:text-indigo-500 transition-colors" />
            </div>
          </div>

          <div>
            <label className="label">Email Address</label>
            <div className="relative group">
              <input
                type="email"
                value={user.email}
                disabled
                className="input pl-11 opacity-60 cursor-not-allowed"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Lock className="w-3.5 h-3.5 text-slate-300 absolute right-4 top-1/2 -translate-y-1/2" />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Email cannot be changed</p>
          </div>

          <div>
            <label className="label">Phone Number</label>
            <div className="relative group">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 9876543210"
                className="input pl-11"
              />
              <Phone className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none group-focus-within:text-indigo-500 transition-colors" />
            </div>
          </div>

          <div>
            <label className="label">Preferred Language</label>
            <div className="relative group">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="input pl-11 appearance-none cursor-pointer"
              >
                <option value="en">English</option>
                <option value="te">తెలుగు (Telugu)</option>
                <option value="hi">हिन्दी (Hindi)</option>
              </select>
              <Globe className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none group-focus-within:text-indigo-500 transition-colors" />
            </div>
          </div>

          <button
            type="submit"
            disabled={profileLoading}
            className="btn-primary py-2.5 px-5 shadow-primary group"
          >
            {profileLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" /> Save Changes
              </>
            )}
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-civic-800">Change Password</h3>
          <p className="text-xs text-slate-400 mt-0.5">You'll be logged out after changing your password</p>
        </div>
        <form onSubmit={handlePasswordChange} className="p-6 space-y-4">
          {passwordError && (
            <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
              {passwordError}
            </div>
          )}

          <div>
            <label className="label">Current Password</label>
            <div className="relative group">
              <input
                type={showCurrentPw ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="input pl-11 pr-11"
                required
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none group-focus-within:text-indigo-500 transition-colors" />
              <button
                type="button"
                onClick={() => setShowCurrentPw(!showCurrentPw)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-civic-400 hover:text-civic-600 transition-colors p-1"
              >
                {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="label">New Password</label>
            <div className="relative group">
              <input
                type={showNewPw ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 8 characters (letter + digit)"
                className="input pl-11 pr-11"
                required
                minLength={8}
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none group-focus-within:text-indigo-500 transition-colors" />
              <button
                type="button"
                onClick={() => setShowNewPw(!showNewPw)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-civic-400 hover:text-civic-600 transition-colors p-1"
              >
                {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="label">Confirm New Password</label>
            <div className="relative group">
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="input pl-11"
                required
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none group-focus-within:text-indigo-500 transition-colors" />
              {confirmPassword && newPassword === confirmPassword && (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 absolute right-4 top-1/2 -translate-y-1/2" />
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={passwordLoading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:opacity-50 transition-all shadow-sm hover:shadow-md"
          >
            {passwordLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Lock className="w-4 h-4" /> Change Password
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
