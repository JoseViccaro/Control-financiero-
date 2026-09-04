import React, { useState, useRef } from 'react';
import type { FinancialTransaction, TransactionCategory } from '../../../src/models/types';
import { parseBankCSV } from '../../../src/services/bankImportService';
import { parseBankPDF } from '../services/bankPdfParserService';
import { Upload, Plus, Trash2, FileSpreadsheet, FileText, Users, Calendar, Filter } from 'lucide-react';

interface BankLedgerSectionProps {
  transactions: FinancialTransaction[];
  onAddTransaction: (tx: FinancialTransaction) => void;
  onImportTransactions: (txs: FinancialTransaction[], titular: string) => void;
  onRemoveTransaction: (id: string) => void;
  onClearTransactions?: () => void;
  onUpdateTransactionCategory?: (id: string, newCat: TransactionCategory) => void;
  supermercadoPresupuestado: number;
}

export const BankLedgerSection: React.FC<BankLedgerSectionProps> = ({
  transactions,
  onAddTransaction,
  onImportTransactions,
  onRemoveTransaction,
  onClearTransactions,
  onUpdateTransactionCategory,
  supermercadoPresupuestado,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importTitular, setImportTitular] = useState('Mi Nómina / Yo');
  const [isProcessing, setIsProcessing] = useState(false);

  // Filtros de mes y titular
  const [filtroMes, setFiltroMes] = useState<string>('todos');
  const [filtroTitular, setFiltroTitular] = useState<string>('todos');

  // Formulario manual
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [concepto, setConcepto] = useState('');
  const [importe, setImporte] = useState('');
  const [categoria, setCategoria] = useState<TransactionCategory>('supermercado');
  const [titularManual, setTitularManual] = useState('Yo');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Obtener meses únicos presentes en las transacciones para el selector
  const mesesDisponibles = Array.from(
    new Set(
      transactions
        .map((t) => t.mes || (t.fecha ? t.fecha.substring(0, 7) : ''))
        .filter(Boolean)
    )
  ).sort().reverse();

  // Transacciones filtradas según mes y titular
  const transaccionesFiltradas = transactions.filter((t) => {
    const cumpleMes = filtroMes === 'todos' || t.mes === filtroMes || t.fecha.startsWith(filtroMes);
    const cumpleTitular = filtroTitular === 'todos' || t.titular === filtroTitular;
    return cumpleMes && cumpleTitular;
  });

  // Cálculos reales de tesorería sobre la vista seleccionada
  const totalIngresosReales = transaccionesFiltradas
    .filter((t) => t.importe > 0)
    .reduce((sum, t) => sum + t.importe, 0);

  const totalGastosReales = transaccionesFiltradas
    .filter((t) => t.importe < 0)
    .reduce((sum, t) => sum + Math.abs(t.importe), 0);

  const gastoSuperReal = transaccionesFiltradas
    .filter((t) => t.categoria === 'supermercado' && t.importe < 0)
    .reduce((sum, t) => sum + Math.abs(t.importe), 0);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);

    try {
      const fileName = file.name.toLowerCase();
      if (fileName.endsWith('.pdf')) {
        const buffer = await file.arrayBuffer();
        const parsed = await parseBankPDF(buffer, importTitular);
        if (parsed.length > 0) {
          onImportTransactions(parsed, importTitular);
          setShowImportModal(false);
        } else {
          alert('No se pudieron leer transacciones en el PDF. Asegúrate de que sea un extracto bancario con conceptos y cantidades.');
        }
      } else {
        const text = await file.text();
        const parsed = parseBankCSV(text, importTitular);
        if (parsed.length > 0) {
          onImportTransactions(parsed, importTitular);
          setShowImportModal(false);
        } else {
          alert('No se pudieron detectar movimientos en el archivo CSV. Comprueba el formato de tu banco.');
        }
      }
    } catch (err: any) {
      console.error('Error al procesar extracto:', err);
      alert('Error al leer el archivo: ' + (err?.message || 'Formato no reconocido'));
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(importe);
    if (!num || !concepto) return;

    const mes = fecha.substring(0, 7);

    onAddTransaction({
      id: 'tx_' + Date.now(),
      fecha,
      concepto,
      importe: -Math.abs(num),
      categoria,
      titular: titularManual,
      mes,
      esFugaDetectada: Math.abs(num) <= 7 && (concepto.toLowerCase().includes('cafe') || concepto.toLowerCase().includes('vending')),
    });

    setConcepto('');
    setImporte('');
    setShowAddForm(false);
  };

  const getCategoryLabel = (cat: TransactionCategory) => {
    const map: Record<TransactionCategory, string> = {
      nomina: 'Nómina / Ingreso',
      ingreso_extra: 'Ingreso Extra',
      transferencia_interna: 'Traspaso Interno (Neutro)',
      vivienda: 'Vivienda',
      suministros: 'Suministros',
      supermercado: 'Supermercado',
      ocio_restaurantes: 'Ocio / Salidas',
      compras: 'Compras',
      transporte: 'Transporte',
      salud: 'Salud',
      deuda: 'Pago Deuda',
      suscripciones: 'Suscripciones',
      otros: 'Varios',
    };
    return map[cat] || cat;
  };

  const CATEGORIAS_DISPONIBLES: { id: TransactionCategory; label: string }[] = [
    { id: 'supermercado', label: 'Supermercado' },
    { id: 'vivienda', label: 'Vivienda / Alquiler' },
    { id: 'suministros', label: 'Suministros (Luz, Agua, etc.)' },
    { id: 'deuda', label: 'Pago Deuda / Tarjetas' },
    { id: 'ocio_restaurantes', label: 'Ocio / Restaurantes' },
    { id: 'compras', label: 'Compras' },
    { id: 'transporte', label: 'Transporte / Gasolina' },
    { id: 'suscripciones', label: 'Suscripciones' },
    { id: 'salud', label: 'Salud' },
    { id: 'nomina', label: 'Nómina / Salario' },
    { id: 'ingreso_extra', label: 'Ingreso Extra' },
    { id: 'transferencia_interna', label: 'Traspaso Interno (Neutro)' },
    { id: 'otros', label: 'Otros / Varios' },
  ];

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/70 shadow-sm shadow-slate-100 space-y-6">
      {/* Header y Acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-900 text-white mb-1">
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> Control Mensual Familiar y Tesorería
          </span>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Libro de Movimientos Bancarios ({transactions.length})
          </h2>
          <p className="text-xs text-slate-400">
            Une tu nómina y la de tu esposa, o separa por titular y mes a mes para ver el histórico de evolución.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {transactions.length > 0 && onClearTransactions && (
            <button
              onClick={onClearTransactions}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition cursor-pointer"
              title="Borrar todos los movimientos para empezar de cero"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" /> Vaciar Lista
            </button>
          )}

          <button
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" /> + Importar Extracto Bancario
          </button>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-400" /> + Anotar Gasto
          </button>
        </div>
      </div>

      {/* Selectores de Seguimiento Mes a Mes y Titular */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-50/80 rounded-2xl border border-slate-200/60 text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="font-bold text-slate-700">Ver Seguimiento de:</span>

          {/* Selector de Mes */}
          <select
            value={filtroMes}
            onChange={(e) => setFiltroMes(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none"
          >
            <option value="todos">Todos los meses (Global)</option>
            {mesesDisponibles.map((m) => (
              <option key={m} value={m}>
                Mes: {m}
              </option>
            ))}
          </select>

          {/* Selector de Titular */}
          <select
            value={filtroTitular}
            onChange={(e) => setFiltroTitular(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none"
          >
            <option value="todos">Familia Completa (Conjunto)</option>
            <option value="Mi Nómina / Yo">Solo Yo</option>
            <option value="Mi Esposa">Solo Mi Esposa</option>
            <option value="Cuenta Conjunta">Cuenta Conjunta</option>
          </select>
        </div>

        <span className="text-[11px] text-slate-400">
          Mostrando {transaccionesFiltradas.length} movimientos de {transactions.length} totales
        </span>
      </div>

      {/* Tarjetas de Control Real vs Presupuesto */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
          <p className="text-xs text-slate-400 font-medium">Ingresos Netos Reales (Nóminas)</p>
          <p className="text-xl font-bold text-slate-900 mt-1">+{totalIngresosReales.toFixed(2)} €</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
          <p className="text-xs text-slate-400 font-medium">Gastos Reales del Periodo</p>
          <p className="text-xl font-bold text-rose-600 mt-1">-{totalGastosReales.toFixed(2)} €</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400 font-medium">Ahorro Neto Real</p>
            <span className="text-[10px] font-bold text-slate-500">
              {totalIngresosReales > 0 ? Math.round(((totalIngresosReales - totalGastosReales) / totalIngresosReales) * 100) : 0}% tasa
            </span>
          </div>
          <p className={`text-xl font-bold mt-1 ${totalIngresosReales - totalGastosReales >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            +{(totalIngresosReales - totalGastosReales).toFixed(2)} €
          </p>
        </div>
      </div>

      {/* Modal para importar extracto bancario preguntando de quién es */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Importar Extracto Bancario</h3>
                <p className="text-xs text-slate-400">¿De qué cuenta o titular es este extracto?</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Titular del extracto:</label>
                <select
                  value={importTitular}
                  onChange={(e) => setImportTitular(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none"
                >
                  <option value="Mi Nómina / Yo">Mi Nómina / Cuenta Personal</option>
                  <option value="Mi Esposa">Nómina / Cuenta de Mi Esposa</option>
                  <option value="Cuenta Conjunta">Cuenta Conjunta Familiar</option>
                </select>
              </div>

              <div className="p-5 border-2 border-dashed border-slate-200 hover:border-emerald-400/80 rounded-2xl text-center space-y-3 bg-slate-50/50 transition">
                <div className="flex justify-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    <FileText className="w-3 h-3" /> PDF Bancario (CaixaBank, etc.)
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <FileSpreadsheet className="w-3 h-3" /> CSV / Excel
                  </span>
                </div>

                <p className="text-xs text-slate-600 font-medium">
                  {isProcessing ? 'Analizando extracto bancario con IA...' : 'Elige tu extracto en PDF o CSV:'}
                </p>

                {isProcessing ? (
                  <div className="py-2 flex items-center justify-center gap-2 text-xs font-bold text-emerald-600">
                    <span className="animate-spin text-base">⏳</span> Extrayendo movimientos...
                  </div>
                ) : (
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".pdf,.csv,.txt"
                    className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-900 file:text-white hover:file:bg-slate-800 cursor-pointer"
                  />
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Formulario rápido para anotar gasto manual */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="p-5 bg-slate-50/90 border border-slate-200 rounded-2xl space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Registrar Movimiento Manual</h3>
            <button type="button" onClick={() => setShowAddForm(false)} className="text-xs text-slate-400 hover:text-slate-700">Cancelar</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Fecha</label>
              <input
                type="date"
                required
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Concepto</label>
              <input
                type="text"
                required
                placeholder="Ej. Mercadona, Bar, Farmacia..."
                value={concepto}
                onChange={(e) => setConcepto(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Importe (€)</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="Ej. 18.50"
                value={importe}
                onChange={(e) => setImporte(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Categoría</label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as TransactionCategory)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none"
              >
                <option value="supermercado">Supermercado</option>
                <option value="ocio_restaurantes">Ocio / Restaurantes</option>
                <option value="vivienda">Vivienda</option>
                <option value="suministros">Suministros</option>
                <option value="transporte">Transporte / Gasolina</option>
                <option value="compras">Compras</option>
                <option value="suscripciones">Suscripciones</option>
                <option value="deuda">Pago Deuda</option>
                <option value="otros">Otros</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Titular</label>
              <select
                value={titularManual}
                onChange={(e) => setTitularManual(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none"
              >
                <option value="Yo">Yo</option>
                <option value="Esposa">Esposa</option>
                <option value="Cuenta Conjunta">Conjunta</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition"
            >
              Guardar Movimiento
            </button>
          </div>
        </form>
      )}

      {/* Tabla de Movimientos Reales */}
      {transaccionesFiltradas.length === 0 ? (
        <div className="p-8 text-center bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl space-y-2">
          <p className="text-sm font-semibold text-slate-700">No hay movimientos en el periodo o titular seleccionado</p>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Puedes importar el extracto de tu cuenta o el de tu esposa pulsando en "+ Importar Extracto Bancario".
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-100 rounded-2xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Titular</th>
                <th className="py-3 px-4">Concepto</th>
                <th className="py-3 px-4">Categoría</th>
                <th className="py-3 px-4 text-right">Importe</th>
                <th className="py-3 px-4 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transaccionesFiltradas.slice(0, 25).map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">{tx.fecha}</td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                      {tx.titular || 'General'}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    <div className="flex items-center gap-2">
                      <span>{tx.concepto}</span>
                      {tx.esFugaDetectada && (
                        <span className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded">
                          Fuga
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    {onUpdateTransactionCategory ? (
                      <select
                        value={tx.categoria}
                        onChange={(e) => onUpdateTransactionCategory(tx.id, e.target.value as TransactionCategory)}
                        className="text-[11px] font-medium bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
                      >
                        {CATEGORIAS_DISPONIBLES.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-100 font-medium">
                        {getCategoryLabel(tx.categoria)}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-bold font-mono whitespace-nowrap">
                    <span className={tx.importe > 0 ? 'text-emerald-600' : 'text-slate-900'}>
                      {tx.importe > 0 ? `+${tx.importe.toFixed(2)}` : `${tx.importe.toFixed(2)}`} €
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => onRemoveTransaction(tx.id)}
                      className="text-slate-300 hover:text-rose-600 transition cursor-pointer"
                      title="Eliminar movimiento"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
