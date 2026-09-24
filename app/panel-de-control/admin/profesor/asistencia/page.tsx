import prisma from "@/lib/prisma";
import Link from "next/link";
import { marcarAsistenciaProfesorPorCI, justificarAsistenciaSecretaria } from "@/acciones/asistencia-profesor";
import BotonesExportar from "@/componentes/botones-exportar";

export const revalidate = 0;

interface RegistroAsistencia {
  id: number;
  idProfesor: number;
  estado: string;
  tipo: string;
  observacion?: string | null;
  fechaHora: Date;
}

interface DocenteItem {
  id: number;
  nombre: string;
  apellidos: string;
  ci: string;
  materia?: string | null;
  horaIngreso?: string | null;
  horarioSemanal?: string | null;
}

export default async function AsistenciaProfesorAdminPage() {
  const profesoresRaw = await prisma.usuario.findMany({
    where: { rol: { in: ["PROFESOR", "DOCENTE"] } },
    orderBy: [{ apellidos: "asc" }, { nombre: "asc" }]
  });
  const profesores = profesoresRaw as unknown as DocenteItem[];

  const inicioHoy = new Date();
  inicioHoy.setHours(0, 0, 0, 0);
  const finHoy = new Date();
  finHoy.setHours(23, 59, 59, 999);

  const asistenciasHoyRaw = await prisma.asistenciaProfesor.findMany({
    where: { fechaHora: { gte: inicioHoy, lte: finHoy } },
    orderBy: { fechaHora: "asc" }
  });
  const asistenciasHoy = asistenciasHoyRaw as unknown as RegistroAsistencia[];

  const mapaHoy = new Map<number, { entrada?: RegistroAsistencia; salida?: RegistroAsistencia }>();
  for (const reg of asistenciasHoy) {
    const item = mapaHoy.get(reg.idProfesor) || {};
    if (reg.tipo === "ENTRADA") item.entrada = reg;
    if (reg.tipo === "SALIDA") item.salida = reg;
    mapaHoy.set(reg.idProfesor, item);
  }

  const datosParaExportar = profesores
    .filter((p) => mapaHoy.has(p.id))
    .map((p) => {
      const { entrada, salida } = mapaHoy.get(p.id) || {};
      return {
        id: entrada?.id || salida?.id || p.id,
        fecha: entrada?.fechaHora || salida?.fechaHora || new Date(),
        estado: entrada?.estado || "PRESENTE",
        observacion: `Entrada: ${entrada?.fechaHora ? new Date(entrada.fechaHora).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) : "--:--"} | Salida: ${salida?.fechaHora ? new Date(salida.fechaHora).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) : "--:--"} | Materia: ${p.materia || "General"}`,
        estudiante: {
          nombres: p.nombre,
          apellidos: p.apellidos
        }
      };
    });

  return (
    <div className="space-y-6 bg-blue-50 p-4 sm:p-6 rounded-2xl border border-blue-200 print:bg-white print:border-none print:p-0">
      
      {/* Encabezado visible únicamente en Impresión / PDF */}
      <div className="hidden print:block text-center border-b-2 border-blue-900 pb-3 mb-6">
        <h1 className="text-2xl font-extrabold text-[#0A10CC]">UNIDAD EDUCATIVA LIBERTAD EN LAS AMÉRICAS DON BOSCO</h1>
        <h2 className="text-lg font-bold text-gray-800 mt-1">PLANILLA OFICIAL DE ASISTENCIA DEL PERSONAL DOCENTE</h2>
        <p className="text-sm font-semibold text-gray-600 mt-0.5">
          FECHA DE EMISIÓN: {new Date().toLocaleDateString("es-ES")}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 print:hidden">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#0A10CC]">Control de Asistencia Docente</h1>
          <p className="text-gray-600 text-xs sm:text-sm">Uso exclusivo de Administración / Portería</p>
        </div>
        <Link 
          href="/panel-de-control/admin/profesor" 
          className="text-xs font-bold text-blue-700 bg-white border border-blue-300 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition shadow-sm"
        >
          &larr; Lista de Profesores
        </Link>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 print:block">
        {/* Terminal de Marcación (Oculto al imprimir) */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 h-fit space-y-4 print:hidden">
          <div className="border-b-2 border-[#0A10CC] pb-2 flex items-center justify-between">
            <h2 className="text-base font-bold text-blue-900">⏰ Terminal de Marcación</h2>
            <span className="text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">En vivo</span>
          </div>

          <p className="text-xs text-gray-500">
            Ingrese el Carnet de Identidad del docente para registrar su asistencia:
          </p>

          <form action={marcarAsistenciaProfesorPorCI} className="space-y-4">
            <div>
              <label htmlFor="ci-profesor" className="block text-xs font-bold text-gray-700 mb-1">
                Carnet de Identidad (C.I.)
              </label>
              <input
                id="ci-profesor"
                type="text"
                name="ci"
                required
                maxLength={10}
                placeholder="Ej: 6085121"
                className="w-full text-center text-2xl font-mono font-bold py-3 border-2 border-blue-400 rounded-xl focus:ring-4 focus:ring-blue-100 outline-none bg-blue-50/30"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="submit"
                name="tipo"
                value="ENTRADA"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-xs sm:text-sm shadow transition cursor-pointer flex items-center justify-center gap-1"
              >
                <span>🟢</span> Entrada
              </button>
              <button
                type="submit"
                name="tipo"
                value="SALIDA"
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-xl text-xs sm:text-sm shadow transition cursor-pointer flex items-center justify-center gap-1"
              >
                <span>🔴</span> Salida
              </button>
            </div>
          </form>
        </div>

        {/* Planilla de Asistencia */}
        <div className="xl:col-span-2 bg-white p-5 rounded-2xl shadow-sm border border-gray-200 space-y-4 print:border-none print:shadow-none print:p-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-3 print:hidden">
            <h3 className="text-base font-bold text-gray-800">
              Planilla de Hoy ({mapaHoy.size}/{profesores.length})
            </h3>
            <BotonesExportar 
              datos={datosParaExportar} 
              tipo="asistencias" 
              curso="Docentes" 
              soloPdf={true} 
            />
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs sm:text-sm min-w-[500px] print:min-w-full print:text-xs">
              <thead className="bg-gray-50 text-gray-700 border-b text-[11px] uppercase print:bg-gray-200 print:text-black">
                <tr>
                  <th className="p-2.5">Docente</th>
                  <th className="p-2.5 text-center">Horario Hoy</th>
                  <th className="p-2.5 text-center">Ingreso</th>
                  <th className="p-2.5 text-center">Salida</th>
                  <th className="p-2.5 text-center">Estado</th>
                  <th className="p-2.5 text-center print:hidden">Justificar</th>
                </tr>
              </thead>
              <tbody className="divide-y print:divide-gray-400">
                {profesores.map((doc) => {
                  const reg = mapaHoy.get(doc.id);
                  const entrada = reg?.entrada;
                  const salida = reg?.salida;
                  const estado = entrada ? entrada.estado : "SIN MARCAR";

                  return (
                    <tr key={doc.id} className="hover:bg-gray-50">
                      <td className="p-2.5">
                        <p className="font-bold text-gray-900">{doc.apellidos}, {doc.nombre}</p>
                        <p className="text-[11px] text-blue-700 print:text-gray-600">{doc.materia || "Sin materia"} • CI: {doc.ci}</p>
                      </td>
                      <td className="p-2.5 text-center font-mono font-semibold text-gray-600 text-xs">
                        {doc.horaIngreso || "07:30"}
                      </td>
                      <td className="p-2.5 text-center font-mono text-xs font-bold text-emerald-800 print:text-black">
                        {entrada?.fechaHora ? new Date(entrada.fechaHora).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) : "--:--"}
                      </td>
                      <td className="p-2.5 text-center font-mono text-xs font-bold text-amber-800 print:text-black">
                        {salida?.fechaHora ? new Date(salida.fechaHora).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) : "--:--"}
                      </td>
                      <td className="p-2.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold print:bg-transparent print:border print:border-gray-400 print:text-black ${
                          estado === "PRESENTE" ? "bg-green-100 text-green-800" :
                          estado === "ATRASO" ? "bg-amber-100 text-amber-800" :
                          estado === "FALTA" ? "bg-red-100 text-red-800" :
                          estado === "LICENCIA" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-400"
                        }`}>
                          {estado}
                        </span>
                      </td>
                      <td className="p-2.5 text-center print:hidden">
                        {entrada ? (
                          <form action={justificarAsistenciaSecretaria} className="inline-flex gap-1 items-center">
                            <input type="hidden" name="id" value={entrada.id} />
                            <select name="estado" defaultValue={entrada.estado} className="border rounded p-1 text-[11px] bg-white">
                              <option value="PRESENTE">Presente</option>
                              <option value="LICENCIA">Licencia</option>
                              <option value="FALTA">Falta</option>
                            </select>
                            <button type="submit" title="Guardar justificación" className="bg-yellow-500 text-blue-950 font-bold px-2 py-1 rounded text-[11px] cursor-pointer">
                              Guardar
                            </button>
                          </form>
                        ) : (
                          <span className="text-[11px] text-gray-400 italic">Pendiente</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}