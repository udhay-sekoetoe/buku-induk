import React, { useState } from 'react';
import {
  LogIn,
  ShieldCheck,
  AlertCircle,
  UserPlus,
  CheckCircle2,
  Eye,
  EyeOff,
  Clock,
} from 'lucide-react';
import { AppUser, BukuIndukSettings, UserRole } from '../types';
import { DEFAULT_LOGO_SMPN99, DEFAULT_USER_PASSWORD } from '../data/defaultSettings';

export interface RegisterPendingPayload {
  nama: string;
  nip?: string;
  email: string;
  password: string;
  role: Exclude<UserRole, 'SUPER_ADMIN'>;
  jabatan?: string;
  rombelBinaan?: string;
}

interface LoginScreenProps {
  settings: BukuIndukSettings;
  onLoginSuccess: (user: AppUser) => void;
  onRegisterAccount?: (
    payload: RegisterPendingPayload
  ) => { success: boolean; message: string };
}

const REQUESTABLE_ROLES: Array<{
  value: Exclude<UserRole, 'SUPER_ADMIN'>;
  label: string;
  desc: string;
}> = [
  {
    value: 'HOMEROOM_TEACHER',
    label: 'Wali Kelas',
    desc: 'Input nilai rapor Semester 1–6 rombel binaan & cetak rapor/transkrip',
  },
  {
    value: 'ADMIN',
    label: 'Tata Usaha (TU)',
    desc: 'Kelola biodata siswa, verifikasi berkas, mutasi, & cetak buku induk',
  },
  {
    value: 'OPERATOR_TU',
    label: 'Operator Dapodik & Legger',
    desc: 'Entri siswa, input nilai, impor/ekspor CSV & legger tahun ajaran',
  },
  {
    value: 'VERIFIER',
    label: 'Verifikator Berkas',
    desc: 'Periksa & validasi kelengkapan berkas digital peserta didik',
  },
  {
    value: 'KEPALA_SEKOLAH',
    label: 'Kepala Sekolah',
    desc: 'Pantau statistik eksekutif, legger, & laporan buku induk',
  },
];

