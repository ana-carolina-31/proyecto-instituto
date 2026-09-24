import { 
  guardarComunicado, 
  obtenerTodosLosComunicados, 
  eliminarComunicado, 
  obtenerComunicadoPorId 
} from "@/acciones/comunicados";
import prisma from "@/lib/prisma";
import Link from "next/link";

export const revalidate = 0;

interface AutorInfo {
  nombre?: string;
  apellidos?: string;
}

interface ComunicadoItem {
  id: number;
  titulo: string;
  contenido: string;
  fecha: string | Date;
  dirigidoA: string;
  autor?: AutorInfo | null;
}

export default async function ComunicadosAdminPage(
  props: { searchParams: Promise<{ editar?: string }> }
) {
  const [comunicadosBrutos, todasLasLecturas] = await Promise.all([
    obtenerTodosLosComunicados(),
    prisma.lecturaComunicado.findMany({
      select: { comunicadoId: true }
    })
  ]);

  const conteoLecturas = new Map<number, number>();
  for (const lec of todasLasLecturas) {
    conteoLecturas.set(lec.comunicadoId, (conteoLecturas.get(lec.comunicadoId) || 0) + 1);
  }

  const comunicados: ComunicadoItem[] = comunicadosBrutos;
  
  const searchParams = await props.searchParams;
  const editarId = searchParams?.editar ? Number(searchParams.editar) : null;
  
  let comunicadoData = null;
  if (editarId) {
    const res = await obtenerComunicadoPorId(editarId);
    if (res && typeof res === "object" && "id" in res) {
      comunicadoData = res as ComunicadoItem;
    }
  }

  const esEdicion = comunicadoData !== null;

  return (
    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Gestión de Comunicados</h1>
        <p className="text-gray-500 mt-1">Envía, edita o elimina avisos importantes y verifica acuses de lectura.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        
        {/* Panel Izquierdo: Formulario Dinámico (Crear / Editar) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            {esEdicion ? "✏️ Editar Comunicado" : "📝 Nuevo Comunicado"}
          </h2>
          
          <form action={guardarComunicado} className="space-y-4">
            {esEdicion && comunicadoData && (
              <input 
                type="hidden" 
                name="id" 
                value={String(comunicadoData.id)} 
              />
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título del Mensaje</label>
              <input 
                type="text" 
                name="titulo" 
                required 
                defaultValue={comunicadoData?.titulo || ""}
                className="w-full border-gray-300 rounded-md p-2 border focus:ring-blue-500 focus:border-blue-500" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contenido</label>
              <textarea 
                name="contenido" 
                required 
                rows={5} 
                defaultValue={comunicadoData?.contenido || ""}
                className="w-full border-gray-300 rounded-md p-2 border resize-none focus:ring-blue-500 focus:border-blue-500" 
              ></textarea>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dirigido a</label>
              <select 
                name="dirigidoA" 
                required 
                defaultValue={comunicadoData?.dirigidoA || "TODOS"} 
                className="w-full border-gray-300 rounded-md p-2 border bg-white"
              >
                <option value="TODOS">Todos</option>
                <option value="PADRES">Padres de Familia</option>
                <option value="PROFESORES">Profesores</option>
              </select>
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md font-medium transition-colors mt-2 cursor-pointer">
              {esEdicion ? "Guardar Cambios" : "Publicar Comunicado"}
            </button>
            {esEdicion && (
              <Link 
                href="/panel-de-control/admin/comunicados" 
                className="block text-center text-sm text-red-600 hover:underline mt-3"
              >
                Cancelar Edición
              </Link>
            )}
          </form>
        </div>

        {/* Panel Derecho: Historial de Comunicados con contador de lecturas */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Historial de Envíos ({comunicados.length})</h3>
          
          {comunicados.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <span className="text-4xl block mb-2">📢</span>
              <p>No se han emitido comunicados.</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {comunicados.map((comunicado) => {
                const totalLecturas = conteoLecturas.get(comunicado.id) || 0;

                return (
                  <div key={comunicado.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50 flex flex-col justify-between">
                    
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-gray-800 text-lg">{comunicado.titulo}</h4>
                        <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border shadow-sm">
                          {new Date(comunicado.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-3 whitespace-pre-wrap">{comunicado.contenido}</p>
                      
                      <div className="mb-3 text-xs font-semibold text-emerald-800 bg-emerald-50 p-2 rounded border border-emerald-200 flex items-center gap-1.5 w-fit">
                        <span>👁️</span>
                        <span>Confirmaciones de lectura: <strong className="font-bold">{totalLecturas}</strong> apoderado(s) han confirmado ver este aviso.</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-end border-t border-gray-200 pt-3 mt-2">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs px-2 py-1 rounded font-bold border bg-blue-50 text-blue-700 border-blue-200 w-fit">
                          Para: {comunicado.dirigidoA}
                        </span>
                        <span className="text-xs text-gray-500 italic">
                          Autor: {comunicado.autor?.nombre || "Dirección"} {comunicado.autor?.apellidos || ""}
                        </span>
                      </div>
                      
                      <div className="flex gap-2">
                        <Link 
                          href={`/panel-de-control/admin/comunicados?editar=${comunicado.id}`}
                          className="px-3 py-1 bg-white border border-gray-300 text-gray-700 rounded text-xs font-medium hover:bg-gray-100 transition-colors"
                        >
                          Editar
                        </Link>
                        
                        <form action={eliminarComunicado}>
                          <input type="hidden" name="id" value={comunicado.id} />
                          <button 
                            type="submit" 
                            className="px-3 py-1 bg-red-50 border border-red-200 text-red-700 rounded text-xs font-medium hover:bg-red-100 transition-colors cursor-pointer"
                          >
                            Eliminar
                          </button>
                        </form>
                      </div>
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