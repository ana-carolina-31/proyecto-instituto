import Link from "next/link";
import Image from "next/image";

export default function Menu() {
  return (
    <div className="w-64 bg-[#0A10CC] text-white min-h-screen flex flex-col shadow-lg border-r-4 border-yellow-400">
      <div className="p-5 border-b border-blue-900/50 flex items-center gap-3 bg-black/10">
        <div className="relative w-11 h-11 bg-white rounded-full p-1 flex items-center justify-center shadow-md shrink-0">
          <Image src="/logo.png" alt="Escudo Don Bosco" width={38} height={38} className="object-contain" priority />
        </div>
        <div>
          <h2 className="text-sm font-extrabold tracking-wider text-white leading-tight">UNIDAD EDUCATIVA LIBERTAD EN LAS AMERICAS DON BOSCO</h2>
          <p className="text-xs text-yellow-400 font-medium">Administración</p>
        </div>
      </div>

      <nav className="p-4 flex flex-col gap-1.5 text-sm font-medium">
        <Link href="/panel-de-control/admin" className="p-3 rounded-md hover:bg-white/10 transition flex items-center gap-3">📊 Inicio</Link>
        <Link href="/panel-de-control/admin/comunicados" className="p-3 rounded-md hover:bg-white/10 transition flex items-center gap-3">📢 Comunicados</Link>
        <Link href="/panel-de-control/admin/estudiante" className="p-3 rounded-md hover:bg-white/10 transition flex items-center gap-3">🎓 Estudiantes</Link>
        <Link href="/panel-de-control/admin/profesor" className="p-3 rounded-md hover:bg-white/10 transition flex items-center gap-3">👨‍🏫 Profesores</Link>
        <Link href="/panel-de-control/admin/padres" className="p-3 rounded-md hover:bg-white/10 transition flex items-center gap-3">👨‍👩‍👧‍👦 Padres de Familia</Link>
        
        <div className="my-2 border-t border-blue-800"></div>

        <Link href="/panel-de-control/admin/calificaciones" className="p-3 rounded-md hover:bg-white/10 transition flex items-center gap-3">📝 Calificaciones</Link>
        <Link href="/panel-de-control/admin/asistencias" className="p-3 rounded-md hover:bg-white/10 transition flex items-center gap-3">📅 Asistencia Estudiantes</Link>
        <Link href="/panel-de-control/admin/profesot/asistencia" className="p-3 rounded-md hover:bg-white/10 transition flex items-center gap-3 text-yellow-400 font-bold border-l-4 border-yellow-400 bg-white/5">📋 Asistencia Pocente</Link>
      </nav>

      {/* AQUÍ ESTÁ EL BOTÓN DE VOLVER (mt-auto lo empuja hasta abajo del todo) */}
      <div className="p-4 border-t border-blue-900/50 mt-auto">
        <Link href="/" className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white p-3 rounded-md transition-colors text-sm font-bold shadow-md w-full">
          🚪 Volver al Inicio
        </Link>
      </div>
    </div>
  );
}