import {createClient} from './api.js?v=7';
import {SCRIPT_URL as URL_, LOGIN_DOMAIN as DOM} from './config.js?v=7';
import {MODS, NAV, ST} from './modules.js?v=7';
import {renderReport} from './reports.js?v=7';
const sb=createClient();
const $=s=>document.querySelector(s), main=$('#main'); let me=null;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const toast=(m,e)=>{const t=$('#toast');t.textContent=m;t.className=e?'err show':'show';clearTimeout(t.h);t.h=setTimeout(()=>t.className='',4000)};
const fmt=v=>v==null?'':/^\d{4}-\d\d-\d\dT/.test(v)?new Date(v).toLocaleString('id-ID',{timeZone:'Asia/Jakarta'}):v;
const wib=v=>new Date(v).toLocaleString('sv-SE',{timeZone:'Asia/Jakarta'}).slice(0,16).replace(' ','T');
const isAdmin=()=>me.role==='admin';

$('#lf').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target),L=$('#lerr');L.textContent='';
 if(!/^https:\/\/script\.google\.com\/macros\//.test(URL_)){L.textContent='SCRIPT_URL di js/config.js belum benar.';return}
 const email=f.get('u').trim().toLowerCase()+'@'+DOM,bt=e.target.querySelector('button');bt.disabled=true;bt.textContent='Memproses…';L.textContent='Menghubungi server Google, mohon tunggu (bisa beberapa detik)…';
 const {error}=await sb.auth.signInWithPassword({email,password:f.get('p')});
 bt.disabled=false;bt.textContent='Masuk';L.textContent='';
 if(error){L.textContent=(/invalid login/i.test(error.message)?'Username atau password salah':error.message);return}
 await boot()};
$('#burger').onclick=()=>$('#nav').classList.toggle('open');
sb.auth.onAuthStateChange((ev,msg)=>{if(ev==='SIGNED_OUT'){me=null;$('#app').hidden=true;$('#app').style.display='none';$('#login').hidden=false;$('#login').style.display='';if(msg)$('#lerr').textContent=msg}});
async function boot(){const {data:{session}}=await sb.auth.getSession(); if(!session)return;
 const data=session.user,error=null;
 if(error||!data){await sb.auth.signOut();$('#lerr').textContent='Login berhasil tetapi profil tidak ada/ tidak terbaca ('+(error?.message||'kosong')+'). Jalankan fungsi setup() di Apps Script.';return}
 me=data;$('#login').hidden=true;$('#login').style.display='none';$('#app').hidden=false;$('#app').style.display='';
 $('#nav').innerHTML=NAV.filter(n=>!n[2]||isAdmin()).map(n=>`<a data-k="${n[0]}" href="#${n[0]}">${n[1]}</a>`).join('')+'<a id="out">Logout</a>';
 $('#out').onclick=()=>sb.auth.signOut(); route()}
addEventListener('hashchange',()=>me&&route());
async function route(){const k=location.hash.slice(1)||'dashboard';$('#nav').classList.remove('open');
 document.querySelectorAll('#nav a').forEach(a=>a.classList.toggle('on',a.dataset.k===k));
 main.innerHTML='<p>Memuat…</p>';
 try{ if(k==='dashboard')await dash(); else if(MODS[k])await list(k,main); else if(k==='history')await history();
  else if((k==='monthly'||k==='yearly')&&isAdmin())await renderReport(sb,main,k,MODS,esc,fmt); else if(k==='account')account(); else main.innerHTML='<p>Halaman tidak tersedia / akses ditolak.</p>';
 }catch(e){main.innerHTML=`<p class="errt">${esc(e.message)}</p>`}}

