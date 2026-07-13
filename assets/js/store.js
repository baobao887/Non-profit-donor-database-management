const STORAGE_KEY = 'donortrack_data';

let cache = null;

async function loadSeed() {
  try {
    const res = await fetch('assets/data/seed.json');
    if (res.ok) return res.json();
  } catch {
    /* file:// or offline — use embedded seed */
  }
  return embeddedSeed;
}

const embeddedSeed = {"donors":[{"id":"d1","name":"Jordan Doe","email":"jordan@example.com","phone":"+1 415 555 0145","level":"Platinum","role":"Community Advocate","lifetime":56200,"lastDonation":"2026-06-23","status":"Active"},{"id":"d2","name":"Sofia Alvarez","email":"sofia@hope.org","phone":"+1 212 555 0199","level":"Gold","role":"Major Donor","lifetime":24800,"lastDonation":"2026-06-18","status":"Pending"},{"id":"d3","name":"Max King","email":"max.king@kind.org","phone":"+44 20 7946 0987","level":"Silver","role":"Recurring Supporter","lifetime":12150,"lastDonation":"2026-06-12","status":"Inactive"},{"id":"d4","name":"Elena Grant","email":"elena@grant.org","phone":"+1 503 555 0122","level":"Platinum","role":"Board Member","lifetime":89400,"lastDonation":"2026-06-25","status":"Active"},{"id":"d5","name":"Marcus Kim","email":"marcus@kim.co","phone":"+1 617 555 0188","level":"Gold","role":"Corporate Partner","lifetime":42000,"lastDonation":"2026-06-24","status":"Active"},{"id":"d6","name":"Renton Lee","email":"renton@lee.net","phone":"+1 206 555 0166","level":"Bronze","role":"Monthly Giver","lifetime":3200,"lastDonation":"2026-06-22","status":"Active"}],"donations":[{"id":"D-1205","donorId":"d4","campaign":"General fund","amount":7500,"date":"2026-06-25","method":"Visa","status":"Succeeded"},{"id":"D-1204","donorId":"d5","campaign":"Annual gala","amount":22000,"date":"2026-06-24","method":"Card","status":"Pending"},{"id":"D-1203","donorId":"d6","campaign":"Monthly pledges","amount":1400,"date":"2026-06-22","method":"PayPal","status":"Refund"},{"id":"D-1202","donorId":"d1","campaign":"Clean water push","amount":4200,"date":"2026-06-24","method":"Card","status":"Pending"},{"id":"D-1201","donorId":"d2","campaign":"Education fund","amount":18200,"date":"2026-06-22","method":"Bank","status":"Processing"},{"id":"D-1200","donorId":"d3","campaign":"Summer School Drive","amount":2500,"date":"2026-06-20","method":"Visa","status":"Succeeded"}],"campaigns":[{"id":"c1","name":"Summer School Drive","description":"Empowering 1,200 students with mentorship programs and classroom supplies.","goal":240000,"raised":174000,"status":"Live","image":"https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80"},{"id":"c2","name":"Community Wellness","description":"Healthcare access support with preventative care and advocacy campaigns.","goal":160000,"raised":61000,"status":"Planning","image":null},{"id":"c3","name":"Clean Water Push","description":"Raising funds for safe water infrastructure in rural communities.","goal":120000,"raised":65000,"status":"Paused","image":null},{"id":"c4","name":"Back-to-school","description":"School supplies and scholarships for underserved communities.","goal":180000,"raised":132000,"status":"Live","image":null},{"id":"c5","name":"Food access","description":"Meal programs and food pantry support across partner sites.","goal":120000,"raised":85000,"status":"Live","image":null}],"communications":[{"id":"cm1","type":"Email outreach","donorId":"d1","staff":"Jordan Doe","date":"2026-07-08T10:00:00","status":"Sent","content":"Followed up on the new campaign launch and shared the donor impact story with personalized messaging."},{"id":"cm2","type":"Call logged","donorId":"d2","staff":"Sofia Alvarez","date":"2026-06-24T14:30:00","status":"In review","content":"Discussed donor preferences for recurring giving and updated campaign interests for the stewardship team."},{"id":"cm3","type":"Meeting note","donorId":"d5","staff":"Marcus Brown","date":"2026-06-22T09:00:00","status":"Pending","content":"Staff confirmed donor communication preferences and scheduled an introduction call for next week."}]};

