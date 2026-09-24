import { 
  obtenerCalificaciones, 
  obtenerprofesor, 
  crearCalificacion, 
  actualizarCalificacion 
} from "@/acciones/calificaciones";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import FormularioAutomatico from "@/componentes/formulario-automatico"; 
import BotonesExportar from "@/componentes/botones-exportar"; 

const MATERIAS_PRIMARIA = [
  { codigo: "LCO-PRI", nombre: "Comunicación y Lenguajes" },
  { codigo: "MAT-PRI", nombre: "Matemática" },
  { codigo: "CS-PRI", nombre: "Ciencias Sociales" },
  { codigo: "CN-PRI", nombre: "Ciencias Naturales" },
  { codigo: "MUS-PRI", nombre: "Educación Musical" },
  { codigo: "EDF-PRI", nombre: "Educación Física y Deportes" },
  { codigo: "VER-PRI", nombre: "Valores Espiritualidades y Religiones" },
  { codigo: "TEC-PRI", nombre: "Técnica Tecnológica" },
  { codigo: "COMP-PRI", nombre: "Computación" },
];

const LISTA_MATERIAS_SECUNDARIA = [
  { codigo: "MAT-100", nombre: "Matemáticas" },
  { codigo: "LIT-100", nombre: "Comunicación y Lenguajes" },
  { codigo: "CS-100", nombre: "Ciencias Sociales" },
  { codigo: "BIO-100", nombre: "Ciencias Naturales - Biología y Geografía" },
  { codigo: "FIS-100", nombre: "Ciencias Naturales - Física" },
  { codigo: "QUIM-100", nombre: "Ciencias Naturales - Química" },
  { codigo: "FIL-100", nombre: "Cosmovisiones, Filosofía y Psicología" },
  { codigo: "VAL-100", nombre: "Valores, Espiritualidad y Religiones" },
  { codigo: "ING-100", nombre: "Lengua Extranjera" },
  { codigo: "ART-100", nombre: "Artes Plásticas y Visuales" },
  { codigo: "MUS-100", nombre: "Educación Musical" },
  { codigo: "EDF-100", nombre: "Educación Física y Deportes" },
  { codigo: "TEC-100", nombre: "Técnica Tecnológica Especializada" },
  { codigo: "COMP-100", nombre: "Computación" },
];

export const revalidate = 0;

