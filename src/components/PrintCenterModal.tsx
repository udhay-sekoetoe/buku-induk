import React, { useState } from 'react';
import {
  X,
  Printer,
  ChevronLeft,
  ChevronRight,
  FileText,
  Award,
  Layers,
  Settings as SettingsIcon,
} from 'lucide-react';
import { Student, BukuIndukSettings, SemesterGradesRecord } from '../types';
import { SMPN99_INFO } from '../data/mockData';
import { DEFAULT_LOGO_SMPN99 } from '../data/defaultSettings';
import { storageService } from '../services/storageService';
import { generateDefaultSemesterGrades, STANDARD_SUBJECTS_TEMPLATE } from '../data/defaultGrades';
import {
  getFormattedPrintDate,
  resolveWaliKelasForStudent,
  resolveSignatureSlot,
  ResolvedSignature,
} from '../utils/printHelpers';

interface PrintCenterModalProps {
  students: Student[];
  initialStudentId?: string;
  initialSemester?: number;
  initialDocType?: 'LEMBAR_BIODATA' | 'RAPOR_SEMESTER' | 'TRANSKRIP_6_SEMESTER';
  settings?: BukuIndukSettings;
  onClose: () => void;
}

export const PrintCenterModal: React.FC<PrintCenterModalProps> = ({
  students,
  initialStudentId,
  initialSemester = 1,
  initialDocType = 'LEMBAR_BIODATA',
  settings,
  onClose,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    initialStudentId || (students.length > 0 ? students[0].id : '')
  );
  const [docType, setDocType] = useState<'LEMBAR_BIODATA' | 'RAPOR_SEMESTER' | 'TRANSKRIP_6_SEMESTER'>(
    initialDocType
  );
  const [selectedSemester, setSelectedSemester] = useState<number>(initialSemester);

  const effectiveSettings = settings || storageService.getSettings();

  const student = students.find((s) => s.id === selectedStudentId) || students[0];
  const currentIndex = students.findIndex((s) => s.id === student?.id);

  const handlePrev = () => {
    if (currentIndex > 0) {
      setSelectedStudentId(students[currentIndex - 1].id);
    }
  };

  const handleNext = () => {
    if (currentIndex < students.length - 1) {
      setSelectedStudentId(students[currentIndex + 1].id);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!student) {
    return null;
  }

  // Determine Titimangsa Date
  const currentDateFormatted = getFormattedPrintDate(effectiveSettings);

  // Guarantee grades data
  const grades = student.riwayatNilai || generateDefaultSemesterGrades(student.namaLengkap, student.nis, 2024);
  const currentSemesterRecord: SemesterGradesRecord =
    grades[selectedSemester] || generateDefaultSemesterGrades(student.namaLengkap, student.nis, 2024)[selectedSemester];

  // Matched Wali Kelas from settings
  const matchedWaliKelas = resolveWaliKelasForStudent(effectiveSettings, student, {
    nama: currentSemesterRecord.waliKelas,
    nip: currentSemesterRecord.nipWaliKelas,
  });

  // Resolve configurable Left & Right signatures
  const sigKiri = resolveSignatureSlot(
    effectiveSettings.tandaTangan.kiri,
    effectiveSettings,
    student,
    matchedWaliKelas
  );
  const sigKanan = resolveSignatureSlot(
    effectiveSettings.tandaTangan.kanan,
    effectiveSettings,
    student,
    matchedWaliKelas
  );
  const showPengawasMiddle =
    effectiveSettings.tandaTangan.tampilkanTengahPengawas ||
    effectiveSettings.tataLetak.tampilkanPengawasPemeriksa;

  // Dynamic @page size and margin
  const pageSizeCss =
    effectiveSettings.tataLetak.ukuranKertas === 'F4'
      ? '215mm 330mm'
      : effectiveSettings.tataLetak.ukuranKertas === 'Legal'
      ? 'legal portrait'
      : 'A4 portrait';

  const pageMarginCss =
    effectiveSettings.tataLetak.margin === 'RAPAT'
      ? '7mm 8mm 8mm 8mm'
      : effectiveSettings.tataLetak.margin === 'LEBAR'
      ? '15mm 15mm 15mm 15mm'
      : '10mm 12mm 12mm 12mm';

  // Calculations for semester report
  const totalNilaiSem = currentSemesterRecord.mataPelajaran.reduce(
    (acc, m) => acc + (m.nilaiAkhir || 0),
    0
  );
  const rataRataNilaiSem =
    currentSemesterRecord.mataPelajaran.length > 0
      ? (totalNilaiSem / currentSemesterRecord.mataPelajaran.length).toFixed(1)
      : '0.0';

  const semesterAverages = [1, 2, 3, 4, 5, 6]
    .map((num) => {
      const list = grades[num]?.mataPelajaran || [];
      const sum = list.reduce((a, b) => a + (b.nilaiAkhir || 0), 0);
      return list.length > 0 ? sum / list.length : null;
    })
    .filter((v): v is number => v !== null);
  const grandAverage =
    semesterAverages.length > 0
      ? (semesterAverages.reduce((a, b) => a + b, 0) / semesterAverages.length).toFixed(1)
      : '-';

  const renderSignatureBox = (sig: ResolvedSignature, compact = false) => {
    if (!sig.tampilkan) return null;
    return (
      <div className="text-center">
        <div className={`${compact ? 'text-[9.5px]' : 'text-[10px]'} text-slate-600 min-h-[14px]`}>
          {sig.headerLine1 || '\u00A0'}
        </div>
        <div className={`font-bold ${compact ? 'text-[10px]' : 'text-[10.5px]'}`}>
          {sig.labelJabatan}
        </div>
        <div className={`${compact ? 'h-14' : 'h-16'} flex items-center justify-center text-slate-300 text-[8.5px] italic`}>
          {sig.tampilkanStempelArea ? '[ Tanda Tangan & Stempel ]' : '[ Tanda Tangan ]'}
        </div>
        <div className={`font-bold underline uppercase ${compact ? 'text-[9.5px]' : 'text-[10px]'}`}>
          {sig.nama}
        </div>
        {sig.tampilkanNip && (
          <div className="text-[8.5px] font-mono text-slate-600">
            {sig.nip.startsWith('NIS') || sig.nip.startsWith('NIP') ? sig.nip : `NIP. ${sig.nip}`}
          </div>
        )}
      </div>
    );
  };

  const logoSizePx = effectiveSettings.ukuranLogoPx || 56;
  const kopBorderClass =
    effectiveSettings.gayaGarisKop === 'TANPA_GARIS'
      ? 'border-b-0 pb-1'
      : effectiveSettings.gayaGarisKop === 'TUNGGAL'
      ? 'border-b-2 border-solid border-black pb-2'
      : 'border-b-4 border-double border-black pb-2';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto">
      <style media="print">{`
        @page {
          size: ${pageSizeCss};
          margin: ${pageMarginCss};
        }
      `}</style>
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[96vh] print:max-h-none print:shadow-none print:border-none print:rounded-none print-container">
        {/* Navigation & Controls Bar (Hidden during printing) */}
        <div className="no-print bg-slate-900 text-white p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white tracking-tight flex items-center gap-2">
                <span>Pusat Cetak Buku Induk Digital</span>
                <span className="bg-blue-500/30 text-blue-300 text-[10px] font-mono px-2 py-0.5 rounded">
                  Kurikulum Merdeka SMPN 99
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                Format Resmi Formulir & Laporan Hasil Capaian Pembelajaran (Rapor)
              </div>
            </div>
          </div>

          {/* Student Selector Dropdown & Arrows */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrev}
              disabled={currentIndex <= 0}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 rounded text-slate-300 transition-colors"
              title="Siswa Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="bg-slate-800 text-slate-100 text-xs rounded border border-slate-700 py-1.5 px-3 max-w-[210px] sm:max-w-[260px] focus:outline-none focus:border-blue-500 font-medium truncate"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nis} - {s.namaLengkap} ({s.rombel})
                </option>
              ))}
            </select>
            <button
              onClick={handleNext}
              disabled={currentIndex >= students.length - 1}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 rounded text-slate-300 transition-colors"
              title="Siswa Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Actions: Print / PDF & Close */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
              title="Cetak langsung ke printer atau Simpan sebagai PDF"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Simpan PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Secondary Document Format Switcher (Hidden in Print) */}
        <div className="no-print bg-slate-800 text-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-700 text-xs">
          <div className="flex items-center gap-2 font-semibold">
            <span className="text-slate-400">Pilih Jenis Lembar:</span>
            <div className="inline-flex rounded-lg bg-slate-900 p-0.5 border border-slate-700">
              <button
                onClick={() => setDocType('LEMBAR_BIODATA')}
                className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  docType === 'LEMBAR_BIODATA'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>1. Lembar Data Pribadi (A - L)</span>
              </button>

              <button
                onClick={() => setDocType('RAPOR_SEMESTER')}
                className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  docType === 'RAPOR_SEMESTER'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>2. Lembar Nilai Rapor Semester</span>
              </button>

              <button
                onClick={() => setDocType('TRANSKRIP_6_SEMESTER')}
                className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  docType === 'TRANSKRIP_6_SEMESTER'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>3. Laporan Nilai Buku Induk (Sem 1–6)</span>
              </button>
            </div>
          </div>

          {/* Semester Selector when docType is RAPOR_SEMESTER */}
          {docType === 'RAPOR_SEMESTER' && (
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-xs">Pilih Semester:</span>
              <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-700">
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <button
                    key={num}
                    onClick={() => setSelectedSemester(num)}
                    className={`px-2 py-0.5 rounded text-xs font-bold ${
                      selectedSemester === num
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Sem {num}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* PRINTABLE PAPER VIEWPORT */}
        <div className="p-6 md:p-12 overflow-y-auto flex-1 bg-white print:p-0 print:overflow-visible font-sans text-black leading-relaxed text-[11px] selection:bg-slate-200">
          <div className="max-w-[800px] mx-auto print:max-w-none">
            {/* ============================================================ */}
            {/* KOP SURAT RESMI (SESUAI PENGATURAN) */}
            {/* ============================================================ */}
            {effectiveSettings.tampilkanKopSurat && (
              <div className={`${kopBorderClass} mb-4 text-center font-serif text-black`}>
                <div className="flex items-center justify-between gap-3">
                  {effectiveSettings.tampilkanLogoDinas && effectiveSettings.logoDinasUrl ? (
                    <img
                      src={effectiveSettings.logoDinasUrl}
                      alt="Logo Dinas DKI"
                      style={{ width: `${logoSizePx}px`, height: `${logoSizePx}px` }}
                      className="object-contain shrink-0"
                    />
                  ) : (
                    <div style={{ width: `${logoSizePx}px`, height: `${logoSizePx}px` }} className="shrink-0" />
                  )}

                  <div className="flex-1 space-y-0.5 font-sans">
                    <div className="text-[10px] font-bold tracking-wider uppercase text-black">
                      {effectiveSettings.headerKopBaris1}
                    </div>
                    <div className="text-[11px] font-extrabold uppercase text-black">
                      {effectiveSettings.headerKopBaris2}
                    </div>
                    <div className="text-[13px] font-black uppercase text-black tracking-wide">
                      {effectiveSettings.headerKopBaris3}
                    </div>
                    <div className="text-[9.5px] text-slate-700">
                      {effectiveSettings.headerKopAlamat}
                    </div>
                    <div className="text-[9px] text-slate-600 font-mono">
                      {effectiveSettings.headerKopKontak}
                    </div>
                  </div>

                  {effectiveSettings.tampilkanLogoSekolah ? (
                    <img
                      src={effectiveSettings.logoSekolahUrl || DEFAULT_LOGO_SMPN99}
                      alt="Logo SMPN 99"
                      style={{ width: `${logoSizePx}px`, height: `${logoSizePx}px` }}
                      className="object-contain shrink-0"
                    />
                  ) : (
                    <div style={{ width: `${logoSizePx}px`, height: `${logoSizePx}px` }} className="shrink-0" />
                  )}
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* DOCUMENT 1: LEMBAR BIODATA PRIBADI (A S/D L) */}
            {/* ============================================================ */}
            {docType === 'LEMBAR_BIODATA' && (
              <>
                {/* PAGE 1: BAGIAN A S/D D */}
                <div className="page-section pb-8 print:pb-0">
                  {/* HEADER FORM */}
                  <div className="mb-4 text-left">
                    <h1 className="font-bold text-[12.5px] uppercase tracking-wide text-black mb-3">
                      LEMBAR DATA PESERTA DIDIK KURIKULUM MERDEKA SMP NEGERI 99 JAKARTA
                    </h1>

                    <div className="space-y-0.5 font-bold text-[11px]">
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-4 sm:col-span-3">NOMOR INDUK SISWA SEKOLAH</span>
                        <span className="col-span-8 sm:col-span-9 font-mono">: {student.nis}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-4 sm:col-span-3">NOMOR INDUK SISWA NASIONAL</span>
                        <span className="col-span-8 sm:col-span-9 font-mono">: {student.nisn}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-4 sm:col-span-3">NOMOR KODE SEKOLAH</span>
                        <span className="col-span-8 sm:col-span-9 font-mono">: {SMPN99_INFO.npsn}</span>
                      </div>
                    </div>
                  </div>

                  {/* A. KETERANGAN DATA PRIBADI PESERTA DIDIK */}
                  <div className="relative mb-6">
                    {/* Photo Box 1 */}
                    {effectiveSettings.tataLetak.tampilkanKotakFoto && (
                      <div className="absolute right-0 top-0 w-28 h-36 border border-black flex flex-col items-center justify-center text-center p-1 bg-white shrink-0 z-10">
                        {student.pasFotoUrl ? (
                          <img
                            src={student.pasFotoUrl}
                            alt={student.namaLengkap}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <>
                            <div className="text-[10px] font-medium leading-tight">Pas Photo</div>
                            <div className="text-[9.5px] text-slate-700">3x4 cm</div>
                            <div className="text-[8.5px] text-slate-600 mt-2 leading-tight">
                              Waktu diterima
                              <br />
                              Di Sekolah ini
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    <div className="font-bold text-[11px] mb-2 uppercase">
                      A. KETERANGAN DATA PRIBADI PESERTA DIDIK
                    </div>

                    <div className={`space-y-1 ${effectiveSettings.tataLetak.tampilkanKotakFoto ? 'pr-32' : ''}`}>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-5 sm:col-span-4">1. Nama Peserta Didik</span>
                        <span className="col-span-7 sm:col-span-8 font-semibold uppercase">: {student.namaLengkap}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-5 sm:col-span-4">2. Jenis Kelamin</span>
                        <span className="col-span-7 sm:col-span-8">: {student.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-5 sm:col-span-4">3. NIK</span>
                        <span className="col-span-7 sm:col-span-8 font-mono">: {student.nik || '317501' + student.nisn}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-5 sm:col-span-4">4. Tempat Lahir</span>
                        <span className="col-span-7 sm:col-span-8">: {student.tempatLahir}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-5 sm:col-span-4">5. Tanggal Lahir</span>
                        <span className="col-span-7 sm:col-span-8">: {student.tanggalLahir}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-5 sm:col-span-4">6. Agama</span>
                        <span className="col-span-7 sm:col-span-8">: {student.agama}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-5 sm:col-span-4">7. Kewarganegaraan</span>
                        <span className="col-span-7 sm:col-span-8">: {student.kewarganegaraan || 'WNI'}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-5 sm:col-span-4">8. Anak Ke</span>
                        <span className="col-span-7 sm:col-span-8">: {student.anakKe}</span>
                      </div>
                      <div>
                        <div className="grid grid-cols-12 gap-1">
                          <span className="col-span-5 sm:col-span-4">9. Jumlah Saudara</span>
                          <span className="col-span-7 sm:col-span-8"></span>
                        </div>
                        <div className="pl-4 space-y-0.5 mt-0.5">
                          <div className="grid grid-cols-12 gap-1">
                            <span className="col-span-5 sm:col-span-4">a. Kandung</span>
                            <span className="col-span-7 sm:col-span-8">: {student.jumlahSaudaraKandung} orang</span>
                          </div>
                          <div className="grid grid-cols-12 gap-1">
                            <span className="col-span-5 sm:col-span-4">b. Tiri</span>
                            <span className="col-span-7 sm:col-span-8">: {student.jumlahSaudaraTiri ?? 0} orang</span>
                          </div>
                          <div className="grid grid-cols-12 gap-1">
                            <span className="col-span-5 sm:col-span-4">c. Angkat</span>
                            <span className="col-span-7 sm:col-span-8">: {student.jumlahSaudaraAngkat ?? 0} orang</span>
                          </div>
                          <div className="grid grid-cols-12 gap-1">
                            <span className="col-span-5 sm:col-span-4">d. Yatim/Yatim Piatu</span>
                            <span className="col-span-7 sm:col-span-8">: {student.statusYatimPiatu || 'Bukan Yatim/Piatu'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-5 sm:col-span-4">10. Bahasa Sehari-hari Di Rumah</span>
                        <span className="col-span-7 sm:col-span-8">: {student.bahasaSehariHari}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-5 sm:col-span-4">11. Tempat Tinggal Bersama</span>
                        <span className="col-span-7 sm:col-span-8">: {student.tinggalDengan}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-5 sm:col-span-4">12. Mode Transportasi ke Sekolah</span>
                        <span className="col-span-7 sm:col-span-8">: {student.transportasi}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-5 sm:col-span-4">13. Jarak Ke Sekolah</span>
                        <span className="col-span-7 sm:col-span-8">: {student.jarakKeSekolahKm} km</span>
                      </div>
                    </div>
                  </div>

                  {/* B. KETERANGAN TEMPAT TINGGAL PESERTA DIDIK */}
                  <div className="relative mb-6">
                    {effectiveSettings.tataLetak.tampilkanKotakFoto && (
                      <div className="absolute right-0 top-0 w-28 h-36 border border-black flex flex-col items-center justify-center text-center p-1 bg-white shrink-0 z-10">
                        <div className="text-[10px] font-medium leading-tight">Pas Photo</div>
                        <div className="text-[9.5px] text-slate-700">3x4 cm</div>
                        <div className="text-[8.5px] text-slate-600 mt-2 leading-tight">
                          Waktu diterima<br />Di Sekolah ini
                        </div>
                      </div>
                    )}

                    <div className="font-bold text-[11px] mb-2 uppercase">
                      B. KETERANGAN TEMPAT TINGGAL PESERTA DIDIK
                    </div>

                    <div className={`space-y-1 ${effectiveSettings.tataLetak.tampilkanKotakFoto ? 'pr-32' : ''}`}>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-5 sm:col-span-4">1. Alamat Lengkap</span>
                        <span className="col-span-7 sm:col-span-8">: {student.alamatJalan}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-5 sm:col-span-4">2. RT/RW</span>
                        <span className="col-span-7 sm:col-span-8">: RT {student.rt} / RW {student.rw}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-5 sm:col-span-4">3. Nama Desa/Kelurahan</span>
                        <span className="col-span-7 sm:col-span-8">: {student.kelurahan}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-5 sm:col-span-4">4. Kecamatan</span>
                        <span className="col-span-7 sm:col-span-8">: {student.kecamatan}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-5 sm:col-span-4">5. Kode Pos & No. Telp</span>
                        <span className="col-span-7 sm:col-span-8">: {student.kodePos} / {student.noHpSiswa || student.noTeleponRumah || '-'}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-5 sm:col-span-4">6. Kabupaten/Kota</span>
                        <span className="col-span-7 sm:col-span-8">: {student.kotaKabupaten}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-5 sm:col-span-4">7. Provinsi</span>
                        <span className="col-span-7 sm:col-span-8">: {student.provinsi}</span>
                      </div>
                    </div>
                  </div>

                  {/* C. KETERANGAN KESEHATAN PESERTA DIDIK */}
                  <div className="relative mb-6">
                    {effectiveSettings.tataLetak.tampilkanKotakFoto && (
                      <div className="absolute right-0 top-0 w-28 h-36 border border-black flex flex-col items-center justify-center text-center p-1 bg-white shrink-0 z-10">
                        <div className="text-[10px] font-medium leading-tight">Pas Photo</div>
                        <div className="text-[9.5px] text-slate-700">3x4 cm</div>
                        <div className="text-[8.5px] text-slate-600 mt-2 leading-tight">
                          Waktu diterima<br />Di Sekolah ini
                        </div>
                      </div>
                    )}

                    <div className="font-bold text-[11px] mb-2 uppercase">
                      C. KETERANGAN KESEHATAN PESERTA DIDIK
                    </div>

                    <div className={`space-y-1 ${effectiveSettings.tataLetak.tampilkanKotakFoto ? 'pr-32' : ''}`}>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-5 sm:col-span-4">1. Golongan Darah</span>
                        <span className="col-span-7 sm:col-span-8">: {student.golonganDarah}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-5 sm:col-span-4">2. Penyakit Yang Pernah Di Derita</span>
                        <span className="col-span-7 sm:col-span-8">: {student.riwayatPenyakit || '-'}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-5 sm:col-span-4">3. Penyakit Yang Lain</span>
                        <span className="col-span-7 sm:col-span-8">: {student.penyakitLain || '-'}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-5 sm:col-span-4">4. Kelainan Jasmani</span>
                        <span className="col-span-7 sm:col-span-8">: {student.kelainanJasmani || 'Tidak Ada'}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-5 sm:col-span-4">5. Tinggi dan Berat Badan</span>
                        <span className="col-span-7 sm:col-span-8">: {student.tinggiBadanCm} cm / {student.beratBadanKg} kg</span>
                      </div>
                    </div>
                  </div>

                  {/* D. KETERANGAN PENDIDIKAN PESERTA DIDIK */}
                  <div className="relative mb-6">
                    {effectiveSettings.tataLetak.tampilkanKotakFoto && (
                      <div className="absolute right-0 top-0 w-28 h-36 border border-black flex flex-col items-center justify-center text-center p-1 bg-white shrink-0 z-10">
                        <div className="text-[10px] font-medium leading-tight">Pas Photo</div>
                        <div className="text-[9.5px] text-slate-700">3x4 cm</div>
                        <div className="text-[8.5px] text-slate-600 mt-2 leading-tight">
                          Waktu diterima<br />Di Sekolah ini
                        </div>
                      </div>
                    )}

                    <div className="font-bold text-[11px] mb-2 uppercase">
                      D. KETERANGAN PENDIDIKAN PESERTA DIDIK
                    </div>

                    <div className={`space-y-1 ${effectiveSettings.tataLetak.tampilkanKotakFoto ? 'pr-32' : ''}`}>
                      <div>
                        <div className="grid grid-cols-12 gap-1">
                          <span className="col-span-5 sm:col-span-4">1. Pendidikan Sebelumnya</span>
                          <span className="col-span-7 sm:col-span-8"></span>
                        </div>
                        <div className="pl-4 space-y-0.5 mt-0.5">
                          <div className="grid grid-cols-12 gap-1">
                            <span className="col-span-5 sm:col-span-4">a. Lulus Dari</span>
                            <span className="col-span-7 sm:col-span-8 font-semibold">: {student.sekolahAsal?.namaSd}</span>
                          </div>
                          <div className="grid grid-cols-12 gap-1">
                            <span className="col-span-5 sm:col-span-4">b. Tanggal dan Nomor Ijazah</span>
                            <span className="col-span-7 sm:col-span-8 font-mono">: {student.sekolahAsal?.noIjazahSd}</span>
                          </div>
                          <div className="grid grid-cols-12 gap-1">
                            <span className="col-span-5 sm:col-span-4">c. Lama Belajar di Sekolah</span>
                            <span className="col-span-7 sm:col-span-8">: 6 Tahun</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="grid grid-cols-12 gap-1">
                          <span className="col-span-5 sm:col-span-4">2. Pindah Sekolah</span>
                          <span className="col-span-7 sm:col-span-8"></span>
                        </div>
                        <div className="pl-4 space-y-0.5 mt-0.5">
                          <div className="grid grid-cols-12 gap-1">
                            <span className="col-span-5 sm:col-span-4">a. Dari Sekolah</span>
                            <span className="col-span-7 sm:col-span-8">: -</span>
                          </div>
                          <div className="grid grid-cols-12 gap-1">
                            <span className="col-span-5 sm:col-span-4">b. Alasan</span>
                            <span className="col-span-7 sm:col-span-8">: -</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="grid grid-cols-12 gap-1">
                          <span className="col-span-5 sm:col-span-4">3. Diterima di Sekolah Ini</span>
                          <span className="col-span-7 sm:col-span-8"></span>
                        </div>
                        <div className="pl-4 space-y-0.5 mt-0.5">
                          <div className="grid grid-cols-12 gap-1">
                            <span className="col-span-5 sm:col-span-4">a. Kelas</span>
                            <span className="col-span-7 sm:col-span-8 font-semibold">: Kelas {student.penerimaan?.tingkatAwal} ({student.penerimaan?.rombelAwal})</span>
                          </div>
                          <div className="grid grid-cols-12 gap-1">
                            <span className="col-span-5 sm:col-span-4">b. Hari, Tanggal dan Tahun</span>
                            <span className="col-span-7 sm:col-span-8">: {student.penerimaan?.tanggalDiterima}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* PAGE BREAK UNTUK CETAK */}
                <div className="page-break my-6 border-b-2 border-dashed border-slate-300 print:border-none print:my-0"></div>

                {/* PAGE 2: BAGIAN E S/D L */}
                <div className="page-section pt-4 print:pt-0">
                  {/* E. KETERANGAN DATA AYAH KANDUNG */}
                  <div className="mb-6">
                    <div className="font-bold text-[11px] mb-2 uppercase">
                      E. KETERANGAN DATA AYAH KANDUNG
                    </div>
                    <div className="space-y-1">
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-5 sm:col-span-4">1. Nama Ayah Kandung</span>
                        <span className="col-span-7 sm:col-span-8 font-semibold uppercase">: {student.ayah?.nama || '-'}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-5 sm:col-span-4">2. NIK Ayah</span>
                        <span className="col-span-7 sm:col-span-8 font-mono">: {student.ayah?.nik || '3175011508800001'}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-5 sm:col-span-4">3. Tempat, dan Tanggal Lahir</span>
                        <span className="col-span-7 sm:col-span-8">: {student.ayah?.tempatLahir || '-'}, {student.ayah?.tanggalLahir || '-'}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-5 sm:col-span-4">4. Agama</span>
                        <span className="col-span-7 sm:col-span-8">: {student.ayah?.agama || '-'}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-5 sm:col-span-4">5. Kewarganegaraan</span>
                        <span className="col-span-7 sm:col-span-8">: {student.ayah?.kewarganegaraan || 'WNI'}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-5 sm:col-span-4">6. Pendidikan Terakhir</span>
                        <span className="col-span-7 sm:col-span-8">: {student.ayah?.pendidikanTerakhir || '-'}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-5 sm:col-span-4">7. Pekerjaan</span>
                        <span className="col-span-7 sm:col-span-8">: {student.ayah?.pekerjaan || '-'}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-5 sm:col-span-4">8. Penghasilan Bulanan</span>
                        <span className="col-span-7 sm:col-span-8">: {student.ayah?.penghasilan || 'Rp 5.000.000 - Rp 10.000.000'}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-5 sm:col-span-4">9. Alamat Lengkap</span>
                        <span className="col-span-7 sm:col-span-8">: {student.ayah?.alamat || student.alamatJalan}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-5 sm:col-span-4">10. Nomor Telepon</span>
                        <span className="col-span-7 sm:col-span-8 font-mono">: {student.ayah?.noHp || '-'}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-5 sm:col-span-4">11. Masih Hidup/Meninggal Dunia</span>
                        <span className="col-span-7 sm:col-span-8">: {student.ayah?.status || 'Masih Hidup'}</span>
                      </div>
                    </div>
                  </div>

                  {/* F. KETERANGAN DATA IBU KANDUNG */}
                  <div className="mb-6">
                    <div className="font-bold text-[11px] mb-2 uppercase">
                      F. KETERANGAN DATA IBU KANDUNG
                    </div>
                    <div className="space-y-1">
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-5 sm:col-span-4">1. Nama Ibu Kandung</span>
                        <span className="col-span-7 sm:col-span-8 font-semibold uppercase">: {student.ibu?.nama || '-'}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-5 sm:col-span-4">2. NIK Ibu</span>
                        <span className="col-span-7 sm:col-span-8 font-mono">: {student.ibu?.nik || '3175012011830004'}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-5 sm:col-span-4">3. Tempat, dan Tanggal Lahir</span>
                        <span className="col-span-7 sm:col-span-8">: {student.ibu?.tempatLahir || '-'}, {student.ibu?.tanggalLahir || '-'}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-5 sm:col-span-4">4. Agama</span>
                        <span className="col-span-7 sm:col-span-8">: {student.ibu?.agama || '-'}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-5 sm:col-span-4">5. Kewarganegaraan</span>
                        <span className="col-span-7 sm:col-span-8">: {student.ibu?.kewarganegaraan || 'WNI'}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-5 sm:col-span-4">6. Pendidikan Terakhir</span>
                        <span className="col-span-7 sm:col-span-8">: {student.ibu?.pendidikanTerakhir || '-'}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-5 sm:col-span-4">7. Pekerjaan</span>
                        <span className="col-span-7 sm:col-span-8">: {student.ibu?.pekerjaan || '-'}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-5 sm:col-span-4">8. Penghasilan Bulanan</span>
                        <span className="col-span-7 sm:col-span-8">: {student.ibu?.penghasilan || 'Rp 3.000.000 - Rp 5.000.000'}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-5 sm:col-span-4">9. Alamat Lengkap</span>
                        <span className="col-span-7 sm:col-span-8">: {student.ibu?.alamat || student.alamatJalan}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-5 sm:col-span-4">10. Nomor Telepon</span>
                        <span className="col-span-7 sm:col-span-8 font-mono">: {student.ibu?.noHp || '-'}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-5 sm:col-span-4">11. Masih Hidup/Meninggal Dunia</span>
                        <span className="col-span-7 sm:col-span-8">: {student.ibu?.status || 'Masih Hidup'}</span>
                      </div>
                    </div>
                  </div>

                  {/* G. KETERANGAN DATA WALI */}
                  <div className="mb-6">
                    <div className="font-bold text-[11px] mb-2 uppercase">
                      G. KETERANGAN DATA WALI
                    </div>
                    <div className="space-y-1">
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-5 sm:col-span-4">1. Nama Wali</span>
                        <span className="col-span-7 sm:col-span-8">: {student.wali?.nama || '-'}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-5 sm:col-span-4">2. NIK Wali</span>
                        <span className="col-span-7 sm:col-span-8 font-mono">: {student.wali?.nik || '-'}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-5 sm:col-span-4">3. Tempat, dan Tanggal Lahir</span>
                        <span className="col-span-7 sm:col-span-8">: {student.wali?.tempatLahir ? `${student.wali.tempatLahir}, ${student.wali.tanggalLahir}` : '-'}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-5 sm:col-span-4">4. Agama</span>
                        <span className="col-span-7 sm:col-span-8">: {student.wali?.agama || '-'}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-5 sm:col-span-4">5. Kewarganegaraan</span>
                        <span className="col-span-7 sm:col-span-8">: {student.wali?.kewarganegaraan || '-'}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-5 sm:col-span-4">6. Pendidikan Terakhir</span>
                        <span className="col-span-7 sm:col-span-8">: {student.wali?.pendidikanTerakhir || '-'}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-5 sm:col-span-4">7. Pekerjaan</span>
                        <span className="col-span-7 sm:col-span-8">: {student.wali?.pekerjaan || '-'}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-5 sm:col-span-4">8. Penghasilan Bulanan</span>
                        <span className="col-span-7 sm:col-span-8">: {student.wali?.penghasilan || '-'}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-5 sm:col-span-4">9. Alamat Lengkap</span>
                        <span className="col-span-7 sm:col-span-8">: {student.wali?.alamat || '-'}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-5 sm:col-span-4">10. Nomor Telepon</span>
                        <span className="col-span-7 sm:col-span-8 font-mono">: {student.wali?.noHp || '-'}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-5 sm:col-span-4">11. Masih Hidup/Meninggal Dunia</span>
                        <span className="col-span-7 sm:col-span-8">: {student.wali?.statusHidup || '-'}</span>
                      </div>
                    </div>
                  </div>

                  {/* H. KEGEMARAN PESERTA DIDIK */}
                  <div className="mb-6">
                    <div className="font-bold text-[11px] mb-2 uppercase">
                      H. KEGEMARAN PESERTA DIDIK
                    </div>
                    <div className="space-y-1">
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-5 sm:col-span-4">1. Seni</span>
                        <span className="col-span-7 sm:col-span-8">: {student.kegemaran?.seni || 'Seni Musik / Gambar'}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-5 sm:col-span-4">2. Olah Raga</span>
                        <span className="col-span-7 sm:col-span-8">: {student.kegemaran?.olahRaga || 'Futsal / Bulutangkis'}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-5 sm:col-span-4">3. Lain-lain</span>
                        <span className="col-span-7 sm:col-span-8">: {student.kegemaran?.lainLain || 'Pramuka & Robotik'}</span>
                      </div>
                    </div>
                  </div>

                  {/* I. TINGGI DAN BERAT BADAN SERTA KONDISI KESEHATAN */}
                  <div className="mb-6">
                    <div className="font-bold text-[11px] mb-2 uppercase">
                      I. TINGGI DAN BERAT BADAN PESERTA DIDIK SERTA KONDISI KESEHATAN
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-black text-center text-[10px]">
                        <thead>
                          <tr>
                            <th rowSpan={2} className="border border-black px-1.5 py-1 w-7">No</th>
                            <th rowSpan={2} className="border border-black px-2 py-1 text-left w-44">Aspek Yang di Nilai</th>
                            <th colSpan={2} className="border border-black px-1 py-1">Tahun Pelajaran<br />{grades[1]?.tahunPelajaran || '2024/2025'}</th>
                            <th colSpan={2} className="border border-black px-1 py-1">Tahun Pelajaran<br />{grades[3]?.tahunPelajaran || '2025/2026'}</th>
                            <th colSpan={2} className="border border-black px-1 py-1">Tahun Pelajaran<br />{grades[5]?.tahunPelajaran || '2026/2027'}</th>
                            <th rowSpan={2} className="border border-black px-2 py-1 w-24">Keterangan</th>
                          </tr>
                          <tr>
                            <th className="border border-black px-1 py-0.5 text-[9.5px]">Semester<br />Ganjil</th>
                            <th className="border border-black px-1 py-0.5 text-[9.5px]">Semester<br />Genap</th>
                            <th className="border border-black px-1 py-0.5 text-[9.5px]">Semester<br />Ganjil</th>
                            <th className="border border-black px-1 py-0.5 text-[9.5px]">Semester<br />Genap</th>
                            <th className="border border-black px-1 py-0.5 text-[9.5px]">Semester<br />Ganjil</th>
                            <th className="border border-black px-1 py-0.5 text-[9.5px]">Semester<br />Genap</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-black py-1">1</td>
                            <td className="border border-black px-2 py-1 text-left">Tinggi Badan</td>
                            <td className="border border-black py-1 font-mono">152 cm</td>
                            <td className="border border-black py-1 font-mono">154 cm</td>
                            <td className="border border-black py-1 font-mono">155 cm</td>
                            <td className="border border-black py-1 font-mono">{student.tinggiBadanCm} cm</td>
                            <td className="border border-black py-1 font-mono">{student.tinggiBadanCm} cm</td>
                            <td className="border border-black py-1 font-mono">......cm</td>
                            <td className="border border-black px-1 py-1 text-[9.5px]">Normal</td>
                          </tr>
                          <tr>
                            <td className="border border-black py-1">2</td>
                            <td className="border border-black px-2 py-1 text-left">Berat Badan</td>
                            <td className="border border-black py-1 font-mono">42 kg</td>
                            <td className="border border-black py-1 font-mono">44 kg</td>
                            <td className="border border-black py-1 font-mono">45 kg</td>
                            <td className="border border-black py-1 font-mono">{student.beratBadanKg} kg</td>
                            <td className="border border-black py-1 font-mono">{student.beratBadanKg} kg</td>
                            <td className="border border-black py-1 font-mono">......kg</td>
                            <td className="border border-black px-1 py-1 text-[9.5px]">Ideal</td>
                          </tr>
                          <tr>
                            <td className="border border-black py-1">3</td>
                            <td className="border border-black px-2 py-1 text-left">Pendengaran</td>
                            <td className="border border-black py-1 text-[9px]">Baik</td>
                            <td className="border border-black py-1 text-[9px]">Baik</td>
                            <td className="border border-black py-1 text-[9px]">Baik</td>
                            <td className="border border-black py-1 text-[9px]">Baik</td>
                            <td className="border border-black py-1 text-[9px]">Baik</td>
                            <td className="border border-black py-1 text-[9px]">...............</td>
                            <td className="border border-black px-1 py-1 text-[9.5px]">Sehat</td>
                          </tr>
                          <tr>
                            <td className="border border-black py-1">4</td>
                            <td className="border border-black px-2 py-1 text-left">Penglihatan</td>
                            <td className="border border-black py-1 text-[9px]">Baik</td>
                            <td className="border border-black py-1 text-[9px]">Baik</td>
                            <td className="border border-black py-1 text-[9px]">Baik</td>
                            <td className="border border-black py-1 text-[9px]">Baik</td>
                            <td className="border border-black py-1 text-[9px]">Baik</td>
                            <td className="border border-black py-1 text-[9px]">...............</td>
                            <td className="border border-black px-1 py-1 text-[9.5px]">Sehat</td>
                          </tr>
                          <tr>
                            <td className="border border-black py-1">5</td>
                            <td className="border border-black px-2 py-1 text-left">Gigi</td>
                            <td className="border border-black py-1 text-[9px]">Bersih</td>
                            <td className="border border-black py-1 text-[9px]">Bersih</td>
                            <td className="border border-black py-1 text-[9px]">Bersih</td>
                            <td className="border border-black py-1 text-[9px]">Bersih</td>
                            <td className="border border-black py-1 text-[9px]">Bersih</td>
                            <td className="border border-black py-1 text-[9px]">...............</td>
                            <td className="border border-black px-1 py-1 text-[9.5px]">Terawat</td>
                          </tr>
                          <tr>
                            <td className="border border-black py-1">6</td>
                            <td className="border border-black px-2 py-1 text-left">Lainnya</td>
                            <td className="border border-black py-1 text-[9px]">-</td>
                            <td className="border border-black py-1 text-[9px]">-</td>
                            <td className="border border-black py-1 text-[9px]">-</td>
                            <td className="border border-black py-1 text-[9px]">-</td>
                            <td className="border border-black py-1 text-[9px]">-</td>
                            <td className="border border-black py-1 text-[9px]">...............</td>
                            <td className="border border-black px-1 py-1 text-[9.5px]">-</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* J. PRESTASI PESERTA DIDIK */}
                  <div className="mb-6">
                    <div className="font-bold text-[11px] mb-2 uppercase">
                      J. PRESTASI PESERTA DIDIK
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-black text-center text-[10px]">
                        <thead>
                          <tr className="bg-slate-50">
                            <th className="border border-black px-2 py-1 w-32">Jenis Prestasi</th>
                            <th className="border border-black px-2 py-1 w-28">Tingkat Prestasi</th>
                            <th className="border border-black px-2 py-1">Nama Prestasi</th>
                            <th className="border border-black px-2 py-1 w-24">Tahun Prestasi</th>
                            <th className="border border-black px-2 py-1 w-44">Peyelenggara</th>
                            <th className="border border-black px-2 py-1 w-28">Peringkat</th>
                          </tr>
                        </thead>
                        <tbody>
                          {student.prestasiDetail && student.prestasiDetail.length > 0 ? (
                            student.prestasiDetail.map((pr, i) => (
                              <tr key={i}>
                                <td className="border border-black px-2 py-1">{pr.jenis}</td>
                                <td className="border border-black px-2 py-1">{pr.tingkat}</td>
                                <td className="border border-black px-2 py-1 text-left font-medium">{pr.nama}</td>
                                <td className="border border-black px-2 py-1 font-mono">{pr.tahun}</td>
                                <td className="border border-black px-2 py-1 text-left text-[9.5px]">{pr.penyelenggara}</td>
                                <td className="border border-black px-2 py-1 font-semibold">{pr.peringkat}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td className="border border-black px-2 py-1 text-slate-500">Sains, Seni atau Olah Raga</td>
                              <td className="border border-black px-2 py-1 text-slate-500 text-[9px]">Sekolah, Kec, Kab, Provinsi, Nasional</td>
                              <td className="border border-black px-2 py-1 text-left text-slate-500 text-[9px]">Lomba Cerdas Cermat B. Indonesia Tk. SMP</td>
                              <td className="border border-black px-2 py-1 text-slate-500 font-mono">2024</td>
                              <td className="border border-black px-2 py-1 text-slate-500 text-[9px]">Dinas Pendidikan DKI Jakarta</td>
                              <td className="border border-black px-2 py-1 text-slate-500 font-semibold">Juara Harapan</td>
                            </tr>
                          )}
                          <tr>
                            <td className="border border-black py-1.5 text-slate-400">................................................</td>
                            <td className="border border-black py-1.5 text-slate-400">........................</td>
                            <td className="border border-black py-1.5 text-slate-400">................................................</td>
                            <td className="border border-black py-1.5 text-slate-400">................</td>
                            <td className="border border-black py-1.5 text-slate-400">........................................</td>
                            <td className="border border-black py-1.5 text-slate-400">................</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* K. BEASISWA PESERTA DIDIK */}
                  <div className="mb-6">
                    <div className="font-bold text-[11px] mb-2 uppercase">
                      K. BEASISWA PESERTA DIDIK
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-black text-center text-[10px]">
                        <thead>
                          <tr className="bg-slate-50">
                            <th className="border border-black px-2 py-1 w-48">Jenis Beasiswa</th>
                            <th className="border border-black px-2 py-1">Keterangan</th>
                            <th className="border border-black px-2 py-1 w-36">Tahun Mulai</th>
                            <th className="border border-black px-2 py-1 w-36">Tahun Selesai</th>
                          </tr>
                        </thead>
                        <tbody>
                          {student.beasiswa && student.beasiswa.length > 0 ? (
                            student.beasiswa.map((b, i) => (
                              <tr key={i}>
                                <td className="border border-black px-2 py-1 font-medium">{b.jenis}</td>
                                <td className="border border-black px-2 py-1 text-left">{b.keterangan}</td>
                                <td className="border border-black px-2 py-1 font-mono">{b.tahunMulai}</td>
                                <td className="border border-black px-2 py-1 font-mono">{b.tahunSelesai}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td className="border border-black px-2 py-1 text-slate-500 text-[9.5px]">Anak Berprestasi, KJP Plus, PIP</td>
                              <td className="border border-black px-2 py-1 text-slate-500 text-[9.5px]">Bantuan Pendidikan Pemprov DKI Jakarta</td>
                              <td className="border border-black px-2 py-1 text-slate-500 font-mono">2023</td>
                              <td className="border border-black px-2 py-1 text-slate-500 font-mono">2025</td>
                            </tr>
                          )}
                          <tr>
                            <td className="border border-black py-1.5 text-slate-400">................................................</td>
                            <td className="border border-black py-1.5 text-slate-400">................................................</td>
                            <td className="border border-black py-1.5 text-slate-400">................................</td>
                            <td className="border border-black py-1.5 text-slate-400">................................</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* L. SETELAH SELESAI PENDIDIKAN */}
                  <div className="mb-6">
                    <div className="font-bold text-[11px] mb-2 uppercase">
                      L. SETELAH SELESAI PENDIDIKAN
                    </div>

                    <div className="space-y-1">
                      <div>
                        <div className="grid grid-cols-12 gap-1">
                          <span className="col-span-5 sm:col-span-4">1. Meninggalkan Sekolah</span>
                          <span className="col-span-7 sm:col-span-8"></span>
                        </div>
                        <div className="pl-4 space-y-0.5 mt-0.5">
                          <div className="grid grid-cols-12 gap-1">
                            <span className="col-span-5 sm:col-span-4">a. Keluar Karena</span>
                            <span className="col-span-7 sm:col-span-8">
                              : {student.mutasi?.jenis === 'MUTASI_KELUAR' ? student.mutasi.alasan : '....................................................................................'}
                            </span>
                          </div>
                          <div className="grid grid-cols-12 gap-1">
                            <span className="col-span-5 sm:col-span-4">b. Tanggal Keluar</span>
                            <span className="col-span-7 sm:col-span-8 font-mono">
                              : {student.mutasi?.jenis === 'MUTASI_KELUAR' ? student.mutasi.tanggal : '....................................................................................'}
                            </span>
                          </div>
                          <div className="grid grid-cols-12 gap-1">
                            <span className="col-span-5 sm:col-span-4">c. Alasan</span>
                            <span className="col-span-7 sm:col-span-8">
                              : {student.mutasi?.jenis === 'MUTASI_KELUAR' ? (student.mutasi.sekolahTujuan ? `Pindah ke ${student.mutasi.sekolahTujuan}` : student.mutasi.alasan) : '....................................................................................'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="grid grid-cols-12 gap-1">
                          <span className="col-span-5 sm:col-span-4">2. Akhir Pendidikan</span>
                          <span className="col-span-7 sm:col-span-8"></span>
                        </div>
                        <div className="pl-4 space-y-0.5 mt-0.5">
                          <div className="grid grid-cols-12 gap-1">
                            <span className="col-span-5 sm:col-span-4">a. Tamat Belajar</span>
                            <span className="col-span-7 sm:col-span-8">
                              : {student.status === 'LULUS' ? 'Lulus Satuan Pendidikan SMPN 99' : '....................................................................................'}
                            </span>
                          </div>
                          <div className="grid grid-cols-12 gap-1">
                            <span className="col-span-5 sm:col-span-4">b. Nomor Ijazah</span>
                            <span className="col-span-7 sm:col-span-8 font-mono">
                              : {student.status === 'LULUS' ? (student.mutasi?.noSurat || 'DN-01/D-SMP/K13/24/00142') : '....................................................................................'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* TANDA TANGAN / PENGESAHAN DOKUMEN */}
                  <div className="mt-8 pt-4 border-t border-black text-[11px] font-sans">
                    {/* Baris Utama Pengesahan Pihak Sekolah (Kiri & Kanan Sesuai Pengaturan) */}
                    {(sigKiri.tampilkan || sigKanan.tampilkan) && (
                      <div
                        className={`grid gap-6 mb-6 ${
                          sigKiri.tampilkan && sigKanan.tampilkan ? 'grid-cols-2' : 'grid-cols-1 max-w-xs mx-auto'
                        }`}
                      >
                        {renderSignatureBox(sigKiri)}
                        {renderSignatureBox(sigKanan)}
                      </div>
                    )}

                    {/* Baris Pengesahan Orang Tua & Peserta Didik */}
                    <div className="grid grid-cols-2 gap-6 text-center pt-4 border-t border-dotted border-black/30">
                      <div>
                        <div className="text-[10px] text-slate-600">{effectiveSettings.kotaTitimangsa}, {currentDateFormatted}</div>
                        <div className="font-semibold text-[10.5px]">Orang Tua / Wali Murid</div>
                        <div className="h-14 flex items-center justify-center text-slate-300 text-[9px] italic">
                          [ Tanda Tangan ]
                        </div>
                        <div className="font-bold underline uppercase text-[10px]">
                          {student.ayah?.nama || student.ibu?.nama || '( ........................................ )'}
                        </div>
                        <div className="text-[9px] text-slate-600">Orang Tua / Wali</div>
                      </div>

                      <div>
                        <div className="text-[10px] text-slate-600">{effectiveSettings.kotaTitimangsa}, {currentDateFormatted}</div>
                        <div className="font-semibold text-[10.5px]">Peserta Didik</div>
                        <div className="h-14 flex items-center justify-center text-slate-300 text-[9px] italic">
                          [ Tanda Tangan ]
                        </div>
                        <div className="font-bold underline uppercase text-[10px]">{student.namaLengkap}</div>
                        <div className="text-[9px] text-slate-600">NIS. {student.nis}</div>
                      </div>
                    </div>

                    {/* Pengawas Sekolah sebagai Pemeriksa Buku Induk (jika diaktifkan) */}
                    {showPengawasMiddle && (
                      <div className="mt-6 pt-4 border-t border-dotted border-black/40 text-center max-w-sm mx-auto">
                        <div className="text-[10px] text-slate-600">Telah Diverifikasi & Diperiksa oleh,</div>
                        <div className="font-bold text-[10.5px]">Pengawas Pembina / Pemeriksa Buku Induk</div>
                        <div className="h-14 flex items-center justify-center text-slate-300 text-[9px] italic">
                          [ Tanda Tangan Pengawas ]
                        </div>
                        <div className="font-bold underline uppercase text-[10px]">{effectiveSettings.namaPengawas}</div>
                        <div className="text-[9px] text-slate-600 font-mono">NIP. {effectiveSettings.nipPengawas}</div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* ============================================================ */}
            {/* DOCUMENT 2: LEMBAR NILAI RAPOR KURIKULUM MERDEKA */}
            {/* ============================================================ */}
            {docType === 'RAPOR_SEMESTER' && (
              <div className="space-y-5">
                {/* HEADER FORM RAPOR */}
                <div className="text-center mb-4">
                  <h1 className="font-black text-[13px] uppercase tracking-wide">
                    LAPORAN HASIL CAPAIAN PEMBELAJARAN PESERTA DIDIK KURIKULUM MERDEKA
                  </h1>
                  <h2 className="font-bold text-[12px] uppercase">
                    SEKOLAH MENENGAH PERTAMA (SMP)
                  </h2>
                </div>

                {/* A. IDENTITAS PESERTA DIDIK */}
                <div className="mb-4">
                  <div className="font-bold text-[11.5px] uppercase mb-1.5">
                    A. IDENTITAS PESERTA DIDIK
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-0.5 text-[10.5px]">
                    <div className="space-y-0.5">
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-5 text-slate-800 font-medium">Nama Peserta Didik</span>
                        <span className="col-span-7 font-bold uppercase">: {student.namaLengkap}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-5 text-slate-800 font-medium">NISN / NIS</span>
                        <span className="col-span-7 font-mono font-semibold">: {student.nisn} / {student.nis}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-5 text-slate-800 font-medium">Nama Sekolah</span>
                        <span className="col-span-7 font-semibold">: SMP Negeri 99 Jakarta</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-5 text-slate-800 font-medium">Alamat</span>
                        <span className="col-span-7">: {SMPN99_INFO.alamat}</span>
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-5 text-slate-800 font-medium">Kelas</span>
                        <span className="col-span-7 font-bold">: {currentSemesterRecord.kelas}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-5 text-slate-800 font-medium">Fase</span>
                        <span className="col-span-7 font-semibold">: {currentSemesterRecord.fase}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-5 text-slate-800 font-medium">Semester</span>
                        <span className="col-span-7 font-semibold">: {currentSemesterRecord.semesterType}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-5 text-slate-800 font-medium">Tahun Pelajaran</span>
                        <span className="col-span-7 font-semibold font-mono">: {currentSemesterRecord.tahunPelajaran}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* B. INTRAKURIKULER TABLE */}
                <div className="mb-4">
                  <div className="font-bold text-[11.5px] uppercase mb-1.5">
                    B. INTRAKURIKULER
                  </div>
                  <table className="w-full border-collapse border border-black text-[9.5px]">
                    <thead>
                      <tr className="bg-slate-50 font-bold text-center">
                        <th className="border border-black p-1 w-7">NO</th>
                        <th className="border border-black p-1 text-left w-52">MATA PELAJARAN</th>
                        <th className="border border-black p-1 w-14">NILAI AKHIR</th>
                        <th className="border border-black p-1">CAPAIAN PEMBELAJARAN</th>
                        <th className="border border-black p-1 w-12">KKTP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentSemesterRecord.mataPelajaran.map((m, idx) => (
                        <tr key={idx} className={m.isSubItem ? 'bg-slate-50/50' : ''}>
                          <td className="border border-black p-1 text-center font-mono">
                            {m.subCode ? `${m.no}.${m.subCode}` : `${m.no}.`}
                          </td>
                          <td className={`border border-black p-1 ${m.isSubItem ? 'pl-5 font-normal' : 'font-semibold'}`}>
                            {m.nama}
                          </td>
                          <td className="border border-black p-1 text-center font-mono font-bold text-[10px]">
                            {m.nilaiAkhir}
                          </td>
                          <td className="border border-black p-1 text-justify leading-tight">
                            {m.capaianPembelajaran}
                          </td>
                          <td className="border border-black p-1 text-center font-mono">
                            {m.kktp}
                          </td>
                        </tr>
                      ))}

                      {/* Summary row */}
                      <tr className="font-bold bg-slate-50">
                        <td colSpan={2} className="border border-black p-1 text-center">
                          Jumlah Nilai
                        </td>
                        <td className="border border-black p-1 text-center font-mono font-bold">
                          {totalNilaiSem}
                        </td>
                        <td className="border border-black p-1 text-slate-500 italic text-[9px]">
                          Total Nilai Hasil Capaian Pembelajaran Seluruh Mata Pelajaran
                        </td>
                        <td className="border border-black p-1"></td>
                      </tr>
                      <tr className="font-bold bg-slate-100">
                        <td colSpan={2} className="border border-black p-1 text-center">
                          RATA-RATA
                        </td>
                        <td className="border border-black p-1 text-center font-mono font-black text-[10.5px]">
                          {rataRataNilaiSem}
                        </td>
                        <td className="border border-black p-1 text-[9px] font-semibold">
                          Kategori: Mencapai Seluruh Kriteria Ketercapaian Tujuan Pembelajaran (KKTP)
                        </td>
                        <td className="border border-black p-1 text-center font-mono font-semibold">
                          75
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* C. PROJEK PENGUATAN PROFIL PELAJAR PANCASILA (P5) */}
                {currentSemesterRecord.p5 && (
                  <div className="mb-4">
                    <div className="font-bold text-[11.5px] uppercase mb-1.5">
                      C. PROJEK PENGUATAN PROFIL PELAJAR PANCASILA (P5)
                    </div>
                    <div className="border border-black mb-1.5 text-[9.5px]">
                      <div className="p-1 border-b border-black">
                        <span className="font-semibold">Tema Projek 1 : </span>
                        <span>{currentSemesterRecord.p5.tema1}</span>
                      </div>
                      <div className="p-1 border-b border-black">
                        <span className="font-semibold">Tema Projek 2 : </span>
                        <span>{currentSemesterRecord.p5.tema2}</span>
                      </div>
                      {currentSemesterRecord.p5.tema3 && (
                        <div className="p-1">
                          <span className="font-semibold">Tema Projek 3 : </span>
                          <span>{currentSemesterRecord.p5.tema3}</span>
                        </div>
                      )}
                    </div>

                    <table className="w-full border-collapse border border-black text-[9px]">
                      <thead>
                        <tr className="bg-slate-50 font-bold text-center">
                          <th className="border border-black p-1 w-6">No</th>
                          <th className="border border-black p-1 text-left w-44">Dimensi</th>
                          <th className="border border-black p-1 text-left">Elemen</th>
                          <th className="border border-black p-1 text-left">Sub-Elemen</th>
                          <th className="border border-black p-1 text-center w-44">Target Pencapaian Di Akhir Fase</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentSemesterRecord.p5.dimensiList.map((dim) => (
                          <tr key={dim.no}>
                            <td className="border border-black p-1 text-center">{dim.no}.</td>
                            <td className="border border-black p-1 font-semibold">{dim.dimensi}</td>
                            <td className="border border-black p-1">{dim.elemen}</td>
                            <td className="border border-black p-1">{dim.subElemen}</td>
                            <td className="border border-black p-1 text-center font-semibold">
                              {dim.targetCapaian}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* D. EKSTRAKURIKULER */}
                <div className="mb-4">
                  <div className="font-bold text-[11.5px] uppercase mb-1.5">
                    D. EKSTRAKURIKULER
                  </div>
                  <table className="w-full border-collapse border border-black text-[9.5px]">
                    <thead>
                      <tr className="bg-slate-50 font-bold text-center">
                        <th className="border border-black p-1 w-7">No</th>
                        <th className="border border-black p-1 text-left w-60">Ekstrakurikuler</th>
                        <th className="border border-black p-1 text-left">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentSemesterRecord.ekstrakurikuler && currentSemesterRecord.ekstrakurikuler.length > 0 ? (
                        currentSemesterRecord.ekstrakurikuler.map((ekskul, idx) => (
                          <tr key={idx}>
                            <td className="border border-black p-1 text-center">{idx + 1}.</td>
                            <td className="border border-black p-1 font-semibold">{ekskul.nama}</td>
                            <td className="border border-black p-1">{ekskul.keterangan}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td className="border border-black p-1 text-center">1.</td>
                          <td className="border border-black p-1 font-semibold">Pramuka (Wajib)</td>
                          <td className="border border-black p-1">Aktif dan terampil dalam kepramukaan penggalang.</td>
                        </tr>
                      )}
                      <tr>
                        <td className="border border-black p-1 text-center text-slate-400">2.</td>
                        <td className="border border-black p-1 text-slate-400">................................................</td>
                        <td className="border border-black p-1 text-slate-400">................................................</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* E. PRESTASI */}
                <div className="mb-4">
                  <div className="font-bold text-[11.5px] uppercase mb-1.5">
                    E. PRESTASI
                  </div>
                  <table className="w-full border-collapse border border-black text-[9.5px] text-center">
                    <thead>
                      <tr className="bg-slate-50 font-bold">
                        <th className="border border-black p-1">Jenis Prestasi</th>
                        <th className="border border-black p-1">Tingkat Prestasi</th>
                        <th className="border border-black p-1">Nama Prestasi</th>
                        <th className="border border-black p-1 w-20">Tahun Prestasi</th>
                        <th className="border border-black p-1">Peyelenggara</th>
                        <th className="border border-black p-1 w-20">Peringkat</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentSemesterRecord.prestasi && currentSemesterRecord.prestasi.length > 0 ? (
                        currentSemesterRecord.prestasi.map((pr, idx) => (
                          <tr key={idx}>
                            <td className="border border-black p-1">{pr.jenis}</td>
                            <td className="border border-black p-1">{pr.tingkat}</td>
                            <td className="border border-black p-1 text-left font-semibold">{pr.nama}</td>
                            <td className="border border-black p-1 font-mono">{pr.tahun}</td>
                            <td className="border border-black p-1 text-left">{pr.penyelenggara}</td>
                            <td className="border border-black p-1 font-bold">{pr.peringkat}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td className="border border-black p-1 text-slate-400">-</td>
                          <td className="border border-black p-1 text-slate-400">-</td>
                          <td className="border border-black p-1 text-slate-400">-</td>
                          <td className="border border-black p-1 text-slate-400">-</td>
                          <td className="border border-black p-1 text-slate-400">-</td>
                          <td className="border border-black p-1 text-slate-400">-</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* F. KETIDAKHADIRAN & TANDA TANGAN */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start pt-2">
                  <div>
                    <div className="font-bold text-[11.5px] uppercase mb-1.5">
                      F. KETIDAKHADIRAN
                    </div>
                    <div className="space-y-1 text-[10.5px] max-w-xs">
                      <div className="flex justify-between border-b border-dotted border-black/40 pb-0.5">
                        <span>Sakit</span>
                        <span className="font-mono font-semibold">: {currentSemesterRecord.ketidakhadiran.sakit} Hari</span>
                      </div>
                      <div className="flex justify-between border-b border-dotted border-black/40 pb-0.5">
                        <span>Izin</span>
                        <span className="font-mono font-semibold">: {currentSemesterRecord.ketidakhadiran.izin} Hari</span>
                      </div>
                      <div className="flex justify-between border-b border-dotted border-black/40 pb-0.5">
                        <span>Tanpa Keterangan</span>
                        <span className="font-mono font-semibold">: {currentSemesterRecord.ketidakhadiran.tanpaKeterangan} Hari</span>
                      </div>
                    </div>

                    {currentSemesterRecord.catatanAkademik && (
                      <div className="mt-3 p-2 bg-slate-50 border border-slate-300 rounded text-[9.5px]">
                        <span className="font-bold">Catatan Wali Kelas: </span>
                        <span className="italic">{currentSemesterRecord.catatanAkademik}</span>
                      </div>
                    )}
                  </div>

                  {/* PENGESAHAN DOKUMEN RAPOR */}
                  <div>
                    <div
                      className={`grid gap-4 text-[10px] ${
                        sigKiri.tampilkan && sigKanan.tampilkan ? 'grid-cols-2' : 'grid-cols-1 max-w-xs mx-auto'
                      }`}
                    >
                      {renderSignatureBox(sigKiri, true)}
                      {renderSignatureBox(sigKanan, true)}
                    </div>
                    {showPengawasMiddle && (
                      <div className="mt-4 pt-3 border-t border-dotted border-black/40 text-center">
                        <div className="text-[9.5px] text-slate-600">Diperiksa oleh,</div>
                        <div className="font-bold text-[10px]">Pengawas Pembina Sekolah</div>
                        <div className="h-12 flex items-center justify-center text-slate-300 italic text-[8.5px]">
                          [ Tanda Tangan ]
                        </div>
                        <div className="font-bold underline uppercase text-[9.5px]">{effectiveSettings.namaPengawas}</div>
                        <div className="text-[8.5px] font-mono text-slate-600">NIP. {effectiveSettings.nipPengawas}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* DOCUMENT 3: TRANSKRIP REKAP NILAI 6 SEMESTER LENGKAP */}
            {/* ============================================================ */}
            {docType === 'TRANSKRIP_6_SEMESTER' && (
              <div className="space-y-5">
                <div className="text-center mb-4">
                  <h1 className="font-black text-[13px] uppercase tracking-wide">
                    TRANSKRIP REKAPITULASI NILAI BUKU INDUK SISWA (SEMESTER 1 S/D 6)
                  </h1>
                  <h2 className="font-bold text-[11.5px] uppercase text-slate-800">
                    KURIKULUM MERDEKA FASE D · SMP NEGERI 99 JAKARTA
                  </h2>
                </div>

                <div className="bg-slate-50 border border-black p-3 rounded text-[10.5px] grid grid-cols-2 gap-2 mb-3">
                  <div>
                    <div><span className="font-semibold">Nama Siswa:</span> <span className="font-bold uppercase">{student.namaLengkap}</span></div>
                    <div><span className="font-semibold">NIS / NISN:</span> <span className="font-mono">{student.nis} / {student.nisn}</span></div>
                    <div><span className="font-semibold">Tempat/Tgl Lahir:</span> {student.tempatLahir}, {student.tanggalLahir}</div>
                  </div>
                  <div>
                    <div><span className="font-semibold">Nama Sekolah:</span> SMP Negeri 99 Jakarta</div>
                    <div><span className="font-semibold">NPSN:</span> <span className="font-mono">{SMPN99_INFO.npsn}</span></div>
                    <div><span className="font-semibold">Tahun Masuk / Aktif:</span> {student.tahunAjaranMasuk} / {effectiveSettings.tahunAjaranAktif} ({effectiveSettings.semesterAktif})</div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-black text-[9.5px]">
                    <thead>
                      <tr className="bg-slate-50 font-bold text-center">
                        <th rowSpan={2} className="border border-black p-1 w-7">No</th>
                        <th rowSpan={2} className="border border-black p-1 text-left">Mata Pelajaran</th>
                        <th rowSpan={2} className="border border-black p-1 w-10">KKTP</th>
                        <th colSpan={2} className="border border-black p-1">
                          Kelas VII <span className="font-normal font-mono">({grades[1]?.tahunPelajaran || '2024/2025'})</span>
                        </th>
                        <th colSpan={2} className="border border-black p-1">
                          Kelas VIII <span className="font-normal font-mono">({grades[3]?.tahunPelajaran || '2025/2026'})</span>
                        </th>
                        <th colSpan={2} className="border border-black p-1">
                          Kelas IX <span className="font-normal font-mono">({grades[5]?.tahunPelajaran || '2026/2027'})</span>
                        </th>
                        <th rowSpan={2} className="border border-black p-1 w-12 bg-slate-100">Rata2</th>
                      </tr>
                      <tr className="text-[9px]">
                        <th className="border border-black p-0.5 w-9">Sem 1</th>
                        <th className="border border-black p-0.5 w-9">Sem 2</th>
                        <th className="border border-black p-0.5 w-9">Sem 3</th>
                        <th className="border border-black p-0.5 w-9">Sem 4</th>
                        <th className="border border-black p-0.5 w-9">Sem 5</th>
                        <th className="border border-black p-0.5 w-9">Sem 6</th>
                      </tr>
                    </thead>
                    <tbody>
                      {STANDARD_SUBJECTS_TEMPLATE.map((tpl, idx) => {
                        const s1 = grades[1]?.mataPelajaran.find((m) => m.nama === tpl.nama)?.nilaiAkhir ?? '-';
                        const s2 = grades[2]?.mataPelajaran.find((m) => m.nama === tpl.nama)?.nilaiAkhir ?? '-';
                        const s3 = grades[3]?.mataPelajaran.find((m) => m.nama === tpl.nama)?.nilaiAkhir ?? '-';
                        const s4 = grades[4]?.mataPelajaran.find((m) => m.nama === tpl.nama)?.nilaiAkhir ?? '-';
                        const s5 = grades[5]?.mataPelajaran.find((m) => m.nama === tpl.nama)?.nilaiAkhir ?? '-';
                        const s6 = grades[6]?.mataPelajaran.find((m) => m.nama === tpl.nama)?.nilaiAkhir ?? '-';

                        const numericVals = [s1, s2, s3, s4, s5, s6].filter((v): v is number => typeof v === 'number');
                        const mapelAvg =
                          numericVals.length > 0
                            ? (numericVals.reduce((a, b) => a + b, 0) / numericVals.length).toFixed(1)
                            : '-';

                        return (
                          <tr key={idx} className={tpl.isSubItem ? 'bg-slate-50/50' : ''}>
                            <td className="border border-black p-1 text-center font-mono">
                              {tpl.subCode ? `${tpl.no}.${tpl.subCode}` : tpl.no}
                            </td>
                            <td className={`border border-black p-1 ${tpl.isSubItem ? 'pl-4 font-normal' : 'font-semibold'}`}>
                              {tpl.nama}
                            </td>
                            <td className="border border-black p-1 text-center font-mono">{tpl.kktp}</td>
                            <td className="border border-black p-1 text-center font-mono">{s1}</td>
                            <td className="border border-black p-1 text-center font-mono">{s2}</td>
                            <td className="border border-black p-1 text-center font-mono">{s3}</td>
                            <td className="border border-black p-1 text-center font-mono">{s4}</td>
                            <td className="border border-black p-1 text-center font-mono">{s5}</td>
                            <td className="border border-black p-1 text-center font-mono">{s6}</td>
                            <td className="border border-black p-1 text-center font-mono font-bold bg-slate-50">{mapelAvg}</td>
                          </tr>
                        );
                      })}

                      {/* Summary per Semester */}
                      <tr className="font-bold bg-slate-100">
                        <td colSpan={3} className="border border-black p-1 text-center">
                          RATA-RATA SEMESTER
                        </td>
                        {[1, 2, 3, 4, 5, 6].map((num) => {
                          const list = grades[num]?.mataPelajaran || [];
                          const sum = list.reduce((a, b) => a + (b.nilaiAkhir || 0), 0);
                          const avg = list.length > 0 ? (sum / list.length).toFixed(1) : '-';
                          return (
                            <td key={num} className="border border-black p-1 text-center font-mono">
                              {avg}
                            </td>
                          );
                        })}
                        <td className="border border-black p-1 text-center font-mono font-black text-[10px]">
                          {grandAverage}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* TANDA TANGAN PENGESAHAN TRANSKRIP */}
                <div className="mt-8 pt-4 border-t border-black text-[10.5px]">
                  <div
                    className={`grid gap-4 text-center ${
                      showPengawasMiddle && sigKiri.tampilkan && sigKanan.tampilkan
                        ? 'grid-cols-3'
                        : sigKiri.tampilkan && sigKanan.tampilkan
                        ? 'grid-cols-2'
                        : 'grid-cols-1 max-w-xs mx-auto'
                    }`}
                  >
                    {renderSignatureBox(sigKiri, true)}

                    {showPengawasMiddle && (
                      <div>
                        <div className="text-[9.5px] text-slate-600">Diperiksa oleh,</div>
                        <div className="font-bold text-[10px]">Pengawas Pembina Sekolah</div>
                        <div className="h-14 flex items-center justify-center text-slate-300 italic text-[8.5px]">
                          [ Tanda Tangan ]
                        </div>
                        <div className="font-bold underline uppercase text-[9.5px]">{effectiveSettings.namaPengawas}</div>
                        <div className="text-[8.5px] font-mono text-slate-600">NIP. {effectiveSettings.nipPengawas}</div>
                      </div>
                    )}

                    {renderSignatureBox(sigKanan, true)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
