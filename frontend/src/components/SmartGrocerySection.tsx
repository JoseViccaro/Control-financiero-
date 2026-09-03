import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Euro, 
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
  seccion: 'fruta y verdura' | 'proteínas' | 'despensa' | 'lácteos' | 'congelados' | 'limpieza';
  precioUltimaCompra: number; // 0 si aún no se le ha asignado precio
  cantidad: string;
  incluirEnCesta: boolean; // Si está activo para la compra de esta semana
}

export const SmartGrocerySection: React.FC = () => {
  // Lista de productos 100% reales del usuario
  const [productos, setProductos] = useState<UserCustomGroceryProduct[]>(() => {
    const saved = localStorage.getItem('control_financiero_real_grocery_list');
    return saved ? JSON.parse(saved) : [];
  });

  const [presupuestoTope, setPresupuestoTope] = useState<number>(() => {
    const saved = localStorage.getItem('control_financiero_grocery_budget');
    return saved ? parseFloat(saved) : 80;
  });

  // Estados de control y compra activa
  const [modoSupermercado, setModoSupermercado] = useState(false);
  const [checkedInCart, setCheckedInCart] = useState<Record<string, boolean>>({});
  
  // Modal para añadir producto
  const [showAddModal, setShowAddModal] = useState(false);
  const [nombre, setNombre] = useState('');
  const [seccion, setSeccion] = useState<UserCustomGroceryProduct['seccion']>('despensa');
  const [precio, setPrecio] = useState('');
  const [cantidad, setCantidad] = useState('1 unidad');

  // Modal para actualizar precio en caliente
  const [editingProduct, setEditingProduct] = useState<UserCustomGroceryProduct | null>(null);
  const [editPrecio, setEditPrecio] = useState('');

  const saveProducts = (updated: UserCustomGroceryProduct[]) => {
    setProductos(updated);
    localStorage.setItem('control_financiero_real_grocery_list', JSON.stringify(updated));
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    const precioNum = parseFloat(precio) || 0;
    const nuevo: UserCustomGroceryProduct = {
      id: 'prod_' + Date.now(),
      nombre: nombre.trim(),
      seccion,
      precioUltimaCompra: precioNum,
      cantidad: cantidad.trim() || '1 ud',
      incluirEnCesta: true,
    };

    saveProducts([nuevo, ...productos]);
    setNombre('');
    setPrecio('');
    setCantidad('1 unidad');
    setShowAddModal(false);
  };

  const toggleIncludeInBasket = (id: string) => {
    const updated = productos.map(p => p.id === id ? { ...p, incluirEnCesta: !p.incluirEnCesta } : p);
    saveProducts(updated);
  };

  const toggleCartCheck = (id: string) => {
    setCheckedInCart(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleUpdatePrice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    const nuevoPrecio = parseFloat(editPrecio);
    if (isNaN(nuevoPrecio) || nuevoPrecio < 0) return;

    const updated = productos.map(p => p.id === editingProduct.id ? { ...p, precioUltimaCompra: nuevoPrecio } : p);
    saveProducts(updated);
    setEditingProduct(null);
  };

  const removeProduct = (id: string) => {
    const updated = productos.filter(p => p.id !== id);
    saveProducts(updated);
  };

  // Solo productos activos en la cesta de esta compra
  const productosEnCesta = productos.filter(p => p.incluirEnCesta);
  
  // Totales reales basados en el historial
  const totalCestaEstimada = +(productosEnCesta.reduce((sum, p) => sum + (p.precioUltimaCompra || 0), 0)).toFixed(2);
  const totalEnCarrito = +(productosEnCesta
    .filter(p => checkedInCart[p.id])
    .reduce((sum, p) => sum + (p.precioUltimaCompra || 0), 0)).toFixed(2);
  const totalRestante = +(presupuestoTope - totalEnCarrito).toFixed(2);

  const getSectionBadge = (sec: UserCustomGroceryProduct['seccion']) => {
    const map: Record<string, { bg: string; text: string }> = {
      'fruta y verdura': { bg: 'bg-emerald-50', text: 'text-emerald-700' },
      'proteínas': { bg: 'bg-amber-50', text: 'text-amber-700' },
      'despensa': { bg: 'bg-orange-50', text: 'text-orange-700' },
      'lácteos': { bg: 'bg-blue-50', text: 'text-blue-700' },
      'congelados': { bg: 'bg-cyan-50', text: 'text-cyan-700' },
      'limpieza': { bg: 'bg-purple-50', text: 'text-purple-700' },
    };
    const style = map[sec] || { bg: 'bg-slate-50', text: 'text-slate-700' };
    return (
      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${style.bg} ${style.text}`}>
        {sec}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/70 shadow-sm shadow-slate-100 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 mb-1">
            <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" /> Cesta de la Compra Real
          </span>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Tu Lista de Compra Personalizada
          </h2>
          <p className="text-xs text-slate-400">
            Sin precios ni productos genéricos inventados. Mete tus productos y la app recordará tus precios reales para siempre.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {productosEnCesta.length > 0 && (
            <button
              onClick={() => setModoSupermercado(!modoSupermercado)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition cursor-pointer border ${
                modoSupermercado
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-200'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200/70'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>{modoSupermercado ? 'Salir de Modo Súper' : 'Modo Supermercado'}</span>
            </button>
          )}

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-400" /> + Añadir Producto
          </button>
        </div>
      </div>

      {/* Barra de Presupuesto y Totales */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 bg-slate-50/70 border border-slate-200/60 rounded-2xl">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Presupuesto Tope para esta compra (€)</label>
          <div className="relative">
            <input
              type="number"
              step="5"
              value={presupuestoTope}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0;
                setPresupuestoTope(val);
                localStorage.setItem('control_financiero_grocery_budget', val.toString());
              }}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-base font-bold text-slate-900 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-500 mb-1">Total Previsto en Cesta</p>
          <p className="text-xl font-extrabold text-slate-900 py-1.5">
            {totalCestaEstimada.toFixed(2)} €{' '}
            <span className="text-xs font-normal text-slate-400">({productosEnCesta.length} productos)</span>
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-500 mb-1">
            {modoSupermercado ? 'Llevas en Carrito' : 'Margen vs Presupuesto'}
          </p>
          <p className={`text-xl font-extrabold py-1.5 ${presupuestoTope >= totalCestaEstimada ? 'text-emerald-600' : 'text-rose-600'}`}>
            {modoSupermercado ? `${totalEnCarrito.toFixed(2)} €` : `${(presupuestoTope - totalCestaEstimada).toFixed(2)} €`}
          </p>
        </div>
      </div>

      {/* MODO SUPERMERCADO CLARO (Para ir de compras con el móvil) */}
      {modoSupermercado ? (
        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200/80 space-y-6 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                Modo Compra Activa
              </span>
              <h3 className="text-xl font-bold text-slate-900 mt-1">En el Supermercado</h3>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 font-medium">Llevas en Carrito / Tope</p>
              <p className="text-2xl font-mono font-extrabold text-slate-900">
                {totalEnCarrito.toFixed(2)} € <span className="text-sm font-normal text-slate-400">/ {presupuestoTope.toFixed(2)} €</span>
              </p>
            </div>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200/70 shadow-xs flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Presupuesto restante en caja:</span>
            <span className={`font-mono font-extrabold text-lg ${totalRestante >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {totalRestante.toFixed(2)} €
            </span>
          </div>

          <div className="space-y-3">
            {productosEnCesta.map((prod) => {
              const isChecked = !!checkedInCart[prod.id];
              return (
                <div
                  key={prod.id}
                  onClick={() => toggleCartCheck(prod.id)}
                  className={`p-4 rounded-2xl border transition flex items-center justify-between gap-4 cursor-pointer select-none active:scale-[0.99] ${
                    isChecked
                      ? 'bg-slate-100/70 border-slate-200 opacity-50 line-through'
                      : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-6 h-6 rounded-xl border flex items-center justify-center transition ${
                        isChecked
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300 bg-slate-50'
                      }`}
                    >
                      {isChecked && <Check className="w-4 h-4 stroke-[3]" />}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-900">{prod.nombre}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {getSectionBadge(prod.seccion)}
                        <span className="text-xs text-slate-400 font-medium">{prod.cantidad}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex items-center gap-2">
                    <span className="text-base font-extrabold font-mono text-slate-900">
                      {prod.precioUltimaCompra > 0 ? `${prod.precioUltimaCompra.toFixed(2)} €` : 'Sin precio'}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingProduct(prod);
                        setEditPrecio(prod.precioUltimaCompra ? prod.precioUltimaCompra.toString() : '');
                      }}
                      className="p-1.5 text-slate-400 hover:text-slate-800 transition"
                      title="Editar precio real pagado"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* VISTA DE GESTIÓN Y PLANIFICACIÓN DE PRODUCTOS REALES */
        <div>
          {productos.length === 0 ? (
            <div className="p-10 text-center bg-slate-50/50 border border-dashed border-slate-200 rounded-3xl space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Tu lista está 100% limpia y sin datos inventados</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Añade los productos que sueles comprar habitualmente en tu supermercado habitual. Conforme vayas metiendo su precio, la app lo memorizará para siempre.
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <Plus className="w-4 h-4 text-emerald-400" /> Añadir Mi Primer Producto
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span>Marca los que necesitas comprar esta semana para agregarlos a la cesta activa:</span>
                <span>{productosEnCesta.length} seleccionados</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {productos.map((prod) => (
                  <div
                    key={prod.id}
                    className={`p-4 rounded-2xl border transition flex items-center justify-between gap-3 ${
                      prod.incluirEnCesta ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-50/60 border-slate-200/50 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleIncludeInBasket(prod.id)}
                        className={`w-5 h-5 rounded-lg border flex items-center justify-center transition cursor-pointer ${
                          prod.incluirEnCesta ? 'bg-slate-900 border-slate-900 text-white' : 'border-slate-300 bg-white'
                        }`}
                        title={prod.incluirEnCesta ? 'En la cesta de la compra' : 'Guardado en tu despensa habitual'}
                      >
                        {prod.incluirEnCesta && <Check className="w-3.5 h-3.5" />}
                      </button>
                      <div>
                        <p className="font-bold text-xs text-slate-900">{prod.nombre}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {getSectionBadge(prod.seccion)}
                          <span className="text-[10px] text-slate-400">{prod.cantidad}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingProduct(prod);
                          setEditPrecio(prod.precioUltimaCompra ? prod.precioUltimaCompra.toString() : '');
                        }}
                        className="text-xs font-bold font-mono text-slate-900 hover:text-emerald-600 transition cursor-pointer flex items-center gap-1"
                        title="Clic para cambiar precio"
                      >
                        <span>{prod.precioUltimaCompra > 0 ? `${prod.precioUltimaCompra.toFixed(2)} €` : 'Añadir €'}</span>
                        <Edit2 className="w-3 h-3 text-slate-400" />
                      </button>

                      <button
                        onClick={() => removeProduct(prod.id)}
                        className="text-slate-300 hover:text-rose-600 transition cursor-pointer p-1"
                        title="Eliminar producto de tu catálogo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal para Añadir Producto Propio */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Añadir Producto a tu Catálogo Real</h3>
            <p className="text-xs text-slate-400">
              Pon el nombre y si ya sabes cuánto cuesta en tu súper habitual pon su precio. La app lo recordará siempre.
            </p>

            <form onSubmit={handleAddProduct} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre del producto</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Leche desnatada, Plátanos, Detergente..."
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Precio aproximado (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ej. 1.25"
                    value={precio}
                    onChange={(e) => setPrecio(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cantidad / Formato</label>
                  <input
                    type="text"
                    placeholder="Ej. Pack 6, 1 kg, Brik"
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Sección del Súper</label>
                <select
                  value={seccion}
                  onChange={(e) => setSeccion(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none"
                >
                  <option value="despensa">Despensa</option>
                  <option value="fruta y verdura">Fruta y Verdura</option>
                  <option value="proteínas">Proteínas (Carne, Pescado, Huevos)</option>
                  <option value="lácteos">Lácteos</option>
                  <option value="congelados">Congelados</option>
                  <option value="limpieza">Limpieza e Higiene</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition cursor-pointer"
                >
                  Guardar Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para Editar/Actualizar Precio Real */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Actualizar Precio Real</h3>
            <p className="text-xs text-slate-500">
              ¿Cuánto te ha costado exactamente <strong>{editingProduct.nombre}</strong>?
            </p>

            <form onSubmit={handleUpdatePrice} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Precio (€)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  autoFocus
                  placeholder="Ej. 1.85"
                  value={editPrecio}
                  onChange={(e) => setEditPrecio(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 focus:bg-white focus:outline-none"
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
