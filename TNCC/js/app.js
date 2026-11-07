/**
 * Dashboard Combinado Cobre & Fibra - TNCC Analytics Studio
 * Mercados Masivos / Monitoreo TNCC
 */

// Repositorio de datos oficiales para ambas tecnologías
const telecomData = {
  cobre: {
    name: 'Aba Cobre',
    type: 'cobre',
    color: '#FF8C42',
    colorAlpha: 'rgba(255, 140, 66, 0.85)',
    months: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sept'],
    carteraInicio: [1517643, 1481858, 1387054, 1342155, 1303926, 1263474, 1213285, 1173060, 1152689],
    instalaciones: [1195, 1112, 1114, 910, 869, 803, 623, 650, 656],
    retiros: [36980, 95916, 46013, 39139, 41321, 50992, 40848, 21021, 22080],
    tncc: [-2.36, -6.40, -3.24, -2.85, -3.10, -3.97, -3.32, -1.74, -1.86]
  },
  fibra: {
    name: 'Aba Ultra (Fibra)',
    type: 'fibra',
    color: '#00D2FF',
    colorAlpha: 'rgba(0, 210, 255, 0.85)',
    months: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sept'],
    carteraInicio: [175609, 178841, 182313, 182795, 183262, 187994, 193585, 173620, 174829],
    instalaciones: [3926, 4333, 3028, 884, 5346, 6056, 2406, 5288, 4157],
    retiros: [694, 861, 2546, 417, 614, 465, 22371, 4079, 4413],
    tncc: [1.84, 1.94, 0.26, 0.26, 2.58, 2.97, -10.31, 0.70, -0.15]
  }
};

let currentView = 'combinado';
let currentBenchmark = 'thresholds';
let trendChartInstance = null;
let currentLogoBase64 = '';

// Banderas de visibilidad de series en el gráfico principal de Evolución
// Vista combinada predeterminada: sólo TNCC Fibra y TNCC Cobre
const visibleSeries = {
  tnccUltra: true,
  tnccCobre: true,
  instFibra: false,
  instCobre: false,
  retFibra: false,
  retCobre: false,
  netFibra: false,
  carteraFibra: false,
  carteraCobre: false
};

// Funciones utilitarias
const formatNum = n => new Intl.NumberFormat('de-DE').format(Math.round(n));
const formatPct = n => (n >= 0 ? '+' : '') + n.toFixed(2).replace('.', ',') + '%';
const sumArr = arr => arr.reduce((a, b) => a + b, 0);
const avgArr = arr => arr.reduce((a, b) => a + b, 0) / (arr.length || 1);

// Inicialización de componentes al cargar el DOM
function initDashboard() {
  if (window.lucide) {
    lucide.createIcons();
  }
  // Pre-cargar Data URL del logo para exportación offline
  fetch('img/logo-base64.txt')
    .then(r => r.text())
    .then(t => {
      if (t && t.startsWith('data:')) {
        currentLogoBase64 = t.trim();
      }
    })
    .catch(() => {});

  setupEditorEvents();
  buildTrendChart();
}

/**
 * Gráfico Principal: Evolución Mensual de TNCC
 * Incorpora: TNCC %, Instalaciones, Retiros, Balance Neto Fibra, Cartera Fibra y Cartera Cobre
 */
