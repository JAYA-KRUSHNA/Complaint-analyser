import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { complaintsApi } from '../lib/api';
import { CATEGORIES } from '../lib/constants';
import { Send, MapPin, AlertCircle } from 'lucide-react';

export default function NewComplaintPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      setSuccess(`Complaint ${res.data.complaint_number} submitted successfully!`);
      setTimeout(() => navigate(`/complaints/${res.data.id}`), 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.detail || 'Failed to submit complaint');
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
        () => setError('Location access denied')
      );
    }
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="page-title">Submit a Complaint</h1>
        <p className="page-subtitle">Describe the civic issue you want to report</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2 animate-slide-down">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 animate-slide-down">
          ✅ {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card p-8 space-y-6">
        {/* Title */}
        <div>
          <label className="label">Title *</label>
          <input
            type="text"
            className="input"
            placeholder="Brief description of the issue (e.g. Water pipe burst near Market Road)"
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            required
            minLength={5}
            maxLength={300}
          />
        </div>

        {/* Description */}
        <div>
          <label className="label">Description *</label>
          <textarea
            className="input min-h-[140px] resize-y"
            placeholder="Provide detailed information about the issue — what happened, how it affects the area, how long it has been going on..."
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            required
            minLength={10}
          />
        </div>

        {/* Category */}
        <div>
          <label className="label">Category</label>
          <select
            className="input"
            value={form.category_name}
            onChange={(e) => update('category_name', e.target.value)}
          >
            <option value="">AI will auto-detect category</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.icon} {cat.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-civic-400 mt-1">Leave empty for AI-powered auto-classification</p>
        </div>

        {/* Location */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="label mb-0">Location</label>
            <button
              type="button"
              onClick={handleGetLocation}
              className="btn-ghost btn-sm text-primary-600"
            >
              <MapPin className="w-3.5 h-3.5" /> Use My Location
            </button>
          </div>

          <input
            type="text"
            className="input"
            placeholder="Area or landmark (e.g. Near Main Market, MG Road)"
            value={form.location_text}
            onChange={(e) => update('location_text', e.target.value)}
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
        </div>

        {/* Duration */}
        <div>
          <label className="label">Duration (hours)</label>
          <input
            type="number"
            step="any"
            min="0"
            className="input"
            placeholder="How long has this issue been going on?"
            value={form.duration_hours}
            onChange={(e) => update('duration_hours', e.target.value)}
          />
        </div>

        {/* Language */}
        <div>
          <label className="label">Language</label>
          <select className="input" value={form.language} onChange={(e) => update('language', e.target.value)}>
            <option value="en">English</option>
            <option value="te">Telugu</option>
            <option value="hi">Hindi</option>
            <option value="mixed">Mixed / Code-switched</option>
          </select>
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-civic-200/50">
          <button type="submit" disabled={loading} className="btn-primary btn-lg w-full sm:w-auto">
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <><Send className="w-4 h-4" /> Submit Complaint</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
