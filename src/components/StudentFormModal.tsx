import React, { useState } from 'react';
import { X, Save, AlertCircle, User, Users, Home, GraduationCap } from 'lucide-react';
import { Student, Gender, Agama, TingkatKelas, JalurPenerimaan, StudentStatus } from '../types';

interface StudentFormModalProps {
  initialData?: Student | null;
  onClose: () => void;
  onSubmit: (studentData: any) => void;
}

export const StudentFormModal: React.FC<StudentFormModalProps> = ({
  initialData,
  onClose,
  onSubmit,
}) => {
  const isEditing = !!initialData;
  const [activeStep, setActiveStep] = useState<number>(1);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Identitas
    nis: initialData?.nis || '',
    nisn: initialData?.nisn || '',
    nik: initialData?.nik || '',
    namaLengkap: initialData?.namaLengkap || '',
    namaPanggilan: initialData?.namaPanggilan || '',
    jenisKelamin: initialData?.jenisKelamin || ('L' as Gender),
    tempatLahir: initialData?.tempatLahir || 'Jakarta',
    tanggalLahir: initialData?.tanggalLahir || '2011-01-01',
    agama: initialData?.agama || ('Islam' as Agama),
    kewarganegaraan: initialData?.kewarganegaraan || 'WNI',
    anakKe: initialData?.anakKe || 1,
    jumlahSaudaraKandung: initialData?.jumlahSaudaraKandung || 1,
    statusAnak: initialData?.statusAnak || 'Kandung',
    bahasaSehariHari: initialData?.bahasaSehariHari || 'Bahasa Indonesia',
    golonganDarah: initialData?.golonganDarah || 'O',
    tinggiBadanCm: initialData?.tinggiBadanCm || 155,
    beratBadanKg: initialData?.beratBadanKg || 45,
    riwayatPenyakit: initialData?.riwayatPenyakit || '',

    // Step 2: Rombel & Asal Sekolah
    status: initialData?.status || ('AKTIF' as StudentStatus),
    tingkat: initialData?.tingkat || ('VII' as TingkatKelas),
    rombel: initialData?.rombel || '7A',
    tahunAjaranMasuk: initialData?.tahunAjaranMasuk || '2026/2027',
    tahunAjaranSekarang: initialData?.tahunAjaranSekarang || '2026/2027',
    namaSd: initialData?.sekolahAsal?.namaSd || '',
    npsnSd: initialData?.sekolahAsal?.npsnSd || '',
    tahunLulusSd: initialData?.sekolahAsal?.tahunLulusSd || '2026',
    noIjazahSd: initialData?.sekolahAsal?.noIjazahSd || '',
    noSklSd: initialData?.sekolahAsal?.noSklSd || '',
    tanggalDiterima: initialData?.penerimaan?.tanggalDiterima || '2026-07-13',
    jalurPenerimaan: initialData?.penerimaan?.jalurPenerimaan || ('Zonasi' as JalurPenerimaan),

    // Step 3: Orang Tua & Kontak
    namaAyah: initialData?.ayah?.nama || '',
    pekerjaanAyah: initialData?.ayah?.pekerjaan || '',
    noHpAyah: initialData?.ayah?.noHp || '',
    pendidikanAyah: initialData?.ayah?.pendidikanTerakhir || 'S1',
    namaIbu: initialData?.ibu?.nama || '',
    pekerjaanIbu: initialData?.ibu?.pekerjaan || '',
    noHpIbu: initialData?.ibu?.noHp || '',
    pendidikanIbu: initialData?.ibu?.pendidikanTerakhir || 'SMA',
    namaWali: initialData?.wali?.nama || '',
    hubunganWali: initialData?.wali?.hubunganKeluarga || '',
    noHpWali: initialData?.wali?.noHp || '',

    // Step 4: Alamat Domisili
    alamatJalan: initialData?.alamatJalan || '',
    rt: initialData?.rt || '001',
    rw: initialData?.rw || '001',
    kelurahan: initialData?.kelurahan || 'Utan Kayu Utara',
    kecamatan: initialData?.kecamatan || 'Matraman',
    kotaKabupaten: initialData?.kotaKabupaten || 'Jakarta Timur',
    provinsi: initialData?.provinsi || 'DKI Jakarta',
    kodePos: initialData?.kodePos || '13120',
    tinggalDengan: initialData?.tinggalDengan || 'Orang Tua',
    jarakKeSekolahKm: initialData?.jarakKeSekolahKm || 1,
    transportasi: initialData?.transportasi || 'Jalan Kaki',
    noHpSiswa: initialData?.noHpSiswa || '',
  });

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Validasi
    if (!formData.namaLengkap.trim()) {
      setErrorMsg('Nama lengkap siswa wajib diisi!');
      setActiveStep(1);
      return;
    }
    if (!formData.nis.trim()) {
      setErrorMsg('Nomor Induk Siswa (NIS) wajib diisi!');
      setActiveStep(1);
      return;
    }
    if (!formData.nisn.trim() || formData.nisn.length < 10) {
      setErrorMsg('NISN wajib 10 digit angka!');
      setActiveStep(1);
      return;
    }

    // Build payload
    const payload = {
      ...(initialData || {}),
      nis: formData.nis.trim(),
      nisn: formData.nisn.trim(),
      nik: formData.nik?.trim() || (initialData?.nik || ('317501' + formData.nisn.trim())),
      namaLengkap: formData.namaLengkap.trim().toUpperCase(),
      namaPanggilan: formData.namaPanggilan.trim(),
      jenisKelamin: formData.jenisKelamin,
      tempatLahir: formData.tempatLahir,
      tanggalLahir: formData.tanggalLahir,
      agama: formData.agama,
      kewarganegaraan: formData.kewarganegaraan,
      anakKe: Number(formData.anakKe) || 1,
      jumlahSaudaraKandung: Number(formData.jumlahSaudaraKandung) || 0,
      statusAnak: formData.statusAnak,
      bahasaSehariHari: formData.bahasaSehariHari,
      golonganDarah: formData.golonganDarah,
      tinggiBadanCm: Number(formData.tinggiBadanCm) || 150,
      beratBadanKg: Number(formData.beratBadanKg) || 45,
      riwayatPenyakit: formData.riwayatPenyakit,

      status: formData.status,
      tingkat: formData.tingkat,
      rombel: formData.rombel,
      tahunAjaranMasuk: formData.tahunAjaranMasuk,
      tahunAjaranSekarang: formData.tahunAjaranSekarang,

      sekolahAsal: {
        namaSd: formData.namaSd || 'SDN Utan Kayu Utara 01 Pagi',
        npsnSd: formData.npsnSd || '20108392',
        alamatSd: 'Jakarta Timur',
        tahunLulusSd: formData.tahunLulusSd,
        noIjazahSd: formData.noIjazahSd || 'DN-01/D-SD/24/001',
        noSklSd: formData.noSklSd || 'SKL/2024/001',
      },

      penerimaan: {
        tanggalDiterima: formData.tanggalDiterima,
        tingkatAwal: formData.tingkat,
        rombelAwal: formData.rombel,
        jalurPenerimaan: formData.jalurPenerimaan,
      },

      ayah: {
        nama: formData.namaAyah,
        tempatLahir: 'Jakarta',
        tanggalLahir: '1980-01-01',
        agama: formData.agama,
        kewarganegaraan: 'WNI',
        pendidikanTerakhir: formData.pendidikanAyah,
        pekerjaan: formData.pekerjaanAyah,
        noHp: formData.noHpAyah,
        status: 'Masih Hidup',
      },

      ibu: {
        nama: formData.namaIbu,
        tempatLahir: 'Jakarta',
        tanggalLahir: '1983-01-01',
        agama: formData.agama,
        kewarganegaraan: 'WNI',
        pendidikanTerakhir: formData.pendidikanIbu,
        pekerjaan: formData.pekerjaanIbu,
        noHp: formData.noHpIbu,
        status: 'Masih Hidup',
      },

      wali: formData.namaWali
        ? {
            nama: formData.namaWali,
            hubunganKeluarga: formData.hubunganWali || 'Wali',
            pekerjaan: 'Wiraswasta',
            noHp: formData.noHpWali,
            alamat: formData.alamatJalan,
          }
        : undefined,

      alamatJalan: formData.alamatJalan || 'Jl. Utan Kayu Raya',
      rt: formData.rt || '001',
      rw: formData.rw || '001',
      kelurahan: formData.kelurahan || 'Utan Kayu Utara',
      kecamatan: formData.kecamatan || 'Matraman',
      kotaKabupaten: formData.kotaKabupaten || 'Jakarta Timur',
      provinsi: formData.provinsi || 'DKI Jakarta',
      kodePos: formData.kodePos || '13120',
      tinggalDengan: formData.tinggalDengan,
      jarakKeSekolahKm: Number(formData.jarakKeSekolahKm) || 1,
      transportasi: formData.transportasi,
      noHpSiswa: formData.noHpSiswa,

      riwayatKelas: initialData?.riwayatKelas || [
        {
          id: `cls-${Date.now()}`,
          tahunAjaran: formData.tahunAjaranSekarang,
          tingkat: formData.tingkat,
          rombel: formData.rombel,
          waliKelas: 'Dra. Endang Sulistyowati',
          semester: 'Ganjil',
          statusKenaikan: 'Sedang Berjalan',
        },
      ],

      dokumen: initialData?.dokumen || [
        {
          id: `doc-${Date.now()}-1`,
          studentId: '',
          jenisDokumen: 'Akta Kelahiran',
          fileName: 'akta_kelahiran.pdf',
          fileSize: '1.1 MB',
          uploadDate: new Date().toISOString().slice(0, 10),
          uploaderName: 'Operator TU',
          statusVerifikasi: 'TERVERIFIKASI',
        },
        {
          id: `doc-${Date.now()}-2`,
          studentId: '',
          jenisDokumen: 'Kartu Keluarga',
          fileName: 'kartu_keluarga.pdf',
          fileSize: '1.2 MB',
          uploadDate: new Date().toISOString().slice(0, 10),
          uploaderName: 'Operator TU',
          statusVerifikasi: 'TERVERIFIKASI',
        },
      ],
    };

    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div>
            <h2 className="text-base font-bold text-white">
              {isEditing ? 'Perbarui Data Buku Induk Siswa' : 'Pendaftaran Data Induk Siswa Baru'}
            </h2>
            <p className="text-xs text-blue-300">
              SMP Negeri 99 Jakarta · Buku Register Peserta Didik
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator Tabs */}
        <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 flex items-center gap-2 overflow-x-auto shrink-0 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveStep(1)}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
              activeStep === 1 ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>1. Biodata Pokok</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveStep(2)}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
              activeStep === 2 ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>2. Rombel & Asal SD</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveStep(3)}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
              activeStep === 3 ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>3. Orang Tua / Wali</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveStep(4)}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
              activeStep === 4 ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>4. Alamat & Kontak</span>
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-700 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleFormSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* STEP 1: IDENTITAS POKOK */}
          {activeStep === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nomor Induk Siswa (NIS) Sekolah <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 242507001"
                    value={formData.nis}
                    onChange={(e) => handleChange('nis', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-[10px] text-slate-400">Nomor induk registrasi internal SMPN 99</span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    NISN Kemdikbud (10 Digit) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    placeholder="Contoh: 0112348901"
                    value={formData.nisn}
                    onChange={(e) => handleChange('nisn', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-[10px] text-slate-400">Nomor Induk Siswa Nasional Dapodik</span>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nama Lengkap Peserta Didik <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nama sesuai Akta Kelahiran / Ijazah SD"
                    value={formData.namaLengkap}
                    onChange={(e) => handleChange('namaLengkap', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-bold uppercase focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Panggilan</label>
                  <input
                    type="text"
                    value={formData.namaPanggilan}
                    onChange={(e) => handleChange('namaPanggilan', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jenis Kelamin</label>
                  <select
                    value={formData.jenisKelamin}
                    onChange={(e) => handleChange('jenisKelamin', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="L">Laki-Laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tempat Lahir</label>
                  <input
                    type="text"
                    value={formData.tempatLahir}
                    onChange={(e) => handleChange('tempatLahir', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal Lahir</label>
                  <input
                    type="date"
                    value={formData.tanggalLahir}
                    onChange={(e) => handleChange('tanggalLahir', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Agama</label>
                  <select
                    value={formData.agama}
                    onChange={(e) => handleChange('agama', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="Islam">Islam</option>
                    <option value="Kristen Protestan">Kristen Protestan</option>
                    <option value="Katolik">Katolik</option>
                    <option value="Hindu">Hindu</option>
                    <option value="Buddha">Buddha</option>
                    <option value="Konghucu">Konghucu</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kewarganegaraan</label>
                  <input
                    type="text"
                    value={formData.kewarganegaraan}
                    onChange={(e) => handleChange('kewarganegaraan', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Anak Ke- / Jumlah Saudara</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={1}
                      placeholder="Ke-"
                      value={formData.anakKe}
                      onChange={(e) => handleChange('anakKe', e.target.value)}
                      className="w-1/2 p-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                    />
                    <input
                      type="number"
                      min={0}
                      placeholder="Jml Sdr"
                      value={formData.jumlahSaudaraKandung}
                      onChange={(e) => handleChange('jumlahSaudaraKandung', e.target.value)}
                      className="w-1/2 p-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Golongan Darah</label>
                  <select
                    value={formData.golonganDarah}
                    onChange={(e) => handleChange('golonganDarah', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="AB">AB</option>
                    <option value="O">O</option>
                    <option value="-">- (Belum Tahu)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: ROMBEL & ASAL SEKOLAH */}
          {activeStep === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status Keaktifan</label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="AKTIF">AKTIF</option>
                    <option value="MUTASI_KELUAR">MUTASI_KELUAR</option>
                    <option value="LULUS">LULUS</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tingkat Kelas</label>
                  <select
                    value={formData.tingkat}
                    onChange={(e) => handleChange('tingkat', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="VII">Tingkat VII (7)</option>
                    <option value="VIII">Tingkat VIII (8)</option>
                    <option value="IX">Tingkat IX (9)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Rombongan Belajar (Rombel)</label>
                  <input
                    type="text"
                    placeholder="Contoh: 7A, 7B, 8C, 9A"
                    value={formData.rombel}
                    onChange={(e) => handleChange('rombel', e.target.value.toUpperCase())}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jalur PPDB Penerimaan</label>
                  <select
                    value={formData.jalurPenerimaan}
                    onChange={(e) => handleChange('jalurPenerimaan', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="Zonasi">Zonasi</option>
                    <option value="Prestasi Akademik">Prestasi Akademik</option>
                    <option value="Prestasi Non-Akademik">Prestasi Non-Akademik</option>
                    <option value="Afirmasi">Afirmasi</option>
                    <option value="Pindah Tugas Orang Tua">Pindah Tugas Orang Tua</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Nama Asal SD / MI</label>
                  <input
                    type="text"
                    placeholder="Contoh: SDN Utan Kayu Utara 01 Pagi"
                    value={formData.namaSd}
                    onChange={(e) => handleChange('namaSd', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">NPSN SD Asal</label>
                  <input
                    type="text"
                    placeholder="Contoh: 20108392"
                    value={formData.npsnSd}
                    onChange={(e) => handleChange('npsnSd', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tahun Lulus SD</label>
                  <input
                    type="text"
                    placeholder="Contoh: 2024"
                    value={formData.tahunLulusSd}
                    onChange={(e) => handleChange('tahunLulusSd', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nomor Seri Ijazah SD</label>
                  <input
                    type="text"
                    placeholder="DN-01/D-SD/24/..."
                    value={formData.noIjazahSd}
                    onChange={(e) => handleChange('noIjazahSd', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal Diterima di SMPN 99</label>
                  <input
                    type="date"
                    value={formData.tanggalDiterima}
                    onChange={(e) => handleChange('tanggalDiterima', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: ORANG TUA / WALI */}
          {activeStep === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Data Ayah */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                  <span className="font-bold text-slate-900 block text-xs border-b pb-1">Ayah Kandung</span>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Nama Lengkap Ayah</label>
                    <input
                      type="text"
                      value={formData.namaAyah}
                      onChange={(e) => handleChange('namaAyah', e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Pekerjaan</label>
                    <input
                      type="text"
                      value={formData.pekerjaanAyah}
                      onChange={(e) => handleChange('pekerjaanAyah', e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">No. Telepon / WA Ayah</label>
                    <input
                      type="text"
                      value={formData.noHpAyah}
                      onChange={(e) => handleChange('noHpAyah', e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Data Ibu */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                  <span className="font-bold text-slate-900 block text-xs border-b pb-1">Ibu Kandung</span>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Nama Lengkap Ibu</label>
                    <input
                      type="text"
                      value={formData.namaIbu}
                      onChange={(e) => handleChange('namaIbu', e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Pekerjaan</label>
                    <input
                      type="text"
                      value={formData.pekerjaanIbu}
                      onChange={(e) => handleChange('pekerjaanIbu', e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">No. Telepon / WA Ibu</label>
                    <input
                      type="text"
                      value={formData.noHpIbu}
                      onChange={(e) => handleChange('noHpIbu', e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Data Wali (Opsional) */}
                <div className="sm:col-span-2 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                  <span className="font-bold text-slate-900 block text-xs border-b pb-1">
                    Wali Siswa (Opsional / Jika tidak tinggal bersama Orang Tua)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Nama Wali</label>
                      <input
                        type="text"
                        value={formData.namaWali}
                        onChange={(e) => handleChange('namaWali', e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Hubungan Keluarga</label>
                      <input
                        type="text"
                        placeholder="Paman / Kakek / dll"
                        value={formData.hubunganWali}
                        onChange={(e) => handleChange('hubunganWali', e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">No. HP Wali</label>
                      <input
                        type="text"
                        value={formData.noHpWali}
                        onChange={(e) => handleChange('noHpWali', e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white font-mono focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: ALAMAT & KONTAK */}
          {activeStep === 4 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Alamat Jalan & Nomor Rumah
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Jl. Utan Kayu Raya No. 45"
                    value={formData.alamatJalan}
                    onChange={(e) => handleChange('alamatJalan', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">RT / RW</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="RT"
                      value={formData.rt}
                      onChange={(e) => handleChange('rt', e.target.value)}
                      className="w-1/2 p-2 border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:border-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="RW"
                      value={formData.rw}
                      onChange={(e) => handleChange('rw', e.target.value)}
                      className="w-1/2 p-2 border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kelurahan</label>
                  <input
                    type="text"
                    value={formData.kelurahan}
                    onChange={(e) => handleChange('kelurahan', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kecamatan</label>
                  <input
                    type="text"
                    value={formData.kecamatan}
                    onChange={(e) => handleChange('kecamatan', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kota / Kabupaten</label>
                  <input
                    type="text"
                    value={formData.kotaKabupaten}
                    onChange={(e) => handleChange('kotaKabupaten', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tinggal Bersama</label>
                  <select
                    value={formData.tinggalDengan}
                    onChange={(e) => handleChange('tinggalDengan', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="Orang Tua">Orang Tua</option>
                    <option value="Wali">Wali</option>
                    <option value="Asrama">Asrama</option>
                    <option value="Kost">Kost</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Transportasi ke Sekolah</label>
                  <select
                    value={formData.transportasi}
                    onChange={(e) => handleChange('transportasi', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="Jalan Kaki">Jalan Kaki</option>
                    <option value="Sepeda">Sepeda</option>
                    <option value="Sepeda Motor">Sepeda Motor</option>
                    <option value="Angkutan Umum">Angkutan Umum</option>
                    <option value="Ojek Online">Ojek Online</option>
                    <option value="Kendaraan Pribadi">Kendaraan Pribadi</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">No. Handphone Siswa</label>
                  <input
                    type="text"
                    placeholder="0812..."
                    value={formData.noHpSiswa}
                    onChange={(e) => handleChange('noHpSiswa', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Submit Actions Row */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {activeStep > 1 && (
                <button
                  type="button"
                  onClick={() => setActiveStep((prev) => prev - 1)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium"
                >
                  Kembali
                </button>
              )}
              {activeStep < 4 && (
                <button
                  type="button"
                  onClick={() => setActiveStep((prev) => prev + 1)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium"
                >
                  Lanjut ke Langkah {activeStep + 1}
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isEditing ? 'Simpan Perubahan' : 'Simpan ke Buku Induk'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
