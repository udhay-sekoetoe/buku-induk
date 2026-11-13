import React, { useState, useRef } from 'react';
import {
  Save,
  RotateCcw,
  Building,
  UserCheck,
  Printer,
  Upload,
  Image as ImageIcon,
  CheckCircle,
  Plus,
  Trash2,
  Shield,
  Eye,
  Settings as SettingsIcon,
  PenTool,
  Users,
  Lock,
  UserPlus,
  KeyRound,
  Check,
  X,
} from 'lucide-react';
import {
  BukuIndukSettings,
  WaliKelasConfig,
  UserRole,
  SignatureRolePreset,
  SignatureSlotConfig,
  AppUser,
  RolePermissions,
} from '../types';
import {
  DEFAULT_BUKU_INDUK_SETTINGS,
  DEFAULT_LOGO_DKI,
  DEFAULT_LOGO_SMPN99,
  DEFAULT_ROLE_PERMISSIONS,
} from '../data/defaultSettings';
import { resolveSignatureSlot } from '../utils/printHelpers';

interface SettingsViewProps {
  settings: BukuIndukSettings;
  onSaveSettings: (newSettings: BukuIndukSettings) => void;
  operator: { name: string; email: string; role: UserRole };
  onSwitchActiveUser?: (user: AppUser) => void;
}

const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: 'Super Admin (Approval Utama)',
  ADMIN: 'Tata Usaha (TU)',
  OPERATOR_TU: 'Operator Dapodik & Legger',
  VERIFIER: 'Verifikator Berkas',
  HOMEROOM_TEACHER: 'Wali Kelas',
  KEPALA_SEKOLAH: 'Kepala Sekolah',
};

const PERMISSION_LABELS: Array<{ key: keyof RolePermissions; label: string; desc: string }> = [
  { key: 'lihatDashboard', label: 'Lihat Dashboard & Statistik', desc: 'Akses ringkasan statistik dan grafik siswa' },
  { key: 'tambahEditSiswa', label: 'Tambah & Edit Data Siswa', desc: 'Input siswa baru dan perbarui biodata induk' },
  { key: 'hapusSiswa', label: 'Hapus Data Siswa', desc: 'Menghapus entri siswa dari master buku induk' },
  { key: 'inputNilaiRapor', label: 'Input & Edit Nilai Rapor', desc: 'Mengisi/mengubah nilai Semester 1-6 dan P5' },
  { key: 'verifikasiDokumen', label: 'Verifikasi Berkas Digital', desc: 'Menyetujui atau menolak berkas pendaftar' },
  { key: 'prosesMutasi', label: 'Proses Mutasi & Kelulusan', desc: 'Mencatat mutasi keluar/masuk dan kelulusan' },
  { key: 'cetakBukuInduk', label: 'Cetak & Simpan PDF', desc: 'Mencetak biodata, rapor, dan transkrip resmi' },
  { key: 'imporEksporData', label: 'Impor/Ekspor & Legger T.A.', desc: 'Ekspor/impor CSV siswa & legger tahun ajaran lalu' },
  { key: 'kelolaPengaturan', label: 'Kelola Pengaturan Cetak & KOP', desc: 'Mengubah pejabat, kop surat, TTD, dan tata letak' },
  { key: 'kelolaAkun', label: 'Kelola Daftar Akun & Rules', desc: 'Mengelola akun Wali Kelas, TU, Operator & aturan role' },
  { key: 'approvePermohonan', label: 'Approval Super Admin (Dashboard)', desc: 'Menyetujui/menolak permohonan dari TU, Operator & Wali Kelas' },
];

