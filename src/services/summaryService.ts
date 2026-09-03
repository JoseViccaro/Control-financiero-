import { UserFinancialProfile, MonthlySummary } from '../models/types.js';

export function calculateMonthlySummary(profile: UserFinancialProfile): MonthlySummary {
  const fijos = profile.gastosFijos;
  const variables = profile.gastosVariables;

  const gastosFijosTotal = 
    fijos.vivienda +
    fijos.suministros +
    fijos.telefono +
    fijos.internet +
    fijos.seguros +
    fijos.transporte +
    fijos.cuotas;

  const gastosVariablesTotal = 
    variables.supermercado +
    variables.ocio +
    variables.comidasFuera +
    variables.comprasOnline +
    variables.otros;

  const cuotasDeudaTotal = profile.deudas.reduce((acc, d) => acc + d.cuotaMensual, 0);
  const ahorroComprometido = profile.objetivoAhorroMensual;

  const totalComprometido = gastosFijosTotal + gastosVariablesTotal + cuotasDeudaTotal + ahorroComprometido;
  const dineroLibre = profile.ingresosNetosMensuales - totalComprometido;

  const ratio = profile.ingresosNetosMensuales > 0
    ? (cuotasDeudaTotal / profile.ingresosNetosMensuales) * 100
    : 0;

  return {
    ingresos: profile.ingresosNetosMensuales,
    gastosFijosTotal,
    gastosVariablesTotal,
    cuotasDeudaTotal,
    ahorroComprometido,
    dineroLibre,
    porcentajeDestinadoDeuda: Math.round(ratio * 100) / 100
  };
}
