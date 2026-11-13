import React, { useState } from 'react';
import {
  X,
  Printer,
  Edit,
  ArrowRightLeft,
  FileCheck2,
  User,
  Users2,
  Home,
  GraduationCap,
  History,
  FileText,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  Phone,
  MapPin,
  Award,
} from 'lucide-react';
import { Student, VerificationStatus, UserRole, SemesterGradesRecord } from '../types';
import { SemesterGradesTab } from './SemesterGradesTab';

interface StudentProfileModalProps {
  student: Student;
  onClose: () => void;
  onEdit: (student: Student) => void;
  onPrint: (student: Student) => void;
  onPrintSemester?: (studentId: string, semesterNum: number) => void;
  onMutate: (student: Student) => void;
  onVerifyDocument: (studentId: string, docId: string, status: VerificationStatus, note: string) => void;
  onSaveSemesterGrades?: (studentId: string, semesterNum: number, gradesData: SemesterGradesRecord) => void;
  activeRole: UserRole;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  student,
  onClose,
  onEdit,
  onPrint,
  onPrintSemester,
  onMutate,
  onVerifyDocument,
  onSaveSemesterGrades,
  activeRole,
}) => {
  const [activeTab, setActiveTab] = useState<'biodata' | 'orangtua' | 'alamat' | 'akademik' | 'nilai' | 'dokumen' | 'mutasi'>('biodata');

  const tabs = [
    { id: 'biodata', label: '1. Biodata Siswa', icon: User },
    { id: 'orangtua', label: '2. Orang Tua & Wali', icon: Users2 },
    { id: 'alamat', label: '3. Tempat Tinggal', icon: Home },
    { id: 'akademik', label: '4. Riwayat Sekolah & Rombel', icon: GraduationCap },
    { id: 'nilai', label: '5. Nilai Rapor (Sem 1-6)', icon: Award },
    { id: 'dokumen', label: '6. Dokumen Digital', icon: FileCheck2 },
    { id: 'mutasi', label: '7. Mutasi & Alumni', icon: History },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header Banner */}
        <div className="bg-slate-900 text-white p-5 flex items-start justify-between gap-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-14 h-16 rounded-lg bg-blue-700/40 border border-blue-400/40 flex items-center justify-center font-bold text-blue-200 text-sm overflow-hidden shrink-0">
              {student.pasFotoUrl ? (
                <img src={student.pasFotoUrl} alt={student.namaLengkap} className="w-full h-full object-cover" />
              ) : (
                <div className="text-center">
                  <div className="text-xs">FOTO</div>
                  <div className="text-[10px] text-blue-300">3x4</div>
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-blue-400 font-bold">
                  NIS: {student.nis} · NISN: {student.nisn}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    student.status === 'AKTIF'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : student.status === 'MUTASI_KELUAR'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                  }`}
                >
                  {student.status}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white mt-0.5">
                {student.namaLengkap}
              </h2>
              <div className="text-xs text-slate-300 mt-1 flex flex-wrap items-center gap-2">
                <span>Rombel {student.rombel} (Tingkat {student.tingkat})</span>
                <span aria-hidden="true">·</span>
                <span>{student.jenisKelamin === 'L' ? 'Laki-Laki' : 'Perempuan'}</span>
                <span aria-hidden="true">·</span>
                <span>{student.agama}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onPrint(student)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cetak Lembar Induk</span>
            </button>
            <button
              onClick={() => onEdit(student)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
            >
              <Edit className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Edit</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-100 border-b border-slate-200 px-4 flex items-center gap-1 overflow-x-auto shrink-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* TAB 1: BIODATA SISWA */}
          {activeTab === 'biodata' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 text-xs border-b pb-1">Identitas Pokok</h4>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-slate-500">Nama Lengkap</span>
                    <span className="col-span-2 font-semibold text-slate-900">{student.namaLengkap}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-slate-500">Nama Panggilan</span>
                    <span className="col-span-2 font-medium text-slate-800">{student.namaPanggilan || '-'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-slate-500">Nomor Induk Siswa (NIS)</span>
                    <span className="col-span-2 font-mono font-semibold text-slate-900">{student.nis}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-slate-500">NISN (Kemdikbud)</span>
                    <span className="col-span-2 font-mono font-semibold text-slate-900">{student.nisn}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-slate-500">NIK (Dukcapil)</span>
                    <span className="col-span-2 font-mono font-semibold text-slate-900">{student.nik || ('317501' + student.nisn)}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-slate-500">Tempat, Tanggal Lahir</span>
                    <span className="col-span-2 font-medium text-slate-800">
                      {student.tempatLahir}, {student.tanggalLahir}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-slate-500">Jenis Kelamin</span>
                    <span className="col-span-2 font-medium text-slate-800">
                      {student.jenisKelamin === 'L' ? 'Laki-Laki' : 'Perempuan'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-slate-500">Agama</span>
                    <span className="col-span-2 font-medium text-slate-800">{student.agama}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-slate-500">Kewarganegaraan</span>
                    <span className="col-span-2 font-medium text-slate-800">{student.kewarganegaraan || 'WNI'}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 text-xs border-b pb-1">Keluarga & Fisik</h4>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-slate-500">Anak Ke-</span>
                    <span className="col-span-2 font-medium text-slate-800">
                      {student.anakKe} dari {student.jumlahSaudaraKandung + 1} bersaudara
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-slate-500">Status Anak</span>
                    <span className="col-span-2 font-medium text-slate-800">{student.statusAnak}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-slate-500">Bahasa Sehari-hari</span>
                    <span className="col-span-2 font-medium text-slate-800">{student.bahasaSehariHari}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-slate-500">Golongan Darah</span>
                    <span className="col-span-2 font-medium text-slate-800">{student.golonganDarah}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-slate-500">Tinggi / Berat Badan</span>
                    <span className="col-span-2 font-medium text-slate-800 font-mono tabular-nums">
                      {student.tinggiBadanCm} cm / {student.beratBadanKg} kg
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-slate-500">Riwayat Penyakit</span>
                    <span className="col-span-2 text-slate-700">{student.riwayatPenyakit || 'Tidak ada'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-slate-500">Kelainan Jasmani</span>
                    <span className="col-span-2 text-slate-700">{student.kelainanJasmani || 'Tidak ada'}</span>
                  </div>
                </div>
              </div>

              {/* Ekstrakurikuler & Prestasi */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <Award className="w-4 h-4 text-blue-600" />
                  <span>Ekstrakurikuler & Prestasi Peserta Didik</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 block mb-1">EKSTRAKURIKULER:</span>
                    {student.ekstrakurikuler && student.ekstrakurikuler.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {student.ekstrakurikuler.map((ex, i) => (
                          <span key={i} className="bg-white border border-slate-200 px-2 py-0.5 rounded text-[11px] text-slate-700">
                            {ex}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Belum terdaftar ekskul</span>
                    )}
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 block mb-1">PRESTASI / PENGHARGAAN:</span>
                    {student.prestasi && student.prestasi.length > 0 ? (
                      <ul className="list-disc list-inside space-y-0.5 text-slate-700 text-[11px]">
                        {student.prestasi.map((pr, i) => (
                          <li key={i}>{pr}</li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-slate-400 italic">Belum ada catatan prestasi</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ORANG TUA & WALI */}
          {activeTab === 'orangtua' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Ayah Kandung */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 text-xs border-b border-slate-200 pb-1 flex items-center justify-between">
                  <span>A. Keterangan Ayah Kandung</span>
                  <span className="text-[10px] text-slate-500 font-normal">Status: {student.ayah?.status || 'Masih Hidup'}</span>
                </h4>
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-slate-500">Nama Lengkap</span>
                    <span className="col-span-2 font-semibold text-slate-900">{student.ayah?.nama || '-'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-slate-500">Tempat, Tgl Lahir</span>
                    <span className="col-span-2 text-slate-800">{student.ayah?.tempatLahir || '-'}, {student.ayah?.tanggalLahir || '-'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-slate-500">Agama</span>
                    <span className="col-span-2 text-slate-800">{student.ayah?.agama || '-'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-slate-500">Pendidikan Terakhir</span>
                    <span className="col-span-2 text-slate-800">{student.ayah?.pendidikanTerakhir || '-'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-slate-500">Pekerjaan</span>
                    <span className="col-span-2 text-slate-800 font-medium">{student.ayah?.pekerjaan || '-'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-slate-500">No. Telepon / WA</span>
                    <span className="col-span-2 text-blue-700 font-mono">{student.ayah?.noHp || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Ibu Kandung */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 text-xs border-b border-slate-200 pb-1 flex items-center justify-between">
                  <span>B. Keterangan Ibu Kandung</span>
                  <span className="text-[10px] text-slate-500 font-normal">Status: {student.ibu?.status || 'Masih Hidup'}</span>
                </h4>
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-slate-500">Nama Lengkap</span>
                    <span className="col-span-2 font-semibold text-slate-900">{student.ibu?.nama || '-'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-slate-500">Tempat, Tgl Lahir</span>
                    <span className="col-span-2 text-slate-800">{student.ibu?.tempatLahir || '-'}, {student.ibu?.tanggalLahir || '-'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-slate-500">Agama</span>
                    <span className="col-span-2 text-slate-800">{student.ibu?.agama || '-'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-slate-500">Pendidikan Terakhir</span>
                    <span className="col-span-2 text-slate-800">{student.ibu?.pendidikanTerakhir || '-'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-slate-500">Pekerjaan</span>
                    <span className="col-span-2 text-slate-800 font-medium">{student.ibu?.pekerjaan || '-'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-slate-500">No. Telepon / WA</span>
                    <span className="col-span-2 text-blue-700 font-mono">{student.ibu?.noHp || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Wali Siswa (jika ada) */}
              <div className="p-4 bg-white rounded-xl border border-slate-200 md:col-span-2 space-y-3">
                <h4 className="font-bold text-slate-900 text-xs border-b border-slate-200 pb-1">
                  C. Keterangan Wali Murid (Jika Tidak Tinggal Bersama Orang Tua)
                </h4>
                {student.wali?.nama ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="grid grid-cols-3 gap-1">
                        <span className="text-slate-500">Nama Wali</span>
                        <span className="col-span-2 font-semibold text-slate-900">{student.wali.nama}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        <span className="text-slate-500">Hubungan Keluarga</span>
                        <span className="col-span-2 text-slate-800">{student.wali.hubunganKeluarga}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="grid grid-cols-3 gap-1">
                        <span className="text-slate-500">Pekerjaan Wali</span>
                        <span className="col-span-2 text-slate-800">{student.wali.pekerjaan}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        <span className="text-slate-500">No. Kontak / WA</span>
                        <span className="col-span-2 text-blue-700 font-mono">{student.wali.noHp}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-500 italic">Peserta didik tinggal bersama orang tua kandung (tidak menggunakan wali).</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: TEMPAT TINGGAL & KONTAK */}
          {activeTab === 'alamat' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2.5">
                  <h4 className="font-bold text-slate-900 text-xs border-b pb-1">Alamat Domisili</h4>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-slate-500">Jalan & Nomor</span>
                    <span className="col-span-2 font-medium text-slate-900">{student.alamatJalan}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-slate-500">RT / RW</span>
                    <span className="col-span-2 text-slate-800 font-mono">RT {student.rt} / RW {student.rw}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-slate-500">Kelurahan</span>
                    <span className="col-span-2 text-slate-800">{student.kelurahan}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-slate-500">Kecamatan</span>
                    <span className="col-span-2 text-slate-800">{student.kecamatan}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-slate-500">Kota / Kabupaten</span>
                    <span className="col-span-2 text-slate-800">{student.kotaKabupaten}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-slate-500">Kode Pos</span>
                    <span className="col-span-2 text-slate-800 font-mono">{student.kodePos}</span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <h4 className="font-bold text-slate-900 text-xs border-b pb-1">Akses & Komunikasi</h4>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-slate-500">Tinggal Bersama</span>
                    <span className="col-span-2 font-semibold text-slate-900">{student.tinggalDengan}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-slate-500">Jarak ke SMPN 99</span>
                    <span className="col-span-2 text-slate-800 font-mono tabular-nums">{student.jarakKeSekolahKm} km</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-slate-500">Moda Transportasi</span>
                    <span className="col-span-2 text-slate-800 font-medium">{student.transportasi}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-slate-500">No. HP Siswa</span>
                    <span className="col-span-2 text-blue-700 font-mono">{student.noHpSiswa || '-'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: AKADEMIK & RIWAYAT KELAS */}
          {activeTab === 'akademik' && (
            <div className="space-y-6">
              {/* Asal Sekolah */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-900 text-xs mb-3 border-b pb-1">
                  A. Sekolah Asal (SD / MI) & Penerimaan di SMP Negeri 99
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-1">
                      <span className="text-slate-500">Nama SD Asal</span>
                      <span className="col-span-2 font-semibold text-slate-900">{student.sekolahAsal?.namaSd}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      <span className="text-slate-500">NPSN SD</span>
                      <span className="col-span-2 font-mono text-slate-800">{student.sekolahAsal?.npsnSd}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      <span className="text-slate-500">Tahun Lulus SD</span>
                      <span className="col-span-2 font-mono text-slate-800">{student.sekolahAsal?.tahunLulusSd}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      <span className="text-slate-500">No. Ijazah SD</span>
                      <span className="col-span-2 font-mono text-slate-800">{student.sekolahAsal?.noIjazahSd}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-1">
                      <span className="text-slate-500">Tgl Diterima di SMPN 99</span>
                      <span className="col-span-2 font-medium text-slate-900">{student.penerimaan?.tanggalDiterima}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      <span className="text-slate-500">Diterima di Tingkat/Kelas</span>
                      <span className="col-span-2 font-medium text-slate-900">
                        Kelas {student.penerimaan?.tingkatAwal} ({student.penerimaan?.rombelAwal})
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      <span className="text-slate-500">Jalur Penerimaan</span>
                      <span className="col-span-2 font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded w-max">
                        {student.penerimaan?.jalurPenerimaan}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabel Riwayat Kenaikan Kelas per Semester */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 text-xs">
                  B. Catatan Riwayat Kenaikan Kelas & Semester
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                        <th className="py-2.5 px-3">Tahun Ajaran</th>
                        <th className="py-2.5 px-3">Semester</th>
                        <th className="py-2.5 px-3">Kelas / Rombel</th>
                        <th className="py-2.5 px-3">Wali Kelas</th>
                        <th className="py-2.5 px-3 text-center">Kehadiran (S/I/A)</th>
                        <th className="py-2.5 px-3">Status Kenaikan / Keterangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {student.riwayatKelas && student.riwayatKelas.length > 0 ? (
                        student.riwayatKelas.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-mono font-medium text-slate-900">{item.tahunAjaran}</td>
                            <td className="py-2.5 px-3">{item.semester}</td>
                            <td className="py-2.5 px-3 font-semibold text-slate-800">Kelas {item.rombel}</td>
                            <td className="py-2.5 px-3 text-slate-700">{item.waliKelas}</td>
                            <td className="py-2.5 px-3 text-center font-mono tabular-nums text-slate-600">
                              {item.kehadiranSakit || 0} / {item.kehadiranIzin || 0} / {item.kehadiranTanpaKeterangan || 0}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-blue-700">{item.statusKenaikan}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-4 text-center text-slate-400">
                            Belum ada riwayat kelas terdokumentasi
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: NILAI RAPOR KURIKULUM MERDEKA (SEMESTER 1 S/D 6) */}
          {activeTab === 'nilai' && (
            <SemesterGradesTab
              student={student}
              activeRole={activeRole}
              onSaveGrades={(semNum, updatedRecord) => {
                if (onSaveSemesterGrades) {
                  onSaveSemesterGrades(student.id, semNum, updatedRecord);
                }
              }}
              onPrintSemester={(studentId, semNum) => {
                if (onPrintSemester) {
                  onPrintSemester(studentId, semNum);
                } else {
                  onPrint(student);
                }
              }}
            />
          )}

          {/* TAB 6: DOKUMEN DIGITAL SISWA */}
          {activeTab === 'dokumen' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">Arsip Berkas Digital Peserta Didik</h4>
                  <p className="text-[11px] text-slate-500">
                    Dokumen syarat Buku Induk disimpan secara privat & terenkripsi
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                  {student.dokumen?.length || 0} Dokumen Terlampir
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {student.dokumen && student.dokumen.length > 0 ? (
                  student.dokumen.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-2 hover:border-blue-300 transition-colors shadow-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                          <div>
                            <div className="font-bold text-slate-900 text-xs">{doc.jenisDokumen}</div>
                            <div className="text-[11px] text-slate-500 font-mono">{doc.fileName} ({doc.fileSize})</div>
                          </div>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${
                            doc.statusVerifikasi === 'TERVERIFIKASI'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : doc.statusVerifikasi === 'MENUNGGU_VERIFIKASI'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {doc.statusVerifikasi}
                        </span>
                      </div>

                      <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-100">
                        <span>Diunggah: {doc.uploadDate}</span>
                        <span>Oleh: {doc.uploaderName.split(',')[0]}</span>
                      </div>

                      {doc.catatan && (
                        <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 italic">
                          Catatan: {doc.catatan}
                        </p>
                      )}

                      {/* Verifier action buttons */}
                      {(activeRole === 'SUPER_ADMIN' ||
                        activeRole === 'ADMIN' ||
                        activeRole === 'VERIFIER' ||
                        activeRole === 'OPERATOR_TU') && (
                        <div className="flex items-center gap-2 pt-2">
                          <button
                            onClick={() => onVerifyDocument(student.id, doc.id, 'TERVERIFIKASI', 'Sesuai dokumen fisik asli')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-semibold transition-colors"
                          >
                            Setujui
                          </button>
                          <button
                            onClick={() => {
                              const note = prompt('Masukkan alasan perbaikan / kekurangan dokumen:', 'Scan kurang jelas');
                              if (note) onVerifyDocument(student.id, doc.id, 'PERLU_PERBAIKAN', note);
                            }}
                            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[10px] font-semibold transition-colors"
                          >
                            Perlu Perbaikan
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 py-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    Belum ada dokumen digital yang diunggah untuk siswa ini
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: MUTASI & ALUMNI */}
          {activeTab === 'mutasi' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">Catatan Mutasi Siswa / Kelulusan</h4>
                  <p className="text-[11px] text-slate-500">
                    Sesuai petunjuk teknis Buku Induk, data siswa yang keluar atau lulus tidak boleh dihapus melainkan dicatat status mutasinya.
                  </p>
                </div>
                <button
                  onClick={() => onMutate(student)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>Proses Mutasi / Lulus</span>
                </button>
              </div>

              {student.mutasi ? (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">
                      Jenis Transaksi: {student.mutasi.jenis}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">
                      Tanggal: {student.mutasi.tanggal}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Nomor Surat Keterangan:</span>
                      <span className="font-mono font-semibold text-slate-900">{student.mutasi.noSurat}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Sekolah Tujuan / Lanjutan:</span>
                      <span className="font-semibold text-slate-900">{student.mutasi.sekolahTujuan || '-'}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-500 block text-[11px]">Alasan Mutasi / Keterangan:</span>
                      <p className="text-slate-800 font-medium mt-0.5">{student.mutasi.alasan}</p>
                    </div>
                    <div className="col-span-2 pt-2 border-t border-slate-200 text-[11px] text-slate-500 flex justify-between">
                      <span>Disetujui Oleh: {student.mutasi.disetujuiOleh}</span>
                      <span>Kelas Terakhir: {student.mutasi.kelasSaatKeluar}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p className="font-bold text-slate-900 text-xs">Siswa Aktif di SMP Negeri 99 Jakarta</p>
                  <p className="text-slate-500 text-[11px] max-w-md mx-auto">
                    Peserta didik ini berstatus AKTIF pada Tahun Ajaran berjalan. Jika siswa pindah sekolah atau lulus, gunakan tombol Proses Mutasi / Lulus di atas.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0 text-xs text-slate-500">
          <div>
            Terakhir diperbarui: {new Date(student.updatedAt).toLocaleDateString('id-ID')} oleh {student.updatedBy}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-semibold text-xs transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
