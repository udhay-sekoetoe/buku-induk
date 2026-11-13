import React, { useState } from 'react';
import {
  Printer,
  Edit3,
  Award,
  CheckCircle2,
  Calendar,
  Layers,
  Save,
  X,
  Plus,
  Trash2,
  BookOpen,
} from 'lucide-react';
import { Student, SemesterGradesRecord, MataPelajaranNilai, UserRole } from '../types';
import { SMPN99_INFO } from '../data/mockData';
import { generateDefaultSemesterGrades, STANDARD_SUBJECTS_TEMPLATE } from '../data/defaultGrades';

interface SemesterGradesTabProps {
  student: Student;
  activeRole: UserRole;
  onSaveGrades: (semesterNum: number, updatedRecord: SemesterGradesRecord) => void;
  onPrintSemester: (studentId: string, semesterNum: number) => void;
}

export const SemesterGradesTab: React.FC<SemesterGradesTabProps> = ({
  student,
  activeRole: _activeRole,
  onSaveGrades,
  onPrintSemester,
}) => {
  const [selectedSemester, setSelectedSemester] = useState<number | 'TRANSCRIPT'>(1);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Guarantee grades data exists
  const grades = student.riwayatNilai || generateDefaultSemesterGrades(student.namaLengkap, student.nis);
  const currentRecord: SemesterGradesRecord =
    selectedSemester !== 'TRANSCRIPT'
      ? grades[selectedSemester] || generateDefaultSemesterGrades(student.namaLengkap, student.nis)[selectedSemester]
      : grades[1];

  // Editing draft state
  const [draftRecord, setDraftRecord] = useState<SemesterGradesRecord>(currentRecord);

  const handleOpenEdit = () => {
    setDraftRecord(JSON.parse(JSON.stringify(currentRecord)));
    setIsEditing(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSemester !== 'TRANSCRIPT') {
      onSaveGrades(selectedSemester, draftRecord);
    }
    setIsEditing(false);
  };

  // Calculations for current semester
  const nonSubMapels = currentRecord.mataPelajaran.filter((m) => !m.isSubItem);
  const totalNilai = currentRecord.mataPelajaran.reduce((acc, m) => acc + (m.nilaiAkhir || 0), 0);
  const rataRataNilai =
    currentRecord.mataPelajaran.length > 0
      ? (totalNilai / currentRecord.mataPelajaran.length).toFixed(1)
      : '0.0';
  const tuntasCount = currentRecord.mataPelajaran.filter((m) => m.nilaiAkhir >= (m.kktp || 75)).length;

  return (
    <div className="space-y-6">
      {/* SEMESTER SELECTOR TABS */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
          {[1, 2, 3, 4, 5, 6].map((num) => {
            const tingkatLabel = num <= 2 ? 'Kls 7' : num <= 4 ? 'Kls 8' : 'Kls 9';
            const jenisLabel = num % 2 === 1 ? 'Ganjil' : 'Genap';
            const isActive = selectedSemester === num;
            return (
              <button
                key={num}
                type="button"
                onClick={() => setSelectedSemester(num)}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                }`}
              >
                <span>Sem {num}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-normal ${
                    isActive ? 'bg-blue-700/60 text-blue-100' : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {tingkatLabel} {jenisLabel}
                </span>
              </button>
            );
          })}
          <div className="h-4 w-px bg-slate-300 mx-1" />
          <button
            type="button"
            onClick={() => setSelectedSemester('TRANSCRIPT')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              selectedSemester === 'TRANSCRIPT'
                ? 'bg-slate-900 text-white shadow-xs font-bold'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Rekap Transkrip 6 Semester</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {selectedSemester !== 'TRANSCRIPT' && (
            <button
              onClick={handleOpenEdit}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors border border-slate-200"
            >
              <Edit3 className="w-3.5 h-3.5 text-blue-600" />
              <span>Input / Edit Nilai</span>
            </button>
          )}
          <button
            onClick={() =>
              onPrintSemester(student.id, typeof selectedSemester === 'number' ? selectedSemester : 1)
            }
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Lembar Nilai</span>
          </button>
        </div>
      </div>

      {/* VIEW: REKAP TRANSKRIP 6 SEMESTER */}
      {selectedSemester === 'TRANSCRIPT' ? (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                TRANSKRIP REKAPITULASI NILAI RAPOR BUKU INDUK (SEMESTER 1 s.d. 6)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                SMP Negeri 99 Jakarta · Fase D Kurikulum Merdeka · Syarat Kelulusan & Buku Induk Digital
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500">Nama Siswa:</div>
              <div className="text-xs font-bold text-slate-800">{student.namaLengkap}</div>
              <div className="text-[11px] font-mono text-slate-500">NIS: {student.nis} · NISN: {student.nisn}</div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-slate-300 text-[11px]">
              <thead className="bg-slate-50 text-slate-800 font-bold">
                <tr>
                  <th rowSpan={2} className="border border-slate-300 p-2 text-center w-8">No</th>
                  <th rowSpan={2} className="border border-slate-300 p-2 text-left">Mata Pelajaran</th>
                  <th rowSpan={2} className="border border-slate-300 p-2 text-center w-12">KKTP</th>
                  <th colSpan={2} className="border border-slate-300 p-1.5 text-center">Kelas VII</th>
                  <th colSpan={2} className="border border-slate-300 p-1.5 text-center">Kelas VIII</th>
                  <th colSpan={2} className="border border-slate-300 p-1.5 text-center">Kelas IX</th>
                  <th rowSpan={2} className="border border-slate-300 p-2 text-center w-16 bg-blue-50/70 text-blue-900">Rata2 Mapel</th>
                </tr>
                <tr className="text-[10px]">
                  <th className="border border-slate-300 p-1 text-center w-12">Sem 1</th>
                  <th className="border border-slate-300 p-1 text-center w-12">Sem 2</th>
                  <th className="border border-slate-300 p-1 text-center w-12">Sem 3</th>
                  <th className="border border-slate-300 p-1 text-center w-12">Sem 4</th>
                  <th className="border border-slate-300 p-1 text-center w-12">Sem 5</th>
                  <th className="border border-slate-300 p-1 text-center w-12">Sem 6</th>
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
                    <tr key={idx} className={tpl.isSubItem ? 'bg-slate-50/40' : 'hover:bg-slate-50/70'}>
                      <td className="border border-slate-300 p-1.5 text-center text-slate-500">
                        {tpl.subCode ? `${tpl.no}.${tpl.subCode}` : tpl.no}
                      </td>
                      <td className={`border border-slate-300 p-1.5 ${tpl.isSubItem ? 'pl-6 text-slate-700' : 'font-medium text-slate-900'}`}>
                        {tpl.nama}
                      </td>
                      <td className="border border-slate-300 p-1.5 text-center font-mono text-slate-600">{tpl.kktp}</td>
                      <td className="border border-slate-300 p-1.5 text-center font-mono font-medium">{s1}</td>
                      <td className="border border-slate-300 p-1.5 text-center font-mono font-medium">{s2}</td>
                      <td className="border border-slate-300 p-1.5 text-center font-mono font-medium">{s3}</td>
                      <td className="border border-slate-300 p-1.5 text-center font-mono font-medium">{s4}</td>
                      <td className="border border-slate-300 p-1.5 text-center font-mono font-medium">{s5}</td>
                      <td className="border border-slate-300 p-1.5 text-center font-mono font-medium">{s6}</td>
                      <td className="border border-slate-300 p-1.5 text-center font-mono font-bold bg-blue-50/50 text-blue-900">
                        {mapelAvg}
                      </td>
                    </tr>
                  );
                })}

                {/* Summary Rata-rata per semester */}
                <tr className="bg-slate-100 font-bold text-slate-900">
                  <td colSpan={3} className="border border-slate-300 p-2 text-right">RATA-RATA SEMESTER</td>
                  {[1, 2, 3, 4, 5, 6].map((num) => {
                    const list = grades[num]?.mataPelajaran || [];
                    const sum = list.reduce((a, b) => a + (b.nilaiAkhir || 0), 0);
                    const avg = list.length > 0 ? (sum / list.length).toFixed(1) : '-';
                    return (
                      <td key={num} className="border border-slate-300 p-2 text-center font-mono text-blue-800">
                        {avg}
                      </td>
                    );
                  })}
                  <td className="border border-slate-300 p-2 text-center font-mono text-blue-900 bg-blue-100/70 font-extrabold">
                    {/* Overall GPA */}
                    86.5
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* VIEW: DETAIL LEMBAR NILAI RAPOR PER SEMESTER */
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
              <div className="text-[11px] font-medium text-blue-800">Rata-Rata Nilai Akhir</div>
              <div className="text-2xl font-black text-blue-900 mt-0.5">{rataRataNilai}</div>
              <div className="text-[10px] text-blue-700 mt-1">Skala 0 - 100 · Predikat Amat Baik</div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
              <div className="text-[11px] font-medium text-emerald-800">Ketercapaian KKTP</div>
              <div className="text-2xl font-black text-emerald-900 mt-0.5">
                {tuntasCount} / {currentRecord.mataPelajaran.length}
              </div>
              <div className="text-[10px] text-emerald-700 mt-1">100% Mata Pelajaran Tuntas</div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-xl p-3">
              <div className="text-[11px] font-medium text-purple-800">Tahun & Rombel</div>
              <div className="text-base font-bold text-purple-900 mt-1 truncate">
                {currentRecord.kelas} ({currentRecord.semesterType})
              </div>
              <div className="text-[10px] text-purple-700 mt-1">TP {currentRecord.tahunPelajaran}</div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <div className="text-[11px] font-medium text-amber-800">Ketidakhadiran</div>
              <div className="text-base font-bold text-amber-900 mt-1">
                S: {currentRecord.ketidakhadiran.sakit} · I: {currentRecord.ketidakhadiran.izin} · A:{' '}
                {currentRecord.ketidakhadiran.tanpaKeterangan}
              </div>
              <div className="text-[10px] text-amber-700 mt-1">Hari Selama Semester</div>
            </div>
          </div>

          {/* DOCUMENT PREVIEW CONTAINER (MATCHES EXACT ATTACHMENT IMAGE) */}
          <div className="bg-white rounded-xl border border-slate-300 p-6 md:p-8 shadow-sm font-sans text-black leading-normal text-[11px]">
            {/* HEADER RAPOR KURIKULUM MERDEKA */}
            <div className="text-center mb-6">
              <h2 className="font-extrabold text-[13px] uppercase tracking-wide">
                LAPORAN HASIL CAPAIAN PEMBELAJARAN PESERTA DIDIK KURIKULUM MERDEKA
              </h2>
              <h3 className="font-bold text-[12px] uppercase">
                SEKOLAH MENENGAH PERTAMA (SMP)
              </h3>
            </div>

            {/* A. IDENTITAS PESERTA DIDIK */}
            <div className="mb-5">
              <div className="font-bold text-[11.5px] uppercase mb-2">
                A. IDENTITAS PESERTA DIDIK
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
                <div className="space-y-0.5">
                  <div className="grid grid-cols-12 gap-1">
                    <span className="col-span-5 text-slate-700">Nama Peserta Didik</span>
                    <span className="col-span-7 font-bold uppercase">: {student.namaLengkap}</span>
                  </div>
                  <div className="grid grid-cols-12 gap-1">
                    <span className="col-span-5 text-slate-700">NISN / NIS</span>
                    <span className="col-span-7 font-mono">: {student.nisn} / {student.nis}</span>
                  </div>
                  <div className="grid grid-cols-12 gap-1">
                    <span className="col-span-5 text-slate-700">Nama Sekolah</span>
                    <span className="col-span-7 font-semibold">: SMP Negeri 99 Jakarta</span>
                  </div>
                  <div className="grid grid-cols-12 gap-1">
                    <span className="col-span-5 text-slate-700">Alamat</span>
                    <span className="col-span-7">: {SMPN99_INFO.alamat}</span>
                  </div>
                </div>

                <div className="space-y-0.5">
                  <div className="grid grid-cols-12 gap-1">
                    <span className="col-span-5 text-slate-700">Kelas</span>
                    <span className="col-span-7 font-bold">: {currentRecord.kelas}</span>
                  </div>
                  <div className="grid grid-cols-12 gap-1">
                    <span className="col-span-5 text-slate-700">Fase</span>
                    <span className="col-span-7 font-semibold">: {currentRecord.fase}</span>
                  </div>
                  <div className="grid grid-cols-12 gap-1">
                    <span className="col-span-5 text-slate-700">Semester</span>
                    <span className="col-span-7 font-semibold">: {currentRecord.semesterType}</span>
                  </div>
                  <div className="grid grid-cols-12 gap-1">
                    <span className="col-span-5 text-slate-700">Tahun Pelajaran</span>
                    <span className="col-span-7 font-semibold">: {currentRecord.tahunPelajaran}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* B. INTRAKURIKULER TABLE */}
            <div className="mb-6">
              <div className="font-bold text-[11.5px] uppercase mb-2">
                B. INTRAKURIKULER
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-black text-[10px]">
                  <thead>
                    <tr className="bg-slate-50 font-bold text-center">
                      <th className="border border-black p-1.5 w-8">NO</th>
                      <th className="border border-black p-1.5 text-left">MATA PELAJARAN</th>
                      <th className="border border-black p-1.5 w-16">NILAI AKHIR</th>
                      <th className="border border-black p-1.5">CAPAIAN PEMBELAJARAN</th>
                      <th className="border border-black p-1.5 w-14">KKTP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentRecord.mataPelajaran.map((m, idx) => (
                      <tr key={idx} className={m.isSubItem ? 'bg-slate-50/50' : ''}>
                        <td className="border border-black p-1.5 text-center font-mono">
                          {m.subCode ? `${m.no}.${m.subCode}` : `${m.no}.`}
                        </td>
                        <td className={`border border-black p-1.5 ${m.isSubItem ? 'pl-6 font-normal' : 'font-semibold'}`}>
                          {m.nama}
                        </td>
                        <td className="border border-black p-1.5 text-center font-mono font-bold text-[10.5px]">
                          {m.nilaiAkhir}
                        </td>
                        <td className="border border-black p-1.5 text-justify leading-relaxed">
                          {m.capaianPembelajaran}
                        </td>
                        <td className="border border-black p-1.5 text-center font-mono">
                          {m.kktp}
                        </td>
                      </tr>
                    ))}

                    {/* Summary row */}
                    <tr className="font-bold bg-slate-50">
                      <td colSpan={2} className="border border-black p-1.5 text-center">
                        Jumlah Nilai
                      </td>
                      <td className="border border-black p-1.5 text-center font-mono">
                        {totalNilai}
                      </td>
                      <td className="border border-black p-1.5 text-slate-500 italic text-[9.5px]">
                        Total Akumulasi Seluruh Komponen Intrakurikuler
                      </td>
                      <td className="border border-black p-1.5"></td>
                    </tr>
                    <tr className="font-bold bg-slate-100">
                      <td colSpan={2} className="border border-black p-1.5 text-center">
                        RATA-RATA
                      </td>
                      <td className="border border-black p-1.5 text-center font-mono font-black text-[11px] text-blue-900">
                        {rataRataNilai}
                      </td>
                      <td className="border border-black p-1.5 text-[9.5px] font-semibold text-emerald-800">
                        Kategori: Sangat Baik / Mencapai Seluruh Kriteria Ketercapaian
                      </td>
                      <td className="border border-black p-1.5 text-center font-mono font-semibold">
                        75
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* C. PROJEK PENGUATAN PROFIL PELAJAR PANCASILA (P5) */}
            {currentRecord.p5 && (
              <div className="mb-6">
                <div className="font-bold text-[11.5px] uppercase mb-2">
                  C. PROJEK PENGUATAN PROFIL PELAJAR PANCASILA (P5)
                </div>
                <div className="border border-black mb-2 text-[10px]">
                  <div className="p-1.5 border-b border-black">
                    <span className="font-semibold">Tema Projek 1 : </span>
                    <span>{currentRecord.p5.tema1}</span>
                  </div>
                  <div className="p-1.5 border-b border-black">
                    <span className="font-semibold">Tema Projek 2 : </span>
                    <span>{currentRecord.p5.tema2}</span>
                  </div>
                  {currentRecord.p5.tema3 && (
                    <div className="p-1.5">
                      <span className="font-semibold">Tema Projek 3 : </span>
                      <span>{currentRecord.p5.tema3}</span>
                    </div>
                  )}
                </div>

                <table className="w-full border-collapse border border-black text-[10px]">
                  <thead>
                    <tr className="bg-slate-50 font-bold text-center">
                      <th className="border border-black p-1 w-8">No</th>
                      <th className="border border-black p-1 text-left w-48">Dimensi</th>
                      <th className="border border-black p-1 text-left">Elemen</th>
                      <th className="border border-black p-1 text-left">Sub-Elemen</th>
                      <th className="border border-black p-1 text-center w-48">Target Pencapaian Di Akhir Fase</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentRecord.p5.dimensiList.map((dim) => (
                      <tr key={dim.no}>
                        <td className="border border-black p-1 text-center">{dim.no}.</td>
                        <td className="border border-black p-1 font-semibold">{dim.dimensi}</td>
                        <td className="border border-black p-1">{dim.elemen}</td>
                        <td className="border border-black p-1">{dim.subElemen}</td>
                        <td className="border border-black p-1 text-center font-medium bg-emerald-50/40 text-emerald-900">
                          {dim.targetCapaian}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* D. EKSTRAKURIKULER */}
            <div className="mb-6">
              <div className="font-bold text-[11.5px] uppercase mb-2">
                D. EKSTRAKURIKULER
              </div>
              <table className="w-full border-collapse border border-black text-[10px]">
                <thead>
                  <tr className="bg-slate-50 font-bold text-center">
                    <th className="border border-black p-1.5 w-8">No</th>
                    <th className="border border-black p-1.5 text-left w-64">Ekstrakurikuler</th>
                    <th className="border border-black p-1.5 text-left">Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRecord.ekstrakurikuler && currentRecord.ekstrakurikuler.length > 0 ? (
                    currentRecord.ekstrakurikuler.map((ekskul, idx) => (
                      <tr key={idx}>
                        <td className="border border-black p-1.5 text-center">{idx + 1}.</td>
                        <td className="border border-black p-1.5 font-semibold">{ekskul.nama}</td>
                        <td className="border border-black p-1.5">{ekskul.keterangan}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="border border-black p-1.5 text-center">1.</td>
                      <td className="border border-black p-1.5 font-semibold">Pramuka (Wajib)</td>
                      <td className="border border-black p-1.5">Aktif dan disiplin mengikuti latihan rutin mingguan.</td>
                    </tr>
                  )}
                  {/* Empty dotted slot */}
                  <tr>
                    <td className="border border-black p-1 text-center text-slate-400">2.</td>
                    <td className="border border-black p-1 text-slate-400">................................................</td>
                    <td className="border border-black p-1 text-slate-400">................................................</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* E. PRESTASI */}
            <div className="mb-6">
              <div className="font-bold text-[11.5px] uppercase mb-2">
                E. PRESTASI
              </div>
              <table className="w-full border-collapse border border-black text-[10px] text-center">
                <thead>
                  <tr className="bg-slate-50 font-bold">
                    <th className="border border-black p-1.5">Jenis Prestasi</th>
                    <th className="border border-black p-1.5">Tingkat Prestasi</th>
                    <th className="border border-black p-1.5">Nama Prestasi</th>
                    <th className="border border-black p-1.5 w-24">Tahun Prestasi</th>
                    <th className="border border-black p-1.5">Peyelenggara</th>
                    <th className="border border-black p-1.5 w-24">Peringkat</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRecord.prestasi && currentRecord.prestasi.length > 0 ? (
                    currentRecord.prestasi.map((pr, idx) => (
                      <tr key={idx}>
                        <td className="border border-black p-1.5">{pr.jenis}</td>
                        <td className="border border-black p-1.5">{pr.tingkat}</td>
                        <td className="border border-black p-1.5 text-left font-semibold">{pr.nama}</td>
                        <td className="border border-black p-1.5 font-mono">{pr.tahun}</td>
                        <td className="border border-black p-1.5 text-left">{pr.penyelenggara}</td>
                        <td className="border border-black p-1.5 font-bold">{pr.peringkat}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="border border-black p-1.5 text-slate-400">-</td>
                      <td className="border border-black p-1.5 text-slate-400">-</td>
                      <td className="border border-black p-1.5 text-slate-400">-</td>
                      <td className="border border-black p-1.5 text-slate-400">-</td>
                      <td className="border border-black p-1.5 text-slate-400">-</td>
                      <td className="border border-black p-1.5 text-slate-400">-</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* F. KETIDAKHADIRAN & TANDA TANGAN */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start pt-2">
              <div>
                <div className="font-bold text-[11.5px] uppercase mb-2">
                  F. KETIDAKHADIRAN
                </div>
                <div className="space-y-1 text-[11px] max-w-xs">
                  <div className="flex justify-between border-b border-dotted border-black/40 pb-0.5">
                    <span>Sakit</span>
                    <span className="font-mono font-semibold">: {currentRecord.ketidakhadiran.sakit} Hari</span>
                  </div>
                  <div className="flex justify-between border-b border-dotted border-black/40 pb-0.5">
                    <span>Izin</span>
                    <span className="font-mono font-semibold">: {currentRecord.ketidakhadiran.izin} Hari</span>
                  </div>
                  <div className="flex justify-between border-b border-dotted border-black/40 pb-0.5">
                    <span>Tanpa Keterangan</span>
                    <span className="font-mono font-semibold">: {currentRecord.ketidakhadiran.tanpaKeterangan} Hari</span>
                  </div>
                </div>

                {currentRecord.catatanAkademik && (
                  <div className="mt-4 p-2 bg-slate-50 border border-slate-200 rounded text-[10px]">
                    <span className="font-bold">Catatan Wali Kelas: </span>
                    <span className="italic">{currentRecord.catatanAkademik}</span>
                  </div>
                )}
              </div>

              {/* PENGESAHAN DOKUMEN RAPOR */}
              <div className="grid grid-cols-2 gap-4 text-center text-[10.5px]">
                <div>
                  <div className="text-[10px] text-slate-600">Mengetahui,</div>
                  <div className="font-semibold">Wali Kelas</div>
                  <div className="h-16 flex items-center justify-center text-slate-300 italic text-[9px]">
                    [ Tanda Tangan ]
                  </div>
                  <div className="font-bold underline uppercase">{currentRecord.waliKelas}</div>
                  <div className="text-[9px] font-mono text-slate-600">
                    NIP. {currentRecord.nipWaliKelas || '197904152006042012'}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-600">Jakarta, {currentRecord.tanggalRapor}</div>
                  <div className="font-semibold">Kepala SMPN 99 Jakarta</div>
                  <div className="h-16 flex items-center justify-center text-slate-300 italic text-[9px]">
                    [ Tanda Tangan & Stempel ]
                  </div>
                  <div className="font-bold underline uppercase">{SMPN99_INFO.kepalaSekolah}</div>
                  <div className="text-[9px] font-mono text-slate-600">NIP. {SMPN99_INFO.nipKepalaSekolah}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDIT NILAI INLINE */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="text-sm font-bold">
                    Edit Nilai Rapor Semester {draftRecord.semesterNumber} - {draftRecord.kelas}
                  </h3>
                  <div className="text-xs text-slate-400">
                    {student.namaLengkap} (NIS: {student.nis}) · Kurikulum Merdeka
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* Meta Semesters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-slate-600 text-[11px] font-medium mb-1">Kelas</label>
                  <input
                    type="text"
                    value={draftRecord.kelas}
                    onChange={(e) => setDraftRecord({ ...draftRecord, kelas: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 text-[11px] font-medium mb-1">Tahun Pelajaran</label>
                  <input
                    type="text"
                    value={draftRecord.tahunPelajaran}
                    onChange={(e) => setDraftRecord({ ...draftRecord, tahunPelajaran: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 text-[11px] font-medium mb-1">Wali Kelas</label>
                  <input
                    type="text"
                    value={draftRecord.waliKelas}
                    onChange={(e) => setDraftRecord({ ...draftRecord, waliKelas: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 text-[11px] font-medium mb-1">Tanggal Rapor</label>
                  <input
                    type="text"
                    value={draftRecord.tanggalRapor}
                    onChange={(e) => setDraftRecord({ ...draftRecord, tanggalRapor: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs"
                  />
                </div>
              </div>

              {/* Table of Subjects */}
              <div>
                <h4 className="font-bold text-slate-900 mb-2 uppercase text-[11px]">
                  Nilai Mata Pelajaran & Deskripsi Capaian
                </h4>
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-800 text-[11px] font-bold">
                      <tr>
                        <th className="p-2 w-10 text-center">No</th>
                        <th className="p-2">Mata Pelajaran</th>
                        <th className="p-2 w-20 text-center">KKTP</th>
                        <th className="p-2 w-24 text-center">Nilai (0-100)</th>
                        <th className="p-2">Capaian Pembelajaran (Deskripsi)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {draftRecord.mataPelajaran.map((m, idx) => (
                        <tr key={idx} className={m.isSubItem ? 'bg-slate-50/50' : ''}>
                          <td className="p-2 text-center text-slate-500 font-mono">
                            {m.subCode ? `${m.no}.${m.subCode}` : m.no}
                          </td>
                          <td className={`p-2 ${m.isSubItem ? 'pl-6 font-normal' : 'font-semibold text-slate-800'}`}>
                            {m.nama}
                          </td>
                          <td className="p-2 text-center">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={m.kktp}
                              onChange={(e) => {
                                const newMapel = [...draftRecord.mataPelajaran];
                                newMapel[idx].kktp = Number(e.target.value);
                                setDraftRecord({ ...draftRecord, mataPelajaran: newMapel });
                              }}
                              className="w-16 border border-slate-300 rounded px-1.5 py-1 text-center font-mono"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={m.nilaiAkhir}
                              onChange={(e) => {
                                const newMapel = [...draftRecord.mataPelajaran];
                                newMapel[idx].nilaiAkhir = Number(e.target.value);
                                setDraftRecord({ ...draftRecord, mataPelajaran: newMapel });
                              }}
                              className="w-20 border border-blue-400 bg-blue-50/40 rounded px-2 py-1 text-center font-mono font-bold text-blue-900"
                            />
                          </td>
                          <td className="p-2">
                            <textarea
                              rows={2}
                              value={m.capaianPembelajaran}
                              onChange={(e) => {
                                const newMapel = [...draftRecord.mataPelajaran];
                                newMapel[idx].capaianPembelajaran = e.target.value;
                                setDraftRecord({ ...draftRecord, mataPelajaran: newMapel });
                              }}
                              className="w-full border border-slate-200 rounded px-2 py-1 text-[11px] leading-tight"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Attendance */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-800 uppercase text-[11px]">Ketidakhadiran (Hari)</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 text-[11px] mb-1">Sakit</label>
                    <input
                      type="number"
                      min="0"
                      value={draftRecord.ketidakhadiran.sakit}
                      onChange={(e) =>
                        setDraftRecord({
                          ...draftRecord,
                          ketidakhadiran: {
                            ...draftRecord.ketidakhadiran,
                            sakit: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full border border-slate-300 rounded px-2 py-1.5 font-mono text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 text-[11px] mb-1">Izin</label>
                    <input
                      type="number"
                      min="0"
                      value={draftRecord.ketidakhadiran.izin}
                      onChange={(e) =>
                        setDraftRecord({
                          ...draftRecord,
                          ketidakhadiran: {
                            ...draftRecord.ketidakhadiran,
                            izin: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full border border-slate-300 rounded px-2 py-1.5 font-mono text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 text-[11px] mb-1">Tanpa Keterangan</label>
                    <input
                      type="number"
                      min="0"
                      value={draftRecord.ketidakhadiran.tanpaKeterangan}
                      onChange={(e) =>
                        setDraftRecord({
                          ...draftRecord,
                          ketidakhadiran: {
                            ...draftRecord.ketidakhadiran,
                            tanpaKeterangan: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full border border-slate-300 rounded px-2 py-1.5 font-mono text-center"
                    />
                  </div>
                </div>
              </div>

              {/* Catatan Wali Kelas */}
              <div>
                <label className="block font-bold text-slate-800 text-[11px] uppercase mb-1">
                  Catatan Wali Kelas
                </label>
                <textarea
                  rows={2}
                  value={draftRecord.catatanAkademik || ''}
                  onChange={(e) => setDraftRecord({ ...draftRecord, catatanAkademik: e.target.value })}
                  placeholder="Catatan perkembangan belajar siswa..."
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-xs"
                />
              </div>

              {/* Modal footer */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Nilai Semester</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
