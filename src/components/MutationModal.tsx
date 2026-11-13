import React, { useState } from 'react';
import { X, ArrowRightLeft, AlertTriangle } from 'lucide-react';
import { Student } from '../types';
import { SMPN99_INFO } from '../data/mockData';

interface MutationModalProps {
  student: Student;
  onClose: () => void;
  onConfirm: (mutationData: any) => void;
}

export const MutationModal: React.FC<MutationModalProps> = ({
  student,
  onClose,
  onConfirm,
}) => {
  const [jenis, setJenis] = useState<'MUTASI_KELUAR' | 'LULUS'>('MUTASI_KELUAR');
  const [tanggal, setTanggal] = useState<string>(new Date().toISOString().slice(0, 10));
  const [noSurat, setNoSurat] = useState<string>(
    `421.3/${Math.floor(100 + Math.random() * 900)}/SMPN99/${new Date().getFullYear()}`
  );
  const [alasan, setAlasan] = useState<string>('Mengikuti kepindahan domisili orang tua.');
  const [sekolahTujuan, setSekolahTujuan] = useState<string>('');
  const [catatan, setCatatan] = useState<string>('Seluruh berkas rapor dan administrasi diserahkan resmi.');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({
      jenis,
      tanggal,
      noSurat,
      alasan,
      sekolahTujuan,
      kelasSaatKeluar: `Kelas ${student.rombel}`,
      disetujuiOleh: `${SMPN99_INFO.kepalaSekolah} (Kepala Sekolah)`,
      catatan,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Proses Mutasi / Kelulusan Siswa</h2>
              <p className="text-[11px] text-slate-300">
                Pencatatan resmi ke lembar Buku Register Mutasi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Student Info Callout */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs flex items-center justify-between">
          <div>
            <div className="font-bold text-slate-900">{student.namaLengkap}</div>
            <div className="text-[11px] text-slate-500 font-mono">
              NIS: {student.nis} · Rombel {student.rombel}
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
            Status Saat Ini: {student.status}
          </span>
        </div>

        {/* Warning banner */}
        <div className="mx-4 mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2 text-amber-800 text-[11px] leading-relaxed">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong>Peringatan Kebijakan Buku Induk:</strong> Data siswa tidak akan dihapus dari sistem, namun statusnya akan diubah dan riwayat mutasi akan tercatat permanen pada lembar buku induk siswa.
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Jenis Transaksi</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setJenis('MUTASI_KELUAR');
                  setAlasan('Mengikuti kepindahan domisili orang tua.');
                }}
                className={`py-2 px-3 rounded-lg font-semibold text-xs border text-center transition-colors ${
                  jenis === 'MUTASI_KELUAR'
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                Mutasi Keluar (Pindah)
              </button>
              <button
                type="button"
                onClick={() => {
                  setJenis('LULUS');
                  setAlasan('Tamat Belajar dan Lulus Ujian Satuan Pendidikan.');
                  setSekolahTujuan('Melanjutkan ke SMA/SMK/MA');
                }}
                className={`py-2 px-3 rounded-lg font-semibold text-xs border text-center transition-colors ${
                  jenis === 'LULUS'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                Kelulusan / Tamat Belajar
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tanggal Berlaku</label>
              <input
                type="date"
                required
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nomor Surat Resmi</label>
              <input
                type="text"
                required
                value={noSurat}
                onChange={(e) => setNoSurat(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              {jenis === 'MUTASI_KELUAR' ? 'Sekolah Tujuan Pindah' : 'Rencana Sekolah Lanjutan'}
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: SMP Negeri 1 Surabaya, Jawa Timur"
              value={sekolahTujuan}
              onChange={(e) => setSekolahTujuan(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Alasan / Dasar Keputusan</label>
            <textarea
              rows={2}
              required
              value={alasan}
              onChange={(e) => setAlasan(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Catatan Tambahan TU</label>
            <input
              type="text"
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
            >
              Konfirmasi & Catat Mutasi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
