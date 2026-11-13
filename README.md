# Buku Induk Digital — SMP Negeri 99 Jakarta

Sistem Informasi **Buku Induk Siswa Digital** terpadu untuk **SMP Negeri 99 Jakarta** (`NPSN: 20103565`, Tahun Ajaran Aktif `2026/2027 Semester Ganjil`). Aplikasi ini menggabungkan pencatatan master biodata peserta didik, riwayat nilai rapor Semester 1–6 (Kurikulum Merdeka + P5 + Muatan Lokal PLBJ), arsip dokumen digital, pengelolaan mutasi & kelulusan, audit log, hingga pelaporan cetak PDF resmi berkop surat dan ekspor-impor Excel (`.xlsx`) sesuai standar **Dapodik**.

---

## 1. Identitas Instansi & Konfigurasi Bawaan

| Parameter | Nilai Konfigurasi |
| :--- | :--- |
| **Nama Satuan Pendidikan** | SMP Negeri 99 Jakarta |
| **NPSN** | `20103565` |
| **Alamat** | Jl. Utan Kayu Raya No. 21, Matraman, Jakarta Timur 13120 |
| **Tahun Ajaran Aktif** | `2026/2027` (`Semester Ganjil`) |
| **Kurikulum** | Kurikulum Merdeka (Fase D — Kelas VII, VIII, IX) |
| **Logo Resmi** | `/public/assets/aistudio/logo402_b225587b.png` + Logo DKI Jakarta SVG |

---

## 2. Tech Stack & Dependensi Utama

| Lapisan | Teknologi / Paket | Versi | Kegunaan |
| :--- | :--- | :--- | :--- |
| **Core UI** | `react`, `react-dom` | `19.0.1` | Antarmuka SPA modular berbasis hooks |
| **Bahasa & Tipe** | `typescript` | `^7.0.2` | Type-safety penuh untuk skema siswa, rapor, RBAC, & pengaturan |
| **Build Tool** | `vite`, `@vitejs/plugin-react` | `^8.3.0` | Bundler pengembangan (Port `3000`) & build produksi |
| **Styling** | `tailwindcss`, `@tailwindcss/vite` | `^4.3.3` | Utility-first styling (`@import "tailwindcss";`) + aturan `@media print` |
| **Visualisasi Data** | `recharts` | `^3.10.1` | Diagram batang (distribusi gender) & diagram lingkaran (status siswa) |
| **Ekspor PDF** | `jspdf`, `jspdf-autotable` | `^4.2.1`, `^5.0.9` | Pembuatan PDF rekapitulasi siswa langsung dengan KOP surat konsisten |
| **Ekspor/Impor Excel** | `xlsx` (SheetJS) | `^0.18.5` | Workbook multi-sheet `.xlsx` Dapodik, template, & parser `.xlsx/.xls/.csv` |
| **Ikonografi & Animasi** | `lucide-react`, `motion` | `^0.546.0`, `^12.23.24` | Ikon UI konsisten & transisi ringan |

---

## 3. Arsitektur Aplikasi (Engineering Architecture)

Aplikasi menerapkan arsitektur **Client-Side Layered SPA** dengan pemisahan tanggung jawab yang tegas antara lapisan presentasi, otorisasi peran (RBAC), lapisan layanan persistensi (`storageService`), dan mesin pembuat dokumen (`utils`).

