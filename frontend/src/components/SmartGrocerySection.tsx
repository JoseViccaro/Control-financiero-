import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Check, 
  ShoppingCart, 
  Plus, 
  Smartphone, 
  Trash2, 
  Edit2, 
  RotateCcw,
  Sparkles
} from 'lucide-react';

export interface UserCustomGroceryProduct {
  id: string;
  nombre: string;
  seccion: 'fruta y verdura' | 'proteínas' | 'despensa' | 'lácteos' | 'congelados' | 'limpieza' | 'otros';
  precioUltimaCompra: number; // 0 si aún no se le ha asignado precio
  cantidad: string;
  incluirEnCesta: boolean; // Si está activo para la compra de esta semana
}

// Productos habituales pre-configurados para añadir con un solo toque
const SUGERENCIAS_RAPIDAS: Array<{ nombre: string; seccion: UserCustomGroceryProduct['seccion']; precio: number; cantidad: string }> = [
  { nombre: 'Leche (Pack 6)', seccion: 'lácteos', precio: 5.40, cantidad: '6 briks' },
  { nombre: 'Huevos L (Docena)', seccion: 'proteínas', precio: 2.60, cantidad: '12 uds' },
  { nombre: 'Pechuga de pollo', seccion: 'proteínas', precio: 6.50, cantidad: '1 bandeja' },
  { nombre: 'Plátanos de Canarias', seccion: 'fruta y verdura', precio: 2.20, cantidad: '1 kg' },
  { nombre: 'Manzanas', seccion: 'fruta y verdura', precio: 2.10, cantidad: '1 kg' },
  { nombre: 'Tomates ensalada', seccion: 'fruta y verdura', precio: 2.40, cantidad: '1 kg' },
  { nombre: 'Arroz redondo', seccion: 'despensa', precio: 1.35, cantidad: '1 kg' },
  { nombre: 'Pasta / Espaguetis', seccion: 'despensa', precio: 1.25, cantidad: '500g' },
  { nombre: 'Aceite de oliva virgen', seccion: 'despensa', precio: 8.90, cantidad: '1 L' },
  { nombre: 'Yogures naturales', seccion: 'lácteos', precio: 1.80, cantidad: 'Pack 4' },
  { nombre: 'Pan de molde', seccion: 'despensa', precio: 1.45, cantidad: '1 paquete' },
  { nombre: 'Detergente lavadora', seccion: 'limpieza', precio: 4.90, cantidad: '1 botella' },
  { nombre: 'Papel higiénico', seccion: 'limpieza', precio: 3.80, cantidad: 'Pack 12' },
  { nombre: 'Café molido', seccion: 'despensa', precio: 3.20, cantidad: '250g' }
];

