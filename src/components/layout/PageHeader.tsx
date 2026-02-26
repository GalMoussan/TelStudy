interface PageHeaderProps {
  title: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, action }: PageHeaderProps) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <h1 className="font-mono text-xl font-semibold text-[var(--text)]">{title}</h1>
      {action && <div>{action}</div>}
    </div>
  );
}
