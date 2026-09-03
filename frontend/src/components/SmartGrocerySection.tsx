import React, { useState } from 'react';
import type { SmartGroceryInput } from '../../../src/models/types';
import { calculateSmartGroceryPlan } from '../../../src/services/smartGroceriesService';
import { ShoppingBag, Users, Calendar, Euro, Check, Sparkles, AlertCircle, ShoppingCart } from 'lucide-react';

export const SmartGrocerySection: React.FC = () => {
  const [personas, setPersonas] = useState(2);
  const [dias, setDias] = useState(7);
  const [presupuesto, setPresupuesto] = useState(75);
  const [alimentosTexto, setAlimentosTexto] = useState('arroz, sal, aceite');
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

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

  const plan = calculateSmartGroceryPlan(input);

  const toggleCheck = (nombre: string) => {
    setCheckedItems((prev) => ({
      ...prev,
      [nombre]: !prev[nombre],
    }));
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 mb-1">
            <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" /> Ahorro en Alimentación
          </span>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Asistente de Compra Inteligente
          </h2>
          <p className="text-xs text-slate-400">
            Aprovecha lo que ya tienes en casa y genera una cesta optimizada sin compras impulsivas.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <div>
            <p className="text-xs font-medium text-slate-400">Presupuesto Tope</p>
            <p className="text-xl font-bold text-slate-900">{presupuesto.toFixed(2)} €</p>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div>
            <p className="text-xs font-medium text-slate-400">Cesta Estimada</p>
            <p className="text-xl font-bold text-emerald-600">{plan.costeEstimadoTotal.toFixed(2)} €</p>
          </div>
        </div>
      </div>

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

      {/* Ajustes automáticos inteligentes aplicados */}
      {plan.ajustesRealizados.length > 0 && (
        <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-4 text-xs text-emerald-950 space-y-1">
          <p className="font-bold flex items-center gap-1.5 text-emerald-900">
            <Sparkles className="w-4 h-4 text-emerald-600" /> Optimización de Ahorro Activa:
          </p>
          <ul className="list-disc list-inside text-emerald-800 space-y-0.5">
            {plan.ajustesRealizados.map((ajuste, i) => (
              <li key={i}>{ajuste}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Lista Interactiva de la Compra */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-slate-500" /> Cesta Optimizada ({plan.items.length} productos)
          </h3>
          <span className="text-xs text-slate-400">Marca los productos conforme los compres en el súper</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {plan.items.map((item, idx) => {
            const isChecked = !!checkedItems[item.nombre];
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

                <div className="text-right">
                  <p className="text-xs font-bold text-slate-900">{item.costeEstimado.toFixed(2)} €</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