export default async function PaginaCalificacionesAdmin(props: { searchParams: Promise<{ curso?: string; vista?: string }> }) {
  const searchParams = await props.searchParams;
  const cursoSeleccionado = searchParams?.curso || "";
  const vistaGeneral = searchParams?.vista === "general";
  
  const [todasLasCalificaciones, profesores] = await Promise.all([
    obtenerCalificaciones(),
    obtenerprofesor()
  ]);

  const estudiantesDelCurso = cursoSeleccionado
    ? await prisma.estudiante.findMany({
        where: { 
          curso: {
            equals: cursoSeleccionado,
            mode: "insensitive"
          }
        },
        orderBy: [{ paralelo: 'asc' }, { apellidos: 'asc' }, { nombres: 'asc' }]
      })
    : [];

  const esPrimariaOInicial = cursoSeleccionado.toLowerCase().includes("primaria") || 
                             cursoSeleccionado.toLowerCase().includes("inicial") || 
                             cursoSeleccionado.toLowerCase().includes("kínder");

  const materiasCorrespondientes = esPrimariaOInicial ? MATERIAS_PRIMARIA : LISTA_MATERIAS_SECUNDARIA;

  const cursosDisponibles = [
    "Inicial (Pre-Kínder)", "Inicial (Kínder)", "1ro de Primaria", "2do de Primaria", "3ro de Primaria", "4to de Primaria", "5to de Primaria", "6to de Primaria",
    "1ro de Secundaria", "2do de Secundaria", "3ro de Secundaria", "4to de Secundaria", "5to de Secundaria", "6to de Secundaria"
  ];

  const calificacionesFiltradas = cursoSeleccionado
    ? todasLasCalificaciones.filter(c => estudiantesDelCurso.some(est => est.id === c.idEstudiante))
    : [];

  async function seleccionarCursoAccion(formData: FormData) {
    "use server";
    redirect(`/panel-de-control/admin/calificaciones?curso=${encodeURIComponent(formData.get("curso")?.toString() || "")}`);
  }

  return (
    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 space-y-6 print:bg-white print:border-none print:p-0">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 print:hidden">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Gestión de Calificaciones</h1>
          <p className="text-gray-500 mt-1">Registro por curso y reporte general institucional.</p>
        </div>
        <div className="flex gap-2">
          <a 
            href="/panel-de-control/admin/calificaciones" 
            className={`px-4 py-2 rounded-lg text-sm font-bold transition ${!vistaGeneral ? 'bg-blue-800 text-white' : 'bg-white text-gray-700 border'}`}
          >
            📝 Registro por Curso
          </a>
          <a 
            href="/panel-de-control/admin/calificaciones?vista=general" 
            className={`px-4 py-2 rounded-lg text-sm font-bold transition ${vistaGeneral ? 'bg-blue-800 text-white' : 'bg-white text-gray-700 border'}`}
          >
            📊 Lista General Global ({todasLasCalificaciones.length})
          </a>
        </div>
      </div>

      {vistaGeneral ? (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-blue-900">Historial General de Notas (Institución Completa)</h2>
            <BotonesExportar datos={todasLasCalificaciones} tipo="calificaciones" curso="Institucion_Completa" />
          </div>
          {todasLasCalificaciones.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No hay calificaciones registradas en el sistema.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[700px]">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="p-3">Estudiante</th>
                    <th className="p-3">Materia</th>
                    <th className="p-3 text-center">Trimestre</th>
                    <th className="p-3 text-center">SER</th>
                    <th className="p-3 text-center">SABER</th>
                    <th className="p-3 text-center">HACER</th>
                    <th className="p-3 text-center">AUTO</th>
                    <th className="p-3 text-center">Nota Final</th>
                    <th className="p-3 text-center">Editar</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {todasLasCalificaciones.map((cal) => (
                    <tr key={cal.id} className="hover:bg-gray-50">
                      <td className="p-3 font-medium whitespace-nowrap">{cal.estudiante?.apellidos} {cal.estudiante?.nombres}</td>
                      <td className="p-3 text-gray-600 text-xs">{cal.materia}</td>
                      <td className="p-3 text-center text-xs">{cal.trimestre}</td>
                      
                      <td colSpan={5} className="p-0">
                        <form action={actualizarCalificacion} className="flex items-center justify-between p-2">
                          <input type="hidden" name="id" value={cal.id} />
                          <input type="number" name="ser" defaultValue={cal.ser} step="0.1" min="0" max="10" className="w-12 border rounded p-1 text-center text-xs font-mono bg-white mx-auto" />
                          <input type="number" name="saber" defaultValue={cal.saber} step="0.1" min="0" max="45" className="w-12 border rounded p-1 text-center text-xs font-mono bg-white mx-auto" />
                          <input type="number" name="hacer" defaultValue={cal.hacer} step="0.1" min="0" max="40" className="w-12 border rounded p-1 text-center text-xs font-mono bg-white mx-auto" />
                          <input type="number" name="autoevaluacion" defaultValue={cal.autoevaluacion} step="0.1" min="0" max="5" className="w-12 border rounded p-1 text-center text-xs font-mono bg-white mx-auto" />
                          <div className="w-16 text-center">
                            <span className={`font-bold px-2 py-0.5 rounded text-xs ${cal.notaFinal >= 51 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {cal.notaFinal}
                            </span>
                          </div>
                          <button type="submit" title="Guardar cambios" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-2.5 py-1 rounded text-xs transition cursor-pointer ml-1">
                            Guardar
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
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LADO IZQUIERDO: FORMULARIO */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
            <h2 className="text-lg font-bold text-[#0A10CC] mb-4">1. Seleccionar Curso y Registrar</h2>
            
            <FormularioAutomatico action={seleccionarCursoAccion} className="mb-4 pb-4 border-b border-gray-100">
              <label htmlFor="curso" className="block text-sm font-medium text-gray-700 mb-1">Curso Activo</label>
              <select
                id="curso"
                name="curso"
                defaultValue={cursoSeleccionado}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0A10CC] text-sm bg-white font-medium text-blue-900"
              >
                <option value="">-- Elige un curso primero --</option>
                {cursosDisponibles.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </FormularioAutomatico>

            <form action={crearCalificacion} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estudiante del Curso</label>
                <select name="idEstudiante" required disabled={!cursoSeleccionado} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm disabled:bg-gray-100 bg-white">
                  <option value="">{cursoSeleccionado ? (estudiantesDelCurso.length > 0 ? "-- Seleccionar estudiante --" : "No hay alumnos inscritos") : "⚠️ Carga un curso arriba"}</option>
                  {estudiantesDelCurso.map((est) => (
                    <option key={est.id} value={est.id}>[{est.paralelo || 'A'}] {est.apellidos}, {est.nombres}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Materia</label>
                <select name="materia" required disabled={!cursoSeleccionado} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm disabled:bg-gray-100 bg-white">
                  <option value="">{cursoSeleccionado ? "-- Seleccionar materia --" : "⚠️ Carga un curso primero"}</option>
                  {materiasCorrespondientes.map((mat) => (
                    <option key={mat.codigo} value={`${mat.codigo} - ${mat.nombre}`}>[{mat.codigo}] {mat.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Profesor</label>
                  <select name="idProfesor" required className="w-full px-3 py-2 border rounded-md text-sm bg-white">
                    <option value="">-- Docente --</option>
                    {profesores.map((doc: { id: number; nombre: string }) => (
                      <option key={doc.id} value={doc.id}>{doc.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Trimestre</label>
                  <select name="trimestre" required className="w-full px-3 py-2 border rounded-md text-sm bg-white">
                    <option value="1er Trimestre">1er Trimestre</option>
                    <option value="2do Trimestre">2do Trimestre</option>
                    <option value="3er Trimestre">3er Trimestre</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                <div><label className="block text-xs text-gray-600 mb-1">Ser (10)</label><input type="number" step="0.1" max="10" min="0" name="ser" placeholder="0" required className="w-full px-3 py-1.5 border rounded-md text-sm font-mono" /></div>
                <div><label className="block text-xs text-gray-600 mb-1">Saber (45)</label><input type="number" step="0.1" max="45" min="0" name="saber" placeholder="0" required className="w-full px-3 py-1.5 border rounded-md text-sm font-mono" /></div>
                <div><label className="block text-xs text-gray-600 mb-1">Hacer (40)</label><input type="number" step="0.1" max="40" min="0" name="hacer" placeholder="0" required className="w-full px-3 py-1.5 border rounded-md text-sm font-mono" /></div>
                <div><label className="block text-xs text-gray-600 mb-1">Autoev. (5)</label><input type="number" step="0.1" max="5" min="0" name="autoevaluacion" placeholder="0" required className="w-full px-3 py-1.5 border rounded-md text-sm font-mono" /></div>
              </div>

              <button type="submit" disabled={!cursoSeleccionado || estudiantesDelCurso.length === 0} className="w-full bg-[#0A10CC] hover:bg-blue-900 text-white font-bold py-2.5 px-4 rounded-md text-sm transition-colors mt-2 disabled:bg-gray-300 cursor-pointer">
                Guardar Calificación
              </button>
            </form>
          </div>

          {/* LADO DERECHO: HISTORIAL DEL CURSO CON EDICIÓN (SIN ELIMINAR) */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-800">
                Historial de Notas {cursoSeleccionado ? `— ${cursoSeleccionado}` : ""} ({calificacionesFiltradas.length})
              </h2>
              {cursoSeleccionado && (
                <BotonesExportar datos={calificacionesFiltradas} tipo="calificaciones" curso={cursoSeleccionado} />
              )}
            </div>

            {!cursoSeleccionado ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <span className="text-4xl block mb-2">📁</span>
                <p className="text-sm font-semibold text-gray-700">Seleccione un curso en el formulario izquierdo</p>
                <p className="text-xs text-gray-500 mt-1">Los estudiantes de ese curso se cargarán para registrar notas y editar sus dimensiones.</p>
              </div>
            ) : calificacionesFiltradas.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No hay calificaciones registradas para {cursoSeleccionado}.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[700px]">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="p-3">Estudiante</th>
                      <th className="p-3">Materia</th>
                      <th className="p-3 text-center">Trimestre</th>
                      <th className="p-3 text-center">SER</th>
                      <th className="p-3 text-center">SABER</th>
                      <th className="p-3 text-center">HACER</th>
                      <th className="p-3 text-center">AUTO</th>
                      <th className="p-3 text-center">Nota Final</th>
                      <th className="p-3 text-center">Editar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {calificacionesFiltradas.map((cal) => (
                      <tr key={cal.id} className="hover:bg-gray-50">
                        <td className="p-3 font-medium whitespace-nowrap">{cal.estudiante?.apellidos} {cal.estudiante?.nombres}</td>
                        <td className="p-3 text-gray-600 text-xs">{cal.materia}</td>
                        <td className="p-3 text-center text-xs">{cal.trimestre}</td>
                        
                        <td colSpan={5} className="p-0">
                          <form action={actualizarCalificacion} className="flex items-center justify-between p-2">
                            <input type="hidden" name="id" value={cal.id} />
                            <input type="number" name="ser" defaultValue={cal.ser} step="0.1" min="0" max="10" className="w-12 border rounded p-1 text-center text-xs font-mono bg-white mx-auto" />
                            <input type="number" name="saber" defaultValue={cal.saber} step="0.1" min="0" max="45" className="w-12 border rounded p-1 text-center text-xs font-mono bg-white mx-auto" />
                            <input type="number" name="hacer" defaultValue={cal.hacer} step="0.1" min="0" max="40" className="w-12 border rounded p-1 text-center text-xs font-mono bg-white mx-auto" />
                            <input type="number" name="autoevaluacion" defaultValue={cal.autoevaluacion} step="0.1" min="0" max="5" className="w-12 border rounded p-1 text-center text-xs font-mono bg-white mx-auto" />
                            <div className="w-16 text-center">
                              <span className={`font-bold px-2 py-0.5 rounded text-xs ${cal.notaFinal >= 51 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {cal.notaFinal}
                              </span>
                            </div>
                            <button type="submit" title="Guardar cambios" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-2.5 py-1 rounded text-xs transition cursor-pointer ml-1">
                              Guardar
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
      )}
    </div>
  );
}