import React from 'react';
import type { EmergencyFundPlan, DebtPlanResult } from '../../../src/models/types';
import { ShieldCheck, CreditCard, Award, ArrowUpRight, CheckCircle2 } from 'lucide-react';

interface DebtEmergencySectionProps {
  emergencyPlan: EmergencyFundPlan;
  debtPlan: DebtPlanResult;
}

export const DebtEmergencySection: React.FC<DebtEmergencySectionProps> = ({
  emergencyPlan,
  debtPlan,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Fondo de Emergencia */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/70 shadow-sm shadow-slate-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-600" /> Seguridad Financiera
            </span>
            <h3 className="text-xl font-bold tracking-tight text-slate-900">Fondo de Emergencia</h3>
            <p className="text-xs text-slate-400">Progreso por fases para protegerte de imprevistos</p>
          </div>

          <div className="text-right">
            <p className="text-xs text-slate-400 font-medium">Ahorro acumulado</p>
            <p className="text-xl font-bold text-sky-700">{emergencyPlan.fondoActual.toFixed(2)} €</p>
          </div>
        </div>

        <div className="space-y-3">
          {emergencyPlan.metas.map((meta, idx) => {
            const isDone = meta.porcentajeLogrado >= 100;
            return (
              <div
                key={idx}
                className={`p-4 rounded-2xl border transition ${
                  isDone
                    ? 'bg-emerald-50/50 border-emerald-200/70'
                    : 'bg-slate-50/70 border-slate-200/60'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 text-sm">{meta.nombre}</span>
                    {isDone ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> Logrado
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-slate-400">
                        {meta.porcentajeLogrado.toFixed(0)}%
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900 text-sm">{meta.metaEuros.toFixed(2)} €</span>
                  </div>
                </div>

                {/* Barra de Progreso Minimalista */}
                <div className="w-full h-1.5 bg-slate-200/70 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isDone ? 'bg-emerald-500' : 'bg-sky-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, meta.porcentajeLogrado))}%` }}
                  />
                </div>

                <div className="flex items-center justify-between mt-2 text-xs text-slate-400">
                  <span>
                    {isDone ? 'Objetivo asegurado' : `Faltan ${meta.importeFalta.toFixed(2)} €`}
                  </span>
                  {meta.mesesEstimados !== null && !isDone && (
                    <span className="font-medium text-slate-600">~{meta.mesesEstimados} meses al ritmo actual</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Plan de Desendeudamiento */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/70 shadow-sm shadow-slate-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 mb-1">
              <CreditCard className="w-3.5 h-3.5 text-purple-600" /> Desendeudamiento
            </span>
            <h3 className="text-xl font-bold tracking-tight text-slate-900">Estrategia Avalancha</h3>
            <p className="text-xs text-slate-400">Paga primero el interés más alto para ahorrar miles de euros</p>
          </div>

          <div className="text-right">
            <p className="text-xs text-slate-400 font-medium">Cuotas mensuales</p>
            <p className="text-xl font-bold text-slate-900">{debtPlan.avalancha.pagoMinimoTotal.toFixed(2)} €</p>
          </div>
        </div>

        {debtPlan.avalancha.ordenDeudas.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl">
            <Award className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <p className="text-slate-900 font-bold">¡Cero Deudas!</p>
            <p className="text-slate-400 text-xs mt-1">No tienes deudas activas pendientes de pago.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-purple-50/70 border border-purple-100 rounded-2xl p-4 text-xs text-purple-900 flex items-start gap-2.5">
              <ArrowUpRight className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
              <span>
                <strong>Recomendación:</strong> Concentra cualquier excedente o ahorro de fugas en liquidar:{' '}
                <strong className="text-purple-800 underline font-bold">{debtPlan.avalancha.deudaPrioritaria}</strong>.
              </span>
            </div>

            <div className="space-y-2.5">
              {debtPlan.avalancha.ordenDeudas.map((deuda, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 bg-slate-50/70 border border-slate-200/60 rounded-2xl"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{deuda.nombre}</p>
                      <p className="text-xs text-slate-400">Cuota: {deuda.cuotaMensual.toFixed(2)} € • Pago día {deuda.fechaPago}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-slate-900 text-sm">{deuda.saldoPendiente.toFixed(2)} €</p>
                    <span className="inline-block text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                      {deuda.tipoInteres}% TAE
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