async function dash(){const j=await sb.rpc('dash');if(j.error)throw Error(j.error.message);const d=j.data;
 const st=(t,n)=>`<div class="card stat">${t}<b>${n}</b></div>`,mt=r=>r?`${r.curr_value} (pakai ${r.usage}) · ${fmt(r.read_at)}`:'Belum ada';
 main.innerHTML=`<h2>Dashboard</h2><div class="grid">${st('Pengumuman aktif',d.ann)}${st('Pekerjaan bulan ini',d.wm)}${st('Selesai',d.wd)}${st('Belum selesai',d.wo)}${st('Transaksi pembelian',d.pc)}</div>
 <div class="card"><b>Tiket ATS terbaru</b>${d.tk.map(t=>`<p>${esc(t.ticket_no)} – ${esc(t.title)} <span class="bd">${t.status}</span></p>`).join('')||'<p>Tidak ada</p>'}</div>
 <div class="card"><b>Meteran air terakhir:</b> ${mt(d.w)}<br><b>Meteran listrik terakhir:</b> ${mt(d.e)}</div>
 ${isAdmin()?`<div class="card"><b>Aktivitas terbaru</b>${d.lg.map(l=>`<p>${fmt(l.created_at)} · ${l.action} ${l.table_name}</p>`).join('')||'<p>Belum ada</p>'}</div>`:''}`}

async function history(){main.innerHTML='<h2>Riwayat Laporan</h2><div class="bar"><select id="hs">'+['work_reports','purchases','water','electric'].map(k=>`<option value="${k}">${MODS[k].label}</option>`).join('')+'</select></div><div id="hb"></div>';
 const go=()=>list($('#hs').value,$('#hb'),true);$('#hs').onchange=go;go()}

function canEdit(m,r){return isAdmin()||(!m.adminOnly&&r.created_by===me.id&&(m.table!=='purchases'||r.status==='Menunggu Verifikasi'))}
async function list(k,el,hist){const m=MODS[k],S={p:0,q:'',st:'',from:'',to:'',asc:false},N=15;
 async function draw(){let q=sb.from(m.table).select('*',{count:'exact'});if(m.fixed)q=q.match(m.fixed);
  if(S.q)q=q.or(`${m.no}.ilike.%${S.q.replace(/[,()]/g,' ')}%,${m.name}.ilike.%${S.q.replace(/[,()]/g,' ')}%`);
  if(S.st)q=q.eq('status',S.st);const ts=m.dt;
  if(S.from)q=q.gte(m.d,S.from+(ts?'T00:00:00+07:00':''));if(S.to)q=q.lte(m.d,S.to+(ts?'T23:59:59+07:00':''));
  const {data,count,error}=await q.order(m.d,{ascending:S.asc}).range(S.p*N,S.p*N+N-1);if(error)return toast(error.message,1);
  $('#tb').innerHTML=(data||[]).map((r,i)=>`<tr class="r" data-i="${i}">${m.cols.map(c=>`<td>${esc(fmt(r[c]))}</td>`).join('')}</tr>`).join('')||'<tr><td>Tidak ada data</td></tr>';
  $('#tb').querySelectorAll('tr.r').forEach(tr=>tr.onclick=()=>detail(k,data[tr.dataset.i],()=>list(k,el,hist)));
  $('#pg').textContent=`Hal ${S.p+1} / ${Math.max(1,Math.ceil(count/N))} (${count} data)`;$('#pv').disabled=!S.p;$('#nx').disabled=(S.p+1)*N>=count}
 const st=m.f.find(x=>x[0]==='status')?.[3]||[];
 el.innerHTML=`${hist?'':`<h2>${m.label}</h2>`}${(!m.adminOnly||isAdmin())?`<button id="add">+ Tambah</button>`:''}<div class="bar" style="margin-top:10px"><input id="q" placeholder="Cari nomor / nama"><select id="st"><option value="">Semua status</option>${st.map(s=>`<option>${s}</option>`).join("")}</select>
 <input id="fr" type="date"><input id="to" type="date"><select id="so"><option value="0">Terbaru</option><option value="1">Terlama</option></select></div>
 <div class="tw"><table><thead><tr>${m.cols.map(c=>`<th>${m.lab[c]||c}</th>`).join('')}</tr></thead><tbody id="tb"></tbody></table></div>
 <div class="bar"><button class="sec" id="pv">‹</button><span id="pg"></span><button class="sec" id="nx">›</button></div>`;
 const rd=()=>{S.q=$('#q').value;S.st=$('#st').value;S.from=$('#fr').value;S.to=$('#to').value;S.asc=$('#so').value==='1';S.p=0;draw()};
 ['q','st','fr','to','so'].forEach(i=>el.querySelector('#'+i).onchange=rd);
 $('#pv').onclick=()=>{S.p--;draw()};$('#nx').onclick=()=>{S.p++;draw()};
 if($('#add'))$('#add').onclick=()=>form(k,null,()=>list(k,el,hist));draw()}

