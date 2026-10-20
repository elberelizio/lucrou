export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-w-[1200px] min-h-screen bg-creme text-texto">
      {children}
    </div>
  );
}
