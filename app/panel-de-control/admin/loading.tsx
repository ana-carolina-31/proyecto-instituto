export default function PantallaDeCarga() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      {/* Animación de carga con los colores de Don Bosco (Azul y Amarillo) */}
      <div className="relative flex items-center justify-center">
        <div className="w-14 h-14 border-4 border-gray-200 border-t-[#0A10CC] border-r-[#F2D707] rounded-full animate-spin"></div>
        <span className="absolute text-lg">😃</span>
      </div>

      <div className="text-center">
        <p className="text-base font-bold text-gray-700 tracking-wide">
          Cargando información...
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          Unidad Educativa Don Bosco
        </p>
      </div>
    </div>
  );
}