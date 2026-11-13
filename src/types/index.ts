export type StudentStatus = 'AKTIF' | 'MUTASI_KELUAR' | 'LULUS' | 'DIKELUARKAN';
export type TingkatKelas = 'VII' | 'VIII' | 'IX';
export type Gender = 'L' | 'P';
export type Agama = 'Islam' | 'Kristen Protestan' | 'Katolik' | 'Hindu' | 'Buddha' | 'Konghucu' | 'Lainnya';
export type JalurPenerimaan = 'Zonasi' | 'Afirmasi' | 'Prestasi Akademik' | 'Prestasi Non-Akademik' | 'Pindah Tugas Orang Tua';
export type VerificationStatus = 'TERVERIFIKASI' | 'MENUNGGU_VERIFIKASI' | 'DITOLAK' | 'PERLU_PERBAIKAN';
export type UserRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'OPERATOR_TU'
  | 'VERIFIER'
  | 'HOMEROOM_TEACHER'
  | 'KEPALA_SEKOLAH';

export interface ClassHistoryItem {
  id: string;
  tahunAjaran: string; // e.g. "2024/2025"
  tingkat: TingkatKelas;
  rombel: string; // e.g. "7A", "8B"
  waliKelas: string;
  semester: 'Ganjil' | 'Genap';
  kehadiranSakit?: number;
  kehadiranIzin?: number;
  kehadiranTanpaKeterangan?: number;
  statusKenaikan: string; // e.g. "Naik ke Kelas VIII", "Lulus"
}

export interface DocumentRecord {
  id: string;
  studentId: string;
  jenisDokumen: 'Akta Kelahiran' | 'Kartu Keluarga' | 'Ijazah SD/MI' | 'SKL / SKHUN' | 'Pas Foto Resmi' | 'KIP / PIP' | 'Surat Keterangan Pindah';
  fileName: string;
  fileSize: string;
  uploadDate: string;
  uploaderName: string;
  statusVerifikasi: VerificationStatus;
  catatan?: string;
}

export interface MutationRecord {
  id: string;
  studentId: string;
  jenis: 'MUTASI_KELUAR' | 'LULUS' | 'MUTASI_MASUK';
  tanggal: string;
  noSurat: string;
  alasan: string;
  sekolahTujuan?: string;
  sekolahAsal?: string;
  kelasSaatKeluar: string;
  disetujuiOleh: string;
  catatan?: string;
}

export interface Student {
  id: string;
  // Identitas Pokok
  nis: string; // Nomor Induk Siswa Sekolah, misal 232407001
  nisn: string; // 10 digit, misal 0108923451
  nik?: string; // 16 digit NIK Dukcapil
  namaLengkap: string;
  namaPanggilan: string;
  jenisKelamin: Gender;
  tempatLahir: string;
  tanggalLahir: string; // YYYY-MM-DD
  agama: Agama;
  kewarganegaraan: string;
  anakKe: number;
  jumlahSaudaraKandung: number;
  jumlahSaudaraTiri?: number;
  jumlahSaudaraAngkat?: number;
  statusYatimPiatu?: 'Bukan Yatim/Piatu' | 'Yatim' | 'Piatu' | 'Yatim Piatu';
  statusAnak: 'Kandung' | 'Tiri' | 'Angkat';
  bahasaSehariHari: string;
  pasFotoUrl?: string;

  // Fisik & Kesehatan
  golonganDarah: 'A' | 'B' | 'AB' | 'O' | '-';
  tinggiBadanCm: number;
  beratBadanKg: number;
  riwayatPenyakit?: string;
  penyakitLain?: string;
  kelainanJasmani?: string;

  // Alamat & Kontak
  alamatJalan: string;
  rt: string;
  rw: string;
  kelurahan: string;
  kecamatan: string;
  kotaKabupaten: string;
  provinsi: string;
  kodePos: string;
  tinggalDengan: 'Orang Tua' | 'Wali' | 'Asrama' | 'Kost' | 'Lainnya';
  jarakKeSekolahKm: number;
  transportasi: 'Jalan Kaki' | 'Sepeda' | 'Sepeda Motor' | 'Angkutan Umum' | 'Ojek Online' | 'Kendaraan Pribadi';
  noTeleponRumah?: string;
  noHpSiswa?: string;

  // Orang Tua Kandung
  ayah: {
    nama: string;
    nik?: string;
    tempatLahir: string;
    tanggalLahir: string;
    agama: Agama;
    kewarganegaraan: string;
    pendidikanTerakhir: string;
    pekerjaan: string;
    penghasilan?: string;
    alamat?: string;
    noHp: string;
    status: 'Masih Hidup' | 'Meninggal';
  };
  ibu: {
    nama: string;
    nik?: string;
    tempatLahir: string;
    tanggalLahir: string;
    agama: Agama;
    kewarganegaraan: string;
    pendidikanTerakhir: string;
    pekerjaan: string;
    penghasilan?: string;
    alamat?: string;
    noHp: string;
    status: 'Masih Hidup' | 'Meninggal';
  };
  wali?: {
    nama: string;
    nik?: string;
    tempatLahir?: string;
    tanggalLahir?: string;
    agama?: string;
    kewarganegaraan?: string;
    pendidikanTerakhir?: string;
    hubunganKeluarga: string;
    pekerjaan: string;
    penghasilan?: string;
    noHp: string;
    alamat: string;
    statusHidup?: string;
  };

