import { StatusPreco } from '@/lib/types';

interface StatusCardProps {
  status: StatusPreco;
  children: React.ReactNode;
}

export default function StatusCard({ status, children }: StatusCardProps) {
  const cores = {
    bom: 'bg-mint-2',
    limite: 'bg-yellow-50',
    prejuizo: 'bg-red-50',
  }[status];

  const icons: Record<string, string> = {
    bom: '✅',
    limite: '⚠️',
    prejuizo: '❌',
  };

  return (
    <div className={`${cores} rounded-[20px] p-[18px] flex items-center gap-3.5`}>
      <div className="text-[28px]">{icons[status] || '❓'}</div>
      <div className="flex-1">{children}</div>
    </div>
  );
}