const SIGNATURE_PRESETS: Array<{ value: SignatureRolePreset; label: string; defaultJabatan: string }> = [
  { value: 'WALI_KELAS', label: 'Wali Kelas (Otomatis sesuai rombel)', defaultJabatan: 'Wali Kelas' },
  { value: 'KEPALA_SEKOLAH', label: 'Kepala Sekolah (dari Data Pejabat)', defaultJabatan: 'Kepala SMPN 99 Jakarta' },
  { value: 'KEPALA_TU', label: 'Kepala Urusan Tata Usaha (Ka. TU)', defaultJabatan: 'Kepala Urusan Tata Usaha' },
  { value: 'PENGAWAS', label: 'Pengawas Sekolah / Pemeriksa', defaultJabatan: 'Pengawas Pembina Sekolah' },
  { value: 'ORANG_TUA', label: 'Orang Tua / Wali Murid', defaultJabatan: 'Orang Tua / Wali Murid' },
  { value: 'PESERTA_DIDIK', label: 'Peserta Didik (Siswa)', defaultJabatan: 'Peserta Didik' },
  { value: 'KUSTOM', label: 'Isian Kustom (Nama & NIP Bebas)', defaultJabatan: 'Pejabat Penandatangan' },
];

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings,
  operator: _operator,
  onSwitchActiveUser,
}) => {
  const [formData, setFormData] = useState<BukuIndukSettings>(settings);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [activeTab, setActiveTab] = useState<
    'pejabat-wali' | 'tanda-tangan' | 'kop' | 'pengguna-akses' | 'tata-letak'
  >('pejabat-wali');

  // Filter state for Wali Kelas
  const [waliFilterTingkat, setWaliFilterTingkat] = useState<'ALL' | '7' | '8' | '9'>('ALL');

  // New user form state
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUser, setNewUser] = useState<Omit<AppUser, 'id'>>({
    nama: '',
    nip: '',
    email: '',
    role: 'HOMEROOM_TEACHER',
    jabatan: 'Guru / Wali Kelas',
    rombelBinaan: '7A',
    aktif: true,
  });

  const fileInputSekolahRef = useRef<HTMLInputElement>(null);
  const fileInputDinasRef = useRef<HTMLInputElement>(null);

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onSaveSettings(formData);
    showNotification('Semua pengaturan Buku Induk, TTD, KOP & Hak Akses berhasil disimpan!');
  };

  const handleResetToDefault = () => {
    if (window.confirm('Kembalikan semua konfigurasi ke pengaturan baku resmi SMP Negeri 99 Jakarta?')) {
      setFormData(DEFAULT_BUKU_INDUK_SETTINGS);
      onSaveSettings(DEFAULT_BUKU_INDUK_SETTINGS);
      showNotification('Pengaturan dikembalikan ke standar awal SMPN 99 Jakarta.');
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'sekolah' | 'dinas') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showNotification('Ukuran file gambar maksimal 2 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (target === 'sekolah') {
        setFormData((prev) => ({ ...prev, logoSekolahUrl: result, tampilkanLogoSekolah: true }));
      } else {
        setFormData((prev) => ({ ...prev, logoDinasUrl: result, tampilkanLogoDinas: true }));
      }
    };
    reader.readAsDataURL(file);
  };

  // Wali Kelas handlers
  const handleWaliKelasChange = (index: number, field: keyof WaliKelasConfig, val: string) => {
    const updated = [...formData.daftarWaliKelas];
    updated[index] = { ...updated[index], [field]: val };
    setFormData({ ...formData, daftarWaliKelas: updated });
  };

  const handleAddWaliKelas = () => {
    setFormData({
      ...formData,
      daftarWaliKelas: [
        ...formData.daftarWaliKelas,
        { rombel: '7E', nama: 'Nama Guru Wali Kelas, S.Pd.', nip: '19850101 201001 1 001' },
      ],
    });
  };

  const handleRemoveWaliKelas = (index: number) => {
    if (formData.daftarWaliKelas.length <= 1) return;
    const updated = formData.daftarWaliKelas.filter((_, i) => i !== index);
    setFormData({ ...formData, daftarWaliKelas: updated });
  };

  // Signature Slot Updater
  const updateSignatureSlot = (
    side: 'kiri' | 'kanan',
    updates: Partial<SignatureSlotConfig>
  ) => {
    setFormData((prev) => ({
      ...prev,
      tandaTangan: {
        ...prev.tandaTangan,
        [side]: {
          ...prev.tandaTangan[side],
          ...updates,
        },
      },
    }));
  };

  // User Management handlers
  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.nama.trim() || !newUser.email.trim()) return;
    const created: AppUser = {
      ...newUser,
      id: `usr-${Date.now().toString(36)}`,
    };
    setFormData((prev) => ({
      ...prev,
      pengguna: [...prev.pengguna, created],
    }));
    setNewUser({
      nama: '',
      nip: '',
      email: '',
      role: 'HOMEROOM_TEACHER',
      jabatan: 'Guru / Wali Kelas',
      rombelBinaan: '7A',
      aktif: true,
    });
    setIsAddingUser(false);
    showNotification(`Pengguna ${created.nama} ditambahkan. Klik Simpan Pengaturan untuk menyimpan permanen.`);
  };

  const handleUpdateUser = (userId: string, updates: Partial<AppUser>) => {
    setFormData((prev) => ({
      ...prev,
      pengguna: prev.pengguna.map((u) => (u.id === userId ? { ...u, ...updates } : u)),
    }));
  };

  const handleRemoveUser = (userId: string) => {
    if (formData.pengguna.length <= 1) return;
    if (formData.activeUserId === userId) {
      showNotification('Tidak dapat menghapus akun pengguna yang sedang aktif digunakan.');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      pengguna: prev.pengguna.filter((u) => u.id !== userId),
    }));
  };

  const handleTogglePermission = (role: UserRole, permKey: keyof RolePermissions) => {
    setFormData((prev) => ({
      ...prev,
      hakAksesPeran: {
        ...prev.hakAksesPeran,
        [role]: {
          ...prev.hakAksesPeran[role],
          [permKey]: !prev.hakAksesPeran[role][permKey],
        },
      },
    }));
  };

  // Resolved previews for TTD Kiri & Kanan
  const previewLeftSig = resolveSignatureSlot(formData.tandaTangan.kiri, formData);
  const previewRightSig = resolveSignatureSlot(formData.tandaTangan.kanan, formData);

  const filteredWaliIndices = formData.daftarWaliKelas
    .map((w, idx) => ({ w, idx }))
    .filter(({ w }) => {
      if (waliFilterTingkat === 'ALL') return true;
      return w.rombel.startsWith(waliFilterTingkat);
    });

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs shrink-0">
            <SettingsIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
              Pengaturan Buku Induk, Cetak & Hak Akses
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Atur Pejabat, Nama & NIP Wali Kelas, Tanda Tangan Kiri & Kanan, KOP Surat & Logo, Pengguna serta Hak Akses
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset Standar</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Semua Pengaturan</span>
          </button>
        </div>
      </div>

      {/* TOAST SUCCESS NOTIFICATION */}
      {toastMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 font-medium shadow-xs">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TAB NAVIGATION */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 pb-2.5">
        <button
          type="button"
          onClick={() => setActiveTab('pejabat-wali')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'pejabat-wali'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Pejabat & Wali Kelas</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('tanda-tangan')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'tanda-tangan'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <PenTool className="w-4 h-4" />
          <span>Tanda Tangan Kiri & Kanan</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('kop')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'kop'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>KOP Surat & Logo</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pengguna-akses')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'pengguna-akses'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Pengguna & Hak Akses</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('tata-letak')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'tata-letak'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Printer className="w-4 h-4" />
          <span>Tata Letak Cetak</span>
        </button>
      </div>

      {/* FORM CONTENTS */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* ======================================================== */}
        {/* TAB 1: PEJABAT & DAFTAR WALI KELAS (NAMA & NIP)          */}
        {/* ======================================================== */}
        {activeTab === 'pejabat-wali' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  1. Data Pejabat Sekolah & Pemeriksa Buku Induk
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Nama dan NIP pejabat ini digunakan otomatis pada blok pengesahan Buku Induk, Rapor Semester, dan Surat Mutasi.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Kepala Sekolah */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center gap-2 text-blue-700 font-bold text-xs uppercase">
                    <UserCheck className="w-4 h-4" />
                    <span>Kepala SMP Negeri 99 Jakarta</span>
                  </div>
                  <div>
                    <label className="block text-slate-700 text-xs font-medium mb-1">
                      Nama Lengkap & Gelar Kepala Sekolah
                    </label>
                    <input
                      type="text"
                      value={formData.kepalaSekolah}
                      onChange={(e) => setFormData({ ...formData, kepalaSekolah: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500"
                      placeholder="Contoh: Drs. H. Sukamto, M.Pd."
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 text-xs font-medium mb-1">
                      NIP Kepala Sekolah
                    </label>
                    <input
                      type="text"
                      value={formData.nipKepalaSekolah}
                      onChange={(e) => setFormData({ ...formData, nipKepalaSekolah: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-blue-500"
                      placeholder="Contoh: 19680514 199512 1 002"
                      required
                    />
                  </div>
                </div>

                {/* Kepala Urusan Tata Usaha */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center gap-2 text-blue-700 font-bold text-xs uppercase">
                    <Building className="w-4 h-4" />
                    <span>Kepala Urusan Tata Usaha (Ka. TU)</span>
                  </div>
                  <div>
                    <label className="block text-slate-700 text-xs font-medium mb-1">
                      Nama Lengkap & Gelar Ka. TU
                    </label>
                    <input
                      type="text"
                      value={formData.kepalaTu}
                      onChange={(e) => setFormData({ ...formData, kepalaTu: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500"
                      placeholder="Contoh: Bambang Supriyanto, S.Sos."
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 text-xs font-medium mb-1">
                      NIP Kepala Tata Usaha
                    </label>
                    <input
                      type="text"
                      value={formData.nipKepalaTu}
                      onChange={(e) => setFormData({ ...formData, nipKepalaTu: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-blue-500"
                      placeholder="Contoh: 19740921 200604 1 005"
                      required
                    />
                  </div>
                </div>

                {/* Pengawas Sekolah / Pemeriksa Buku Induk */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 md:col-span-2">
                  <div className="flex items-center gap-2 text-blue-700 font-bold text-xs uppercase">
                    <Shield className="w-4 h-4" />
                    <span>Pengawas Sekolah / Pembina (Pemeriksa Resmi Buku Induk)</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-700 text-xs font-medium mb-1">
                        Nama Pengawas Pembina SMP
                      </label>
                      <input
                        type="text"
                        value={formData.namaPengawas}
                        onChange={(e) => setFormData({ ...formData, namaPengawas: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500"
                        placeholder="Contoh: Dr. Hj. Sri Mulyani, M.Pd."
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 text-xs font-medium mb-1">
                        NIP Pengawas Sekolah
                      </label>
                      <input
                        type="text"
                        value={formData.nipPengawas}
                        onChange={(e) => setFormData({ ...formData, nipPengawas: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-blue-500"
                        placeholder="Contoh: 19660312 199103 2 004"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* DAFTAR WALI KELAS & NIP PER ROMBEL */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                    2. Input Nama Wali Kelas & NIP per Rombel
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Masukkan Nama Wali Kelas beserta NIP untuk masing-masing rombel. Otomatis muncul saat mencetak Rapor & Buku Induk siswa.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs">
                    {[
                      { id: 'ALL', label: 'Semua' },
                      { id: '7', label: 'Kelas 7' },
                      { id: '8', label: 'Kelas 8' },
                      { id: '9', label: 'Kelas 9' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setWaliFilterTingkat(opt.id as any)}
                        className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                          waliFilterTingkat === opt.id
                            ? 'bg-white text-slate-900 shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleAddWaliKelas}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Rombel</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3 w-12 text-center">No</th>
                      <th className="p-3 w-28">Rombel</th>
                      <th className="p-3">Nama Lengkap & Gelar Wali Kelas</th>
                      <th className="p-3 w-60">NIP Wali Kelas</th>
                      <th className="p-3 w-16 text-center">Hapus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredWaliIndices.map(({ w: item, idx }, displayNo) => (
                      <tr key={idx} className="hover:bg-slate-50/70">
                        <td className="p-3 text-center text-slate-400 font-mono">{displayNo + 1}</td>
                        <td className="p-3">
                          <input
                            type="text"
                            value={item.rombel}
                            onChange={(e) => handleWaliKelasChange(idx, 'rombel', e.target.value)}
                            className="w-20 font-bold text-slate-900 bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-center focus:outline-none focus:border-blue-500"
                            placeholder="7A"
                          />
                        </td>
                        <td className="p-3">
                          <input
                            type="text"
                            value={item.nama}
                            onChange={(e) => handleWaliKelasChange(idx, 'nama', e.target.value)}
                            className="w-full font-medium text-slate-800 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
                            placeholder="Nama Lengkap & Gelar Wali Kelas"
                          />
                        </td>
                        <td className="p-3">
                          <input
                            type="text"
                            value={item.nip}
                            onChange={(e) => handleWaliKelasChange(idx, 'nip', e.target.value)}
                            className="w-full font-mono text-slate-700 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                            placeholder="19790415 200604 2 012"
                          />
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveWaliKelas(idx)}
                            disabled={formData.daftarWaliKelas.length <= 1}
                            className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-20 rounded-lg transition-colors"
                            title="Hapus Rombel"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: TANDA TANGAN BAGIAN KIRI & KANAN + TITIMANGSA     */}
        {/* ======================================================== */}
        {activeTab === 'tanda-tangan' && (
          <div className="space-y-6">
            {/* Periode & Titimangsa */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Tahun Pelajaran & Titimangsa Cetak
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Atur periode tahun ajaran berjalan serta kota dan tanggal yang dicetak di bagian atas blok tanda tangan.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-slate-700 text-xs font-medium mb-1">
                    Tahun Pelajaran Aktif
                  </label>
                  <input
                    type="text"
                    value={formData.tahunAjaranAktif}
                    onChange={(e) => setFormData({ ...formData, tahunAjaranAktif: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold font-mono focus:outline-none focus:border-blue-500"
                    placeholder="2026/2027"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 text-xs font-medium mb-1">
                    Semester Aktif
                  </label>
                  <select
                    value={formData.semesterAktif}
                    onChange={(e) =>
                      setFormData({ ...formData, semesterAktif: e.target.value as 'Ganjil' | 'Genap' })
                    }
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:border-blue-500"
                  >
                    <option value="Ganjil">Ganjil</option>
                    <option value="Genap">Genap</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 text-xs font-medium mb-1">
                    Kota Titimangsa
                  </label>
                  <input
                    type="text"
                    value={formData.kotaTitimangsa}
                    onChange={(e) => setFormData({ ...formData, kotaTitimangsa: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500"
                    placeholder="Jakarta"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 text-xs font-medium mb-1">
                    Mode Tanggal Cetak
                  </label>
                  <select
                    value={formData.tanggalCetakMode}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tanggalCetakMode: e.target.value as 'OTOMATIS' | 'KUSTOM',
                      })
                    }
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:border-blue-500"
                  >
                    <option value="OTOMATIS">Otomatis Tanggal Hari Ini</option>
                    <option value="KUSTOM">Tanggal Kustom Manual</option>
                  </select>
                </div>
              </div>

              {formData.tanggalCetakMode === 'KUSTOM' && (
                <div className="bg-blue-50/70 border border-blue-200 p-3 rounded-xl flex flex-col sm:flex-row sm:items-center gap-3">
                  <label className="text-xs font-bold text-blue-900 shrink-0">
                    Masukkan Tanggal Cetak Kustom:
                  </label>
                  <input
                    type="text"
                    value={formData.tanggalCetakKustom}
                    onChange={(e) => setFormData({ ...formData, tanggalCetakKustom: e.target.value })}
                    className="flex-1 max-w-xs bg-white border border-blue-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-blue-950"
                    placeholder="Contoh: 20 Desember 2024"
                  />
                </div>
              )}
            </div>

            {/* PENGATURAN BLOK TANDA TANGAN KIRI & KANAN */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Pengaturan Blok Tanda Tangan Bagian Kiri & Bagian Kanan
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Atur pejabat penandatangan di sebelah kiri dan kanan halaman saat mencetak Rapor, Transkrip, maupun Lembar Buku Induk.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {(['kiri', 'kanan'] as const).map((side) => {
                  const slot = formData.tandaTangan[side];
                  const isLeft = side === 'kiri';
                  return (
                    <div
                      key={side}
                      className={`p-4 rounded-xl border space-y-3.5 ${
                        slot.tampilkan
                          ? 'bg-slate-50 border-slate-200'
                          : 'bg-slate-50/50 border-slate-200 opacity-75'
                      }`}
                    >
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                        <div className="flex items-center gap-2">
                          <PenTool className="w-4 h-4 text-blue-600" />
                          <span className="text-xs font-extrabold uppercase text-slate-900">
                            Tanda Tangan Bagian {isLeft ? 'Kiri' : 'Kanan'}
                          </span>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                          <input
                            type="checkbox"
                            checked={slot.tampilkan}
                            onChange={(e) => updateSignatureSlot(side, { tampilkan: e.target.checked })}
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span>Tampilkan</span>
                        </label>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Sumber Data Penandatangan
                        </label>
                        <select
                          value={slot.jabatanPreset}
                          onChange={(e) => {
                            const preset = e.target.value as SignatureRolePreset;
                            const foundPreset = SIGNATURE_PRESETS.find((p) => p.value === preset);
                            updateSignatureSlot(side, {
                              jabatanPreset: preset,
                              labelJabatan: foundPreset ? foundPreset.defaultJabatan : slot.labelJabatan,
                            });
                          }}
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                        >
                          {SIGNATURE_PRESETS.map((p) => (
                            <option key={p.value} value={p.value}>
                              {p.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-1">
                            Label Jabatan Tercetak
                          </label>
                          <input
                            type="text"
                            value={slot.labelJabatan}
                            onChange={(e) => updateSignatureSlot(side, { labelJabatan: e.target.value })}
                            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                            placeholder="Contoh: Wali Kelas"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-1">
                            Teks Pembuka Atas
                          </label>
                          <input
                            type="text"
                            value={slot.teksAtas}
                            disabled={slot.gunakanTitimangsa}
                            onChange={(e) => updateSignatureSlot(side, { teksAtas: e.target.value })}
                            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs disabled:bg-slate-100 disabled:text-slate-400"
                            placeholder="Mengetahui,"
                          />
                        </div>
                      </div>

                      {slot.jabatanPreset === 'KUSTOM' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3 rounded-lg border border-blue-200">
                          <div>
                            <label className="block text-[11px] font-medium text-slate-700 mb-1">
                              Nama Penandatangan (Kustom)
                            </label>
                            <input
                              type="text"
                              value={slot.namaKustom}
                              onChange={(e) => updateSignatureSlot(side, { namaKustom: e.target.value })}
                              className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs font-semibold"
                              placeholder="Nama lengkap & gelar..."
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-slate-700 mb-1">
                              NIP / NUPTK (Kustom)
                            </label>
                            <input
                              type="text"
                              value={slot.nipKustom}
                              onChange={(e) => updateSignatureSlot(side, { nipKustom: e.target.value })}
                              className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs font-mono"
                              placeholder="NIP..."
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-4 pt-1 text-xs">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={slot.gunakanTitimangsa}
                            onChange={(e) =>
                              updateSignatureSlot(side, { gunakanTitimangsa: e.target.checked })
                            }
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-slate-700 font-medium">Gunakan Tanggal Titimangsa</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={slot.tampilkanNip}
                            onChange={(e) => updateSignatureSlot(side, { tampilkanNip: e.target.checked })}
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-slate-700 font-medium">Tampilkan NIP</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={slot.tampilkanStempelArea}
                            onChange={(e) =>
                              updateSignatureSlot(side, { tampilkanStempelArea: e.target.checked })
                            }
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-slate-700 font-medium">Area Stempel</span>
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pengawas Pembina (Tengah/Pemeriksa) Toggle */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-800">
                    Blok Pemeriksa Tengah (Pengawas Pembina Sekolah)
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Menampilkan tanda tangan {formData.namaPengawas} di bagian tengah bawah dokumen Buku Induk & Transkrip.
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.tandaTangan.tampilkanTengahPengawas}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tandaTangan: {
                          ...formData.tandaTangan,
                          tampilkanTengahPengawas: e.target.checked,
                        },
                      })
                    }
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs font-bold text-slate-700">Aktif</span>
                </label>
              </div>

              {/* LIVE PREVIEW BLOK TANDA TANGAN KIRI & KANAN */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <Eye className="w-4 h-4 text-blue-600" />
                  <span>Pratinjau Tata Letak Tanda Tangan Cetak (Kiri & Kanan):</span>
                </div>
                <div className="bg-white border-2 border-slate-300 rounded-xl p-6 text-black text-[11px]">
                  <div className="grid grid-cols-2 gap-8 max-w-2xl mx-auto text-center">
                    {/* Bagian Kiri */}
                    <div>
                      {previewLeftSig.tampilkan ? (
                        <>
                          <div className="text-[10px] text-slate-700 min-h-[16px]">
                            {previewLeftSig.headerLine1}
                          </div>
                          <div className="font-bold">{previewLeftSig.labelJabatan}</div>
                          <div className="h-14 flex items-center justify-center text-slate-300 italic text-[9px]">
                            {previewLeftSig.tampilkanStempelArea
                              ? '[ Tanda Tangan & Stempel ]'
                              : '[ Tanda Tangan ]'}
                          </div>
                          <div className="font-bold underline uppercase">{previewLeftSig.nama}</div>
                          {previewLeftSig.tampilkanNip && (
                            <div className="text-[9.5px] font-mono text-slate-700">
                              {previewLeftSig.nip.startsWith('NIS')
                                ? previewLeftSig.nip
                                : `NIP. ${previewLeftSig.nip}`}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="h-24 flex items-center justify-center text-xs text-slate-300 italic border border-dashed border-slate-200 rounded">
                          Blok Tanda Tangan Kiri Disembunyikan
                        </div>
                      )}
                    </div>

                    {/* Bagian Kanan */}
                    <div>
                      {previewRightSig.tampilkan ? (
                        <>
                          <div className="text-[10px] text-slate-700 min-h-[16px]">
                            {previewRightSig.headerLine1}
                          </div>
                          <div className="font-bold">{previewRightSig.labelJabatan}</div>
                          <div className="h-14 flex items-center justify-center text-slate-300 italic text-[9px]">
                            {previewRightSig.tampilkanStempelArea
                              ? '[ Tanda Tangan & Stempel ]'
                              : '[ Tanda Tangan ]'}
                          </div>
                          <div className="font-bold underline uppercase">{previewRightSig.nama}</div>
                          {previewRightSig.tampilkanNip && (
                            <div className="text-[9.5px] font-mono text-slate-700">
                              {previewRightSig.nip.startsWith('NIS')
                                ? previewRightSig.nip
                                : `NIP. ${previewRightSig.nip}`}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="h-24 flex items-center justify-center text-xs text-slate-300 italic border border-dashed border-slate-200 rounded">
                          Blok Tanda Tangan Kanan Disembunyikan
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: KOP SURAT & LOGO (SEKOLAH & DINAS)                */}
        {/* ======================================================== */}
        {activeTab === 'kop' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Pengaturan KOP Surat, Logo Dinas Pendidikan & Logo Sekolah
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Atur tampilan logo kiri (Dinas Pendidikan), logo kanan (Sekolah), ukuran logo, garis pemisah, dan teks KOP resmi.
                </p>
              </div>

              <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                <input
                  type="checkbox"
                  checked={formData.tampilkanKopSurat}
                  onChange={(e) => setFormData({ ...formData, tampilkanKopSurat: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs font-bold text-slate-800">Tampilkan KOP Surat Saat Cetak</span>
              </label>
            </div>

            {/* Gaya Kop & Ukuran Logo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Gaya Garis Pembatas Bawah KOP
                </label>
                <select
                  value={formData.gayaGarisKop}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      gayaGarisKop: e.target.value as 'GANDA' | 'TUNGGAL' | 'TANPA_GARIS',
                    })
                  }
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold"
                >
                  <option value="GANDA">Garis Ganda Resmi Dinas (Double Border)</option>
                  <option value="TUNGGAL">Garis Tunggal Tegas (Single Border)</option>
                  <option value="TANPA_GARIS">Tanpa Garis Pembatas</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ukuran Logo Kiri & Kanan ({formData.ukuranLogoPx} px)
                </label>
                <div className="flex items-center gap-3 pt-1">
                  <input
                    type="range"
                    min={40}
                    max={84}
                    step={2}
                    value={formData.ukuranLogoPx}
                    onChange={(e) =>
                      setFormData({ ...formData, ukuranLogoPx: Number(e.target.value) })
                    }
                    className="flex-1 accent-blue-600"
                  />
                  <span className="text-xs font-mono font-bold text-slate-700 w-12 text-right">
                    {formData.ukuranLogoPx}px
                  </span>
                </div>
              </div>
            </div>

            {/* LOGO UPLOAD SECTION */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Logo Dinas Pendidikan DKI */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800 uppercase">
                    <input
                      type="checkbox"
                      checked={formData.tampilkanLogoDinas}
                      onChange={(e) =>
                        setFormData({ ...formData, tampilkanLogoDinas: e.target.checked })
                      }
                      className="rounded text-blue-600"
                    />
                    <span>Logo Dinas Pendidikan (Kiri)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, logoDinasUrl: DEFAULT_LOGO_DKI, tampilkanLogoDinas: true })
                    }
                    className="text-[11px] font-semibold text-blue-600 hover:underline"
                  >
                    Reset Logo DKI
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-16 h-18 bg-white border border-slate-300 rounded-lg p-1.5 flex items-center justify-center shrink-0 shadow-2xs">
                    {formData.logoDinasUrl ? (
                      <img
                        src={formData.logoDinasUrl}
                        alt="Logo Dinas DKI"
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <button
                      type="button"
                      onClick={() => fileInputDinasRef.current?.click()}
                      className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload File Logo Dinas</span>
                    </button>
                    <input
                      ref={fileInputDinasRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleLogoUpload(e, 'dinas')}
                      className="hidden"
                    />
                    <input
                      type="text"
                      value={
                        formData.logoDinasUrl?.startsWith('data:')
                          ? ''
                          : formData.logoDinasUrl || ''
                      }
                      onChange={(e) =>
                        setFormData({ ...formData, logoDinasUrl: e.target.value })
                      }
                      placeholder="Atau tempel URL gambar logo dinas..."
                      className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-[11px]"
                    />
                  </div>
                </div>
              </div>

              {/* Logo SMP Negeri 99 Jakarta */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800 uppercase">
                    <input
                      type="checkbox"
                      checked={formData.tampilkanLogoSekolah}
                      onChange={(e) =>
                        setFormData({ ...formData, tampilkanLogoSekolah: e.target.checked })
                      }
                      className="rounded text-blue-600"
                    />
                    <span>Logo Sekolah (Kanan)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        logoSekolahUrl: DEFAULT_LOGO_SMPN99,
                        tampilkanLogoSekolah: true,
                      })
                    }
                    className="text-[11px] font-semibold text-blue-600 hover:underline"
                  >
                    Reset Logo SMPN 99
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-16 h-18 bg-white border border-slate-300 rounded-lg p-1.5 flex items-center justify-center shrink-0 shadow-2xs">
                    {formData.logoSekolahUrl ? (
                      <img
                        src={formData.logoSekolahUrl}
                        alt="Logo SMPN 99"
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <button
                      type="button"
                      onClick={() => fileInputSekolahRef.current?.click()}
                      className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload File Logo Sekolah</span>
                    </button>
                    <input
                      ref={fileInputSekolahRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleLogoUpload(e, 'sekolah')}
                      className="hidden"
                    />
                    <input
                      type="text"
                      value={
                        formData.logoSekolahUrl?.startsWith('data:')
                          ? ''
                          : formData.logoSekolahUrl || ''
                      }
                      onChange={(e) =>
                        setFormData({ ...formData, logoSekolahUrl: e.target.value })
                      }
                      placeholder="Atau tempel URL gambar logo sekolah..."
                      className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-[11px]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* TEKS KOP SURAT */}
            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h3 className="text-xs font-bold text-slate-800 uppercase">Teks Header KOP Surat</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                    Baris 1 (Pemerintah Daerah / Provinsi)
                  </label>
                  <input
                    type="text"
                    value={formData.headerKopBaris1}
                    onChange={(e) => setFormData({ ...formData, headerKopBaris1: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                    Baris 2 (Instansi / Dinas Pendidikan)
                  </label>
                  <input
                    type="text"
                    value={formData.headerKopBaris2}
                    onChange={(e) => setFormData({ ...formData, headerKopBaris2: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs font-bold"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                    Baris 3 (Nama Satuan Pendidikan)
                  </label>
                  <input
                    type="text"
                    value={formData.headerKopBaris3}
                    onChange={(e) => setFormData({ ...formData, headerKopBaris3: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs font-extrabold text-blue-950"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                    Alamat Lengkap & Kode Pos
                  </label>
                  <input
                    type="text"
                    value={formData.headerKopAlamat}
                    onChange={(e) => setFormData({ ...formData, headerKopAlamat: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                    Kontak, Email, Website & NPSN
                  </label>
                  <input
                    type="text"
                    value={formData.headerKopKontak}
                    onChange={(e) => setFormData({ ...formData, headerKopKontak: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* LIVE PREVIEW KOP SURAT */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <Eye className="w-4 h-4 text-blue-600" />
                <span>Pratinjau KOP Surat Resmi yang Akan Dicetak:</span>
              </div>
              <div className="bg-white p-5 rounded-xl border-2 border-slate-300 text-center font-serif text-black shadow-xs">
                {formData.tampilkanKopSurat ? (
                  <div
                    className={`pb-3 ${
                      formData.gayaGarisKop === 'GANDA'
                        ? 'border-b-4 border-double border-black'
                        : formData.gayaGarisKop === 'TUNGGAL'
                        ? 'border-b-2 border-black'
                        : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      {formData.tampilkanLogoDinas && formData.logoDinasUrl ? (
                        <img
                          src={formData.logoDinasUrl}
                          alt="Logo Kiri"
                          style={{ width: formData.ukuranLogoPx, height: formData.ukuranLogoPx }}
                          className="object-contain shrink-0"
                        />
                      ) : (
                        <div style={{ width: formData.ukuranLogoPx }} className="shrink-0" />
                      )}

                      <div className="flex-1 space-y-0.5 font-sans">
                        <div className="text-[10px] font-bold tracking-wider uppercase text-black">
                          {formData.headerKopBaris1}
                        </div>
                        <div className="text-[11px] font-extrabold uppercase text-black">
                          {formData.headerKopBaris2}
                        </div>
                        <div className="text-[13px] font-black uppercase text-black tracking-wide">
                          {formData.headerKopBaris3}
                        </div>
                        <div className="text-[9.5px] text-slate-700">{formData.headerKopAlamat}</div>
                        <div className="text-[9px] text-slate-600 font-mono">
                          {formData.headerKopKontak}
                        </div>
                      </div>

                      {formData.tampilkanLogoSekolah && formData.logoSekolahUrl ? (
                        <img
                          src={formData.logoSekolahUrl}
                          alt="Logo Kanan"
                          style={{ width: formData.ukuranLogoPx, height: formData.ukuranLogoPx }}
                          className="object-contain shrink-0"
                        />
                      ) : (
                        <div style={{ width: formData.ukuranLogoPx }} className="shrink-0" />
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 text-xs text-slate-400 italic">
                    KOP surat dinonaktifkan (cetakan dimulai langsung dari judul formulir).
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: PENGATURAN PENGGUNA & HAK AKSES (RBAC)            */}
        {/* ======================================================== */}
        {activeTab === 'pengguna-akses' && (
          <div className="space-y-6">
            {/* Manajemen Pengguna */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span>Daftar Pengguna Sistem & Akun Operator</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Kelola akun guru, wali kelas, verifikator, operator TU, dan kepala sekolah beserta peran aksesnya.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddingUser(!isAddingUser)}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs shrink-0"
                >
                  {isAddingUser ? <X className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                  <span>{isAddingUser ? 'Tutup Form' : 'Tambah Pengguna'}</span>
                </button>
              </div>

              {/* Form Tambah Pengguna */}
              {isAddingUser && (
                <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4 space-y-3">
                  <div className="text-xs font-bold text-blue-950 uppercase">
                    Registrasi Pengguna Baru
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Nama Lengkap & Gelar
                      </label>
                      <input
                        type="text"
                        value={newUser.nama}
                        onChange={(e) => setNewUser({ ...newUser, nama: e.target.value })}
                        placeholder="Contoh: Budi Santoso, S.Si."
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Email Belajar.id / Dinas
                      </label>
                      <input
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        placeholder="nama@guru.smp.belajar.id"
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        NIP / NUPTK
                      </label>
                      <input
                        type="text"
                        value={newUser.nip || ''}
                        onChange={(e) => setNewUser({ ...newUser, nip: e.target.value })}
                        placeholder="19850101 201001 1 001"
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Peran / Hak Akses (Role)
                      </label>
                      <select
                        value={newUser.role}
                        onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                      >
                        {Object.entries(ROLE_LABELS).map(([k, v]) => (
                          <option key={k} value={k}>
                            {v}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Jabatan / Tugas
                      </label>
                      <input
                        type="text"
                        value={newUser.jabatan}
                        onChange={(e) => setNewUser({ ...newUser, jabatan: e.target.value })}
                        placeholder="Contoh: Wali Kelas 7D"
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={handleAddUserSubmit}
                        className="w-full px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors"
                      >
                        Tambahkan ke Daftar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tabel Pengguna */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Nama & Email</th>
                      <th className="p-3 w-44">NIP</th>
                      <th className="p-3 w-44">Peran (Role)</th>
                      <th className="p-3 w-24 text-center">Status</th>
                      <th className="p-3 w-40 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {formData.pengguna.map((user) => {
                      const isCurrentActive = formData.activeUserId === user.id;
                      return (
                        <tr key={user.id} className={isCurrentActive ? 'bg-blue-50/40' : 'hover:bg-slate-50'}>
                          <td className="p-3">
                            <div className="font-bold text-slate-900 flex items-center gap-2">
                              <span>{user.nama}</span>
                              {isCurrentActive && (
                                <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                                  Sesi Aktif
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500">{user.email}</div>
                            <div className="text-[10px] text-slate-400">{user.jabatan}</div>
                          </td>
                          <td className="p-3 font-mono text-[11px] text-slate-700">
                            {user.nip || '-'}
                          </td>
                          <td className="p-3">
                            <select
                              value={user.role}
                              onChange={(e) =>
                                handleUpdateUser(user.id, { role: e.target.value as UserRole })
                              }
                              className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800"
                            >
                              {Object.entries(ROLE_LABELS).map(([k, v]) => (
                                <option key={k} value={k}>
                                  {v}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleUpdateUser(user.id, { aktif: !user.aktif })}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                                user.aktif
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-500 border border-slate-200'
                              }`}
                            >
                              {user.aktif ? 'Aktif' : 'Nonaktif'}
                            </button>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center justify-center gap-1.5">
                              {onSwitchActiveUser && !isCurrentActive && user.aktif && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormData((prev) => ({ ...prev, activeUserId: user.id }));
                                    onSwitchActiveUser(user);
                                  }}
                                  className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-[10px] font-semibold transition-colors"
                                  title="Aktifkan pengguna ini pada sesi aplikasi"
                                >
                                  Gunakan
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleRemoveUser(user.id)}
                                disabled={isCurrentActive || formData.pengguna.length <= 1}
                                className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-20 rounded transition-colors"
                                title="Hapus Pengguna"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* MATRIKS HAK AKSES PER PERAN */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                    <Lock className="w-4 h-4 text-blue-600" />
                    <span>Matriks Pengaturan Hak Akses (Role Permissions)</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Centang fitur yang diizinkan untuk setiap peran pengguna. Perubahan hak akses langsung membatasi tombol & modul sesuai peran aktif.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      hakAksesPeran: DEFAULT_ROLE_PERMISSIONS,
                    }))
                  }
                  className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors shrink-0"
                >
                  Reset Matriks Standar
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3 min-w-[220px]">Hak Akses / Modul Fitur</th>
                      {(Object.keys(ROLE_LABELS) as UserRole[]).map((roleKey) => (
                        <th key={roleKey} className="p-3 text-center w-32">
                          {ROLE_LABELS[roleKey]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {PERMISSION_LABELS.map((perm) => (
                      <tr key={perm.key} className="hover:bg-slate-50/70">
                        <td className="p-3">
                          <div className="font-bold text-slate-800">{perm.label}</div>
                          <div className="text-[11px] text-slate-500">{perm.desc}</div>
                        </td>
                        {(Object.keys(ROLE_LABELS) as UserRole[]).map((roleKey) => {
                          const enabled = formData.hakAksesPeran[roleKey]?.[perm.key] ?? false;
                          // Prevent locking SUPER_ADMIN out of approval/account/settings permissions
                          const isLockedAdminSetting =
                            roleKey === 'SUPER_ADMIN' &&
                            (perm.key === 'approvePermohonan' ||
                              perm.key === 'kelolaAkun' ||
                              perm.key === 'kelolaPengaturan');
                          return (
                            <td key={roleKey} className="p-3 text-center">
                              <button
                                type="button"
                                disabled={isLockedAdminSetting}
                                onClick={() => handleTogglePermission(roleKey, perm.key)}
                                className={`w-7 h-7 rounded-lg inline-flex items-center justify-center border transition-all ${
                                  enabled
                                    ? 'bg-blue-600 border-blue-600 text-white shadow-2xs'
                                    : 'bg-white border-slate-300 text-slate-300 hover:border-slate-400'
                                } ${isLockedAdminSetting ? 'opacity-60 cursor-not-allowed' : ''}`}
                                title={
                                  isLockedAdminSetting
                                    ? 'Super Admin selalu memiliki kewenangan inti ini'
                                    : `${ROLE_LABELS[roleKey]}: ${enabled ? 'Diizinkan' : 'Dibatasi'}`
                                }
                              >
                                {enabled ? <Check className="w-4 h-4" /> : <X className="w-3.5 h-3.5" />}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 5: TATA LETAK CETAK                                  */}
        {/* ======================================================== */}
        {activeTab === 'tata-letak' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Pengaturan Tata Letak Cetak Dokumen (PDF / Kertas)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Konfigurasi ukuran kertas cetak standar, margin dokumen, kotak pas foto, dan kolom pemeriksa.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Ukuran Kertas */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <label className="block text-xs font-bold text-slate-800 uppercase">
                  Ukuran Kertas Cetak Utama
                </label>
                <div className="space-y-2">
                  {[
                    {
                      id: 'A4',
                      label: 'A4 (210 x 297 mm) · Standar Arsip Nasional',
                      desc: 'Ukuran baku dokumen resmi Buku Induk & Rapor',
                    },
                    {
                      id: 'F4',
                      label: 'F4 / Folio (215 x 330 mm)',
                      desc: 'Ukuran kertas panjang untuk jilid map Buku Induk',
                    },
                    {
                      id: 'Legal',
                      label: 'Legal (216 x 356 mm)',
                      desc: 'Format kertas legal standar',
                    },
                  ].map((item) => (
                    <label
                      key={item.id}
                      className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-all ${
                        formData.tataLetak.ukuranKertas === item.id
                          ? 'bg-blue-50/70 border-blue-400 text-blue-950 font-bold'
                          : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="ukuranKertas"
                        value={item.id}
                        checked={formData.tataLetak.ukuranKertas === item.id}
                        onChange={() =>
                          setFormData({
                            ...formData,
                            tataLetak: { ...formData.tataLetak, ukuranKertas: item.id as any },
                          })
                        }
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <div className="text-xs font-semibold">{item.label}</div>
                        <div className="text-[10px] text-slate-500">{item.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Margin & Tampilan */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                <label className="block text-xs font-bold text-slate-800 uppercase">
                  Margin & Fitur Tampilan Cetak
                </label>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Pilihan Margin Halaman
                  </label>
                  <select
                    value={formData.tataLetak.margin}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tataLetak: { ...formData.tataLetak, margin: e.target.value as any },
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold"
                  >
                    <option value="STANDAR">Standar (Margin 10-12mm)</option>
                    <option value="RAPAT">Rapat (Margin 8mm - Memuat Lebih Banyak Konten)</option>
                    <option value="LEBAR">Lebar (Margin 15mm - Untuk Penjilidan Hardcover)</option>
                  </select>
                </div>

                <div className="space-y-2.5 pt-2 border-t border-slate-200">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.tataLetak.tampilkanKotakFoto}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          tataLetak: { ...formData.tataLetak, tampilkanKotakFoto: e.target.checked },
                        })
                      }
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs font-medium text-slate-800">
                      Tampilkan Kotak Pas Photo 3x4 cm pada Bagian A s/d D
                    </span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.tataLetak.tampilkanPengawasPemeriksa}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          tataLetak: {
                            ...formData.tataLetak,
                            tampilkanPengawasPemeriksa: e.target.checked,
                          },
                        })
                      }
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs font-medium text-slate-800">
                      Sertakan Kolom Tanda Tangan Pengawas Pembina / Pemeriksa Buku Induk
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* BOTTOM SAVE BUTTON BAR */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500">
            Perubahan akan langsung diterapkan ke tampilan Sidebar, KOP Surat, Tanda Tangan Cetak, dan Hak Akses.
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold rounded-xl flex items-center gap-2 shadow-xs transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Semua Pengaturan</span>
          </button>
        </div>
      </form>
    </div>
  );
};
