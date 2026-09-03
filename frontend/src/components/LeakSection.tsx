import React, { useState } from 'react';
import type { MoneyLeakInput, MoneyLeakItem, AggregatedLeakReport, LeakImpactOnGoals } from '../../../src/models/types';
import { Flame, Ghost, Zap, Trash2, Plus, Sparkles, AlertCircle } from 'lucide-react';

interface LeakSectionProps {
  leaks: MoneyLeakItem[];
  agregado: AggregatedLeakReport;
  impacto: LeakImpactOnGoals;
  onAddLeak: (leak: MoneyLeakInput) => void;
  onRemoveLeak: (index: number) => void;
}

export const LeakSection: React.FC<LeakSectionProps> = ({
  leaks,
  agregado,
  impacto,
  onAddLeak,
  onRemoveLeak,
}) => {
  const [nombre, setNombre] = useState('');
  const [monto, setMonto] = useState('');
  const [frecuencia, setFrecuencia] = useState<'diario' | 'semanal' | 'mensual' | 'anual'>('diario');
  const [categoria, setCategoria] = useState<'hormiga' | 'vampiro' | 'prescindible'>('hormiga');
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedMonto = parseFloat(monto);
    if (!nombre.trim() || isNaN(parsedMonto) || parsedMonto <= 0) return;

    onAddLeak({
      nombre: nombre.trim(),
      monto: parsedMonto,
      frecuencia,
      categoria,
    });

    setNombre('');
    setMonto('');
    setShowForm(false);
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'hormiga':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200/60">
            <Flame className="w-3 h-3 text-amber-500" /> Hormiga
          </span>
        );
      case 'vampiro':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200/60">
            <Ghost className="w-3 h-3 text-purple-500" /> Suscripción Vampiro
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200/60">
            <Zap className="w-3 h-3 text-rose-500" /> Prescindible
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Tarjeta Resumen de Fugas estilo Apple/Revolut */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/70 shadow-sm shadow-slate-100">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-600">
                <AlertCircle className="w-3.5 h-3.5" /> Auditoría de Hábitos
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Fugas de Dinero y Gastos Silenciosos
            </h2>
            <p className="text-slate-500 text-sm max-w-xl">
              Microgastos diarios y suscripciones que apenas notas en el mes, pero que acumulan miles de euros al año.
            </p>
          </div>

          <div className="flex items-center gap-3 sm:gap-6 bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <div>
              <p className="text-xs font-medium text-slate-400">Total fuga mensual</p>
              <p className="text-2xl font-bold tracking-tight text-slate-900">{agregado.totalMensual.toFixed(2)} €</p>
            </div>
            <div className="h-10 w-px bg-slate-200" />
            <div>
              <p className="text-xs font-medium text-slate-400">Impacto anualizado</p>
              <p className="text-2xl font-bold tracking-tight text-rose-600">{agregado.totalAnual.toFixed(2)} €<span className="text-xs font-normal text-slate-400">/año</span></p>
            </div>
          </div>
        </div>

        {/* Banner de Impacto en Metas (Estilo Pill de Revolut) */}
        {(impacto.deuda.mesesAhorrados > 0 || impacto.fondoEmergencia.mesesAhorrados > 0) && (
          <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-3">
            {impacto.deuda.mesesAhorrados > 0 && (
              <div className="flex items-center gap-3 bg-emerald-50/70 border border-emerald-100 rounded-2xl p-4 text-emerald-900 text-sm">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-semibold text-emerald-950">Desendeudamiento exprés:</span> Cancelar estas fugas recortaría{' '}
                  <strong className="text-emerald-700 font-bold">{impacto.deuda.mesesAhorrados} meses</strong> de tus préstamos o tarjetas.
                </div>
              </div>
            )}
            {impacto.fondoEmergencia.mesesAhorrados > 0 && (
              <div className="flex items-center gap-3 bg-sky-50/70 border border-sky-100 rounded-2xl p-4 text-sky-900 text-sm">
                <div className="w-8 h-8 rounded-xl bg-sky-100 flex items-center justify-center text-sky-600 shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-semibold text-sky-950">Fondo de Seguridad:</span> Completarías tu colchón de emergencia{' '}
                  <strong className="text-sky-700 font-bold">{impacto.fondoEmergencia.mesesAhorrados} meses antes</strong>.
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lista y Botón Agregar */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/70 shadow-sm shadow-slate-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Gastos Detectados ({leaks.length})</h3>
            <p className="text-xs text-slate-400">Desglose individual con frecuencia y proyección</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" /> {showForm ? 'Ocultar Formulario' : 'Añadir Gasto o Fuga'}
          </button>
        </div>

        {/* Formulario Desplegable */}
        {showForm && (
          <form onSubmit={handleSubmit} className="mb-6 p-5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Nombre o concepto</label>
                <input
                  type="text"
                  placeholder="Ej: Café diario, Netflix..."
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Monto (€)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="2.50"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Periodicidad</label>
                <select
                  value={frecuencia}
                  onChange={(e) => setFrecuencia(e.target.value as any)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition cursor-pointer"
                >
                  <option value="diario">Diario</option>
                  <option value="semanal">Semanal</option>
                  <option value="mensual">Mensual</option>
                  <option value="anual">Anual</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Tipo de Gasto</label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value as any)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition cursor-pointer"
                >
                  <option value="hormiga">Gasto Hormiga (microgastos)</option>
                  <option value="vampiro">Gasto Vampiro (suscripción)</option>
                  <option value="prescindible">Gasto Prescindible (impulso)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-200/60 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm cursor-pointer"
              >
                Guardar Gasto
              </button>
            </div>
          </form>
        )}

        {/* Lista de Gastos */}
        {leaks.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <p className="text-sm font-medium">No hay fugas registradas todavía.</p>
            <p className="text-xs text-slate-400 mt-1">Usa el botón superior para agregar un gasto diario o recurrente.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {leaks.map((leak, idx) => (
              <div
                key={idx}
                className="py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/60 px-2 rounded-xl transition"
              >
                <div className="flex items-center gap-3">
                  {getCategoryBadge(leak.categoria)}
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{leak.nombre}</p>
                    <p className="text-xs text-slate-400">
                      {leak.monto.toFixed(2)} € • {leak.frecuencia}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">
                      {leak.costeMensual.toFixed(2)} €<span className="text-xs font-normal text-slate-400">/mes</span>
                    </p>
                    <p className="text-xs font-medium text-rose-600">
                      {leak.costeAnual.toFixed(2)} €/año
                    </p>
                  </div>

                  <button
                    onClick={() => onRemoveLeak(idx)}
                    className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Desglose por categoría inferior */}
        {leaks.length > 0 && (
          <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-3 gap-3 text-center">
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <p className="text-xs text-amber-700 font-medium">Microgastos Hormiga</p>
              <p className="text-base font-bold text-slate-900 mt-0.5">{agregado.porCategoria.hormiga.mensual.toFixed(2)} €<span className="text-xs font-normal text-slate-400">/m</span></p>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <p className="text-xs text-purple-700 font-medium">Suscripciones Vampiro</p>
              <p className="text-base font-bold text-slate-900 mt-0.5">{agregado.porCategoria.vampiro.mensual.toFixed(2)} €<span className="text-xs font-normal text-slate-400">/m</span></p>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <p className="text-xs text-rose-700 font-medium">Gastos Prescindibles</p>
              <p className="text-base font-bold text-slate-900 mt-0.5">{agregado.porCategoria.prescindible.mensual.toFixed(2)} €<span className="text-xs font-normal text-slate-400">/m</span></p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
