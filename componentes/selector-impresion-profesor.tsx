"use client";

export default function SelectorImpresionProfesor() {
  const aplicarYImprimir = (nuevoModo: "ambos" | "notas" | "asistencia") => {
    document.body.classList.remove("print-solo-notas", "print-solo-asistencia", "print-ambos");
    if (nuevoModo === "notas") {
      document.body.classList.add("print-solo-notas");
    } else if (nuevoModo === "asistencia") {
      document.body.classList.add("print-solo-asistencia");
    } else {
      document.body.classList.add("print-ambos");
    }

    setTimeout(() => {
      window.print();
    }, 150);
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-3 print:hidden">
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Centro de Exportación Oficial</p>
        <p className="text-sm font-semibold text-blue-950">Seleccione la sección que desea generar en PDF:</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => aplicarYImprimir("notas")}
          className="bg-blue-700 hover:bg-blue-800 text-white font-bold px-3.5 py-2 rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
        >
          <span>📑</span> PDF Solo Notas
        </button>

        <button
          type="button"
          onClick={() => aplicarYImprimir("asistencia")}
          className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3.5 py-2 rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
        >
          <span>📋</span> PDF Solo Asistencia
        </button>

        <button
          type="button"
          onClick={() => aplicarYImprimir("ambos")}
          className="bg-purple-700 hover:bg-purple-800 text-white font-bold px-3.5 py-2 rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
        >
          <span>📄</span> Boletín Completo
        </button>
      </div>
    </div>
  );
}