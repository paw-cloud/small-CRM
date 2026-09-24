// Testowy, uproszczony "udawany" klient Supabase (dane w pamięci) - tylko do sprawdzania interfejsu.
(function () {
  const uid = () => crypto.randomUUID();
  let lastTs = 0;
  const now = () => { lastTs = Math.max(Date.now(), lastTs + 1); return new Date(lastTs).toISOString(); };   // rosnace znaczniki czasu (jak w bazie)
  const USER = { id: uid(), email: 'dostep@example.com' };
  const CODE = 'tajnykod123';
  const PUSER = { id: uid(), email: 'prywatne@example.com' };   // prywatne konto właściciela (zadania)
  const PCODE = 'moj-kod-456';
  const db = {
    companies: [], contacts: [], notes: [], audit_log: [], app_state: [], my_tasks: [],
    inquiries: []
  };
  let auditId = 0;
  const SKIP = ['updated_at', 'updated_by', 'created_at'];
  // emulacja triggera log_changes()
  function audit(table, action, before, after) {
    if (!['inquiries', 'companies', 'contacts'].includes(table)) return;
    const rec = after || before;
    let changes = {};
    if (action === 'update') {
      Object.keys(after).forEach((k) => { if (!SKIP.includes(k) && JSON.stringify(before[k]) !== JSON.stringify(after[k])) changes[k] = [before[k] === undefined ? null : before[k], after[k]]; });
      if (!Object.keys(changes).length) return;
    } else if (action === 'delete') changes = JSON.parse(JSON.stringify(before));
    db.audit_log.push({ id: ++auditId, table_name: table, record_id: rec.id, action, changed_by: action === 'insert' ? (rec.updated_by || rec.author || '') : (rec.updated_by || ''), changed_at: now(), changes });
  }
  // zmiana wykonana przez INNA osobe (do testow konfliktow)
  window.__other = (table, id, patch, who) => {
    const r = db[table].find((x) => x.id === id);
    const before = Object.assign({}, r);
    Object.assign(r, patch, { updated_at: now(), updated_by: who || 'Ktos Inny' });
    audit(table, 'update', before, r);
    return r.updated_at;
  };
  window.__db = db;
  window.__calls = { signIn: [], reads: {} };

  function makeClient(priv) {
    let user = null;
    const SKEY = priv ? 'mockPrivate' : 'mockUser';
    try { if (sessionStorage.getItem(SKEY)) user = priv ? PUSER : USER; } catch (e) { /* ignore */ }
    const listeners = [];
    const emit = (ev, s) => listeners.forEach((cb) => cb(ev, s));

    function from(table) {
      const st = { op: 'select', filters: [], gts: [], orders: [], range: null, single: null, payload: null, ret: false, lim: null };
      const b = {
        select() { st.ret = true; return b; },
        insert(p) { st.op = 'insert'; st.payload = p; return b; },
        update(p) { st.op = 'update'; st.payload = p; return b; },
        delete() { st.op = 'delete'; return b; },
        eq(c, v) { st.filters.push([c, v]); return b; },
        gt(c, v) { st.gts.push([c, v]); return b; },
        order(c, o) { st.orders.push([c, !(o && o.ascending === false)]); return b; },
        range(a, z) { st.range = [a, z]; return b; },
        limit(n) { st.lim = n; return b; },
        is(c, v) { st.filters.push([c, v]); return b; },
        upsert(p) { st.op = 'upsert'; st.payload = p; return b; },
        single() { st.single = 'single'; return b; },
        maybeSingle() { st.single = 'maybe'; return b; },
        then(res, rej) { return Promise.resolve(run()).then(res, rej); }
      };
      function run() {
        // symulacja RLS: bez sesji brak dostępu do jakichkolwiek danych
        if (!user || (table === 'my_tasks') !== !!priv) return { data: [], error: { message: 'new row violates row-level security policy' } };
        if (st.op === 'select') window.__calls.reads[table] = (window.__calls.reads[table] || 0) + 1;
        if (window.__failWrites && st.op !== 'select') return { data: null, error: { message: 'mock: blad zapisu' } };
        const rows = db[table];
        const match = (r) => st.filters.every(([c, v]) => r[c] === v) && st.gts.every(([c, v]) => String(r[c]) > String(v));
        let out;
        if (st.op === 'insert') {
          if (table === 'inquiries' && rows.some((r) => r.number === st.payload.number)) {
            return { data: null, error: { message: 'duplicate key value violates unique constraint "inquiries_number_key"' } };
          }
          const p = Object.assign({ id: uid(), created_at: now(), updated_at: now(), done: false, company_id: null, contact_id: null, inquiry_id: null, author: '' }, st.payload);
          rows.push(p);
          audit(table, 'insert', null, p);
          out = [p];
        } else if (st.op === 'upsert') {
          const ex = rows.find((r) => r.key === st.payload.key);
          if (ex) Object.assign(ex, st.payload); else rows.push(Object.assign({}, st.payload));
          out = [st.payload];
        } else if (st.op === 'update') {
          out = rows.filter(match);
          out.forEach((r) => { const before = Object.assign({}, r); Object.assign(r, st.payload, { updated_at: now() }); audit(table, 'update', before, r); });
        } else if (st.op === 'delete') {
          out = rows.filter(match);
          out.forEach((r) => audit(table, 'delete', r, null));
          db[table] = rows.filter((r) => !match(r));
        } else {
          out = rows.filter(match);
        }
        out = JSON.parse(JSON.stringify(out));
        st.orders.slice().reverse().forEach(([c, asc]) => out.sort((x, y) => (String(x[c]) < String(y[c]) ? -1 : String(x[c]) > String(y[c]) ? 1 : 0) * (asc ? 1 : -1)));
        if (st.range) out = out.slice(st.range[0], st.range[1] + 1);
        if (st.lim) out = out.slice(0, st.lim);
        if (st.op !== 'select' && !st.ret) return { data: null, error: null };
        if (st.single) {
          if (!out.length && st.single === 'single') return { data: null, error: { message: 'no rows' } };
          return { data: out[0] || null, error: null };
        }
        return { data: out, error: null };
      }
      return b;
    }

    const client = {
      from,
      auth: {
        getSession: async () => ({ data: { session: user ? { user } : null } }),
        onAuthStateChange(cb) { listeners.push(cb); },
        async signInWithPassword({ email, password }) {
          window.__calls.signIn.push({ email, password });
          const ok = priv ? (email === PUSER.email && password === PCODE) : (email === USER.email && password === CODE);
          if (ok) {
            user = priv ? PUSER : USER;
            try { sessionStorage.setItem(SKEY, '1'); } catch (e) { /* ignore */ }
            emit('SIGNED_IN', { user });
            return { data: { session: { user } }, error: null };
          }
          return { data: { session: null }, error: { message: 'Invalid login credentials' } };
        },
        async signOut() {
          user = null;
          try { sessionStorage.removeItem(SKEY); } catch (e) { /* ignore */ }
          emit('SIGNED_OUT', null);
          return { error: null };
        }
      }
    };
  return client;
  }
  window.supabase = { createClient: (url, key, opts) => makeClient(!!(opts && opts.auth && opts.auth.storageKey === 'crm-private-auth')) };
})();
