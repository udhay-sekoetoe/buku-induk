import * as XLSX from 'xlsx';
import {
  BukuIndukSettings,
  MapelConfigItem,
  Student,
  StudentStatus,
  TingkatKelas,
  Agama,
  JalurPenerimaan,
} from '../types';
import { generateDefaultSemesterGrades } from '../data/defaultGrades';

export interface ExcelExportOptions {
  students: Student[];
  settings: BukuIndukSettings;
  filterTingkat: 'ALL' | TingkatKelas;
  filterRombel: string; // 'ALL' | '7A' | ...
  filterStatus: 'ALL' | StudentStatus;
  semesterScope: 'REKAP_S1_S6' | number;
  includeSections: {
    orangTua: boolean;
    sekolahAsal: boolean;
    nilaiMapel: boolean;
    rekapRombel: boolean;
    pengaturanMapel: boolean;
  };
  mapelList: MapelConfigItem[];
}

export interface StagedImportRow {
  rowNum: number;
  nis: string;
  nisn: string;
  nik: string;
  namaLengkap: string;
  jenisKelamin: 'L' | 'P';
  tingkat: TingkatKelas;
  rombel: string;
  tempatLahir: string;
  tanggalLahir: string;
  agama: Agama;
  statusSiswa: StudentStatus;
  statusKlasifikasi: 'NEW' | 'CONFLICT' | 'ERROR';
  pesanValidasi: string;
  matchedExistingId?: string;
  rawStudent: Omit<Student, 'id' | 'createdAt' | 'updatedAt' | 'updatedBy'>;
}

const VALID_AGAMA: Agama[] = [
  'Islam',
  'Kristen Protestan',
  'Katolik',
  'Hindu',
  'Buddha',
  'Konghucu',
  'Lainnya',
];

function normalizeAgama(val: string): Agama {
  const clean = val.trim().toLowerCase();
  if (!clean) return 'Islam';
  if (clean.includes('kristen') || clean.includes('protestan')) return 'Kristen Protestan';
  if (clean.includes('katolik')) return 'Katolik';
  if (clean.includes('hindu')) return 'Hindu';
  if (clean.includes('budd')) return 'Buddha';
  if (clean.includes('kong')) return 'Konghucu';
  const matched = VALID_AGAMA.find((a) => a.toLowerCase() === clean);
  return matched || 'Islam';
}

function normalizeTingkat(val: string, rombelFallback?: string): TingkatKelas {
  const clean = `${val || ''} ${rombelFallback || ''}`.toUpperCase();
  if (clean.includes('IX') || /\b9[A-Z0-9]*\b/.test(clean) || clean.includes('KELAS 9')) return 'IX';
  if (clean.includes('VIII') || /\b8[A-Z0-9]*\b/.test(clean) || clean.includes('KELAS 8')) return 'VIII';
  return 'VII';
}

function normalizeStatus(val: string): StudentStatus {
  const clean = val.trim().toUpperCase();
  if (clean.includes('LULUS')) return 'LULUS';
  if (clean.includes('MUTASI') || clean.includes('PINDAH') || clean.includes('KELUAR')) return 'MUTASI_KELUAR';
  if (clean.includes('DIKELUARKAN')) return 'DIKELUARKAN';
  return 'AKTIF';
}

function normalizeJalur(val: string): JalurPenerimaan {
  const clean = val.trim().toLowerCase();
  if (clean.includes('afirmasi')) return 'Afirmasi';
  if (clean.includes('non')) return 'Prestasi Non-Akademik';
  if (clean.includes('prestasi')) return 'Prestasi Akademik';
  if (clean.includes('pindah')) return 'Pindah Tugas Orang Tua';
  return 'Zonasi';
}

function normalizeExcelDate(raw: unknown): string {
  if (raw === null || raw === undefined || raw === '') return '2011-01-01';

  if (typeof raw === 'number' && !Number.isNaN(raw)) {
    // Excel serial number
    const parsed = XLSX.SSF.parse_date_code(raw);
    if (parsed && parsed.y && parsed.m && parsed.d) {
      const mm = String(parsed.m).padStart(2, '0');
      const dd = String(parsed.d).padStart(2, '0');
      return `${parsed.y}-${mm}-${dd}`;
    }
  }

  const str = String(raw).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

  // Handle DD/MM/YYYY or DD-MM-YYYY
  const dmy = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmy) {
    const dd = dmy[1].padStart(2, '0');
    const mm = dmy[2].padStart(2, '0');
    return `${dmy[3]}-${mm}-${dd}`;
  }

  const dateObj = new Date(str);
  if (!Number.isNaN(dateObj.getTime())) {
    return dateObj.toISOString().slice(0, 10);
  }
  return '2011-01-01';
}

