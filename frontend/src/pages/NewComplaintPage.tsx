import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { complaintsApi } from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import { CATEGORIES } from '../lib/constants';
import {
  Brain,
  Send, MapPin, AlertCircle, FileText, Sparkles, ArrowRight, ArrowLeft,
  CheckCircle2, Globe, Clock,
} from 'lucide-react';

const STEPS = [
  { label: 'Description', icon: FileText },
  { label: 'Location', icon: MapPin },
  { label: 'Details', icon: Sparkles },
  { label: 'Review', icon: CheckCircle2 },
];

export default function NewComplaintPage() {
  const navigate = useNavigate();
  const { success: toastSuccess, error: toastError } = useToast();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    category_name: '',
    location_text: '',
    address: '',
    latitude: '',
    longitude: '',
    duration_hours: '',
    language: 'en',
  });

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const canProceed = () => {
    if (step === 0) return form.title.length >= 5 && form.description.length >= 10;
    return true;
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      const payload: any = {
        title: form.title,
        description: form.description,
        language: form.language,
      };
      if (form.category_name) payload.category_name = form.category_name;
      if (form.location_text) payload.location_text = form.location_text;
      if (form.address) payload.address = form.address;
      if (form.latitude) payload.latitude = parseFloat(form.latitude);
      if (form.longitude) payload.longitude = parseFloat(form.longitude);
      if (form.duration_hours) payload.duration_hours = parseFloat(form.duration_hours);

      const res = await complaintsApi.create(payload);
      toastSuccess(
        'Complaint submitted!',
        `${res.data.complaint_number} — AI will analyze and prioritize it.`
      );
      setTimeout(() => navigate(`/complaints/${res.data.id}`), 800);
    } catch (err: any) {
      const msg = err.response?.data?.error || err.response?.data?.detail || 'Failed to submit complaint';
      setError(msg);
      toastError('Submission failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setForm((prev) => ({
            ...prev,
            latitude: pos.coords.latitude.toFixed(6),
            longitude: pos.coords.longitude.toFixed(6),
          }));
        },
        () => toastError('Location denied', 'Please enable location access')
      );
    }
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="page-title font-display flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary-500" />
          Submit a Complaint
        </h1>
        <p className="page-subtitle">Describe the civic issue you want to report</p>
      </div>

      {/* Step Indicator */}
      <div className="glass-card p-4 mb-6">
        <div className="flex items-center">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isCompleted = i < step;
            const isActive = i === step;
            return (
              <div key={s.label} className="flex items-center flex-1 last:flex-none">
                <button
                  onClick={() => i < step && setStep(i)}
                  className={`flex items-center gap-2 ${i < step ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  <div className={
                    isCompleted ? 'step-dot-completed' :
                    isActive ? 'step-dot-active' :
                    'step-dot-inactive'
                  }>
                    {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-3.5 h-3.5" />}
                  </div>
                  <span className={`text-xs font-semibold hidden sm:block ${
                    isActive ? 'text-primary-600' : isCompleted ? 'text-emerald-600' : 'text-civic-400'
                  }`}>
                    {s.label}
                  </span>
                </button>
                {i < STEPS.length - 1 && (
                  <div className={`step-line mx-3 ${i < step ? 'step-line-active' : 'step-line-inactive'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50/80 border border-red-200/60 rounded-xl text-sm text-red-700 flex items-center gap-2.5 animate-scale-in backdrop-blur-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      <div className="glass-card p-8">
        {/* Step 0: Description */}
        {step === 0 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label mb-0">Title *</label>
                <span className={`text-[11px] font-medium ${form.title.length >= 5 ? 'text-emerald-500' : 'text-civic-400'}`}>
                  {form.title.length}/300
                </span>
              </div>
              <input
                type="text"
                className="input"
                placeholder="Brief description of the issue (e.g. Water pipe burst near Market Road)"
                value={form.title}
                onChange={(e) => update('title', e.target.value)}
                maxLength={300}
                autoFocus
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label mb-0">Description *</label>
                <span className={`text-[11px] font-medium ${form.description.length >= 10 ? 'text-emerald-500' : 'text-civic-400'}`}>
                  {form.description.length} chars
                </span>
              </div>
              <textarea
                className="input min-h-[160px] resize-y"
                placeholder="Provide detailed information about the issue — what happened, how it affects the area, how long it has been going on..."
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
              />
            </div>

            {/* Category Chips */}
            <div>
              <label className="label flex items-center gap-2">
                Category
                <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100/80 uppercase">AI Auto-detect</span>
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => update('category_name', '')}
                  className={form.category_name === '' ? 'chip-active' : 'chip-inactive'}
                >
                  <Sparkles className="w-3.5 h-3.5" /> Auto-detect
                </button>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => update('category_name', cat.value)}
                    className={form.category_name === cat.value ? 'chip-active' : 'chip-inactive'}
                  >
                    <span>{cat.icon}</span> {cat.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Location */}
        {step === 1 && (
          <div className="space-y-5 animate-fade-in">
            <div className="flex items-center justify-between">
              <label className="label mb-0">Location</label>
              <button type="button" onClick={handleGetLocation} className="btn-ghost btn-sm text-primary-600 group">
                <MapPin className="w-3.5 h-3.5 group-hover:text-primary-700" /> Use My Location
              </button>
            </div>

            <input
              type="text"
              className="input"
              placeholder="Area or landmark (e.g. Near Main Market, MG Road)"
              value={form.location_text}
              onChange={(e) => update('location_text', e.target.value)}
              autoFocus
            />

            <input
              type="text"
              className="input"
              placeholder="Full address (optional)"
              value={form.address}
              onChange={(e) => update('address', e.target.value)}
            />

            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                step="any"
                className="input"
                placeholder="Latitude"
                value={form.latitude}
                onChange={(e) => update('latitude', e.target.value)}
              />
              <input
                type="number"
                step="any"
                className="input"
                placeholder="Longitude"
                value={form.longitude}
                onChange={(e) => update('longitude', e.target.value)}
              />
            </div>

            {form.latitude && form.longitude && (
              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/40 text-sm text-emerald-700 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Location set: {form.latitude}, {form.longitude}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Details */}
        {step === 2 && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <label className="label flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-civic-400" /> Duration (hours)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                className="input"
                placeholder="How long has this issue been going on?"
                value={form.duration_hours}
                onChange={(e) => update('duration_hours', e.target.value)}
                autoFocus
              />
              <p className="text-[11px] text-civic-400 mt-1.5">This helps AI assess urgency more accurately</p>
            </div>

            <div>
              <label className="label flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-civic-400" /> Language
              </label>
              <select className="input" value={form.language} onChange={(e) => update('language', e.target.value)}>
                <option value="en">English</option>
                <option value="te">Telugu</option>
                <option value="hi">Hindi</option>
                <option value="mixed">Mixed / Code-switched</option>
              </select>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="space-y-5 animate-fade-in">
            <h3 className="text-base font-bold text-civic-800 font-display">Review Your Complaint</h3>

            <div className="space-y-4">
              <div className="p-4 bg-civic-50/50 rounded-xl">
                <p className="text-[10px] text-civic-400 uppercase tracking-wider font-bold mb-1">Title</p>
                <p className="text-sm font-semibold text-civic-800">{form.title}</p>
              </div>

              <div className="p-4 bg-civic-50/50 rounded-xl">
                <p className="text-[10px] text-civic-400 uppercase tracking-wider font-bold mb-1">Description</p>
                <p className="text-sm text-civic-600 whitespace-pre-wrap leading-relaxed">{form.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-civic-50/50 rounded-xl">
                  <p className="text-[10px] text-civic-400 uppercase tracking-wider font-bold mb-1">Category</p>
                  <p className="text-sm font-medium text-civic-700">
                    {form.category_name
                      ? CATEGORIES.find((c) => c.value === form.category_name)?.label || form.category_name
                      : '🤖 AI Auto-detect'}
                  </p>
                </div>
                <div className="p-4 bg-civic-50/50 rounded-xl">
                  <p className="text-[10px] text-civic-400 uppercase tracking-wider font-bold mb-1">Language</p>
                  <p className="text-sm font-medium text-civic-700">
                    {form.language === 'en' ? 'English' : form.language === 'te' ? 'Telugu' : form.language === 'hi' ? 'Hindi' : 'Mixed'}
                  </p>
                </div>
              </div>

              {(form.location_text || form.address) && (
                <div className="p-4 bg-civic-50/50 rounded-xl">
                  <p className="text-[10px] text-civic-400 uppercase tracking-wider font-bold mb-1">Location</p>
                  <p className="text-sm font-medium text-civic-700">{form.location_text || form.address}</p>
                  {form.latitude && form.longitude && (
                    <p className="text-xs text-civic-400 mt-0.5 font-mono">{form.latitude}, {form.longitude}</p>
                  )}
                </div>
              )}

              {form.duration_hours && (
                <div className="p-4 bg-civic-50/50 rounded-xl">
                  <p className="text-[10px] text-civic-400 uppercase tracking-wider font-bold mb-1">Duration</p>
                  <p className="text-sm font-medium text-civic-700">{form.duration_hours} hours</p>
                </div>
              )}
            </div>

            <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-200/40">
              <div className="flex items-start gap-2.5">
                <Brain className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-indigo-700">AI will analyze this complaint</p>
                  <p className="text-xs text-indigo-500 mt-0.5">
                    Automatic category classification, severity assessment, urgency scoring, and priority calculation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-6 mt-6 border-t border-civic-200/30">
          {step > 0 ? (
            <button type="button" onClick={() => setStep(step - 1)} className="btn-secondary group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> Back
            </button>
          ) : (
            <div />
          )}

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="btn-primary shadow-primary group"
            >
              Next <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !form.title || !form.description}
              className="btn-primary btn-lg shadow-primary group"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" /> Submit Complaint
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


