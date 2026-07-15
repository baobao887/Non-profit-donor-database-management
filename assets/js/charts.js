import { formatCurrency } from './utils.js';

export function initCharts() {
  if (typeof Chart === 'undefined') return;

  Chart.defaults.animation = false;
  Chart.defaults.interaction = { mode: 'nearest', intersect: false };
  Chart.defaults.plugins.tooltip.enabled = true;
  Chart.defaults.plugins.legend.labels.color = '#64748B';

  // Every chart starts empty — each page script fetches live data from its
  // API endpoint immediately after initCharts() and fills these in via
  // Chart.getChart(id).update(). No demo/placeholder numbers are shown.
  const configs = {
    lineChart: {
      type: 'line',
      data: {
        labels: [],
        datasets: [{ label: 'Donations', data: [], borderColor: '#2563EB', backgroundColor: 'rgba(37, 99, 235, 0.18)', fill: true, tension: 0.45, pointRadius: 0, borderWidth: 3 }],
      },
      options: chartLineOptions(),
    },
    pieChart: {
      type: 'doughnut',
      data: {
        labels: [],
        datasets: [{ data: [], backgroundColor: ['#2563EB', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899'], borderWidth: 0 }],
      },
      options: chartDoughnutOptions(),
    },
    campaignLineChart: {
      type: 'line',
      data: {
        labels: [],
        datasets: [{ label: 'Raised', data: [], borderColor: '#2563EB', backgroundColor: 'rgba(37, 99, 235, 0.18)', fill: true, tension: 0.4, pointRadius: 2 }],
      },
      options: chartLineOptions(),
    },
    donationsLineChart: {
      type: 'line',
      data: {
        labels: [],
        datasets: [{ label: 'Revenue', data: [], borderColor: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.18)', fill: true, tension: 0.4, pointRadius: 3 }],
      },
      options: chartLineOptions(),
    },
    paymentMethodsChart: {
      type: 'doughnut',
      data: {
        labels: [],
        datasets: [{ data: [], backgroundColor: ['#2563EB', '#8B5CF6', '#10B981', '#F59E0B'], borderWidth: 0 }],
      },
      options: chartDoughnutOptions(),
    },
    reportsLineChart: {
      type: 'line',
      data: {
        labels: [],
        datasets: [{ label: 'Donations', data: [], borderColor: '#8B5CF6', backgroundColor: 'rgba(139, 92, 246, 0.18)', fill: true, tension: 0.35, pointRadius: 0 }],
      },
      options: chartLineOptions(),
    },
    donorPieChart: {
      type: 'doughnut',
      data: {
        labels: [],
        datasets: [{ data: [], backgroundColor: ['#2563EB', '#10B981', '#8B5CF6', '#F59E0B'], borderWidth: 0 }],
      },
      options: chartDoughnutOptions(),
    },
  };

  Object.entries(configs).forEach(([id, config]) => {
    const ctx = document.getElementById(id);
    if (ctx) new Chart(ctx, config);
  });
}

function chartLineOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (context) => formatCurrency(context.parsed.y) } },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#64748B' } },
      y: {
        grid: { color: 'rgba(148, 163, 184, 0.18)' },
        ticks: { color: '#64748B', callback: (value) => formatCurrency(value) },
      },
    },
  };
}

function chartDoughnutOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: { legend: { position: 'bottom', labels: { color: '#64748B' } } },
  };
}

export function updateDashboardCharts(donations) {
  if (typeof Chart === 'undefined') return;
  const line = Chart.getChart('lineChart');
  if (line && donations.length) {
    const byMonth = {};
    donations.forEach((d) => {
      if (d.status === 'Refund') return;
      const m = new Date(d.date + 'T12:00:00').toLocaleString('en-US', { month: 'short' });
      byMonth[m] = (byMonth[m] || 0) + d.amount;
    });
    const labels = Object.keys(byMonth);
    if (labels.length) {
      line.data.labels = labels;
      line.data.datasets[0].data = labels.map((l) => byMonth[l]);
      line.update();
    }
  }
}
