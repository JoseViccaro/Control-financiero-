import React, { useState } from 'react';
import type { SmartGroceryInput, GroceryItem } from '../../../src/models/types';
import { calculateSmartGroceryPlan } from '../../../src/services/smartGroceriesService';
import { 
  ShoppingBag, 
  Users, 
  Calendar, 
  Euro, 
  Check, 
  Sparkles, 
  ShoppingCart, 
  Plus, 
  Smartphone, 
  Tag, 
  ArrowDownRight,
  TrendingDown,
  Percent
} from 'lucide-react';

export const SmartGrocerySection: React.FC = () => {
  const [personas, setPersonas] = useState(2);
  const [dias, setDias] = useState(7);
  const [presupuesto, setPresupuesto] = useState(75);
  const [alimentosTexto, setAlimentosTexto] = useState('arroz, sal, aceite');
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  
  // Opción 4: Modo Marca Blanca vs Primera Marca
  const [modoMarca, setModoMarca] = useState<'blanca' | 'primera'>('blanca');

  // Opción 1: Productos personalizados agregados por el usuario
  const [customItems, setCustomItems] = useState<GroceryItem[]>(() => {
    const saved = localStorage.getItem('control_financiero_custom_grocery');
    return saved ? JSON.parse(saved) : [];
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdSeccion, setNewProdSeccion] = useState<GroceryItem['seccion']>('despensa');
  const [newProdCoste, setNewProdCoste] = useState('');
  const [newProdCantidad, setNewProdCantidad] = useState('1 unidad');

  // Opción 3: Modo Supermercado Pantalla Activa (Mobile Shopper Mode)
  const [modoSupermercado, setModoSupermercado] = useState(false);

  const alimentosEnCasa = alimentosTexto
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const input: SmartGroceryInput = {
    personasComen: personas,
    diasCompra: dias,
    presupuestoMaximo: presupuesto,
    alimentosEnCasa,
  };

  const planBase = calculateSmartGroceryPlan(input);

  // Si está en modo 'primera', las primeras marcas suelen ser un 35% más caras
  const factorMarca = modoMarca === 'primera' ? 1.35 : 1.0;

  // Unificar productos base + personalizados
  const allItems: GroceryItem[] = [
    ...planBase.items.map(item => ({
      ...item,
      costeEstimado: +(item.costeEstimado * factorMarca).toFixed(2),
    })),
    ...customItems,
  ];

  const totalCesta = +(allItems.reduce((sum, item) => sum + item.costeEstimado, 0)).toFixed(2);
  const totalComprado = +(allItems
    .filter(item => checkedItems[item.nombre])
    .reduce((sum, item) => sum + item.costeEstimado, 0)).toFixed(2);
  const totalRestante = +(totalCesta - totalComprado).toFixed(2);
  const ahorroMarcaBlanca = +(allItems.reduce((sum, item) => sum + item.costeEstimado, 0) * 0.26).toFixed(2);

  const toggleCheck = (nombre: string) => {
    setCheckedItems((prev) => ({
      ...prev,
      [nombre]: !prev[nombre],
    }));
  };

  const handleAddCustomProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const coste = parseFloat(newProdCoste);
    if (!newProdName || isNaN(coste)) return;

    const newItem: GroceryItem = {
      nombre: newProdName.trim(),
      seccion: newProdSeccion,
      cantidad: newProdCantidad.trim() || '1 ud',
      costeEstimado: +(coste).toFixed(2),
      esencial: true,
    };

    const updated = [...customItems, newItem];
    setCustomItems(updated);
    localStorage.setItem('control_financiero_custom_grocery', JSON.stringify(updated));

    setNewProdName('');
    setNewProdCoste('');
    setNewProdCantidad('1 unidad');
    setShowAddModal(false);
  };

  const removeCustomProduct = (nombre: string) => {
    const updated = customItems.filter(i => i.nombre !== nombre);
    setCustomItems(updated);
    localStorage.setItem('control_financiero_custom_grocery', JSON.stringify(updated));
  };

  const getSectionBadge = (seccion: string) => {
    const map: Record<string, { bg: string; text: string }> = {
      'fruta y verdura': { bg: 'bg-emerald-50', text: 'text-emerald-700' },
      'proteínas': { bg: 'bg-amber-50', text: 'text-amber-700' },
      'despensa': { bg: 'bg-orange-50', text: 'text-orange-700' },
      'lácteos': { bg: 'bg-blue-50', text: 'text-blue-700' },
      'congelados': { bg: 'bg-cyan-50', text: 'text-cyan-700' },
      'limpieza': { bg: 'bg-purple-50', text: 'text-purple-700' },
    };
    const style = map[seccion] || { bg: 'bg-slate-50', text: 'text-slate-700' };
    return (
      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${style.bg} ${style.text}`}>
        {seccion}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/70 shadow-sm shadow-slate-100 space-y-6">
      {/* Header Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 mb-1">
            <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" /> Ahorro en Alimentación
          </span>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Asistente de Compra Inteligente
          </h2>
          <p className="text-xs text-slate-400">
            Personaliza productos, activa el modo súper en el móvil y compara el ahorro de marcas blancas.
          </p>
        </div>

        {/* Acciones Rápidas: Modo Supermercado y Añadir */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
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

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-400" /> + Añadir Producto
          </button>
        </div>
      </div>

      {/* Selector de Marca Blanca vs Primera Marca (Opción 4) */}
      <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-bold text-slate-700">Estrategia de Marcas:</span>
          <div className="flex items-center p-0.5 bg-white border border-slate-200 rounded-xl">
            <button
              onClick={() => setModoMarca('blanca')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
                modoMarca === 'blanca' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Marca Blanca (Ahorro)
            </button>
            <button
              onClick={() => setModoMarca('primera')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
                modoMarca === 'primera' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Primeras Marcas (+35%)
            </button>
          </div>
        </div>

        {modoMarca === 'blanca' && (
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200/60">
            <TrendingDown className="w-3.5 h-3.5 text-emerald-600" /> Ahorras aprox. {ahorroMarcaBlanca} € en esta cesta
          </div>
        )}
      </div>

      {/* MODO SUPERMERCADO MÓVIL (Opción 3) */}
      {modoSupermercado ? (
        <div className="p-6 bg-slate-900 text-white rounded-3xl space-y-6 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">Modo Compra Activa</span>
              <h3 className="text-lg font-bold">En el Supermercado</h3>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">En Carrito / Total</p>
              <p className="text-xl font-mono font-bold text-emerald-400">
                {totalComprado.toFixed(2)} € <span className="text-sm font-normal text-slate-400">/ {totalCesta.toFixed(2)} €</span>
              </p>
            </div>
          </div>

          <div className="p-3 bg-slate-800/80 rounded-2xl flex items-center justify-between text-xs">
            <span className="text-slate-300">Te queda por gastar:</span>
            <span className={`font-mono font-bold text-sm ${totalRestante >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {totalRestante.toFixed(2)} €
            </span>
          </div>

          {/* Lista táctil grande para el móvil */}
          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {allItems.map((item, idx) => {
              const isChecked = !!checkedItems[item.nombre];
              return (
                <div
                  key={idx}
                  onClick={() => toggleCheck(item.nombre)}
                  className={`p-4 rounded-2xl border transition flex items-center justify-between gap-3 cursor-pointer select-none active:scale-[0.99] ${
                    isChecked
                      ? 'bg-slate-800/40 border-slate-800 opacity-40 line-through'
                      : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-xl border flex items-center justify-center transition ${
                        isChecked
                          ? 'bg-emerald-500 border-emerald-500 text-slate-900'
                          : 'border-slate-600 bg-slate-700'
                      }`}
                    >
                      {isChecked && <Check className="w-4 h-4 stroke-[3]" />}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-white">{item.nombre}</p>
                      <p className="text-[11px] text-slate-400">{item.cantidad} • {item.seccion}</p>
                    </div>
                  </div>

                  <p className="text-sm font-bold font-mono text-emerald-400">{item.costeEstimado.toFixed(2)} €</p>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* VISTA NORMAL CON CONTROLES */
        <>
          {/* Controles de Configuración Rápida */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5 bg-slate-50/70 border border-slate-200/60 rounded-2xl">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5">
                <Users className="w-3.5 h-3.5 text-slate-500" /> Personas en casa
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={personas}
                onChange={(e) => setPersonas(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" /> Días de compra
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={dias}
                onChange={(e) => setDias(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5">
                <Euro className="w-3.5 h-3.5 text-slate-500" /> Presupuesto tope (€)
              </label>
              <input
                type="number"
                min="10"
                step="5"
                value={presupuesto}
                onChange={(e) => setPresupuesto(Math.max(5, parseFloat(e.target.value) || 0))}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Ya tengo en casa
              </label>
              <input
                type="text"
                placeholder="arroz, huevos, aceite..."
                value={alimentosTexto}
                onChange={(e) => setAlimentosTexto(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              />
            </div>
          </div>

          {/* Resumen de Cesta */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
            <span className="text-slate-500 font-medium">Total Cesta Optimizada ({allItems.length} artículos):</span>
            <span className="text-base font-bold text-slate-900">{totalCesta.toFixed(2)} €</span>
          </div>

          {/* Lista de Productos con posibilidad de eliminar los personalizados */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {allItems.map((item, idx) => {
              const isChecked = !!checkedItems[item.nombre];
              const isCustom = customItems.some(c => c.nombre === item.nombre);

              return (
                <div
                  key={idx}
                  onClick={() => toggleCheck(item.nombre)}
                  className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 cursor-pointer select-none ${
                    isChecked
                      ? 'bg-slate-100/70 border-slate-200 opacity-60 line-through'
                      : 'bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-lg border flex items-center justify-center transition ${
                        isChecked
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300 bg-slate-50'
                      }`}
                    >
                      {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 text-xs">{item.nombre}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {getSectionBadge(item.seccion)}
                        <span className="text-[10px] text-slate-400">{item.cantidad}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex items-center gap-2">
                    <p className="text-xs font-bold text-slate-900">{item.costeEstimado.toFixed(2)} €</p>
                    {isCustom && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeCustomProduct(item.nombre);
                        }}
                        className="text-slate-300 hover:text-rose-600 transition"
                        title="Eliminar producto propio"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Modal para Añadir Producto Propio (Opción 1) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Añadir Producto a tu Cesta</h3>
            <form onSubmit={handleAddCustomProduct} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre del producto</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Copos de avena, Pan integral..."
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Coste (€)</label>
                  <input
                    type="number"
                    step="0.05"
                    required
                    placeholder="1.50"
                    value={newProdCoste}
                    onChange={(e) => setNewProdCoste(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cantidad / Formato</label>
                  <input
                    type="text"
                    placeholder="Ej. 1 kg, Pack de 6"
                    value={newProdCantidad}
                    onChange={(e) => setNewProdCantidad(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Sección del Súper</label>
                <select
                  value={newProdSeccion}
                  onChange={(e) => setNewProdSeccion(e.target.value as any)}
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
                  Añadir Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
