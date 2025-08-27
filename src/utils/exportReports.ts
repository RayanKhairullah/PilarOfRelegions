<<<<<<< HEAD
import { utils, WorkBook } from 'xlsx-js-style';
import { getMonthRange, getWeekRange } from './date';
=======
import { utils, WorkBook, WorkSheet } from 'xlsx-js-style';
import { getMonthRange, getWeekRange } from './date';
import { SholatReport } from '@/types/sholat';
>>>>>>> 5935af4 (sholats app v2 + fix eslint)

interface Filters {
  gender: string;
  date: string;
  week: string;
  month: string;
}

<<<<<<< HEAD
export function buildExportWorkbook(params: { exportReports: any[]; filters: Filters }): { wb: WorkBook; filename: string } {
=======
interface StudentAggregateData {
  Nama: string;
  Gender: string;
  Subuh: number;
  Dzuhur: number;
  Ashar: number;
  Maghrib: number;
  Isya: number;
}

interface ExportRowData {
  Nama: string;
  Gender: string;
  Tanggal?: string;
  Subuh: string | number;
  Dzuhur: string | number;
  Ashar: string | number;
  Maghrib: string | number;
  Isya: string | number;
  'Total Normal Terlaksanakan': number;
  'Total Terlaksanakan': number;
  'Total Tidak Terlaksanakan': number;
}

export function buildExportWorkbook(params: { exportReports: SholatReport[]; filters: Filters }): { wb: WorkBook; filename: string } {
>>>>>>> 5935af4 (sholats app v2 + fix eslint)
  const { exportReports, filters } = params;
  const { gender, date, week, month } = filters;

  let filename = 'laporan-sholat';
  if (gender) filename += `_${gender === 'L' ? 'Laki' : 'Perempuan'}`;
  if (date) filename += `_harian-${date}`;
  if (week) filename += `_mingguan-${week}`;
  if (month) filename += `_bulanan-${month}`;

  // determine expected normal count (5 per day)
  const expectedPerDay = 5;
  let daysCount = 0;
  if (date) {
    daysCount = 1;
  } else if (week) {
    const { start, end } = getWeekRange(week);
    if (start && end) {
      const d1 = new Date(start);
      const d2 = new Date(end);
      daysCount = Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    }
  } else if (month) {
    const { start, end } = getMonthRange(month);
    if (start && end) {
      const d1 = new Date(start);
      const d2 = new Date(end);
      daysCount = Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    }
  }
  const normalExpected = daysCount > 0 ? daysCount * expectedPerDay : expectedPerDay;

<<<<<<< HEAD
  let exportData: any[] = [];

  if (week || month) {
    // Aggregate per student
    const studentMap = new Map<string, any>();
=======
  let exportData: ExportRowData[] = [];

  if (week || month) {
    // Aggregate per student
    const studentMap = new Map<string, StudentAggregateData>();
>>>>>>> 5935af4 (sholats app v2 + fix eslint)
    (exportReports || [])
      .filter((r) => r.siswa)
      .forEach((r) => {
        const key = `${r.siswa_id}-${r.siswa?.nama}`;
        if (!studentMap.has(key)) {
          studentMap.set(key, {
<<<<<<< HEAD
            Nama: r.siswa?.nama,
=======
            Nama: r.siswa?.nama || 'Unknown',
>>>>>>> 5935af4 (sholats app v2 + fix eslint)
            Gender: r.siswa?.gender === 'L' ? 'Laki-laki' : 'Perempuan',
            Subuh: 0,
            Dzuhur: 0,
            Ashar: 0,
            Maghrib: 0,
            Isya: 0,
          });
        }
        const student = studentMap.get(key);
<<<<<<< HEAD
        student['Subuh'] += r.subuh ? 1 : 0;
        student['Dzuhur'] += r.dzuhur ? 1 : 0;
        student['Ashar'] += r.ashar ? 1 : 0;
        student['Maghrib'] += r.maghrib ? 1 : 0;
        student['Isya'] += r.isya ? 1 : 0;
=======
        if (student) {
          student['Subuh'] += r.subuh ? 1 : 0;
          student['Dzuhur'] += r.dzuhur ? 1 : 0;
          student['Ashar'] += r.ashar ? 1 : 0;
          student['Maghrib'] += r.maghrib ? 1 : 0;
          student['Isya'] += r.isya ? 1 : 0;
        }
>>>>>>> 5935af4 (sholats app v2 + fix eslint)
      });

    exportData = Array.from(studentMap.values()).map((s) => {
      const totalTrue = s['Subuh'] + s['Dzuhur'] + s['Ashar'] + s['Maghrib'] + s['Isya'];
      const totalFalse = Math.max(normalExpected - totalTrue, 0);
      return {
        ...s,
        'Total Normal Terlaksanakan': normalExpected,
        'Total Terlaksanakan': totalTrue,
        'Total Tidak Terlaksanakan': totalFalse,
      };
    });
  } else {
    exportData = (exportReports || [])
      .filter((r) => r.siswa)
      .map((r) => {
        const subuh = !!r.subuh;
        const dzuhur = !!r.dzuhur;
        const ashar = !!r.ashar;
        const maghrib = !!r.maghrib;
        const isya = !!r.isya;
        const totalTrue = [subuh, dzuhur, ashar, maghrib, isya].filter(Boolean).length;
        const totalFalse = expectedPerDay - totalTrue;
        return {
<<<<<<< HEAD
          Nama: r.siswa?.nama,
=======
          Nama: r.siswa?.nama || 'Unknown',
>>>>>>> 5935af4 (sholats app v2 + fix eslint)
          Gender: r.siswa?.gender === 'L' ? 'Laki-laki' : 'Perempuan',
          Tanggal: r.tanggal,
          Subuh: subuh ? 'TRUE' : 'FALSE',
          Dzuhur: dzuhur ? 'TRUE' : 'FALSE',
          Ashar: ashar ? 'TRUE' : 'FALSE',
          Maghrib: maghrib ? 'TRUE' : 'FALSE',
          Isya: isya ? 'TRUE' : 'FALSE',
          'Total Normal Terlaksanakan': expectedPerDay,
          'Total Terlaksanakan': totalTrue,
          'Total Tidak Terlaksanakan': totalFalse,
        };
      });
  }

  const headerStyle = {
    font: { bold: true, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '4F81BD' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: '000000' } },
      bottom: { style: 'thin', color: { rgb: '000000' } },
      left: { style: 'thin', color: { rgb: '000000' } },
      right: { style: 'thin', color: { rgb: '000000' } },
    },
  } as const;
  const dataStyle = {
    border: {
      top: { style: 'thin', color: { rgb: 'D3D3D3' } },
      bottom: { style: 'thin', color: { rgb: 'D3D3D3' } },
      left: { style: 'thin', color: { rgb: 'D3D3D3' } },
      right: { style: 'thin', color: { rgb: 'D3D3D3' } },
    },
  } as const;

  const keys = Object.keys(exportData[0] || {});

  // Title & subtitle
  const reportType = date ? 'Harian' : week ? 'Mingguan' : month ? 'Bulanan' : '';
  const titleText = `Laporan Sholat ${reportType}`.trim();
  const subtitleParts = [
    gender ? `Gender: ${gender === 'L' ? 'Laki-laki' : 'Perempuan'}` : '',
    date ? `Tanggal: ${date}` : '',
    week ? `Minggu: ${week}` : '',
    month ? `Bulan: ${month}` : '',
  ].filter(Boolean);
  const subtitleText = subtitleParts.join(' | ');

  const titleStyle = {
    font: { bold: true, sz: 16, color: { rgb: '1F2937' } },
    alignment: { horizontal: 'center', vertical: 'center' },
  } as const;
  const subtitleStyle = {
    font: { sz: 12, color: { rgb: '374151' }, italic: true },
    alignment: { horizontal: 'center', vertical: 'center' },
  } as const;

  const titleRow = [
    { v: titleText || 'Laporan Sholat', t: 's', s: titleStyle },
    ...Array(Math.max(keys.length - 1, 0)).fill({ v: '', t: 's', s: titleStyle }),
  ];
  const subtitleRow = [
    { v: subtitleText, t: 's', s: subtitleStyle },
    ...Array(Math.max(keys.length - 1, 0)).fill({ v: '', t: 's', s: subtitleStyle }),
  ];

  const headerRow = keys.map((key) => ({ v: key, t: 's', s: headerStyle }));
  const dataRows = exportData.map((row) =>
    keys.map((key) => {
<<<<<<< HEAD
      const value = (row as any)[key];
=======
      const value = row[key as keyof ExportRowData];
>>>>>>> 5935af4 (sholats app v2 + fix eslint)
      const isNumber = typeof value === 'number';
      return { v: value, t: isNumber ? 'n' : 's', s: dataStyle };
    })
  );
  const wsData = [titleRow, subtitleRow, headerRow, ...dataRows];

  const wb = utils.book_new();
  const ws = utils.aoa_to_sheet(wsData);
<<<<<<< HEAD
  if (!ws['!merges']) ws['!merges'] = [] as any;
  (ws['!merges'] as any[]).push({ s: { r: 0, c: 0 }, e: { r: 0, c: Math.max(keys.length - 1, 0) } });
  (ws['!merges'] as any[]).push({ s: { r: 1, c: 0 }, e: { r: 1, c: Math.max(keys.length - 1, 0) } });
=======
  if (!ws['!merges']) ws['!merges'] = [];
  ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: Math.max(keys.length - 1, 0) } });
  ws['!merges'].push({ s: { r: 1, c: 0 }, e: { r: 1, c: Math.max(keys.length - 1, 0) } });
>>>>>>> 5935af4 (sholats app v2 + fix eslint)

  const colWidths = keys.map((key) => {
    if (key === 'Nama') return { wch: 25 };
    if (key === 'Gender') return { wch: 12 };
    if (key === 'Tanggal') return { wch: 15 };
    return { wch: 12 };
  });
<<<<<<< HEAD
  (ws as any)['!cols'] = colWidths;
=======
  (ws as WorkSheet & { '!cols': typeof colWidths })['!cols'] = colWidths;
>>>>>>> 5935af4 (sholats app v2 + fix eslint)

  utils.book_append_sheet(wb, ws, 'Laporan Sholat');

  return { wb, filename };
}
