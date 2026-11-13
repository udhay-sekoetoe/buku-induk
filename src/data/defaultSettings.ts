import { BukuIndukSettings, RolePermissions, UserRole, AppUser, MapelConfigItem } from '../types';

export const DEFAULT_LOGO_DKI = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 110" width="100" height="110">
  <defs>
    <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f8fafc"/>
      <stop offset="100%" stop-color="#e2e8f0"/>
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24"/>
      <stop offset="100%" stop-color="#b45309"/>
    </linearGradient>
    <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2563eb"/>
      <stop offset="100%" stop-color="#1e3a8a"/>
    </linearGradient>
  </defs>
  <path d="M50 5 L88 20 L88 65 Q88 95 50 105 Q12 95 12 65 L12 20 Z" fill="url(#shieldGrad)" stroke="#1e3a8a" stroke-width="3"/>
  <path d="M50 10 L83 23 L83 63 Q83 90 50 99 Q17 90 17 63 L17 23 Z" fill="none" stroke="url(#goldGrad)" stroke-width="2"/>
  <path d="M22 45 Q50 35 78 45 L78 63 Q78 86 50 94 Q22 86 22 63 Z" fill="url(#blueGrad)"/>
  <path d="M47 30 L53 30 L52 50 L56 50 L58 68 L42 68 L44 50 L48 50 Z" fill="#ffffff" stroke="#cbd5e1" stroke-width="0.5"/>
  <ellipse cx="50" cy="28" rx="2.5" ry="4" fill="url(#goldGrad)"/>
  <path d="M22 75 Q50 70 78 75 L76 83 Q50 78 24 83 Z" fill="#ffffff" stroke="#b45309" stroke-width="1"/>
  <text x="50" y="81" font-family="sans-serif" font-size="5.5" font-weight="900" text-anchor="middle" fill="#b45309" letter-spacing="1">JAYA RAYA</text>
  <text x="50" y="18" font-family="sans-serif" font-size="4.5" font-weight="bold" text-anchor="middle" fill="#1e3a8a">DKI JAKARTA</text>
</svg>
`)}`;

// Logo resmi SMP Negeri 99 Jakarta (file lokal hasil unggahan)
export const DEFAULT_LOGO_SMPN99 = '/assets/aistudio/logo402_b225587b.png';

export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  SUPER_ADMIN: {
    lihatDashboard: true,
    tambahEditSiswa: true,
    hapusSiswa: true,
    inputNilaiRapor: true,
    verifikasiDokumen: true,
    prosesMutasi: true,
    cetakBukuInduk: true,
    imporEksporData: true,
    kelolaPengaturan: true,
    kelolaAkun: true,
    approvePermohonan: true,
  },
  ADMIN: {
    // Role Tata Usaha (TU)
    lihatDashboard: true,
    tambahEditSiswa: true,
    hapusSiswa: false,
    inputNilaiRapor: false,
    verifikasiDokumen: true,
    prosesMutasi: true,
    cetakBukuInduk: true,
    imporEksporData: true,
    kelolaPengaturan: true,
    kelolaAkun: false,
    approvePermohonan: false,
  },
  OPERATOR_TU: {
    // Role Operator Data / Dapodik / Legger
    lihatDashboard: true,
    tambahEditSiswa: true,
    hapusSiswa: false,
    inputNilaiRapor: true,
    verifikasiDokumen: false,
    prosesMutasi: false,
    cetakBukuInduk: true,
    imporEksporData: true,
    kelolaPengaturan: false,
    kelolaAkun: false,
    approvePermohonan: false,
  },
  HOMEROOM_TEACHER: {
    // Role Wali Kelas
    lihatDashboard: true,
    tambahEditSiswa: false,
    hapusSiswa: false,
    inputNilaiRapor: true,
    verifikasiDokumen: false,
    prosesMutasi: false,
    cetakBukuInduk: true,
    imporEksporData: false,
    kelolaPengaturan: false,
    kelolaAkun: false,
    approvePermohonan: false,
  },
  VERIFIER: {
    // Role Verifikator Berkas
    lihatDashboard: true,
    tambahEditSiswa: false,
    hapusSiswa: false,
    inputNilaiRapor: false,
    verifikasiDokumen: true,
    prosesMutasi: false,
    cetakBukuInduk: true,
    imporEksporData: false,
    kelolaPengaturan: false,
    kelolaAkun: false,
    approvePermohonan: false,
  },
  KEPALA_SEKOLAH: {
    lihatDashboard: true,
    tambahEditSiswa: false,
    hapusSiswa: false,
    inputNilaiRapor: false,
    verifikasiDokumen: true,
    prosesMutasi: false,
    cetakBukuInduk: true,
    imporEksporData: true,
    kelolaPengaturan: false,
    kelolaAkun: false,
    approvePermohonan: false,
  },
};

