import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import {
  Search, Compass, ArrowUpRight, Flame, X,
  Radio, RefreshCw, ZoomIn, ZoomOut,
} from 'lucide-react';
import { mapApi } from '../lib/api';

interface MappedComplaint {
  id: string;
  complaint_number: string;
  title: string;
  description: string;
  category: string;
  category_id?: string;
  priority_level: string;
  priority_score: number;
  severity_level: string;
  urgency_level: string;
  status: string;
  latitude: number;
  longitude: number;
  location_text: string;
  created_at: string;
}

interface MappedIncident {
  id: string;
  title: string;
  category: string;
  description?: string;
  latitude: number;
  longitude: number;
  radius: number;
  complaint_count: number;
  severity_score?: number;
  priority_score?: number;
  affected_population: string;
  status: string;
}

const PRIORITY_COLORS: Record<string, { bg: string; border: string; text: string; dot: string; glow: string }> = {
  P1: { bg: '#ef4444', border: '#b91c1c', text: '#991b1b', dot: '#dc2626', glow: 'rgba(239, 68, 68, 0.4)' },
  P2: { bg: '#f97316', border: '#c2410c', text: '#9a3412', dot: '#ea580c', glow: 'rgba(249, 115, 22, 0.35)' },
  P3: { bg: '#eab308', border: '#a16207', text: '#854d0e', dot: '#ca8a04', glow: 'rgba(234, 179, 8, 0.3)' },
  P4: { bg: '#10b981', border: '#047857', text: '#065f46', dot: '#059669', glow: 'rgba(16, 185, 129, 0.3)' },
};

