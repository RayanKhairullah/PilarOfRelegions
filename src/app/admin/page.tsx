"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import { SholatReport } from "@/types/sholat";
import { useRouter } from "next/navigation";
import Image from "next/image";
import * as XLSX from "xlsx";

function toISODateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getWeekRange(weekString: string) {
  if (!weekString) return { start: '', end: '' };
  
  const [year, week] = weekString.split('-W').map(Number);
  if (isNaN(year) || isNaN(week)) return { start: '', end: '' };

  const start = new Date(year, 0, 1 + (week - 1) * 7);
  const end = new Date(year, 0, 1 + (week - 1) * 7 + 6);

  return {
    start: toISODateString(start),
    end: toISODateString(end)
  };
}

export default function AdminDashboard() {
  const router = useRouter();
  const [reports, setReports] = useState<SholatReport[]>([]);
  const [gender, setGender] = useState("");
  const [date, setDate] = useState("");
  const [week, setWeek] = useState("");
  const [month, setMonth] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push("/login");
      }

    });
  }, [router]);

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line
  }, [gender, date, week, month]);

  async function fetchReports() {
    setLoading(true);
    let query = supabase.from("sholat_reports").select("*, siswa(*)");
    
    if (gender) query = query.eq("siswa.gender", gender);
    
    if (date) {
      query = query.eq("tanggal", date);
    } else if (week) {
      const { start, end } = getWeekRange(week);
      if (start && end) {
        query = query.gte("tanggal", start).lte("tanggal", end);
      }
    } else if (month) {
      query = query.like("tanggal", `${month}-%`);
    }
    
    const { data } = await query.order("tanggal", { ascending: false });
    setReports(data || []);
    setLoading(false);
  }

  function handleExport() {
    const exportData = reports.filter(r => r.siswa).map(r => ({
      Nama: r.siswa?.nama,
      Gender: r.siswa?.gender,
      Tanggal: r.tanggal,
      Subuh: r.subuh ? "✓" : "",
      Dzuhur: r.dzuhur ? "✓" : "",
      Ashar: r.ashar ? "✓" : "",
      Maghrib: r.maghrib ? "✓" : "",
      Isya: r.isya ? "✓" : "",
    }));
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan Sholat");
    
    // Generate filename berdasarkan filter
    let filename = "laporan-sholat";
    if (gender) filename += `_${gender === 'L' ? 'Laki' : 'Perempuan'}`;
    if (date) filename += `_harian-${date}`;
    if (week) filename += `_mingguan-${week}`;
    if (month) filename += `_bulanan-${month}`;
    
    XLSX.writeFile(wb, `${filename}.xlsx`);
  }

  const SHOLAT_LIST = [
    { key: 'subuh', label: 'Subuh' },
    { key: 'dzuhur', label: 'Dzuhur' },
    { key: 'ashar', label: 'Ashar' },
    { key: 'maghrib', label: 'Maghrib' },
    { key: 'isya', label: 'Isya' },
  ];

  const filteredReports = reports.filter(r => r.siswa);

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Image src="/logo.png" alt="Logo" width={28} height={28} />
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            </div>
            <p className="text-gray-500">Lihat, filter, dan ekspor laporan sholat siswa.</p>
          </div>
          <button onClick={handleExport} className="button-secondary">
            Export to Excel
          </button>
        </div>

        <div className="card mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 items-center">
            <h3 className="font-semibold sm:col-span-2 md:col-span-1 md:text-right">Filter Laporan:</h3>
            <select onChange={(e) => setGender(e.target.value)} value={gender}>
              <option value="">Semua Gender</option>
              <option value="L">Laki-laki</option>
              <option value="P">Perempuan</option>
            </select>
            <input type="date" onChange={(e) => setDate(e.target.value)} value={date} />
            <input type="week" onChange={(e) => setWeek(e.target.value)} value={week} />
            <input type="month" onChange={(e) => setMonth(e.target.value)} value={month} />
          </div>
        </div>

        <div className="card overflow-x-auto">
          {loading ? (
            <div className="text-center p-12">Loading...</div>
          ) : (
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                <tr>
                  <th scope="col" className="px-4 py-3">Tanggal</th>
                  <th scope="col" className="px-4 py-3">Nama Siswa</th>
                  <th scope="col" className="px-4 py-3">Gender</th>
                  {SHOLAT_LIST.map(s => <th key={s.key} scope="col" className="px-4 py-3 text-center">{s.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {filteredReports.length > 0 ? filteredReports.map((report) => (
                  <tr key={report.id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-4 py-3">{report.tanggal}</td>
                    <th scope="row" className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{report.siswa?.nama}</th>
                    <td className="px-4 py-3">{report.siswa?.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</td>
                    {SHOLAT_LIST.map(s => (
                      <td key={s.key} className="px-4 py-3 text-center">
                        {report[s.key as keyof SholatReport] ? '✅' : '❌'}
                      </td>
                    ))}
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={SHOLAT_LIST.length + 3} className="text-center p-8 text-gray-500">
                      Tidak ada data yang cocok dengan filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}