```text
+-----------------------------------------------------------------------------+
|                         PRESENTATION LAYER (React 19)                       |
|  App.tsx (Session, RBAC Guard, Modal Orchestrator, Shortcut Ctrl+B, Toast)  |
|  +-- LoginScreen.tsx (Email/Password Login & Pendaftaran Akun Pending)      |
|  +-- Sidebar.tsx & Header.tsx (Navigasi Dinamis, Pencarian, Profil Aktif)   |
|  +-- Domain Views:                                                          |
|      DashboardView | StudentsListView | DocumentsView | MutationsListView   |
|      LeggerExportView | ImportExportView | AccountsManagementView           |
|      SettingsView | AuditLogView | GasIntegrationView                       |
+--------------------------------------+--------------------------------------+
                                       |
                                       v
+-----------------------------------------------------------------------------+
|                    DOMAIN UTILITIES & DOCUMENT ENGINES                      |
|  +-- utils/excelDapodikHelper.ts  (Workbook Multi-Sheet .xlsx & Parser)     |
|  +-- utils/recapPdfGenerator.ts   (jsPDF + AutoTable + Canvas Logo Loader)  |
|  +-- utils/printHelpers.ts        (Resolver Tanda Tangan & KOP Cetak A4/F4) |
+--------------------------------------+--------------------------------------+
                                       |
                                       v
+-----------------------------------------------------------------------------+
|                     SERVICE & PERSISTENCE LAYER                             |
|  services/storageService.ts                                                 |
|  +-- Manajemen Siswa, Nilai Semester 1-6, Mutasi, Verifikasi Berkas         |
|  +-- Manajemen Pengaturan (KOP, TTD, Wali Kelas, Mapel/KKTP, Hak Akses)     |
|  +-- Alur Approval Super Admin (Aktivasi Akun, Reset Password, Revisi)      |
|  +-- Audit Log & Batch Upsert Impor Excel/CSV                               |
|  +-- Sinkronisasi & Migrasi Skema ke Browser localStorage                   |
+-----------------------------------------------------------------------------+
```

### Struktur Direktori Utama

```text
/
├── public/
│   └── assets/aistudio/         # Aset logo resmi SMP Negeri 99 Jakarta
├── src/
│   ├── App.tsx                  # Root controller, session state, RBAC & modal routing
│   ├── index.css                # Tailwind CSS v4 + aturan cetak A4 (@media print)
│   ├── types/
│   │   └── index.ts             # Definisi tipe Student, SemesterGradesRecord, RBAC, Settings, Mapel
│   ├── data/
│   │   ├── mockData.ts          # Data awal peserta didik & log audit sekolah
│   │   ├── defaultGrades.ts     # Template 17 Mapel Kurikulum Merdeka & generator S1-S6
│   │   └── defaultSettings.ts   # Pengaturan default KOP, TTD, Wali Kelas, 8 Akun Role, Mapel
│   ├── services/
│   │   └── storageService.ts    # CRUD localStorage, migrasi skema, approval, upsert, & legger CSV
│   ├── utils/
│   │   ├── excelDapodikHelper.ts # Ekspor .xlsx multi-sheet, template .xlsx, parser Dapodik
│   │   ├── recapPdfGenerator.ts  # Generator PDF rekap siswa + KOP surat dinamis
│   │   └── printHelpers.ts       # Pembentuk format titimangsa & penandatangan Kiri/Kanan/Tengah
│   └── components/
│       ├── LoginScreen.tsx          # Halaman masuk email/password & form registrasi role
│       ├── DashboardView.tsx        # Statistik KPI, Recharts Bar/Pie, Profil, & Approval Super Admin
│       ├── StudentsListView.tsx     # Daftar siswa dikelompokkan per Rombel & filter Tingkat cepat
│       ├── StudentProfileModal.tsx  # Detail biodata lengkap, dokumen, mutasi, & nilai S1-S6
│       ├── StudentFormModal.tsx     # Form tambah/edit biodata lengkap peserta didik
│       ├── SemesterGradesTab.tsx    # Editor & penampil nilai rapor per semester (1-6) & P5
│       ├── DocumentsView.tsx        # Antrean & verifikasi berkas arsip digital siswa
│       ├── MutationsListView.tsx    # Riwayat siswa mutasi keluar & kelulusan
│       ├── MutationModal.tsx        # Modal proses mutasi / kelulusan siswa
│       ├── LeggerExportView.tsx     # Ekspor/Impor Legger Tahun Ajaran sebelumnya (S1-S6)
│       ├── ImportExportView.tsx     # Ekspor/Impor Excel (.xlsx) Dapodik + Pengaturan Mapel & KKTP
│       ├── PrintCenterModal.tsx     # Pusat cetak Lembar Buku Induk, Rapor Semester, & Transkrip
│       ├── RecapPdfModal.tsx        # Konfigurasi & unduh PDF Rekapitulasi Siswa dengan KOP Surat
│       ├── AccountsManagementView.tsx # Manajemen akun, rules per role, & reset password
│       ├── SettingsView.tsx         # Pengaturan KOP Surat, Pejabat, TTD 3-posisi, & Matriks RBAC
│       ├── AuditLogView.tsx         # Jejak audit seluruh aktivitas operator
│       ├── GasIntegrationView.tsx   # Panduan & skrip integrasi Google Apps Script / Spreadsheet
│       ├── Sidebar.tsx              # Navigasi samping adaptif (collapsible + mobile drawer)
│       └── Header.tsx               # Header kontekstual, pencarian global, tombol cepat & keluar
├── index.html                   # Entry HTML + metadata title & font Plus Jakarta Sans
├── metadata.json                # Identitas aplikasi AI Studio
└── package.json                 # Skrip npm & daftar dependensi
```

