import React from 'react';
import type { ActionPlanItem } from '../../../src/models/types';
import { Target, AlertCircle, ArrowRight, Zap, TrendingUp } from 'lucide-react';

interface ActionPlanSectionProps {
  items: ActionPlanItem[];
}

export const ActionPlanSection: React.FC<ActionPlanSectionProps> = ({ items }) => {
  if (!items || items.length === 0) return null;

  const getImpactBadge = (impacto: string) => {
    switch (impacto) {
      case 'ALTO':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200/70 px-2 py-0.5 rounded-md">
            <Zap className="w-3 h-3 text-rose-500" /> Prioridad Crítica
          </span>
        );
      case 'MEDIO':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200/70 px-2 py-0.5 rounded-md">
            <TrendingUp className="w-3 h-3 text-amber-500" /> Impacto Alto
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-200/70 px-2 py-0.5 rounded-md">
            Hábito Recomendado
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/70 shadow-sm shadow-slate-100 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 mb-1">
            <Target className="w-3.5 h-3.5 text-emerald-600" /> Plan de Acción
          </span>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Misiones Financieras del Mes ({items.length})
          </h2>
          <p className="text-xs text-slate-400">
            Tus pasos concretos ordenados por urgencia matemática para sanar y hacer crecer tu dinero.
          </p>
        </div>

        <span className="text-xs font-medium px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 border border-slate-200/60 self-start sm:self-auto">
          Generado automáticamente
        </span>
      </div>

      <div className="space-y-3">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200/70 hover:border-slate-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-7 h-7 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                {item.prioridad}
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">{item.titulo}</h3>
                  {getImpactBadge(item.impacto)}
                </div>
                <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">{item.descripcion}</p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-slate-900 shrink-0 self-end sm:self-center">
              <span>Hacer ahora</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
