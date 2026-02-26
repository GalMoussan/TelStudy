interface EmptyStateProps {
  message: string;
  action?: React.ReactNode;
}

export function EmptyState({ message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 text-[var(--muted)] text-sm font-mono">
      <p>{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