---

## 4. Sistem Desain (Design System & UX Principles)

Aplikasi dirancang dengan estetika **Institutional SaaS Dashboard** yang bersih, terstruktur, dan siap cetak untuk lingkungan tata usaha sekolah.

1. **Tipografi & Keterbacaan Numerik**
   - Font utama: **`Plus Jakarta Sans`** untuk hierarki judul dan label UI; font monospasial untuk `NIS`, `NISN`, `NIK`, dan kode Dapodik.
   - Angka statistik, tabel nilai, tahun ajaran, dan penghitung filter menggunakan kelas **`tabular-nums`** agar kolom sejajar presisi secara vertikal.
2. **Hierarki Permukaan (Single-Elevation Depth)**
   - Menggunakan kontras permukaan netral (`bg-slate-50` latar aplikasi, `bg-white` kartu konten dengan batas tegas `border border-slate-200`) tanpa penumpukan bayangan berlebihan.
   - Warna semantik dibatasi secara fungsional:
     - **Biru (`blue-600/700`)**: Aksi utama, fokus navigasi, identitas Rombel.
     - **Zamrud (`emerald-600/700`)**: Status `AKTIF`, terverifikasi, ekspor Excel `.xlsx`, persetujuan sukses.
     - **Amber (`amber-600/700`)**: Status `MENUNGGU_VERIFIKASI`, `MUTASI_KELUAR`, duplikasi data impor.
     - **Rose (`rose-600/700`)**: Error validasi, penolakan berkas, tombol logout/hapus.
3. **Aksesibilitas & Interaksi Non-Blocking**
   - Tidak menggunakan `window.alert`, `window.confirm`, atau `window.open`; seluruh konfirmasi (seperti logout, mutasi, hapus) dan pesan validasi menggunakan modal terstruktur serta banner/toast inline di dalam DOM.
   - Status lencana selalu memadukan teks eksplisit dan ikon (`CheckCircle2`, `AlertCircle`, `RefreshCw`, `Lock`) — tidak bergantung pada warna semata.
   - Kontrol navigasi dan filter memakai `whitespace-nowrap shrink-0` agar label tombol tidak terpotong di layar sempit.
4. **Konsistensi KOP Surat & Media Cetak**
   - Satu sumber kebenaran (*Single Source of Truth*) dari `BukuIndukSettings` untuk seluruh output cetak HTML (`PrintCenterModal`) dan PDF (`recapPdfGenerator.ts`):
     - Baris header instansi (3 baris), alamat, kontak/NPSN.
     - Toggle & ukuran logo DKI Jakarta + Logo SMP Negeri 99 Jakarta.
     - Gaya garis pemisah KOP (`GANDA`, `TUNGGAL`, `TANPA_GARIS`).
     - Konfigurasi tanda tangan 3 zona: Kiri, Kanan (dengan opsi titimangsa otomatis/kustom), dan Tengah (Pengawas Pemeriksa).

---

## 5. Keamanan, Kontrol Akses (RBAC) & Alur Approval

### Matriks 6 Peran Pengguna (`UserRole`)