function cleanStr(val: unknown): string {
  if (val === null || val === undefined) return '';
  return String(val).replace(/^'/, '').trim();
}

function computeColWidths(rows: unknown[][]): Array<{ wch: number }> {
  if (rows.length === 0) return [];
  const maxCols = rows.reduce((max, r) => Math.max(max, r.length), 0);
  const widths: Array<{ wch: number }> = [];
  for (let c = 0; c < maxCols; c++) {
    let maxLen = 10;
    for (let r = 0; r < Math.min(rows.length, 200); r++) {
      const cell = rows[r]?.[c];
      const len = cell !== null && cell !== undefined ? String(cell).length : 0;
      if (len > maxLen) maxLen = len;
    }
    widths.push({ wch: Math.min(42, Math.max(10, maxLen + 3)) });
  }
  return widths;
}

export function filterStudentsForExcel(
  students: Student[],
  filterTingkat: 'ALL' | TingkatKelas,
  filterRombel: string,
  filterStatus: 'ALL' | StudentStatus
): Student[] {
  const tingkatOrder: Record<TingkatKelas, number> = { VII: 1, VIII: 2, IX: 3 };
  return students
    .filter((s) => {
      if (filterTingkat !== 'ALL' && s.tingkat !== filterTingkat) return false;
      if (filterRombel !== 'ALL' && s.rombel !== filterRombel) return false;
      if (filterStatus !== 'ALL' && s.status !== filterStatus) return false;
      return true;
    })
    .sort((a, b) => {
      const tDiff = (tingkatOrder[a.tingkat] || 9) - (tingkatOrder[b.tingkat] || 9);
      if (tDiff !== 0) return tDiff;
      const rDiff = a.rombel.localeCompare(b.rombel, 'id');
      if (rDiff !== 0) return rDiff;
      return a.namaLengkap.localeCompare(b.namaLengkap, 'id');
    });
}

export function exportStudentsToXlsx(options: ExcelExportOptions): {
  fileName: string;
  exportedCount: number;
  sheetNames: string[];
} {
  const {
    students,
    settings,
    filterTingkat,
    filterRombel,
    filterStatus,
    semesterScope,
    includeSections,
    mapelList,
  } = options;

  const filtered = filterStudentsForExcel(students, filterTingkat, filterRombel, filterStatus);
  const wb = XLSX.utils.book_new();
  const sheetNames: string[] = [];

  const filterDesc = [
    `Tingkat: ${filterTingkat === 'ALL' ? 'Semua (VII-IX)' : `Kelas ${filterTingkat}`}`,
    `Rombel: ${filterRombel === 'ALL' ? 'Semua Rombel' : filterRombel}`,
    `Status: ${filterStatus === 'ALL' ? 'Semua Status' : filterStatus}`,
  ].join(' | ');

  // =========================================================
  // SHEET 1: DATA_SISWA_DAPODIK
  // =========================================================
  const baseHeaders = [
    'No',
    'NIPD / NIS',
    'NISN',
    'NIK',
    'Nama Lengkap',
    'Nama Panggilan',
    'L/P',
    'Tempat Lahir',
    'Tanggal Lahir',
    'Agama',
    'Kewarganegaraan',
    'Tingkat',
    'Rombel Saat Ini',
    'Tahun Ajaran',
    'Status Siswa',
    'Alamat Jalan',
    'RT',
    'RW',
    'Kelurahan',
    'Kecamatan',
    'Kota/Kabupaten',
    'Kode Pos',
    'No HP Siswa',
  ];

  const ortuHeaders = includeSections.orangTua
    ? [
        'Nama Ayah',
        'NIK Ayah',
        'Pendidikan Ayah',
        'Pekerjaan Ayah',
        'No HP Ayah',
        'Nama Ibu',
        'NIK Ibu',
        'Pendidikan Ibu',
        'Pekerjaan Ibu',
        'No HP Ibu',
      ]
    : [];

  const asalHeaders = includeSections.sekolahAsal
    ? [
        'Asal SD/MI',
        'NPSN SD',
        'No Ijazah SD',
        'Tanggal Diterima',
        'Tingkat Awal',
        'Rombel Awal',
        'Jalur Masuk',
      ]
    : [];

  const sheet1Headers = [...baseHeaders, ...ortuHeaders, ...asalHeaders];

  const sheet1Banner: unknown[][] = [
    ['BUKU INDUK DIGITAL PESERTA DIDIK — SMP NEGERI 99 JAKARTA (NPSN: 20103565)'],
    [
      `Tahun Ajaran Aktif: ${settings.tahunAjaranAktif} (${settings.semesterAktif}) | ${filterDesc} | Total Data: ${filtered.length} Siswa`,
    ],
    [`Tanggal Ekspor: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}`],
    [],
    sheet1Headers,
  ];

  const sheet1Rows = filtered.map((s, idx) => {
    const baseCols: unknown[] = [
      idx + 1,
      String(s.nis || ''),
      String(s.nisn || ''),
      String(s.nik || ''),
      s.namaLengkap,
      s.namaPanggilan || '',
      s.jenisKelamin,
      s.tempatLahir || '',
      s.tanggalLahir || '',
      s.agama || 'Islam',
      s.kewarganegaraan || 'WNI',
      s.tingkat,
      s.rombel,
      s.tahunAjaranSekarang || settings.tahunAjaranAktif,
      s.status,
      s.alamatJalan || '',
      s.rt || '',
      s.rw || '',
      s.kelurahan || '',
      s.kecamatan || '',
      s.kotaKabupaten || '',
      s.kodePos || '',
      s.noHpSiswa || '',
    ];

    const ortuCols: unknown[] = includeSections.orangTua
      ? [
          s.ayah?.nama || '',
          s.ayah?.nik || '',
          s.ayah?.pendidikanTerakhir || '',
          s.ayah?.pekerjaan || '',
          s.ayah?.noHp || '',
          s.ibu?.nama || '',
          s.ibu?.nik || '',
          s.ibu?.pendidikanTerakhir || '',
          s.ibu?.pekerjaan || '',
          s.ibu?.noHp || '',
        ]
      : [];

    const asalCols: unknown[] = includeSections.sekolahAsal
      ? [
          s.sekolahAsal?.namaSd || '',
          s.sekolahAsal?.npsnSd || '',
          s.sekolahAsal?.noIjazahSd || '',
          s.penerimaan?.tanggalDiterima || '',
          s.penerimaan?.tingkatAwal || s.tingkat,
          s.penerimaan?.rombelAwal || s.rombel,
          s.penerimaan?.jalurPenerimaan || '',
        ]
      : [];

    return [...baseCols, ...ortuCols, ...asalCols];
  });

  const ws1Data = [...sheet1Banner, ...sheet1Rows];
  const ws1 = XLSX.utils.aoa_to_sheet(ws1Data);
  ws1['!cols'] = computeColWidths([sheet1Headers, ...sheet1Rows]);
  XLSX.utils.book_append_sheet(wb, ws1, 'Data_Siswa_Dapodik');
  sheetNames.push('Data_Siswa_Dapodik');

  // =========================================================
  // SHEET 2: REKAP_ROMBEL_EKSTERNAL
  // =========================================================
  if (includeSections.rekapRombel) {
    const rombelMap = new Map<
      string,
      {
        tingkat: TingkatKelas;
        rombel: string;
        l: number;
        p: number;
        aktif: number;
        mutasi: number;
        lulus: number;
        total: number;
      }
    >();

    filtered.forEach((s) => {
      const curr = rombelMap.get(s.rombel) || {
        tingkat: s.tingkat,
        rombel: s.rombel,
        l: 0,
        p: 0,
        aktif: 0,
        mutasi: 0,
        lulus: 0,
        total: 0,
      };
      if (s.jenisKelamin === 'L') curr.l++;
      else curr.p++;
      if (s.status === 'AKTIF') curr.aktif++;
      else if (s.status === 'MUTASI_KELUAR') curr.mutasi++;
      else if (s.status === 'LULUS') curr.lulus++;
      curr.total++;
      rombelMap.set(s.rombel, curr);
    });

    const waliLookup = new Map(settings.daftarWaliKelas.map((w) => [w.rombel, w]));
    const rekapHeaders = [
      'No',
      'Tingkat',
      'Rombel',
      'Wali Kelas',
      'NIP Wali Kelas',
      'Laki-Laki (L)',
      'Perempuan (P)',
      'Aktif',
      'Mutasi Keluar',
      'Lulus',
      'Total Siswa',
    ];

    const rekapEntries = Array.from(rombelMap.values()).sort((a, b) =>
      a.rombel.localeCompare(b.rombel, 'id')
    );

    const rekapRows = rekapEntries.map((item, idx) => {
      const wali = waliLookup.get(item.rombel);
      return [
        idx + 1,
        item.tingkat,
        item.rombel,
        wali?.nama || '-',
        wali?.nip || '-',
        item.l,
        item.p,
        item.aktif,
        item.mutasi,
        item.lulus,
        item.total,
      ];
    });

    const totalRow = [
      '',
      '',
      'TOTAL KESELURUHAN',
      '',
      '',
      rekapEntries.reduce((a, b) => a + b.l, 0),
      rekapEntries.reduce((a, b) => a + b.p, 0),
      rekapEntries.reduce((a, b) => a + b.aktif, 0),
      rekapEntries.reduce((a, b) => a + b.mutasi, 0),
      rekapEntries.reduce((a, b) => a + b.lulus, 0),
      rekapEntries.reduce((a, b) => a + b.total, 0),
    ];

    const ws2Data: unknown[][] = [
      ['REKAPITULASI PER ROMBEL — LAPORAN EKSTERNAL DAPODIK SMPN 99 JAKARTA'],
      [`Tahun Ajaran: ${settings.tahunAjaranAktif} (${settings.semesterAktif}) | ${filterDesc}`],
      [],
      rekapHeaders,
      ...rekapRows,
      totalRow,
    ];
    const ws2 = XLSX.utils.aoa_to_sheet(ws2Data);
    ws2['!cols'] = computeColWidths([rekapHeaders, ...rekapRows, totalRow]);
    XLSX.utils.book_append_sheet(wb, ws2, 'Rekap_Rombel_Eksternal');
    sheetNames.push('Rekap_Rombel_Eksternal');
  }

  // =========================================================
  // SHEET 3: NILAI_MAPEL_RAPOR
  // =========================================================
  if (includeSections.nilaiMapel) {
    const activeMapels = [...mapelList]
      .filter((m) => m.aktif)
      .sort((a, b) => a.urutan - b.urutan);

    if (semesterScope === 'REKAP_S1_S6') {
      const mapelHeaders = activeMapels.map((m) => `[${m.kodeDapodik}] ${m.nama} (Rata S1-S6)`);
      const headers = [
        'No',
        'NIS',
        'NISN',
        'Nama Lengkap',
        'Tingkat',
        'Rombel',
        'Rata S1',
        'Rata S2',
        'Rata S3',
        'Rata S4',
        'Rata S5',
        'Rata S6',
        'Rata-Rata Akhir (S1-S6)',
        ...mapelHeaders,
      ];

      const rows = filtered.map((s, idx) => {
        const riwayat = s.riwayatNilai || generateDefaultSemesterGrades(s.namaLengkap, s.nis, 2024);
        const semAvgs: (number | string)[] = [];
        const numericAvgs: number[] = [];

        for (let sem = 1; sem <= 6; sem++) {
          const list = riwayat[sem]?.mataPelajaran || [];
          const activeScores = list
            .filter((m) => activeMapels.some((am) => am.nama === m.nama))
            .map((m) => m.nilaiAkhir || 0);
          if (activeScores.length > 0) {
            const avg = activeScores.reduce((a, b) => a + b, 0) / activeScores.length;
            semAvgs.push(Number(avg.toFixed(1)));
            numericAvgs.push(avg);
          } else {
            semAvgs.push('-');
          }
        }

        const grandAvg =
          numericAvgs.length > 0
            ? Number((numericAvgs.reduce((a, b) => a + b, 0) / numericAvgs.length).toFixed(1))
            : '-';

        const mapelAvgCols = activeMapels.map((mp) => {
          const vals: number[] = [];
          for (let sem = 1; sem <= 6; sem++) {
            const found = riwayat[sem]?.mataPelajaran.find((m) => m.nama === mp.nama);
            if (found && typeof found.nilaiAkhir === 'number') vals.push(found.nilaiAkhir);
          }
          if (vals.length === 0) return '';
          return Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1));
        });

        return [
          idx + 1,
          String(s.nis),
          String(s.nisn),
          s.namaLengkap,
          s.tingkat,
          s.rombel,
          ...semAvgs,
          grandAvg,
          ...mapelAvgCols,
        ];
      });

      const ws3Data: unknown[][] = [
        ['REKAPITULASI NILAI MATA PELAJARAN SEMESTER 1 S/D 6 (BERDASARKAN PENGATURAN MAPEL)'],
        [`Filter Aktif: ${filterDesc} | Mapel Aktif: ${activeMapels.length} Mata Pelajaran`],
        [],
        headers,
        ...rows,
      ];
      const ws3 = XLSX.utils.aoa_to_sheet(ws3Data);
      ws3['!cols'] = computeColWidths([headers, ...rows]);
      XLSX.utils.book_append_sheet(wb, ws3, 'Nilai_Mapel_Rapor');
      sheetNames.push('Nilai_Mapel_Rapor');
    } else {
      const semNum = semesterScope;
      const mapelHeaders = activeMapels.map((m) => `[${m.kodeDapodik}] ${m.nama}`);
      const headers = [
        'No',
        'NIS',
        'NISN',
        'Nama Lengkap',
        'Tingkat',
        'Rombel',
        'Semester',
        'Tahun Pelajaran',
        ...mapelHeaders,
        'Jumlah Nilai',
        'Rata-Rata',
        'Sakit',
        'Izin',
        'Tanpa Keterangan',
      ];

      const rows = filtered.map((s, idx) => {
        const riwayat = s.riwayatNilai || generateDefaultSemesterGrades(s.namaLengkap, s.nis, 2024);
        const rec = riwayat[semNum];

        const scores: (number | string)[] = activeMapels.map((mp) => {
          const found = rec?.mataPelajaran.find((m) => m.nama === mp.nama);
          return found ? found.nilaiAkhir : '';
        });

        const numericScores = scores.filter((v): v is number => typeof v === 'number');
        const total = numericScores.reduce((a, b) => a + b, 0);
        const avg = numericScores.length > 0 ? Number((total / numericScores.length).toFixed(1)) : 0;

        return [
          idx + 1,
          String(s.nis),
          String(s.nisn),
          s.namaLengkap,
          s.tingkat,
          s.rombel,
          `Sem ${semNum} (${rec?.semesterType || (semNum % 2 === 1 ? 'Ganjil' : 'Genap')})`,
          rec?.tahunPelajaran || settings.tahunAjaranAktif,
          ...scores,
          total,
          avg,
          rec?.ketidakhadiran?.sakit ?? 0,
          rec?.ketidakhadiran?.izin ?? 0,
          rec?.ketidakhadiran?.tanpaKeterangan ?? 0,
        ];
      });

      const ws3Data: unknown[][] = [
        [`LEGGER NILAI MATA PELAJARAN — SEMESTER ${semNum}`],
        [`Filter Aktif: ${filterDesc} | Mapel Aktif: ${activeMapels.length} Mata Pelajaran`],
        [],
        headers,
        ...rows,
      ];
      const ws3 = XLSX.utils.aoa_to_sheet(ws3Data);
      ws3['!cols'] = computeColWidths([headers, ...rows]);
      XLSX.utils.book_append_sheet(wb, ws3, 'Nilai_Mapel_Rapor');
      sheetNames.push('Nilai_Mapel_Rapor');
    }
  }

  // =========================================================
  // SHEET 4: PENGATURAN_MAPEL
  // =========================================================
  if (includeSections.pengaturanMapel) {
    const mapelHeaders = [
      'Urutan',
      'Kode Dapodik',
      'Nama Mata Pelajaran',
      'Kategori',
      'KKTP',
      'Status Ekspor',
    ];
    const sortedMapels = [...mapelList].sort((a, b) => a.urutan - b.urutan);
    const mapelRows = sortedMapels.map((m) => [
      m.urutan,
      m.kodeDapodik,
      m.nama,
      m.kategori,
      m.kktp,
      m.aktif ? 'AKTIF' : 'NONAKTIF',
    ]);
    const ws4Data: unknown[][] = [
      ['REFERENSI PENGATURAN MATA PELAJARAN & KKTP SMP NEGERI 99 JAKARTA'],
      [`Tahun Ajaran: ${settings.tahunAjaranAktif} (${settings.semesterAktif})`],
      [],
      mapelHeaders,
      ...mapelRows,
    ];
    const ws4 = XLSX.utils.aoa_to_sheet(ws4Data);
    ws4['!cols'] = computeColWidths([mapelHeaders, ...mapelRows]);
    XLSX.utils.book_append_sheet(wb, ws4, 'Pengaturan_Mapel');
    sheetNames.push('Pengaturan_Mapel');
  }

  const tingkatTag = filterTingkat === 'ALL' ? 'SemuaTingkat' : `Kls${filterTingkat}`;
  const rombelTag = filterRombel === 'ALL' ? 'SemuaRombel' : filterRombel;
  const dateTag = new Date().toISOString().slice(0, 10);
  const fileName = `BukuInduk_Dapodik_SMPN99_${tingkatTag}_${rombelTag}_${dateTag}.xlsx`;

  XLSX.writeFile(wb, fileName);

  return {
    fileName,
    exportedCount: filtered.length,
    sheetNames,
  };
}

