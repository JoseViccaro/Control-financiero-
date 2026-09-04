import React from 'react';
import type { FinancialTransaction, UserFinancialProfile } from '../../../src/models/types';
import { Home, Shield, Zap, CreditCard } from 'lucide-react';

interface FixedObligationsSectionProps {
  profile: UserFinancialProfile;
  transactions: FinancialTransaction[];
}

export const FixedObligationsSection: React.FC<FixedObligationsSectionProps> = ({
  profile,
  transactions,
}) => {
  const viviendaMovs = transactions.filter(t => t.categoria === 'vivienda' && t.importe < 0);
  const segurosMovs = transactions.filter(t => t.categoria === 'seguros' && t.importe < 0);
  const suministrosMovs = transactions.filter(t => t.categoria === 'suministros' && t.importe < 0);
  const deudasMovs = transactions.filter(t => t.categoria === 'deuda' && t.importe < 0);

  const agruparPorConcepto = (movs: FinancialTransaction[]) => {
    const map = new Map<string, { total: number; fecha: string; titular?: string }>();
    for (const m of movs) {
      const key = m.concepto.trim();
      const abs = Math.abs(m.importe);
      const existing = map.get(key);
      if (existing) {
        existing.total += abs;
      } else {
        map.set(key, { total: abs, fecha: m.fecha, titular: m.titular });
      }
    }
    return Array.from(map.entries()).map(([nombre, data]) => ({
      nombre,
      importe: data.total,
      fecha: data.fecha,
      titular: data.titular,
    }));
  };

  const listaVivienda = agruparPorConcepto(viviendaMovs);
  const listaSeguros = agruparPorConcepto(segurosMovs);
  const listaSuministros = agruparPorConcepto(suministrosMovs);
  const listaDeudas = agruparPorConcepto(deudasMovs);

  const totalFijos =
    profile.gastosFijos.vivienda +
    profile.gastosFijos.seguros +
    profile.gastosFijos.suministros +
    profile.gastosFijos.cuotas;

  if (totalFijos <= 0 && transactions.length === 0) return null;

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/70 shadow-sm shadow-slate-100 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 mb-1">
            <Home className="w-3.5 h-3.5 text-indigo-600" /> Compromisos Obligatorios
          </span>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Hipotecas, Préstamos, Seguros y Suministros
          </h2>
          <p className="text-xs text-slate-400">
            Radiografía exacta de los gastos que tenéis comprometidos cada mes sí o sí antes de vivir.
          </p>
        </div>

        <div className="text-right self-start sm:self-auto bg-slate-50 border border-slate-200/70 rounded-2xl px-4 py-2.5">
          <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Total Obligaciones Fijas</p>
          <p className="text-xl sm:text-2xl font-black text-slate-900">
            {totalFijos.toFixed(2)} € <span className="text-xs font-normal text-slate-400">/ mes</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-800">
                <Home className="w-4 h-4 text-blue-600" /> Vivienda / Hipoteca
              </span>
              <span className="text-xs font-bold text-slate-900 font-mono">
                {profile.gastosFijos.vivienda.toFixed(2)} €
              </span>
            </div>
            
            <div className="space-y-1.5 pt-2 border-t border-slate-200/60">
              {listaVivienda.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic">Sin movimientos de hipoteca/alquiler detectados</p>
              ) : (
                listaVivienda.map((v, i) => (
                  <div key={i} className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-600 truncate max-w-[130px]" title={v.nombre}>{v.nombre}</span>
                    <span className="font-bold text-slate-900 font-mono">-{v.importe.toFixed(2)} €</span>
                  </div>
                ))
              )}
            </div>
          </div>
          <p className="text-[10px] text-slate-400">Cuota base de techo y comunidad</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-800">
                <CreditCard className="w-4 h-4 text-purple-600" /> Préstamos y Deudas
              </span>
              <span className="text-xs font-bold text-rose-600 font-mono">
                {profile.gastosFijos.cuotas.toFixed(2)} €
              </span>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-200/60">
              {listaDeudas.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic">No se detectaron recibos de préstamos</p>
              ) : (
                listaDeudas.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-600 truncate max-w-[130px]" title={d.nombre}>{d.nombre}</span>
                    <span className="font-bold text-rose-600 font-mono">-{d.importe.toFixed(2)} €</span>
                  </div>
                ))
              )}
            </div>
          </div>
          <p className="text-[10px] text-slate-400">Cuotas a financieras y tarjetas a crédito</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-800">
                <Shield className="w-4 h-4 text-emerald-600" /> Seguros
              </span>
              <span className="text-xs font-bold text-slate-900 font-mono">
                {profile.gastosFijos.seguros.toFixed(2)} €
              </span>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-200/60">
              {listaSeguros.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic">Sin pólizas registradas este mes</p>
              ) : (
                listaSeguros.map((s, i) => (
                  <div key={i} className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-600 truncate max-w-[130px]" title={s.nombre}>{s.nombre}</span>
                    <span className="font-bold text-slate-900 font-mono">-{s.importe.toFixed(2)} €</span>
                  </div>
                ))
              )}
            </div>
          </div>
          <p className="text-[10px] text-slate-400">Hogar, vida, salud, vehículo</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-800">
                <Zap className="w-4 h-4 text-amber-600" /> Suministros
              </span>
              <span className="text-xs font-bold text-slate-900 font-mono">
                {profile.gastosFijos.suministros.toFixed(2)} €
              </span>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-200/60">
              {listaSuministros.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic">Sin recibos de luz/agua/teléfono</p>
              ) : (
                listaSuministros.map((u, i) => (
                  <div key={i} className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-600 truncate max-w-[130px]" title={u.nombre}>{u.nombre}</span>
                    <span className="font-bold text-slate-900 font-mono">-{u.importe.toFixed(2)} €</span>
                  </div>
                ))
              )}
            </div>
          </div>
          <p className="text-[10px] text-slate-400">Luz, gas, agua, internet, telefonía</p>
        </div>
      </div>
    </div>
  );
};
