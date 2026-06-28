document.addEventListener('DOMContentLoaded', function () {
  const themeToggle = document.getElementById('themeToggle');
  themeToggle?.addEventListener('click', () => {
    document.body.classList.toggle('theme-dark');
    themeToggle.querySelector('i')?.classList.toggle('fa-moon');
    themeToggle.querySelector('i')?.classList.toggle('fa-sun');
  });

  function createChart(selector, config) {
    const ctx = document.getElementById(selector);
    if (ctx) {
      new Chart(ctx, config);
    }
  }

  Chart.defaults.animation = false;
  Chart.defaults.interaction = { mode: 'nearest', intersect: false };
  Chart.defaults.plugins.tooltip.enabled = false;
  Chart.defaults.plugins.legend.labels.color = '#64748B';

  createChart('lineChart', {
    type: 'line',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
      datasets: [{
        label: 'Donations',
        data: [48, 62, 78, 62, 88, 104, 118],
        borderColor: '#2563EB',
        backgroundColor: 'rgba(37, 99, 235, 0.18)',
        fill: true,
        tension: 0.45,
        pointRadius: 0,
        borderWidth: 3,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#64748B' } },
        y: { grid: { color: 'rgba(148, 163, 184, 0.18)' }, ticks: { color: '#64748B' } },
      },
    },
  });

  createChart('pieChart', {
    type: 'doughnut',
    data: {
      labels: ['Recurring', 'One-time', 'Corporate', 'Events'],
      datasets: [{
        data: [42, 28, 18, 12],
        backgroundColor: ['#2563EB', '#10B981', '#8B5CF6', '#F59E0B'],
        borderWidth: 0,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: { legend: { position: 'bottom', labels: { color: '#64748B' } } },
    },
  });

  createChart('campaignLineChart', {
    type: 'line',
    data: {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      datasets: [{
        label: 'Raised',
        data: [18, 34, 56, 72],
        borderColor: '#2563EB',
        backgroundColor: 'rgba(37, 99, 235, 0.18)',
        fill: true,
        tension: 0.4,
        pointRadius: 2,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#64748B' } },
        y: { grid: { color: 'rgba(148, 163, 184, 0.18)' }, ticks: { color: '#64748B' } },
      },
    },
  });

  createChart('donationsLineChart', {
    type: 'line',
    data: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{
        label: 'Revenue',
        data: [34, 46, 52, 63, 58, 71, 88],
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.18)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#64748B' } },
        y: { grid: { color: 'rgba(148, 163, 184, 0.18)' }, ticks: { color: '#64748B' } },
      },
    },
  });

  createChart('paymentMethodsChart', {
    type: 'doughnut',
    data: {
      labels: ['Card', 'PayPal', 'Bank', 'Cash'],
      datasets: [{
        data: [62, 18, 12, 8],
        backgroundColor: ['#2563EB', '#8B5CF6', '#10B981', '#F59E0B'],
        borderWidth: 0,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: { legend: { position: 'bottom', labels: { color: '#64748B' } } },
    },
  });

  createChart('reportsLineChart', {
    type: 'line',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [{
        label: 'Donations',
        data: [82, 96, 108, 118, 132, 148],
        borderColor: '#8B5CF6',
        backgroundColor: 'rgba(139, 92, 246, 0.18)',
        fill: true,
        tension: 0.35,
        pointRadius: 0,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#64748B' } },
        y: { grid: { color: 'rgba(148, 163, 184, 0.18)' }, ticks: { color: '#64748B' } },
      },
    },
  });

  createChart('donorPieChart', {
    type: 'doughnut',
    data: {
      labels: ['Individual', 'Corporate', 'Foundation'],
      datasets: [{
        data: [58, 28, 14],
        backgroundColor: ['#2563EB', '#10B981', '#8B5CF6'],
        borderWidth: 0,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: { legend: { position: 'bottom', labels: { color: '#64748B' } } },
    },
  });
});
