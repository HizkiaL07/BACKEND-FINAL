/* ════════════════════════
    DATA
════════════════════════ */
let events = [
  { id:1, name:'Neon Dynasty Tour', artist:'DJ Nexus', date:'2025-08-15', venue:'Jakarta Arena', cap:600, sold:521, price:350000, status:'active' },
  { id:2, name:'Scarlet Storm Fest', artist:'Red Wolves', date:'2025-09-02', venue:'Bandung Sport', cap:400, sold:400, price:200000, status:'sold' },
  { id:3, name:'Frozen Horizon', artist:'Arctic Pulse', date:'2025-10-10', venue:'Surabaya Conv.', cap:800, sold:230, price:450000, status:'soon' },
  { id:4, name:'Eclipse of Dark', artist:'Void Syndicate', date:'2025-07-20', venue:'GBK Jakarta', cap:5000, sold:3780, price:750000, status:'active' },
  { id:5, name:'The Last Forest', artist:'Earthtone', date:'2025-11-05', venue:'Bali Cultura', cap:300, sold:80, price:180000, status:'draft' },
  { id:6, name:'Solar Bloom', artist:'Lumine', date:'2025-12-31', venue:'Lombok Beach', cap:1000, sold:0, price:500000, status:'draft' },
];

const orders = [
  { id:'TW-00421', buyer:'Andi Saputra',  event:'Neon Dynasty Tour',  seat:'B-07', total:350000, method:'VA BCA', status:'success', time:'5 mnt lalu' },
  { id:'TW-00420', buyer:'Siti Rahayu',   event:'Scarlet Storm Fest', seat:'A-12', total:200000, method:'GoPay',   status:'success', time:'12 mnt lalu' },
  { id:'TW-00419', buyer:'Budi Santoso',  event:'Eclipse of Dark',    seat:'D-05', total:750000, method:'OVO',      status:'pending', time:'18 mnt lalu' },
  { id:'TW-00418', buyer:'Dewi Kusuma',   event:'Frozen Horizon',     seat:'C-09', total:450000, method:'QRIS',    status:'success', time:'31 mnt lalu' },
  { id:'TW-00417', buyer:'Reza Pratama',  event:'Neon Dynasty Tour',  seat:'B-14', total:350000, method:'VA BNI',  status:'failed',  time:'45 mnt lalu' },
  { id:'TW-00416', buyer:'Linda Wijaya',  event:'Eclipse of Dark',    seat:'E-02', total:750000, method:'GoPay',   status:'success', time:'1 j lalu' },
];

const activity = [
  { color:'#4dffb8', text:'Tiket <em>Neon Dynasty</em> B-07 berhasil terjual ke Andi S.', time:'5 mnt' },
  { color:'#f0c040', text:'User <em>user_3341</em> mengunci kursi <em>C-09</em> Frozen Horizon', time:'8 mnt' },
  { color:'#ff4d6d', text:'Transaksi <em>TW-00417</em> gagal – timeout pembayaran', time:'45 mnt' },
  { color:'#5b8dee', text:'Event baru <em>Solar Bloom</em> ditambahkan oleh admin', time:'1 j' },
  { color:'#6b6b80', text:'Lock kursi <em>A-03</em> kedaluwarsa, dikembalikan', time:'2 j' },
];

const barData = [
  { day:'Sen', val:65 }, { day:'Sel', val:42 }, { day:'Rab', val:88 },
  { day:'Kam', val:55 }, { day:'Jum', val:95 }, { day:'Sab', val:100 }, { day:'Min', val:73 },
];

const ROWS = ['A','B','C','D','E','F','G','H'];
const COLS = 12;

let editingId = null;
let deletingId = null;
let seatStates = [];

