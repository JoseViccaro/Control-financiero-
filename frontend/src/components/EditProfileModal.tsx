import React, { useState, useEffect } from 'react';
import type { UserFinancialProfile, DebtItem } from '../../../src/models/types';
import { X, Check, Plus, Trash2, HelpCircle, Edit2 } from 'lucide-react';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfile: UserFinancialProfile;
  onSave: (updated: UserFinancialProfile) => void;
}

export const parseEuro = (val: string | number): number => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  // Soporta formato europeo "2.998,30" o "2998,30" y formato estándar "2998.30"
  const clean = String(val).replace(/\./g, '').replace(',', '.').trim();
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
};

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  currentProfile,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<'ingresos' | 'fijos' | 'variables' | 'deudas' | 'ahorro'>('ingresos');

  // Estados locales del formulario
  const [ingresosNetos, setIngresosNetos] = useState(currentProfile.ingresosNetosMensuales);
  const [fondoEmergencia, setFondoEmergencia] = useState(currentProfile.fondoEmergenciaActual);
  const [objetivoAhorro, setObjetivoAhorro] = useState(currentProfile.objetivoAhorroMensual);

  // Gastos Fijos
  const [fijos, setFijos] = useState({ ...currentProfile.gastosFijos });

  // Gastos Variables
  const [variables, setVariables] = useState({ ...currentProfile.gastosVariables });

  // Deudas
  const [deudas, setDeudas] = useState<DebtItem[]>([...currentProfile.deudas]);
  const [nuevaDeudaNombre, setNuevaDeudaNombre] = useState('');
  const [nuevaDeudaSaldo, setNuevaDeudaSaldo] = useState('');
  const [nuevaDeudaCuota, setNuevaDeudaCuota] = useState('');
  const [nuevaDeudaTAE, setNuevaDeudaTAE] = useState('');
  const [nuevaDeudaDia, setNuevaDeudaDia] = useState('05');

  // Sincronizar estados locales cada vez que el modal se abra o cambie currentProfile
  useEffect(() => {
    if (isOpen) {
      setIngresosNetos(currentProfile.ingresosNetosMensuales);
      setFondoEmergencia(currentProfile.fondoEmergenciaActual);
      setObjetivoAhorro(currentProfile.objetivoAhorroMensual);
      setFijos({ ...currentProfile.gastosFijos });
      setVariables({ ...currentProfile.gastosVariables });
      setDeudas([...currentProfile.deudas]);
    }
  }, [isOpen, currentProfile]);

  if (!isOpen) return null;

  const handleAddDeuda = (e: React.FormEvent) => {
    e.preventDefault();
    const saldo = parseEuro(nuevaDeudaSaldo);
    const cuota = parseEuro(nuevaDeudaCuota);
    const tae = parseEuro(nuevaDeudaTAE);
    if (!nuevaDeudaNombre.trim() || isNaN(saldo) || isNaN(cuota)) return;

    setDeudas([
      ...deudas,
      {
        nombre: nuevaDeudaNombre.trim(),
        saldoPendiente: saldo,
        cuotaMensual: cuota,
        tipoInteres: isNaN(tae) || tae === 0 ? 19.9 : tae,
        fechaPago: nuevaDeudaDia || '05',
      },
    ]);

    setNuevaDeudaNombre('');
    setNuevaDeudaSaldo('');
    setNuevaDeudaCuota('');
    setNuevaDeudaTAE('');
  };

  const handleUpdateExistingDeuda = (index: number, field: keyof DebtItem, rawVal: string | number) => {
    setDeudas(prev => {
      const copy = [...prev];
      const item = { ...copy[index] };
      if (field === 'saldoPendiente' || field === 'cuotaMensual' || field === 'tipoInteres') {
        (item[field] as number) = parseEuro(rawVal);
      } else {
        (item[field] as any) = rawVal;
      }
      copy[index] = item;
      return copy;
    });
  };

  const handleRemoveDeuda = (index: number) => {
    setDeudas(deudas.filter((_, i) => i !== index));
  };

  const handleSaveAll = () => {
    const updated: UserFinancialProfile = {
      ...currentProfile,
      ingresosNetosMensuales: Number(ingresosNetos) || 0,
      fondoEmergenciaActual: Number(fondoEmergencia) || 0,
      objetivoAhorroMensual: Number(objetivoAhorro) || 0,
      gastosFijos: {
        vivienda: Number(fijos.vivienda) || 0,
        suministros: Number(fijos.suministros) || 0,
        telefono: Number(fijos.telefono) || 0,
        internet: Number(fijos.internet) || 0,
        seguros: Number(fijos.seguros) || 0,
        transporte: Number(fijos.transporte) || 0,
        cuotas: Number(fijos.cuotas) || 0,
      },
      gastosVariables: {
        supermercado: Number(variables.supermercado) || 0,
        ocio: Number(variables.ocio) || 0,
        comidasFuera: Number(variables.comidasFuera) || 0,
        comprasOnline: Number(variables.comprasOnline) || 0,
        otros: Number(variables.otros) || 0,
      },
      deudas,
    };

    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Configurar Mis Datos Financieros</h2>
            <p className="text-xs text-slate-400 mt-0.5">Tus datos se sincronizan con tu cuenta de Supabase en la nube de forma segura.</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs de Navegación */}
        <div className="flex border-b border-slate-100 px-6 bg-slate-50/60 overflow-x-auto text-xs font-semibold text-slate-500 gap-2 pt-2">
          <button
            onClick={() => setActiveTab('ingresos')}
            className={`pb-2.5 px-3 border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'ingresos' ? 'border-slate-900 text-slate-900 font-bold' : 'border-transparent hover:text-slate-700'
            }`}
          >
            1. Ingresos y Ahorro
          </button>
          <button
            onClick={() => setActiveTab('fijos')}
            className={`pb-2.5 px-3 border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'fijos' ? 'border-slate-900 text-slate-900 font-bold' : 'border-transparent hover:text-slate-700'
            }`}
          >
            2. Gastos Fijos
          </button>
          <button
            onClick={() => setActiveTab('variables')}
            className={`pb-2.5 px-3 border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'variables' ? 'border-slate-900 text-slate-900 font-bold' : 'border-transparent hover:text-slate-700'
            }`}
          >
            3. Gastos Variables
          </button>
          <button
            onClick={() => setActiveTab('deudas')}
            className={`pb-2.5 px-3 border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'deudas' ? 'border-slate-900 text-slate-900 font-bold' : 'border-transparent hover:text-slate-700'
            }`}
          >
            4. Préstamos / Deudas ({deudas.length})
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {activeTab === 'ingresos' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ingresos Netos Mensuales (€)
                </label>
                <input
                  type="number"
                  step="10"
                  value={ingresosNetos}
                  onChange={(e) => setIngresosNetos(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition"
                  placeholder="Ej: 2100"
                />
                <p className="text-[11px] text-slate-400 mt-1">Lo que ingresas limpio al mes (nómina + ingresos recurrentes).</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Fondo de Emergencia Actual (€)
                  </label>
                  <input
                    type="number"
                    step="10"
                    value={fondoEmergencia}
                    onChange={(e) => setFondoEmergencia(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition"
                    placeholder="Ej: 500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Dinero ahorrado exclusivamente para imprevistos.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Objetivo de Ahorro Mensual (€)
                  </label>
                  <input
                    type="number"
                    step="10"
                    value={objetivoAhorro}
                    onChange={(e) => setObjetivoAhorro(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition"
                    placeholder="Ej: 200"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Cuánto dinero te comprometes a guardar al mes.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'fijos' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">Gastos obligatorios que tienes que pagar cada mes:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Vivienda (Alquiler/Hipoteca)</label>
                  <input
                    type="number"
                    value={fijos.vivienda}
                    onChange={(e) => setFijos({ ...fijos, vivienda: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Suministros (Luz, Agua, Gas)</label>
                  <input
                    type="number"
                    value={fijos.suministros}
                    onChange={(e) => setFijos({ ...fijos, suministros: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Móvil e Internet</label>
                  <input
                    type="number"
                    value={fijos.telefono + fijos.internet}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setFijos({ ...fijos, telefono: val / 2, internet: val / 2 });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Seguros (Salud, Coche, Hogar)</label>
                  <input
                    type="number"
                    value={fijos.seguros}
                    onChange={(e) => setFijos({ ...fijos, seguros: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Transporte fijo (Abono/Gasolina mensual)</label>
                  <input
                    type="number"
                    value={fijos.transporte}
                    onChange={(e) => setFijos({ ...fijos, transporte: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Otras cuotas fijas</label>
                  <input
                    type="number"
                    value={fijos.cuotas}
                    onChange={(e) => setFijos({ ...fijos, cuotas: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'variables' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">Estimación aproximada de tus gastos habituales:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Supermercado y Alimentación</label>
                  <input
                    type="number"
                    value={variables.supermercado}
                    onChange={(e) => setVariables({ ...variables, supermercado: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Ocio y Salidas</label>
                  <input
                    type="number"
                    value={variables.ocio}
                    onChange={(e) => setVariables({ ...variables, ocio: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Restaurantes / Comidas fuera</label>
                  <input
                    type="number"
                    value={variables.comidasFuera}
                    onChange={(e) => setVariables({ ...variables, comidasFuera: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Compras online / Ropa / Caprichos</label>
                  <input
                    type="number"
                    value={variables.comprasOnline}
                    onChange={(e) => setVariables({ ...variables, comprasOnline: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'deudas' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">Préstamos, tarjetas de crédito revolving o compras aplazadas:</p>
              
              {/* Lista actual de deudas con edición directa */}
              <div className="space-y-3">
                {deudas.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 text-center border border-dashed border-slate-200 rounded-xl">
                    No tienes deudas añadidas. ¡Excelente!
                  </p>
                ) : (
                  deudas.map((d, i) => (
                    <div key={i} className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-900">{d.nombre}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveDeuda(i)}
                          className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition"
                          title="Eliminar deuda"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Saldo total (€)</label>
                          <input
                            type="text"
                            inputMode="decimal"
                            defaultValue={d.saldoPendiente}
                            onBlur={(e) => handleUpdateExistingDeuda(i, 'saldoPendiente', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-900 font-semibold focus:outline-none focus:border-slate-900"
                            placeholder="Ej: 2.998,30"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Cuota/mes (€)</label>
                          <input
                            type="text"
                            inputMode="decimal"
                            defaultValue={d.cuotaMensual}
                            onBlur={(e) => handleUpdateExistingDeuda(i, 'cuotaMensual', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-900 font-semibold focus:outline-none focus:border-slate-900"
                            placeholder="Ej: 100"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">% TAE (Interés)</label>
                          <input
                            type="text"
                            inputMode="decimal"
                            defaultValue={d.tipoInteres}
                            onBlur={(e) => handleUpdateExistingDeuda(i, 'tipoInteres', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-900 font-semibold focus:outline-none focus:border-slate-900"
                            placeholder="Ej: 19.9"
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Formulario para añadir deuda */}
              <form onSubmit={handleAddDeuda} className="p-4 bg-slate-100/70 rounded-2xl space-y-3">
                <p className="text-xs font-bold text-slate-700">Añadir otra deuda o tarjeta:</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <input
                    type="text"
                    placeholder="Nombre (ej: VISA &GO)"
                    value={nuevaDeudaNombre}
                    onChange={(e) => setNuevaDeudaNombre(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none"
                  />
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="Saldo (€) ej: 2.998,30"
                    value={nuevaDeudaSaldo}
                    onChange={(e) => setNuevaDeudaSaldo(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none"
                  />
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="Cuota/mes (€) ej: 100"
                    value={nuevaDeudaCuota}
                    onChange={(e) => setNuevaDeudaCuota(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none"
                  />
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="% TAE (ej: 19.9)"
                    value={nuevaDeudaTAE}
                    onChange={(e) => setNuevaDeudaTAE(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Añadir deuda a la lista
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleSaveAll}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-md transition cursor-pointer"
          >
            <Check className="w-4 h-4 text-emerald-400" /> Guardar y Recalcular
          </button>
        </div>
      </div>
    </div>
  );
};