export const DEFAULT_USER_PASSWORD = 'smpn992026';

export const DEFAULT_MAPEL_CONFIG: MapelConfigItem[] = [
  { id: 'mp-01', kodeDapodik: 'PABP', nama: 'Pendidikan Agama dan Budi Pekerti', kategori: 'WAJIB', kktp: 75, aktif: true, urutan: 1 },
  { id: 'mp-02', kodeDapodik: 'PPKN', nama: 'Pendidikan Pancasila', kategori: 'WAJIB', kktp: 75, aktif: true, urutan: 2 },
  { id: 'mp-03', kodeDapodik: 'BIND', nama: 'Bahasa Indonesia', kategori: 'WAJIB', kktp: 75, aktif: true, urutan: 3 },
  { id: 'mp-04', kodeDapodik: 'MTK', nama: 'Matematika', kategori: 'WAJIB', kktp: 75, aktif: true, urutan: 4 },
  { id: 'mp-05', kodeDapodik: 'IPA', nama: 'Ilmu Pengetahuan Alam', kategori: 'WAJIB', kktp: 75, aktif: true, urutan: 5 },
  { id: 'mp-06', kodeDapodik: 'IPS', nama: 'Ilmu Pengetahuan Sosial', kategori: 'WAJIB', kktp: 75, aktif: true, urutan: 6 },
  { id: 'mp-07', kodeDapodik: 'BING', nama: 'Bahasa Inggris', kategori: 'WAJIB', kktp: 75, aktif: true, urutan: 7 },
  { id: 'mp-08', kodeDapodik: 'PJOK', nama: 'Pendidikan Jasmani, Olahraga dan Kesehatan', kategori: 'WAJIB', kktp: 75, aktif: true, urutan: 8 },
  { id: 'mp-09', kodeDapodik: 'INFO', nama: 'Informatika', kategori: 'WAJIB', kktp: 75, aktif: true, urutan: 9 },
  { id: 'mp-10a', kodeDapodik: 'SENI-MUS', nama: 'Seni Musik', kategori: 'SENI_PRAKARYA', kktp: 75, aktif: true, urutan: 10 },
  { id: 'mp-10b', kodeDapodik: 'SENI-RUP', nama: 'Seni Rupa', kategori: 'SENI_PRAKARYA', kktp: 75, aktif: true, urutan: 11 },
  { id: 'mp-10c', kodeDapodik: 'SENI-TEA', nama: 'Seni Teater', kategori: 'SENI_PRAKARYA', kktp: 75, aktif: false, urutan: 12 },
  { id: 'mp-10d', kodeDapodik: 'SENI-TAR', nama: 'Seni Tari', kategori: 'SENI_PRAKARYA', kktp: 75, aktif: false, urutan: 13 },
  { id: 'mp-10e', kodeDapodik: 'PKY', nama: 'Prakarya (Budi Daya / Rekayasa)', kategori: 'SENI_PRAKARYA', kktp: 75, aktif: true, urutan: 14 },
  { id: 'mp-11', kodeDapodik: 'BK', nama: 'Bimbingan dan Konseling', kategori: 'BK', kktp: 75, aktif: true, urutan: 15 },
  { id: 'mp-12a', kodeDapodik: 'MULOK-PLBJ', nama: 'Muatan Lokal: PLBJ (Pendidikan Lingkungan & Budaya Jakarta)', kategori: 'MULOK', kktp: 75, aktif: true, urutan: 16 },
  { id: 'mp-12b', kodeDapodik: 'MULOK-BHS', nama: 'Muatan Lokal: Keterampilan Bahasa & Budaya Daerah', kategori: 'MULOK', kktp: 75, aktif: true, urutan: 17 },
];