export async function initStore() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      cache = hydrateDemoData(JSON.parse(saved));
      persist();
      return cache;
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
  cache = hydrateDemoData(await loadSeed());
  persist();
  return cache;
}

// Keeps the demo useful even when opened directly from the file system. These
// records are deliberately client-side placeholders for a future API.
function hydrateDemoData(data) {
  const names = [
    ['Amara Chen', 'amara.chen@example.org'], ['Noah Bennett', 'noah.bennett@example.org'],
    ['Priya Nair', 'priya.nair@example.org'], ['Theo Martin', 'theo.martin@example.org'],
    ['Lina Okafor', 'lina.okafor@example.org'], ['Mateo Silva', 'mateo.silva@example.org'],
    ['Grace Wilson', 'grace.wilson@example.org'], ['Omar Haddad', 'omar.haddad@example.org'],
    ['Hannah Brooks', 'hannah.brooks@example.org'], ['Elliot Park', 'elliot.park@example.org'],
    ['Zoe Morgan', 'zoe.morgan@example.org'], ['David Okoro', 'david.okoro@example.org'],
    ['Maya Patel', 'maya.patel@example.org'], ['Isaac Reed', 'isaac.reed@example.org']
  ];
  data.donors ||= [];
  names.forEach(([name, email], index) => {
    const id = `d${index + 7}`;
    if (!data.donors.some((d) => d.id === id)) data.donors.push({
      id, name, email, phone: `+1 555 01${String(index + 10).padStart(2, '0')}`,
      level: ['Bronze', 'Silver', 'Gold', 'Platinum'][index % 4], role: ['Monthly Giver', 'Volunteer', 'Community Partner', 'Major Donor'][index % 4],
      lifetime: 1800 + index * 2750, lastDonation: `2026-06-${String((index % 25) + 1).padStart(2, '0')}`, status: index % 6 === 0 ? 'Pending' : 'Active'
    });
  });
  data.campaigns ||= [];
  const campaignNames = ['Youth Arts Fund', 'Healthy Homes', 'Green Neighborhoods', 'Emergency Relief', 'Women in Tech'];
  campaignNames.forEach((name, index) => {
    const id = `c${index + 6}`;
    if (!data.campaigns.some((c) => c.id === id)) data.campaigns.push({
      id, name, description: `Community-led support for ${name.toLowerCase()}.`, goal: 90000 + index * 15000,
      raised: 24000 + index * 17500, status: index === 3 ? 'Planning' : 'Live', image: null
    });
  });
  data.donations ||= [];
  const methods = ['Card', 'Bank', 'PayPal', 'Visa'];
  while (data.donations.length < 50) {
    const index = data.donations.length;
    data.donations.push({ id: `D-${1200 + index}`, donorId: data.donors[index % data.donors.length].id,
      campaign: data.campaigns[index % data.campaigns.length].name, amount: 125 + (index * 175) % 4800,
      date: `2026-${String(1 + (index % 6)).padStart(2, '0')}-${String(2 + (index % 26)).padStart(2, '0')}`,
      method: methods[index % methods.length], status: index % 13 === 0 ? 'Pending' : 'Succeeded' });
  }
  data.communications ||= [];
  while (data.communications.length < 15) {
    const index = data.communications.length;
    data.communications.push({ id: `cm${index + 1}`, type: ['Email outreach', 'Call logged', 'Meeting note'][index % 3],
      donorId: data.donors[index % data.donors.length].id, staff: ['Avery Jordan', 'Nora Adams', 'Riley Chen'][index % 3],
      date: `2026-07-${String(index + 1).padStart(2, '0')}T10:00:00`, status: index % 4 === 0 ? 'Pending' : 'Sent',
      content: 'Recorded stewardship follow-up and updated the donor relationship notes.' });
  }
  data.staff ||= [
    { id: 's1', name: 'Avery Jordan', role: 'Administrator', email: 'avery@donortrack.org' },
    { id: 's2', name: 'Nora Adams', role: 'Development Manager', email: 'nora@donortrack.org' },
    { id: 's3', name: 'Riley Chen', role: 'Donor Relations', email: 'riley@donortrack.org' },
    { id: 's4', name: 'Samira Khan', role: 'Campaign Lead', email: 'samira@donortrack.org' },
    { id: 's5', name: 'Leo Grant', role: 'Finance Officer', email: 'leo@donortrack.org' }
  ];
  return data;
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
}

