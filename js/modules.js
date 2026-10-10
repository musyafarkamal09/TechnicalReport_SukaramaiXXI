// Konfigurasi menu dan formulir aplikasi Technical STC XXI.
// Disusun mengikuti nama tabel dan kolom pada Code.gs.
const statusOptions = {
  announcement: ['Aktif', 'Arsip'],
  ticket: ['Open', 'In Progress', 'Pending', 'Resolved', 'Closed', 'Arsip'],
  work: ['Belum Dikerjakan', 'Sedang Dikerjakan', 'Menunggu', 'Selesai', 'Dibatalkan'],
  purchase: ['Menunggu Verifikasi', 'Disetujui', 'Ditolak']
};
const dtNow = () => new Date().toLocaleString('sv-SE', {timeZone:'Asia/Jakarta'}).slice(0,16).replace(' ','T');
const common = {opt: ['notes']};

export const ST = statusOptions;
export const NAV = [
  ['dashboard', 'Dashboard'],
  ['announcements', 'Pengumuman', true],
  ['ats_tickets', 'Tiket ATS', true],
  ['work_reports', 'Laporan Pekerjaan'],
  ['purchases', 'Pembelian Barang'],
  ['water', 'Meteran Air'],
  ['electric', 'Meteran Listrik'],
  ['history', 'Riwayat Laporan'],
  ['monthly', 'Laporan Bulanan', true],
  ['yearly', 'Laporan Tahunan', true],
  ['account', 'Pengaturan Akun']
];

export const MODS = {
  announcements: {
    label:'Pengumuman', table:'announcements', no:'title', name:'body', d:'published_at', dt:true,
    adminOnly:true, cols:['title','body','published_at','status'],
    lab:{title:'Judul',body:'Isi Pengumuman',published_at:'Tanggal Publikasi',status:'Status'},
    f:[['title','Judul','text'],['body','Isi Pengumuman','textarea'],['published_at','Tanggal Publikasi','datetime-local'],['status','Status','select',statusOptions.announcement]],
    opt:['notes'], slots:[]
  },
  ats_tickets: {
    label:'Tiket ATS', table:'ats_tickets', no:'ticket_no', name:'title', d:'ticket_at', dt:true,
    adminOnly:true, cols:['ticket_no','title','location','ticket_at','status'],
    lab:{ticket_no:'Nomor Tiket',title:'Judul',description:'Deskripsi',location:'Lokasi',ticket_at:'Tanggal Tiket',status:'Status',notes:'Catatan'},
    f:[['title','Judul','text'],['description','Deskripsi','textarea'],['location','Lokasi','text'],['ticket_at','Tanggal Tiket','datetime-local'],['status','Status','select',statusOptions.ticket],['notes','Catatan','textarea']],
    opt:['notes'], slots:[['doc','Dokumentasi']]
  },
  work_reports: {
    label:'Laporan Pekerjaan', table:'work_reports', no:'report_no', name:'title', d:'work_date', dt:false,
    cols:['report_no','title','category','location','reporter','work_date','status'],
    lab:{report_no:'Nomor Laporan',title:'Judul Pekerjaan',category:'Kategori',location:'Lokasi',description:'Deskripsi',reporter:'Pelapor',work_date:'Tanggal',start_time:'Mulai',end_time:'Selesai',status:'Status',notes:'Catatan'},
    f:[['title','Judul Pekerjaan','text'],['category','Kategori','text'],['location','Lokasi','text'],['description','Deskripsi','textarea'],['reporter','Pelapor','text'],['work_date','Tanggal Pekerjaan','date'],['start_time','Waktu Mulai','time'],['end_time','Waktu Selesai','time'],['status','Status','select',statusOptions.work],['notes','Catatan','textarea']],
    opt:['notes','end_time'], userNoStatus:true, slots:[['before','Sebelum'],['after','Sesudah']]
  },
  purchases: {
    label:'Pembelian Barang', table:'purchases', no:'purchase_no', name:'item_name', d:'purchased_at', dt:true,
    cols:['purchase_no','purchased_at','item_name','category','qty','unit','unit_price','total','store','buyer','status'],
    lab:{purchase_no:'Nomor Pembelian',purchased_at:'Tanggal Pembelian',item_name:'Nama Barang',category:'Kategori',qty:'Jumlah',unit:'Satuan',unit_price:'Harga Satuan',total:'Total',store:'Toko/Pemasok',buyer:'Pemohon',purpose:'Keperluan',notes:'Catatan',status:'Status'},
    f:[['purchased_at','Tanggal Pembelian','datetime-local'],['item_name','Nama Barang','text'],['category','Kategori','text'],['qty','Jumlah','number'],['unit','Satuan','text'],['unit_price','Harga Satuan (Rp)','number'],['store','Toko/Pemasok','text'],['buyer','Pemohon','text'],['purpose','Keperluan','textarea'],['notes','Catatan','textarea'],['status','Status','select',statusOptions.purchase]],
    opt:['notes'], userNoStatus:true, sum:'total', slots:[['proof','Bukti Pembelian']]
  },
  water: {
    label:'Meteran Air', table:'meter_readings', no:'reading_no', name:'officer', d:'read_at', dt:true,
    fixed:{kind:'water'}, cols:['reading_no','read_at','prev_value','curr_value','usage','officer','notes'],
    lab:{reading_no:'Nomor Meteran',read_at:'Tanggal Pencatatan',prev_value:'Angka Sebelumnya',curr_value:'Angka Saat Ini',usage:'Pemakaian',officer:'Petugas',is_reset:'Reset/Ganti Meter',notes:'Catatan'},
    f:[['read_at','Tanggal Pencatatan','datetime-local'],['prev_value','Angka Sebelumnya','number'],['curr_value','Angka Saat Ini','number'],['is_reset','Reset/Ganti Meter','checkbox'],['officer','Petugas','text'],['notes','Catatan','textarea']],
    opt:['notes'], slots:[], def:(me,prev)=>({kind:'water',read_at:dtNow(),prev_value:prev??0,curr_value:'',is_reset:false,officer:me?.full_name||''})
  },
  electric: {
    label:'Meteran Listrik', table:'meter_readings', no:'reading_no', name:'officer', d:'read_at', dt:true,
    fixed:{kind:'electric'}, cols:['reading_no','read_at','prev_value','curr_value','usage','officer','notes'],
    lab:{reading_no:'Nomor Meteran',read_at:'Tanggal Pencatatan',prev_value:'Angka Sebelumnya',curr_value:'Angka Saat Ini',usage:'Pemakaian',officer:'Petugas',is_reset:'Reset/Ganti Meter',notes:'Catatan'},
    f:[['read_at','Tanggal Pencatatan','datetime-local'],['prev_value','Angka Sebelumnya','number'],['curr_value','Angka Saat Ini','number'],['is_reset','Reset/Ganti Meter','checkbox'],['officer','Petugas','text'],['notes','Catatan','textarea']],
    opt:['notes'], slots:[], def:(me,prev)=>({kind:'electric',read_at:dtNow(),prev_value:prev??0,curr_value:'',is_reset:false,officer:me?.full_name||''})
  }
};