function buildTrendChart() {
  const canvasEl = document.getElementById('trendChartCanvas');
  if (!canvasEl) return;
  const ctx = canvasEl.getContext('2d');
  if (trendChartInstance) trendChartInstance.destroy();

  const f = telecomData.fibra;
  const c = telecomData.cobre;
  const months = f.months;

  const datasets = [];

  // 1. TNCC Fibra (%)
  if (visibleSeries.tnccUltra) {
    datasets.push({
      type: 'line',
      label: 'TNCC Aba Ultra (%)',
      data: f.tncc,
      borderColor: '#00D2FF',
      backgroundColor: 'rgba(0, 210, 255, 0.12)',
      fill: true,
      tension: 0.25,
      borderWidth: 3,
      pointBackgroundColor: '#00D2FF',
      pointBorderColor: '#fff',
      pointBorderWidth: 1.5,
      pointRadius: 5,
      pointHoverRadius: 7,
      yAxisID: 'yTncc',
      order: 1
    });
  }

  // 2. TNCC Cobre (%)
  if (visibleSeries.tnccCobre) {
    datasets.push({
      type: 'line',
      label: 'TNCC Aba Cobre (%)',
      data: c.tncc,
      borderColor: '#FF8C42',
      backgroundColor: 'rgba(255, 140, 66, 0.08)',
      fill: true,
      tension: 0.25,
      borderWidth: 3,
      pointBackgroundColor: '#FF8C42',
      pointBorderColor: '#fff',
      pointBorderWidth: 1.5,
      pointRadius: 5,
      pointHoverRadius: 7,
      yAxisID: 'yTncc',
      order: 2
    });
  }

  // 3. Curva de Balance Neto Fibra (Línea Azul Eléctrico)
  if (visibleSeries.netFibra) {
    const netF = f.instalaciones.map((inst, i) => inst - (f.retiros[i] || 0));
    datasets.push({
      type: 'line',
      label: 'Balance Neto Fibra',
      data: netF,
      borderColor: '#38BDF8',
      backgroundColor: 'rgba(56, 189, 248, 0.15)',
      borderWidth: 2.5,
      tension: 0.2,
      pointRadius: 5,
      pointHoverRadius: 7,
      pointBackgroundColor: '#38BDF8',
      pointBorderColor: '#fff',
      pointBorderWidth: 1.5,
      yAxisID: 'yFlujos',
      order: 3
    });
  }

  // 4. Curva Cartera Fibra (Línea Púrpura Discontinua)
  if (visibleSeries.carteraFibra) {
    datasets.push({
      type: 'line',
      label: 'Cartera Fibra (Líneas)',
      data: f.carteraInicio,
      borderColor: '#C084FC',
      borderWidth: 2.5,
      borderDash: [5, 4],
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBackgroundColor: '#C084FC',
      pointBorderColor: '#fff',
      yAxisID: 'yCarteraFibra',
      order: 4
    });
  }

  // 5. Curva Cartera Cobre (Línea Ámbar Discontinua)
  if (visibleSeries.carteraCobre) {
    datasets.push({
      type: 'line',
      label: 'Cartera Cobre (Líneas)',
      data: c.carteraInicio,
      borderColor: '#FBBF24',
      borderWidth: 2.5,
      borderDash: [6, 4],
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBackgroundColor: '#FBBF24',
      pointBorderColor: '#fff',
      yAxisID: 'yCarteraCobre',
      order: 5
    });
  }

  // 6. Instalaciones Fibra (Barras Verdes Esmeralda)
  if (visibleSeries.instFibra) {
    datasets.push({
      type: 'bar',
      label: 'Instalaciones Fibra',
      data: f.instalaciones,
      backgroundColor: 'rgba(16, 185, 129, 0.75)',
      borderColor: '#10B981',
      borderWidth: 1,
      borderRadius: 4,
      yAxisID: 'yFlujos',
      order: 6
    });
  }

  // 7. Instalaciones Cobre (Barras Turquesa)
  if (visibleSeries.instCobre) {
    datasets.push({
      type: 'bar',
      label: 'Instalaciones Cobre',
      data: c.instalaciones,
      backgroundColor: 'rgba(20, 184, 166, 0.7)',
      borderColor: '#14b8a6',
      borderWidth: 1,
      borderRadius: 4,
      yAxisID: 'yFlujos',
      order: 7
    });
  }

  // 8. Retiros Fibra (Barras Rosa)
  if (visibleSeries.retFibra) {
    datasets.push({
      type: 'bar',
      label: 'Retiros Fibra',
      data: f.retiros,
      backgroundColor: 'rgba(244, 63, 94, 0.7)',
      borderColor: '#f43f5e',
      borderWidth: 1,
      borderRadius: 4,
      yAxisID: 'yFlujos',
      order: 8
    });
  }

  // 9. Retiros Cobre (Barras Rojo Carmesí)
  if (visibleSeries.retCobre) {
    datasets.push({
      type: 'bar',
      label: 'Retiros Cobre',
      data: c.retiros,
      backgroundColor: 'rgba(225, 29, 72, 0.65)',
      borderColor: '#e11d48',
      borderWidth: 1,
      borderRadius: 4,
      yAxisID: 'yFlujos',
      order: 9
    });
  }

  // Guías y Líneas de Benchmark
  if (currentBenchmark === 'thresholds') {
    datasets.push({
      type: 'line',
      label: 'Umbral Excelente (+2.0%)',
      data: Array(months.length).fill(2.0),
      borderColor: 'rgba(16, 185, 129, 0.7)',
      borderWidth: 1.5,
      borderDash: [6, 4],
      pointRadius: 0,
      fill: false,
      yAxisID: 'yTncc',
      order: 10
    });
    datasets.push({
      type: 'line',
      label: 'Umbral Saludable (+0.5%)',
      data: Array(months.length).fill(0.5),
      borderColor: 'rgba(0, 210, 255, 0.7)',
      borderWidth: 1.5,
      borderDash: [6, 4],
      pointRadius: 0,
      fill: false,
      yAxisID: 'yTncc',
      order: 10
    });
    datasets.push({
      type: 'line',
      label: 'Línea Cero (0.0%)',
      data: Array(months.length).fill(0.0),
      borderColor: 'rgba(255, 255, 255, 0.4)',
      borderWidth: 1,
      pointRadius: 0,
      fill: false,
      yAxisID: 'yTncc',
      order: 10
    });
  } else if (currentBenchmark === 'avgUltra') {
    const avgF = Number(avgArr(f.tncc).toFixed(2));
    datasets.push({
      type: 'line',
      label: `Promedio TNCC Fibra (${formatPct(avgF)})`,
      data: Array(months.length).fill(avgF),
      borderColor: '#00D2FF',
      borderWidth: 2,
      borderDash: [6, 4],
      pointRadius: 0,
      yAxisID: 'yTncc',
      order: 10
    });
  } else if (currentBenchmark === 'avgCobre') {
    const avgC = Number(avgArr(c.tncc).toFixed(2));
    datasets.push({
      type: 'line',
      label: `Promedio TNCC Cobre (${formatPct(avgC)})`,
      data: Array(months.length).fill(avgC),
      borderColor: '#FF8C42',
      borderWidth: 2,
      borderDash: [6, 4],
      pointRadius: 0,
      yAxisID: 'yTncc',
      order: 10
    });
  } else if (currentBenchmark === 'zero') {
    datasets.push({
      type: 'line',
      label: 'Línea Cero (0.0%)',
      data: Array(months.length).fill(0.0),
      borderColor: 'rgba(255, 255, 255, 0.5)',
      borderWidth: 1.5,
      pointRadius: 0,
      yAxisID: 'yTncc',
      order: 10
    });
  }

  trendChartInstance = new Chart(ctx, {
    data: {
      labels: months,
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(10, 6, 32, 0.95)',
          borderColor: 'rgba(0, 210, 255, 0.4)',
          borderWidth: 1,
          titleColor: '#fff',
          bodyColor: '#e2e8f0',
          padding: 12,
          titleFont: { size: 13, weight: 'bold', family: 'Outfit' },
          bodyFont: { size: 12, family: 'JetBrains Mono' },
          boxPadding: 4,
          callbacks: {
            label: function(context) {
              let l = context.dataset.label || '';
              if (l) l += ': ';
              if (context.dataset.yAxisID === 'yTncc') {
                l += context.parsed.y.toFixed(2) + '%';
              } else {
                l += formatNum(context.parsed.y);
              }
              return l;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.08)' },
          ticks: { color: '#94a3b8', font: { family: 'Outfit', size: 11 } }
        },
        yTncc: {
          type: 'linear',
          position: 'right',
          display: visibleSeries.tnccUltra || visibleSeries.tnccCobre,
          grid: { color: 'rgba(255, 255, 255, 0.06)' },
          ticks: {
            color: '#00D2FF',
            font: { family: 'JetBrains Mono', size: 11 },
            callback: v => v.toFixed(1) + '%'
          },
          title: {
            display: true,
            text: 'TNCC Porcentual (%)',
            color: '#00D2FF',
            font: { family: 'Outfit', size: 11, weight: 'bold' }
          }
        },
        yFlujos: {
          type: 'linear',
          position: 'left',
          display: visibleSeries.instFibra || visibleSeries.instCobre || visibleSeries.retFibra || visibleSeries.retCobre || visibleSeries.netFibra,
          grid: { drawOnChartArea: false },
          ticks: {
            color: '#cbd5e1',
            font: { family: 'JetBrains Mono', size: 10 },
            callback: v => (v >= 1000 || v <= -1000) ? (v/1000).toFixed(0) + 'k' : v
          },
          title: {
            display: true,
            text: 'Flujos (Instalaciones / Retiros / Balance)',
            color: '#cbd5e1',
            font: { family: 'Outfit', size: 11 }
          }
        },
        yCarteraFibra: {
          type: 'linear',
          position: 'left',
          display: visibleSeries.carteraFibra,
          grid: { drawOnChartArea: false },
          ticks: {
            color: '#C084FC',
            font: { family: 'JetBrains Mono', size: 10 },
            callback: v => (v/1000).toFixed(0) + 'k'
          },
          title: {
            display: true,
            text: 'Cartera Fibra',
            color: '#C084FC',
            font: { family: 'Outfit', size: 10, weight: 'bold' }
          }
        },
        yCarteraCobre: {
          type: 'linear',
          position: 'left',
          display: visibleSeries.carteraCobre,
          grid: { drawOnChartArea: false },
          ticks: {
            color: '#FBBF24',
            font: { family: 'JetBrains Mono', size: 10 },
            callback: v => (v/1000000).toFixed(2) + 'M'
          },
          title: {
            display: true,
            text: 'Cartera Cobre',
            color: '#FBBF24',
            font: { family: 'Outfit', size: 10, weight: 'bold' }
          }
        }
      }
    }
  });
}

/**
 * Toggle individual de series en el gráfico principal
 */
function toggleSeries(seriesKey) {
  visibleSeries[seriesKey] = !visibleSeries[seriesKey];
  const btnMap = {
    tnccUltra: 'toggleTnccUltra',
    tnccCobre: 'toggleTnccCobre',
    instFibra: 'toggleInstFibra',
    instCobre: 'toggleInstCobre',
    retFibra: 'toggleRetFibra',
    retCobre: 'toggleRetCobre',
    netFibra: 'toggleNetFibra',
    carteraFibra: 'toggleCarteraFibra',
    carteraCobre: 'toggleCarteraCobre'
  };
  const btn = document.getElementById(btnMap[seriesKey]);
  if (btn) {
    if (visibleSeries[seriesKey]) {
      btn.classList.add('active');
      btn.innerHTML = '<i data-lucide="check" style="width:12px;height:12px;"></i> ' + btn.textContent.trim();
    } else {
      btn.classList.remove('active');
      btn.innerHTML = '<i data-lucide="eye" style="width:12px;height:12px;"></i> ' + btn.textContent.trim();
    }
    if (window.lucide) {
      lucide.createIcons();
    }
  }
  buildTrendChart();
}

/**
 * Cambio de línea guía / benchmark
 */
function changeBenchmark() {
  currentBenchmark = document.getElementById('selectBenchmark').value;
  buildTrendChart();
}

/**
 * Cambio de vista general integrada (Combinado, Fibra, Cobre)
 */