| Peran (`UserRole`) | Deskripsi | Hak Akses Utama |
| :--- | :--- | :--- |
| **`SUPER_ADMIN`** | Penanggung Jawab Utama & Admin Sistem | Akses penuh seluruh modul, manajemen matriks hak akses, serta wewenang **Approve / Reject** permohonan akun, reset password, revisi nilai, & mutasi. |
| **`ADMIN`** | Staf / Kepala Urusan Tata Usaha (TU) | Kelola biodata siswa, verifikasi berkas, proses mutasi/kelulusan, cetak buku induk, impor/ekspor data, pengaturan KOP & TTD. |
| **`OPERATOR_TU`** | Operator Dapodik & Legger | Tambah/edit siswa, input nilai rapor & legger T.A. lalu, cetak lembar buku induk, impor/ekspor Excel Dapodik. |
| **`HOMEROOM_TEACHER`** | Wali Kelas (7A–9D) | Akses dashboard, lihat daftar siswa per rombel, input/perbarui nilai rapor siswa, cetak laporan/lembar buku induk. |
| **`VERIFIER`** | Verifikator Berkas Kesiswaan | Verifikasi kelengkapan & keabsahan arsip dokumen digital siswa, cetak lembar buku induk. |
| **`KEPALA_SEKOLAH`** | Pimpinan Satuan Pendidikan | Monitoring dashboard analitik, supervisi verifikasi berkas, cetak laporan buku induk & ekspor pelaporan. |

> Seluruh izin granular (`lihatDashboard`, `tambahEditSiswa`, `hapusSiswa`, `inputNilaiRapor`, `verifikasiDokumen`, `prosesMutasi`, `cetakBukuInduk`, `imporEksporData`, `kelolaPengaturan`, `kelolaAkun`, `approvePermohonan`) dapat disesuaikan langsung oleh Super Admin melalui menu **Pengaturan Cetak & KOP → Hak Akses Peran**.

### Alur Otentikasi & Pendaftaran Akun Mandiri

1. **Halaman Login Minimalis**: Hanya menampilkan form **Email & Password** tanpa mengekspos daftar seluruh akun internal sekolah.
2. **Registrasi Akun Baru (`aktif: false`)**: Pengguna baru (Wali Kelas / TU / Operator / Verifikator / Kepala Sekolah) dapat mendaftarkan akun dari halaman login sambil memilih peran dan rombel binaan yang diinginkan.
3. **Antrean Approval Super Admin**: Pendaftaran otomatis membuat `ApprovalRequest` bertipe `AKTIVASI_AKUN`. Akun belum bisa masuk sebelum **Super Admin** menyetujui (*Accept*) permohonan di **Dashboard & Approval**.
4. **Ganti Nama, Password & Request Reset Password**: Pengguna aktif dapat memperbarui profil/kata sandi di dashboard, atau mengajukan permintaan reset password untuk akun/peran lain yang harus disetujui Super Admin.

---

## 6. Model Data & Skema Persistensi

Data disimpan secara persisten pada `localStorage` browser dengan mekanisme auto-migrasi skema:

| Kunci `localStorage` | Isi Data | Keterangan |
| :--- | :--- | :--- |
| `smpn99_buku_induk_students_v2` | Array `Student[]` | Biodata lengkap, orang tua/wali, sekolah asal, riwayat kelas, dokumen, mutasi, & `riwayatNilai` Semester 1–6 |
| `smpn99_buku_induk_settings_v1` | Objek `BukuIndukSettings` | Pejabat sekolah, KOP surat, TTD, `daftarWaliKelas`, `pengaturanMapel`, `pengguna`, & `hakAksesPeran` |
| `smpn99_buku_induk_approvals_v1` | Array `ApprovalRequest[]` | Antrean & riwayat persetujuan Super Admin (`PENDING`, `APPROVED`, `REJECTED`) |
| `smpn99_buku_induk_logs_v1` | Array `AuditLogEntry[]` | Maksimal 300 entri log aktivitas terbaru (`TAMBAH_SISWA`, `IMPOR_DATA`, `EKSPOR_LEGGER`, `APPROVAL_SUPER_ADMIN`, dll.) |
| `smpn99_session_logged_out` | Flag sesi aktif | Status sesi login/logout pengguna |
| `smpn99_sidebar_collapsed` | Preferensi UI | Status sidebar ciut/lebar (`Ctrl+B` / `Cmd+B`) |

