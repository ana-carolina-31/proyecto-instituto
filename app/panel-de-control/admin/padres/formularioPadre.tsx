"use client";

import { useState } from "react";
import { guardarPadreConHijos } from "@/acciones/padres";
import Link from "next/link";

interface Hijo {
  id?: number;
  nombres: string;
  apellidos: string;
  ci?: string;
  rude?: string;
  curso: string;
  paralelo: string;
}

interface PadreAEditar {
  id?: number;
  nombre?: string;
  apellidos?: string;
  ci?: string;
  telefono?: string;
  email?: string;
  estudiantes?: Hijo[];
}

export default function FormularioPadre({ padreAEditar = null }: { padreAEditar?: PadreAEditar | null }) {
  const [hijos, setHijos] = useState<Hijo[]>(
    padreAEditar?.estudiantes && padreAEditar.estudiantes.length > 0 
      ? padreAEditar.estudiantes 
      : [{ nombres: "", apellidos: "", ci: "", rude: "", curso: "", paralelo: "" }]
  );
  const [hijosEliminados, setHijosEliminados] = useState<number[]>([]);

  // Funciones auxiliares para filtrar caracteres en tiempo real
  const filtrarSoloLetras = (valor: string) => valor.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, "");
  const filtrarSoloNumeros = (valor: string) => valor.replace(/[^0-9]/g, "");

  const agregarHijo = () => setHijos([...hijos, { nombres: "", apellidos: "", ci: "", rude: "", curso: "", paralelo: "" }]);
  
  const eliminarHijo = (index: number) => {
    const hijoAEliminar = hijos[index];
    if (hijoAEliminar.id) {
      setHijosEliminados([...hijosEliminados, hijoAEliminar.id]);
    }
    setHijos(hijos.filter((_, i) => i !== index));
  };

  const actualizarHijo = (index: number, campo: keyof Hijo, valor: string) => {
    const nuevosHijos = [...hijos];
    nuevosHijos[index] = { ...nuevosHijos[index], [campo]: valor };
    setHijos(nuevosHijos);
  };

  return (
    <form action={guardarPadreConHijos} className="space-y-6">
      {padreAEditar?.id && <input type="hidden" name="id" value={padreAEditar.id} />}
      <input type="hidden" name="hijos" value={JSON.stringify(hijos)} />
      <input type="hidden" name="hijosEliminados" value={JSON.stringify(hijosEliminados)} />

      {/* DATOS DEL PADRE / APODERADO */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h3 className="font-bold text-donbosco-azul mb-3">👤 Datos del Apoderado</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Nombres del Padre: SOLO LETRAS */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombres</label>
            <input 
              type="text" 
              name="nombre" 
              defaultValue={padreAEditar?.nombre || ""} 
              required 
              onInput={(e) => { e.currentTarget.value = filtrarSoloLetras(e.currentTarget.value); }}
              placeholder="Ej. Juan Carlos"
              className="w-full border-gray-300 rounded-md p-2 border focus:ring-donbosco-azul capitalize" 
            />
          </div>

          {/* Apellidos del Padre: SOLO LETRAS */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Apellidos</label>
            <input 
              type="text" 
              name="apellidos" 
              defaultValue={padreAEditar?.apellidos || ""} 
              required 
              onInput={(e) => { e.currentTarget.value = filtrarSoloLetras(e.currentTarget.value); }}
              placeholder="Ej. Mamani Quispe"
              className="w-full border-gray-300 rounded-md p-2 border focus:ring-donbosco-azul capitalize" 
            />
          </div>

          {/* C.I. del Padre: SOLO NÚMEROS */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Carnet de Identidad (CI)</label>
            <input 
              type="text" 
              name="ci" 
              id="ciPadreInput"
              defaultValue={padreAEditar?.ci || ""} 
              required 
              maxLength={10}
              onInput={(e) => { 
                e.currentTarget.value = filtrarSoloNumeros(e.currentTarget.value);
                // Si el campo de correo está vacío, sugerir correo estándar
                const emailInput = document.getElementById("emailPadreInput") as HTMLInputElement;
                if (emailInput && !padreAEditar?.id && (!emailInput.value || emailInput.value.includes("@donbosco.local"))) {
                  emailInput.value = e.currentTarget.value ? `padre.${e.currentTarget.value}@donbosco.local` : "";
                }
              }}
              placeholder="Ej. 8472910" 
              className="w-full border-gray-300 rounded-md p-2 border focus:ring-donbosco-azul font-mono" 
            />
          </div>

          {/* Celular del Padre: SOLO NÚMEROS */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Celular / Teléfono</label>
            <input 
              type="text" 
              name="telefono" 
              defaultValue={padreAEditar?.telefono || ""} 
              required 
              maxLength={9} 
              onInput={(e) => { e.currentTarget.value = filtrarSoloNumeros(e.currentTarget.value); }} 
              placeholder="Ej. 71234567"
              className="w-full border-gray-300 rounded-md p-2 border focus:ring-donbosco-azul font-mono" 
            />
          </div>

          {/* Correo Electrónico: Con opción para padres sin correo */}
          <div className="md:col-span-2">
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-gray-700">Correo Electrónico (Para Login)</label>
              <span className="text-xs text-blue-700 font-medium bg-blue-100 px-2 py-0.5 rounded">
                Si no tiene correo, use: padre.[CI]@donbosco.local
              </span>
            </div>
            <input 
              type="email" 
              name="email" 
              id="emailPadreInput"
              defaultValue={padreAEditar?.email || ""} 
              required 
              placeholder="padre.8472910@donbosco.local o correo@gmail.com"
              className="w-full border-gray-300 rounded-md p-2 border focus:ring-donbosco-azul lowercase" 
            />
          </div>
        </div>
      </div>

      {/* DATOS DE LOS HIJOS (ESTUDIANTES) */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-gray-800">🎓 Estudiantes a Inscribir</h3>
          <button 
            type="button" 
            onClick={agregarHijo} 
            className="bg-donbosco-amarillo text-donbosco-oscuro px-3 py-1.5 rounded text-sm font-bold shadow hover:bg-yellow-400 transition-colors"
          >
            + Agregar otro hijo
          </button>
        </div>

        {hijos.map((hijo, index) => (
          <div key={index} className="bg-blue-50 p-4 rounded-lg border border-blue-200 relative">
            {hijos.length > 1 && (
              <button 
                type="button" 
                onClick={() => eliminarHijo(index)} 
                className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-sm font-bold"
              >
                ✕ Quitar
              </button>
            )}
            <p className="text-xs font-bold text-gray-400 uppercase mb-3">Estudiante {index + 1}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Nombres hijo: SOLO LETRAS */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nombres</label>
                <input 
                  type="text" 
                  required 
                  value={hijo.nombres || ""} 
                  onChange={(e) => actualizarHijo(index, "nombres", filtrarSoloLetras(e.target.value))} 
                  placeholder="Ej. Mateo"
                  className="w-full border-gray-300 rounded-md p-2 border text-sm capitalize" 
                />
              </div>

              {/* Apellidos hijo: SOLO LETRAS */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Apellidos</label>
                <input 
                  type="text" 
                  required 
                  value={hijo.apellidos || ""} 
                  onChange={(e) => actualizarHijo(index, "apellidos", filtrarSoloLetras(e.target.value))} 
                  placeholder="Ej. Mamani Flores"
                  className="w-full border-gray-300 rounded-md p-2 border text-sm capitalize" 
                />
              </div>

              {/* CI del Estudiante: SOLO NÚMEROS */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">CI del Estudiante</label>
                <input 
                  type="text" 
                  value={hijo.ci || ""} 
                  maxLength={10}
                  onChange={(e) => actualizarHijo(index, "ci", filtrarSoloNumeros(e.target.value))} 
                  placeholder="Ej. 12938472"
                  className="w-full border-gray-300 rounded-md p-2 border text-sm font-mono" 
                />
              </div>

              {/* Curso */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Curso</label>
                <select 
                  required 
                  value={hijo.curso || ""} 
                  onChange={(e) => actualizarHijo(index, "curso", e.target.value)} 
                  className="w-full border-gray-300 rounded-md p-2 border text-sm bg-white"
                >
                  <option value="">-- Seleccionar --</option>
                  <optgroup label="Nivel Inicial">
                    <option value="Inicial (Pre-Kínder)">Inicial (Pre-Kínder)</option>
                    <option value="Inicial (Kínder)">Inicial (Kínder)</option>
                  </optgroup>
                  <optgroup label="Nivel Primario">
                    <option value="1ro de Primaria">1ro de Primaria</option>
                    <option value="2do de Primaria">2do de Primaria</option>
                    <option value="3ro de Primaria">3ro de Primaria</option>
                    <option value="4to de Primaria">4to de Primaria</option>
                    <option value="5to de Primaria">5to de Primaria</option>
                    <option value="6to de Primaria">6to de Primaria</option>
                  </optgroup>
                  <optgroup label="Nivel Secundario">
                    <option value="1ro de Secundaria">1ro de Secundaria</option>
                    <option value="2do de Secundaria">2do de Secundaria</option>
                    <option value="3ro de Secundaria">3ro de Secundaria</option>
                    <option value="4to de Secundaria">4to de Secundaria</option>
                    <option value="5to de Secundaria">5to de Secundaria</option>
                    <option value="6to de Secundaria">6to de Secundaria</option>
                  </optgroup>
                </select>
              </div>

              {/* Paralelo y RUDE */}
              <div className="flex gap-2 md:col-span-2">
                <div className="w-1/3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Paralelo</label>
                  <select 
                    required 
                    value={hijo.paralelo || ""} 
                    onChange={(e) => actualizarHijo(index, "paralelo", e.target.value)} 
                    className="w-full border-gray-300 rounded-md p-2 border text-sm bg-white"
                  >
                    <option value="">-</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                  </select>
                </div>
                
                {/* RUDE: SOLO NÚMEROS */}
                <div className="w-2/3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Código RUDE (Obligatorio)</label>
                  <input 
                    type="text" 
                    required
                    value={hijo.rude || ""} 
                    maxLength={17}
                    onChange={(e) => actualizarHijo(index, "rude", filtrarSoloNumeros(e.target.value))} 
                    placeholder="Solo números (ej. 807300212023)"
                    className="w-full border-gray-300 rounded-md p-2 border text-sm font-mono" 
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button 
        type="submit" 
        className="w-full bg-donbosco-azul hover:bg-blue-900 text-white font-bold py-3 rounded-md transition-colors shadow-lg cursor-pointer"
      >
        {padreAEditar ? "💾 Guardar Cambios" : "✅ Registrar Padres Y Estudiantes"}
      </button>

      {padreAEditar && (
        <Link href="/panel-de-control/admin/padres" className="block text-center text-sm text-red-600 hover:underline mt-3 font-bold">
          Cancelar Edición
        </Link>
      )}
    </form>
  );
}