function switchView(view) {
  currentView = view;
  ['btnViewCombinado', 'btnViewUltra', 'btnViewCobre'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
  });

  if (view === 'combinado') {
    document.getElementById('btnViewCombinado').classList.add('active');
    visibleSeries.tnccUltra = true;
    visibleSeries.tnccCobre = true;
    visibleSeries.instFibra = false;
    visibleSeries.instCobre = false;
    visibleSeries.retFibra = false;
    visibleSeries.retCobre = false;
    visibleSeries.netFibra = false;
    visibleSeries.carteraFibra = false;
    visibleSeries.carteraCobre = false;
  } else if (view === 'fibra') {
    document.getElementById('btnViewUltra').classList.add('active');
    visibleSeries.tnccUltra = true;
    visibleSeries.tnccCobre = false;
    visibleSeries.instFibra = true;
    visibleSeries.instCobre = false;
    visibleSeries.retFibra = true;
    visibleSeries.retCobre = false;
    visibleSeries.netFibra = false; // Desmarcado por defecto según requerimiento
    visibleSeries.carteraFibra = true;
    visibleSeries.carteraCobre = false;
  } else if (view === 'cobre') {
    document.getElementById('btnViewCobre').classList.add('active');
    visibleSeries.tnccUltra = false;
    visibleSeries.tnccCobre = true;
    visibleSeries.instFibra = false;
    visibleSeries.instCobre = true;
    visibleSeries.retFibra = false;
    visibleSeries.retCobre = true;
    visibleSeries.netFibra = false;
    visibleSeries.carteraFibra = false;
    visibleSeries.carteraCobre = true;
  }

  // Sincronizar estado visual de botones de toggle
  const syncBtn = (id, key, label) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle('active', visibleSeries[key]);
    const icon = visibleSeries[key] ? 'check' : 'eye';
    el.innerHTML = `<i data-lucide="${icon}" style="width:12px;height:12px;"></i> ${label}`;
  };

  syncBtn('toggleTnccUltra', 'tnccUltra', 'TNCC Fibra %');
  syncBtn('toggleTnccCobre', 'tnccCobre', 'TNCC Cobre %');
  syncBtn('toggleInstFibra', 'instFibra', 'Instalaciones Fibra');
  syncBtn('toggleInstCobre', 'instCobre', 'Instalaciones Cobre');
  syncBtn('toggleRetFibra', 'retFibra', 'Retiros Fibra');
  syncBtn('toggleRetCobre', 'retCobre', 'Retiros Cobre');
  syncBtn('toggleNetFibra', 'netFibra', 'Balance Neto Fibra');
  syncBtn('toggleCarteraFibra', 'carteraFibra', 'Cartera Fibra');
  syncBtn('toggleCarteraCobre', 'carteraCobre', 'Cartera Cobre');

  if (window.lucide) {
    lucide.createIcons();
  }

  buildTrendChart();
}

/**
 * RECALCULA Y ACTUALIZA TODAS LAS MÉTRICAS, TARJETAS, TEXTOS Y NARRATIVAS
 */
function recalculateAndRenderDashboard() {
  const f = telecomData.fibra;
  const c = telecomData.cobre;

  // 1. Cálculos de Fibra (Aba Ultra)
  const totalInstF = sumArr(f.instalaciones);
  const totalRetF = sumArr(f.retiros);
  const balanceNetoF = totalInstF - totalRetF;
  const carteraInicioF = f.carteraInicio[0] || 1;
  const carteraFinalF = f.carteraInicio[f.carteraInicio.length - 1] || carteraInicioF;
  const varCarteraF = carteraFinalF - carteraInicioF;
  const tnccAcumF = (balanceNetoF / carteraInicioF) * 100;
  const avgTnccF = avgArr(f.tncc);
  const ratioEficienciaF = totalRetF > 0 ? (totalInstF / totalRetF) : 1;

  // 2. Cálculos de Cobre (Aba Cobre)
  const totalInstC = sumArr(c.instalaciones);
  const totalRetC = sumArr(c.retiros);
  const balanceNetoC = totalInstC - totalRetC;
  const carteraInicioC = c.carteraInicio[0] || 1;
  const carteraFinalC = c.carteraInicio[c.carteraInicio.length - 1] || carteraInicioC;
  const varCarteraC = carteraFinalC - carteraInicioC;
  const pctVarCarteraC = ((carteraFinalC - carteraInicioC) / carteraInicioC) * 100;
  const tnccAcumC = (balanceNetoC / carteraInicioC) * 100;
  const avgTnccC = avgArr(c.tncc);
  const ratioEficienciaC = totalRetC > 0 ? (totalInstC / totalRetC) : 0;

  // 3. Actualizar Tarjeta 1: TNCC Acumulado
  const elTnccUltra = document.getElementById('dispTnccValueUltra');
  if (elTnccUltra) elTnccUltra.textContent = formatPct(tnccAcumF);
  const elTnccSubUltra = document.getElementById('dispTnccSubUltra');
  if (elTnccSubUltra) elTnccSubUltra.textContent = `Prom: ${formatPct(avgTnccF)}/mes`;

  const elTnccCobre = document.getElementById('dispTnccValueCobre');
  if (elTnccCobre) elTnccCobre.textContent = formatPct(tnccAcumC);
  const elTnccSubCobre = document.getElementById('dispTnccSubCobre');
  if (elTnccSubCobre) elTnccSubCobre.textContent = `Prom: ${formatPct(avgTnccC)}/mes`;

  // 4. Actualizar Tarjeta 2: Eficiencia Comercial (Instalación vs. Retiro)
  const elEficUltra = document.getElementById('dispEficienciaUltra');
  if (elEficUltra) elEficUltra.textContent = ratioEficienciaF.toFixed(2);
  const elEficSubUltra = document.getElementById('dispEficienciaSubUltra');
  if (elEficSubUltra) elEficSubUltra.textContent = `${formatNum(totalInstF)} / ${formatNum(totalRetF)}`;

  const elEficCobre = document.getElementById('dispEficienciaCobre');
  if (elEficCobre) elEficCobre.textContent = ratioEficienciaC.toFixed(2);
  const elEficSubCobre = document.getElementById('dispEficienciaSubCobre');
  if (elEficSubCobre) elEficSubCobre.textContent = `${formatNum(totalInstC)} / ${formatNum(totalRetC)}`;

  const instPor100F = Math.round(ratioEficienciaF * 100);
  const instPor100C = Math.round(ratioEficienciaC * 100);
  const factorRatio = (ratioEficienciaC > 0) ? Math.round(ratioEficienciaF / ratioEficienciaC) : 50;
  const elEficDesc = document.getElementById('dispEficienciaDesc');
  if (elEficDesc) {
    elEficDesc.innerHTML = `Aba Ultra registra <strong>${instPor100F} instalaciones por cada 100 retiros</strong>, lo que refleja un déficit de reemplazo. En cambio, Aba Cobre solo instala <strong>${instPor100C} clientes por cada 100 retiros</strong>, evidenciando una desconexión ${factorRatio} veces superior.`;
  }

  // 5. Actualizar Tarjeta 3: Cartera de Suscriptores
  const elCarteraUltra = document.getElementById('dispCarteraUltra');
  if (elCarteraUltra) elCarteraUltra.textContent = formatNum(carteraFinalF);
  const elCarteraSubUltra = document.getElementById('dispCarteraSubUltra');
  if (elCarteraSubUltra) elCarteraSubUltra.textContent = `Inicio: ${formatNum(carteraInicioF)} (${varCarteraF >= 0 ? '+' : ''}${formatNum(varCarteraF)})`;

  const elCarteraCobre = document.getElementById('dispCarteraCobre');
  if (elCarteraCobre) elCarteraCobre.textContent = formatNum(carteraFinalC);
  const varK = Math.round(varCarteraC / 1000);
  const elCarteraSubCobre = document.getElementById('dispCarteraSubCobre');
  if (elCarteraSubCobre) elCarteraSubCobre.textContent = `Inicio: ${formatNum(carteraInicioC)} (${varK}k)`;

  const elCarteraDesc = document.getElementById('dispCarteraDesc');
  if (elCarteraDesc) {
    elCarteraDesc.innerHTML = `Cobre reduce su cartera en <strong>${formatPct(pctVarCarteraC)}</strong> (${formatNum(varCarteraC)} cuentas). La fibra óptica no logra absorber ese volumen, cerrando Septiembre por debajo de su punto de partida en enero.`;
  }

  // 6. Actualizar Tarjeta 4: Balance de Flujos Netos
  const elBalUltra = document.getElementById('dispBalanceNetoUltra');
  if (elBalUltra) elBalUltra.textContent = (balanceNetoF >= 0 ? '+' : '') + formatNum(balanceNetoF);
  const elBalSubUltra = document.getElementById('dispBalanceSubUltra');
  if (elBalSubUltra) elBalSubUltra.textContent = `+${formatNum(totalInstF)} inst / -${formatNum(totalRetF)} ret`;

  const elBalCobre = document.getElementById('dispBalanceNetoCobre');
  if (elBalCobre) elBalCobre.textContent = formatNum(balanceNetoC);
  const elBalSubCobre = document.getElementById('dispBalanceSubCobre');
  if (elBalSubCobre) elBalSubCobre.textContent = `+${formatNum(totalInstC)} inst / -${formatNum(totalRetC)} ret`;

  const mercadoPerdido = Math.abs(balanceNetoC) - balanceNetoF;
  const elBalDesc = document.getElementById('dispBalanceDesc');
  if (elBalDesc) {
    elBalDesc.innerHTML = `Frente a los <strong>${formatNum(totalRetC)} retiros en cobre</strong>, la fibra sólo sumó ${formatNum(totalInstF)} instalaciones. Más de <strong>${formatNum(mercadoPerdido)} clientes salieron</strong> del ecosistema de la empresa sin migrar.`;
  }

  // 7. Actualizar Insignias de la Leyenda Normativa
  const elBadgeUltra = document.getElementById('legendBadgeUltra');
  if (elBadgeUltra) elBadgeUltra.textContent = `TNCC Global: ${formatPct(tnccAcumF)}`;
  const elBadgeCobre = document.getElementById('legendBadgeCobre');
  if (elBadgeCobre) elBadgeCobre.textContent = `TNCC Acum: ${formatPct(tnccAcumC)}`;

  // 8. Resumen Ejecutivo Autogenerado en Tiempo Real
  const periodoTxt = document.getElementById('dispPeriodo') ? document.getElementById('dispPeriodo').textContent.trim() : 'el período evaluado';

  const elNarrativeUltra = document.getElementById('narrativeUltraText');
  if (elNarrativeUltra) {
    elNarrativeUltra.innerHTML = `Para el período evaluado (${periodoTxt}), la cartera de <strong>Aba Ultra</strong> registró un total de <strong>${formatNum(totalInstF)} clientes adquiridos (instalaciones)</strong> frente a <strong>${formatNum(totalRetF)} clientes perdidos (retiros)</strong>, arrojando una variación neta de <strong>${formatNum(balanceNetoF)} cuentas</strong>. Esto sitúa la Tasa Neta de Crecimiento de Cartera en <strong>${formatPct(tnccAcumF)} acumulado</strong> (promedio de ${formatPct(avgTnccF)} mensual), clasificando formalmente en la Matriz Normativa en estado <strong>"Muy lento o estancado"</strong>.<br><br>
    A pesar de picos positivos en el ciclo, los niveles de retiros impidieron sostener la expansión neta, cerrando el ciclo en ${formatNum(carteraFinalF)} suscriptores (frente a los ${formatNum(carteraInicioF)} iniciales). La ratio de reemplazo es de <strong>${ratioEficienciaF.toFixed(2)}</strong>, exigiendo blindaje de cartera FTTH y retención proactiva.`;
  }

  const elNarrativeCobre = document.getElementById('narrativeCobreText');
  if (elNarrativeCobre) {
    const avgInstC = Math.round(totalInstC / (c.instalaciones.length || 1));
    const avgRetC = Math.round(totalRetC / (c.retiros.length || 1));
    elNarrativeCobre.innerHTML = `En cuanto a la tecnología <strong>Aba Cobre</strong>, se contabilizaron <strong>${formatNum(totalInstC)} instalaciones</strong> y <strong>${formatNum(totalRetC)} retiros</strong>, totalizando una contracción de cartera de <strong>${formatPct(pctVarCarteraC)}</strong> (${formatNum(varCarteraC)} líneas netas) y un TNCC acumulado de <strong>${formatPct(tnccAcumC)}</strong> (promedio mensual de ${formatPct(avgTnccC)}), ubicándose con consistencia en el cuadrante <strong>"Muy lento o estancado"</strong>.<br><br>
    Este comportamiento responde a la <strong>política corporativa deliberada de vaciado y apagado de centrales de cobre obsoletas</strong> (promedio de ${formatNum(avgInstC)} instalaciones/mes frente a ${formatNum(avgRetC)} retiros/mes). El desafío crítico reside en canalizar este flujo saliente hacia la fibra propia antes de que abandonen la empresa.`;
  }

  // Re-render del gráfico
  buildTrendChart();
  if (window.lucide) lucide.createIcons();
}

