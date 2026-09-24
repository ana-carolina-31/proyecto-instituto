import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import Link from "next/link";

export const revalidate = 0;

interface RegistroAsistenciaDocente {
  id: number;
  tipo: string;
  estado: string;
  fechaHora: Date;
  observacion?: string | null;
}

export default async function AsistenciaProfesorConsultaPage() {
  const usuarioClerk = await currentUser();
  const emailDocente = usuarioClerk?.emailAddresses[0]?.emailAddress?.toLowerCase().trim() || "";

  // Buscamos al docente autenticado
  const docente = await prisma.usuario.findFirst({
    where: {
      email: { equals: emailDocente, mode: "insensitive" }
    }
  });

  // Obtenemos solo sus registros
  const asistencias: RegistroAsistenciaDocente[] = docente
    ? await prisma.asistenciaProfesor.findMany({
        where: { idProfesor: docente.id },
        orderBy: { fechaHora: "desc" },
        take: 30
      })
    : [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-blue-900 border-l-8 border-yellow-400 p-6 rounded-2xl shadow-md text-white gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mi Historial de Asistencia</h1>
          <p className="text-blue-100 text-sm mt-1">
            Profesor: <strong className="text-yellow-300">{docente ? `${docente.apellidos} ${docente.nombre}` : "Docente"}</strong> • Horario Pactado: <span className="font-mono font-bold text-yellow-300">{(docente as { horaIngreso?: string })?.horaIngreso || "07:30"}</span>
          </p>
        </div>
        <Link
          href="/panel-de-control/profesor"
          className="bg-yellow-400 hover:bg-yellow-500 text-blue-950 px-4 py-2 rounded-lg text-xs font-bold transition shadow-sm"
        >
          &larr; Volver al Panel
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="border-b pb-4 mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-blue-900">Registros Oficiales de Ingreso y Salida</h2>
          <span className="text-xs text-gray-500 font-medium">Marcados en Portería / Dirección</span>
        </div>

        {asistencias.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <span className="text-4xl block mb-2">⏱️</span>
            <p className="text-sm">Aún no tienes registros de asistencia marcados en el sistema.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-700 border-b text-xs uppercase">
                <tr>
                  <th className="p-3">Fecha</th>
                  <th className="p-3 text-center">Tipo</th>
                  <th className="p-3 text-center">Hora Marcada</th>
                  <th className="p-3 text-center">Estado</th>
                  <th className="p-3">Observación</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {asistencias.map((reg) => (
                  <tr key={reg.id} className="hover:bg-gray-50">
                    <td className="p-3 font-semibold text-gray-800">
                      {new Date(reg.fechaHora).toLocaleDateString("es-ES", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric"
                      })}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        reg.tipo === "ENTRADA" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                      }`}>
                        {reg.tipo}
                      </span>
                    </td>
                    <td className="p-3 text-center font-mono text-xs font-bold text-gray-700">
                      {new Date(reg.fechaHora).toLocaleTimeString("es-ES", {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        reg.estado === "PRESENTE" ? "bg-green-100 text-green-800" :
                        reg.estado === "ATRASO" ? "bg-yellow-100 text-yellow-800" :
                        reg.estado === "LICENCIA" ? "bg-blue-100 text-blue-800" : "bg-red-100 text-red-800"
                      }`}>
                        {reg.estado}
                      </span>
                    </td>
                    <td className="p-3 text-xs text-gray-500">{reg.observacion || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}