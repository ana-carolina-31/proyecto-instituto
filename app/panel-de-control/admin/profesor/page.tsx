import { crearProfesor, obtenerProfesores } from "@/acciones/profesores";
import Link from "next/link";

const MATERIAS_SECUNDARIA = [
  "Matemáticas", "Comunicación y Lenguajes", "Ciencias Sociales", 
  "Ciencias Naturales - Física", "Ciencias Naturales - Química", 
  "Biología y Geografía", "Artes Plásticas", "Educación Musical", 
  "Educación Física", "Valores y Religión", "Computación"
];

const DIAS_SEMANA = [
  { clave: "lunes", label: "Lunes" },
  { clave: "martes", label: "Martes" },
  { clave: "miercoles", label: "Miércoles" },
  { clave: "jueves", label: "Jueves" },
  { clave: "viernes", label: "Viernes" },
];

export const revalidate = 0;

interface ProfesorItem {
  id: number;
  nombre: string;
  apellidos: string;
  ci: string;
  email: string;
  materia?: string | null;
  horaIngreso?: string | null;
}

export default async function ProfesorAdminPage() {
  const profesoresRaw = await obtenerProfesores();
  const profesores = profesoresRaw as unknown as ProfesorItem[];

  return (
    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gestión de Docentes</h1>
          <p className="text-gray-500 text-sm">Registro de profesores con carga horaria semanal por día.</p>
        </div>
        <Link 
          href="/panel-de-control/admin/profesor/asistencia" 
          className="bg-[#0A10CC] text-white px-4 py-2 rounded-md text-sm hover:bg-blue-900 transition font-medium shadow"
        >
          Terminal de Asistencia &rarr;
        </Link>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Registrar Nuevo Docente</h2>
        
        <form action={crearProfesor} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Nombres</label>
              <input 
                type="text" 
                name="nombre" 
                required 
                placeholder="Ej. Cristian" 
                className="w-full border rounded-md p-2 text-sm capitalize" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Apellidos</label>
              <input 
                type="text" 
                name="apellidos" 
                required 
                placeholder="Ej. Pérez Gómez" 
                className="w-full border rounded-md p-2 text-sm capitalize" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Carnet de Identidad (C.I.)</label>
              <input 
                type="text" 
                name="ci" 
                required 
                maxLength={10} 
                placeholder="Ej. 6085121" 
                className="w-full border rounded-md p-2 text-sm font-mono" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Correo Electrónico</label>
              <input 
                type="email" 
                name="email" 
                required 
                placeholder="docente@donbosco.edu" 
                className="w-full border rounded-md p-2 text-sm lowercase" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Materia Asignada</label>
              <select name="materia" required className="w-full border rounded-md p-2 text-sm bg-white">
                <option value="">-- Seleccionar Materia --</option>
                {MATERIAS_SECUNDARIA.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Días y horas de asistencia */}
          <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-200">
            <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wide mb-3">
              📅 Días de Asistencia y Horarios (Entrada y Salida)
            </h3>
            <div className="space-y-2">
              {DIAS_SEMANA.map((dia) => (
                <div key={dia.clave} className="flex flex-wrap items-center justify-between gap-2 bg-white p-2.5 rounded-lg border border-gray-200 text-xs">
                  <label className="flex items-center gap-2 font-bold text-gray-800 w-28">
                    <input 
                      type="checkbox" 
                      name={`dia_${dia.clave}`} 
                      defaultChecked 
                      className="w-4 h-4 text-blue-600 rounded" 
                    />
                    {dia.label}
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 font-medium">Entrada:</span>
                    <input 
                      type="time" 
                      name={`entrada_${dia.clave}`} 
                      defaultValue="07:30" 
                      className="border rounded p-1 font-mono text-xs bg-gray-50" 
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 font-medium">Salida:</span>
                    <input 
                      type="time" 
                      name={`salida_${dia.clave}`} 
                      defaultValue="12:30" 
                      className="border rounded p-1 font-mono text-xs bg-gray-50" 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full bg-[#0A10CC] hover:bg-blue-900 text-white font-bold py-3 rounded-lg text-sm transition cursor-pointer"
          >
            Guardar Docente con su Horario
          </button>
        </form>
      </div>

      {/* Lista de Profesores Registrados */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Profesores Registrados ({profesores.length})</h3>
        {profesores.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <span className="text-3xl block mb-2">👨‍🏫</span>
            <p className="text-sm">No hay profesores registrados aún.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {profesores.map((p) => (
              <li key={p.id} className="py-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 hover:bg-gray-50 px-2 rounded-md transition-colors">
                <div>
                  <span className="font-medium text-gray-800 text-sm">{p.apellidos} {p.nombre}</span>
                  <span className="ml-2 text-xs bg-blue-50 text-[#0A10CC] px-2 py-0.5 rounded font-medium border border-blue-100">
                    {p.materia || "Sin materia"}
                  </span>
                  <span className="ml-2 text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-mono">
                    Entrada Ref.: {p.horaIngreso || "07:30"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 font-mono bg-gray-50 border px-2 py-0.5 rounded">
                    CI: {p.ci}
                  </span>
                  <span className="text-xs text-gray-600 bg-gray-100 border border-gray-200 px-3 py-1 rounded-full font-mono">
                    {p.email}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}