/**
 * GESTIÓN DEL MODAL Y EDITOR DE MÉTRICAS
 */
function openMetricsEditor() {
  const modal = document.getElementById('metricsEditorModal');
  if (!modal) return;

  // Cargar metadatos actuales en los campos
  const tituloEl = document.getElementById('dispTituloReporte');
  if (tituloEl) document.getElementById('inputEditTitulo').value = tituloEl.textContent.trim();

  const contextEl = document.getElementById('dispHeaderContext');
  if (contextEl) document.getElementById('inputEditContexto').value = contextEl.textContent.trim();

  const periodoEl = document.getElementById('dispPeriodo');
  if (periodoEl) document.getElementById('inputEditPeriodo').value = periodoEl.textContent.trim();

  const anioBtn = document.getElementById('dispAnioBtn');
  if (anioBtn) document.getElementById('inputEditAnio').value = anioBtn.textContent.trim();

  const cicloLabel = document.getElementById('dispCicloLabel');
  if (cicloLabel) document.getElementById('inputEditCiclo').value = cicloLabel.textContent.trim();

  const yearSec = document.getElementById('yearFilterSection');
  if (yearSec) document.getElementById('checkMostrarAnio').checked = (yearSec.style.display !== 'none');

  const marcaEl = document.getElementById('dispFooterMarca');
  if (marcaEl) document.getElementById('inputEditMarca').value = marcaEl.textContent.trim();

  const subEl = document.getElementById('dispFooterSubtitulo');
  if (subEl) document.getElementById('inputEditSubtitulo').value = subEl.textContent.trim();

  const elabEl = document.getElementById('dispFooterElaborado');
  if (elabEl) document.getElementById('inputEditElaborado').value = elabEl.textContent.trim();

  const fuenteEl = document.getElementById('dispFooterFuente');
  if (fuenteEl) document.getElementById('inputEditFuente').value = fuenteEl.textContent.trim();

  const fechaEl = document.getElementById('dispFooterFecha');
  if (fechaEl) document.getElementById('inputEditFecha').value = fechaEl.textContent.trim();

  loadCurrentDataToEditor();
  modal.classList.add('open');
  if (window.lucide) lucide.createIcons();
}

function closeMetricsEditor() {
  const modal = document.getElementById('metricsEditorModal');
  if (modal) modal.classList.remove('open');
}

function switchEditorTab(tabKey) {
  ['data', 'titles', 'footer'].forEach(k => {
    const pane = document.getElementById(`paneTab-${k}`);
    const btn = document.getElementById(`tabBtn${k.charAt(0).toUpperCase() + k.slice(1)}`);
    if (pane) pane.classList.toggle('active', k === tabKey);
    if (btn) btn.classList.toggle('active', k === tabKey);
  });
  if (window.lucide) lucide.createIcons();
}

/**
 * Formatea los datos de telecomData a formato tabular TSV
 */