---

## 7. Fitur Unggulan & Modul Fungsional

1. **Dashboard Analitik Dinamis (`DashboardView`)**
   - KPI Ringkas: Total Siswa Terdata, Siswa Aktif, Mutasi Keluar, Siswa Lulus, & Berkas Terverifikasi.
   - Visualisasi **Recharts**: Diagram batang (*BarChart*) komposisi siswa Laki-Laki vs Perempuan dan diagram lingkaran (*PieChart*) distribusi status siswa.
   - Panel **Approval Super Admin** interaktif serta tombol cepat unduh **Rekapitulasi Data Siswa PDF** langsung dari halaman utama.
2. **Master Buku Induk Terkelompok per Rombel (`StudentsListView`)**
   - Pengelompokan siswa otomatis per rombel (`7A`–`9D`), filter cepat tingkat kelas (`Semua`, `VII`, `VIII`, `IX`), pencarian NIS/NISN/Nama, dan status kelengkapan berkas.
3. **Rekapitulasi PDF Langsung dengan KOP Surat (`RecapPdfModal` & `recapPdfGenerator.ts`)**
   - Filter berdasarkan Tingkat, Rombel, atau Status sebelum mengunduh dokumen `.pdf` lengkap dengan KOP surat dinamis (logo DKI + logo SMPN 99), ringkasan jumlah, dan blok tanda tangan pengesahan sesuai pengaturan.
4. **Ekspor & Impor Excel (`.xlsx`) Standar Dapodik + Pengaturan Mapel (`ImportExportView` & `excelDapodikHelper.ts`)**
   - **Ekspor `.xlsx` Multi-Sheet**: Filter Tingkat (`VII/VIII/IX`), Rombel, Status, & Periode Nilai (`Rekap S1–S6` atau Semester `1–6`), menghasilkan sheet `Data_Siswa_Dapodik`, `Rekap_Rombel_Eksternal`, `Nilai_Mapel_Rapor`, dan `Pengaturan_Mapel`.
   - **Impor `.xlsx / .xls / .csv`**: Deteksi otomatis baris header Dapodik maupun Template Buku Induk, konversi tanggal serial Excel, staging validasi (`BARU`, `PERBARUI/DUPLIKAT`, `ERROR`), serta mode **Upsert** berdasarkan NISN/NIS tanpa menghapus nilai/dokumen yang ada.
   - **Pengaturan Mapel & KKTP**: Kelola kode Dapodik, nama mata pelajaran, kategori (`WAJIB`, `SENI_PRAKARYA`, `MULOK`, `BK`), nilai KKTP, status aktif ekspor, tambah mapel kustom, maupun reset standar 17 mapel.
5. **Export/Import Legger Tahun Ajaran Sebelumnya (`LeggerExportView`)**
   - Mengelola impor/ekspor legger nilai historis Semester 1 sampai Semester 6 agar transkrip lengkap Buku Induk Siswa langsung terisi.

---

## 8. Menjalankan & Membangun Proyek

### Prasyarat
- **Node.js** v18+ (disarankan v20/v22)
- **npm** atau **bun**

### Perintah Pengembangan

```bash
# 1. Pasang seluruh dependensi
npm install

# 2. Jalankan server pengembangan (http://localhost:3000)
npm run dev

# 3. Pemeriksaan tipe TypeScript & lint statis
npm run lint

# 4. Build bundle produksi (output ke folder dist/)
npm run build
```

> **Catatan Arsitektur Pengembangan Berikutnya:**  
> Lapisan persistensi saat ini terisolasi di dalam `src/services/storageService.ts`, sehingga migrasi menuju backend relasional (Cloud SQL / PostgreSQL) atau Firebase Firestore / Google Apps Script (`GasIntegrationView.tsx`) dapat dilakukan langsung pada layer service tanpa merombak komponen UI.
