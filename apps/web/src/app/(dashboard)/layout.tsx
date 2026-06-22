// Dashboard layout — sidebar + header
// Se implementa en Sprint 1.1
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar placeholder */}
      <aside className="w-64 border-r bg-card hidden md:block" />
      <main className="flex-1 flex flex-col">
        {/* Header placeholder */}
        <header className="h-16 border-b flex items-center px-6">
          <span className="font-semibold text-sm text-muted-foreground">GymApp Admin</span>
        </header>
        <div className="flex-1 p-6">{children}</div>
      </main>
    </div>
  );
}
