import { BukuIndukSettings, SignatureSlotConfig, Student, WaliKelasConfig } from '../types';

export interface ResolvedSignature {
  tampilkan: boolean;
  headerLine1: string; // e.g., "Jakarta, 20 Desember 2024" or "Mengetahui,"
  labelJabatan: string;
  nama: string;
  nip: string;
  tampilkanNip: boolean;
  tampilkanStempelArea: boolean;
}

export function getFormattedPrintDate(settings: BukuIndukSettings): string {
  if (settings.tanggalCetakMode === 'KUSTOM' && settings.tanggalCetakKustom.trim()) {
    return settings.tanggalCetakKustom.trim();
  }
  return new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function resolveWaliKelasForStudent(
  settings: BukuIndukSettings,
  student?: Student,
  fallbackWali?: { nama: string; nip?: string }
): WaliKelasConfig {
  if (student?.rombel) {
    const found = settings.daftarWaliKelas.find(
      (w) => w.rombel.trim().toLowerCase() === student.rombel.trim().toLowerCase()
    );
    if (found) return found;
  }
  if (fallbackWali?.nama) {
    return {
      rombel: student?.rombel || '-',
      nama: fallbackWali.nama,
      nip: fallbackWali.nip || '-',
    };
  }
  return (
    settings.daftarWaliKelas[0] || {
      rombel: student?.rombel || '7A',
      nama: 'Hj. Ratna Dewi, M.Pd.',
      nip: '19790415 200604 2 012',
    }
  );
}

export function resolveSignatureSlot(
  slot: SignatureSlotConfig,
  settings: BukuIndukSettings,
  student?: Student,
  fallbackWali?: { nama: string; nip?: string }
): ResolvedSignature {
  const formattedDate = getFormattedPrintDate(settings);
  const headerLine1 = slot.gunakanTitimangsa
    ? `${settings.kotaTitimangsa || 'Jakarta'}, ${formattedDate}`
    : slot.teksAtas || '';

  const wali = resolveWaliKelasForStudent(settings, student, fallbackWali);

  let nama = slot.namaKustom || '-';
  let nip = slot.nipKustom || '-';
  let labelJabatan = slot.labelJabatan || '';

  switch (slot.jabatanPreset) {
    case 'WALI_KELAS':
      nama = wali.nama;
      nip = wali.nip;
      if (!labelJabatan) labelJabatan = `Wali Kelas ${student?.rombel || ''}`.trim();
      else if (labelJabatan === 'Wali Kelas' && student?.rombel) {
        labelJabatan = `Wali Kelas ${student.rombel}`;
      }
      break;
    case 'KEPALA_SEKOLAH':
      nama = settings.kepalaSekolah;
      nip = settings.nipKepalaSekolah;
      if (!labelJabatan) labelJabatan = 'Kepala SMPN 99 Jakarta';
      break;
    case 'KEPALA_TU':
      nama = settings.kepalaTu;
      nip = settings.nipKepalaTu;
      if (!labelJabatan) labelJabatan = 'Kepala Urusan Tata Usaha';
      break;
    case 'PENGAWAS':
      nama = settings.namaPengawas;
      nip = settings.nipPengawas;
      if (!labelJabatan) labelJabatan = 'Pengawas Pembina / Pemeriksa';
      break;
    case 'ORANG_TUA':
      nama = student?.ayah?.nama || student?.ibu?.nama || '( ........................................ )';
      nip = '';
      if (!labelJabatan) labelJabatan = 'Orang Tua / Wali Murid';
      break;
    case 'PESERTA_DIDIK':
      nama = student?.namaLengkap || '( ........................................ )';
      nip = student?.nis ? `NIS. ${student.nis}` : '';
      if (!labelJabatan) labelJabatan = 'Peserta Didik';
      break;
    case 'KUSTOM':
    default:
      nama = slot.namaKustom || '( ........................................ )';
      nip = slot.nipKustom || '';
      if (!labelJabatan) labelJabatan = 'Pejabat Penandatangan';
      break;
  }

  return {
    tampilkan: slot.tampilkan,
    headerLine1,
    labelJabatan,
    nama,
    nip,
    tampilkanNip: slot.tampilkanNip && Boolean(nip),
    tampilkanStempelArea: slot.tampilkanStempelArea,
  };
}