async function photosOf(id){const {data}=await sb.from('photos').select('*').eq('entity_id',id);if(!data?.length)return[];
 const {data:u}=await sb.storage.from('photos').createSignedUrls(data.map(p=>p.path),3600);return data.map((p,i)=>({...p,url:u?.[i]?.signedUrl}))}
async function detail(k,r,back){const m=MODS[k],ph=await photosOf(r.id);
 const slot=(kd,l)=>{const a=ph.filter(p=>p.kind===kd);return `<h4>${l} (${a.length})</h4>${a.length?'':'<div class="warn">Dokumentasi belum ada</div>'}<div class="ph">${a.map(p=>`<div><a href="${p.url}" target="_blank"><img loading="lazy" src="${p.url}"></a></div>`).join('')}</div>`};
 main.innerHTML=`<h2>${m.label}: ${esc(r[m.no])}</h2><div class="card">${m.f.map(([n,l])=>`<p><b>${l}:</b> ${esc(fmt(r[n]))}</p>`).join('')}${r.total!=null&&m.table==='purchases'?`<p><b>Total:</b> Rp ${(+r.total).toLocaleString('id-ID')}</p>`:''}${m.table==='meter_readings'?`<p><b>Pemakaian:</b> ${r.usage}</p>`:''}
 <p><small>Dibuat ${fmt(r.created_at)} · Diubah ${fmt(r.updated_at)||'-'}</small></p></div><div class="card">${(m.slots||[]).map(s=>slot(...s)).join('')}</div>
 <div class="bar"><button class="sec" id="bk">Kembali</button>${canEdit(m,r)?'<button id="ed">Edit</button>':''}${isAdmin()?'<button class="del" id="dl">Hapus</button>':''}</div>`;
 $('#bk').onclick=back;if($('#ed'))$('#ed').onclick=()=>form(k,r,back);
 if($('#dl'))$('#dl').onclick=async()=>{if(!confirm('Hapus data ini?'))return;
  if(ph.length)await sb.storage.from('photos').remove(ph.map(p=>p.path));
  const {error}=await sb.from(m.table).delete().eq('id',r.id);if(error)return toast(error.message,1);await sb.from('photos').delete().eq('entity_id',r.id);toast('Dihapus');back()}}

async function shrink(f){if(!/^image\/(jpeg|png|webp)$/.test(f.type))throw Error('Format foto harus JPG/JPEG/PNG/WEBP');if(f.size>15e6)throw Error('Foto maksimal 15 MB');
 const b=await createImageBitmap(f),s=Math.min(1,1600/Math.max(b.width,b.height)),c=document.createElement('canvas');c.width=b.width*s;c.height=b.height*s;c.getContext('2d').drawImage(b,0,0,c.width,c.height);
 return new Promise(r=>c.toBlob(r,'image/jpeg',.8))}
