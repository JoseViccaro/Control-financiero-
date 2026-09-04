import { useState, useEffect } from 'react';
import type { UserFinancialProfile, MoneyLeakInput } from '../../src/models/types';
import { analyzeMoneyLeaks } from '../../src/services/leakDetectionService';
import { calculateMonthlySummary } from '../../src/services/summaryService';
import { calculateDebtPlan } from '../../src/services/debtPlanService';
import { calculateEmergencyFundPlan } from '../../src/services/emergencyFundService';
import { generateActionPlan } from '../../src/services/actionPlanService';
import { LeakSection } from './components/LeakSection';
import { DebtEmergencySection } from './components/DebtEmergencySection';
import { SmartGrocerySection } from './components/SmartGrocerySection';
import { HealthCheckSection } from './components/HealthCheckSection';
import { ActionPlanSection } from './components/ActionPlanSection';
import { BankLedgerSection } from './components/BankLedgerSection';
import { FixedObligationsSection } from './components/FixedObligationsSection';
import { EditProfileModal } from './components/EditProfileModal';
import { AuthModal } from './components/AuthModal';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import type { FinancialTransaction } from '../../src/models/types';
import { buildProfileFromTransactions } from '../../src/services/bankImportService';
import { RotateCcw, ShieldCheck, ArrowUpRight, ArrowDownRight, Wallet, PiggyBank, SlidersHorizontal, Cloud } from 'lucide-react';

const INITIAL_PROFILE: UserFinancialProfile = {
  ingresosNetosMensuales: 0,
  dineroDisponibleActual: 0,
  gastosFijos: {
    vivienda: 0,
    suministros: 0,
    telefono: 0,
    internet: 0,
    seguros: 0,
    transporte: 0,
    cuotas: 0,
  },
  gastosVariables: {
    supermercado: 0,
    ocio: 0,
    comidasFuera: 0,
    comprasOnline: 0,
    otros: 0,
  },
  deudas: [],
  fondoEmergenciaActual: 0,
  objetivoAhorroMensual: 0,
  proximosGastosExcepcionales: [],
  fugasPresupuesto: [],
  movimientosReales: [],
};

