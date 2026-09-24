import { obtenerCalificaciones, crearCalificacion } from "@/acciones/calificaciones";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import BotonesExportar from "@/componentes/botones-exportar";

export const revalidate = 0;

export default async function CalificacionesProfesorPage(
  props: { searchParams: Promise<{ curso?: string }> }
) {
  const searchParams = await props.searchParams;
  const cursoSeleccionado = searchParams?.curso || "";

  const usuarioClerk = await currentUser();
  const emailProfesor = usuarioClerk?.emailAddresses[0]?.emailAddress?.toLowerCase();
  
  const profesorActual = await prisma.usuario.findFirst({
    where: { 
      email: {
        equals: emailProfesor,
        mode: "insensitive"
      } 
    }
  });

  const idProfesorReal = profesorActual?.id || 0;
  const todasLasCalificaciones = await obtenerCalificaciones();

  const estudiantesDelCurso = cursoSeleccionado
    ? await prisma.estudiante.findMany({
        where: { curso: cursoSeleccionado },
        orderBy: [{ paralelo: 'asc' }, { apellidos: 'asc' }]
      })
    : [];

  // Filtrar notas: Solo las del curso seleccionado (o todas si no eligió curso)
  const calificaciones = cursoSeleccionado
    ? todasLasCalificaciones.filter(c => estudiantesDelCurso.some(est => est.id === c.idEstudiante))
    : todasLasCalificaciones;

  const cursosDisponibles = [
    "Inicial (Pre-Kínder)", "Inicial (Kínder)", "1ro de Primaria", "2do de Primaria", "3ro de Primaria", "4to de Primaria", "5to de Primaria", "6to de Primaria",
    "1ro de Secundaria", "2do de Secundaria", "3ro de Secundaria", "4to de Secundaria", "5to de Secundaria", "6to de Secundaria"
  ];

  async function seleccionarCursoAccion(formData: FormData) {
    "use server";
    const curso = formData.get("curso")?.toString() || "";
    redirect(`/panel-de-control/profesor/calificaciones?curso=${encodeURIComponent(curso)}`);
  }

  return (
    <div className="space-y-6 print:bg-white print:p-0">
      
      {/* Encabezado visible en pantalla */}
      <div className="print:hidden">
        <h1 className="text-2xl font-bold text-gray-800">Registro de Calificaciones</h1>
        <p className="text-gray-500 mt-1">Evalúa las dimensiones pedagógicas de tus estudiantes.</p>
      </div>

      {/* Encabezado exclusivo para PDF / Impresión */}
      <div className="hidden print:block text-center border-b-2 border-blue-900 pb-3 mb-6">
        <h2 className="text-xl font-bold text-[#0A10CC]">UNIDAD EDUCATIVA LIBERTAD EN LAS AMÉRICAS DON BOSCO</h2>
        <p className="text-sm font-semibold text-gray-700">Reporte de Calificaciones — {cursoSeleccionado || "General"}</p>
        <p className="text-xs text-gray-500">Docente: {profesorActual?.nombre} {profesorActual?.apellidos}</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 print:block">
        
        {/* Formulario de registro (oculto al imprimir) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit print:hidden">
          <h2 className="text-lg font-semibold text-[#0A10CC] mb-4">Ingresar Notas</h2>
          
          <form action={seleccionarCursoAccion} className="mb-4 pb-4 border-b border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-1">1. Seleccionar Curso</label>
            <select
              name="curso"
              defaultValue={cursoSeleccionado}
              required
              onChange={(e) => e.target.form?.requestSubmit()}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0A10CC] text-sm bg-white"
            >
              <option value="">-- Elige un curso primero --</option>
              {cursosDisponibles.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </form>

          <form action={crearCalificacion} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estudiante</label>
              <select name="idEstudiante" required disabled={!cursoSeleccionado} className="w-full border-gray-300 rounded-md p-2 border disabled:bg-gray-100 text-sm bg-white">
                <option value="">{cursoSeleccionado ? "-- Seleccionar estudiante --" : "⚠️ Carga un curso primero"}</option>
                {estudiantesDelCurso.map((est) => (
                  <option key={est.id} value={est.id}>[{est.paralelo}] {est.apellidos}, {est.nombres}</option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Materia</label>
                <input type="text" name="materia" required placeholder="Ej. Matemáticas" defaultValue={profesorActual?.materia || ""} disabled={!cursoSeleccionado} className="w-full border-gray-300 rounded-md p-2 border text-sm disabled:bg-gray-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trimestre</label>
                <select name="trimestre" required disabled={!cursoSeleccionado} className="w-full border-gray-300 rounded-md p-2 border text-sm disabled:bg-gray-100 bg-white">
                  <option value="1er Trimestre">1er Trimestre</option>
                  <option value="2do Trimestre">2do Trimestre</option>
                  <option value="3er Trimestre">3er Trimestre</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 border-t pt-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Ser (10)</label>
                <input type="number" step="0.01" name="ser" min="0" max="10" placeholder="0" required className="w-full border-gray-300 rounded-md p-1.5 border text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Saber (45)</label>
                <input type="number" step="0.01" name="saber" min="0" max="45" placeholder="0" required className="w-full border-gray-300 rounded-md p-1.5 border text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Hacer (40)</label>
                <input type="number" step="0.01" name="hacer" min="0" max="40" placeholder="0" required className="w-full border-gray-300 rounded-md p-1.5 border text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Autoev. (5)</label>
                <input type="number" step="0.01" name="autoevaluacion" min="0" max="5" placeholder="0" required className="w-full border-gray-300 rounded-md p-1.5 border text-sm" />
              </div>
            </div>

            <input type="hidden" name="idProfesor" value={String(idProfesorReal)} /> 
            <button type="submit" disabled={!cursoSeleccionado} className="w-full bg-[#0A10CC] hover:bg-blue-900 text-white py-2.5 rounded-md font-bold mt-2 transition-colors text-sm disabled:bg-gray-300 cursor-pointer">
              Guardar Calificación
            </button>
          </form>
        </div>

        {/* Historial con botones de descarga oficial */}
        <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6 print:border-none print:shadow-none print:p-0">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 print:hidden gap-3">
            <h3 className="font-bold text-gray-800 text-lg">
              Notas Registradas {cursoSeleccionado ? `en ${cursoSeleccionado}` : ""} ({calificaciones.length})
            </h3>
            
            <BotonesExportar 
              datos={calificaciones} 
              tipo="calificaciones" 
              curso={cursoSeleccionado || "General"} 
            />
          </div>

          {calificaciones.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <span className="text-3xl block mb-2">📊</span>
              <p className="text-sm">No hay calificaciones registradas para este curso.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm print:text-xs">
                <thead className="bg-gray-50 text-gray-700 border-b border-gray-200 print:bg-gray-100">
                  <tr>
                    <th className="px-3 py-2.5 font-semibold">Estudiante</th>
                    <th className="px-3 py-2.5 font-semibold">Materia</th>
                    <th className="px-3 py-2.5 text-center font-semibold">Trimestre</th>
                    <th className="px-3 py-2.5 text-center font-semibold">Ser</th>
                    <th className="px-3 py-2.5 text-center font-semibold">Saber</th>
                    <th className="px-3 py-2.5 text-center font-semibold">Hacer</th>
                    <th className="px-3 py-2.5 text-center font-semibold">Auto</th>
                    <th className="px-3 py-2.5 text-center font-semibold">Nota Final</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {calificaciones.map((cal) => (
                    <tr key={cal.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2.5 font-medium text-gray-900">
                        {cal.estudiante?.apellidos} {cal.estudiante?.nombres}
                      </td>
                      <td className="px-3 py-2.5 text-gray-600 text-xs">{cal.materia}</td>
                      <td className="px-3 py-2.5 text-center text-xs text-gray-500">{cal.trimestre}</td>
                      <td className="px-3 py-2.5 text-center text-xs">{cal.ser}</td>
                      <td className="px-3 py-2.5 text-center text-xs">{cal.saber}</td>
                      <td className="px-3 py-2.5 text-center text-xs">{cal.hacer}</td>
                      <td className="px-3 py-2.5 text-center text-xs">{cal.autoevaluacion}</td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={`inline-block font-bold px-2 py-0.5 rounded text-xs print:text-black print:bg-transparent ${
                          cal.notaFinal >= 51 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {cal.notaFinal} pts
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
    </div>
  );
}