type BadgeVariant = 'default' | 'success' | 'error' | 'warning' | 'correct' | 'incorrect' | 'pending';

interface BadgeProps {
  label?: string;
  variant?: BadgeVariant;
  children?: React.ReactNode;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-[var(--surface)] text-[var(--text)] border-[var(--border)]',
  success: 'bg-[#052e16] text-[var(--success)] border-[#16a34a]',
  error: 'bg-[#450a0a] text-[var(--error)] border-[#dc2626]',
  warning: 'bg-[#431407] text-[#fb923c] border-[#c2410c]',
  correct: 'bg-[#052e16] text-[var(--success)] border-[#16a34a]',
  incorrect: 'bg-[#450a0a] text-[var(--error)] border-[#dc2626]',
  pending: 'bg-[var(--surface)] text-[var(--muted)] border-[var(--border)]',
};

export function Badge({ label, variant = 'default', children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center font-mono text-xs px-2 py-0.5 border ${variantClasses[variant]}`}
    >
      {label ?? children}
    </span>
  );
}
