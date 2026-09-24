import prisma from "@/lib/prisma";
import Link from "next/link";

export const revalidate = 0; // Obliga a recargar los datos siempre

export default async function AdminDashboard() {
  // Prisma cuenta rápidamente cuántos registros hay en cada tabla
  const [totalProfesores, totalEstudiantes, totalPadres, totalComunicados] = await Promise.all([
    prisma.usuario.count({ where: { rol: "PROFESOR" } }),
    prisma.estudiante.count(),
    prisma.padre.count(),
    prisma.comunicado.count()
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Panel de Administración</h1>
        <p className="text-gray-500 mt-1">Resumen general de la institución.</p>
      </div>

      {/* Tarjetas de Estadísticas Reales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Tarjeta Profesores */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-center items-center text-center">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl mb-4">
            👨‍🏫
          </div>
          <h2 className="text-3xl font-bold text-gray-800">{totalProfesores}</h2>
          <p className="text-sm font-medium text-gray-500 mt-1">Profesores</p>
        </div>

        {/* Tarjeta Estudiantes */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-center items-center text-center">
          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-2xl mb-4">
            🎓
          </div>
          <h2 className="text-3xl font-bold text-gray-800">{totalEstudiantes}</h2>
          <p className="text-sm font-medium text-gray-500 mt-1">Estudiantes</p>
        </div>

        {/* Tarjeta Padres */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-center items-center text-center">
          <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-2xl mb-4">
            👨‍👩‍👧‍👦
          </div>
          <h2 className="text-3xl font-bold text-gray-800">{totalPadres}</h2>
          <p className="text-sm font-medium text-gray-500 mt-1">Padres de Familia</p>
        </div>

        {/* Tarjeta Comunicados */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-center items-center text-center">
          <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-2xl mb-4">
            📢
          </div>
          <h2 className="text-3xl font-bold text-gray-800">{totalComunicados}</h2>
          <p className="text-sm font-medium text-gray-500 mt-1">Comunicados Emitidos</p>
        </div>

      </div>

      {/* Accesos Rápidos Intactos */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="font-semibold text-gray-800 mb-4">Accesos Rápidos</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/panel-de-control/admin/profesor" className="px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-center text-sm font-medium transition-colors border border-gray-200">
            Gestionar Profesores
          </Link>
          <Link href="/panel-de-control/admin/profesor/asistencia" className="px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-center text-sm font-medium transition-colors border border-gray-200">
            Control Asistencia Docente
          </Link>
          <Link href="/panel-de-control/admin/comunicados" className="px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-center text-sm font-medium transition-colors border border-gray-200">
            Redactar Comunicado
          </Link>
        </div>
      </div>
    </div>
  );
}