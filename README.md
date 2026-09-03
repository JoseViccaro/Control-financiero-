# Plan Financiero Personal

Una mini-aplicación diseñada con metodologías **SDD** (Spec-Driven Development), **TDD** (Test-Driven Development) y **RDD** (Readme/Review-Driven Development) para ayudarte a tomar el control absoluto de tus finanzas: liquidar deudas, crear un colchón de emergencia y planificar tus compras sin fugas de dinero.

---

## 🔒 Privacidad y Reglas de Oro

1. **Moneda**: Siempre en Euros (€).
2. **Cero Datos Sensibles**: **Nunca** te pedirá contraseñas, IBAN, números de tarjeta, DNI ni credenciales bancarias.
3. **Sin Suposiciones**: Trabaja exclusivamente con los números reales que proporciones.
4. **Sin Trampas Financieras**: No recomienda préstamos rápidos, tarjetas revolving ni reunificaciones dudosas sin advertir detalladamente de sus sobrecostes.
5. **Enfoque Práctico**: Tono directo y 100% constructivo, orientado a la acción inmediata.

---

## 🚀 Inicio Rápido

### Requisitos
- Node.js (v18+)

### Ejecución
`ash
# Instalar dependencias
npm install

# Pasar las pruebas automáticas (TDD)
npm test

# Iniciar el asistente guiado interactivo
npm run dev
`

---

## 📊 Módulos y Diagnósticos que Genera

### 1. Resumen Mensual
- Cuadre exacto: Ingresos netos vs. Gastos fijos, Gastos variables, Cuotas de deuda y Ahorro comprometido.
- Cálculo de **Dinero Libre real** y ratio de esfuerzo destinado al pago de pasivos.

### 2. Plan de Gastos
- Clasificación de partidas en **Esenciales**, **Recortables** y **Prescindibles**.
- Fijación de **límites mensuales y semanales** claros para: *Supermercado*, *Ocio*, *Comidas fuera* y *Compras online*.
- Seguimiento de remanente disponible.

### 3. Plan de Deudas (Estrategias Avalancha vs. Bola de Nieve)
- **Regla Inviolable**: Jamás sugiere dejar de pagar cuotas mínimas vigentes.
- **Método Avalancha**: Prioriza la deuda con mayor tipo de interés (ahorro máximo en intereses totales).
- **Método Bola de Nieve**: Prioriza la deuda con menor saldo pendiente (impacto psicológico y cuotas eliminadas rápidamente).
- **Recomendación Motivada**: Selección algorítmica del mejor método según la brecha de tipos de interés.
- **Alerta de Endeudamiento**: Advertencia si las cuotas superan el **35%** de los ingresos netos.

### 4. Fondo de Emergencia Escalonado
- Cálculo de gastos indispensables mensuales base.
- Metas progresivas:
  1. **300 €** (Primer colchón de choque).
  2. **1 Mes** de gastos esenciales.
  3. **3 Meses** de gastos esenciales.
  4. **6 Meses** de gastos esenciales.
- Importe faltante, porcentaje alcanzado y meses estimados según tu ahorro.
- Regla de oro: Automatización con transferencia bancaria al día siguiente de cobrar nómina.

### 5. Compra Inteligente
- Considera los alimentos que ya tienes en casa para evitar compras duplicadas.
- Agrupa por secciones: *Fruta y verdura*, *Proteínas*, *Despensa*, *Lácteos*, *Congelados* y *Limpieza*.
- Ajusta cantidades o sustituye productos no prioritarios si la estimación rebasa tu presupuesto máximo.

### 6. Acciones de Hoy (Top 5 Semanal)
- Lista concreta de hasta 5 medidas ordenadas por impacto para aplicar inmediatamente esta semana.