/* ════════════════════════
    NAVIGATION
════════════════════════ */
function navigate(viewId, el) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('view-'+viewId).classList.add('active');
  if (el) el.classList.add('active');

  const titles = {
    dashboard:'DASHBOARD <span>ADMIN</span>',
    events:'KELOLA <span>EVENT</span>',
    seats:'STATUS <span>KURSI</span>',
    orders:'DAFTAR <span>PESANAN</span>',
    reports:'LAPORAN <span>PENJUALAN</span>',
    settings:'PENGATURAN <span>SISTEM</span>'
  };
  document.getElementById('topbar-title').innerHTML = titles[viewId] || viewId.toUpperCase();

  const showCTA = viewId === 'events' || viewId === 'dashboard';
  document.getElementById('topbar-cta').style.display = showCTA ? '' : 'none';

  if (viewId === 'events') renderEvents();
  if (viewId === 'seats')  renderSeatMap();
  if (viewId === 'orders') renderOrders();
  if (viewId === 'reports') renderReports();
}

/* ════════════════════════
    RENDER FUNCTIONS
════════════════════════ */
function statusBadge(s) {
  const map = { active:'badge-active', sold:'badge-sold', draft:'badge-draft', soon:'badge-soon' };
  const label = { active:'Aktif', sold:'Sold Out', draft:'Draft', soon:'Segera' };
  return `<span class="badge ${map[s]||'badge-draft'}">${label[s]||s}</span>`;
}

function fmtIDR(n) {
  return 'Rp ' + (n>=1000000 ? (n/1000000).toFixed(1)+'M' : (n>=1000 ? (n/1000).toFixed(0)+'K' : n));
}

function renderDashboardTable() {
  const top = [...events].sort((a,b)=>b.sold-a.sold).slice(0,4);
  const tbody = document.getElementById('dashboard-event-body');
  tbody.innerHTML = top.map(e=>`
    <tr>
      <td><div class="event-name">${e.name}</div><div class="event-artist">${e.artist}</div></td>
      <td style="color:var(--muted);font-size:.82rem">${formatDate(e.date)}</td>
      <td>${statusBadge(e.status)}</td>
      <td>
        <div class="progress-bar-wrap">
          <div class="progress-bar"><div class="progress-fill" style="width:${Math.round(e.sold/e.cap*100)}%;background:${e.status==='sold'?'var(--accent2)':'var(--accent)'}"></div></div>
          <span class="progress-pct">${Math.round(e.sold/e.cap*100)}%</span>
        </div>
      </td>
      <td style="color:var(--accent3);font-weight:600">${fmtIDR(e.sold*e.price)}</td>
    </tr>
  `).join('');
}

function renderEvents() {
  const search = (document.getElementById('event-search')?.value||'').toLowerCase();
  const sf = document.getElementById('event-status-filter')?.value||'';
  const filtered = events.filter(e=>{
    const matchSearch = !search || e.name.toLowerCase().includes(search) || e.artist.toLowerCase().includes(search);
    const matchStatus = !sf || e.status === sf;
    return matchSearch && matchStatus;
  });
  const tbody = document.getElementById('event-tbody');
  tbody.innerHTML = filtered.map(e=>{
    const pct = Math.round(e.sold/e.cap*100);
    const barColor = e.status==='sold'?'var(--accent2)': pct>80?'var(--accent)':'var(--accent3)';
    return `
    <tr>
      <td><div class="event-name">${e.name}</div><div class="event-artist">${e.artist}</div></td>
      <td style="color:var(--muted);font-size:.82rem;white-space:nowrap">${formatDate(e.date)}</td>
      <td style="font-size:.82rem;color:var(--muted)">${e.venue}</td>
      <td style="font-size:.82rem;color:var(--muted)">${e.cap.toLocaleString()}</td>
      <td>
        <div class="progress-bar-wrap">
          <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:${barColor}"></div></div>
          <span class="progress-pct">${e.sold}/${e.cap}</span>
        </div>
      </td>
      <td style="font-size:.82rem;color:var(--muted)">${fmtIDR(e.price)}</td>
      <td>${statusBadge(e.status)}</td>
      <td>
        <div class="action-btns">
          <button class="btn-icon" title="Edit" onclick="openEditModal(${e.id})">✏️</button>
          <button class="btn-icon" title="Seat Map" onclick="navigate('seats',document.querySelectorAll('.nav-item')[2])">🪑</button>
          <button class="btn-icon danger" title="Hapus" onclick="askDelete(${e.id},'${e.name}')">🗑️</button>
        </div>
      </td>
    </tr>`;
  }).join('') || `<tr><td colspan="8" style="text-align:center;padding:28px;color:var(--muted)">Tidak ada event ditemukan.</td></tr>`;
}

