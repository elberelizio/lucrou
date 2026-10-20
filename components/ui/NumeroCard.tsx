interface NumeroCardProps {
  label: string;
  valor: string;
  destacado?: boolean;
}

export default function NumeroCard({ label, valor, destacado = false }: NumeroCardProps) {
  return (
    <div className="bg-white rounded-[18px] p-4 shadow-card text-center">
      <p className="text-[11px] text-texto-cl mb-1.5 tracking-wide">{label}</p>
      <p className={`font-serif text-[22px] ${destacado ? 'text-verde' : 'text-texto'}`}>
        {valor}
      </p>
    </div>
  );
}