export function getStore() {
  if (!cache) throw new Error('Store not initialized');
  return cache;
}

export function getDonors() {
  return [...getStore().donors];
}

export function getDonor(id) {
  return getStore().donors.find((d) => d.id === id);
}

export function addDonor(donor) {
  const store = getStore();
  const id = 'd' + Date.now();
  store.donors.unshift({ id, lifetime: 0, lastDonation: null, ...donor });
  persist();
  return id;
}

export function updateDonor(id, updates) {
  const store = getStore();
  const idx = store.donors.findIndex((d) => d.id === id);
  if (idx === -1) return false;
  store.donors[idx] = { ...store.donors[idx], ...updates };
  persist();
  return true;
}

export function deleteDonor(id) {
  const store = getStore();
  store.donors = store.donors.filter((d) => d.id !== id);
  persist();
}

export function getDonations() {
  return [...getStore().donations].sort((a, b) => b.date.localeCompare(a.date));
}

export function addDonation(donation) {
  const store = getStore();
  const num = store.donations.length + 1200;
  const id = 'D-' + num;
  const donor = getDonor(donation.donorId);
  store.donations.unshift({ id, ...donation });
  if (donor) {
    donor.lifetime += Number(donation.amount);
    donor.lastDonation = donation.date;
    donor.status = 'Active';
  }
  const campaign = store.campaigns.find((c) => c.name === donation.campaign);
  if (campaign) campaign.raised += Number(donation.amount);
  persist();
  return id;
}

export function getCampaigns() {
  return [...getStore().campaigns];
}

export function addCampaign(campaign) {
  const store = getStore();
  const id = 'c' + Date.now();
  store.campaigns.unshift({ id, raised: 0, ...campaign });
  persist();
  return id;
}

export function getCommunications() {
  return [...getStore().communications].sort((a, b) => b.date.localeCompare(a.date));
}

export function addCommunication(entry) {
  const store = getStore();
  const id = 'cm' + Date.now();
  store.communications.unshift({ id, date: new Date().toISOString(), ...entry });
  persist();
  return id;
}

export function getStaff() { return [...getStore().staff]; }

export function addStaff(member) {
  const id = 's' + Date.now();
  getStore().staff.unshift({ id, ...member });
  persist();
  return id;
}

export function updateStaff(id, updates) {
  const member = getStore().staff.find((s) => s.id === id);
  if (!member) return false;
  Object.assign(member, updates);
  persist();
  return true;
}

export function deleteStaff(id) {
  getStore().staff = getStore().staff.filter((s) => s.id !== id);
  persist();
}

export function getStats() {
  const store = getStore();
  const totalDonors = store.donors.length;
  const totalDonations = store.donations.reduce((s, d) => s + (d.status !== 'Refund' ? d.amount : 0), 0);
  const activeCampaigns = store.campaigns.filter((c) => c.status === 'Live').length;
  const avgGift = store.donations.length ? Math.round(totalDonations / store.donations.length) : 0;
  return { totalDonors, totalDonations, activeCampaigns, avgGift, campaignCount: store.campaigns.length };
}

export function resetStore() {
  localStorage.removeItem(STORAGE_KEY);
  cache = null;
}