function filterEvents() { renderEvents(); }

function renderOrders() {
  const tbody = document.getElementById('order-tbody');
  const statusMap = { success:'badge-active', pending:'badge-soon', failed:'badge-sold' };
  const statusLabel = { success:'Berhasil', pending:'Menunggu', failed:'Gagal' };
  tbody.innerHTML = orders.map((o,i)=>`
    <tr>
      <td style="font-size:.78rem;color:var(--muted);font-weight:600">${o.id}</td>
      <td style="font-weight:600">${o.buyer}</td>
      <td style="font-size:.82rem;color:var(--muted)">${o.event}</td>
      <td style="font-family:'Bebas Neue';letter-spacing:.06em;color:var(--accent)">${o.seat}</td>
      <td style="font-weight:600;color:var(--text)">${fmtIDR(o.total)}</td>
      <td style="font-size:.78rem;color:var(--muted)">${o.method}</td>
      <td><span class="badge ${statusMap[o.status]}">${statusLabel[o.status]}</span></td>
      <td style="font-size:.75rem;color:var(--muted)">${o.time}</td>
    </tr>
  `).join('');
}

function renderReports() {
  // Big chart
  const chart = document.getElementById('report-chart');
  const labels = document.getElementById('report-chart-labels');
  const reportData = [
    { day:'15 Jan', val:72 }, { day:'16 Jan', val:55 }, { day:'17 Jan', val:90 },
    { day:'18 Jan', val:48 }, { day:'19 Jan', val:100 }, { day:'20 Jan', val:83 }, { day:'21 Jan', val:65 },
  ];
  chart.innerHTML = reportData.map(d=>`
    <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;height:100%">
      <div style="flex:1;width:100%;display:flex;align-items:flex-end">
        <div style="width:100%;height:${d.val}%;background:linear-gradient(to top,var(--accent),rgba(240,192,64,.3));border-radius:4px 4px 0 0;transition:height .7s ease;min-height:4px"></div>
      </div>
    </div>
  `).join('');
  labels.innerHTML = reportData.map(d=>`<div style="flex:1;text-align:center;font-size:.62rem;color:var(--muted)">${d.day}</div>`).join('');

  const rtbody = document.getElementById('report-event-tbody');
  const sorted = [...events].sort((a,b)=>b.sold*b.price - a.sold*a.price);
  const total = sorted.reduce((s,e)=>s+e.sold*e.price,0);
  rtbody.innerHTML = sorted.map((e,i)=>`
    <tr>
      <td style="color:var(--muted);font-weight:700">${i+1}</td>
      <td><div class="event-name">${e.name}</div><div class="event-artist">${e.artist}</div></td>
      <td style="color:var(--muted)">${e.sold.toLocaleString()}</td>
      <td style="color:var(--accent3);font-weight:600">${fmtIDR(e.sold*e.price)}</td>
      <td>
        <div class="progress-bar-wrap">
          <div class="progress-bar"><div class="progress-fill" style="width:${total?Math.round(e.sold*e.price/total*100):0}%;background:var(--accent4)"></div></div>
          <span class="progress-pct">${total?Math.round(e.sold*e.price/total*100):0}%</span>
        </div>
      </td>
    </tr>
  `).join('');
}

/* ════════════════════════
    SEAT MAP
════════════════════════ */
function generateSeatStates() {
  seatStates = [];
  ROWS.forEach(row=>{
    for(let c=1;c<=COLS;c++){
      const r = Math.random();
      seatStates.push({ row, col:c, state: r<0.5?'sold': r<0.65?'locked':'available' });
    }
  });
}

