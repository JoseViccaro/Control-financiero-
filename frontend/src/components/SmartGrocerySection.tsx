import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Check, 
  ShoppingCart, 
  Plus, 
  Smartphone, 
  Trash2, 
  Edit2, 
  RotateCcw,
  Sparkles,
  X,
  ArrowLeft
} from 'lucide-react';

export interface UserCustomGroceryProduct {
  id: string;
  nombre: string;
  seccion: 'fruta y verdura' | 'proteínas' | 'despensa' | 'lácteos' | 'congelados' | 'limpieza' | 'otros';
  precioUltimaCompra: number; // 0 si aún no se le ha asignado precio
  cantidad: string;
  incluirEnCesta: boolean; // Si está activo para la compra de esta semana
}

interface SmartGrocerySectionProps {
  products?: UserCustomGroceryProduct[];
  onUpdateProducts?: (items: UserCustomGroceryProduct[]) => void;
  gastoSupermercadoRealMes?: number;
}

export const SmartGrocerySection: React.FC<SmartGrocerySectionProps> = ({
  products = [],
  onUpdateProducts,
  gastoSupermercadoRealMes = 0,
}) => {
  // Lista de productos 100% personalizada por el usuario (sin datos genéricos inventados)
  const [productos, setProductos] = useState<UserCustomGroceryProduct[]>(products);

  // Mantener sincronizado si cambian las props externas
  React.useEffect(() => {
    if (products) {
      setProductos(products);
    }
  }, [products]);

  const updateAndSync = (newProds: UserCustomGroceryProduct[]) => {
    setProductos(newProds);
    if (onUpdateProducts) {
      onUpdateProducts(newProds);
    }
  };

  // Presupuesto tope por compra/semana (si hay gasto bancario real, se divide entre ~4.33 semanas)
  const defaultTope = gastoSupermercadoRealMes > 0 ? Math.round(gastoSupermercadoRealMes / 4.33) : 90;
  const [presupuestoTope, setPresupuestoTope] = useState<number>(defaultTope);

  // Estados de control y compra activa
  const [modoSupermercado, setModoSupermercado] = useState(false);
  const [checkedInCart, setCheckedInCart] = useState<Record<string, boolean>>({});

  // Bloquear scroll de la página principal cuando está en Modo Tienda Pantalla Completa
  useEffect(() => {
    if (modoSupermercado) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [modoSupermercado]);
  
  // Input rápido
  const [quickInputNombre, setQuickInputNombre] = useState('');
  const [quickInputPrecio, setQuickInputPrecio] = useState('');
  const [quickInputSeccion, setQuickInputSeccion] = useState<UserCustomGroceryProduct['seccion']>('despensa');

  // Modal para actualizar precio en caliente
  const [editingProduct, setEditingProduct] = useState<UserCustomGroceryProduct | null>(null);
  const [editPrecio, setEditPrecio] = useState('');

  // Marcar / desmarcar si entra a la compra semanal
  const toggleIncludeInBasket = (id: string) => {
    const updated = productos.map(p => p.id === id ? { ...p, incluirEnCesta: !p.incluirEnCesta } : p);
    updateAndSync(updated);
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
      seccion: quickInputSeccion,
      precioUltimaCompra: precioNum,
      cantidad: '1 ud',
      incluirEnCesta: true,
    };

    updateAndSync([nuevo, ...productos]);
    setQuickInputNombre('');
    setQuickInputPrecio('');
  };

  const handleUpdatePrice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    const nuevoPrecio = parseFloat(editPrecio.replace(',', '.'));
    if (isNaN(nuevoPrecio) || nuevoPrecio < 0) return;

    const updated = productos.map(p => p.id === editingProduct.id ? { ...p, precioUltimaCompra: nuevoPrecio } : p);
    updateAndSync(updated);
    setEditingProduct(null);
  };

  const removeProduct = (id: string) => {
    const updated = productos.filter(p => p.id !== id);
    updateAndSync(updated);
  };

  // Productos activos en la cesta de esta compra
  const productosEnCesta = productos.filter(p => p.incluirEnCesta);
  
  // Totales calculados en tiempo real
  const totalEstimadoCesta = +(productosEnCesta.reduce((sum, p) => sum + (p.precioUltimaCompra || 0), 0)).toFixed(2);
  const itemsEnCarrito = productosEnCesta.filter(p => checkedInCart[p.id]);
  const totalEnCarrito = +(itemsEnCarrito.reduce((sum, p) => sum + (p.precioUltimaCompra || 0), 0)).toFixed(2);
  const itemsPendientes = productosEnCesta.filter(p => !checkedInCart[p.id]);
  const totalPendiente = +(itemsPendientes.reduce((sum, p) => sum + (p.precioUltimaCompra || 0), 0)).toFixed(2);

  // Proyección mensual basada en la lista semanal real (x 4.33 semanas al mes)
  const gastoMensualEstimadoLista = +(totalEstimadoCesta * 4.33).toFixed(2);
  const gastoMensualPresupuestado = +(presupuestoTope * 4.33).toFixed(2);

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
          
          {/* Total que vas a gastar hoy */}
          <div className="col-span-2 sm:col-span-1 border-b sm:border-b-0 sm:border-r border-slate-700/60 pb-3 sm:pb-0 sm:pr-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Total Esta Compra</span>
            <p className="text-3xl font-black font-mono tracking-tight mt-0.5 text-white">
              {totalEstimadoCesta.toFixed(2)} <span className="text-lg font-normal text-slate-400">€</span>
            </p>
            <p className="text-[11px] text-slate-300 mt-0.5">
              {productosEnCesta.length} artículos apuntados
            </p>
          </div>

          {/* Llevas en Carrito */}
          <div className="border-r border-slate-700/60 pr-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">En el Carrito</span>
            <p className="text-2xl sm:text-3xl font-black font-mono text-emerald-400 mt-0.5">
              {totalEnCarrito.toFixed(2)} <span className="text-sm font-normal text-slate-400">€</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {itemsEnCarrito.length} recogidos en tienda
            </p>
          </div>

          {/* Por recoger */}
          <div className="border-b sm:border-b-0 sm:border-r border-slate-700/60 pb-3 sm:pb-0 sm:pr-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Por Recoger</span>
            <p className="text-2xl sm:text-3xl font-black font-mono text-amber-400 mt-0.5">
              {totalPendiente.toFixed(2)} <span className="text-sm font-normal text-slate-400">€</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {itemsPendientes.length} pendientes en el lineal
            </p>
          </div>

          {/* Presupuesto Tope y Margen */}
          <div>
            <div className="flex items-center justify-between sm:justify-start gap-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Tope Semanal</span>
              <input
                type="number"
                value={presupuestoTope}
                onChange={(e) => setPresupuestoTope(parseFloat(e.target.value) || 0)}
                className="w-16 bg-slate-800 text-white font-mono font-bold text-xs px-1.5 py-0.5 rounded border border-slate-700 focus:outline-none text-right"
                title="Cambiar tope por compra"
              />
              <span className="text-xs text-slate-400">€</span>
            </div>
            <p className={`text-2xl font-black font-mono mt-0.5 ${margenRestante >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {margenRestante >= 0 ? `+${margenRestante.toFixed(2)} €` : `${margenRestante.toFixed(2)} €`}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {margenRestante >= 0 ? 'Margen en caja' : '¡Te estás pasando!'}
            </p>
          </div>
        </div>

        {/* Proyección Inteligente Mensual (Lo que te gastarás al mes con este ritmo) */}
        <div className="pt-3 border-t border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-800/40 -mx-2 -mb-2 p-3 rounded-2xl">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Proyección Mensual de Supermercado</p>
              <p className="text-[11px] text-slate-400">
                {totalEstimadoCesta > 0 
                  ? `Si mantienes esta lista de compra semanal (${totalEstimadoCesta.toFixed(2)} €/semana), gastarás al mes:` 
                  : 'Apunta los productos que vas a comprar para proyectar tu gasto de alimentación mensual:'}
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right shrink-0">
            <span className="text-lg sm:text-xl font-black font-mono text-emerald-400">
              {gastoMensualEstimadoLista > 0 ? `${gastoMensualEstimadoLista.toFixed(2)} €/mes` : `${gastoMensualPresupuestado.toFixed(2)} €/mes`}
            </span>
            {gastoSupermercadoRealMes > 0 && (
              <p className="text-[10px] text-slate-400">
                (Extracto bancario del mes pasado: {gastoSupermercadoRealMes.toFixed(2)} €)
              </p>
            )}
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

      {/* VISTA 1: MODO SUPERMERCADO A PANTALLA COMPLETA (Experiencia Inmersiva en Tienda) */}
      {modoSupermercado && (
        <div className="fixed inset-0 z-50 bg-slate-950 text-slate-100 flex flex-col animate-in fade-in overflow-hidden">
          
          {/* Cabecera Superior Fija con Botón de Salir y Totales Clave */}
          <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 sm:py-4 shrink-0 flex items-center justify-between gap-3 shadow-lg">
            <button
              onClick={() => setModoSupermercado(false)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Salir de Modo Súper</span>
              <span className="sm:hidden">Salir</span>
            </button>

            <div className="flex items-center gap-3 text-right">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">En Carrito</span>
                <span className="text-xl sm:text-2xl font-black font-mono text-emerald-400">
                  {totalEnCarrito.toFixed(2)} €
                </span>
              </div>
              <div className="border-l border-slate-800 pl-3">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Margen</span>
                <span className={`text-xl sm:text-2xl font-black font-mono ${margenRestante >= 0 ? 'text-white' : 'text-rose-400'}`}>
                  {margenRestante.toFixed(2)} €
                </span>
              </div>
            </div>
          </div>

          {/* Barra de Progreso y Datos Rápidos */}
          <div className="bg-slate-900/90 border-b border-slate-800/80 px-4 py-2.5 shrink-0 flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{itemsEnCarrito.length} de {productosEnCesta.length} recogidos</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-slate-400">Tope: {presupuestoTope} €</span>
              {itemsEnCarrito.length > 0 && (
                <button
                  onClick={handleResetCartChecks}
                  className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" /> Reiniciar
                </button>
              )}
            </div>
          </div>

          {/* Lista Scrolleable a Pantalla Completa */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 max-w-2xl mx-auto w-full">
            {productosEnCesta.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/60 border border-dashed border-slate-800 rounded-3xl space-y-3 mt-10">
                <p className="text-base font-bold text-slate-200">No tienes artículos marcados para hoy</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Sal del modo supermercado y marca los productos que necesitas comprar en tu lista antes de empezar.
                </p>
                <button
                  onClick={() => setModoSupermercado(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition cursor-pointer"
                >
                  Volver a mi lista
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {/* 1. ARTÍCULOS PENDIENTES DE RECOGER */}
                {itemsPendientes.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1 block">
                      Por Recoger ({itemsPendientes.length}) • Falta {totalPendiente.toFixed(2)} €
                    </span>
                    {itemsPendientes.map((prod) => (
                      <div
                        key={prod.id}
                        onClick={() => toggleCartCheck(prod.id)}
                        className="p-4 rounded-2xl bg-slate-900 border-2 border-slate-800 hover:border-emerald-500 shadow-md flex items-center justify-between gap-3 cursor-pointer select-none active:scale-[0.98] transition-all"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-9 h-9 rounded-xl border-2 border-slate-700 bg-slate-800 flex items-center justify-center shrink-0 text-transparent">
                            <Check className="w-5 h-5 stroke-[3]" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-extrabold text-base text-white truncate">{prod.nombre}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {getSectionBadge(prod.seccion)}
                              <span className="text-xs text-slate-400 font-medium">{prod.cantidad}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <span className="font-mono font-black text-lg text-emerald-400">
                            {prod.precioUltimaCompra > 0 ? `${prod.precioUltimaCompra.toFixed(2)} €` : '0.00 €'}
                          </span>
                          <button
                            onClick={() => {
                              setEditingProduct(prod);
                              setEditPrecio(prod.precioUltimaCompra ? prod.precioUltimaCompra.toString() : '');
                            }}
                            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                            title="Editar precio"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 2. ARTÍCULOS YA RECOGIDOS EN EL CARRO */}
                {itemsEnCarrito.length > 0 && (
                  <div className="pt-4 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-500 px-1 font-semibold">
                      <span>Recogidos en el carrito ({itemsEnCarrito.length})</span>
                      <span className="font-mono">{totalEnCarrito.toFixed(2)} €</span>
                    </div>
                    {itemsEnCarrito.map((prod) => (
                      <div
                        key={prod.id}
                        onClick={() => toggleCartCheck(prod.id)}
                        className="p-3.5 rounded-2xl bg-slate-900/40 border border-slate-800/60 opacity-55 flex items-center justify-between gap-3 cursor-pointer select-none active:scale-[0.98] transition-all"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                            <Check className="w-5 h-5 stroke-[3]" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-sm text-slate-400 line-through truncate">{prod.nombre}</p>
                            <span className="text-xs text-slate-500">{prod.cantidad}</span>
                          </div>
                        </div>

                        <div className="text-right shrink-0 font-mono font-bold text-sm text-slate-400 line-through">
                          {prod.precioUltimaCompra > 0 ? `${prod.precioUltimaCompra.toFixed(2)} €` : '0.00 €'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VISTA 2: GESTIÓN DE LA LISTA HABITUAL (Preparar la compra antes de ir) */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Tu Lista de Compra Personalizada</h3>
              <span className="text-xs text-slate-400 font-medium">({productos.length} artículos guardados)</span>
            </div>
            <p className="text-xs text-slate-400">
              Marca con un check los que te hagan falta esta semana antes de salir.
            </p>
          </div>

          {productos.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl space-y-2">
              <p className="text-sm font-bold text-slate-700">Tu lista está vacía</p>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Escribe en la barra de arriba lo que realmente te haga falta antes de salir de casa (ej. "Leche 1.25€", "Plátanos 2€"). La web lo guardará para tus próximas compras.
              </p>
            </div>
          ) : (

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
          )}
        </div>

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
