import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { SignOutButton, UserButton } from "@clerk/nextjs";
import { 
  registrarCalificacion, 
  actualizarCalificacion 
} from "@/acciones/calificaciones";
import { guardarComunicado } from "@/acciones/comunicados";
import { registrarAsistenciaLote, actualizarAsistencia } from "@/acciones/asistencias";
import SelectorImpresionProfesor from "@/componentes/selector-impresion-profesor";
import FormularioAutomatico from "@/componentes/formulario-automatico";
import { redirect } from "next/navigation";

export const revalidate = 0;

export default async function PanelProfesorPage(props: { searchParams: Promise<{ curso?: string }> }) {
  const searchParams = await props.searchParams;
  const cursoSeleccionado = searchParams?.curso || "";
  const userClerk = await currentUser();
  const emailClerk = userClerk?.emailAddresses[0]?.emailAddress?.toLowerCase().trim() || "";

  const docenteActual = await prisma.usuario.findFirst({
    where: {
      OR: [
        { email: { equals: emailClerk, mode: "insensitive" } },
        { clerkId: userClerk?.id }
      ]
    }
  });

  const cursosDisponibles = [
    "Inicial (Pre-Kínder)", "Inicial (Kínder)", "1ro de Primaria", "2do de Primaria",
    "3ro de Primaria", "4to de Primaria", "5to de Primaria", "6to de Primaria",
    "1ro de Secundaria", "2do de Secundaria", "3ro de Secundaria", "4to de Secundaria",
    "5to de Secundaria", "6to de Secundaria"
  ];

  const estudiantesDelCurso = cursoSeleccionado
    ? await prisma.estudiante.findMany({
        where: { 
          curso: {
            equals: cursoSeleccionado,
            mode: "insensitive"
          }
        },
        include: { 
          calificaciones: {
            orderBy: { id: "desc" }
          } 
        },
        orderBy: [
          { apellidos: "asc" }, 
          { nombres: "asc" }
        ]
      })
    : [];

  const idsEstudiantesCurso = estudiantesDelCurso.map((e) => e.id);
  const fechaHoyStr = new Date().toISOString().split("T")[0];
  const inicioDia = new Date(fechaHoyStr + "T00:00:00.000Z");
  const finDia = new Date(fechaHoyStr + "T23:59:59.999Z");

  const asistenciasHoyCurso = cursoSeleccionado
    ? await prisma.asistenciaEstudiante.findMany({
        where: {
          idEstudiante: { in: idsEstudiantesCurso },
          fecha: { gte: inicioDia, lte: finDia }
        },
        include: { estudiante: true },
        orderBy: { id: "asc" }
      })
    : [];

  const asistenciaYaTomadaHoy = asistenciasHoyCurso.length > 0;

  const todasLasNotasDelCurso = cursoSeleccionado
    ? await prisma.calificacion.findMany({
        where: {
          idEstudiante: { in: idsEstudiantesCurso },
          ...(docenteActual?.id ? { idProfesor: docenteActual.id } : {})
        },
        include: { estudiante: true },
        orderBy: { id: "desc" }
      })
    : [];

  const comunicadosVisibles = await prisma.comunicado.findMany({
    where: { dirigidoA: { in: ["TODOS", "PROFESORES", "PROFESOR"] } },
    include: { autor: true },
    orderBy: { fecha: "desc" },
    take: 5
  });

  async function seleccionarCursoAccion(formData: FormData) {
    "use server";
    const cursoElegido = formData.get("curso")?.toString() || "";
    if (cursoElegido) {
      redirect(`/panel-de-control/profesor?curso=${encodeURIComponent(cursoElegido)}`);
    } else {
      redirect("/panel-de-control/profesor");
    }
  }

  const centralizadorNotas = estudiantesDelCurso.map((est) => {
    const notasT1 = est.calificaciones.filter((c) => c.trimestre.includes("1"));
    const notasT2 = est.calificaciones.filter((c) => c.trimestre.includes("2"));
    const notasT3 = est.calificaciones.filter((c) => c.trimestre.includes("3"));
    const promT1 = notasT1.length ? Math.round(notasT1.reduce((acc, c) => acc + c.notaFinal, 0) / notasT1.length) : null;
    const promT2 = notasT2.length ? Math.round(notasT2.reduce((acc, c) => acc + c.notaFinal, 0) / notasT2.length) : null;
    const promT3 = notasT3.length ? Math.round(notasT3.reduce((acc, c) => acc + c.notaFinal, 0) / notasT3.length) : null;
    const tieneTodosLosTrimestres = promT1 !== null && promT2 !== null && promT3 !== null;
    const trimestresValidos = [promT1, promT2, promT3].filter((n): n is number => n !== null);
    const promedioFinal = tieneTodosLosTrimestres
      ? Math.round((promT1 + promT2 + promT3) / 3)
      : trimestresValidos.length > 0
      ? Math.round(trimestresValidos.reduce((a, b) => a + b, 0) / trimestresValidos.length)
      : 0;

    return {
      id: est.id,
      nombreCompleto: `${est.apellidos} ${est.nombres}`,
      paralelo: est.paralelo || "A",
      t1: promT1 !== null ? promT1 : "-",
      t2: promT2 !== null ? promT2 : "-",
      t3: promT3 !== null ? promT3 : "-",
      promedioFinal: trimestresValidos.length > 0 ? promedioFinal : "-",
      estado: !tieneTodosLosTrimestres 
        ? "En Curso" 
        : promedioFinal >= 51 
        ? "Aprobado" 
        : "Reprobado"
    };
  });

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-8 print:p-0 print:m-0">
      {/* Membrete Oficial para Impresión / PDF */}
      <div className="hidden print:block text-center border-b-2 border-blue-900 pb-3 mb-6">
        <h1 className="text-xl font-black text-blue-950 uppercase tracking-tight">
          UNIDAD EDUCATIVA LIBERTAD EN LAS AMÉRICAS DON BOSCO
        </h1>
        <h2 className="text-sm font-bold text-gray-800 mt-1 uppercase">
          INFORME PEDAGÓGICO TRIMESTRAL — GESTIÓN ESCOLAR 2026
        </h2>
        <div className="flex justify-between items-center text-xs font-semibold text-gray-600 mt-2 px-2 border-t pt-2">
          <span>CURSO: <strong className="text-black">{cursoSeleccionado.toUpperCase() || "SIN SELECCIÓN"}</strong></span>
          <span>DOCENTE: <strong className="text-black">{docenteActual ? `${docenteActual.apellidos} ${docenteActual.nombre}` : "PROFESOR"}</strong></span>
          <span>MATERIA: <strong className="text-black">{docenteActual?.materia || "GENERAL"}</strong></span>
          <span>FECHA: <strong className="text-black">{new Date().toLocaleDateString("es-ES")}</strong></span>
        </div>
      </div>

      {/* Centro Unificado de Exportación */}
      <div className="space-y-2 print:hidden">
        <SelectorImpresionProfesor />
      </div>

      {/* Encabezado con Botón de Salida */}
      <header className="bg-blue-900 border-l-8 border-yellow-400 text-white p-6 rounded-xl shadow-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Panel Docente: {docenteActual ? `${docenteActual.nombre} ${docenteActual.apellidos}` : "Profesor"}
          </h1>
          <p className="text-blue-100 text-sm mt-1">
            Materia Asignada: <strong className="text-yellow-300">{docenteActual?.materia || "No asignada"}</strong> • Entrada oficial: <strong className="text-yellow-300">{docenteActual?.horaIngreso || "07:30"}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <UserButton />
          <span className="bg-yellow-400 text-blue-950 text-xs px-3.5 py-1.5 rounded-full font-bold uppercase tracking-wider shadow-sm">
            Docente Activo
          </span>
          <SignOutButton redirectUrl="/iniciar-sesion">
            <button
              type="button"
              title="Cerrar sesión"
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3.5 py-2 rounded-lg shadow transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>🚪</span> Salir
            </button>
          </SignOutButton>
        </div>
      </header>

      {/* SECCIÓN 1: ASISTENCIA DE ESTUDIANTES */}
      <section className="seccion-asistencia bg-white p-6 rounded-xl shadow-sm border border-gray-200 print:shadow-none print:border-none print:p-0">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b-2 border-blue-900 pb-3 mb-5 gap-3">
          <div className="flex items-center space-x-2">
            <span className="text-2xl print:hidden">📋</span>
            <h2 className="text-xl font-bold text-blue-900 print:text-base print:uppercase">
              Control de Asistencia Escolar {cursoSeleccionado ? `(${cursoSeleccionado})` : ""}
            </h2>
          </div>
          <div className="print:hidden">
            {cursoSeleccionado && (
              <span className={`text-xs px-3 py-1.5 rounded-full font-bold ${asistenciaYaTomadaHoy ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-amber-100 text-amber-800 border border-amber-200'}`}>
                {asistenciaYaTomadaHoy ? `✅ Lista de hoy completada (${asistenciasHoyCurso.length} registrados)` : "⚠️ Pendiente de registro hoy"}
              </span>
            )}
          </div>
        </div>

        <div className="mb-6 print:hidden">
          <FormularioAutomatico action={seleccionarCursoAccion} className="w-full max-w-sm">
            <label htmlFor="selector-curso-docente" className="block text-xs font-bold text-gray-700 mb-1">
              Paso 1: Selecciona tu Curso
            </label>
            <select
              id="selector-curso-docente"
              name="curso"
              defaultValue={cursoSeleccionado}
              required
              className="w-full border border-blue-400 rounded-lg p-2.5 text-sm bg-white font-bold text-blue-900 focus:ring-2 focus:ring-blue-600 outline-none shadow-sm cursor-pointer"
            >
              <option value="">-- Elige un curso --</option>
              {cursosDisponibles.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </FormularioAutomatico>
        </div>

        {!cursoSeleccionado ? (
          <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300 print:hidden">
            <p className="text-sm font-bold text-gray-700">Por favor, selecciona un curso arriba para cargar la nómina.</p>
          </div>
        ) : estudiantesDelCurso.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">No hay estudiantes inscritos en el curso {cursoSeleccionado}.</p>
        ) : !asistenciaYaTomadaHoy ? (
          <form action={registrarAsistenciaLote} className="space-y-4">
            <input type="hidden" name="idProfesor" value={docenteActual?.id || 1} />
            <input type="hidden" name="fecha" value={fechaHoyStr} />
            <input type="hidden" name="totalEstudiantes" value={estudiantesDelCurso.length} />

            <div className="overflow-x-auto border rounded-xl">
              <table className="w-full text-left text-sm print:text-xs">
                <thead className="bg-blue-900 text-white text-xs uppercase print:bg-gray-200 print:text-black">
                  <tr>
                    <th className="p-3 w-12 text-center">N°</th>
                    <th className="p-3">Estudiante</th>
                    <th className="p-3 text-center w-36">Estado</th>
                    <th className="p-3">Observación</th>
                    <th className="hidden print:table-cell p-3 text-center w-32">Firma Tutor</th>
                  </tr>
                </thead>
                <tbody className="divide-y print:divide-gray-400">
                  {estudiantesDelCurso.map((est, i) => (
                    <tr key={est.id} className="hover:bg-blue-50/30">
                      <td className="p-3 text-xs text-gray-500 font-bold text-center">{i + 1}</td>
                      <td className="p-3 font-semibold text-gray-900 whitespace-nowrap">
                        {est.apellidos} {est.nombres} [{est.paralelo || "A"}]
                        <input type="hidden" name={`idEstudiante_${i}`} value={est.id} />
                      </td>
                      <td className="p-3 text-center">
                        <span className="hidden print:inline-block font-bold">PRESENTE</span>
                        <select
                          name={`estado_${i}`}
                          defaultValue="PRESENTE"
                          className="print:hidden border border-gray-300 rounded-md p-1.5 text-xs bg-white font-bold text-gray-800"
                        >
                          <option value="PRESENTE">🟢 Presente</option>
                          <option value="ATRASO">🟡 Atraso</option>
                          <option value="FALTA">🔴 Falta</option>
                          <option value="LICENCIA">🔵 Licencia</option>
                        </select>
                      </td>
                      <td className="p-3">
                        <input
                          type="text"
                          name={`observacion_${i}`}
                          placeholder="Opcional"
                          className="print:hidden w-full border rounded px-2 py-1 text-xs"
                        />
                        <span className="hidden print:inline-block text-gray-400 italic">--</span>
                      </td>
                      <td className="hidden print:table-cell border-b border-gray-300"></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-lg text-base shadow-lg transition-colors cursor-pointer print:hidden"
            >
              ✅ Guardar Asistencia de Todo el Curso
            </button>
          </form>
        ) : (
          <div className="overflow-x-auto border rounded-xl">
            <table className="w-full text-left text-sm print:text-xs">
              <thead className="bg-gray-100 text-gray-700 border-b print:bg-gray-200 print:text-black">
                <tr>
                  <th className="p-3 w-12 text-center">N°</th>
                  <th className="p-3">Estudiante</th>
                  <th className="p-3 text-center w-36">Estado Registrado</th>
                  <th className="p-3">Observación</th>
                  <th className="p-3 text-center print:hidden w-36">Modificar</th>
                </tr>
              </thead>
              <tbody className="divide-y print:divide-gray-400">
                {asistenciasHoyCurso.map((asis, idx) => (
                  <tr key={asis.id} className="hover:bg-gray-50">
                    <td className="p-3 text-xs text-gray-500 font-bold text-center">{idx + 1}</td>
                    <td className="p-3 font-semibold text-gray-900 whitespace-nowrap">
                      {asis.estudiante?.apellidos} {asis.estudiante?.nombres}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                          asis.estado === "PRESENTE" ? "bg-green-100 text-green-800" :
                          asis.estado === "FALTA" ? "bg-red-100 text-red-800" :
                          asis.estado === "ATRASO" ? "bg-yellow-100 text-yellow-800" : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {asis.estado}
                      </span>
                    </td>
                    <td className="p-3 text-xs text-gray-600">{asis.observacion || "-"}</td>
                    <td className="p-3 text-center print:hidden">
                      <form action={actualizarAsistencia} className="inline-flex items-center gap-1.5">
                        <input type="hidden" name="id" value={asis.id} />
                        <select name="estado" defaultValue={asis.estado} className="border border-gray-300 rounded p-1.5 text-xs bg-white">
                          <option value="PRESENTE">Presente</option>
                          <option value="ATRASO">Atraso</option>
                          <option value="FALTA">Falta</option>
                          <option value="LICENCIA">Licencia</option>
                        </select>
                        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded text-xs transition cursor-pointer">
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
      </section>

      {/* SECCIÓN 2: FORMULARIO DE EVALUACIÓN Y COMUNICADOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 print:hidden">
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center space-x-2 border-b-2 border-blue-900 pb-3 mb-5">
            <span className="text-2xl">📝</span>
            <h2 className="text-xl font-bold text-blue-900">Registrar Evaluación</h2>
          </div>

          <form action={registrarCalificacion} className="space-y-4">
            <input type="hidden" name="idProfesor" value={docenteActual?.id || 1} />

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Estudiante {cursoSeleccionado ? `(${cursoSeleccionado})` : ""}
              </label>
              <select name="idEstudiante" required disabled={!cursoSeleccionado} className="w-full border border-gray-300 rounded-md p-2.5 text-sm bg-blue-50/40 disabled:bg-gray-100">
                <option value="">{cursoSeleccionado ? "-- Seleccionar estudiante --" : "⚠️ Selecciona un curso arriba primero"}</option>
                {estudiantesDelCurso.map((est) => (
                  <option key={est.id} value={est.id}>[{est.paralelo || "A"}] {est.apellidos}, {est.nombres}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* CAMPO DE MATERIA FIJO (NO DESPLEGABLE) */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Materia Asignada</label>
                <input
                  type="text"
                  name="materia"
                  readOnly
                  value={docenteActual?.materia || "Materia General"}
                  className="w-full border border-blue-300 rounded-md p-2 text-sm bg-blue-50 font-bold text-blue-950 cursor-not-allowed outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Trimestre</label>
                <select name="trimestre" required className="w-full border border-gray-300 rounded-md p-2 text-sm bg-blue-50/40">
                  <option value="1er Trimestre">1er Trimestre</option>
                  <option value="2do Trimestre">2do Trimestre</option>
                  <option value="3er Trimestre">3er Trimestre</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-blue-50/60 p-3.5 rounded-lg border border-blue-100">
              <div>
                <label className="block text-xs font-bold text-blue-950">SER (10)</label>
                <input type="number" name="ser" min="0" max="10" step="0.1" required placeholder="0" className="w-full border rounded p-1.5 text-center text-sm bg-white font-semibold" />
              </div>
              <div>
                <label className="block text-xs font-bold text-blue-950">SABER (45)</label>
                <input type="number" name="saber" min="0" max="45" step="0.1" required placeholder="0" className="w-full border rounded p-1.5 text-center text-sm bg-white font-semibold" />
              </div>
              <div>
                <label className="block text-xs font-bold text-blue-950">HACER (40)</label>
                <input type="number" name="hacer" min="0" max="40" step="0.1" required placeholder="0" className="w-full border rounded p-1.5 text-center text-sm bg-white font-semibold" />
              </div>
              <div>
                <label className="block text-xs font-bold text-blue-950">AUTO (5)</label>
                <input type="number" name="autoevaluacion" min="0" max="5" step="0.1" required placeholder="0" className="w-full border rounded p-1.5 text-center text-sm bg-white font-semibold" />
              </div>
            </div>

            <button type="submit" disabled={!cursoSeleccionado} className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-2.5 rounded-md text-sm transition cursor-pointer disabled:bg-gray-300">
              Guardar Calificación
            </button>
          </form>
        </section>

        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 border-b-2 border-yellow-400 pb-3 mb-4">
              <span className="text-2xl">📢</span>
              <h2 className="text-xl font-bold text-blue-900">Comunicados Institucionales</h2>
            </div>

            <div className="space-y-3 mb-5 max-h-48 overflow-y-auto pr-1">
              <h3 className="text-xs font-bold text-gray-500 uppercase">Avisos Recientes para Profesores</h3>
              {comunicadosVisibles.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No hay comunicados publicados para el plantel docente.</p>
              ) : (
                comunicadosVisibles.map((c) => (
                  <div key={c.id} className="p-3 bg-yellow-50/50 border border-yellow-200 rounded-lg">
                    <div className="flex justify-between items-start">
                      <h4 className="text-xs font-bold text-blue-900">{c.titulo}</h4>
                      <span className="text-[10px] bg-yellow-400 text-blue-950 px-2 py-0.5 rounded font-bold">{c.dirigidoA}</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{c.contenido}</p>
                    <span className="text-[10px] text-gray-400 block mt-1">Por: {c.autor?.nombre || "Dirección"}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <form action={guardarComunicado} className="space-y-3 border-t pt-3">
            <h3 className="text-xs font-bold text-blue-900 uppercase">Emitir Nuevo Comunicado</h3>
            <input type="text" name="titulo" placeholder="Título del aviso..." required className="w-full border rounded-md p-2 text-xs bg-gray-50" />
            <div className="grid grid-cols-2 gap-2">
              <select name="tipo" required className="w-full border rounded-md p-1.5 text-xs bg-gray-50">
                <option value="ACADEMICO">Académico</option>
                <option value="GENERAL">General</option>
              </select>
              <select name="dirigidoA" required className="w-full border rounded-md p-1.5 text-xs bg-gray-50">
                <option value="PADRES">Padres</option>
                <option value="PROFESORES">Profesores</option>
                <option value="TODOS">General</option>
              </select>
            </div>
            <textarea name="contenido" rows={2} placeholder="Escriba el comunicado..." required className="w-full border rounded-md p-2 text-xs bg-gray-50 resize-none" />
            <button type="submit" className="w-full bg-yellow-400 hover:bg-yellow-500 text-blue-950 font-bold py-2 rounded-md text-xs transition cursor-pointer">
              Publicar Comunicado
            </button>
          </form>
        </section>
      </div>

      {/* SECCIÓN 3: DETALLE DE CALIFICACIONES (SOLO EDITAR, SE ELIMINÓ EL BOTÓN DE ELIMINAR) */}
      <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 print:hidden">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-bold text-blue-900">
              Detalle de Calificaciones Ingresadas ({todasLasNotasDelCurso.length})
            </h3>
            <p className="text-xs text-gray-500">
              Modifique y corrija las dimensiones pedagógicas de cada estudiante.
            </p>
          </div>
        </div>

        {todasLasNotasDelCurso.length === 0 ? (
          <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <p className="text-sm">No hay calificaciones individuales guardadas aún para este curso.</p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full border rounded-xl">
            <table className="w-full text-left text-sm min-w-[850px]">
              <thead className="bg-gray-100 text-gray-700 text-xs uppercase">
                <tr>
                  <th className="p-3 min-w-[220px]">Estudiante</th>
                  <th className="p-3 min-w-[160px]">Materia</th>
                  <th className="p-3 text-center w-28">Trimestre</th>
                  <th className="p-3 text-center w-16">SER</th>
                  <th className="p-3 text-center w-16">SABER</th>
                  <th className="p-3 text-center w-16">HACER</th>
                  <th className="p-3 text-center w-16">AUTO</th>
                  <th className="p-3 text-center w-20">Nota Final</th>
                  <th className="p-3 text-center min-w-[100px]">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {todasLasNotasDelCurso.map((nota) => (
                  <tr key={nota.id} className="hover:bg-blue-50/20">
                    <td className="p-3 font-semibold text-gray-900 whitespace-nowrap">
                      {nota.estudiante?.apellidos} {nota.estudiante?.nombres}
                    </td>
                    <td className="p-3 text-xs text-gray-600 whitespace-nowrap">{nota.materia}</td>
                    <td className="p-3 text-center text-xs font-mono whitespace-nowrap">{nota.trimestre}</td>
                    
                    <td colSpan={5} className="p-0">
                      <form action={actualizarCalificacion} className="flex items-center justify-between p-2">
                        <input type="hidden" name="id" value={nota.id} />
                        <input 
                          type="number" 
                          name="ser" 
                          defaultValue={nota.ser} 
                          step="0.1" min="0" max="10" 
                          className="w-12 border rounded p-1 text-center text-xs font-mono bg-white mx-auto" 
                        />
                        <input 
                          type="number" 
                          name="saber" 
                          defaultValue={nota.saber} 
                          step="0.1" min="0" max="45" 
                          className="w-12 border rounded p-1 text-center text-xs font-mono bg-white mx-auto" 
                        />
                        <input 
                          type="number" 
                          name="hacer" 
                          defaultValue={nota.hacer} 
                          step="0.1" min="0" max="40" 
                          className="w-12 border rounded p-1 text-center text-xs font-mono bg-white mx-auto" 
                        />
                        <input 
                          type="number" 
                          name="autoevaluacion" 
                          defaultValue={nota.autoevaluacion} 
                          step="0.1" min="0" max="5" 
                          className="w-12 border rounded p-1 text-center text-xs font-mono bg-white mx-auto" 
                        />
                        <div className="w-16 text-center">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                            nota.notaFinal >= 51 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {nota.notaFinal}
                          </span>
                        </div>
                        <button 
                          type="submit" 
                          title="Guardar corrección"
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1 rounded text-xs transition cursor-pointer ml-1"
                        >
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
      </section>

      {/* SECCIÓN 4: CENTRALIZADOR TRIMESTRAL OFICIAL (SIN BOTÓN EXCEL DUPLICADO) */}
      <section className="seccion-notas bg-white p-6 rounded-xl shadow-sm border border-gray-200 print:shadow-none print:border-none print:p-0">
        <div className="mb-5 print:hidden">
          <h3 className="font-bold text-blue-900 text-xl">
            Centralizador Trimestral {cursoSeleccionado ? `— ${cursoSeleccionado}` : ""} ({centralizadorNotas.length} estudiantes)
          </h3>
          <p className="text-gray-500 text-xs mt-0.5">Cuadro oficial de notas trimestrales y promedios finales calculados.</p>
        </div>

        {!cursoSeleccionado ? (
          <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300 print:hidden">
            <p className="text-sm font-bold text-gray-700">Selecciona un curso arriba para visualizar el centralizador de calificaciones.</p>
          </div>
        ) : centralizadorNotas.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-6">No hay estudiantes en el curso {cursoSeleccionado}.</p>
        ) : (
          <div>
            <div className="overflow-x-auto w-full border border-blue-900 rounded-xl p-0.5 bg-white print:border-none print:p-0">
              <table className="w-full text-left text-sm print:text-xs border-collapse min-w-[750px] print:min-w-full">
                <thead className="bg-[#0A10CC] text-white print:bg-gray-200 print:text-black">
                  <tr>
                    <th className="p-2.5 text-center border w-12">N°</th>
                    <th className="p-2.5 border min-w-[240px]">Apellidos y Nombres</th>
                    <th className="p-2.5 text-center border w-24">Paralelo</th>
                    <th className="p-2.5 text-center border w-24">1er Trimestre</th>
                    <th className="p-2.5 text-center border w-24">2do Trimestre</th>
                    <th className="p-2.5 text-center border w-24">3er Trimestre</th>
                    <th className="p-2.5 text-center font-bold border w-28">Nota Final</th>
                    <th className="p-2.5 text-center border w-28">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y print:divide-gray-400">
                  {centralizadorNotas.map((row, idx) => (
                    <tr key={row.id} className="hover:bg-blue-50/30">
                      <td className="p-2.5 text-center text-xs font-bold text-gray-500 border">{idx + 1}</td>
                      <td className="p-2.5 font-semibold text-gray-900 border whitespace-nowrap">
                        {row.nombreCompleto}
                      </td>
                      <td className="p-2.5 text-center font-bold text-gray-700 border">{row.paralelo}</td>
                      
                      <td className="p-2.5 text-center font-medium border font-mono">
                        <span className={row.t1 !== "-" && Number(row.t1) < 51 ? "text-red-600 font-bold" : ""}>
                          {row.t1}
                        </span>
                      </td>
                      <td className="p-2.5 text-center font-medium border font-mono">
                        <span className={row.t2 !== "-" && Number(row.t2) < 51 ? "text-red-600 font-bold" : ""}>
                          {row.t2}
                        </span>
                      </td>
                      <td className="p-2.5 text-center font-medium border font-mono">
                        <span className={row.t3 !== "-" && Number(row.t3) < 51 ? "text-red-600 font-bold" : ""}>
                          {row.t3}
                        </span>
                      </td>

                      <td className="p-2.5 text-center font-extrabold text-base border font-mono">
                        <span className={
                          row.promedioFinal === "-" ? "text-gray-400" :
                          Number(row.promedioFinal) >= 51 ? "text-green-700" : "text-red-600"
                        }>
                          {row.promedioFinal}
                        </span>
                      </td>

                      <td className="p-2.5 text-center border whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          row.estado === "Aprobado" ? "bg-green-100 text-green-800" :
                          row.estado === "Reprobado" ? "bg-red-100 text-red-800" :
                          "bg-amber-100 text-amber-800"
                        }`}>
                          {row.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}