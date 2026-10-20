interface SeccaoTituloProps {
  children: React.ReactNode;
}

export default function SeccaoTitulo({ children }: SeccaoTituloProps) {
  return (
    <h3 className="text-xs font-bold text-texto-med uppercase tracking-wider mb-3">
      {children}
    </h3>
  );
}
