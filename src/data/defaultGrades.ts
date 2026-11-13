import { SemesterGradesRecord, MataPelajaranNilai, P5Record } from '../types';

export const STANDARD_SUBJECTS_TEMPLATE: Array<{
  no: number;
  subCode?: string;
  isSubItem?: boolean;
  nama: string;
  kktp: number;
  defaultBaseScore: number;
  capaian: string;
}> = [
  {
    no: 1,
    nama: 'Pendidikan Agama dan Budi Pekerti',
    kktp: 75,
    defaultBaseScore: 88,
    capaian: 'Menunjukkan penguasaan sangat baik dalam memahami makna toleransi, adab pergaulan, dan pengamalan ibadah wajib sehari-hari secara konsisten.',
  },
  {
    no: 2,
    nama: 'Pendidikan Pancasila',
    kktp: 75,
    defaultBaseScore: 86,
    capaian: 'Sangat baik dalam menganalisis perumusan norma sosial, kedudukan Pancasila sebagai dasar negara, serta menjaga persatuan bangsa.',
  },
  {
    no: 3,
    nama: 'Bahasa Indonesia',
    kktp: 75,
    defaultBaseScore: 85,
    capaian: 'Terampil dan mandiri dalam menyusun teks deskripsi, puisi rakyat, serta menyampaikan gagasan lisan secara kritis dan santun.',
  },
  {
    no: 4,
    nama: 'Matematika',
    kktp: 75,
    defaultBaseScore: 83,
    capaian: 'Mampu menyelesaikan operasi bilangan bulat, aljabar linear, dan penerapan konsep geometri bangun datar dalam pemecahan masalah nyata.',
  },
  {
    no: 5,
    nama: 'Ilmu Pengetahuan Alam',
    kktp: 75,
    defaultBaseScore: 87,
    capaian: 'Sangat baik dalam melakukan penyelidikan ilmiah mengenai klasifikasi materi, interaksi ekosistem lingkungan hidup, dan zat aditif.',
  },
  {
    no: 6,
    nama: 'Ilmu Pengetahuan Sosial',
    kktp: 75,
    defaultBaseScore: 85,
    capaian: 'Memahami keberagaman potensi sumber daya alam maritim Indonesia, mobilitas sosial, dan interaksi antarruang wilayah Nusantara.',
  },
  {
    no: 7,
    nama: 'Bahasa Inggris',
    kktp: 75,
    defaultBaseScore: 84,
    capaian: 'Mampu berinteraksi secara percaya diri menggunakan transactional conversations, describing objects and daily routines clearly.',
  },
  {
    no: 8,
    nama: 'Pendidikan Jasmani, Olahraga dan Kesehatan',
    kktp: 75,
    defaultBaseScore: 89,
    capaian: 'Menunjukkan keterampilan gerak spesifik permainan bola besar/kecil, kebugaran jasmani, serta kedisiplinan pola hidup sehat.',
  },
  {
    no: 9,
    nama: 'Informatika',
    kktp: 75,
    defaultBaseScore: 90,
    capaian: 'Sangat cakap dalam berpikir komputasional, pengenalan algoritma visual, literasi digital, serta etika keamanan berinternet.',
  },
  {
    no: 10,
    subCode: 'a',
    isSubItem: true,
    nama: 'Seni Musik',
    kktp: 75,
    defaultBaseScore: 86,
    capaian: 'Mampu memainkan instrumen musik ritmis dan mengapresiasi keunikan harmoni lagu-lagu daerah Indonesia dengan baik.',
  },
  {
    no: 10,
    subCode: 'b',
    isSubItem: true,
    nama: 'Seni Rupa',
    kktp: 75,
    defaultBaseScore: 87,
    capaian: 'Kreatif dalam menggambar ragam hias fauna dan flora dengan teknik pencahayaan dan proporsi estetis.',
  },
  {
    no: 10,
    subCode: 'c',
    isSubItem: true,
    nama: 'Seni Teater',
    kktp: 75,
    defaultBaseScore: 84,
    capaian: 'Mampu mengekspresikan karakter peran dan dialog panggung bertema kearifan lokal secara ekspresif.',
  },
  {
    no: 10,
    subCode: 'd',
    isSubItem: true,
    nama: 'Seni Tari',
    kktp: 75,
    defaultBaseScore: 85,
    capaian: 'Mampu memperagakan gerak dasar tari kreasi Nusantara sesuai tempo dan iringan musik dengan harmonis.',
  },
  {
    no: 10,
    subCode: 'e',
    isSubItem: true,
    nama: 'Prakarya (Budi Daya / Rekayasa)',
    kktp: 75,
    defaultBaseScore: 88,
    capaian: 'Berhasil membuat miniatur rekayasa teknologi sederhana dan olahan makanan bergizi berbahan pangan lokal.',
  },
  {
    no: 11,
    nama: 'Bimbingan dan Konseling',
    kktp: 75,
    defaultBaseScore: 88,
    capaian: 'Menunjukkan kemandirian belajar, komunikasi asertif, kemampuan adaptasi sosial yang positif, serta perencanaan karir lanjutan.',
  },
  {
    no: 12,
    subCode: 'a',
    isSubItem: true,
    nama: 'Muatan Lokal: PLBJ (Pendidikan Lingkungan & Budaya Jakarta)',
    kktp: 75,
    defaultBaseScore: 88,
    capaian: 'Sangat memahami sejarah cagar budaya Betawi, sistem transportasi publik kota Jakarta, dan upaya pelestarian lingkungan kali bersih.',
  },
  {
    no: 12,
    subCode: 'b',
    isSubItem: true,
    nama: 'Muatan Lokal: Keterampilan Bahasa & Budaya Daerah',
    kktp: 75,
    defaultBaseScore: 85,
    capaian: 'Mampu mengapresiasi sastra bertutur dan ungkapan santun dalam tradisi kebudayaan masyarakat Betawi.',
  },
];

