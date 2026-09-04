import React, { useState } from 'react';
import type { EmergencyFundPlan, DebtPlanResult } from '../../../src/models/types';
import { ShieldCheck, CreditCard, Award, ArrowUpRight, CheckCircle2, Edit2, Check, X } from 'lucide-react';
import { parseEuro } from './EditProfileModal';

interface DebtEmergencySectionProps {
  emergencyPlan: EmergencyFundPlan;
  debtPlan: DebtPlanResult;
  onUpdateDebt?: (deudaNombre: string, newSaldo: number, newCuota?: number) => void;
}

export const DebtEmergencySection: React.FC<DebtEmergencySectionProps> = ({
  emergencyPlan,
  debtPlan,
  onUpdateDebt,
}) => {
  const [editingDebtName, setEditingDebtName] = useState<string | null>(null);
  const [editSaldo, setEditSaldo] = useState<string>('');
  const [editCuota, setEditCuota] = useState<string>('');

  const startEdit = (nombre: string, currentSaldo: number, currentCuota: number) => {
    setEditingDebtName(nombre);
    setEditSaldo(String(currentSaldo));
    setEditCuota(String(currentCuota));
  };

  const cancelEdit = () => {
    setEditingDebtName(null);
  };

  const handleSaveDebt = (nombre: string) => {
    if (onUpdateDebt) {
      const saldo = parseEuro(editSaldo);
      const cuota = parseEuro(editCuota);
      onUpdateDebt(nombre, saldo, cuota > 0 ? cuota : undefined);
    }
    setEditingDebtName(null);
  };
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
              {debtPlan.avalancha.ordenDeudas.map((deuda, idx) => {
                const isEditing = editingDebtName === deuda.nombre;

                if (isEditing) {
                  return (
                    <div
                      key={idx}
                      className="p-4 bg-white border-2 border-purple-400 rounded-2xl shadow-md space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-sm">{deuda.nombre}</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleSaveDebt(deuda.nombre)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition shadow-sm"
                            title="Guardar deuda real"
                          >
                            <Check className="w-3.5 h-3.5" /> Guardar
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition cursor-pointer"
                            title="Cancelar"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                            Saldo real pendiente (€)
                          </label>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={editSaldo}
                            onChange={(e) => setEditSaldo(e.target.value)}
                            placeholder="Ej: 2.998,30"
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-purple-600"
                            autoFocus
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                            Cuota al mes (€)
                          </label>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={editCuota}
                            onChange={(e) => setEditCuota(e.target.value)}
                            placeholder="Ej: 100"
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-purple-600"
                          />
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Introduce el saldo exacto que te queda por pagar (admite coma y punto: 2.998,30).
                      </p>
                    </div>
                  );
                }

                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 bg-slate-50/70 border border-slate-200/60 rounded-2xl hover:bg-slate-50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-900 text-sm">{deuda.nombre}</p>
                          <button
                            type="button"
                            onClick={() => startEdit(deuda.nombre, deuda.saldoPendiente, deuda.cuotaMensual)}
                            className="text-slate-400 hover:text-purple-600 p-0.5 rounded transition cursor-pointer"
                            title="Editar saldo o cuota real"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
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
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
