const phpNumberFormatter = new Intl.NumberFormat('en-PH', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCurrency(amount) {
  const value = Number(amount);
  return `₱${phpNumberFormatter.format(Number.isFinite(value) ? value : 0)}`;
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatRelativeTime(dateStr) {
  const d = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(dateStr);
}

export function initials(name) {
  return name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
}

export function avatarClass(index) {
  const classes = ['', 'avatar-blue', 'avatar-violet', 'avatar-sky', 'avatar-emerald', 'avatar-rose', 'avatar-purple'];
  return classes[index % classes.length];
}

export function levelBadgeClass(level) {
  const map = { Platinum: 'bg-slate-100 text-slate-700', Gold: 'bg-sky-100 text-sky-700', Silver: 'bg-slate-100 text-slate-700', Bronze: 'bg-amber-100 text-amber-700' };
  return map[level] || 'bg-slate-100 text-slate-700';
}

export function statusBadgeClass(status) {
  const map = {
    Active: 'bg-emerald-100 text-emerald-700', Succeeded: 'bg-emerald-100 text-emerald-700', Sent: 'bg-emerald-100 text-emerald-700', Live: 'bg-emerald-100 text-emerald-700',
    Pending: 'bg-amber-100 text-amber-700', Processing: 'bg-amber-100 text-amber-700', 'In review': 'bg-sky-100 text-sky-700',
    Inactive: 'bg-slate-100 text-slate-700', Refund: 'bg-rose-100 text-rose-700', Paused: 'bg-amber-100 text-amber-700', Planning: 'bg-sky-100 text-sky-700',
  };
  return map[status] || 'bg-slate-100 text-slate-700';
}

export function exportCsv(filename, rows, columns) {
  const header = columns.map((c) => c.label).join(',');
  const body = rows.map((row) =>
    columns.map((c) => {
      const val = String(c.value(row)).replace(/"/g, '""');
      return `"${val}"`;
    }).join(',')
  ).join('\n');
  const blob = new Blob([header + '\n' + body], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function openModal(id) {
  document.getElementById(id)?.classList.add('modal-open');
  document.body.classList.add('modal-active');
}

export function closeModal(id) {
  document.getElementById(id)?.classList.remove('modal-open');
  if (!document.querySelector('.modal.modal-open')) {
    document.body.classList.remove('modal-active');
  }
}

export function bindModalClose() {
  document.querySelectorAll('[data-close-modal]').forEach((el) => {
    el.addEventListener('click', () => closeModal(el.dataset.closeModal));
  });
  document.querySelectorAll('.modal-backdrop').forEach((el) => {
    el.addEventListener('click', () => closeModal(el.dataset.closeModal));
  });
}
