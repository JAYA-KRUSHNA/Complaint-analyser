export const CATEGORIES = [
  { value: 'WATER_SUPPLY', label: 'Water Supply', icon: '💧' },
  { value: 'ELECTRICITY', label: 'Electricity', icon: '⚡' },
  { value: 'ROAD_DAMAGE', label: 'Road Damage', icon: '🚧' },
  { value: 'SEWAGE', label: 'Sewage', icon: '🚰' },
  { value: 'GARBAGE', label: 'Garbage Collection', icon: '🗑️' },
  { value: 'STREETLIGHT', label: 'Streetlight', icon: '💡' },
  { value: 'TRAFFIC', label: 'Traffic', icon: '🚦' },
  { value: 'PUBLIC_SAFETY', label: 'Public Safety', icon: '🛡️' },
  { value: 'ANIMAL_CONTROL', label: 'Animal Control', icon: '🐕' },
  { value: 'DRAINAGE', label: 'Drainage', icon: '🌊' },
  { value: 'ILLEGAL_DUMPING', label: 'Illegal Dumping', icon: '🚫' },
  { value: 'OTHER', label: 'Other', icon: '📋' },
] as const;

export const STATUS_MAP: Record<string, { label: string; class: string; color: string }> = {
  SUBMITTED: { label: 'Submitted', class: 'badge-submitted', color: '#2563eb' },
  UNDER_REVIEW: { label: 'Under Review', class: 'badge-under-review', color: '#ca8a04' },
  ASSIGNED: { label: 'Assigned', class: 'badge-assigned', color: '#4f46e5' },
  IN_PROGRESS: { label: 'In Progress', class: 'badge-in-progress', color: '#ea580c' },
  ESCALATED: { label: 'Escalated', class: 'badge-escalated', color: '#dc2626' },
  RESOLVED: { label: 'Resolved', class: 'badge-resolved', color: '#16a34a' },
  REJECTED: { label: 'Rejected', class: 'badge-rejected', color: '#6b7280' },
  CLOSED: { label: 'Closed', class: 'badge-closed', color: '#525252' },
};

export const PRIORITY_MAP: Record<string, { label: string; class: string }> = {
  CRITICAL: { label: 'Critical', class: 'priority-critical' },
  HIGH: { label: 'High', class: 'priority-high' },
  MEDIUM: { label: 'Medium', class: 'priority-medium' },
  LOW: { label: 'Low', class: 'priority-low' },
};

export function getStatusBadge(status: string) {
  return STATUS_MAP[status] || { label: status, class: 'badge', color: '#6b7280' };
}

export function getPriorityBadge(priority: string) {
  return PRIORITY_MAP[priority] || { label: priority, class: 'badge' };
}

export function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function timeAgo(dateStr: string) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
