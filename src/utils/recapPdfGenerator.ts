import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BukuIndukSettings, Student, UserRole } from '../types';
import { DEFAULT_LOGO_SMPN99 } from '../data/defaultSettings';
import {
  getFormattedPrintDate,
  resolveSignatureSlot,
  resolveWaliKelasForStudent,
} from './printHelpers';

export interface RecapReportScope {
  tingkat: string;
  rombel: string;
  status: string;
}

const compareRombel = (a: string, b: string) =>
  a.localeCompare(b, 'id', { numeric: true, sensitivity: 'base' });

async function loadImageAsPngDataUrl(src?: string): Promise<string | null> {
  if (!src) return null;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const size = 240;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        const ratio = Math.min(size / (img.width || size), size / (img.height || size));
        const drawW = (img.width || size) * ratio;
        const drawH = (img.height || size) * ratio;
        const offsetX = (size - drawW) / 2;
        const offsetY = (size - drawH) / 2;
        ctx.clearRect(0, 0, size, size);
        ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export async function generateRecapStudentsPdf(params: {
  students: Student[];
  settings: BukuIndukSettings;
  scope: RecapReportScope;
  operator?: { name: string; email: string; role: UserRole };
}): Promise<{ fileName: string; totalIncluded: number }> {
  const { students, settings, scope } = params;

  const filtered = [...students]
    .filter((s) => {
      if (scope.tingkat !== 'ALL' && s.tingkat !== scope.tingkat) return false;
      if (scope.rombel !== 'ALL' && s.rombel !== scope.rombel) return false;
      if (scope.status !== 'ALL' && s.status !== scope.status) return false;
      return true;
    })
    .sort((a, b) => {
      const rDiff = compareRombel(a.rombel || '', b.rombel || '');
      if (rDiff !== 0) return rDiff;
      const numA = a.nomorUrutPresensi ?? Number.MAX_SAFE_INTEGER;
      const numB = b.nomorUrutPresensi ?? Number.MAX_SAFE_INTEGER;
      if (numA !== numB) return numA - numB;
      return a.namaLengkap.localeCompare(b.namaLengkap, 'id');
    });

  // Respect page size & margin settings from Pengaturan Cetak & KOP
  const paperFormat: string | [number, number] =
    settings.tataLetak.ukuranKertas === 'F4'
      ? [215, 330]
      : settings.tataLetak.ukuranKertas === 'Legal'
      ? 'legal'
      : 'a4';

  const marginMm =
    settings.tataLetak.margin === 'RAPAT'
      ? 10
      : settings.tataLetak.margin === 'LEBAR'
      ? 18
      : 14;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: paperFormat,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - marginMm * 2;
  let cursorY = marginMm;

  // =========================================================================
  // 1. KOP SURAT RESMI SESUAI PENGATURAN
  // =========================================================================
  if (settings.tampilkanKopSurat) {
    const [dinasPng, sekolahPng] = await Promise.all([
      settings.tampilkanLogoDinas && settings.logoDinasUrl
        ? loadImageAsPngDataUrl(settings.logoDinasUrl)
        : Promise.resolve(null),
      settings.tampilkanLogoSekolah
        ? loadImageAsPngDataUrl(settings.logoSekolahUrl || DEFAULT_LOGO_SMPN99)
        : Promise.resolve(null),
    ]);

    const logoMm = Math.min(22, Math.max(13, (settings.ukuranLogoPx || 56) * 0.28));
    const headerStartY = cursorY;

    if (dinasPng) {
      doc.addImage(dinasPng, 'PNG', marginMm, headerStartY + 1, logoMm, logoMm);
    }
    if (sekolahPng) {
      doc.addImage(
        sekolahPng,
        'PNG',
        pageWidth - marginMm - logoMm,
        headerStartY + 1,
        logoMm,
        logoMm
      );
    }

    const centerX = pageWidth / 2;
    const maxTextWidth = contentWidth - logoMm * 2 - 8;
    let textY = headerStartY + 4;

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text((settings.headerKopBaris1 || '').toUpperCase(), centerX, textY, {
      align: 'center',
      maxWidth: maxTextWidth,
    });
    textY += 4;

    doc.setFontSize(9.5);
    doc.text((settings.headerKopBaris2 || '').toUpperCase(), centerX, textY, {
      align: 'center',
      maxWidth: maxTextWidth,
    });
    textY += 4.6;

    doc.setFontSize(11.5);
    doc.text((settings.headerKopBaris3 || '').toUpperCase(), centerX, textY, {
      align: 'center',
      maxWidth: maxTextWidth,
    });
    textY += 4.2;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.8);
    doc.setTextColor(51, 65, 85);
    doc.text(settings.headerKopAlamat || '', centerX, textY, {
      align: 'center',
      maxWidth: maxTextWidth,
    });
    textY += 3.5;

    doc.text(settings.headerKopKontak || '', centerX, textY, {
      align: 'center',
      maxWidth: maxTextWidth,
    });
    textY += 3;

    const kopBottomY = Math.max(textY, headerStartY + logoMm + 3);
    doc.setDrawColor(0, 0, 0);

    if (settings.gayaGarisKop === 'GANDA') {
      doc.setLineWidth(0.75);
      doc.line(marginMm, kopBottomY, pageWidth - marginMm, kopBottomY);
      doc.setLineWidth(0.25);
      doc.line(marginMm, kopBottomY + 1, pageWidth - marginMm, kopBottomY + 1);
      cursorY = kopBottomY + 5;
    } else if (settings.gayaGarisKop === 'TUNGGAL') {
      doc.setLineWidth(0.55);
      doc.line(marginMm, kopBottomY, pageWidth - marginMm, kopBottomY);
      cursorY = kopBottomY + 4.5;
    } else {
      cursorY = kopBottomY + 3.5;
    }
  }

  // =========================================================================
  // 2. JUDUL LAPORAN & PARAMETER CAKUPAN
  // =========================================================================
  const formattedDate = getFormattedPrintDate(settings);
  const scopeParts: string[] = [];
  scopeParts.push(scope.tingkat === 'ALL' ? 'Semua Tingkat' : `Tingkat ${scope.tingkat}`);
  scopeParts.push(scope.rombel === 'ALL' ? 'Semua Rombel' : `Kelas ${scope.rombel}`);
  scopeParts.push(
    scope.status === 'ALL' ? 'Semua Status' : `Status ${scope.status.replace(/_/g, ' ')}`
  );

  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('LAPORAN REKAPITULASI DATA INDUK PESERTA DIDIK', pageWidth / 2, cursorY, {
    align: 'center',
  });
  cursorY += 4.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Tahun Ajaran ${settings.tahunAjaranAktif} (${settings.semesterAktif}) · Cakupan: ${scopeParts.join(
      ' · '
    )}`,
    pageWidth / 2,
    cursorY,
    { align: 'center' }
  );
  cursorY += 5.5;

  // =========================================================================
  // 3. TABEL A: RINGKASAN STATISTIK UTAMA
  // =========================================================================
  const total = filtered.length;
  const aktif = filtered.filter((s) => s.status === 'AKTIF').length;
  const mutasi = filtered.filter((s) => s.status === 'MUTASI_KELUAR').length;
  const lulus = filtered.filter((s) => s.status === 'LULUS').length;
  const laki = filtered.filter((s) => s.jenisKelamin === 'L').length;
  const perempuan = filtered.filter((s) => s.jenisKelamin === 'P').length;
  const docsComplete = filtered.filter(
    (s) =>
      s.dokumen &&
      s.dokumen.length >= 3 &&
      s.dokumen.every((d) => d.statusVerifikasi === 'TERVERIFIKASI')
  ).length;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('A. Ringkasan Statistik Peserta Didik', marginMm, cursorY);
  cursorY += 2;

  autoTable(doc, {
    startY: cursorY,
    margin: { left: marginMm, right: marginMm },
    theme: 'grid',
    head: [
      [
        'Total Siswa',
        'Aktif',
        'Mutasi Keluar',
        'Lulus',
        'Laki-Laki (L)',
        'Perempuan (P)',
        'Berkas Lengkap',
      ],
    ],
    body: [
      [
        `${total} siswa`,
        `${aktif}`,
        `${mutasi}`,
        `${lulus}`,
        `${laki} (${total ? Math.round((laki / total) * 100) : 0}%)`,
        `${perempuan} (${total ? Math.round((perempuan / total) * 100) : 0}%)`,
        `${docsComplete}/${total}`,
      ],
    ],
    styles: {
      fontSize: 8,
      cellPadding: 2,
      halign: 'center',
      textColor: [15, 23, 42],
      lineColor: [203, 213, 225],
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
  });

  cursorY = ((doc as any).lastAutoTable?.finalY ?? cursorY + 14) + 5;

  // =========================================================================
  // 4. TABEL B: REKAPITULASI PER ROMBONGAN BELAJAR
  // =========================================================================
  const rombelMap = new Map<string, Student[]>();
  filtered.forEach((s) => {
    const key = s.rombel || '-';
    const list = rombelMap.get(key) || [];
    list.push(s);
    rombelMap.set(key, list);
  });

  const rombelRows = Array.from(rombelMap.entries())
    .sort(([a], [b]) => compareRombel(a, b))
    .map(([rombel, list], idx) => {
      const wali = resolveWaliKelasForStudent(settings, list[0]);
      const lCount = list.filter((s) => s.jenisKelamin === 'L').length;
      const pCount = list.filter((s) => s.jenisKelamin === 'P').length;
      const aktifCount = list.filter((s) => s.status === 'AKTIF').length;
      const otherCount = list.length - aktifCount;
      return [
        String(idx + 1),
        rombel,
        list[0]?.tingkat || '-',
        wali.nama,
        String(lCount),
        String(pCount),
        String(aktifCount),
        String(otherCount),
        String(list.length),
      ];
    });

  if (rombelRows.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('B. Rekapitulasi per Rombongan Belajar (Rombel)', marginMm, cursorY);
    cursorY += 2;

    autoTable(doc, {
      startY: cursorY,
      margin: { left: marginMm, right: marginMm },
      theme: 'grid',
      head: [
        ['No', 'Rombel', 'Tingkat', 'Wali Kelas', 'L', 'P', 'Aktif', 'Mutasi/Lulus', 'Total'],
      ],
      body: rombelRows,
      styles: {
        fontSize: 7.8,
        cellPadding: 1.8,
        textColor: [15, 23, 42],
        lineColor: [203, 213, 225],
      },
      headStyles: {
        fillColor: [241, 245, 249],
        textColor: [15, 23, 42],
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 9 },
        1: { halign: 'center', cellWidth: 16, fontStyle: 'bold' },
        2: { halign: 'center', cellWidth: 15 },
        4: { halign: 'center', cellWidth: 10 },
        5: { halign: 'center', cellWidth: 10 },
        6: { halign: 'center', cellWidth: 12 },
        7: { halign: 'center', cellWidth: 20 },
        8: { halign: 'center', cellWidth: 12, fontStyle: 'bold' },
      },
    });

    cursorY = ((doc as any).lastAutoTable?.finalY ?? cursorY + 20) + 5;
  }

  // =========================================================================
  // 5. TABEL C: DAFTAR PESERTA DIDIK
  // =========================================================================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('C. Daftar Rekapitulasi Data Siswa', marginMm, cursorY);
  cursorY += 2;

  const studentRows = filtered.map((s, idx) => {
    const verifiedCount =
      s.dokumen?.filter((d) => d.statusVerifikasi === 'TERVERIFIKASI').length || 0;
    const totalDocs = s.dokumen?.length || 0;
    return [
      String(idx + 1),
      `${s.nis}\n${s.nisn}`,
      s.namaLengkap,
      s.jenisKelamin,
      s.rombel,
      s.sekolahAsal?.namaSd || '-',
      `${verifiedCount}/${totalDocs}`,
      s.status.replace(/_/g, ' '),
    ];
  });

  autoTable(doc, {
    startY: cursorY,
    margin: { left: marginMm, right: marginMm },
    theme: 'grid',
    head: [
      ['No', 'NIS / NISN', 'Nama Lengkap Siswa', 'L/P', 'Rombel', 'Asal SD', 'Berkas', 'Status'],
    ],
    body:
      studentRows.length > 0
        ? studentRows
        : [['-', '-', 'Tidak ada data siswa pada filter terpilih', '-', '-', '-', '-', '-']],
    styles: {
      fontSize: 7.5,
      cellPadding: 1.8,
      textColor: [15, 23, 42],
      lineColor: [203, 213, 225],
      valign: 'middle',
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 9 },
      1: { cellWidth: 26, font: 'courier' },
      3: { halign: 'center', cellWidth: 10 },
      4: { halign: 'center', cellWidth: 15, fontStyle: 'bold' },
      6: { halign: 'center', cellWidth: 14 },
      7: { halign: 'center', cellWidth: 22 },
    },
  });

  cursorY = ((doc as any).lastAutoTable?.finalY ?? cursorY + 25) + 8;

  // =========================================================================
  // 6. BLOK TANDA TANGAN RESMI SESUAI PENGATURAN
  // =========================================================================
  const sigKiri = resolveSignatureSlot(settings.tandaTangan.kiri, settings, filtered[0]);
  const sigKanan = resolveSignatureSlot(settings.tandaTangan.kanan, settings, filtered[0]);
  const showMiddlePengawas =
    settings.tandaTangan.tampilkanTengahPengawas || settings.tataLetak.tampilkanPengawasPemeriksa;

  if (cursorY + 42 > pageHeight - marginMm) {
    doc.addPage();
    cursorY = marginMm + 4;
  }

  const drawSignatureColumn = (
    xCenter: number,
    line1: string,
    jabatan: string,
    nama: string,
    nip?: string,
    showNip = true
  ) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.2);
    doc.setTextColor(71, 85, 105);
    doc.text(line1 || ' ', xCenter, cursorY, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(jabatan, xCenter, cursorY + 4.2, { align: 'center' });

    const nameY = cursorY + 22;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(nama, xCenter, nameY, { align: 'center' });

    if (showNip && nip) {
      doc.setFont('courier', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      const formattedNip =
        nip.startsWith('NIS') || nip.startsWith('NIP') ? nip : `NIP. ${nip}`;
      doc.text(formattedNip, xCenter, nameY + 3.8, { align: 'center' });
    }
  };

  const colCount =
    (sigKiri.tampilkan ? 1 : 0) +
    (showMiddlePengawas ? 1 : 0) +
    (sigKanan.tampilkan ? 1 : 0);

  if (colCount === 3) {
    const col1X = marginMm + contentWidth * 0.16;
    const col2X = marginMm + contentWidth * 0.5;
    const col3X = marginMm + contentWidth * 0.84;
    drawSignatureColumn(
      col1X,
      sigKiri.headerLine1,
      sigKiri.labelJabatan,
      sigKiri.nama,
      sigKiri.nip,
      sigKiri.tampilkanNip
    );
    drawSignatureColumn(
      col2X,
      'Diperiksa oleh,',
      'Pengawas Pembina',
      settings.namaPengawas,
      settings.nipPengawas,
      true
    );
    drawSignatureColumn(
      col3X,
      sigKanan.headerLine1,
      sigKanan.labelJabatan,
      sigKanan.nama,
      sigKanan.nip,
      sigKanan.tampilkanNip
    );
  } else {
    if (sigKiri.tampilkan) {
      drawSignatureColumn(
        marginMm + contentWidth * 0.22,
        sigKiri.headerLine1,
        sigKiri.labelJabatan,
        sigKiri.nama,
        sigKiri.nip,
        sigKiri.tampilkanNip
      );
    }
    if (sigKanan.tampilkan) {
      drawSignatureColumn(
        marginMm + contentWidth * 0.78,
        sigKanan.headerLine1,
        sigKanan.labelJabatan,
        sigKanan.nama,
        sigKanan.nip,
        sigKanan.tampilkanNip
      );
    } else if (showMiddlePengawas) {
      drawSignatureColumn(
        marginMm + contentWidth * 0.78,
        'Diperiksa oleh,',
        'Pengawas Pembina',
        settings.namaPengawas,
        settings.nipPengawas,
        true
      );
    }
  }

  // Footer note with print date
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Buku Induk Digital SMP Negeri 99 Jakarta (NPSN 20103565) · Dicetak ${settings.kotaTitimangsa || 'Jakarta'}, ${formattedDate}`,
      marginMm,
      pageHeight - 6
    );
    doc.text(`Halaman ${p} / ${totalPages}`, pageWidth - marginMm, pageHeight - 6, {
      align: 'right',
    });
  }

  const scopeSlug =
    scope.rombel !== 'ALL'
      ? `_Kelas_${scope.rombel}`
      : scope.tingkat !== 'ALL'
      ? `_Tingkat_${scope.tingkat}`
      : '';
  const fileName = `Rekapitulasi_Siswa_SMPN99${scopeSlug}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);

  return { fileName, totalIncluded: filtered.length };
}