  // Kegemaran Peserta Didik
  kegemaran?: {
    seni?: string;
    olahRaga?: string;
    lainLain?: string;
  };

  // Beasiswa & Prestasi
  beasiswa?: Array<{
    jenis: string;
    keterangan: string;
    tahunMulai: string;
    tahunSelesai: string;
  }>;
  prestasiDetail?: Array<{
    jenis: string;
    tingkat: string;
    nama: string;
    tahun: string;
    penyelenggara: string;
    peringkat: string;
  }>;

  // Sekolah Asal (SD / MI)
  sekolahAsal: {
    namaSd: string;
    npsnSd: string;
    alamatSd: string;
    tahunLulusSd: string;
    noIjazahSd: string;
    noSklSd: string;
  };

  // Penerimaan di SMP Negeri 99 Jakarta
  penerimaan: {
    tanggalDiterima: string;
    tingkatAwal: TingkatKelas;
    rombelAwal: string;
    jalurPenerimaan: JalurPenerimaan;
  };

  // Status Akademik Berjalan
  status: StudentStatus;
  tingkat: TingkatKelas;
  rombel: string; // e.g. "7A", "7B", "8A", "9A"
  tahunAjaranMasuk: string; // e.g. "2023/2024"
  tahunAjaranSekarang: string; // e.g. "2024/2025"
  nomorUrutPresensi?: number;

  // Riwayat Kenaikan & Dokumen
  riwayatKelas: ClassHistoryItem[];
  dokumen: DocumentRecord[];
  mutasi?: MutationRecord;
  ekstrakurikuler?: string[];
  prestasi?: string[];

  // Riwayat Nilai Rapor Semester 1 s/d Semester 6 (Kurikulum Merdeka)
  riwayatNilai?: Record<number, SemesterGradesRecord>;

  // Meta
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
}

export interface MataPelajaranNilai {
  no: number;
  subCode?: string;
  isSubItem?: boolean;
  nama: string;
  nilaiAkhir: number;
  kktp: number;
  capaianPembelajaran: string;
}

export interface P5DimensiItem {
  no: number;
  dimensi: string;
  elemen: string;
  subElemen: string;
  targetCapaian: string;
}

export interface P5Record {
  tema1: string;
  tema2: string;
  tema3?: string;
  dimensiList: P5DimensiItem[];
}

export interface EkstrakurikulerNilai {
  no: number;
  nama: string;
  keterangan: string;
}

export interface PrestasiRaporItem {
  no: number;
  jenis: string;
  tingkat: string;
  nama: string;
  tahun: string;
  penyelenggara: string;
  peringkat: string;
}

export interface Ketidakhadiran {
  sakit: number;
  izin: number;
  tanpaKeterangan: number;
}

export interface SemesterGradesRecord {
  semesterNumber: number; // 1, 2, 3, 4, 5, 6
  kelas: string; // e.g. "VII.1"
  tingkat: TingkatKelas;
  semesterType: 'Ganjil' | 'Genap';
  fase: 'D';
  tahunPelajaran: string; // e.g. "2023/2024"
  tanggalRapor: string; // e.g. "22 Desember 2023"
  waliKelas: string;
  nipWaliKelas?: string;
  mataPelajaran: MataPelajaranNilai[];
  p5?: P5Record;
  ekstrakurikuler?: EkstrakurikulerNilai[];
  prestasi?: PrestasiRaporItem[];
  ketidakhadiran: Ketidakhadiran;
  catatanAkademik?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  operatorEmail: string;
  operatorName: string;
  role: UserRole;
  action:
    | 'TAMBAH_SISWA'
    | 'UPDATE_BIODATA'
    | 'MUTASI_SISWA'
    | 'VERIFIKASI_BERKAS'
    | 'CETAK_BUKU_INDUK'
    | 'IMPOR_DATA'
    | 'HAPUS_SISWA'
    | 'LOGIN_SESI'
    | 'LOGOUT_SESI'
    | 'APPROVAL_SUPER_ADMIN'
    | 'EKSPOR_LEGGER'
    | 'IMPOR_LEGGER'
    | 'RESET_PASSWORD'
    | 'UPDATE_PROFIL';
  targetStudentId?: string;
  studentName?: string;
  details: string;
}

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type ApprovalCategory =
  | 'AKTIVASI_AKUN'
  | 'RESET_PASSWORD'
  | 'REVISI_NILAI'
  | 'MUTASI_SISWA'
  | 'HAPUS_DATA'
  | 'VERIFIKASI_BERKAS'
  | 'PERUBAHAN_DATA';