function loadCurrentDataToEditor() {
  const f = telecomData.fibra;
  const c = telecomData.cobre;
  let text = "Mes\tCartera_Fibra\tInst_Fibra\tRet_Fibra\tTNCC_Fibra%\tCartera_Cobre\tInst_Cobre\tRet_Cobre\tTNCC_Cobre%\n";

  f.months.forEach((m, i) => {
    text += `${m}\t${f.carteraInicio[i]}\t${f.instalaciones[i]}\t${f.retiros[i]}\t${f.tncc[i]}\t${c.carteraInicio[i]}\t${c.instalaciones[i]}\t${c.retiros[i]}\t${c.tncc[i]}\n`;
  });

  const textarea = document.getElementById('editorDataText');
  if (textarea) textarea.value = text;
  setEditorStatus(`Datos actuales cargados (${f.months.length} meses).`, false);
}

function loadSampleCsvData() {
  const sample = `Mes,Cartera_Fibra,Inst_Fibra,Ret_Fibra,TNCC_Fibra%,Cartera_Cobre,Inst_Cobre,Ret_Cobre,TNCC_Cobre%
Ene,175609,3926,694,1.84,1517643,1195,36980,-2.36
Feb,178841,4333,861,1.94,1481858,1112,95916,-6.40
Mar,182313,3028,2546,0.26,1387054,1114,46013,-3.24
Abr,182795,884,417,0.26,1342155,910,39139,-2.85
May,183262,5346,614,2.58,1303926,869,41321,-3.10
Jun,187994,6056,465,2.97,1263474,803,50992,-3.97
Jul,193585,2406,22371,-10.31,1213285,623,40848,-3.32
Ago,173620,5288,4079,0.70,1173060,650,21021,-1.74
Sept,174829,4157,4413,-0.15,1152689,656,22080,-1.86`;
  const textarea = document.getElementById('editorDataText');
  if (textarea) textarea.value = sample;
  setEditorStatus("Plantilla de ejemplo cargada.", false);
}

function setEditorStatus(msg, isError = false) {
  const el = document.getElementById('editorStatusText');
  if (el) {
    el.textContent = msg;
    el.style.color = isError ? '#fb7185' : '#00D2FF';
  }
}

/**
 * CONFIGURACIÓN DE EVENTOS DE ARRASTRE, SOLTADO Y PORTAPAPELES (DRAG & DROP / PASTE)
 */
function setupEditorEvents() {
  const dropzone = document.getElementById('editorDropzone');
  if (dropzone) {
    ['dragenter', 'dragover'].forEach(name => {
      dropzone.addEventListener(name, e => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(name => {
      dropzone.addEventListener(name, e => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('dragover');
      });
    });

    dropzone.addEventListener('drop', e => {
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        processUploadedFile(files[0]);
      }
    });
  }

  // Pegado directo con Ctrl + V
  window.addEventListener('paste', e => {
    const modal = document.getElementById('metricsEditorModal');
    if (!modal || !modal.classList.contains('open')) return;

    // Si hay un archivo o imagen en el clipboard
    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    for (let index in items) {
      const item = items[index];
      if (item.kind === 'file') {
        const blob = item.getAsFile();
        if (blob) {
          processUploadedFile(blob);
          return;
        }
      }
    }

    // Si es texto tabular y el foco no está en un input
    if (document.activeElement.tagName !== 'TEXTAREA' && document.activeElement.tagName !== 'INPUT') {
      const text = e.clipboardData.getData('text');
      if (text && text.trim().length > 10) {
        const textarea = document.getElementById('editorDataText');
        if (textarea) {
          textarea.value = text;
          setEditorStatus("Texto de tabla pegado exitosamente del portapapeles.", false);
        }
      }
    }
  });
}

function handleFileInputChange(event) {
  const file = event.target.files[0];
  if (file) {
    processUploadedFile(file);
  }
}

function processUploadedFile(file) {
  const fileName = file.name ? file.name.toLowerCase() : '';
  const fileType = file.type || '';

  // 1. Imagen (PNG, JPG, JPEG)
  if (fileType.startsWith('image/') || fileName.endsWith('.png') || fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) {
    const reader = new FileReader();
    reader.onload = e => {
      currentLogoBase64 = e.target.result;
      const previewBox = document.getElementById('editorImagePreviewBox');
      const previewThumb = document.getElementById('editorImagePreviewThumb');
      if (previewBox && previewThumb) {
        previewThumb.src = currentLogoBase64;
        previewBox.style.display = 'flex';
      }
      setEditorStatus(`Imagen cargada (${file.name || 'desde portapapeles'}). Haz clic en "Usar como Logo iPulso" si deseas aplicarla.`, false);
    };
    reader.readAsDataURL(file);
    return;
  }

  // 2. Archivo Excel (.xlsx / .xls)
  if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileType.includes('spreadsheet') || fileType.includes('excel')) {
    if (typeof XLSX === 'undefined') {
      setEditorStatus("Librería SheetJS cargando... Reintenta en un momento.", true);
      return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const csvText = XLSX.utils.sheet_to_csv(worksheet);
        const textarea = document.getElementById('editorDataText');
        if (textarea) textarea.value = csvText;
        setEditorStatus(`Archivo Excel "${file.name}" leído exitosamente.`, false);
      } catch (err) {
        setEditorStatus("Error al leer archivo Excel: " + err.message, true);
      }
    };
    reader.readAsArrayBuffer(file);
    return;
  }

  // 3. Archivo de Texto / CSV (.txt / .csv)
  const reader = new FileReader();
  reader.onload = e => {
    const text = e.target.result;
    const textarea = document.getElementById('editorDataText');
    if (textarea) textarea.value = text;
    setEditorStatus(`Archivo de texto "${file.name}" cargado exitosamente.`, false);
  };
  reader.readAsText(file);
}

function setUploadedImageAsLogo() {
  if (!currentLogoBase64) return;
  const logoImg = document.getElementById('headerLogoImg');
  if (logoImg) {
    logoImg.src = currentLogoBase64;
    setEditorStatus("¡Logotipo de cabecera iPulso actualizado!", false);
  }
}

/**
 * Parseador inteligente de tabla en texto (CSV, TSV, valores separados por espacio o coma)
 */
