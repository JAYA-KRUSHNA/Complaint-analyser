import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  variant?: 'default' | 'compact';
}

export default function EmptyState({ icon, title, description, action, variant = 'default' }: EmptyStateProps) {
  const isCompact = variant === 'compact';

  return (
    <div className={`flex flex-col items-center justify-center text-center ${isCompact ? 'py-8 px-4' : 'py-16 px-6'}`}>
      {/* Decorative background */}
      <div className="relative mb-4">
        <div
          className={`rounded-2xl flex items-center justify-center ${isCompact ? 'w-12 h-12' : 'w-16 h-16'}`}
          style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(139, 92, 246, 0.06))',
            border: '1px solid rgba(99, 102, 241, 0.1)',
          }}
        >
          <div className={`text-indigo-400 ${isCompact ? '' : ''}`}>
            {icon || <Inbox className={isCompact ? 'w-5 h-5' : 'w-7 h-7'} />}
          </div>
        </div>
        {/* Subtle glow */}
        {!isCompact && (
          <div
            className="absolute inset-0 rounded-2xl -z-10 blur-xl opacity-40"
            style={{ background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15), transparent 70%)' }}
          />
        )}
      </div>

      <h3 className={`font-bold text-civic-700 font-display ${isCompact ? 'text-sm' : 'text-base'}`}>
        {title}
      </h3>

      {description && (
        <p className={`text-civic-400 mt-1.5 max-w-xs leading-relaxed ${isCompact ? 'text-xs' : 'text-sm'}`}>
          {description}
        </p>
      )}

      {action && <div className={isCompact ? 'mt-4' : 'mt-6'}>{action}</div>}
    </div>
  );
}
