export function initCharts() {
  if (typeof Chart === 'undefined') return;

  Chart.defaults.animation = false;
  Chart.defaults.interaction = { mode: 'nearest', intersect: false };
  Chart.defaults.plugins.tooltip.enabled = true;
  Chart.defaults.plugins.legend.labels.color = '#64748B';

  const configs = {
    lineChart: {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
        datasets: [{ label: 'Donations', data: [48, 62, 78, 62, 88, 104, 118], borderColor: '#2563EB', backgroundColor: 'rgba(37, 99, 235, 0.18)', fill: true, tension: 0.45, pointRadius: 0, borderWidth: 3 }],
      },
      options: chartLineOptions(),
    },
    pieChart: {
      type: 'doughnut',
      data: {
        labels: ['Recurring', 'One-time', 'Corporate', 'Events'],
        datasets: [{ data: [42, 28, 18, 12], backgroundColor: ['#2563EB', '#10B981', '#8B5CF6', '#F59E0B'], borderWidth: 0 }],
      },
      options: chartDoughnutOptions(),
    },
    campaignLineChart: {
      type: 'line',
      data: {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        datasets: [{ label: 'Raised', data: [18, 34, 56, 72], borderColor: '#2563EB', backgroundColor: 'rgba(37, 99, 235, 0.18)', fill: true, tension: 0.4, pointRadius: 2 }],
      },
      options: chartLineOptions(),
    },
    donationsLineChart: {
      type: 'line',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{ label: 'Revenue', data: [34, 46, 52, 63, 58, 71, 88], borderColor: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.18)', fill: true, tension: 0.4, pointRadius: 3 }],
      },
      options: chartLineOptions(),
    },
    paymentMethodsChart: {
      type: 'doughnut',
      data: {
        labels: ['Card', 'PayPal', 'Bank', 'Cash'],
        datasets: [{ data: [62, 18, 12, 8], backgroundColor: ['#2563EB', '#8B5CF6', '#10B981', '#F59E0B'], borderWidth: 0 }],
      },
      options: chartDoughnutOptions(),
    },
    reportsLineChart: {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{ label: 'Donations', data: [82, 96, 108, 118, 132, 148], borderColor: '#8B5CF6', backgroundColor: 'rgba(139, 92, 246, 0.18)', fill: true, tension: 0.35, pointRadius: 0 }],
      },
      options: chartLineOptions(),
    },
    donorPieChart: {
      type: 'doughnut',
      data: {
        labels: ['Individual', 'Corporate', 'Foundation'],
        datasets: [{ data: [58, 28, 14], backgroundColor: ['#2563EB', '#10B981', '#8B5CF6'], borderWidth: 0 }],
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
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#64748B' } },
      y: { grid: { color: 'rgba(148, 163, 184, 0.18)' }, ticks: { color: '#64748B' } },
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
      line.data.datasets[0].data = labels.map((l) => byMonth[l] / 1000);
      line.update();
    }
  }
}