export function generateDefaultSemesterGrades(
  _studentName: string,
  _studentNis: string,
  startYear: number = 2024
): Record<number, SemesterGradesRecord> {
  const semesters: Record<number, SemesterGradesRecord> = {};

  const semMeta = [
    {
      semNum: 1,
      kelas: 'VII A',
      tingkat: 'VII' as const,
      semesterType: 'Ganjil' as const,
      thPelajaran: `${startYear}/${startYear + 1}`,
      tanggal: `22 Desember ${startYear}`,
      waliKelas: 'Hj. Ratna Dewi, M.Pd.',
      nipWali: '197904152006042012',
      p5Tema1: 'Gaya Hidup Berkelanjutan: Pengolahan Sampah Plastik & Bank Sampah SMPN 99',
      p5Tema2: 'Kearifan Lokal: Eksplorasi Seni Betawi & Kuliner Tradisional Jakarta',
      p5Tema3: 'Kewirausahaan: Kreasi Cinderamata Ramah Lingkungan',
      sakit: 1,
      izin: 1,
      alpa: 0,
    },
    {
      semNum: 2,
      kelas: 'VII A',
      tingkat: 'VII' as const,
      semesterType: 'Genap' as const,
      thPelajaran: `${startYear}/${startYear + 1}`,
      tanggal: `23 Juni ${startYear + 1}`,
      waliKelas: 'Hj. Ratna Dewi, M.Pd.',
      nipWali: '197904152006042012',
      p5Tema1: 'Suara Demokrasi: Simulasi Musyawarah dan Pemilihan Ketua OSIS',
      p5Tema2: 'Bhinneka Tunggal Ika: Harmoni Keberagaman Budaya Nusantara',
      p5Tema3: 'Bangunlah Jiwa dan Raganya: Gerakan Anti-Perundungan di Sekolah',
      sakit: 2,
      izin: 0,
      alpa: 0,
    },
    {
      semNum: 3,
      kelas: 'VIII A',
      tingkat: 'VIII' as const,
      semesterType: 'Ganjil' as const,
      thPelajaran: `${startYear + 1}/${startYear + 2}`,
      tanggal: `20 Desember ${startYear + 1}`,
      waliKelas: 'Drs. Hendro Wibowo',
      nipWali: '197403102002121003',
      p5Tema1: 'Rekayasa dan Teknologi: Pembuatan Sistem Otomasi Hidroponik Sederhana',
      p5Tema2: 'Kearifan Lokal: Revitalisasi Pantun dan Lenong Betawi Remaja',
      p5Tema3: 'Gaya Hidup Berkelanjutan: Konservasi Energi Listrik & Air Sekolah',
      sakit: 1,
      izin: 2,
      alpa: 0,
    },
    {
      semNum: 4,
      kelas: 'VIII A',
      tingkat: 'VIII' as const,
      semesterType: 'Genap' as const,
      thPelajaran: `${startYear + 1}/${startYear + 2}`,
      tanggal: `21 Juni ${startYear + 2}`,
      waliKelas: 'Drs. Hendro Wibowo',
      nipWali: '197403102002121003',
      p5Tema1: 'Kewirausahaan Mandiri: Bazar Pangan Sehat & Produk Olahan Kreatif',
      p5Tema2: 'Bangunlah Jiwa Raganya: Kesehatan Mental dan Literasi Digital Remaja',
      p5Tema3: 'Bhinneka Tunggal Ika: Festival Toleransi dan Seni Lintas Etnis',
      sakit: 0,
      izin: 1,
      alpa: 0,
    },
    {
      semNum: 5,
      kelas: 'IX A',
      tingkat: 'IX' as const,
      semesterType: 'Ganjil' as const,
      thPelajaran: `${startYear + 2}/${startYear + 3}`,
      tanggal: `19 Desember ${startYear + 2}`,
      waliKelas: 'Sri Wahyuni, S.Pd.',
      nipWali: '198108252008012015',
      p5Tema1: 'Suara Demokrasi: Keterlibatan Pemilih Pemula dalam Demokrasi Digital',
      p5Tema2: 'Rekayasa Teknologi: Pemilahan Limbah Cerdas Berbasis Sensor Sederhana',
      p5Tema3: 'Gaya Hidup Berkelanjutan: Audit Jejak Karbon Komunitas Sekolah',
      sakit: 1,
      izin: 0,
      alpa: 0,
    },
    {
      semNum: 6,
      kelas: 'IX A',
      tingkat: 'IX' as const,
      semesterType: 'Genap' as const,
      thPelajaran: `${startYear + 2}/${startYear + 3}`,
      tanggal: `10 Juni ${startYear + 3}`,
      waliKelas: 'Sri Wahyuni, S.Pd.',
      nipWali: '198108252008012015',
      p5Tema1: 'Kewirausahaan: Pameran Inovasi Karya Akhir Jenjang SMPN 99',
      p5Tema2: 'Bhinneka Tunggal Ika: Dokumenter Kearifan Tradisi Kampung Betawi',
      p5Tema3: 'Bangunlah Jiwa dan Raganya: Kesiapan Menuju Pendidikan Menengah',
      sakit: 0,
      izin: 0,
      alpa: 0,
    },
  ];

  semMeta.forEach((meta) => {
    // Generate slight variations across semesters (+0 to +3)
    const delta = (meta.semNum - 1) % 4;

    const mapelList: MataPelajaranNilai[] = STANDARD_SUBJECTS_TEMPLATE.map((tpl) => {
      const score = Math.min(98, tpl.defaultBaseScore + delta - (tpl.no % 3 === 0 ? 1 : 0));
      return {
        no: tpl.no,
        subCode: tpl.subCode,
        isSubItem: tpl.isSubItem,
        nama: tpl.nama,
        nilaiAkhir: score,
        kktp: tpl.kktp,
        capaianPembelajaran: tpl.capaian,
      };
    });

    const p5Data: P5Record = {
      tema1: meta.p5Tema1,
      tema2: meta.p5Tema2,
      tema3: meta.p5Tema3,
      dimensiList: [
        {
          no: 1,
          dimensi: 'Beriman, Bertakwa kepada Tuhan YME, dan Berakhlak Mulia',
          elemen: 'Akhlak Pribadi & Beragama',
          subElemen: 'Integritas dan merawat diri secara fisik, mental, dan spiritual',
          targetCapaian: 'Berkembang Sesuai Harapan (BSH)',
        },
        {
          no: 2,
          dimensi: 'Berkebhinekaan Global',
          elemen: 'Mengenal dan Menghargai Budaya',
          subElemen: 'Menumbuhkan rasa menghormati terhadap keanekaragaman budaya',
          targetCapaian: 'Sangat Berkembang (SAB)',
        },
        {
          no: 3,
          dimensi: 'Bergotong Royong',
          elemen: 'Kolaborasi dan Kepedulian',
          subElemen: 'Kerja sama, koordinasi sosial, dan tanggap terhadap lingkungan',
          targetCapaian: 'Sangat Berkembang (SAB)',
        },
        {
          no: 4,
          dimensi: 'Mandiri',
          elemen: 'Regulasi Diri',
          subElemen: 'Percaya diri, tangguh, dan disiplin mengelola waktu belajar',
          targetCapaian: 'Berkembang Sesuai Harapan (BSH)',
        },
        {
          no: 5,
          dimensi: 'Bernalar Kritis',
          elemen: 'Memperoleh dan Memproses Informasi',
          subElemen: 'Mengidentifikasi, mengklarifikasi, dan mengolah gagasan logis',
          targetCapaian: 'Sangat Berkembang (SAB)',
        },
        {
          no: 6,
          dimensi: 'Kreatif',
          elemen: 'Menghasilkan Karya dan Tindakan Orisinal',
          subElemen: 'Mengeksplorasi dan mengekspresikan pikiran dalam karya nyata',
          targetCapaian: 'Berkembang Sesuai Harapan (BSH)',
        },
      ],
    };

    semesters[meta.semNum] = {
      semesterNumber: meta.semNum,
      kelas: meta.kelas,
      tingkat: meta.tingkat,
      semesterType: meta.semesterType,
      fase: 'D',
      tahunPelajaran: meta.thPelajaran,
      tanggalRapor: meta.tanggal,
      waliKelas: meta.waliKelas,
      nipWaliKelas: meta.nipWali,
      mataPelajaran: mapelList,
      p5: p5Data,
      ekstrakurikuler: [
        {
          no: 1,
          nama: 'Pramuka (Wajib Gugus Depan SMPN 99 Jakarta)',
          keterangan: 'Sangat aktif mengikuti latihan mingguan, perkemahan sabtu-minggu, dan menguasai semaphore serta tali temali tingkat Rakit.',
        },
        {
          no: 2,
          nama: meta.semNum % 2 === 1 ? 'PMR (Palang Merah Remaja)' : 'Klub Robotika & Informatika',
          keterangan: 'Disiplin, bertanggung jawab, dan memiliki semangat kerja sama tim yang terpuji.',
        },
      ],
      prestasi: [
        {
          no: 1,
          jenis: 'Akademik & Sains',
          tingkat: 'Kecamatan / Kota',
          nama: `Olimpiade Sains & Literasi Kurikulum Merdeka Semester ${meta.semNum}`,
          tahun: meta.thPelajaran.split('/')[0],
          penyelenggara: 'Musyawarah Guru Mata Pelajaran (MGMP) DKI Jakarta',
          peringkat: meta.semNum === 1 ? 'Juara Harapan I' : 'Peringkat Terbaik Rombel',
        },
      ],
      ketidakhadiran: {
        sakit: meta.sakit,
        izin: meta.izin,
        tanpaKeterangan: meta.alpa,
      },
      catatanAkademik: `Ananda menunjukkan motivasi belajar dan etika yang sangat baik selama pembelajaran Semester ${meta.semNum}. Pertahankan prestasi belajar dan keaktifan positif di lingkungan SMP Negeri 99 Jakarta.`,
    };
  });

  return semesters;
}
