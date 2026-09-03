import React, { useState, useRef } from 'react';
import type { FinancialTransaction, TransactionCategory } from '../../../src/models/types';
import { parseBankCSV } from '../../../src/services/bankImportService';
import { Upload, Plus, Trash2, ArrowUpRight, ArrowDownRight, AlertCircle, FileSpreadsheet, Check, Sparkles } from 'lucide-react';

interface BankLedgerSectionProps {
  transactions: FinancialTransaction[];
  onAddTransaction: (tx: FinancialTransaction) => void;
  onImportTransactions: (txs: FinancialTransaction[]) => void;
  onRemoveTransaction: (id: string) => void;
  supermercadoPresupuestado: number;
}

export const BankLedgerSection: React.FC<BankLedgerSectionProps> = ({
  transactions,
  onAddTransaction,
  onImportTransactions,
  onRemoveTransaction,
  supermercadoPresupuestado,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [concepto, setConcepto] = useState('');
  const [importe, setImporte] = useState('');
  const [categoria, setCategoria] = useState<TransactionCategory>('supermercado');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cálculos reales de tesorería
  const totalIngresosReales = transactions
    .filter((t) => t.importe > 0)
    .reduce((sum, t) => sum + t.importe, 0);

  const totalGastosReales = transactions
    .filter((t) => t.importe < 0)
    .reduce((sum, t) => sum + Math.abs(t.importe), 0);

  const gastoSuperReal = transactions
    .filter((t) => t.categoria === 'supermercado' && t.importe < 0)
    .reduce((sum, t) => sum + Math.abs(t.importe), 0);

  const fugasRealesDetectadas = transactions.filter((t) => t.esFugaDetectada);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const parsed = parseBankCSV(text);
        if (parsed.length > 0) {
          onImportTransactions(parsed);
        } else {
          alert('No se pudieron detectar movimientos en el archivo. Asegúrate de que sea un CSV o extracto de tu banco con columnas de fecha e importe.');
        }
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(importe);
    if (!num || !concepto) return;

    onAddTransaction({
      id: 'tx_' + Date.now(),
      fecha,
      concepto,
      importe: -Math.abs(num), // por defecto gasto
      categoria,
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

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/70 shadow-sm shadow-slate-100 space-y-6">
      {/* Header y Acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-900 text-white mb-1">
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> Control Real de Tesorería
          </span>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Libro Diario de Movimientos Reales ({transactions.length})
          </h2>
          <p className="text-xs text-slate-400">
            Pasa de la teoría a la realidad: importa el extracto de tu banco o anota tus gastos para ver desvíos reales.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".csv,.txt"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" /> Importar CSV de Banco
          </button>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-400" /> + Anotar Gasto
          </button>
        </div>
      </div>

      {/* Tarjetas de Control Real vs Presupuesto */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
          <p className="text-xs text-slate-400 font-medium">Ingresos Reales Ingresados</p>
          <p className="text-xl font-bold text-slate-900 mt-1">+{totalIngresosReales.toFixed(2)} €</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
          <p className="text-xs text-slate-400 font-medium">Gastos Reales Pagados</p>
          <p className="text-xl font-bold text-rose-600 mt-1">-{totalGastosReales.toFixed(2)} €</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400 font-medium">Consumo Supermercado</p>
            <span className="text-[10px] font-bold text-slate-500">Tope: {supermercadoPresupuestado} €</span>
          </div>
          <p className="text-xl font-bold text-slate-900 mt-1">
            {gastoSuperReal.toFixed(2)} €{' '}
            <span className="text-xs font-semibold text-slate-400">
              ({supermercadoPresupuestado > 0 ? Math.round((gastoSuperReal / supermercadoPresupuestado) * 100) : 0}%)
            </span>
          </p>
        </div>
      </div>

      {/* Formulario rápido para anotar gasto */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="p-5 bg-slate-50/90 border border-slate-200 rounded-2xl space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Registrar Nuevo Movimiento</h3>
            <button type="button" onClick={() => setShowAddForm(false)} className="text-xs text-slate-400 hover:text-slate-700">Cancelar</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
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
      {transactions.length === 0 ? (
        <div className="p-8 text-center bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl space-y-2">
          <p className="text-sm font-semibold text-slate-700">Aún no hay movimientos reales registrados</p>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Puedes importar un archivo CSV descargado de tu banca online o pulsar en "+ Anotar Gasto" para registrar tus tickets diarios.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-100 rounded-2xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Concepto</th>
                <th className="py-3 px-4">Categoría</th>
                <th className="py-3 px-4 text-right">Importe</th>
                <th className="py-3 px-4 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.slice(0, 15).map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">{tx.fecha}</td>
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
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 font-medium">
                      {getCategoryLabel(tx.categoria)}
                    </span>
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
