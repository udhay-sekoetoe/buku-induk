import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Lock,
  Check,
  X,
  Trash2,
  Save,
  RotateCcw,
  Send,
} from 'lucide-react';
import {
  AppUser,
  BukuIndukSettings,
  RolePermissions,
  UserRole,
  ApprovalCategory,
} from '../types';
import { DEFAULT_ROLE_PERMISSIONS } from '../data/defaultSettings';

interface AccountsManagementViewProps {
  settings: BukuIndukSettings;
  onSaveSettings: (newSettings: BukuIndukSettings) => void;
  activeUser: AppUser;
  activeRole: UserRole;
  permissions: RolePermissions;
  onSwitchActiveUser: (user: AppUser) => void;
  onSubmitApprovalRequest?: (payload: {
    kategori: ApprovalCategory;
    judul: string;
    deskripsi: string;
    targetUserId?: string;
  }) => void;
}

const ROLE_META: Record<
  UserRole,
  { label: string; shortLabel: string; summaryRules: string; badgeClass: string }
> = {
  SUPER_ADMIN: {
    label: 'Super Admin (Approval Utama)',
    shortLabel: 'Super Admin',
    summaryRules:
      'Akses penuh seluruh modul, kelola akun, ubah aturan role, hapus data, serta menyetujui/menolak permohonan approval di Dashboard.',
    badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  },
  ADMIN: {
    label: 'Tata Usaha (TU)',
    shortLabel: 'Tata Usaha (TU)',
    summaryRules:
      'Kelola data induk siswa, verifikasi dokumen, proses mutasi, cetak buku induk, ekspor/impor, dan pengaturan cetak. Hapus permanen & approval oleh Super Admin.',
    badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
  },
  OPERATOR_TU: {
    label: 'Operator Dapodik & Legger',
    shortLabel: 'Operator',
    summaryRules:
      'Entri & pembaruan biodata siswa, input nilai rapor, ekspor/impor CSV & Legger Tahun Ajaran sebelumnya, serta cetak dokumen.',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  HOMEROOM_TEACHER: {
    label: 'Wali Kelas',
    shortLabel: 'Wali Kelas',
    summaryRules:
      'Lihat dashboard statistik, input/edit nilai rapor semester 1–6 & P5 rombel binaan, serta cetak rapor & transkrip siswa.',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  VERIFIER: {
    label: 'Verifikator Berkas',
    shortLabel: 'Verifikator',
    summaryRules:
      'Lihat dashboard serta memeriksa dan memvalidasi kelengkapan berkas digital (Akta, KK, Ijazah SD, SKL) dan cetak lembar.',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-200',
  },
  KEPALA_SEKOLAH: {
    label: 'Kepala Sekolah',
    shortLabel: 'Kepala Sekolah',
    summaryRules:
      'Pantau dashboard eksekutif, verifikasi dokumen, lihat rekap legger nilai tahun ajaran, dan cetak laporan buku induk resmi.',
    badgeClass: 'bg-purple-50 text-purple-800 border-purple-200',
  },
};

const PERMISSION_LABELS: Array<{ key: keyof RolePermissions; label: string; desc: string }> = [
  { key: 'lihatDashboard', label: 'Lihat Dashboard & Statistik', desc: 'Akses ringkasan statistik dan grafik siswa' },
  { key: 'tambahEditSiswa', label: 'Tambah & Edit Data Siswa', desc: 'Input siswa baru dan perbarui biodata induk' },
  { key: 'hapusSiswa', label: 'Hapus Data Siswa', desc: 'Menghapus entri siswa dari master buku induk' },
  { key: 'inputNilaiRapor', label: 'Input & Edit Nilai Rapor', desc: 'Mengisi/mengubah nilai Semester 1–6 dan P5' },
  { key: 'verifikasiDokumen', label: 'Verifikasi Berkas Digital', desc: 'Menyetujui atau menolak berkas pendaftar' },
  { key: 'prosesMutasi', label: 'Proses Mutasi & Kelulusan', desc: 'Mencatat mutasi keluar/masuk dan kelulusan' },
  { key: 'cetakBukuInduk', label: 'Cetak & Simpan PDF', desc: 'Mencetak biodata, rapor, dan transkrip 6 semester' },
  { key: 'imporEksporData', label: 'Impor/Ekspor & Legger T.A. Lalu', desc: 'Ekspor/impor CSV siswa dan legger tahun ajaran' },
  { key: 'kelolaPengaturan', label: 'Kelola Pengaturan Cetak & KOP', desc: 'Mengubah pejabat, kop surat, logo, dan TTD' },
  { key: 'kelolaAkun', label: 'Kelola Daftar Akun & Rules', desc: 'Menambah akun wali kelas, TU, operator, dan aturan role' },
  { key: 'approvePermohonan', label: 'Approval Super Admin (Dashboard)', desc: 'Menyetujui atau menolak pengajuan dari TU/Operator/Wali Kelas' },
];

export const AccountsManagementView: React.FC<AccountsManagementViewProps> = ({
  settings,
  onSaveSettings,
  activeUser,
  activeRole,
  permissions,
  onSwitchActiveUser,
  onSubmitApprovalRequest,
}) => {
  const [formData, setFormData] = useState<BukuIndukSettings>(settings);
  const [roleFilter, setRoleFilter] = useState<'ALL' | UserRole>('ALL');
  const [isAddingUser, setIsAddingUser] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string>('');

  const [newUser, setNewUser] = useState<Omit<AppUser, 'id'>>({
    nama: '',
    nip: '',
    email: '',
    role: 'HOMEROOM_TEACHER',
    jabatan: 'Wali Kelas 7B',
    rombelBinaan: '7B',
    aktif: true,
  });

  const canManageAccounts = permissions.kelolaAkun;

  const notify = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.nama.trim() || !newUser.email.trim()) {
      notify('Nama lengkap dan email wajib diisi.');
      return;
    }

    const created: AppUser = {
      ...newUser,
      id: `usr-${Date.now().toString(36)}`,
      aktif: canManageAccounts ? newUser.aktif : false,
    };

    const updatedSettings: BukuIndukSettings = {
      ...formData,
      pengguna: [...formData.pengguna, created],
    };

    setFormData(updatedSettings);
    onSaveSettings(updatedSettings);

    if (!canManageAccounts && onSubmitApprovalRequest) {
      onSubmitApprovalRequest({
        kategori: 'AKTIVASI_AKUN',
        judul: `Permintaan Aktivasi Akun ${ROLE_META[created.role].shortLabel}: ${created.nama}`,
        deskripsi: `${activeUser.nama} (${ROLE_META[activeRole].shortLabel}) mendaftarkan akun baru untuk ${created.nama} (${created.email}) sebagai ${ROLE_META[created.role].label}. Menunggu approval Super Admin agar akun dapat aktif digunakan.`,
        targetUserId: created.id,
      });
      notify(`Akun ${created.nama} didaftarkan dengan status menunggu approval Super Admin.`);
    } else {
      notify(`Akun ${created.nama} berhasil ditambahkan dan disimpan!`);
    }

    setNewUser({
      nama: '',
      nip: '',
      email: '',
      role: 'HOMEROOM_TEACHER',
      jabatan: 'Wali Kelas 7B',
      rombelBinaan: '7B',
      aktif: true,
    });
    setIsAddingUser(false);
  };

  const handleUpdateUser = (userId: string, updates: Partial<AppUser>) => {
    if (!canManageAccounts) return;
    setFormData((prev) => ({
      ...prev,
      pengguna: prev.pengguna.map((u) => (u.id === userId ? { ...u, ...updates } : u)),
    }));
  };

  const handleRemoveUser = (userId: string) => {
    if (!canManageAccounts) return;
    if (userId === activeUser.id || formData.pengguna.length <= 1) {
      notify('Tidak dapat menghapus akun yang sedang digunakan.');
      return;
    }
    const updated: BukuIndukSettings = {
      ...formData,
      pengguna: formData.pengguna.filter((u) => u.id !== userId),
    };
    setFormData(updated);
    onSaveSettings(updated);
    notify('Akun berhasil dihapus dari daftar.');
  };

  const handleTogglePermission = (role: UserRole, permKey: keyof RolePermissions) => {
    if (!canManageAccounts) return;
    if (role === 'SUPER_ADMIN' && (permKey === 'approvePermohonan' || permKey === 'kelolaAkun')) {
      return;
    }
    setFormData((prev) => ({
      ...prev,
      hakAksesPeran: {
        ...prev.hakAksesPeran,
        [role]: {
          ...prev.hakAksesPeran[role],
          [permKey]: !prev.hakAksesPeran[role]?.[permKey],
        },
      },
    }));
  };

  const handleSaveAll = () => {
    onSaveSettings(formData);
    notify('Perubahan daftar akun & rules hak akses berhasil disimpan!');
  };

  const filteredUsers = formData.pengguna.filter((u) =>
    roleFilter === 'ALL' ? true : u.role === roleFilter
  );

  const rombelOptions = Array.from(
    new Set([
      ...formData.daftarWaliKelas.map((w) => w.rombel),
      '7A',
      '7B',
      '7C',
      '7D',
      '8A',
      '8B',
      '8C',
      '8D',
      '9A',
      '9B',
      '9C',
      '9D',
    ])
  ).sort();

  const countByRole = (r: UserRole) => formData.pengguna.filter((u) => u.role === r).length;

  return (
    <div className="space-y-6">
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg border border-slate-700 text-xs font-semibold">
          {toastMsg}
        </div>
      )}

      {/* Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600 text-white rounded-xl shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">
              Daftar Akun Wali Kelas, TU & Operator
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Kelola akun pengguna resmi SMP Negeri 99 Jakarta beserta aturan hak akses (rules) dan approval Super Admin.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsAddingUser(!isAddingUser)}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {isAddingUser ? <X className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
            <span>
              {isAddingUser
                ? 'Tutup Form'
                : canManageAccounts
                ? 'Tambah Akun Baru'
                : 'Ajukan Akun Baru'}
            </span>
          </button>

          {canManageAccounts && (
            <button
              type="button"
              onClick={handleSaveAll}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Simpan Perubahan</span>
            </button>
          )}
        </div>
      </div>

      {/* Role Summary & Rules Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {(['SUPER_ADMIN', 'HOMEROOM_TEACHER', 'ADMIN', 'OPERATOR_TU'] as UserRole[]).map((roleKey) => (
          <div
            key={roleKey}
            onClick={() => setRoleFilter(roleFilter === roleKey ? 'ALL' : roleKey)}
            className={`bg-white rounded-xl border p-4 cursor-pointer transition-all ${
              roleFilter === roleKey
                ? 'border-blue-500 ring-2 ring-blue-100'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${ROLE_META[roleKey].badgeClass}`}>
                {ROLE_META[roleKey].shortLabel}
              </span>
              <span className="text-lg font-extrabold font-mono tabular-nums text-slate-900">
                {countByRole(roleKey)}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-2.5 leading-relaxed">
              {ROLE_META[roleKey].summaryRules}
            </p>
          </div>
        ))}
      </div>

      {/* Form Tambah Akun */}
      {isAddingUser && (
        <form
          onSubmit={handleAddUser}
          className="bg-blue-50/60 border border-blue-200 rounded-2xl p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-blue-950 uppercase tracking-wide">
                {canManageAccounts
                  ? 'Registrasi Akun Baru (Wali Kelas / TU / Operator)'
                  : 'Pengajuan Akun Baru (Menunggu Approval Super Admin)'}
              </h3>
              <p className="text-[11px] text-blue-800 mt-0.5">
                {canManageAccounts
                  ? 'Akun baru akan langsung aktif dan mengikuti rules peran yang dipilih.'
                  : 'Pengajuan akun akan berstatus Nonaktif sampai disetujui oleh Super Admin di Dashboard.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Nama Lengkap & Gelar
              </label>
              <input
                type="text"
                required
                value={newUser.nama}
                onChange={(e) => setNewUser({ ...newUser, nama: e.target.value })}
                placeholder="Contoh: Ahmad Syafi'i, S.Pd."
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Email Belajar.id / Sekolah
              </label>
              <input
                type="email"
                required
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="nama@guru.smp.belajar.id"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs"
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
                placeholder="19820718 200902 1 003"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Peran / Role Akun
              </label>
              <select
                value={newUser.role}
                onChange={(e) => {
                  const chosenRole = e.target.value as UserRole;
                  const defaultJabatan =
                    chosenRole === 'HOMEROOM_TEACHER'
                      ? `Wali Kelas ${newUser.rombelBinaan || '7B'}`
                      : chosenRole === 'ADMIN'
                      ? 'Staf Tata Usaha (TU)'
                      : chosenRole === 'OPERATOR_TU'
                      ? 'Operator Dapodik & Legger'
                      : ROLE_META[chosenRole].shortLabel;
                  setNewUser({
                    ...newUser,
                    role: chosenRole,
                    jabatan: defaultJabatan,
                  });
                }}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold"
              >
                {(Object.keys(ROLE_META) as UserRole[])
                  .filter((r) => canManageAccounts || r !== 'SUPER_ADMIN')
                  .map((r) => (
                    <option key={r} value={r}>
                      {ROLE_META[r].label}
                    </option>
                  ))}
              </select>
            </div>

            {newUser.role === 'HOMEROOM_TEACHER' ? (
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Rombel Binaan (Wali Kelas)
                </label>
                <select
                  value={newUser.rombelBinaan || '7A'}
                  onChange={(e) =>
                    setNewUser({
                      ...newUser,
                      rombelBinaan: e.target.value,
                      jabatan: `Wali Kelas ${e.target.value}`,
                    })
                  }
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold"
                >
                  {rombelOptions.map((rm) => (
                    <option key={rm} value={rm}>
                      Kelas {rm}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Jabatan / Tugas
                </label>
                <input
                  type="text"
                  value={newUser.jabatan}
                  onChange={(e) => setNewUser({ ...newUser, jabatan: e.target.value })}
                  placeholder="Contoh: Staf Tata Usaha Kesiswaan"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs"
                />
              </div>
            )}

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {canManageAccounts ? <UserPlus className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
                <span>{canManageAccounts ? 'Simpan & Aktifkan Akun' : 'Kirim Pengajuan ke Super Admin'}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Filter Bar & Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
            {[
              { id: 'ALL', label: `Semua (${formData.pengguna.length})` },
              { id: 'SUPER_ADMIN', label: `Super Admin (${countByRole('SUPER_ADMIN')})` },
              { id: 'HOMEROOM_TEACHER', label: `Wali Kelas (${countByRole('HOMEROOM_TEACHER')})` },
              { id: 'ADMIN', label: `Tata Usaha / TU (${countByRole('ADMIN')})` },
              { id: 'OPERATOR_TU', label: `Operator (${countByRole('OPERATOR_TU')})` },
              { id: 'VERIFIER', label: `Verifikator (${countByRole('VERIFIER')})` },
              { id: 'KEPALA_SEKOLAH', label: `Kepala Sekolah (${countByRole('KEPALA_SEKOLAH')})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setRoleFilter(tab.id as any)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                  roleFilter === tab.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="text-[11px] text-slate-500">
            Sesi Aktif: <strong className="text-slate-900">{activeUser.nama}</strong> ({ROLE_META[activeRole].shortLabel})
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3">Nama, Jabatan & Email</th>
                <th className="p-3 w-44">NIP</th>
                <th className="p-3 w-48">Role / Aturan Akses</th>
                <th className="p-3 w-28 text-center">Rombel Binaan</th>
                <th className="p-3 w-28 text-center">Status Akun</th>
                <th className="p-3 w-44 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((user) => {
                const isActiveSession = user.id === activeUser.id;
                return (
                  <tr key={user.id} className={isActiveSession ? 'bg-blue-50/40' : 'hover:bg-slate-50'}>
                    <td className="p-3">
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <span>{user.nama}</span>
                        {isActiveSession && (
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                            Sedang Aktif
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-600">{user.jabatan}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{user.email}</div>
                    </td>

                    <td className="p-3 font-mono text-[11px] text-slate-700">{user.nip || '-'}</td>

                    <td className="p-3">
                      {canManageAccounts ? (
                        <select
                          value={user.role}
                          onChange={(e) =>
                            handleUpdateUser(user.id, { role: e.target.value as UserRole })
                          }
                          disabled={user.id === 'usr-01'}
                          className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-800 disabled:opacity-60"
                        >
                          {(Object.keys(ROLE_META) as UserRole[]).map((r) => (
                            <option key={r} value={r}>
                              {ROLE_META[r].label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span
                          className={`inline-block text-[10px] font-bold px-2 py-1 rounded border ${ROLE_META[user.role].badgeClass}`}
                        >
                          {ROLE_META[user.role].shortLabel}
                        </span>
                      )}
                    </td>

                    <td className="p-3 text-center">
                      {user.role === 'HOMEROOM_TEACHER' ? (
                        canManageAccounts ? (
                          <select
                            value={user.rombelBinaan || '7A'}
                            onChange={(e) =>
                              handleUpdateUser(user.id, {
                                rombelBinaan: e.target.value,
                                jabatan: `Wali Kelas ${e.target.value}`,
                              })
                            }
                            className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-semibold"
                          >
                            {rombelOptions.map((rm) => (
                              <option key={rm} value={rm}>
                                {rm}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="font-mono font-bold text-slate-800">
                            {user.rombelBinaan || '-'}
                          </span>
                        )
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    <td className="p-3 text-center">
                      <button
                        type="button"
                        disabled={!canManageAccounts || isActiveSession}
                        onClick={() => handleUpdateUser(user.id, { aktif: !user.aktif })}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                          user.aktif
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        } ${!canManageAccounts || isActiveSession ? 'cursor-default opacity-80' : 'cursor-pointer'}`}
                      >
                        {user.aktif ? 'Aktif' : 'Menunggu / Nonaktif'}
                      </button>
                    </td>

                    <td className="p-3">
                      <div className="flex items-center justify-center gap-1.5">
                        {!isActiveSession && user.aktif && (
                          <button
                            type="button"
                            onClick={() => onSwitchActiveUser(user)}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-[10px] font-semibold transition-colors cursor-pointer"
                            title="Gunakan akun ini untuk menguji rule aksesnya"
                          >
                            Gunakan Sesi
                          </button>
                        )}
                        {canManageAccounts && (
                          <button
                            type="button"
                            onClick={() => handleRemoveUser(user.id)}
                            disabled={isActiveSession || formData.pengguna.length <= 1}
                            className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-20 rounded transition-colors cursor-pointer"
                            title="Hapus Akun"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Matriks Rules per Role */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Aturan & Hak Akses per Role (Rules Matrix)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {canManageAccounts
                ? 'Atur kewenangan masing-masing peran (Super Admin, Tata Usaha, Operator, Wali Kelas, Verifikator, Kepala Sekolah).'
                : 'Mode baca: hanya Super Admin yang dapat mengubah aturan hak akses tiap peran.'}
            </p>
          </div>

          {canManageAccounts && (
            <button
              type="button"
              onClick={() =>
                setFormData((prev) => ({
                  ...prev,
                  hakAksesPeran: DEFAULT_ROLE_PERMISSIONS,
                }))
              }
              className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Rules Standar</span>
            </button>
          )}
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3 min-w-[230px]">Kewenangan / Modul Fitur</th>
                {(Object.keys(ROLE_META) as UserRole[]).map((roleKey) => (
                  <th key={roleKey} className="p-3 text-center w-28">
                    {ROLE_META[roleKey].shortLabel}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {PERMISSION_LABELS.map((perm) => (
                <tr key={perm.key} className="hover:bg-slate-50/70">
                  <td className="p-3">
                    <div className="font-bold text-slate-800 flex items-center gap-1.5">
                      <span>{perm.label}</span>
                      {perm.key === 'approvePermohonan' && (
                        <Lock className="w-3 h-3 text-indigo-600 shrink-0" />
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500">{perm.desc}</div>
                  </td>
                  {(Object.keys(ROLE_META) as UserRole[]).map((roleKey) => {
                    const enabled = formData.hakAksesPeran[roleKey]?.[perm.key] ?? false;
                    const locked =
                      !canManageAccounts ||
                      (roleKey === 'SUPER_ADMIN' &&
                        (perm.key === 'approvePermohonan' || perm.key === 'kelolaAkun'));
                    return (
                      <td key={roleKey} className="p-3 text-center">
                        <button
                          type="button"
                          disabled={locked}
                          onClick={() => handleTogglePermission(roleKey, perm.key)}
                          className={`w-7 h-7 rounded-lg inline-flex items-center justify-center border transition-all ${
                            enabled
                              ? 'bg-blue-600 border-blue-600 text-white shadow-2xs'
                              : 'bg-white border-slate-300 text-slate-300 hover:border-slate-400'
                          } ${locked ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                          title={`${ROLE_META[roleKey].shortLabel}: ${enabled ? 'Diizinkan' : 'Dibatasi'}`}
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
  );
};