export const SmartGrocerySection: React.FC = () => {
  // Lista de productos en memoria
  const [productos, setProductos] = useState<UserCustomGroceryProduct[]>([
    { id: 'p_1', nombre: 'Leche (Pack 6)', seccion: 'lácteos', precioUltimaCompra: 5.40, cantidad: '6 briks', incluirEnCesta: true },
    { id: 'p_2', nombre: 'Huevos L', seccion: 'proteínas', precioUltimaCompra: 2.60, cantidad: '12 uds', incluirEnCesta: true },
    { id: 'p_3', nombre: 'Pechuga de pollo', seccion: 'proteínas', precioUltimaCompra: 6.50, cantidad: '1 bandeja', incluirEnCesta: true },
    { id: 'p_4', nombre: 'Plátanos', seccion: 'fruta y verdura', precioUltimaCompra: 2.20, cantidad: '1 kg', incluirEnCesta: true },
    { id: 'p_5', nombre: 'Aceite de Oliva', seccion: 'despensa', precioUltimaCompra: 8.90, cantidad: '1 L', incluirEnCesta: false },
    { id: 'p_6', nombre: 'Detergente', seccion: 'limpieza', precioUltimaCompra: 4.90, cantidad: '1 ud', incluirEnCesta: false },
  ]);

  const [presupuestoTope, setPresupuestoTope] = useState<number>(85);

  // Estados de control y compra activa
  const [modoSupermercado, setModoSupermercado] = useState(false);
  const [checkedInCart, setCheckedInCart] = useState<Record<string, boolean>>({});
  
  // Input rápido
  const [quickInputNombre, setQuickInputNombre] = useState('');
  const [quickInputPrecio, setQuickInputPrecio] = useState('');

  // Modal para actualizar precio en caliente
  const [editingProduct, setEditingProduct] = useState<UserCustomGroceryProduct | null>(null);
  const [editPrecio, setEditPrecio] = useState('');

  // Marcar / desmarcar si entra a la compra semanal
  const toggleIncludeInBasket = (id: string) => {
    setProductos(prev => prev.map(p => p.id === id ? { ...p, incluirEnCesta: !p.incluirEnCesta } : p));
  };

  // Marcar / desmarcar mientras estás en el supermercado
  const toggleCartCheck = (id: string) => {
    setCheckedInCart(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Desmarcar todos los checks del carrito (para reiniciar compra)
  const handleResetCartChecks = () => {
    if (confirm('¿Desmarcar todos los productos recogidos para empezar una nueva compra?')) {
      setCheckedInCart({});
    }
  };

  // Añadir producto rápido desde la barra superior
  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInputNombre.trim()) return;

    const precioNum = parseFloat(quickInputPrecio.replace(',', '.')) || 0;
    const nuevo: UserCustomGroceryProduct = {
      id: 'prod_' + Date.now(),
      nombre: quickInputNombre.trim(),
      seccion: 'despensa',
      precioUltimaCompra: precioNum,
      cantidad: '1 ud',
      incluirEnCesta: true,
    };

    setProductos([nuevo, ...productos]);
    setQuickInputNombre('');
    setQuickInputPrecio('');
  };

  const handleAddSugerencia = (sug: typeof SUGERENCIAS_RAPIDAS[0]) => {
    const existe = productos.find(p => p.nombre.toLowerCase() === sug.nombre.toLowerCase());
    if (existe) {
      toggleIncludeInBasket(existe.id);
      return;
    }

    const nuevo: UserCustomGroceryProduct = {
      id: 'prod_' + Date.now() + Math.random(),
      nombre: sug.nombre,
      seccion: sug.seccion,
      precioUltimaCompra: sug.precio,
      cantidad: sug.cantidad,
      incluirEnCesta: true,
    };
    setProductos([nuevo, ...productos]);
  };

  const handleUpdatePrice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    const nuevoPrecio = parseFloat(editPrecio.replace(',', '.'));
    if (isNaN(nuevoPrecio) || nuevoPrecio < 0) return;

    setProductos(prev => prev.map(p => p.id === editingProduct.id ? { ...p, precioUltimaCompra: nuevoPrecio } : p));
    setEditingProduct(null);
  };

  const removeProduct = (id: string) => {
    setProductos(prev => prev.filter(p => p.id !== id));
  };

  // Productos activos en la cesta de esta compra
  const productosEnCesta = productos.filter(p => p.incluirEnCesta);
  
  // Totales calculados en tiempo real
  const totalEstimadoCesta = +(productosEnCesta.reduce((sum, p) => sum + (p.precioUltimaCompra || 0), 0)).toFixed(2);
  const itemsEnCarrito = productosEnCesta.filter(p => checkedInCart[p.id]);
  const totalEnCarrito = +(itemsEnCarrito.reduce((sum, p) => sum + (p.precioUltimaCompra || 0), 0)).toFixed(2);
  const itemsPendientes = productosEnCesta.filter(p => !checkedInCart[p.id]);
  const totalPendiente = +(itemsPendientes.reduce((sum, p) => sum + (p.precioUltimaCompra || 0), 0)).toFixed(2);

  const margenRestante = +(presupuestoTope - totalEnCarrito).toFixed(2);
  const porcentajePresupuestoUsado = presupuestoTope > 0 ? Math.min(100, Math.round((totalEnCarrito / presupuestoTope) * 100)) : 0;

  const getSectionBadge = (sec: UserCustomGroceryProduct['seccion']) => {
    const map: Record<string, { bg: string; text: string }> = {
      'fruta y verdura': { bg: 'bg-emerald-50', text: 'text-emerald-700 border-emerald-200' },
      'proteínas': { bg: 'bg-rose-50', text: 'text-rose-700 border-rose-200' },
      'despensa': { bg: 'bg-amber-50', text: 'text-amber-700 border-amber-200' },
      'lácteos': { bg: 'bg-blue-50', text: 'text-blue-700 border-blue-200' },
      'congelados': { bg: 'bg-cyan-50', text: 'text-cyan-700 border-cyan-200' },
      'limpieza': { bg: 'bg-purple-50', text: 'text-purple-700 border-purple-200' },
      'otros': { bg: 'bg-slate-50', text: 'text-slate-700 border-slate-200' },
    };
    const style = map[sec] || { bg: 'bg-slate-50', text: 'text-slate-700 border-slate-200' };
    return (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${style.bg} ${style.text}`}>
        {sec}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-7 border border-slate-200/80 shadow-sm space-y-6">
      
      {/* Header Principal con Selector de Modo Móvil */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 mb-1 border border-emerald-200/60">
              <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" /> Modo Súper en Vivo
            </span>
            {modoSupermercado && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 animate-pulse">
                Comprando en tienda
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Control de Compra en el Supermercado
          </h2>
          <p className="text-xs text-slate-500">
            Apunta lo que necesitas, marca lo que metes al carrito y controla al céntimo lo que vas a pagar en caja.
          </p>
        </div>

        {/* Botón Switch Modo Móvil / En Tienda */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setModoSupermercado(!modoSupermercado)}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm font-extrabold transition-all cursor-pointer shadow-sm ${
              modoSupermercado
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200 scale-[1.02]'
                : 'bg-slate-900 hover:bg-slate-800 text-white'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>{modoSupermercado ? '✅ Salir de Modo Tienda' : '🛒 Activar Modo Tienda (Móvil)'}</span>
          </button>
        </div>
      </div>

      {/* PANEL RESUMEN FLOTANTE/DESTACADO: Suma total de lo que vas a gastar */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-md space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center sm:text-left">
          
          {/* Total que vas a gastar */}
          <div className="col-span-2 sm:col-span-1 border-b sm:border-b-0 sm:border-r border-slate-700/60 pb-3 sm:pb-0 sm:pr-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Total a Gastar</span>
            <p className="text-3xl font-black font-mono tracking-tight mt-0.5 text-white">
              {totalEstimadoCesta.toFixed(2)} <span className="text-lg font-normal text-slate-400">€</span>
            </p>
            <p className="text-[11px] text-slate-300 mt-0.5">
              {productosEnCesta.length} artículos en tu lista
            </p>
          </div>

          {/* Llevas en Carrito */}
          <div className="border-r border-slate-700/60 pr-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">En el Carrito</span>
            <p className="text-2xl sm:text-3xl font-black font-mono text-emerald-400 mt-0.5">
              {totalEnCarrito.toFixed(2)} <span className="text-sm font-normal text-slate-400">€</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {itemsEnCarrito.length} recogidos
            </p>
          </div>

          {/* Pendiente por coger */}
          <div className="border-b sm:border-b-0 sm:border-r border-slate-700/60 pb-3 sm:pb-0 sm:pr-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Por Recoger</span>
            <p className="text-2xl sm:text-3xl font-black font-mono text-amber-400 mt-0.5">
              {totalPendiente.toFixed(2)} <span className="text-sm font-normal text-slate-400">€</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {itemsPendientes.length} pendientes
            </p>
          </div>

          {/* Presupuesto Tope y Margen */}
          <div>
            <div className="flex items-center justify-between sm:justify-start gap-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Presupuesto</span>
              <input
                type="number"
                value={presupuestoTope}
                onChange={(e) => setPresupuestoTope(parseFloat(e.target.value) || 0)}
                className="w-16 bg-slate-800 text-white font-mono font-bold text-xs px-1.5 py-0.5 rounded border border-slate-700 focus:outline-none text-right"
                title="Cambiar presupuesto tope"
              />
              <span className="text-xs text-slate-400">€</span>
            </div>
            <p className={`text-2xl font-black font-mono mt-0.5 ${margenRestante >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {margenRestante >= 0 ? `+${margenRestante.toFixed(2)} €` : `${margenRestante.toFixed(2)} €`}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {margenRestante >= 0 ? 'Margen disponible' : '¡Presupuesto superado!'}
            </p>
          </div>
        </div>

        {/* Barra de Progreso Visual */}
        <div className="space-y-1.5 pt-2 border-t border-slate-700/60">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span>Progreso en tienda: {itemsEnCarrito.length} de {productosEnCesta.length} productos</span>
            <span className="font-mono font-bold">{porcentajePresupuestoUsado}% del tope</span>
          </div>
          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${totalEnCarrito > presupuestoTope ? 'bg-rose-500' : 'bg-emerald-500'}`}
              style={{ width: `${Math.min(100, (totalEnCarrito / (presupuestoTope || 1)) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* FORMULARIO RÁPIDO PARA EL MÓVIL: Añadir producto al instante */}
      <form onSubmit={handleQuickAdd} className="flex flex-col sm:flex-row items-center gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-200">
        <div className="relative w-full sm:flex-1">
          <input
            type="text"
            placeholder="Añadir producto rápido (ej. Pan, Café, Detergente...)"
            value={quickInputNombre}
            onChange={(e) => setQuickInputNombre(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-28 sm:w-28 shrink-0">
            <input
              type="text"
              placeholder="Precio €"
              value={quickInputPrecio}
              onChange={(e) => setQuickInputPrecio(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            />
          </div>
          <button
            type="submit"
            disabled={!quickInputNombre.trim()}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-40 transition cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Añadir</span>
          </button>
        </div>
      </form>

      {/* VISTA 1: MODO SUPERMERCADO ACTIVO (Optimizado para una sola mano en el móvil) */}
      {modoSupermercado ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span>Lista de Compra en Mano</span>
              <span className="text-xs font-normal text-slate-500">
                (Toca cada artículo para tacharlo y sumarlo al carrito)
              </span>
            </h3>
            {itemsEnCarrito.length > 0 && (
              <button
                onClick={handleResetCartChecks}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" /> Reiniciar
              </button>
            )}
          </div>

          {productosEnCesta.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-3xl space-y-2">
              <p className="text-sm font-bold text-slate-800">No tienes productos seleccionados para esta compra</p>
              <p className="text-xs text-slate-400">
                Usa el buscador de arriba o sal del Modo Tienda para marcar los productos de tu despensa.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Productos PENDIENTES de recoger (Arriba, destacados para el móvil) */}
              {itemsPendientes.map((prod) => (
                <div
                  key={prod.id}
                  onClick={() => toggleCartCheck(prod.id)}
                  className="p-3.5 sm:p-4 rounded-2xl bg-white border-2 border-slate-200 hover:border-emerald-500 shadow-xs flex items-center justify-between gap-3 cursor-pointer select-none active:scale-[0.98] transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl border-2 border-slate-300 bg-slate-50 flex items-center justify-center shrink-0 text-transparent">
                      <Check className="w-5 h-5 stroke-[3]" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm sm:text-base text-slate-900 truncate">{prod.nombre}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {getSectionBadge(prod.seccion)}
                        <span className="text-xs text-slate-400">{prod.cantidad}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <span className="font-mono font-black text-base sm:text-lg text-slate-900">
                      {prod.precioUltimaCompra > 0 ? `${prod.precioUltimaCompra.toFixed(2)} €` : '0.00 €'}
                    </span>
                    <button
                      onClick={() => {
                        setEditingProduct(prod);
                        setEditPrecio(prod.precioUltimaCompra ? prod.precioUltimaCompra.toString() : '');
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition"
                      title="Editar precio"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Productos YA RECOGIDOS (Abajo, atenuados y tachados) */}
              {itemsEnCarrito.length > 0 && (
                <div className="pt-4 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-semibold">
                    <span>En el carrito ({itemsEnCarrito.length})</span>
                    <span>{totalEnCarrito.toFixed(2)} €</span>
                  </div>
                  {itemsEnCarrito.map((prod) => (
                    <div
                      key={prod.id}
                      onClick={() => toggleCartCheck(prod.id)}
                      className="p-3 rounded-2xl bg-slate-50 border border-slate-200/60 opacity-60 flex items-center justify-between gap-3 cursor-pointer select-none active:scale-[0.98] transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-slate-600 line-through truncate">{prod.nombre}</p>
                          <span className="text-[11px] text-slate-400">{prod.cantidad}</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0 font-mono font-bold text-sm text-slate-500 line-through">
                        {prod.precioUltimaCompra > 0 ? `${prod.precioUltimaCompra.toFixed(2)} €` : '0.00 €'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* VISTA 2: GESTIÓN DE LA LISTA HABITUAL (Preparar la compra antes de ir) */
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Tu Despensa y Lista Habitual</h3>
              <span className="text-xs text-slate-400 font-medium">({productos.length} productos guardados)</span>
            </div>

            {/* Sugerencias Rápidas Populares */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <span className="text-slate-400 shrink-0 flex items-center gap-1 font-semibold">
                <Sparkles className="w-3 h-3 text-amber-500" /> Añadir básico:
              </span>
              {SUGERENCIAS_RAPIDAS.slice(0, 4).map((sug, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAddSugerencia(sug)}
                  className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-[11px] transition cursor-pointer"
                >
                  + {sug.nombre}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {productos.map((prod) => (
              <div
                key={prod.id}
                className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                  prod.incluirEnCesta 
                    ? 'bg-white border-slate-300 shadow-xs' 
                    : 'bg-slate-50/70 border-slate-200/60 opacity-65'
                }`}
              >
                {/* Checkbox para incluir en la compra semanal */}
                <div 
                  onClick={() => toggleIncludeInBasket(prod.id)}
                  className="flex items-center gap-3 min-w-0 cursor-pointer select-none flex-1"
                >
                  <div
                    className={`w-6 h-6 rounded-lg border flex items-center justify-center transition shrink-0 ${
                      prod.incluirEnCesta 
                        ? 'bg-slate-900 border-slate-900 text-white' 
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {prod.incluirEnCesta && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <div className="min-w-0">
                    <p className={`font-bold text-xs sm:text-sm truncate ${prod.incluirEnCesta ? 'text-slate-900' : 'text-slate-600'}`}>
                      {prod.nombre}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {getSectionBadge(prod.seccion)}
                      <span className="text-[11px] text-slate-400">{prod.cantidad}</span>
                    </div>
                  </div>
                </div>

                {/* Precio y Acciones */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setEditingProduct(prod);
                      setEditPrecio(prod.precioUltimaCompra ? prod.precioUltimaCompra.toString() : '');
                    }}
                    className="font-mono font-bold text-xs text-slate-800 hover:text-emerald-600 px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                    title="Editar precio"
                  >
                    {prod.precioUltimaCompra > 0 ? `${prod.precioUltimaCompra.toFixed(2)} €` : 'Fijar €'}
                  </button>

                  <button
                    onClick={() => removeProduct(prod.id)}
                    className="text-slate-300 hover:text-rose-500 transition cursor-pointer p-1"
                    title="Eliminar de la lista"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal para Editar/Actualizar Precio Real */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Actualizar Precio</h3>
            <p className="text-xs text-slate-500">
              ¿Cuánto cuesta exactamente <strong>{editingProduct.nombre}</strong>?
            </p>

            <form onSubmit={handleUpdatePrice} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Precio (€)</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Ej. 1.85"
                  value={editPrecio}
                  onChange={(e) => setEditPrecio(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold font-mono text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition cursor-pointer"
                >
                  Guardar Precio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
