const csv=(rows,cols)=>[cols.join(','),...rows.map(r=>cols.map(c=>`"${String(r[c]??'').replace(/"/g,'""')}"`).join(','))].join('\n');
export async function renderReport(sb,el,mode,MODS,esc,fmt){const Y=new Date().getFullYear(),mo=mode==='monthly';
 el.innerHTML=`<h2>Laporan ${mo?'Bulanan':'Tahunan'}</h2><div class="bar"><select id="y">${[0,1,2,3].map(i=>`<option>${Y-i}</option>`).join("")}</select>
 ${mo?'<select id="m">'+Array.from({length:12},(_,i)=>`<option value="${i+1}" ${i===new Date().getMonth()?'selected':''}>${String(i+1).padStart(2,'0')}</option>`).join('')+'</select>':''}
 <select id="k">${['work_reports','purchases','water','electric'].map(k=>`<option value="${k}">${MODS[k].label}</option>`).join('')}</select><button id="go">Tampilkan</button><button class="sec" id="c">CSV</button><button class="sec" id="p">PDF / Cetak</button></div><div id="o"></div>`;
 let cur=null;const p2=n=>String(n).padStart(2,'0');
 el.querySelector('#go').onclick=async()=>{const k=el.querySelector('#k').value,m=MODS[k],y=+el.querySelector('#y').value,mn=mo?+el.querySelector('#m').value:0;
  const a=mo?`${y}-${p2(mn)}-01`:`${y}-01-01`,nx=mo?(mn===12?`${y+1}-01-01`:`${y}-${p2(mn+1)}-01`):`${y+1}-01-01`,z=m.dt?'T00:00:00+07:00':'';
  let q=sb.from(m.table).select('*').gte(m.d,a+z).lt(m.d,nx+z).order(m.d);if(m.fixed)q=q.match(m.fixed);const {data,error}=await q;if(error)return el.querySelector('#o').textContent=error.message;
  const ph=(await sb.from('photos').select('entity_id,kind').in('entity_id',data.map(r=>r.id).concat(['00000000-0000-0000-0000-000000000000']))).data||[];
  const rows=data.map(r=>({...r,foto:['before','after','proof','doc'].map(t=>{const n=ph.filter(x=>x.entity_id===r.id&&x.kind===t).length;return n?t+':'+n:''}).filter(Boolean).join(' ')}));
  const cols=[...m.cols,...m.f.map(f=>f[0]).filter(c=>!m.cols.includes(c)),'foto'];cur={rows,cols,name:`${m.label}_${y}${mo?'_'+p2(mn):''}`};
  const sum=m.sum?rows.reduce((s,r)=>s+(+r[m.sum]||0),0):null;
  let by='';if(!mo){const g={};rows.forEach(r=>{const mm=new Date(r[m.d]).toLocaleDateString('sv-SE',{timeZone:'Asia/Jakarta'}).slice(5,7);g[mm]=g[mm]||{n:0,s:0};g[mm].n++;g[mm].s+=+r[m.sum]||0});
   const mx=Math.max(1,...Object.values(g).map(v=>m.sum?v.s:v.n));
   by=`<table><tr><th>Bulan</th><th>Jumlah</th>${m.sum?'<th>'+m.sum+'</th>':''}<th></th></tr>${Object.keys(g).sort().map(b=>`<tr><td>${b}</td><td>${g[b].n}</td>${m.sum?`<td>${g[b].s.toLocaleString('id-ID')}</td>`:''}<td><div style="background:#b89b53;height:10px;width:${Math.round((m.sum?g[b].s:g[b].n)/mx*200)}px"></div></td></tr>`).join('')}</table>`}
  el.querySelector('#o').innerHTML=`<div class="card"><h3>${m.label} – Unit Kerja: Technical Sukaramai Trade Center XXI</h3><p>Periode: ${y}${mo?'-'+p2(mn):''} · Dibuat: ${new Date().toLocaleString('id-ID',{timeZone:'Asia/Jakarta'})}</p>
  <p><b>Jumlah data: ${rows.length}</b>${sum!=null?` · <b>Total ${m.lab[m.sum]||m.sum}: ${sum.toLocaleString('id-ID')}</b>`:''}</p>${by}</div>
  <div class="tw"><table><tr>${cols.map(c=>`<th>${esc(m.lab[c]||c)}</th>`).join('')}</tr>${rows.map(r=>`<tr>${cols.map(c=>`<td>${esc(fmt(r[c]))}</td>`).join('')}</tr>`).join('')}</table></div>`};
 el.querySelector('#c').onclick=()=>{if(!cur)return;const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+csv(cur.rows,cur.cols)],{type:'text/csv'}));a.download=cur.name+'.csv';a.click()};
 el.querySelector('#p').onclick=()=>cur?print():0}