function renderSeatMap() {
  if (!seatStates.length) generateSeatStates();
  const grid = document.getElementById('seat-grid');
  grid.innerHTML = '';
  ROWS.forEach(row=>{
    const rowEl = document.createElement('div');
    rowEl.className = 'seat-row';
    const lbl = document.createElement('div');
    lbl.className = 'row-label';
    lbl.textContent = row;
    rowEl.appendChild(lbl);
    for(let c=1;c<=COLS;c++){
      const s = seatStates.find(x=>x.row===row && x.col===c);
      const btn = document.createElement('button');
      btn.className = `seat ${s.state}`;
      btn.title = `${row}-${String(c).padStart(2,'0')} · ${s.state}`;
      if(s.state !== 'sold') btn.onclick = () => adminToggleSeat(s, btn);
      rowEl.appendChild(btn);
    }
    grid.appendChild(rowEl);
  });
  updateSeatStats();
}

function adminToggleSeat(s, btn) {
  if(s.state === 'available') s.state = 'locked';
  else if(s.state === 'locked') s.state = 'available';
  btn.className = `seat ${s.state}`;
  btn.title = `${s.row}-${String(s.col).padStart(2,'0')} · ${s.state}`;
  updateSeatStats();
  // Add to log
  const log = document.getElementById('lock-log');
  const item = document.createElement('div');
  item.className = 'activity-item';
  const color = s.state === 'locked' ? '#f0c040' : '#4dffb8';
  const action = s.state === 'locked' ? 'dikunci' : 'dibuka';
  item.innerHTML = `<div class="activity-dot" style="background:${color}"></div><div class="activity-text">Admin <em>${action}</em> kursi <em>${s.row}-${String(s.col).padStart(2,'0')}</em></div><span class="activity-time">baru saja</span>`;
  log.insertBefore(item, log.firstChild);
}

function updateSeatStats() {
  const sold = seatStates.filter(s=>s.state==='sold').length;
  const locked = seatStates.filter(s=>s.state==='locked').length;
  const avail = seatStates.filter(s=>s.state==='available').length;
  const total = seatStates.length;
  const soldPct = Math.round(sold/total*239);
  const lockPct = Math.round(locked/total*239);
  const availPct = Math.round(avail/total*239);

  document.getElementById('count-sold').textContent = sold;
  document.getElementById('count-locked').textContent = locked;
  document.getElementById('count-avail').textContent = avail;
  document.getElementById('seat-pct').textContent = Math.round((sold+locked)/total*100)+'%';

  document.getElementById('donut-sold').setAttribute('stroke-dasharray', `${soldPct} 239`);
  document.getElementById('donut-sold').setAttribute('stroke-dashoffset', '0');
  document.getElementById('donut-locked').setAttribute('stroke-dasharray', `${lockPct} 239`);
  document.getElementById('donut-locked').setAttribute('stroke-dashoffset', `-${soldPct}`);
  document.getElementById('donut-avail').setAttribute('stroke-dasharray', `${availPct} 239`);
  document.getElementById('donut-avail').setAttribute('stroke-dashoffset', `-${soldPct+lockPct}`);
}

function randomizeSeatMap() {
  generateSeatStates();
  renderSeatMap();
  showToast('🔄 Data kursi diperbarui (simulasi real-time)','');
}

