// Klien ringan ke backend Google Apps Script.
import { SCRIPT_URL } from './config.js?v=7';

// Lindungi aplikasi jika localStorage kosong/rusak atau browser membatasi aksesnya.
function readStorage(key, fallback = null) {
  try {
    const value = localStorage.getItem(key);
    return value == null ? fallback : value;
  } catch (e) {
    console.warn('Tidak dapat membaca localStorage:', e);
    return fallback;
  }
}
let tok = readStorage('tk', null);
let ME = null;
try {
  ME = JSON.parse(readStorage('me', 'null') || 'null');
} catch (e) {
  ME = null;
  try { localStorage.removeItem('me'); } catch (_) {}
}
let cb = null;

const clear = () => {
  tok = null;
  ME = null;
  try {
    localStorage.removeItem('tk');
    localStorage.removeItem('me');
  } catch (e) {
    console.warn('Tidak dapat membersihkan localStorage:', e);
  }
};

async function call(a, p = {}) {
  let response;
  let raw = '';
  let j;
  try {
    response = await fetch(SCRIPT_URL, {
      method: 'POST',
      // text/plain membantu menghindari preflight CORS untuk body JSON.
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ a, tok, ...p })
    });
    raw = await response.text();
  } catch (e) {
    console.error('Gagal menghubungi Google Apps Script:', e);
    return {
      data: null,
      error: {
        message: 'Tidak bisa menghubungi server Apps Script. Periksa koneksi, URL SCRIPT_URL, dan deployment Web App (Execute as: Me; akses: Anyone). Detail: ' + (e?.message || e)
      }
    };
  }

  try {
    j = JSON.parse(raw);
  } catch (e) {
    const preview = raw.trim().replace(/\s+/g, ' ').slice(0, 240);
    console.error('Respons Apps Script bukan JSON yang valid:', {
      status: response.status,
      url: SCRIPT_URL,
      contentType: response.headers.get('content-type'),
      response: raw.slice(0, 1000)
    });
    return {
      data: null,
      error: {
        message: 'Server tidak mengembalikan JSON yang valid (HTTP ' + response.status + '). Pastikan URL adalah URL Web App yang berakhiran /exec dan deployment terbaru sudah aktif. Awal respons: ' + (preview || '[respons kosong]')
      }
    };
  }

  if (!response.ok && !j.error) {
    return { data: null, error: { message: 'Server mengembalikan HTTP ' + response.status } };
  }

  if (j?.error?.code === 'AUTH') {
    clear();
    if (cb) cb('SIGNED_OUT', 'Sesi habis atau tidak valid, silakan login ulang.');
  }
  return j;
}

class Q {
  constructor(t) { this.p = { t, op: 'select', f: [] }; }
  select(c, o) { if (this.p.op === 'select' && o?.head) this.p.head = 1; return this; }
  insert(d) { this.p.op = 'insert'; this.p.d = d; return this; }
  update(d) { this.p.op = 'update'; this.p.d = d; return this; }
  delete() { this.p.op = 'delete'; return this; }
  f(k, o, v) { this.p.f.push([k, o, v]); return this; }
  eq(k, v) { return this.f(k, 'eq', v); }
  neq(k, v) { return this.f(k, 'neq', v); }
  gte(k, v) { return this.f(k, 'gte', v); }
  lte(k, v) { return this.f(k, 'lte', v); }
  lt(k, v) { return this.f(k, 'lt', v); }
  in(k, v) { return this.f(k, 'in', v); }
  match(o) { for (const k in o) this.eq(k, o[k]); return this; }
  or(s) { this.p.or = s; return this; }
  order(k, o) { this.p.ord = [k, o?.ascending !== false]; return this; }
  range(a, b) { this.p.range = [a, b]; return this; }
  limit(n) { this.p.range = [0, n - 1]; return this; }
  single() { this.p.single = 1; return this; }
  then(res, rej) { return call('q', this.p).then(res, rej); }
}

const blob64 = b => new Promise((resolve, reject) => {
  const f = new FileReader();
  f.onload = () => resolve(String(f.result).split(',')[1]);
  f.onerror = () => reject(new Error('Gagal membaca file foto.'));
  f.readAsDataURL(b);
});

export const createClient = () => ({
  auth: {
    onAuthStateChange(f) { cb = f; },
    getSession: async () => ({ data: { session: tok && ME ? { user: ME } : null } }),
    signInWithPassword: async ({ email, password }) => {
      const j = await call('login', { u: String(email || '').split('@')[0], pw: password });
      if (j?.error) return { error: j.error };
      if (!j?.token || !j?.user) {
        return { error: { message: 'Respons login tidak lengkap. Periksa deployment Apps Script dan fungsi login.' } };
      }
      tok = j.token;
      ME = j.user;
      try {
        localStorage.setItem('tk', tok);
        localStorage.setItem('me', JSON.stringify(ME));
      } catch (e) {
        console.warn('Sesi tidak dapat disimpan ke localStorage:', e);
      }
      return { error: null };
    },
    signOut: async () => { clear(); if (cb) cb('SIGNED_OUT'); },
    updateUser: async ({ password }) => {
      const j = await call('pw', { pw: password });
      return { error: j?.error || null };
    }
  },
  from: t => new Q(t),
  rpc: (a, p) => call(a, p || {}),
  storage: {
    from: () => ({
      upload: async (name, b) => {
        try { const j = await call('up', { name, b64: await blob64(b) }); return { error: j?.error || null }; }
        catch (e) { return { error: { message: e?.message || 'Gagal mengunggah foto.' } }; }
      },
      remove: async names => {
        const j = await call('rm', { names });
        return { error: j?.error || null };
      },
      createSignedUrls: async names => {
        const j = await call('photos', { names });
        return { data: (j?.urls || []).map(u => ({ signedUrl: u })) , error: j?.error || null };
      }
    })
  }
});