export function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [perfil, setPerfil] = useState<UserFinancialProfile>(() => {
    try {
      const saved = localStorage.getItem('cf_local_profile_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_PROFILE;
  });

  // Limpiar cualquier residuo previo de localStorage y caché antigua
  useEffect(() => {
    // localStorage.removeItem('control_financiero_profile');
    localStorage.removeItem('control_financiero_real_grocery_list');
    localStorage.removeItem('control_financiero_grocery_budget');
    localStorage.removeItem('grocery_products');
    
    // Desregistrar cualquier Service Worker antiguo que Safari pudiera tener retenido
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        for (const registration of registrations) {
          registration.unregister();
        }
      });
    }
  }, []);

  // Cargar perfil desde Supabase si hay sesión activa
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) {
        setUserEmail(session.user.email);
        loadCloudProfile(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.email) {
        setUserEmail(session.user.email);
        loadCloudProfile(session.user.id);
      } else {
        setUserEmail(null);
        setPerfil(INITIAL_PROFILE);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const [syncStatus, setSyncStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [syncError, setSyncError] = useState<string | null>(null);

  const loadCloudProfile = async (userId: string) => {
    if (!supabase) return;
    try {
      setSyncStatus('saving');
      const { data, error } = await supabase
        .from('user_profiles')
        .select('profile_data')
        .eq('user_id', userId)
        .single();

      if (error) {
        // Código PGRST116 significa que la fila aún no existe en la tabla (usuario nuevo)
        if (error.code !== 'PGRST116') {
          console.warn('Error loading cloud profile:', error.message);
          setSyncError(`Error cargando de la nube: ${error.message}`);
          setSyncStatus('error');
          return;
        }
      }

      if (data && data.profile_data) {
        setPerfil(data.profile_data);
        try {
          localStorage.setItem('cf_local_profile_v1', JSON.stringify(data.profile_data));
        } catch (e) {}
        setSyncStatus('saved');
      } else {
        setSyncStatus('idle');
      }
    } catch (err: any) {
      console.error('Failed to load cloud profile:', err);
      setSyncError(err?.message || 'Error de conexión');
      setSyncStatus('error');
    }
  };

  const uploadProfileToCloud = async (currentData?: UserFinancialProfile) => {
    if (!supabase) return;
    try {
      setSyncStatus('saving');
      setSyncError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSyncStatus('error');
        setSyncError('No hay sesión iniciada en Supabase');
        return;
      }

      const toSave = currentData || perfil;
      const { error } = await supabase.from('user_profiles').upsert(
        {
          user_id: user.id,
          profile_data: toSave,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

      if (error) {
        console.error('Error al subir a la nube:', error);
        setSyncError(error.message);
        setSyncStatus('error');
        alert(`Error al guardar en la nube: ${error.message}. Por favor revisa los permisos de Supabase.`);
      } else {
        setSyncStatus('saved');
      }
    } catch (e: any) {
      setSyncError(e?.message || 'Error inesperado');
      setSyncStatus('error');
    }
  };

  const saveProfileWithSync = async (updated: UserFinancialProfile) => {
    setPerfil(updated);
    try {
      localStorage.setItem('cf_local_profile_v1', JSON.stringify(updated));
    } catch (e) {}

    await uploadProfileToCloud(updated);
  };

  // Cálculos en tiempo real utilizando directamente el motor TypeScript
  const summary = calculateMonthlySummary(perfil);
  const leaksResult = analyzeMoneyLeaks(perfil.fugasPresupuesto, perfil);
  const debtPlan = calculateDebtPlan(perfil);
  const emergencyPlan = calculateEmergencyFundPlan(perfil);
  const actionPlan = generateActionPlan(perfil, summary, debtPlan, emergencyPlan);

  // Desglose para la regla 50/30/20
  const gastosNecesidades = summary.gastosFijosTotal + perfil.gastosVariables.supermercado;
  const gastosDeseos =
    perfil.gastosVariables.ocio +
    perfil.gastosVariables.comidasFuera +
    perfil.gastosVariables.comprasOnline +
    perfil.gastosVariables.otros;
  const ahorroYDeudas = summary.cuotasDeudaTotal + summary.ahorroComprometido + Math.max(0, summary.dineroLibre);

  const handleAddLeak = (leak: MoneyLeakInput) => {
    setPerfil((prev) => ({
      ...prev,
      fugasPresupuesto: [...(prev.fugasPresupuesto || []), leak],
    }));
  };

  const handleRemoveLeak = (index: number) => {
    setPerfil((prev) => ({
      ...prev,
      fugasPresupuesto: (prev.fugasPresupuesto || []).filter((_, i) => i !== index),
    }));
  };

  const handleAddTransaction = (tx: FinancialTransaction) => {
    const updatedMovs = [tx, ...(perfil.movimientosReales || [])];
    saveProfileWithSync({
      ...perfil,
      movimientosReales: updatedMovs,
    });
  };

  const handleImportTransactions = (txs: FinancialTransaction[], titular?: string) => {
    // Si viene titular, asegurar que cada transacción lo tenga
    const taggedTxs = titular ? txs.map(t => ({ ...t, titular })) : txs;
    
    // Evitar duplicados por clave fecha + concepto + importe + titular
    const existing = perfil.movimientosReales || [];
    const existingKeys = new Set(existing.map(m => `${m.fecha}_${m.concepto}_${m.importe}_${m.titular || ''}`));
    
    const newUniqueTxs = taggedTxs.filter(t => !existingKeys.has(`${t.fecha}_${t.concepto}_${t.importe}_${t.titular || ''}`));
    const allMovs = [...newUniqueTxs, ...existing];
    
    // Reconstruir automáticamente el perfil con las categorías y números reales del conjunto
    const updatedProfile = buildProfileFromTransactions(allMovs, perfil);
    saveProfileWithSync(updatedProfile);
  };

  const handleClearTransactions = () => {
    if (confirm('¿Deseas vaciar todos los movimientos importados para volver a subirlos limpios?')) {
      const updatedProfile = buildProfileFromTransactions([], perfil);
      saveProfileWithSync({
        ...updatedProfile,
        movimientosReales: [],
      });
    }
  };

  const handleUpdateTransactionCategory = (id: string, newCat: TransactionCategory) => {
    const updatedMovs = (perfil.movimientosReales || []).map(t => {
      if (t.id === id) {
        return { ...t, categoria: newCat };
      }
      return t;
    });
    const updatedProfile = buildProfileFromTransactions(updatedMovs, perfil);
    saveProfileWithSync(updatedProfile);
  };

  const handleUpdateGroceryProducts = (items: any[]) => {
    saveProfileWithSync({
      ...perfil,
      customGroceryProducts: items
    });
  };

  const handleRemoveTransaction = (id: string) => {
    const updatedMovs = (perfil.movimientosReales || []).filter((t) => t.id !== id);
    const updatedProfile = buildProfileFromTransactions(updatedMovs, perfil);
    saveProfileWithSync(updatedProfile);
  };

  const handleUpdateDebt = (deudaNombre: string, newSaldo: number, newCuota?: number) => {
    const updatedDeudas = (perfil.deudas || []).map(d => {
      const dName = d.nombre.toLowerCase().trim();
      const targetName = deudaNombre.toLowerCase().trim();
      if (dName === targetName || dName.includes(targetName) || targetName.includes(dName)) {
        return {
          ...d,
          saldoPendiente: newSaldo,
          cuotaMensual: newCuota !== undefined ? newCuota : d.cuotaMensual,
        };
      }
      return d;
    });

    saveProfileWithSync({
      ...perfil,
      deudas: updatedDeudas,
    });
  };

  const handleReset = () => {
    if (confirm('¿Restablecer datos a los valores de ejemplo iniciales?')) {
      setPerfil(INITIAL_PROFILE);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-slate-900 selection:text-white">
      {/* Modal para Editar y Personalizar Datos */}
      <EditProfileModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentProfile={perfil}
        onSave={saveProfileWithSync}
      />

      {/* Modal de Autenticación y Sincronización en la Nube */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        userEmail={userEmail}
        syncStatus={syncStatus}
        syncError={syncError}
        onForceUpload={async () => {
          await uploadProfileToCloud(perfil);
          alert('¡Datos de este dispositivo subidos y guardados con éxito en la nube!');
        }}
        onForceDownload={async () => {
          if (supabase) {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              await loadCloudProfile(user.id);
              alert('¡Datos de la nube descargados y aplicados en este dispositivo!');
            }
          }
        }}
        onAuthSuccess={async (email) => {
          setUserEmail(email);
          if (supabase) {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              const { data } = await supabase.from('user_profiles').select('profile_data').eq('user_id', user.id).single();
              if (data && data.profile_data) {
                setPerfil(data.profile_data);
                try {
                  localStorage.setItem('cf_local_profile_v1', JSON.stringify(data.profile_data));
                } catch (e) {}
              } else {
                await uploadProfileToCloud(perfil);
              }
            }
          }
        }}
        onSignOut={() => {
          setUserEmail(null);
          setPerfil(INITIAL_PROFILE);
          try {
            localStorage.removeItem('cf_local_profile_v1');
          } catch (e) {}
        }}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-10">
        
        {/* Header Superior Limpio con Botón de Ajustes */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <img
              src="/app-icon.png"
              alt="Control Financiero"
              className="w-12 h-12 rounded-2xl shadow-md shadow-slate-200 border border-slate-100 object-cover"
            />
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
                  Tu Salud Financiera
                </span>
              </div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                  Control Financiero
                </h1>
                <span className="text-[10px] font-bold bg-slate-900 text-white px-2 py-0.5 rounded-full">
                  v2.2
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            {/* Botón de Nube / Sincronización */}
            <button
              onClick={() => setIsAuthOpen(true)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-semibold border transition cursor-pointer ${
                userEmail
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 hover:bg-emerald-100'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
              title={userEmail ? `Sincronizado como ${userEmail}` : 'Iniciar sesión para sincronizar'}
            >
              <Cloud className={`w-4 h-4 ${userEmail ? 'text-emerald-600' : 'text-slate-400'}`} />
              <span>{userEmail ? 'Sincronizado' : 'Sincronizar'}</span>
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition shadow-md cursor-pointer"
            >
              <SlidersHorizontal className="w-4 h-4 text-emerald-400" /> Meter Mis Datos
            </button>

            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-medium text-slate-500 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200/80 transition shadow-2xs cursor-pointer"
              title="Restablecer datos demo"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Demo
            </button>

            <button
              onClick={() => {
                if (confirm('¿Vaciar la aplicación para empezar a meter tus datos 100% reales desde cero?')) {
                  saveProfileWithSync({
                    ingresosNetosMensuales: 0,
                    dineroDisponibleActual: 0,
                    gastosFijos: { vivienda: 0, suministros: 0, telefono: 0, internet: 0, seguros: 0, transporte: 0, cuotas: 0 },
                    gastosVariables: { supermercado: 0, ocio: 0, comidasFuera: 0, comprasOnline: 0, otros: 0 },
                    deudas: [],
                    fondoEmergenciaActual: 0,
                    objetivoAhorroMensual: 0,
                    proximosGastosExcepcionales: [],
                    fugasPresupuesto: [],
                    movimientosReales: [],
                  });
                  setIsModalOpen(true);
                }
              }}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-2xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200/70 transition cursor-pointer"
              title="Borrar datos de ejemplo y empezar limpio con tus números"
            >
              Empezar en Blanco
            </button>
          </div>
        </header>

        {/* Tarjetas KPI Superiores */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => setIsModalOpen(true)}
            className="bg-white rounded-3xl p-6 border border-slate-200/70 shadow-sm shadow-slate-100/60 space-y-3 hover:border-slate-300 transition cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 group-hover:text-slate-600 transition">Ingresos Netos</span>
              <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-3xl font-extrabold tracking-tight text-slate-900">
                {summary.ingresos.toFixed(2)} <span className="text-lg font-normal text-slate-400">€</span>
              </p>
              <p className="text-xs text-slate-400 mt-1">Haz clic para editar</p>
            </div>
          </div>

          <div
            onClick={() => setIsModalOpen(true)}
            className="bg-white rounded-3xl p-6 border border-slate-200/70 shadow-sm shadow-slate-100/60 space-y-3 hover:border-slate-300 transition cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 group-hover:text-slate-600 transition">Gastos Fijos</span>
              <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-3xl font-extrabold tracking-tight text-slate-900">
                {summary.gastosFijosTotal.toFixed(2)} <span className="text-lg font-normal text-slate-400">€</span>
              </p>
              <p className="text-xs text-slate-400 mt-1">Vivienda, suministros, seguros...</p>
            </div>
          </div>

          <div
            onClick={() => setIsModalOpen(true)}
            className="bg-white rounded-3xl p-6 border border-slate-200/70 shadow-sm shadow-slate-100/60 space-y-3 hover:border-slate-300 transition cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 group-hover:text-slate-600 transition">Gastos Variables</span>
              <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500">
                <ArrowDownRight className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-3xl font-extrabold tracking-tight text-slate-900">
                {summary.gastosVariablesTotal.toFixed(2)} <span className="text-lg font-normal text-slate-400">€</span>
              </p>
              <p className="text-xs text-slate-400 mt-1">Supermercado, ocio, comidas...</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-emerald-200/80 shadow-sm shadow-emerald-50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-700">Capacidad de Ahorro</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <PiggyBank className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-3xl font-extrabold tracking-tight text-emerald-600">
                {summary.dineroLibre.toFixed(2)} <span className="text-lg font-normal text-emerald-400">€</span>
              </p>
              <p className="text-xs text-slate-400 mt-1">Excedente neto libre al mes</p>
            </div>
          </div>
        </div>

        {/* Sección: Plan de Acción Priorizado del Mes */}
        <section>
          <ActionPlanSection items={actionPlan} />
        </section>

        {/* Sección: Semáforo de Salud Financiera 50 / 30 / 20 */}
        <section>
          <HealthCheckSection
            ingresos={summary.ingresos}
            gastosNecesidades={gastosNecesidades}
            gastosDeseos={gastosDeseos}
            ahorroYDeudas={ahorroYDeudas}
          />
        </section>

        {/* Sección: Obligaciones Fijas (Hipotecas, Seguros, Préstamos y Suministros) */}
        <section>
          <FixedObligationsSection
            profile={perfil}
            transactions={perfil.movimientosReales || []}
          />
        </section>

        {/* Sección: Control Real de Tesorería (Movimientos e Importación Bancaria) */}
        <section>
          <BankLedgerSection
            transactions={perfil.movimientosReales || []}
            onAddTransaction={handleAddTransaction}
            onImportTransactions={handleImportTransactions}
            onRemoveTransaction={handleRemoveTransaction}
            onClearTransactions={handleClearTransactions}
            onUpdateTransactionCategory={handleUpdateTransactionCategory}
            supermercadoPresupuestado={perfil.gastosVariables.supermercado}
          />
        </section>

        {/* Sección: Auditoría de Fugas de Dinero */}
        <section>
          <LeakSection
            leaks={leaksResult.fugas}
            agregado={leaksResult.agregado}
            impacto={leaksResult.impacto}
            onAddLeak={handleAddLeak}
            onRemoveLeak={handleRemoveLeak}
          />
        </section>

        {/* Sección: Metas de Seguridad y Deudas */}
        <section>
          <DebtEmergencySection
            emergencyPlan={emergencyPlan}
            debtPlan={debtPlan}
            onUpdateDebt={handleUpdateDebt}
          />
        </section>

        {/* Sección: Compra Inteligente de Supermercado */}
        <section>
          <SmartGrocerySection
            products={perfil.customGroceryProducts || []}
            onUpdateProducts={handleUpdateGroceryProducts}
            gastoSupermercadoRealMes={perfil.gastosVariables.supermercado}
          />
        </section>

        <footer className="text-center pt-8 border-t border-slate-200/60 text-xs text-slate-400">
          Control Financiero • Tus datos no salen de tu ordenador • Persistencia automática en navegador
        </footer>
      </div>
    </div>
  );
}

export default App;
