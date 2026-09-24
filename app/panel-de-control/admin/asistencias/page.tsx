import { 
  registrarAsistencia, 
  actualizarAsistencia 
} from "@/acciones/asistencias";
import { obtenerprofesor } from "@/acciones/calificaciones";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import FormularioAutomatico from "@/componentes/formulario-automatico"; 
import BotonesExportar from "@/componentes/botones-exportar";

export const revalidate = 0;

export default async function PaginaAsistenciasAdmin(props: { searchParams: Promise<{ curso?: string }> }) {
  const searchParams = await props.searchParams;
  const cursoSeleccionado = searchParams?.curso || "";
  
  const profesor = await obtenerprofesor();
  const fechaHoy = new Date().toISOString().split("T")[0];

  const estudiantesDelCurso = cursoSeleccionado
    ? await prisma.estudiante.findMany({
        where: { 
          curso: {
            equals: cursoSeleccionado,
            mode: "insensitive"
          }
        },
        orderBy: [{ apellidos: 'asc' }, { nombres: 'asc' }]
      })
    : [];

  const idsEstudiantesDelCurso = estudiantesDelCurso.map(e => e.id);

  const asistencias = cursoSeleccionado
    ? await prisma.asistenciaEstudiante.findMany({
        where: { idEstudiante: { in: idsEstudiantesDelCurso } },
        include: { estudiante: true, profesor: true },
        orderBy: { fecha: "desc" }
      })
    : [];

  const cursosDisponibles = [
    "Inicial (Pre-Kínder)", "Inicial (Kínder)", "1ro de Primaria", "2do de Primaria", "3ro de Primaria", "4to de Primaria", "5to de Primaria", "6to de Primaria",
    "1ro de Secundaria", "2do de Secundaria", "3ro de Secundaria", "4to de Secundaria", "5to de Secundaria", "6to de Secundaria"
  ];

  async function seleccionarCursoAccion(formData: FormData) {
    "use server";
    redirect(`/panel-de-control/admin/asistencias?curso=${encodeURIComponent(formData.get("curso")?.toString() || "")}`);
  }

  const obtenerBadgeEstado = (estado: string) => {
    switch (estado.toUpperCase()) {
      case "PRESENTE": return "bg-green-100 text-green-800 border-green-200";
      case "FALTA": return "bg-red-100 text-red-800 border-red-200";
      case "ATRASO": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "LICENCIA": return "bg-blue-100 text-blue-800 border-blue-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="space-y-6 bg-blue-50 p-4 rounded-lg border border-blue-200 print:bg-white print:border-none print:p-0">
      <div className="print:hidden">
        <h1 className="text-3xl font-bold text-blue-800">Control de Asistencias</h1>
        <p className="text-gray-500 mt-1">Selecciona un curso para registrar, corregir y exportar la asistencia escolar.</p>
      </div>

      <div className="hidden print:block text-center border-b-2 border-blue-900 pb-3 mb-6">
        <h2 className="text-2xl font-extrabold text-[#0A10CC]">UNIDAD EDUCATIVA LIBERTAD EN LAS AMÉRICAS DON BOSCO</h2>
        <p className="text-sm font-bold text-gray-700 mt-1">
          REPORTE OFICIAL DE ASISTENCIA — CURSO: {cursoSeleccionado ? cursoSeleccionado.toUpperCase() : "TODOS LOS CURSOS"}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">Fecha de Emisión: {new Date().toLocaleDateString("es-ES")}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:block">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-fit print:hidden">
          <h2 className="text-lg font-bold text-blue-800 mb-4">Registrar Asistencia</h2>
          
          <FormularioAutomatico action={seleccionarCursoAccion} className="mb-4 pb-4 border-b border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-1">1. Seleccionar Curso</label>
            <select
              name="curso"
              defaultValue={cursoSeleccionado}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 text-sm bg-white font-semibold text-blue-900"
            >
              <option value="">-- Elige un curso primero --</option>
              {cursosDisponibles.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </FormularioAutomatico>

          <form action={registrarAsistencia} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">2. Estudiante</label>
              <select name="idEstudiante" required disabled={!cursoSeleccionado} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm disabled:bg-gray-100 bg-white">
                <option value="">{cursoSeleccionado ? (estudiantesDelCurso.length > 0 ? "-- Seleccionar estudiante --" : "No hay estudiantes en este curso") : "⚠️ Carga un curso primero"}</option>
                {estudiantesDelCurso.map((est) => (
                  <option key={est.id} value={est.id}>{est.apellidos}, {est.nombres} ({est.paralelo || 'A'})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Profesor / Registrador</label>
              <select name="idProfesor" required className="w-full px-3 py-2 border rounded-md text-sm bg-white">
                <option value="">-- Seleccionar --</option>
                {profesor.map((doc: { id: number; nombre: string }) => (
                  <option key={doc.id} value={doc.id}>{doc.nombre}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Fecha</label>
                <input type="date" name="fecha" defaultValue={fechaHoy} required className="w-full px-3 py-2 border rounded-md text-sm" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Estado</label>
                <select name="estado" required className="w-full px-3 py-2 border rounded-md text-sm bg-white">
                  <option value="PRESENTE">Presente</option>
                  <option value="FALTA">Falta</option>
                  <option value="ATRASO">Atraso</option>
                  <option value="LICENCIA">Licencia</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">Observación</label>
              <input type="text" name="observacion" placeholder="Ej. Permiso médico" className="w-full px-3 py-2 border rounded-md text-sm" />
            </div>

            <button type="submit" disabled={!cursoSeleccionado || estudiantesDelCurso.length === 0} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-md transition-colors disabled:bg-gray-300 cursor-pointer">
              Guardar Asistencia
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-gray-200 print:border-none print:shadow-none print:p-0">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 print:hidden gap-3">
            <h2 className="text-lg font-bold text-blue-800">
              Historial de Asistencia {cursoSeleccionado ? `— ${cursoSeleccionado}` : ""} ({asistencias.length})
            </h2>
            
            {cursoSeleccionado && (
              <BotonesExportar 
                datos={asistencias} 
                tipo="asistencias" 
                curso={cursoSeleccionado} 
              />
            )}
          </div>

          {!cursoSeleccionado ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <span className="text-4xl block mb-2">📁</span>
              <p className="text-sm font-semibold text-gray-700">Seleccione un curso en el panel izquierdo</p>
              <p className="text-xs text-gray-500 mt-1">El historial y los botones de exportación aparecerán al elegir el curso.</p>
            </div>
          ) : asistencias.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No hay registros de asistencia para {cursoSeleccionado}.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm print:text-xs">
                <thead className="bg-gray-50 border-b print:bg-gray-200">
                  <tr>
                    <th className="p-3">Fecha</th>
                    <th className="p-3">Estudiante</th>
                    <th className="p-3 text-center">Estado</th>
                    <th className="p-3">Obs.</th>
                    <th className="p-3 text-center print:hidden">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y print:divide-gray-400">
                  {asistencias.map((asis) => (
                    <tr key={asis.id} className="hover:bg-gray-50">
                      <td className="p-3 text-gray-600 text-xs whitespace-nowrap">
                        {new Date(asis.fecha).toLocaleDateString("es-ES")}
                      </td>
                      <td className="p-3 font-medium">
                        {asis.estudiante?.apellidos} {asis.estudiante?.nombres}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-block border font-medium px-2.5 py-0.5 rounded-full text-xs print:text-black print:bg-transparent ${obtenerBadgeEstado(asis.estado)}`}>
                          {asis.estado}
                        </span>
                      </td>
                      <td className="p-3 text-xs text-gray-500">
                        {asis.observacion || "-"}
                      </td>
                      {/* Solo se permite Actualizar (se eliminó el botón de eliminar) */}
                      <td className="p-3 text-center print:hidden whitespace-nowrap">
                        <form action={actualizarAsistencia} className="inline-flex items-center gap-1.5">
                          <input type="hidden" name="id" value={asis.id} />
                          <select 
                            name="estado" 
                            defaultValue={asis.estado}
                            className="text-xs border border-gray-300 rounded p-1 bg-white focus:ring-1 focus:ring-blue-500 cursor-pointer"
                          >
                            <option value="PRESENTE">Presente</option>
                            <option value="ATRASO">Atraso</option>
                            <option value="FALTA">Falta</option>
                            <option value="LICENCIA">Licencia</option>
                          </select>
                          <button 
                            type="submit"
                            title="Actualizar estado de asistencia"
                            className="bg-blue-600 text-white px-2.5 py-1 rounded text-xs hover:bg-blue-700 transition font-bold cursor-pointer"
                          >
                            Actualizar
                          </button>
                        </form>
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