export function downloadDapodikXlsxTemplate(mapelList: MapelConfigItem[]): string {
  const wb = XLSX.utils.book_new();

  const templateHeaders = [
    'NIS',
    'NISN',
    'NIK',
    'Nama Lengkap',
    'Nama Panggilan',
    'Jenis Kelamin (L/P)',
    'Tempat Lahir',
    'Tanggal Lahir (YYYY-MM-DD)',
    'Agama',
    'Tingkat (VII/VIII/IX)',
    'Rombel',
    'Status Siswa',
    'Nama Ayah',
    'Pekerjaan Ayah',
    'No HP Ayah',
    'Nama Ibu',
    'Pekerjaan Ibu',
    'No HP Ibu',
    'Alamat Jalan',
    'RT',
    'RW',
    'Kelurahan',
    'Kecamatan',
    'Kota/Kabupaten',
    'Kode Pos',
    'Asal SD',
    'NPSN SD',
    'Jalur Masuk',
  ];

  const sample1 = [
    '262707099',
    '0139876543',
    '3175011505130001',
    'MUHAMMAD RIZKY FIRMANSYAH',
    'Rizky',
    'L',
    'Jakarta',
    '2013-05-15',
    'Islam',
    'VII',
    '7D',
    'AKTIF',
    'Ahmad Firman',
    'Karyawan Swasta',
    '081234567800',
    'Siti Nurhaliza',
    'Ibu Rumah Tangga',
    '081234567801',
    'Jl. Utan Kayu Raya No. 10',
    '004',
    '008',
    'Utan Kayu Utara',
    'Matraman',
    'Jakarta Timur',
    '13120',
    'SDN Utan Kayu Utara 01',
    '20108392',
    'Zonasi',
  ];

  const sample2 = [
    '262708100',
    '0128765432',
    '3175011209120002',
    'NADIA SHAFIRA PUTRI',
    'Nadia',
    'P',
    'Jakarta',
    '2012-09-12',
    'Islam',
    'VIII',
    '8B',
    'AKTIF',
    'Bambang Suryono',
    'Wiraswasta',
    '081398765400',
    'Ratna Sari',
    'PNS',
    '081398765401',
    'Jl. Kayu Manis Barat No. 22',
    '002',
    '005',
    'Kayu Manis',
    'Matraman',
    'Jakarta Timur',
    '13130',
    'SDN Kayu Manis 01',
    '20108344',
    'Prestasi Akademik',
  ];

  const wsTemplate = XLSX.utils.aoa_to_sheet([templateHeaders, sample1, sample2]);
  wsTemplate['!cols'] = computeColWidths([templateHeaders, sample1, sample2]);
  XLSX.utils.book_append_sheet(wb, wsTemplate, 'Template_Impor_Siswa');

  const panduanRows: unknown[][] = [
    ['PANDUAN IMPOR EXCEL DAPODIK & BUKU INDUK SMP NEGERI 99 JAKARTA'],
    ['Kolom Wajib', 'NIS, NISN, dan Nama Lengkap wajib diisi untuk validasi duplikasi.'],
    ['Format Tanggal Lahir', 'Gunakan YYYY-MM-DD (contoh: 2013-05-15) atau sel tanggal Excel standar.'],
    ['Tingkat & Rombel', 'Tingkat: VII, VIII, atau IX. Rombel contoh: 7A, 7B, 8A, 9C.'],
    ['Status Siswa', 'AKTIF, MUTASI_KELUAR, atau LULUS.'],
    ['Kompatibilitas Dapodik', 'Sistem otomatis mengenali header file unduhan Peserta Didik Dapodik (.xlsx / .csv).'],
    [],
    ['DAFTAR KODE MAPEL AKTIF DI SISTEM'],
    ['Kode Dapodik', 'Nama Mata Pelajaran', 'Kategori', 'KKTP', 'Status'],
    ...mapelList
      .sort((a, b) => a.urutan - b.urutan)
      .map((m) => [m.kodeDapodik, m.nama, m.kategori, m.kktp, m.aktif ? 'AKTIF' : 'NONAKTIF']),
  ];
  const wsPanduan = XLSX.utils.aoa_to_sheet(panduanRows);
  wsPanduan['!cols'] = computeColWidths(panduanRows);
  XLSX.utils.book_append_sheet(wb, wsPanduan, 'Panduan_Dapodik_Mapel');

  const fileName = 'Template_Dapodik_Buku_Induk_SMPN99_Jakarta.xlsx';
  XLSX.writeFile(wb, fileName);
  return fileName;
}

