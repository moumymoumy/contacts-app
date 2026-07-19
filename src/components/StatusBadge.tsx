export default function StatusBadge({
  statut,
}: {
  statut: 'rentable' | 'equilibre' | 'perte';
}) {
  const config = {
    rentable: { label: 'Rentable', emoji: '🟢', className: 'bg-success/10 text-success' },
    equilibre: { label: 'Équilibre', emoji: '🟠', className: 'bg-warning/10 text-warning' },
    perte: { label: 'Perte', emoji: '🔴', className: 'bg-danger/10 text-danger' },
  }[statut];

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${config.className}`}>
      <span>{config.emoji}</span>
      {config.label}
    </span>
  );
}
