import { obtenerPadres, eliminarPadre, obtenerPadrePorId } from "@/acciones/padres";
import FormularioPadre from "./formularioPadre";
import Link from "next/link";

export const revalidate = 0;

export default async function PadresAdminPage(
  props: { searchParams: Promise<{ editar?: string }> }
) {
  const padres = await obtenerPadres();
  
  const searchParams = await props.searchParams;
  const editarId = searchParams?.editar ? Number(searchParams.editar) : null;
  let padreAEditar = null;

  if (editarId) {
    padreAEditar = await obtenerPadrePorId(editarId);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Gestión de Padres de Familia</h1>
        <p className="text-gray-500 mt-1">Registra a los apoderados e inscribe a sus hijos de manera simultánea.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* PANEL IZQUIERDO: Formulario */}
        <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-donbosco-azul h-fit sticky top-6">
          <h2 className="text-xl font-bold text-donbosco-oscuro mb-4">
            {padreAEditar ? "✏️ Editar Familia" : "Nueva Inscripción Familiar"}
          </h2>
          <FormularioPadre key={padreAEditar ? padreAEditar.id : "nuevo"} padreAEditar={padreAEditar} />
        </div>

        {/* PANEL DERECHO: Lista */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Familias Registradas ({padres.length})</h2>
          
          {padres.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-4xl block mb-2 opacity-50"></span>
              <p className="text-gray-500">No hay apoderados registrados.</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2">
              {padres.map((padre) => (
                <div key={padre.id} className="border border-gray-200 rounded-lg p-4 hover:border-donbosco-azul transition-colors group">
                  <div className="flex justify-between items-start border-b border-gray-100 pb-3 mb-3">
                    <div>
                      <h3 className="font-bold text-lg text-gray-800">{padre.apellidos}, {padre.nombre}</h3>
                      <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-1">
                        {padre.ci && <span className="bg-gray-100 px-2 py-0.5 rounded font-mono">CI: {padre.ci}</span>}
                        {padre.telefono && <span>📱 {padre.telefono}</span>}
                        {padre.email && <span>✉️ {padre.email}</span>}
                      </div>
                    </div>
                    
                    {/* BOTONES DE ACCIÓN CRUD */}
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <Link 
                        href={`/panel-de-control/admin/padres?editar=${padre.id}`}
                        className="bg-blue-50 text-blue-600 px-3 py-1 rounded text-xs font-bold hover:bg-blue-600 hover:text-white transition-all"
                      >
                        Editar
                      </Link>

                      <form action={eliminarPadre}>
                        <input type="hidden" name="id" value={padre.id} />
                        <button 
                          type="submit" 
                          className="bg-red-50 text-red-600 px-3 py-1 rounded text-xs font-bold hover:bg-red-600 hover:text-white transition-all"
                        >
                          Eliminar
                        </button>
                      </form>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase mb-2">Estudiantes a cargo ({padre.estudiantes?.length || 0})</p>
                    {padre.estudiantes && padre.estudiantes.length > 0 ? (
                      <ul className="space-y-2">
                        {padre.estudiantes.map((est) => (
                          <li key={est.id} className="flex flex-col bg-gray-50 p-2 rounded text-sm border-l-2 border-donbosco-amarillo">
                            <div className="flex justify-between items-center w-full">
                              <span className="font-medium">{est.nombres} {est.apellidos}</span>
                              {/* Comillas corregidas para evitar error de ESLint */}
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-bold">
                                {est.curso} &apos;{est.paralelo}&apos;
                              </span>
                            </div>
                            {est.ci && <span className="text-xs text-gray-400 mt-1 font-mono">CI: {est.ci}</span>}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-red-400 italic">No tiene estudiantes inscritos.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}