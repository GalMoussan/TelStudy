interface CardProps {
  children: React.ReactNode;
  padding?: 'sm' | 'md' | 'lg';
  className?: string;
}

const paddingClasses = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export function Card({ children, padding = 'md', className = '' }: CardProps) {
  return (
    <div
      className={`border border-[var(--border)] bg-[var(--surface)] ${paddingClasses[padding]} ${className}`}
    >
      {children}
    </div>
  );
}
