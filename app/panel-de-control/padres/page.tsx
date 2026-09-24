import { currentUser } from "@clerk/nextjs/server";
import { SignOutButton, UserButton } from "@clerk/nextjs";
import { obtenerDatosPadrePorEmail, obtenerComunicadosPadres } from "@/acciones/panel-padre";
import { marcarComunicadoComoLeido } from "@/acciones/comunicados";
import prisma from "@/lib/prisma";

export default async function PanelPadrePage() {
  const usuarioClerk = await currentUser();
  const emailPadre = usuarioClerk?.emailAddresses[0]?.emailAddress || "";
  
  const datosPadre = await obtenerDatosPadrePorEmail(emailPadre);
  const comunicados = await obtenerComunicadosPadres();

  const lecturasPadre = datosPadre ? await prisma.lecturaComunicado.findMany({
    where: { idPadre: datosPadre.id },
    select: { comunicadoId: true }
  }) : [];
  const idsLeidos = new Set(lecturasPadre.map(l => l.comunicadoId));

  if (!datosPadre) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <span className="text-6xl">🚷</span>
        <h1 className="text-2xl font-bold text-blue-900">Acceso Restringido</h1>
        <p className="text-gray-600 max-w-md">
          Tu correo electrónico ({emailPadre}) no está vinculado a ningún estudiante en nuestro sistema.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Banner Principal con Botón de Salida */}
      <div className="bg-blue-900 border-l-8 border-yellow-400 rounded-2xl p-8 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">¡Bienvenido/a {datosPadre.nombre}!</h1>
          <p className="mt-2 text-blue-100 font-medium">
            Rendimiento académico de tus {datosPadre.estudiantes.length} hijo(s) y avisos institucionales.
          </p>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto">
          <UserButton />
          <SignOutButton redirectUrl="/iniciar-sesion">
            <button
              type="button"
              title="Cerrar sesión"
              className="bg-yellow-500 hover:bg-yellow-600 text-blue-950 font-bold px-4 py-2.5 rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>🚪</span> Cerrar Sesión
            </button>
          </SignOutButton>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Columna Izquierda: Hijos y Calificaciones */}
        <div className="xl:col-span-2 space-y-6">
          <div className="flex items-center space-x-2 border-b-2 border-blue-900 pb-2">
            <span className="text-2xl">📚</span>
            <h2 className="text-xl font-bold text-blue-900">Rendimiento Académico de tus Hijos</h2>
          </div>
          
          {datosPadre.estudiantes.length === 0 ? (
            <div className="bg-white p-6 rounded-xl border border-gray-200 text-center">
              <p className="text-gray-500">No tienes estudiantes asignados actualmente.</p>
            </div>
          ) : (
            datosPadre.estudiantes.map((hijo) => (
              <div key={hijo.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                <div className="bg-blue-50 px-6 py-4 border-b border-blue-100 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold text-blue-900">🎓 {hijo.nombres} {hijo.apellidos}</h3>
                    <p className="text-sm font-medium text-blue-700">Curso: {hijo.curso || "No asignado"} ({hijo.paralelo || "S/P"})</p>
                  </div>
                  <span className="bg-yellow-400 text-blue-950 text-xs px-3 py-1 rounded-full font-bold uppercase shadow-sm">
                    Estudiante Activo
                  </span>
                </div>
                
                <div className="p-6">
                  {hijo.calificaciones.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">El estudiante aún no tiene calificaciones registradas.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="text-blue-900 bg-blue-50/50 border-b border-gray-200">
                          <tr>
                            <th className="py-2.5 px-3 font-semibold">Materia</th>
                            <th className="py-2.5 px-3 font-semibold">Trimestre</th>
                            <th className="py-2.5 text-center font-semibold text-xs">Ser (10)</th>
                            <th className="py-2.5 text-center font-semibold text-xs">Saber (45)</th>
                            <th className="py-2.5 text-center font-semibold text-xs">Hacer (40)</th>
                            <th className="py-2.5 text-center font-semibold text-xs">Auto (5)</th>
                            <th className="py-2.5 px-3 text-center font-bold text-blue-900">Nota Final</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {hijo.calificaciones.map((nota) => (
                            <tr key={nota.id} className="hover:bg-blue-50/30">
                              <td className="py-3 px-3 font-medium text-gray-900">{nota.materia}</td>
                              <td className="py-3 px-3 text-gray-500 text-xs">{nota.trimestre}</td>
                              <td className="py-3 text-center text-gray-600">{nota.ser}</td>
                              <td className="py-3 text-center text-gray-600">{nota.saber}</td>
                              <td className="py-3 text-center text-gray-600">{nota.hacer}</td>
                              <td className="py-3 text-center text-gray-600">{nota.autoevaluacion}</td>
                              <td className="py-3 px-3 text-center font-bold text-lg">
                                <span className={`inline-block px-2.5 py-0.5 rounded-md ${
                                  nota.notaFinal >= 51 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                }`}>
                                  {nota.notaFinal}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Columna Derecha: Muro de Comunicados con Acuse de Recibo */}
        <div>
          <div className="flex items-center space-x-2 border-b-2 border-yellow-400 pb-2 mb-6">
            <span className="text-2xl">📢</span>
            <h2 className="text-xl font-bold text-blue-900">Muro de Comunicados</h2>
          </div>
          
          {comunicados.length === 0 ? (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center">
              <p className="text-sm text-gray-500">No hay comunicados recientes.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comunicados.map((msg) => {
                const yaLeido = idsLeidos.has(msg.id);
                return (
                  <div key={msg.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:border-yellow-400 transition-colors flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2 gap-2">
                        <h3 className="font-bold text-blue-900 leading-tight">{msg.titulo}</h3>
                        <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold uppercase shrink-0">
                          {msg.dirigidoA}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-4 leading-relaxed">{msg.contenido}</p>
                    </div>
                    <div className="border-t pt-3 flex justify-between items-center">
                      <span className="text-xs text-gray-400">
                        {new Date(msg.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                      </span>
                      {yaLeido ? (
                        <span className="bg-emerald-100 text-emerald-800 text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1">
                          <span>✅</span> Visto y Leído
                        </span>
                      ) : (
                        <form action={marcarComunicadoComoLeido}>
                          <input type="hidden" name="comunicadoId" value={msg.id} />
                          <input type="hidden" name="emailPadre" value={emailPadre} />
                          <button 
                            type="submit"
                            className="bg-yellow-400 hover:bg-yellow-500 text-blue-950 font-bold px-3 py-1.5 rounded-lg text-xs shadow transition cursor-pointer"
                          >
                            ✓ Marcar como Leído
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}