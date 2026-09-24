interface PropsTarjetaEstadistica {
  titulo: string;
  valor: string | number;
  descripcion?: string;
  badge?: string;      
  badgeColor?: string;  
  destacado?: boolean;
}

export default function TarjetaEstadistica({
  titulo,
  valor,
  descripcion,
  badge,
  badgeColor,
  destacado = false,
}: PropsTarjetaEstadistica) {
  return (
    <div
      className={`bg-white p-6 rounded-lg shadow-sm border border-gray-200 ${
        destacado ? "border-t-4 border-t-secondary" : ""
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-on-surface-variant font-semibold text-sm tracking-wider uppercase">
          {titulo}
        </h3>
        {badge && (
          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${badgeColor || "bg-gray-100 text-gray-800"}`}>
            {badge}
          </span>
        )}
      </div>
      <p className="text-4xl font-bold text-primary">{valor}</p>
      {descripcion && (
        <p className="text-xs text-gray-500 mt-2">{descripcion}</p>
      )}
    </div>
  );
}