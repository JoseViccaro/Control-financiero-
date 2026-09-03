import React from 'react';
import { ShieldAlert, CheckCircle, AlertTriangle } from 'lucide-react';

interface Rule503020Props {
  ingresos: number;
  gastosNecesidades: number; // Fijos + supermercado
  gastosDeseos: number;       // Ocio + comidas fuera + compras online + otros
  ahorroYDeudas: number;      // Cuotas deuda + ahorro comprometido + dinero libre
}

export const HealthCheckSection: React.FC<Rule503020Props> = ({
  ingresos,
  gastosNecesidades,
  gastosDeseos,
  ahorroYDeudas,
}) => {
  if (ingresos <= 0) return null;

  const pctNecesidades = Math.round((gastosNecesidades / ingresos) * 100);
  const pctDeseos = Math.round((gastosDeseos / ingresos) * 100);
  const pctAhorro = Math.round((ahorroYDeudas / ingresos) * 100);

  const getStatusBadge = (actual: number, ideal: number, isMin: boolean = false) => {
    const ok = isMin ? actual >= ideal : actual <= ideal;
    const warning = isMin ? actual >= ideal - 10 : actual <= ideal + 10;

    if (ok) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
          <CheckCircle className="w-3 h-3" /> Saludable
        </span>
      );
    }
    if (warning) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-full">
          <AlertTriangle className="w-3 h-3" /> Ajustado
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-100/70 px-2 py-0.5 rounded-full">
        <ShieldAlert className="w-3 h-3" /> Zona de Alerta
      </span>
    );
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/70 shadow-sm shadow-slate-100 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 mb-1">
            Diagnóstico Financiero
          </span>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Regla de Salud Financiera 50 / 30 / 20
          </h2>
          <p className="text-xs text-slate-400">
            El estándar financiero de oro para saber si tu estilo de vida es sostenible o te genera estrés.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200/60">
            Ingresos Base: {ingresos.toFixed(2)} €
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 50% Necesidades */}
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">50% Necesidades</span>
            {getStatusBadge(pctNecesidades, 50)}
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-extrabold text-slate-900">{pctNecesidades}%</p>
              <p className="text-xs font-semibold text-slate-500">{gastosNecesidades.toFixed(2)} €</p>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mt-2">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  pctNecesidades <= 50 ? 'bg-emerald-500' : pctNecesidades <= 60 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${Math.min(100, pctNecesidades)}%` }}
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-500">
            {pctNecesidades <= 50
              ? 'Excelente. Tu vivienda y compromisos fijos no te ahogan.'
              : `Tus fijos superan el 50% ideal. Deberías reducir ${Math.round(gastosNecesidades - ingresos * 0.5)} € en contratos.`}
          </p>
        </div>

        {/* 30% Deseos y Estilo de Vida */}
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">30% Estilo de Vida</span>
            {getStatusBadge(pctDeseos, 30)}
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-extrabold text-slate-900">{pctDeseos}%</p>
              <p className="text-xs font-semibold text-slate-500">{gastosDeseos.toFixed(2)} €</p>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mt-2">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  pctDeseos <= 30 ? 'bg-emerald-500' : pctDeseos <= 40 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${Math.min(100, pctDeseos)}%` }}
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-500">
            {pctDeseos <= 30
              ? 'Control impecable en ocio, compras y salidas.'
              : `Tus caprichos se comen ${Math.round(gastosDeseos - ingresos * 0.3)} € de más este mes.`}
          </p>
        </div>

        {/* 20% Ahorro e Inversión */}
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">20% Ahorro & Deuda</span>
            {getStatusBadge(pctAhorro, 20, true)}
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-extrabold text-slate-900">{pctAhorro}%</p>
              <p className="text-xs font-semibold text-slate-500">{ahorroYDeudas.toFixed(2)} €</p>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mt-2">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  pctAhorro >= 20 ? 'bg-emerald-500' : pctAhorro >= 10 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, pctAhorro))}%` }}
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-500">
            {pctAhorro >= 20
              ? 'Destino óptimo para tu fondo de paz mental y desendeudamiento.'
              : `Estás ahorrando por debajo del 20% objetivo (${(ingresos * 0.2).toFixed(0)} €/mes).`}
          </p>
        </div>
      </div>
    </div>
  );
};