function createCustomPin(priority: string) {
  const isP1 = priority === 'P1';
  const color = PRIORITY_COLORS[priority] || PRIORITY_COLORS.P3;

  return L.divIcon({
    className: 'custom-map-pin',
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px;">
        ${isP1 ? '<div class="pulse-ring-p1"></div>' : ''}
        <div style="
          width: ${isP1 ? '30px' : '26px'};
          height: ${isP1 ? '30px' : '26px'};
          border-radius: 50%;
          background: ${color.bg};
          border: 2.5px solid #ffffff;
          box-shadow: 0 4px 10px ${color.glow}, 0 2px 4px rgba(0,0,0,0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-weight: 800;
          font-size: 11px;
          cursor: pointer;
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        ">
          ${priority}
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });
}

export default function MapPage() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const incidentsLayerRef = useRef<L.LayerGroup | null>(null);

  const [loading, setLoading] = useState(true);
  const [complaints, setComplaints] = useState<MappedComplaint[]>([]);
  const [incidents, setIncidents] = useState<MappedIncident[]>([]);
  const [summary, setSummary] = useState<Record<string, number>>({ P1: 0, P2: 0, P3: 0, P4: 0 });

  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showIncidents, setShowIncidents] = useState<boolean>(true);
  const [selectedComplaint, setSelectedComplaint] = useState<MappedComplaint | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<MappedIncident | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Default center (Hyderabad civic center area: 17.3850, 78.4867)
    const map = L.map(mapContainerRef.current, {
      center: [17.3850, 78.4867],
      zoom: 12,
      zoomControl: false,
    });

    // Clean civic map tiles (CartoDB Positron)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    const incidentsGroup = L.layerGroup().addTo(map);

    mapRef.current = map;
    markersLayerRef.current = markersGroup;
    incidentsLayerRef.current = incidentsGroup;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await mapApi.getMapData({
        priority_level: priorityFilter !== 'ALL' ? priorityFilter : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        search: searchQuery ? searchQuery : undefined,
      });

      const data = res.data;
      setComplaints(data.complaints || []);
      setIncidents(data.incidents || []);
      setSummary(data.summary || { P1: 0, P2: 0, P3: 0, P4: 0 });
    } catch (err) {
      console.error('Failed to load map data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [priorityFilter, statusFilter]);

  // Handle Search submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  // Render Markers & Incident Zones
  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current || !incidentsLayerRef.current) return;

    markersLayerRef.current.clearLayers();
    incidentsLayerRef.current.clearLayers();

    const bounds = L.latLngBounds([]);

    // Plot Complaints
    complaints.forEach((c) => {
      if (typeof c.latitude === 'number' && typeof c.longitude === 'number') {
        const marker = L.marker([c.latitude, c.longitude], {
          icon: createCustomPin(c.priority_level),
        });

        marker.on('click', () => {
          setSelectedComplaint(c);
          setSelectedIncident(null);
          if (mapRef.current) {
            mapRef.current.panTo([c.latitude, c.longitude], { animate: true });
          }
        });

        markersLayerRef.current?.addLayer(marker);
        bounds.extend([c.latitude, c.longitude]);
      }
    });

    // Plot Incidents if enabled
    if (showIncidents) {
      incidents.forEach((inc) => {
        if (typeof inc.latitude === 'number' && typeof inc.longitude === 'number') {
          const circle = L.circle([inc.latitude, inc.longitude], {
            radius: inc.radius || 600,
            color: '#dc2626',
            fillColor: '#ef4444',
            fillOpacity: 0.12,
            weight: 1.5,
            dashArray: '6, 6',
          });

          circle.on('click', () => {
            setSelectedIncident(inc);
            setSelectedComplaint(null);
            if (mapRef.current) {
              mapRef.current.panTo([inc.latitude, inc.longitude], { animate: true });
            }
          });

          incidentsLayerRef.current?.addLayer(circle);
          bounds.extend([inc.latitude, inc.longitude]);
        }
      });
    }

    // Fit map bounds if points exist
    if (bounds.isValid()) {
      mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [complaints, incidents, showIncidents]);

  const handleResetView = () => {
    if (!mapRef.current) return;
    if (complaints.length > 0) {
      const bounds = L.latLngBounds(complaints.map((c) => [c.latitude, c.longitude]));
      if (bounds.isValid()) {
        mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
      }
    } else {
      mapRef.current.setView([17.3850, 78.4867], 12);
    }
  };

  return (
    <div className="relative h-[calc(100vh-4.25rem)] w-full overflow-hidden flex flex-col bg-civic-100">
      {/* ─── Top Floating Filter Control Bar ─────────────────── */}
      <div className="absolute top-4 left-4 right-4 z-[400] flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Left Side: Stats & Priority Chips */}
        <div className="flex flex-wrap items-center gap-2 pointer-events-auto bg-white/90 backdrop-blur-md p-2 rounded-2xl shadow-lg border border-white/60">
          <div className="flex items-center gap-2 px-3 py-1.5 border-r border-civic-200">
            <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-700 flex items-center justify-center font-bold">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-civic-400">Mapped Grievances</p>
              <p className="text-sm font-bold text-civic-900 leading-none">{complaints.length} locations</p>
            </div>
          </div>

          {/* Priority Filter Chips */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPriorityFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                priorityFilter === 'ALL'
                  ? 'bg-civic-900 text-white shadow-sm'
                  : 'text-civic-600 hover:bg-civic-100'
              }`}
            >
              All ({summary.P1 + summary.P2 + summary.P3 + summary.P4})
            </button>

            <button
              onClick={() => setPriorityFilter('P1')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                priorityFilter === 'P1'
                  ? 'bg-red-600 text-white shadow-sm ring-2 ring-red-300'
                  : 'text-red-700 hover:bg-red-50'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              P1 Critical ({summary.P1})
            </button>

            <button
              onClick={() => setPriorityFilter('P2')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                priorityFilter === 'P2'
                  ? 'bg-orange-500 text-white shadow-sm ring-2 ring-orange-300'
                  : 'text-orange-700 hover:bg-orange-50'
              }`}
            >
              P2 High ({summary.P2})
            </button>

            <button
              onClick={() => setPriorityFilter('P3')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                priorityFilter === 'P3'
                  ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-300'
                  : 'text-amber-700 hover:bg-amber-50'
              }`}
            >
              P3 Med ({summary.P3})
            </button>

            <button
              onClick={() => setPriorityFilter('P4')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                priorityFilter === 'P4'
                  ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-300'
                  : 'text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              P4 Low ({summary.P4})
            </button>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="ml-1 px-2.5 py-1 bg-civic-100/80 rounded-xl text-xs font-medium text-civic-700 border border-civic-200 focus:outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer"
            >
              <option value="ALL">Status: All</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>
        </div>

        {/* Right Side: Search & Layer Toggles */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder="Search location or #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-52 md:w-64 pl-9 pr-8 py-2 bg-white/90 backdrop-blur-md rounded-xl text-xs font-medium text-civic-800 placeholder-civic-400 border border-white/60 shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
            />
            <Search className="w-4 h-4 text-civic-400 absolute left-3 top-2.5" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setTimeout(fetchData, 10);
                }}
                className="absolute right-2.5 top-2.5 text-civic-400 hover:text-civic-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

          {/* Incident Hotspot Toggle */}
          <button
            onClick={() => setShowIncidents(!showIncidents)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-lg border transition-all ${
              showIncidents
                ? 'bg-red-50 text-red-700 border-red-200'
                : 'bg-white/90 text-civic-600 border-white/60 hover:bg-civic-50'
            }`}
            title="Toggle Incident Hotspot Zones"
          >
            <Radio className={`w-3.5 h-3.5 ${showIncidents ? 'text-red-600 animate-pulse' : 'text-civic-400'}`} />
            <span className="hidden sm:inline">Incident Zones</span> ({incidents.length})
          </button>

          {/* Reset Center */}
          <button
            onClick={handleResetView}
            className="p-2.5 bg-white/90 backdrop-blur-md rounded-xl text-civic-600 hover:text-primary-600 hover:bg-white shadow-lg border border-white/60 transition-all"
            title="Recenter Map"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-primary-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* ─── Map Canvas ────────────────────────────────────────── */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* ─── Map Navigation Floating Buttons ─────────────────── */}
      <div className="absolute bottom-6 right-6 z-[400] flex flex-col gap-1.5 shadow-lg">
        <button
          onClick={() => mapRef.current?.zoomIn()}
          className="w-10 h-10 bg-white/95 backdrop-blur-md hover:bg-white text-civic-700 rounded-t-xl flex items-center justify-center border border-civic-200/80 transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => mapRef.current?.zoomOut()}
          className="w-10 h-10 bg-white/95 backdrop-blur-md hover:bg-white text-civic-700 rounded-b-xl flex items-center justify-center border-x border-b border-civic-200/80 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
      </div>

      {/* ─── Bottom-Left Map Legend ─────────────────────────── */}
      <div className="absolute bottom-6 left-6 z-[400] bg-white/90 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-white/60 hidden md:block">
        <p className="text-[10px] font-bold uppercase tracking-wider text-civic-400 mb-2">Priority Legend</p>
        <div className="flex items-center gap-4 text-xs font-medium text-civic-700">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500 shadow-sm shadow-red-500/50" />
            <span>P1 Critical (80-100)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-orange-500" />
            <span>P2 High (60-79)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500" />
            <span>P3 Medium (40-59)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            <span>P4 Low (&lt;40)</span>
          </div>
        </div>
      </div>

      {/* ─── Inspector Drawer (When Marker Clicked) ──────────── */}
      {selectedComplaint && (
        <div className="absolute bottom-6 right-6 sm:right-20 z-[500] w-[calc(100%-3rem)] sm:w-96 glass-card p-5 shadow-2xl border border-primary-200/50 animate-fade-in">
          <div className="flex items-start justify-between gap-2 pb-3 border-b border-civic-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-md">
                  {selectedComplaint.complaint_number}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-bold text-white ${
                    selectedComplaint.priority_level === 'P1'
                      ? 'bg-red-600'
                      : selectedComplaint.priority_level === 'P2'
                      ? 'bg-orange-500'
                      : selectedComplaint.priority_level === 'P3'
                      ? 'bg-amber-500'
                      : 'bg-emerald-600'
                  }`}
                >
                  {selectedComplaint.priority_level} • CIS {selectedComplaint.priority_score}
                </span>
              </div>
              <h3 className="text-sm font-bold text-civic-900 mt-1 line-clamp-1">{selectedComplaint.title}</h3>
            </div>
            <button
              onClick={() => setSelectedComplaint(null)}
              className="text-civic-400 hover:text-civic-600 p-1 rounded-lg hover:bg-civic-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-civic-600 mt-3 line-clamp-2">{selectedComplaint.description}</p>

          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-civic-100 text-xs">
            <div>
              <span className="text-civic-400 block text-[10px] uppercase">Category</span>
              <span className="font-semibold text-civic-800">{selectedComplaint.category}</span>
            </div>
            <div>
              <span className="text-civic-400 block text-[10px] uppercase">Status</span>
              <span className="font-semibold text-civic-800 capitalize">{selectedComplaint.status.toLowerCase().replace('_', ' ')}</span>
            </div>
            <div className="col-span-2">
              <span className="text-civic-400 block text-[10px] uppercase">Location</span>
              <span className="font-medium text-civic-700 truncate block">{selectedComplaint.location_text}</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-civic-100 flex items-center justify-between">
            <span className="text-[11px] text-civic-400">
              Coords: {selectedComplaint.latitude.toFixed(4)}, {selectedComplaint.longitude.toFixed(4)}
            </span>
            <Link
              to={`/complaints/${selectedComplaint.id}`}
              className="inline-flex items-center gap-1 text-xs font-bold text-primary-600 hover:text-primary-700 transition-colors"
            >
              Inspect Grievance <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* ─── Incident Cluster Inspector ─────────────────────── */}
      {selectedIncident && (
        <div className="absolute bottom-6 right-6 sm:right-20 z-[500] w-[calc(100%-3rem)] sm:w-96 glass-card p-5 shadow-2xl border border-red-300 animate-fade-in">
          <div className="flex items-start justify-between gap-2 pb-3 border-b border-red-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-red-600" /> Incident Cluster
                </span>
                <span className="text-xs font-semibold text-civic-600">
                  {selectedIncident.complaint_count} Grievances Linked
                </span>
              </div>
              <h3 className="text-sm font-bold text-civic-900 mt-1">{selectedIncident.title}</h3>
            </div>
            <button
              onClick={() => setSelectedIncident(null)}
              className="text-civic-400 hover:text-civic-600 p-1 rounded-lg hover:bg-civic-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {selectedIncident.description && (
            <p className="text-xs text-civic-600 mt-2">{selectedIncident.description}</p>
          )}

          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-civic-100 text-xs">
            <div>
              <span className="text-civic-400 block text-[10px] uppercase">Category</span>
              <span className="font-semibold text-civic-800">{selectedIncident.category}</span>
            </div>
            <div>
              <span className="text-civic-400 block text-[10px] uppercase">Cluster Radius</span>
              <span className="font-semibold text-civic-800">{Math.round(selectedIncident.radius)} meters</span>
            </div>
            <div>
              <span className="text-civic-400 block text-[10px] uppercase">Impacted Population</span>
              <span className="font-semibold text-civic-800">{selectedIncident.affected_population}</span>
            </div>
            <div>
              <span className="text-civic-400 block text-[10px] uppercase">Status</span>
              <span className="font-semibold text-civic-800">{selectedIncident.status}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