export async function parseExcelOrCsvFile(
  file: File,
  existingStudents: Student[],
  settings: BukuIndukSettings
): Promise<{ rows: StagedImportRow[]; detectedSheet: string }> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });

  // Choose preferred sheet if multiple exist
  const preferredNames = ['Data_Siswa_Dapodik', 'Template_Impor_Siswa', 'Peserta Didik'];
  const detectedSheet =
    preferredNames.find((n) => wb.SheetNames.includes(n)) || wb.SheetNames[0];

  const ws = wb.Sheets[detectedSheet];
  if (!ws) {
    return { rows: [], detectedSheet: '' };
  }

  const rawMatrix = XLSX.utils.sheet_to_json<unknown[]>(ws, {
    header: 1,
    defval: '',
    raw: true,
  });

  if (rawMatrix.length === 0) {
    return { rows: [], detectedSheet };
  }

  // Auto-detect header row (handles Dapodik / Export banner rows at top)
  let headerRowIdx = 0;
  for (let i = 0; i < Math.min(rawMatrix.length, 15); i++) {
    const joined = (rawMatrix[i] || []).map((c) => cleanStr(c).toLowerCase()).join('|');
    if (
      (joined.includes('nama') && (joined.includes('nisn') || joined.includes('nis') || joined.includes('nipd'))) ||
      (joined.includes('nis') && joined.includes('rombel'))
    ) {
      headerRowIdx = i;
      break;
    }
  }

  const headers = (rawMatrix[headerRowIdx] || []).map((h) =>
    cleanStr(h)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
  );

  const findColIdx = (...aliases: string[]): number => {
    for (const alias of aliases) {
      const exact = headers.findIndex((h) => h === alias);
      if (exact !== -1) return exact;
    }
    for (const alias of aliases) {
      const partial = headers.findIndex((h) => h.includes(alias));
      if (partial !== -1) return partial;
    }
    return -1;
  };

  const colIdx = {
    nis: findColIdx('nipdnis', 'nis', 'nipd'),
    nisn: findColIdx('nisn'),
    nik: findColIdx('nik'),
    nama: findColIdx('namalengkap', 'namapesertadidik', 'nama'),
    panggilan: findColIdx('namapanggilan', 'panggilan'),
    jk: findColIdx('jeniskelaminlp', 'jeniskelamin', 'lp', 'jk'),
    tempatLahir: findColIdx('tempatlahir'),
    tanggalLahir: findColIdx('tanggallahiryyyyymmdd', 'tanggallahir', 'tgllahir'),
    agama: findColIdx('agama'),
    tingkat: findColIdx('tingkatviiviiiix', 'tingkatkelas', 'tingkat'),
    rombel: findColIdx('rombelsaatini', 'rombel', 'kelas'),
    status: findColIdx('statussiswa', 'status'),
    namaAyah: findColIdx('namaayah', 'ayah'),
    pekerjaanAyah: findColIdx('pekerjaanayah'),
    hpAyah: findColIdx('nohpayah', 'hpayah'),
    namaIbu: findColIdx('namaibu', 'ibu'),
    pekerjaanIbu: findColIdx('pekerjaanibu'),
    hpIbu: findColIdx('nohpibu', 'hpibu'),
    alamat: findColIdx('alamatjalan', 'alamat'),
    rt: findColIdx('rt'),
    rw: findColIdx('rw'),
    kelurahan: findColIdx('kelurahan', 'desa'),
    kecamatan: findColIdx('kecamatan'),
    kota: findColIdx('kotakabupaten', 'kota'),
    kodePos: findColIdx('kodepos'),
    noHpSiswa: findColIdx('nohpsiswa', 'hp'),
    asalSd: findColIdx('asalsdmi', 'asalsd', 'sekolahasal'),
    npsnSd: findColIdx('npsnsd'),
    jalur: findColIdx('jalurmasuk', 'jalurpenerimaan'),
  };

  const getCell = (row: unknown[], idx: number): unknown =>
    idx >= 0 && idx < row.length ? row[idx] : '';

  const staged: StagedImportRow[] = [];

  for (let r = headerRowIdx + 1; r < rawMatrix.length; r++) {
    const row = rawMatrix[r];
    if (!row || row.every((c) => cleanStr(c) === '')) continue;

    const nis = cleanStr(getCell(row, colIdx.nis));
    const nisn = cleanStr(getCell(row, colIdx.nisn));
    const nik = cleanStr(getCell(row, colIdx.nik));
    const nama = cleanStr(getCell(row, colIdx.nama));

    // Skip footer or non-student summary rows if any
    if (!nis && !nisn && !nama) continue;

    const panggilan = cleanStr(getCell(row, colIdx.panggilan)) || nama.split(' ')[0] || '';
    const jkRaw = cleanStr(getCell(row, colIdx.jk)).toUpperCase();
    const jk: 'L' | 'P' = jkRaw.startsWith('P') || jkRaw.includes('PEREMPUAN') ? 'P' : 'L';
    const tempatLahir = cleanStr(getCell(row, colIdx.tempatLahir)) || 'Jakarta';
    const tanggalLahir = normalizeExcelDate(getCell(row, colIdx.tanggalLahir));
    const agama = normalizeAgama(cleanStr(getCell(row, colIdx.agama)));
    const rombel = (cleanStr(getCell(row, colIdx.rombel)) || '7A').toUpperCase();
    const tingkat = normalizeTingkat(cleanStr(getCell(row, colIdx.tingkat)), rombel);
    const statusSiswa = normalizeStatus(cleanStr(getCell(row, colIdx.status)));

    const namaAyah = cleanStr(getCell(row, colIdx.namaAyah));
    const pekerjaanAyah = cleanStr(getCell(row, colIdx.pekerjaanAyah)) || 'Wiraswasta';
    const hpAyah = cleanStr(getCell(row, colIdx.hpAyah));
    const namaIbu = cleanStr(getCell(row, colIdx.namaIbu));
    const pekerjaanIbu = cleanStr(getCell(row, colIdx.pekerjaanIbu)) || 'Ibu Rumah Tangga';
    const hpIbu = cleanStr(getCell(row, colIdx.hpIbu));
    const alamatJalan = cleanStr(getCell(row, colIdx.alamat)) || 'Jakarta Timur';
    const rt = cleanStr(getCell(row, colIdx.rt)) || '001';
    const rw = cleanStr(getCell(row, colIdx.rw)) || '001';
    const kelurahan = cleanStr(getCell(row, colIdx.kelurahan)) || 'Utan Kayu Utara';
    const kecamatan = cleanStr(getCell(row, colIdx.kecamatan)) || 'Matraman';
    const kotaKabupaten = cleanStr(getCell(row, colIdx.kota)) || 'Jakarta Timur';
    const kodePos = cleanStr(getCell(row, colIdx.kodePos)) || '13120';
    const noHpSiswa = cleanStr(getCell(row, colIdx.noHpSiswa));
    const namaSd = cleanStr(getCell(row, colIdx.asalSd)) || 'SD Negeri';
    const npsnSd = cleanStr(getCell(row, colIdx.npsnSd)) || '20108392';
    const jalur = normalizeJalur(cleanStr(getCell(row, colIdx.jalur)));

    const matchedByNisn = nisn ? existingStudents.find((s) => s.nisn === nisn) : undefined;
    const matchedByNis = nis ? existingStudents.find((s) => s.nis === nis) : undefined;
    const matched = matchedByNisn || matchedByNis;

    let statusKlasifikasi: 'NEW' | 'CONFLICT' | 'ERROR' = 'NEW';
    let pesanValidasi = 'Data valid & siap ditambahkan sebagai siswa baru.';

    if (!nama || (!nis && !nisn)) {
      statusKlasifikasi = 'ERROR';
      pesanValidasi = 'Kolom wajib (Nama Lengkap serta minimal NIS/NISN) kosong.';
    } else if (matched) {
      statusKlasifikasi = 'CONFLICT';
      pesanValidasi = `Cocok dengan data ada (${matched.namaLengkap} · NIS ${matched.nis}). Dapat diperbarui jika mode Update diaktifkan.`;
    }

    const waliMatch = settings.daftarWaliKelas.find((w) => w.rombel === rombel);

    staged.push({
      rowNum: r + 1,
      nis: nis || `IMP-${r + 1}`,
      nisn: nisn || '',
      nik,
      namaLengkap: nama.toUpperCase(),
      jenisKelamin: jk,
      tingkat,
      rombel,
      tempatLahir,
      tanggalLahir,
      agama,
      statusSiswa,
      statusKlasifikasi,
      pesanValidasi,
      matchedExistingId: matched?.id,
      rawStudent: {
        nis: nis || `IMP-${r + 1}`,
        nisn,
        nik: nik || undefined,
        namaLengkap: nama.toUpperCase(),
        namaPanggilan: panggilan,
        jenisKelamin: jk,
        tempatLahir,
        tanggalLahir,
        agama,
        kewarganegaraan: 'WNI',
        anakKe: 1,
        jumlahSaudaraKandung: 1,
        statusAnak: 'Kandung',
        bahasaSehariHari: 'Bahasa Indonesia',
        golonganDarah: 'O',
        tinggiBadanCm: 155,
        beratBadanKg: 45,
        alamatJalan,
        rt,
        rw,
        kelurahan,
        kecamatan,
        kotaKabupaten,
        provinsi: 'DKI Jakarta',
        kodePos,
        tinggalDengan: 'Orang Tua',
        jarakKeSekolahKm: 1.5,
        transportasi: 'Jalan Kaki',
        noHpSiswa: noHpSiswa || undefined,
        ayah: {
          nama: namaAyah || 'Orang Tua Siswa',
          tempatLahir: 'Jakarta',
          tanggalLahir: '1980-01-01',
          agama,
          kewarganegaraan: 'WNI',
          pendidikanTerakhir: 'SMA',
          pekerjaan: pekerjaanAyah,
          noHp: hpAyah,
          status: 'Masih Hidup',
        },
        ibu: {
          nama: namaIbu || 'Ibu Siswa',
          tempatLahir: 'Jakarta',
          tanggalLahir: '1982-01-01',
          agama,
          kewarganegaraan: 'WNI',
          pendidikanTerakhir: 'SMA',
          pekerjaan: pekerjaanIbu,
          noHp: hpIbu,
          status: 'Masih Hidup',
        },
        sekolahAsal: {
          namaSd,
          npsnSd,
          alamatSd: kotaKabupaten,
          tahunLulusSd: '2026',
          noIjazahSd: '-',
          noSklSd: '-',
        },
        penerimaan: {
          tanggalDiterima: '2026-07-13',
          tingkatAwal: tingkat,
          rombelAwal: rombel,
          jalurPenerimaan: jalur,
        },
        status: statusSiswa,
        tingkat,
        rombel,
        tahunAjaranMasuk: settings.tahunAjaranAktif,
        tahunAjaranSekarang: settings.tahunAjaranAktif,
        riwayatKelas: [
          {
            id: `cls-imp-${Date.now()}-${r}`,
            tahunAjaran: settings.tahunAjaranAktif,
            tingkat,
            rombel,
            waliKelas: waliMatch?.nama || 'Wali Kelas',
            semester: settings.semesterAktif,
            statusKenaikan: 'Sedang Berjalan',
          },
        ],
        dokumen: [],
      },
    });
  }

  return { rows: staged, detectedSheet };
}
