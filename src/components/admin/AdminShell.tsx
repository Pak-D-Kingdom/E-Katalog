
import Sidebar from "./Sidebar";

interface AdminShellProps {
  children: React.ReactNode;
}

export default function AdminShell({ children }: AdminShellProps) {
  return (
    <div className="min-h-screen bg-[#F2F5FC]">
      {/* Sidebar tetap di sebelah kiri */}
      <aside className="fixed left-0 top-0 z-50 h-screen w-[230px]">
        <Sidebar />
      </aside>

      {/* Konten utama bergeser mengikuti lebar sidebar */}
      <main className="ml-[230px] min-h-screen min-w-0">
        {children}
      </main>
    </div>
  );
}