export const DEFAULT_APP_USERS: AppUser[] = [
  {
    id: 'usr-01',
    nama: 'Antonius Purnomo, S.Pd.',
    nip: '19860512 201001 1 009',
    email: 'antoniuspurnomo61@guru.smp.belajar.id',
    password: DEFAULT_USER_PASSWORD,
    role: 'SUPER_ADMIN',
    jabatan: 'Super Admin & Penanggung Jawab Buku Induk',
    aktif: true,
  },
  {
    id: 'usr-02',
    nama: 'Bambang Supriyanto, S.Sos.',
    nip: '19740921 200604 1 005',
    email: 'bambang.tu@smpn99jakarta.sch.id',
    password: DEFAULT_USER_PASSWORD,
    role: 'ADMIN',
    jabatan: 'Staf / Kepala Urusan Tata Usaha (TU)',
    aktif: true,
  },
  {
    id: 'usr-03',
    nama: 'Rizky Ramadhan, S.Kom.',
    nip: '19910410 201903 1 004',
    email: 'operator.dapodik@smpn99jakarta.sch.id',
    password: DEFAULT_USER_PASSWORD,
    role: 'OPERATOR_TU',
    jabatan: 'Operator Dapodik & Legger Nilai',
    aktif: true,
  },
  {
    id: 'usr-04',
    nama: 'Hj. Ratna Dewi, M.Pd.',
    nip: '19790415 200604 2 012',
    email: 'ratna.dewi@guru.smp.belajar.id',
    password: DEFAULT_USER_PASSWORD,
    role: 'HOMEROOM_TEACHER',
    jabatan: 'Wali Kelas 7A',
    rombelBinaan: '7A',
    aktif: true,
  },
  {
    id: 'usr-05',
    nama: 'Drs. Hendro Wibowo',
    nip: '19740310 200212 1 003',
    email: 'hendro.wibowo@guru.smp.belajar.id',
    password: DEFAULT_USER_PASSWORD,
    role: 'HOMEROOM_TEACHER',
    jabatan: 'Wali Kelas 8A',
    rombelBinaan: '8A',
    aktif: true,
  },
  {
    id: 'usr-06',
    nama: 'Sri Wahyuni, S.Pd.',
    nip: '19810825 200801 2 015',
    email: 'sri.wahyuni@guru.smp.belajar.id',
    password: DEFAULT_USER_PASSWORD,
    role: 'HOMEROOM_TEACHER',
    jabatan: 'Wali Kelas 9A',
    rombelBinaan: '9A',
    aktif: true,
  },
  {
    id: 'usr-07',
    nama: 'Siti Aminah, S.Pd.',
    nip: '19880319 201403 2 002',
    email: 'verifikator.tu@smpn99jakarta.sch.id',
    password: DEFAULT_USER_PASSWORD,
    role: 'VERIFIER',
    jabatan: 'Verifikator Berkas Kesiswaan',
    aktif: true,
  },
  {
    id: 'usr-08',
    nama: 'Drs. H. Sukamto, M.Pd.',
    nip: '19680514 199512 1 002',
    email: 'kepsek@smpn99jakarta.sch.id',
    password: DEFAULT_USER_PASSWORD,
    role: 'KEPALA_SEKOLAH',
    jabatan: 'Kepala SMP Negeri 99 Jakarta',
    aktif: true,
  },
];