async function form(k,row,back){const m=MODS[k],pend={},old=row?await photosOf(row.id):[];let prev=null;
 if(m.fixed&&!row){prev=(await sb.from('meter_readings').select('curr_value').match(m.fixed).order('read_at',{ascending:false}).limit(1)).data?.[0]?.curr_value??0}
 const def=row||{...m.def?.(me,prev)};
 const fh=m.f.filter(x=>!(x[0]==='status'&&m.userNoStatus&&!isAdmin())).map(([n,l,t,o])=>{let v=def[n]??'';if(t==='datetime-local'&&v)v=wib(v);
  const i=t==='textarea'?`<textarea name="${n}" ${m.opt?.includes(n)?'':'required'}>${esc(v)}</textarea>`:t==='select'?`<select name="${n}">${o.map(x=>`<option ${x==v?'selected':''}>${x}</option>`).join('')}</select>`
  :t==='checkbox'?`<input type="checkbox" name="${n}" ${v?'checked':''}>`:`<input name="${n}" type="${t}" value="${esc(v)}" ${t==='number'?'step="any" min="0"':''} ${m.opt?.includes(n)?'':'required'}>`;return `<label>${l}${i}</label>`}).join('');
 main.innerHTML=`<h2>${row?'Edit':'Tambah'} ${m.label}</h2><form class="card f" id="fm">${fh}</form>
 ${(m.slots||[]).map(([kd,l])=>`<div class="card"><b>${l}</b><div class="ph" id="ex-${kd}">${old.filter(p=>p.kind===kd).map(p=>`<div><img loading="lazy" src="${p.url}"><button type="button" data-id="${p.id}" data-path="${p.path}">×</button></div>`).join('')}</div>
 <input type="file" id="in-${kd}" accept="image/jpeg,image/png,image/webp" multiple><div class="ph" id="pv-${kd}"></div></div>`).join('')}
 <div class="bar"><button class="sec" id="cn">Batal</button><button id="sv">Simpan</button></div>`;
 $('#cn').onclick=back;
 document.querySelectorAll('[data-path]').forEach(b=>b.onclick=async()=>{if(!confirm('Hapus foto?'))return;await sb.storage.from('photos').remove([b.dataset.path]);await sb.from('photos').delete().eq('id',b.dataset.id);b.parentElement.remove()});
 (m.slots||[]).forEach(([kd])=>{pend[kd]=[];const draw=()=>{$('#pv-'+kd).innerHTML=pend[kd].map((f,i)=>`<div><img src="${URL.createObjectURL(f)}"><button type="button" data-i="${i}">×</button></div>`).join('');
  $('#pv-'+kd).querySelectorAll('button').forEach(b=>b.onclick=()=>{pend[kd].splice(b.dataset.i,1);draw()})};
  $('#in-'+kd).onchange=e=>{for(const f of e.target.files){if(!/^image\/(jpeg|png|webp)$/.test(f.type)){toast('Format foto harus JPG/PNG/WEBP',1);continue}pend[kd].push(f)}e.target.value='';draw()}});
 $('#sv').onclick=async()=>{const fm=$('#fm');if(!fm.reportValidity())return;$('#sv').disabled=true;
  try{const d=Object.fromEntries(new FormData(fm));
   for(const [n,,t] of m.f){if(t==='checkbox')d[n]=fm.elements[n].checked;else if(n in d){if(t==='number')d[n]=+d[n];else if(t==='datetime-local')d[n]=d[n]+':00+07:00';else if(d[n]==='')d[n]=null}}
   Object.assign(d,m.fixed||{});
   if(m.fixed&&d.curr_value<d.prev_value&&!d.is_reset)throw Error('Angka saat ini lebih kecil dari sebelumnya. Periksa data atau centang "Reset/ganti meter".');
   const {data,error}=await(row?sb.from(m.table).update(d).eq('id',row.id):sb.from(m.table).insert(d)).select().single();if(error)throw error;
   let fail=0,warn='';for(const kd in pend)for(const f of pend[kd]){try{const bl=await shrink(f),p=`${me.id}/${m.table}/${data.id}/${kd}-${crypto.randomUUID()}.jpg`;
    const u=await sb.storage.from('photos').upload(p,bl,{contentType:'image/jpeg'});if(u.error)throw u.error;
    const i=await sb.from('photos').insert({entity:m.table,entity_id:data.id,kind:kd,path:p});if(i.error)throw i.error}catch(e){fail++;toast(e.message,1)}}
   if(m.slots){const n=await photosOf(data.id);const miss=m.slots.filter(([kd])=>!n.some(p=>p.kind===kd)).map(s=>s[1]);if(miss.length)warn='Tersimpan. Peringatan: dokumentasi '+miss.join(' & ')+' belum lengkap'}
   if(!fail)toast(warn||'Tersimpan',false);back()}catch(e){toast(e.message,1);$('#sv').disabled=false}}}

function account(){main.innerHTML=`<h2>Pengaturan Akun</h2><div class="card"><p>Username: <b>${esc(me.username)}</b> · Peran: <b>${me.role}</b></p>
 <form id="pw" class="f"><label>Password baru (min. 6 karakter)<input type="password" name="p" minlength="6" required></label><button>Ubah password</button></form></div>`;
 $('#pw').onsubmit=async e=>{e.preventDefault();const {error}=await sb.auth.updateUser({password:new FormData(e.target).get('p')});error?toast(error.message,1):toast('Password diubah')}}
boot();