export const LoginScreen: React.FC<LoginScreenProps> = ({
  settings,
  onLoginSuccess,
  onRegisterAccount,
}) => {
  const [authTab, setAuthTab] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Login Form State (Email & Password only)
  const [emailInput, setEmailInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [showLoginPass, setShowLoginPass] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string>('');

  // Registration Form State
  const [regNama, setRegNama] = useState<string>('');
  const [regNip, setRegNip] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regRole, setRegRole] = useState<Exclude<UserRole, 'SUPER_ADMIN'>>('HOMEROOM_TEACHER');
  const [regRombel, setRegRombel] = useState<string>('7A');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regConfirmPassword, setRegConfirmPassword] = useState<string>('');
  const [showRegPass, setShowRegPass] = useState<boolean>(false);
  const [regError, setRegError] = useState<string>('');
  const [regSuccess, setRegSuccess] = useState<{
    nama: string;
    email: string;
    roleLabel: string;
  } | null>(null);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = emailInput.trim().toLowerCase();
    if (!cleanEmail) {
      setLoginError('Masukkan alamat email pengguna yang terdaftar.');
      return;
    }
    if (!passwordInput) {
      setLoginError('Masukkan password akun Anda.');
      return;
    }

    const matched = (settings.pengguna || []).find(
      (u) => u.email.toLowerCase() === cleanEmail
    );

    if (!matched) {
      setLoginError('Email tidak ditemukan. Periksa kembali atau daftarkan akun baru.');
      return;
    }

    if (!matched.aktif) {
      setLoginError(
        `Akun "${matched.nama}" masih menunggu persetujuan (approval) dari Super Admin.`
      );
      return;
    }

    const expectedPass = matched.password || DEFAULT_USER_PASSWORD;
    if (passwordInput !== expectedPass) {
      setLoginError('Password tidak sesuai. Periksa kembali kata sandi Anda.');
      return;
    }

    setLoginError('');
    onLoginSuccess(matched);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (!regNama.trim()) {
      setRegError('Nama lengkap dan gelar wajib diisi.');
      return;
    }
    if (!regEmail.trim() || !regEmail.includes('@')) {
      setRegError('Masukkan alamat email yang valid.');
      return;
    }
    if (regPassword.length < 6) {
      setRegError('Password minimal 6 karakter.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setRegError('Konfirmasi password tidak cocok.');
      return;
    }

    if (!onRegisterAccount) {
      setRegError('Layanan pendaftaran akun belum tersedia.');
      return;
    }

    const res = onRegisterAccount({
      nama: regNama.trim(),
      nip: regNip.trim() || undefined,
      email: regEmail.trim(),
      password: regPassword,
      role: regRole,
      rombelBinaan: regRole === 'HOMEROOM_TEACHER' ? regRombel.trim() : undefined,
    });

    if (!res.success) {
      setRegError(res.message);
      return;
    }

    const roleMeta = REQUESTABLE_ROLES.find((r) => r.value === regRole);
    setRegSuccess({
      nama: regNama.trim(),
      email: regEmail.trim().toLowerCase(),
      roleLabel: roleMeta?.label || regRole,
    });
    setRegNama('');
    setRegNip('');
    setRegEmail('');
    setRegPassword('');
    setRegConfirmPassword('');
  };

  const selectedRoleInfo = REQUESTABLE_ROLES.find((r) => r.value === regRole);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 font-sans text-slate-900">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
        {/* School Identity Header */}
        <div className="px-6 pt-6 pb-5 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white p-1.5 shrink-0 flex items-center justify-center shadow-sm">
              <img
                src={settings.logoSekolahUrl || DEFAULT_LOGO_SMPN99}
                alt="Logo Resmi SMP Negeri 99 Jakarta"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-blue-300 tracking-wide">
                BUKU INDUK DIGITAL
              </div>
              <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                SMP Negeri 99 Jakarta
              </h1>
              <p className="text-xs text-slate-300 mt-0.5 font-mono tabular-nums">
                NPSN 20103565 · T.A. {settings.tahunAjaranAktif} ({settings.semesterAktif})
              </p>
            </div>
          </div>

          {/* Mode Tabs: Login vs Daftar Akun */}
          <div className="mt-5 grid grid-cols-2 gap-1.5 p-1 bg-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setAuthTab('LOGIN');
                setLoginError('');
              }}
              className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                authTab === 'LOGIN'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Masuk Akun</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthTab('REGISTER');
                setRegError('');
              }}
              className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                authTab === 'REGISTER'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Daftar Pengguna Baru</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-7">
          {authTab === 'LOGIN' ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Login Buku Induk</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Masuk menggunakan email dan password akun SMP Negeri 99 Jakarta yang telah disetujui.
                </p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="login-email"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Email Pengguna
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => {
                      setEmailInput(e.target.value);
                      if (loginError) setLoginError('');
                    }}
                    placeholder="nama@guru.smp.belajar.id"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
                  />
                </div>

                <div>
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="login-password"
                      type={showLoginPass ? 'text' : 'password'}
                      required
                      value={passwordInput}
                      onChange={(e) => {
                        setPasswordInput(e.target.value);
                        if (loginError) setLoginError('');
                      }}
                      placeholder="Masukkan kata sandi akun Anda"
                      className="w-full pl-3.5 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPass(!showLoginPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      aria-label={showLoginPass ? 'Sembunyikan password' : 'Tampilkan password'}
                    >
                      {showLoginPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {loginError && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{loginError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Masuk ke Sistem</span>
                </button>
              </form>

              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <span>Belum memiliki akses akun?</span>
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab('REGISTER');
                    setRegSuccess(null);
                    setRegError('');
                  }}
                  className="font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                >
                  Daftarkan Akun Baru
                </button>
              </div>
            </div>
          ) : regSuccess ? (
            /* Confirmation Panel After Registration */
            <div className="space-y-4 py-2">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>Pendaftaran Akun Berhasil Dikirim</span>
                </div>
                <p className="text-xs text-emerald-900 leading-relaxed">
                  Akun atas nama <strong>{regSuccess.nama}</strong> ({regSuccess.email}) dengan permintaan akses role <strong>{regSuccess.roleLabel}</strong> telah masuk ke antrean persetujuan.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900">
                <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Menunggu Approval Super Admin</div>
                  <p className="mt-0.5 text-amber-800 leading-relaxed">
                    Super Admin akan meninjau dan menyetujui (accept) akun Anda melalui Pusat Approval di Dashboard sebelum Anda dapat masuk.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab('LOGIN');
                    setEmailInput(regSuccess.email);
                    setPasswordInput('');
                    setRegSuccess(null);
                  }}
                  className="flex-1 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  Kembali ke Form Login
                </button>
                <button
                  type="button"
                  onClick={() => setRegSuccess(null)}
                  className="py-2.5 px-4 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Daftar Akun Lain
                </button>
              </div>
            </div>
          ) : (
            /* Self-Service Registration Form */
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Daftar Akun Pengguna Baru</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pilih akses role yang dibutuhkan. Akun aktif setelah mendapat persetujuan Super Admin.
                </p>
              </div>

              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nama Lengkap & Gelar
                    </label>
                    <input
                      type="text"
                      required
                      value={regNama}
                      onChange={(e) => setRegNama(e.target.value)}
                      placeholder="Contoh: Siti Nurhaliza, S.Pd."
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      NIP / NUPTK (Opsional)
                    </label>
                    <input
                      type="text"
                      value={regNip}
                      onChange={(e) => setRegNip(e.target.value)}
                      placeholder="1985xxxxxxxxxxxxxx"
                      className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Pengguna
                  </label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="nama.guru@guru.smp.belajar.id"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className={regRole === 'HOMEROOM_TEACHER' ? '' : 'sm:col-span-2'}>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Akses Role yang Diinginkan
                    </label>
                    <select
                      value={regRole}
                      onChange={(e) =>
                        setRegRole(e.target.value as Exclude<UserRole, 'SUPER_ADMIN'>)
                      }
                      className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                    >
                      {REQUESTABLE_ROLES.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {regRole === 'HOMEROOM_TEACHER' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Rombel Binaan
                      </label>
                      <input
                        type="text"
                        value={regRombel}
                        onChange={(e) => setRegRombel(e.target.value)}
                        placeholder="Contoh: 7A, 8B, 9C"
                        className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                      />
                    </div>
                  )}
                </div>

                {selectedRoleInfo && (
                  <p className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                    Hak akses <strong className="text-slate-700">{selectedRoleInfo.label}</strong>:{' '}
                    {selectedRoleInfo.desc}
                  </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Password (min. 6 karakter)
                    </label>
                    <div className="relative">
                      <input
                        type={showRegPass ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Minimal 6 karakter"
                        className="w-full pl-3 pr-9 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPass(!showRegPass)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showRegPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Konfirmasi Password
                    </label>
                    <input
                      type={showRegPass ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Ulangi password"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                    />
                  </div>
                </div>

                {regError && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{regError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Ajukan Pendaftaran Akun</span>
                </button>
              </form>
            </div>
          )}

          {/* Footer Note */}
          <div className="mt-5 pt-4 border-t border-slate-100 text-[11px] text-slate-500 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0" />
            <span>Akses role dan persetujuan akun dikelola oleh Super Admin SMP Negeri 99 Jakarta.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
