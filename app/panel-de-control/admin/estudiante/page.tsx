import prisma from "@/lib/prisma";
import Link from "next/link";
import BotonesExportar from "@/componentes/botones-exportar";

export const revalidate = 0;

export default async function EstudiantesAdminPage(
  props: { searchParams: Promise<{ curso?: string }> }
) {
  const searchParams = await props.searchParams;
  const cursoSeleccionado = searchParams?.curso || "";

  // Niveles y carpetas institucionales
  const niveles = [
    {
      titulo: "Nivel Inicial",
      color: "border-pink-500",
      cursos: ["Inicial (Pre-Kínder)", "Inicial (Kínder)"]
    },
    {
      titulo: "Nivel Primario",
      color: "border-yellow-400",
      cursos: ["1ro de Primaria", "2do de Primaria", "3ro de Primaria", "4to de Primaria", "5to de Primaria", "6to de Primaria"]
    },
    {
      titulo: "Nivel Secundario",
      color: "border-blue-600",
      cursos: ["1ro de Secundaria", "2do de Secundaria", "3ro de Secundaria", "4to de Secundaria", "5to de Secundaria", "6to de Secundaria"]
    }
  ];

  // Si se seleccionó un curso, traemos solo los estudiantes de ese curso
  const estudiantesDelCurso = cursoSeleccionado
    ? await prisma.estudiante.findMany({
        where: { 
          curso: {
            equals: cursoSeleccionado,
            mode: "insensitive"
          }
        },
        include: { padre: true },
        orderBy: [{ paralelo: 'asc' }, { apellidos: 'asc' }]
      })
    : [];

  // Mapeo para los botones de exportación
  const datosParaExportar = estudiantesDelCurso.map((est) => ({
    materia: `Curso: ${est.curso} (${est.paralelo || "Único"})`,
    trimestre: `RUDE: ${est.rude || "S/N"} | CI: ${est.ci || "S/N"}`,
    ser: `Tutor: ${est.padre?.apellidos || ""} ${est.padre?.nombre || ""}`,
    saber: est.padre?.telefono || "S/T",
    hacer: "",
    autoevaluacion: "",
    notaFinal: est.email,
    estudiante: {
      nombres: est.nombres,
      apellidos: est.apellidos,
    },
  }));

  // VISTA 1: SI SE SELECCIONÓ UN CURSO -> MOSTRAR LA LISTA DE ESE CURSO CON EXCEL Y PDF
  if (cursoSeleccionado) {
    return (
      <div className="space-y-6 bg-blue-50 p-4 rounded-lg border border-blue-200 print:bg-white print:border-none print:p-0">
        
        {/* Cabecera con botón de volver */}
        <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-200 print:hidden">
          <div>
            <h1 className="text-2xl font-bold text-blue-900">Estudiantes: {cursoSeleccionado}</h1>
            <p className="text-gray-500 text-sm mt-1">Total de alumnos matriculados: <span className="font-bold text-blue-600">{estudiantesDelCurso.length}</span></p>
          </div>
          <Link href="/panel-de-control/admin/estudiante" className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 font-medium transition-colors text-sm">
            &larr; Volver a Carpetas de Cursos
          </Link>
        </div>

        {/* Encabezado para impresión / PDF */}
        <div className="hidden print:block text-center border-b-2 border-blue-900 pb-3 mb-6">
          <h2 className="text-2xl font-extrabold text-[#0A10CC]">UNIDAD EDUCATIVA LIBERTAD EN LAS AMÉRICAS DON BOSCO</h2>
          <p className="text-sm font-bold text-gray-700 mt-1">NÓMINA DE ESTUDIANTES — CURSO: {cursoSeleccionado.toUpperCase()}</p>
          <p className="text-xs text-gray-500 mt-0.5">Fecha de Emisión: {new Date().toLocaleDateString("es-ES")}</p>
        </div>

        {/* Botones de Exportar */}
        <div className="print:hidden">
          <BotonesExportar 
            datos={datosParaExportar} 
            tipo="calificaciones" 
            curso={cursoSeleccionado} 
          />
        </div>

        {/* Tabla de Alumnos */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 print:border-none print:shadow-none print:p-0">
          {estudiantesDelCurso.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No hay estudiantes inscritos en este curso.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm print:text-xs border-collapse">
                <thead className="bg-gray-50 border-b print:bg-gray-200 text-gray-700">
                  <tr>
                    <th className="p-3">N°</th>
                    <th className="p-3">Apellidos y Nombres</th>
                    <th className="p-3 text-center">Paralelo</th>
                    <th className="p-3 font-mono">RUDE</th>
                    <th className="p-3 font-mono">CI Estudiante</th>
                    <th className="p-3">Apoderado (Tutor)</th>
                    <th className="p-3">Teléfono</th>
                  </tr>
                </thead>
                <tbody className="divide-y print:divide-gray-400">
                  {estudiantesDelCurso.map((est, index) => (
                    <tr key={est.id} className="hover:bg-gray-50">
                      <td className="p-3 text-gray-500 text-xs">{index + 1}</td>
                      <td className="p-3 font-bold text-gray-900">{est.apellidos} {est.nombres}</td>
                      <td className="p-3 text-center font-bold">{est.paralelo || "-"}</td>
                      <td className="p-3 font-mono text-xs">{est.rude || "-"}</td>
                      <td className="p-3 font-mono text-xs">{est.ci || "-"}</td>
                      <td className="p-3 text-gray-700">{est.padre?.apellidos}, {est.padre?.nombre}</td>
                      <td className="p-3 text-gray-600 font-mono text-xs">{est.padre?.telefono || "-"}</td>
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

  // VISTA 2: SELECCIÓN DE CURSOS POR CARPETAS (NIVEL INICIAL, PRIMARIO, SECUNDARIO)
  return (
    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-blue-800">Gestión de Estudiantes</h1>
        <p className="text-gray-500 mt-1">Selecciona un curso para ver la lista de estudiantes, imprimir o exportar sus datos.</p>
      </div>

      <div className="space-y-10">
        {niveles.map((nivel) => (
          <div key={nivel.titulo}>
            <h2 className="text-xl font-bold text-gray-700 mb-4 flex items-center gap-2">
              <span className="text-2xl">📚</span> {nivel.titulo}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {nivel.cursos.map((curso) => (
                <Link 
                  key={curso} 
                  href={`/panel-de-control/admin/estudiante?curso=${encodeURIComponent(curso)}`}
                  className={`group block bg-white p-5 rounded-xl shadow-sm border-t-4 ${nivel.color} hover:shadow-md transition-all`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-3xl block mb-2 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-transform">📁</span>
                      <h3 className="font-bold text-gray-800 text-sm">{curso}</h3>
                      <p className="text-xs text-gray-500 mt-1 group-hover:text-blue-600 transition-colors">Ver lista de alumnos &rarr;</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}