export interface ApprovalRequest {
  id: string;
  kategori: ApprovalCategory;
  judul: string;
  deskripsi: string;
  pemohonNama: string;
  pemohonEmail: string;
  pemohonRole: UserRole;
  targetStudentId?: string;
  targetStudentName?: string;
  targetUserId?: string;
  requestedNewPassword?: string;
  status: ApprovalStatus;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  catatanReviewer?: string;
}

export interface SchoolInfo {
  nama: string;
  npsn: string;
  jenjang: string;
  akreditasi: string;
  alamat: string;
  rtRw: string;
  kelurahan: string;
  kecamatan: string;
  kota: string;
  provinsi: string;
  kodePos: string;
  telepon: string;
  email: string;
  website: string;
  kepalaSekolah: string;
  nipKepalaSekolah: string;
  kepalaTu: string;
  nipKepalaTu: string;
  semesterAktif: string;
  tahunAjaranAktif: string;
}

export interface WaliKelasConfig {
  rombel: string;
  nama: string;
  nip: string;
}

export type SignatureRolePreset =
  | 'WALI_KELAS'
  | 'KEPALA_SEKOLAH'
  | 'KEPALA_TU'
  | 'PENGAWAS'
  | 'ORANG_TUA'
  | 'PESERTA_DIDIK'
  | 'KUSTOM';

export interface SignatureSlotConfig {
  tampilkan: boolean;
  teksAtas: string; // misal: "Mengetahui," atau "Diperiksa oleh,"
  gunakanTitimangsa: boolean; // jika true, tampilkan "{kotaTitimangsa}, {tanggalCetak}"
  jabatanPreset: SignatureRolePreset;
  labelJabatan: string; // misal: "Wali Kelas" atau "Kepala SMPN 99 Jakarta"
  namaKustom: string;
  nipKustom: string;
  tampilkanNip: boolean;
  tampilkanStempelArea: boolean;
}

export interface AppUser {
  id: string;
  nama: string;
  nip?: string;
  email: string;
  password?: string;
  mustChangePassword?: boolean;
  role: UserRole;
  jabatan: string;
  rombelBinaan?: string;
  aktif: boolean;
}

export interface RolePermissions {
  lihatDashboard: boolean;
  tambahEditSiswa: boolean;
  hapusSiswa: boolean;
  inputNilaiRapor: boolean;
  verifikasiDokumen: boolean;
  prosesMutasi: boolean;
  cetakBukuInduk: boolean;
  imporEksporData: boolean;
  kelolaPengaturan: boolean;
  kelolaAkun: boolean;
  approvePermohonan: boolean;
}

export interface MapelConfigItem {
  id: string;
  kodeDapodik: string;
  nama: string;
  kategori: 'WAJIB' | 'SENI_PRAKARYA' | 'MULOK' | 'BK';
  kktp: number;
  aktif: boolean;
  urutan: number;
}

export interface BukuIndukSettings {
  // Pejabat Sekolah & Pengesahan
  kepalaSekolah: string;
  nipKepalaSekolah: string;
  kepalaTu: string;
  nipKepalaTu: string;
  namaPengawas: string; // Pengawas Pemeriksa Buku Induk
  nipPengawas: string;

  // Tahun & Titimangsa
  tahunAjaranAktif: string;
  semesterAktif: 'Ganjil' | 'Genap';
  tanggalCetakMode: 'OTOMATIS' | 'KUSTOM';
  tanggalCetakKustom: string;
  kotaTitimangsa: string;

  // Kop Surat & Branding
  tampilkanKopSurat: boolean;
  tampilkanLogoDinas: boolean;
  tampilkanLogoSekolah: boolean;
  gayaGarisKop: 'GANDA' | 'TUNGGAL' | 'TANPA_GARIS';
  ukuranLogoPx: number;
  headerKopBaris1: string;
  headerKopBaris2: string;
  headerKopBaris3: string;
  headerKopAlamat: string;
  headerKopKontak: string;
  logoSekolahUrl?: string;
  logoDinasUrl?: string;

  // Pengaturan Tanda Tangan Kiri & Kanan
  tandaTangan: {
    kiri: SignatureSlotConfig;
    kanan: SignatureSlotConfig;
    tampilkanTengahPengawas: boolean;
  };

  // Tata Letak Cetak
  tataLetak: {
    ukuranKertas: 'A4' | 'F4' | 'Legal';
    margin: 'STANDAR' | 'RAPAT' | 'LEBAR';
    tampilkanKotakFoto: boolean;
    tampilkanPengawasPemeriksa: boolean;
  };

  // Daftar Wali Kelas per Rombel
  daftarWaliKelas: WaliKelasConfig[];

  // Pengaturan Mata Pelajaran & Dapodik
  pengaturanMapel?: MapelConfigItem[];

  // Pengaturan Pengguna & Hak Akses
  activeUserId: string;
  pengguna: AppUser[];
  hakAksesPeran: Record<UserRole, RolePermissions>;
}