/* ════════════════════════
    MODAL
════════════════════════ */
function openModal() {
  editingId = null;
  document.getElementById('modal-title').textContent = 'TAMBAH EVENT BARU';
  ['m-name','m-artist','m-venue','m-desc'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('m-cap').value='';
  document.getElementById('m-price').value='';
  document.getElementById('m-date').value='';
  document.getElementById('m-time').value='19:00';
  document.getElementById('m-status').value='draft';
  document.getElementById('modal-overlay').classList.add('open');
}

function openEditModal(id) {
  const e = events.find(x=>x.id===id);
  if(!e) return;
  editingId = id;
  document.getElementById('modal-title').textContent = 'EDIT EVENT';
  document.getElementById('m-name').value = e.name;
  document.getElementById('m-artist').value = e.artist;
  document.getElementById('m-date').value = e.date;
  document.getElementById('m-venue').value = e.venue;
  document.getElementById('m-cap').value = e.cap;
  document.getElementById('m-price').value = e.price;
  document.getElementById('m-status').value = e.status;
  document.getElementById('modal-overlay').classList.add('open');
}

function closeModal() { document.getElementById('modal-overlay').classList.remove('open'); }

function saveEvent() {
  const name = document.getElementById('m-name').value.trim();
  const artist = document.getElementById('m-artist').value.trim();
  const date = document.getElementById('m-date').value;
  const venue = document.getElementById('m-venue').value.trim();
  const cap = parseInt(document.getElementById('m-cap').value)||0;
  const price = parseInt(document.getElementById('m-price').value)||0;
  const status = document.getElementById('m-status').value;

  if(!name||!artist||!date||!venue||!cap) {
    showToast('⚠️ Harap lengkapi semua field wajib.','error'); return;
  }
  if(editingId) {
    const e = events.find(x=>x.id===editingId);
    Object.assign(e, {name,artist,date,venue,cap,price,status});
    showToast('✅ Event berhasil diperbarui!','success');
  } else {
    events.push({ id: Date.now(), name, artist, date, venue, cap, sold:0, price, status });
    document.getElementById('badge-event').textContent = events.length;
    showToast('🎉 Event baru berhasil ditambahkan!','success');
  }
  closeModal();
  renderEvents();
  renderDashboardTable();
}

/* ════════════════════════
    DELETE
════════════════════════ */
function askDelete(id, name) {
  deletingId = id;
  document.getElementById('confirm-desc').textContent = `Yakin ingin menghapus "${name}"? Tindakan ini tidak dapat dibatalkan.`;
  document.getElementById('confirm-modal').classList.add('open');
}
function closeConfirm() { document.getElementById('confirm-modal').classList.remove('open'); deletingId=null; }
function confirmDelete() {
  events = events.filter(e=>e.id!==deletingId);
  document.getElementById('badge-event').textContent = events.length;
  closeConfirm();
  renderEvents();
  renderDashboardTable();
  showToast('🗑️ Event berhasil dihapus.','');
}

/* ════════════════════════
    TOAST
════════════════════════ */
let toastTimer;
function showToast(msg, type='') {
  const t = document.getElementById('toast');
  t.textContent = msg; t.className = 'show '+(type||'');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>{ t.className=''; }, 3200);
}

/* ════════════════════════
    HELPERS
════════════════════════ */
function formatDate(d) {
  const date = new Date(d);
  return date.toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'});
}

function updateClock() {
  const now = new Date();
  document.getElementById('topbar-date').textContent =
    now.toLocaleDateString('id-ID',{weekday:'short',day:'numeric',month:'short',year:'numeric'}) +
    ' · ' + now.toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'});
}

/* ════════════════════════
    INIT
════════════════════════ */
(function init() {
  // Date clock
  updateClock(); setInterval(updateClock, 30000);

  // Activity feed
  const feed = document.getElementById('activity-feed');
  activity.forEach(a=>{
    const el = document.createElement('div');
    el.className = 'activity-item';
    el.innerHTML = `<div class="activity-dot" style="background:${a.color}"></div><div class="activity-text">${a.text}</div><span class="activity-time">${a.time}</span>`;
    feed.appendChild(el);
  });

  // Mini bar chart
  const barChart = document.getElementById('mini-bar-chart');
  barData.forEach(d=>{
    const item = document.createElement('div');
    item.className = 'bar-item';
    item.innerHTML = `<div class="bar" style="height:${d.val}%;background:linear-gradient(to top,var(--accent),rgba(240,192,64,.3))"></div><div class="bar-label">${d.day}</div>`;
    barChart.appendChild(item);
  });

  // Dashboard table
  renderDashboardTable();

  // Hide CTA initially based on view
  // (dashboard shows it, others handled by navigate)
})();

// ESC to close modal
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeModal(); closeConfirm(); }
});