import Link from "next/link";
import Image from "next/image";
import { UserButton, SignOutButton } from "@clerk/nextjs";
import BotonVolver from "@/componentes/boton-volver"; // <--- Importamos el botón dinámico

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const menuItems = [
    { label: "Panel de Control", href: "/panel-de-control/admin", icon: "📊" },
    { label: "Estudiantes", href: "/panel-de-control/admin/estudiante", icon: "🎓" },
    { label: "Profesores", href: "/panel-de-control/admin/profesor", icon: "👨‍🏫" },
    { label: "Padres de Familia", href: "/panel-de-control/admin/padres", icon: "👨‍👩‍👦" },
    { label: "Calificaciones", href: "/panel-de-control/admin/calificaciones", icon: "📝" },
    { label: "Asistencias", href: "/panel-de-control/admin/asistencias", icon: "📅" },
    { label: "Comunicados", href: "/panel-de-control/admin/comunicados", icon: "📢" },
  ];

  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden">
      <aside className="w-64 bg-[#0A10CC] text-white border-r border-blue-950 flex flex-col justify-between shadow-2xl h-screen shrink-0 print:hidden">
        
        <div className="overflow-y-auto">
          <div className="p-5 border-b border-blue-900 flex flex-col items-center text-center gap-2 bg-black/10">
            <Image
              src="/logo.png"
              alt="Logo Don Bosco"
              width={100}
              height={75}
              className="rounded-full bg-white p-1 object-contain shadow-md"
              priority
            />
            <div>
              <h2 className="text-xs font-extrabold text-[#F2D707] leading-tight mt-0.5">Unidad Educativa</h2>
              <p className="text-xs font-extrabold text-[#F2D707] leading-tight mt-0.5">
                Libertad En Las Americas Don Bosco
              </p>
            </div>
          </div>

          <nav className="p-1 space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium text-[#F2D707] rounded-lg hover:bg-blue-900 hover:text-yellow-300 transition-colors"
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-4 border-t border-blue-900 flex flex-col gap-3 bg-blue-950/50">
          <div className="flex items-center gap-3">
            <UserButton />
            <div className="text-left">
              <p className="text-sm font-semibold text-[#F2D707]">Administrador</p>
              <p className="text-xs text-gray-300">Sesión activa</p>
            </div>
          </div>

          {/* BOTÓN DINÁMICO DE VOLVER ATRÁS */}
          <BotonVolver />

          <SignOutButton redirectUrl="/iniciar-sesion">
            <button
              title="Cerrar sesión"
              className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg shadow transition-colors cursor-pointer"
            >
              <span>🚪</span> Cerrar Sesión
            </button>
          </SignOutButton>
        </div>
      </aside>

      <main className="flex-1 min-w-0 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}