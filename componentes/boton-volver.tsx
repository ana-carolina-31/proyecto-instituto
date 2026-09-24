"use client";

export default function BotonVolver() {
  return (
    <button
      onClick={() => window.history.back()}
      className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow transition-colors cursor-pointer"
    >
      <span>⬅️</span> Volver Atrás
    </button>
  );
}