function parseTextDataToTelecomData(rawText) {
  if (!rawText || !rawText.trim()) return null;

  const lines = rawText.trim().split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) return null;

  // Detectar separador común
  const headerLine = lines[0];
  let sep = '\t';
  if (headerLine.includes('\t')) sep = '\t';
  else if (headerLine.includes(';')) sep = ';';
  else if (headerLine.includes(',')) sep = ',';

  // Si la primera línea tiene encabezados, comenzamos desde la línea 1
  let startIndex = 0;
  if (/mes|month|cartera|fibra|cobre/i.test(lines[0])) {
    startIndex = 1;
  }

  const parsedMonths = [];
  const parsedCarteraF = [];
  const parsedInstF = [];
  const parsedRetF = [];
  const parsedTnccF = [];
  const parsedCarteraC = [];
  const parsedInstC = [];
  const parsedRetC = [];
  const parsedTnccC = [];

  for (let i = startIndex; i < lines.length; i++) {
    const row = lines[i].split(sep).map(col => col.trim().replace(/^["']|["']$/g, ''));
    if (row.length < 4) continue;

    const mes = row[0] || `M${i}`;
    const cleanNum = v => Number(String(v || '0').replace(/\./g, '').replace(',', '.'));

    const cF = cleanNum(row[1]);
    const iF = cleanNum(row[2]);
    const rF = cleanNum(row[3]);
    let tF = cleanNum(row[4]);
    if (isNaN(tF) || row.length <= 4) {
      tF = cF > 0 ? Number((((iF - rF) / cF) * 100).toFixed(2)) : 0;
    }

    const cC = cleanNum(row[5] || row[1]);
    const iC = cleanNum(row[6] || row[2]);
    const rC = cleanNum(row[7] || row[3]);
    let tC = cleanNum(row[8]);
    if (isNaN(tC) || row.length <= 8) {
      tC = cC > 0 ? Number((((iC - rC) / cC) * 100).toFixed(2)) : 0;
    }

    parsedMonths.push(mes);
    parsedCarteraF.push(cF);
    parsedInstF.push(iF);
    parsedRetF.push(rF);
    parsedTnccF.push(tF);

    parsedCarteraC.push(cC);
    parsedInstC.push(iC);
    parsedRetC.push(rC);
    parsedTnccC.push(tC);
  }

  if (parsedMonths.length === 0) return null;

  return {
    months: parsedMonths,
    fibra: {
      carteraInicio: parsedCarteraF,
      instalaciones: parsedInstF,
      retiros: parsedRetF,
      tncc: parsedTnccF
    },
    cobre: {
      carteraInicio: parsedCarteraC,
      instalaciones: parsedInstC,
      retiros: parsedRetC,
      tncc: parsedTnccC
    }
  };
}

/**
 * APLICAR TODOS LOS CAMBIOS DESDE EL MODAL AL REPORTE EN TIEMPO REAL
 */
function applyMetricsEditorChanges() {
  // 1. Parsear datos tabulares si el usuario los editó
  const textarea = document.getElementById('editorDataText');
  if (textarea && textarea.value.trim().length > 0) {
    const parsed = parseTextDataToTelecomData(textarea.value);
    if (parsed) {
      telecomData.fibra.months = parsed.months;
      telecomData.cobre.months = parsed.months;

      telecomData.fibra.carteraInicio = parsed.fibra.carteraInicio;
      telecomData.fibra.instalaciones = parsed.fibra.instalaciones;
      telecomData.fibra.retiros = parsed.fibra.retiros;
      telecomData.fibra.tncc = parsed.fibra.tncc;

      telecomData.cobre.carteraInicio = parsed.cobre.carteraInicio;
      telecomData.cobre.instalaciones = parsed.cobre.instalaciones;
      telecomData.cobre.retiros = parsed.cobre.retiros;
      telecomData.cobre.tncc = parsed.cobre.tncc;
    }
  }

  // 2. Metadatos de Cabecera y Títulos
  const inputTitulo = document.getElementById('inputEditTitulo');
  if (inputTitulo && inputTitulo.value.trim()) {
    const t = inputTitulo.value.trim();
    document.title = t;
    const dispTit = document.getElementById('dispTituloReporte');
    if (dispTit) dispTit.textContent = t;
  }

  const inputContexto = document.getElementById('inputEditContexto');
  if (inputContexto) {
    const dispCtx = document.getElementById('dispHeaderContext');
    const periodoVal = document.getElementById('inputEditPeriodo') ? document.getElementById('inputEditPeriodo').value.trim() : 'el período evaluado';
    if (dispCtx) {
      dispCtx.innerHTML = `${inputContexto.value.trim()} <strong id="dispPeriodo">${periodoVal}</strong>.`;
    }
  }

  const inputPeriodo = document.getElementById('inputEditPeriodo');
  if (inputPeriodo) {
    const dispPer = document.getElementById('dispPeriodo');
    if (dispPer) dispPer.textContent = inputPeriodo.value.trim();
  }

  // 3. Año Fiscal y Ciclo
  const checkMostrarAnio = document.getElementById('checkMostrarAnio');
  const yearSec = document.getElementById('yearFilterSection');
  if (yearSec && checkMostrarAnio) {
    yearSec.style.display = checkMostrarAnio.checked ? 'flex' : 'none';
  }

  const inputAnio = document.getElementById('inputEditAnio');
  if (inputAnio) {
    const dispAnio = document.getElementById('dispAnioBtn');
    if (dispAnio) dispAnio.textContent = inputAnio.value.trim();
  }

  const inputCiclo = document.getElementById('inputEditCiclo');
  if (inputCiclo) {
    const dispCiclo = document.getElementById('dispCicloLabel');
    if (dispCiclo) dispCiclo.textContent = inputCiclo.value.trim();
  }

  // 4. Pie de Página
  const inputMarca = document.getElementById('inputEditMarca');
  if (inputMarca) {
    const el = document.getElementById('dispFooterMarca');
    if (el) el.textContent = inputMarca.value.trim();
  }

  const inputSub = document.getElementById('inputEditSubtitulo');
  if (inputSub) {
    const el = document.getElementById('dispFooterSubtitulo');
    if (el) el.textContent = inputSub.value.trim();
  }

  const inputElab = document.getElementById('inputEditElaborado');
  if (inputElab) {
    const el = document.getElementById('dispFooterElaborado');
    if (el) el.textContent = inputElab.value.trim();
  }

  const inputFuente = document.getElementById('inputEditFuente');
  if (inputFuente) {
    const el = document.getElementById('dispFooterFuente');
    if (el) el.textContent = inputFuente.value.trim();
  }

  const inputFecha = document.getElementById('inputEditFecha');
  if (inputFecha) {
    const el = document.getElementById('dispFooterFecha');
    if (el) el.textContent = inputFecha.value.trim();
  }

  // 5. Recalcular todo el dashboard y cerrar modal
  recalculateAndRenderDashboard();
  closeMetricsEditor();
}

/**
 * DESCARGA DE REPORTE HTML INDEPENDIENTE (SIN EL PANEL EXTERNO NI MODALES)
 * Genera un archivo HTML 100% portable y autónomo con estilos CSS, scripts e imágenes embebidos en línea.
 * Cero dependencias de archivos externos o servidores locales: abre en cualquier navegador de forma idéntica.
 */
function downloadStandaloneReport() {
  const clone = document.documentElement.cloneNode(true);

  // 1. Elimina el panel de control externo del estudio
  const studioPanel = clone.querySelector('#externalStudioPanel');
  if (studioPanel) studioPanel.remove();

  // 2. Elimina el modal de edición
  const modal = clone.querySelector('#metricsEditorModal');
  if (modal) modal.remove();

  // 3. Elimina la etiqueta de script de embedded-assets para no duplicar
  const assetsScript = clone.querySelector('script[src*="embedded-assets.js"]');
  if (assetsScript) assetsScript.remove();

  // 4. Inyecta el CSS completo en una etiqueta <style> dentro de <head>
  const linkCss = clone.querySelector('link[href*="styles.css"]');
  const styleTag = clone.ownerDocument.createElement('style');
  const cssContent = (typeof EMBEDDED_STYLESHEET !== 'undefined') ? EMBEDDED_STYLESHEET : '';
  styleTag.textContent = cssContent;
  if (linkCss) {
    linkCss.parentNode.replaceChild(styleTag, linkCss);
  } else {
    clone.querySelector('head').appendChild(styleTag);
  }

  // 5. Garantiza que el logo esté incrustado directamente como Data URL en Base64
  const logoImg = clone.querySelector('#headerLogoImg');
  if (logoImg) {
    const logoSrc = (typeof EMBEDDED_LOGO_DATA_URL !== 'undefined') ? EMBEDDED_LOGO_DATA_URL : currentLogoBase64;
    if (logoSrc) {
      logoImg.src = logoSrc;
      logoImg.removeAttribute('onerror');
    }
  }

  // 6. Serializa el estado actual de datos y series
  const dataBlock = JSON.stringify(telecomData, null, 2);
  const seriesBlock = JSON.stringify(visibleSeries, null, 2);
  const viewBlock = JSON.stringify(currentView);
  const benchBlock = JSON.stringify(currentBenchmark);

  // 7. Genera el script de interactividad para el reporte standalone
  const standaloneScriptContent = `
// Standalone Telecom Data & State
const telecomData = ${dataBlock};
let currentView = ${viewBlock};
let currentBenchmark = ${benchBlock};
let trendChartInstance = null;
const visibleSeries = ${seriesBlock};

const formatNum = n => new Intl.NumberFormat('de-DE').format(Math.round(n));
const formatPct = n => (n >= 0 ? '+' : '') + n.toFixed(2).replace('.', ',') + '%';
const sumArr = arr => arr.reduce((a, b) => a + b, 0);
const avgArr = arr => arr.reduce((a, b) => a + b, 0) / (arr.length || 1);

function initStandaloneReport() {
  if (window.lucide) {
    lucide.createIcons();
  }
  buildTrendChart();
}

function buildTrendChart() {
  const canvasEl = document.getElementById('trendChartCanvas');
  if (!canvasEl) return;
  const ctx = canvasEl.getContext('2d');
  if (trendChartInstance) trendChartInstance.destroy();

  const f = telecomData.fibra;
  const c = telecomData.cobre;
  const months = f.months;

  const datasets = [];

  // 1. TNCC Fibra (%)
  if (visibleSeries.tnccUltra) {
    datasets.push({
      type: 'line',
      label: 'TNCC Aba Ultra (%)',
      data: f.tncc,
      borderColor: '#00D2FF',
      backgroundColor: 'rgba(0, 210, 255, 0.12)',
      fill: true,
      tension: 0.25,
      borderWidth: 3,
      pointBackgroundColor: '#00D2FF',
      pointBorderColor: '#fff',
      pointBorderWidth: 1.5,
      pointRadius: 5,
      pointHoverRadius: 7,
      yAxisID: 'yTncc',
      order: 1
    });
  }

  // 2. TNCC Cobre (%)
  if (visibleSeries.tnccCobre) {
    datasets.push({
      type: 'line',
      label: 'TNCC Aba Cobre (%)',
      data: c.tncc,
      borderColor: '#FF8C42',
      backgroundColor: 'rgba(255, 140, 66, 0.08)',
      fill: true,
      tension: 0.25,
      borderWidth: 3,
      pointBackgroundColor: '#FF8C42',
      pointBorderColor: '#fff',
      pointBorderWidth: 1.5,
      pointRadius: 5,
      pointHoverRadius: 7,
      yAxisID: 'yTncc',
      order: 2
    });
  }

  // 3. Balance Neto Fibra
  if (visibleSeries.netFibra) {
    const netF = f.instalaciones.map((inst, i) => inst - (f.retiros[i] || 0));
    datasets.push({
      type: 'line',
      label: 'Balance Neto Fibra',
      data: netF,
      borderColor: '#38BDF8',
      backgroundColor: 'rgba(56, 189, 248, 0.15)',
      borderWidth: 2.5,
      tension: 0.2,
      pointRadius: 5,
      pointHoverRadius: 7,
      pointBackgroundColor: '#38BDF8',
      pointBorderColor: '#fff',
      pointBorderWidth: 1.5,
      yAxisID: 'yFlujos',
      order: 3
    });
  }

  // 4. Cartera Fibra
  if (visibleSeries.carteraFibra) {
    datasets.push({
      type: 'line',
      label: 'Cartera Fibra (Líneas)',
      data: f.carteraInicio,
      borderColor: '#C084FC',
      borderWidth: 2.5,
      borderDash: [5, 4],
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBackgroundColor: '#C084FC',
      pointBorderColor: '#fff',
      yAxisID: 'yCarteraFibra',
      order: 4
    });
  }

  // 5. Cartera Cobre
  if (visibleSeries.carteraCobre) {
    datasets.push({
      type: 'line',
      label: 'Cartera Cobre (Líneas)',
      data: c.carteraInicio,
      borderColor: '#FBBF24',
      borderWidth: 2.5,
      borderDash: [6, 4],
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBackgroundColor: '#FBBF24',
      pointBorderColor: '#fff',
      yAxisID: 'yCarteraCobre',
      order: 5
    });
  }

  // 6. Instalaciones Fibra
  if (visibleSeries.instFibra) {
    datasets.push({
      type: 'bar',
      label: 'Instalaciones Fibra',
      data: f.instalaciones,
      backgroundColor: 'rgba(16, 185, 129, 0.75)',
      borderColor: '#10B981',
      borderWidth: 1,
      borderRadius: 4,
      yAxisID: 'yFlujos',
      order: 6
    });
  }

  // 7. Instalaciones Cobre
  if (visibleSeries.instCobre) {
    datasets.push({
      type: 'bar',
      label: 'Instalaciones Cobre',
      data: c.instalaciones,
      backgroundColor: 'rgba(20, 184, 166, 0.7)',
      borderColor: '#14b8a6',
      borderWidth: 1,
      borderRadius: 4,
      yAxisID: 'yFlujos',
      order: 7
    });
  }

  // 8. Retiros Fibra
  if (visibleSeries.retFibra) {
    datasets.push({
      type: 'bar',
      label: 'Retiros Fibra',
      data: f.retiros,
      backgroundColor: 'rgba(244, 63, 94, 0.7)',
      borderColor: '#f43f5e',
      borderWidth: 1,
      borderRadius: 4,
      yAxisID: 'yFlujos',
      order: 8
    });
  }

  // 9. Retiros Cobre
  if (visibleSeries.retCobre) {
    datasets.push({
      type: 'bar',
      label: 'Retiros Cobre',
      data: c.retiros,
      backgroundColor: 'rgba(225, 29, 72, 0.65)',
      borderColor: '#e11d48',
      borderWidth: 1,
      borderRadius: 4,
      yAxisID: 'yFlujos',
      order: 9
    });
  }

  // Guías y Líneas de Benchmark
  if (currentBenchmark === 'thresholds') {
    datasets.push({
      type: 'line',
      label: 'Umbral Excelente (+2.0%)',
      data: Array(months.length).fill(2.0),
      borderColor: 'rgba(16, 185, 129, 0.7)',
      borderWidth: 1.5,
      borderDash: [6, 4],
      pointRadius: 0,
      fill: false,
      yAxisID: 'yTncc',
      order: 10
    });
    datasets.push({
      type: 'line',
      label: 'Umbral Saludable (+0.5%)',
      data: Array(months.length).fill(0.5),
      borderColor: 'rgba(0, 210, 255, 0.7)',
      borderWidth: 1.5,
      borderDash: [6, 4],
      pointRadius: 0,
      fill: false,
      yAxisID: 'yTncc',
      order: 10
    });
    datasets.push({
      type: 'line',
      label: 'Línea Cero (0.0%)',
      data: Array(months.length).fill(0.0),
      borderColor: 'rgba(255, 255, 255, 0.4)',
      borderWidth: 1,
      pointRadius: 0,
      fill: false,
      yAxisID: 'yTncc',
      order: 10
    });
  } else if (currentBenchmark === 'avgUltra') {
    const avgF = Number(avgArr(f.tncc).toFixed(2));
    datasets.push({
      type: 'line',
      label: 'Promedio TNCC Fibra (' + formatPct(avgF) + ')',
      data: Array(months.length).fill(avgF),
      borderColor: '#00D2FF',
      borderWidth: 2,
      borderDash: [6, 4],
      pointRadius: 0,
      yAxisID: 'yTncc',
      order: 10
    });
  } else if (currentBenchmark === 'avgCobre') {
    const avgC = Number(avgArr(c.tncc).toFixed(2));
    datasets.push({
      type: 'line',
      label: 'Promedio TNCC Cobre (' + formatPct(avgC) + ')',
      data: Array(months.length).fill(avgC),
      borderColor: '#FF8C42',
      borderWidth: 2,
      borderDash: [6, 4],
      pointRadius: 0,
      yAxisID: 'yTncc',
      order: 10
    });
  } else if (currentBenchmark === 'zero') {
    datasets.push({
      type: 'line',
      label: 'Línea Cero (0.0%)',
      data: Array(months.length).fill(0.0),
      borderColor: 'rgba(255, 255, 255, 0.5)',
      borderWidth: 1.5,
      pointRadius: 0,
      yAxisID: 'yTncc',
      order: 10
    });
  }

  trendChartInstance = new Chart(ctx, {
    data: {
      labels: months,
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(10, 6, 32, 0.95)',
          borderColor: 'rgba(0, 210, 255, 0.4)',
          borderWidth: 1,
          titleColor: '#fff',
          bodyColor: '#e2e8f0',
          padding: 12,
          titleFont: { size: 13, weight: 'bold', family: 'Outfit' },
          bodyFont: { size: 12, family: 'JetBrains Mono' },
          boxPadding: 4,
          callbacks: {
            label: function(context) {
              let l = context.dataset.label || '';
              if (l) l += ': ';
              if (context.dataset.yAxisID === 'yTncc') {
                l += context.parsed.y.toFixed(2) + '%';
              } else {
                l += formatNum(context.parsed.y);
              }
              return l;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.08)' },
          ticks: { color: '#94a3b8', font: { family: 'Outfit', size: 11 } }
        },
        yTncc: {
          type: 'linear',
          position: 'right',
          display: visibleSeries.tnccUltra || visibleSeries.tnccCobre,
          grid: { color: 'rgba(255, 255, 255, 0.06)' },
          ticks: {
            color: '#00D2FF',
            font: { family: 'JetBrains Mono', size: 11 },
            callback: v => v.toFixed(1) + '%'
          },
          title: {
            display: true,
            text: 'TNCC Porcentual (%)',
            color: '#00D2FF',
            font: { family: 'Outfit', size: 11, weight: 'bold' }
          }
        },
        yFlujos: {
          type: 'linear',
          position: 'left',
          display: visibleSeries.instFibra || visibleSeries.instCobre || visibleSeries.retFibra || visibleSeries.retCobre || visibleSeries.netFibra,
          grid: { drawOnChartArea: false },
          ticks: {
            color: '#cbd5e1',
            font: { family: 'JetBrains Mono', size: 10 },
            callback: v => (v >= 1000 || v <= -1000) ? (v/1000).toFixed(0) + 'k' : v
          },
          title: {
            display: true,
            text: 'Flujos (Instalaciones / Retiros / Balance)',
            color: '#cbd5e1',
            font: { family: 'Outfit', size: 11 }
          }
        },
        yCarteraFibra: {
          type: 'linear',
          position: 'left',
          display: visibleSeries.carteraFibra,
          grid: { drawOnChartArea: false },
          ticks: {
            color: '#C084FC',
            font: { family: 'JetBrains Mono', size: 10 },
            callback: v => (v/1000).toFixed(0) + 'k'
          },
          title: {
            display: true,
            text: 'Cartera Fibra',
            color: '#C084FC',
            font: { family: 'Outfit', size: 10, weight: 'bold' }
          }
        },
        yCarteraCobre: {
          type: 'linear',
          position: 'left',
          display: visibleSeries.carteraCobre,
          grid: { drawOnChartArea: false },
          ticks: {
            color: '#FBBF24',
            font: { family: 'JetBrains Mono', size: 10 },
            callback: v => (v/1000000).toFixed(2) + 'M'
          },
          title: {
            display: true,
            text: 'Cartera Cobre',
            color: '#FBBF24',
            font: { family: 'Outfit', size: 10, weight: 'bold' }
          }
        }
      }
    }
  });
}

function toggleSeries(seriesKey) {
  visibleSeries[seriesKey] = !visibleSeries[seriesKey];
  const btnMap = {
    tnccUltra: 'toggleTnccUltra',
    tnccCobre: 'toggleTnccCobre',
    instFibra: 'toggleInstFibra',
    instCobre: 'toggleInstCobre',
    retFibra: 'toggleRetFibra',
    retCobre: 'toggleRetCobre',
    netFibra: 'toggleNetFibra',
    carteraFibra: 'toggleCarteraFibra',
    carteraCobre: 'toggleCarteraCobre'
  };
  const btn = document.getElementById(btnMap[seriesKey]);
  if (btn) {
    if (visibleSeries[seriesKey]) {
      btn.classList.add('active');
      btn.innerHTML = '<i data-lucide="check" style="width:12px;height:12px;"></i> ' + btn.textContent.trim();
    } else {
      btn.classList.remove('active');
      btn.innerHTML = '<i data-lucide="eye" style="width:12px;height:12px;"></i> ' + btn.textContent.trim();
    }
    if (window.lucide) lucide.createIcons();
  }
  buildTrendChart();
}

function changeBenchmark() {
  currentBenchmark = document.getElementById('selectBenchmark').value;
  buildTrendChart();
}

function switchView(view) {
  currentView = view;
  ['btnViewCombinado', 'btnViewUltra', 'btnViewCobre'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
  });

  if (view === 'combinado') {
    document.getElementById('btnViewCombinado').classList.add('active');
    visibleSeries.tnccUltra = true;
    visibleSeries.tnccCobre = true;
    visibleSeries.instFibra = false;
    visibleSeries.instCobre = false;
    visibleSeries.retFibra = false;
    visibleSeries.retCobre = false;
    visibleSeries.netFibra = false;
    visibleSeries.carteraFibra = false;
    visibleSeries.carteraCobre = false;
  } else if (view === 'fibra') {
    document.getElementById('btnViewUltra').classList.add('active');
    visibleSeries.tnccUltra = true;
    visibleSeries.tnccCobre = false;
    visibleSeries.instFibra = true;
    visibleSeries.instCobre = false;
    visibleSeries.retFibra = true;
    visibleSeries.retCobre = false;
    visibleSeries.netFibra = false;
    visibleSeries.carteraFibra = true;
    visibleSeries.carteraCobre = false;
  } else if (view === 'cobre') {
    document.getElementById('btnViewCobre').classList.add('active');
    visibleSeries.tnccUltra = false;
    visibleSeries.tnccCobre = true;
    visibleSeries.instFibra = false;
    visibleSeries.instCobre = true;
    visibleSeries.retFibra = false;
    visibleSeries.retCobre = true;
    visibleSeries.netFibra = false;
    visibleSeries.carteraFibra = false;
    visibleSeries.carteraCobre = true;
  }

  const syncBtn = (id, key, label) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle('active', visibleSeries[key]);
    const icon = visibleSeries[key] ? 'check' : 'eye';
    el.innerHTML = '<i data-lucide="' + icon + '" style="width:12px;height:12px;"></i> ' + label;
  };

  syncBtn('toggleTnccUltra', 'tnccUltra', 'TNCC Fibra %');
  syncBtn('toggleTnccCobre', 'tnccCobre', 'TNCC Cobre %');
  syncBtn('toggleInstFibra', 'instFibra', 'Instalaciones Fibra');
  syncBtn('toggleInstCobre', 'instCobre', 'Instalaciones Cobre');
  syncBtn('toggleRetFibra', 'retFibra', 'Retiros Fibra');
  syncBtn('toggleRetCobre', 'retCobre', 'Retiros Cobre');
  syncBtn('toggleNetFibra', 'netFibra', 'Balance Neto Fibra');
  syncBtn('toggleCarteraFibra', 'carteraFibra', 'Cartera Fibra');
  syncBtn('toggleCarteraCobre', 'carteraCobre', 'Cartera Cobre');

  if (window.lucide) lucide.createIcons();
  buildTrendChart();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initStandaloneReport);
} else {
  initStandaloneReport();
}
`;

  // 8. Remueve la etiqueta anterior de app.js e inyecta el script standalone al final del <body>
  const scriptApp = clone.querySelector('script[src*="app.js"]');
  if (scriptApp) scriptApp.remove();

  const inlineScriptEl = clone.ownerDocument.createElement('script');
  inlineScriptEl.textContent = standaloneScriptContent;
  clone.querySelector('body').appendChild(inlineScriptEl);

  // 9. Genera el Blob y descarga inmediata sin latencia ni dependencias de red
  const htmlOutput = '<!DOCTYPE html>\n' + clone.outerHTML;
  const blob = new Blob([htmlOutput], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'TNCC_Reporte_Combinado_Cobre_Fibra.html';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Inicializar al cargar el documento
window.addEventListener('DOMContentLoaded', initDashboard);