export const DEFAULT_BUKU_INDUK_SETTINGS: BukuIndukSettings = {
  // Pejabat Sekolah & Pengesahan
  kepalaSekolah: 'Drs. H. Sukamto, M.Pd.',
  nipKepalaSekolah: '19680514 199512 1 002',
  kepalaTu: 'Bambang Supriyanto, S.Sos.',
  nipKepalaTu: '19740921 200604 1 005',
  namaPengawas: 'Dr. Hj. Sri Mulyani, M.Pd.',
  nipPengawas: '19660312 199103 2 004',

  // Tahun & Titimangsa
  tahunAjaranAktif: '2026/2027',
  semesterAktif: 'Ganjil',
  tanggalCetakMode: 'OTOMATIS',
  tanggalCetakKustom: '12 November 2026',
  kotaTitimangsa: 'Jakarta',

  // Kop Surat & Branding
  tampilkanKopSurat: true,
  tampilkanLogoDinas: true,
  tampilkanLogoSekolah: true,
  gayaGarisKop: 'GANDA',
  ukuranLogoPx: 56,
  headerKopBaris1: 'PEMERINTAH PROVINSI DAERAH KHUSUS IBUKOTA JAKARTA',
  headerKopBaris2: 'DINAS PENDIDIKAN',
  headerKopBaris3: 'SEKOLAH MENENGAH PERTAMA NEGERI 99 JAKARTA',
  headerKopAlamat: 'Jalan Utan Kayu Raya No. 21, Matraman, Jakarta Timur 13120',
  headerKopKontak: 'Telepon: (021) 8580642 · Email: smpn99jakarta@gmail.com · NPSN: 20103565',
  logoSekolahUrl: DEFAULT_LOGO_SMPN99,
  logoDinasUrl: DEFAULT_LOGO_DKI,

  // Pengaturan Tanda Tangan Bagian Kiri & Bagian Kanan
  tandaTangan: {
    kiri: {
      tampilkan: true,
      teksAtas: 'Mengetahui,',
      gunakanTitimangsa: false,
      jabatanPreset: 'WALI_KELAS',
      labelJabatan: 'Wali Kelas',
      namaKustom: '',
      nipKustom: '',
      tampilkanNip: true,
      tampilkanStempelArea: false,
    },
    kanan: {
      tampilkan: true,
      teksAtas: 'Mengetahui,',
      gunakanTitimangsa: true,
      jabatanPreset: 'KEPALA_SEKOLAH',
      labelJabatan: 'Kepala SMPN 99 Jakarta',
      namaKustom: '',
      nipKustom: '',
      tampilkanNip: true,
      tampilkanStempelArea: true,
    },
    tampilkanTengahPengawas: true,
  },

  // Tata Letak Cetak
  tataLetak: {
    ukuranKertas: 'A4',
    margin: 'STANDAR',
    tampilkanKotakFoto: true,
    tampilkanPengawasPemeriksa: true,
  },

  // Daftar Wali Kelas
  daftarWaliKelas: [
    { rombel: '7A', nama: 'Hj. Ratna Dewi, M.Pd.', nip: '19790415 200604 2 012' },
    { rombel: '7B', nama: 'Ahmad Syafi\'i, S.Pd.', nip: '19820718 200902 1 003' },
    { rombel: '7C', nama: 'Nurul Hidayati, S.Pd.', nip: '19850110 201101 2 007' },
    { rombel: '7D', nama: 'Budi Santoso, S.Si.', nip: '19780625 200501 1 008' },
    { rombel: '8A', nama: 'Drs. Hendro Wibowo', nip: '19740310 200212 1 003' },
    { rombel: '8B', nama: 'Dewi Lestari, M.Pd.', nip: '19801120 200801 2 014' },
    { rombel: '8C', nama: 'M. Fajar Nugroho, S.Pd.', nip: '19830514 201001 1 011' },
    { rombel: '8D', nama: 'Eka Purwanti, S.Pd.', nip: '19860902 201101 2 016' },
    { rombel: '9A', nama: 'Sri Wahyuni, S.Pd.', nip: '19810825 200801 2 015' },
    { rombel: '9B', nama: 'Ir. Agus Supriyadi, M.Kom.', nip: '19710408 199802 1 002' },
    { rombel: '9C', nama: 'Rina Marlina, S.Pd.', nip: '19840216 200903 2 006' },
    { rombel: '9D', nama: 'Drs. Supardi, M.M.', nip: '19671205 199303 1 004' },
  ],

  // Pengaturan Mata Pelajaran & Dapodik
  pengaturanMapel: DEFAULT_MAPEL_CONFIG,

  // Pengguna & Hak Akses
  activeUserId: 'usr-01',
  pengguna: DEFAULT_APP_USERS,
  hakAksesPeran: DEFAULT_ROLE_PERMISSIONS,
};
