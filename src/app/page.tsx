"use client";
import { useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";
import type { SholatReport } from "../types/sholat";
import Image from "next/image";

// Specific types for this page to avoid conflicts
interface SiswaOption {
  id: number;
  nama: string;
}
type SholatKeys = 'subuh' | 'dzuhur' | 'ashar' | 'maghrib' | 'isya';

// Helper function to format date to YYYY-MM-DD
function toISODateString(date: Date): string {
  const pad = (num: number) => (num < 10 ? '0' + num : num);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export default function Home() {
  const [siswaOptions, setSiswaOptions] = useState<SiswaOption[]>([]);
  const [selectedSiswa, setSelectedSiswa] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [sholatReport, setSholatReport] = useState<Partial<SholatReport>>({});
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [fetchingReport, setFetchingReport] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [history, setHistory] = useState<{ tanggal: string; report?: SholatReport }[]>([]);

  const sholatTimes: { key: SholatKeys; label: string }[] = [

    { key: "subuh", label: "Subuh" },
    { key: "dzuhur", label: "Dzuhur" },
    { key: "ashar", label: "Ashar" },
    { key: "maghrib", label: "Maghrib" },
    { key: "isya", label: "Isya" },
  ];

  // On first load, auto-select last selected siswa if available
  useEffect(() => {
    async function fetchSiswa() {
      const { data } = await supabase.from("siswa").select("id, nama").order('nama', { ascending: true });
      setSiswaOptions(data as SiswaOption[] || []);
    }
    fetchSiswa();
    const lastSelected = localStorage.getItem('selectedSiswa');
    if (lastSelected) setSelectedSiswa(lastSelected);
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Remember selected siswa in localStorage, fetch today's report and 7-day history when selectedSiswa changes
  useEffect(() => {
    const checkSubmission = async (siswaId: number) => {
      setFetchingReport(true);
      const today = toISODateString(new Date());
      const { data } = await supabase
        .from("sholat_reports")
        .select("*")
        .eq("siswa_id", siswaId)
        .eq("tanggal", today)
        .single();
      if (data) {
        setIsSubmitted(true);
        setSholatReport(data);
      } else {
        setIsSubmitted(false);
        setSholatReport({});
      }
      setFetchingReport(false);
    };
    const fetchHistory = async (siswaId: number) => {
      setHistoryLoading(true);
      const today = new Date();
      const start = new Date();
      start.setDate(today.getDate() - 6);
      const todayStr = toISODateString(today);
      const startStr = toISODateString(start);
      const { data } = await supabase
        .from("sholat_reports")
        .select("*")
        .eq("siswa_id", siswaId)
        .gte("tanggal", startStr)
        .lte("tanggal", todayStr)
        .order("tanggal", { ascending: false });
      const list = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(today.getDate() - i);
        return toISODateString(d);
      });
      const mapByDate = new Map((data || []).map(r => [r.tanggal, r as SholatReport]));
      setHistory(list.map(tgl => ({ tanggal: tgl, report: mapByDate.get(tgl) })));
      setHistoryLoading(false);
    };

    if (selectedSiswa) {
      localStorage.setItem('selectedSiswa', selectedSiswa);
      const siswaId = parseInt(selectedSiswa);
      checkSubmission(siswaId);
      fetchHistory(siswaId);
    } else {
      setIsSubmitted(false);
      setSholatReport({});
      setHistory([]);
    }
  }, [selectedSiswa]);

  const handleCheckboxChange = (sholat: SholatKeys) => {
    setSholatReport((prev) => ({ ...prev, [sholat]: !prev[sholat] }));
  };

  const getSholatValue = (key: SholatKeys) => {
    return !!sholatReport[key];
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSiswa) {
      setNotification({ message: 'Pilih nama terlebih dahulu.', type: 'error' });
      return;
    }

    setLoading(true);
    const { ...reportData } = {
      ...sholatReport,
      siswa_id: parseInt(selectedSiswa),
      tanggal: toISODateString(new Date()),
    };

    try {
      let res;
      if (isSubmitted && reportData.id) {
        res = await supabase.from("sholat_reports").update(reportData).eq("id", reportData.id).select().single();
      } else {
        res = await supabase.from("sholat_reports").insert(reportData).select().single();
      }
      
      if (res.error) throw res.error;

      // After submit, always fetch latest report to sync state
      if(res.data) {
        setSholatReport(res.data);
      }
      setIsSubmitted(true);
      setNotification({ message: 'Laporan berhasil disimpan!', type: 'success' });
      // fetch again to ensure latest data
      if (selectedSiswa) {
        const today = toISODateString(new Date());
        const { data } = await supabase
          .from("sholat_reports")
          .select("*")
          .eq("siswa_id", parseInt(selectedSiswa))
          .eq("tanggal", today)
          .single();
        if (data) setSholatReport(data);
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error("Error submitting sholat report:", error);
      setNotification({ message: `Gagal menyimpan: ${errMsg}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
  <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 md:p-12 bg-neutral-900 text-neutral-100">
    {notification && (
      <div
        className={`fixed top-5 right-5 p-4 rounded-md text-white z-50 ${
          notification.type === "success" ? "bg-green-600" : "bg-red-600"
        } animate-fade-in-fast`}
      >
        {notification.message}
      </div>
    )}

    <div className="w-full max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <Image
          src="/logo.png"
          alt="Logo"
          width={60}
          height={60}
          className="mx-auto mb-4"
        />
        <h1 className="text-3xl font-bold">Laporan Sholat Harian</h1>
        <p className="text-neutral-400 mt-2">
          Silakan isi laporan sholat wajib harian Anda.
        </p>
      </div>

      {/* Card rules */}
      <div className="mb-6 rounded-xl bg-neutral-800 p-4 shadow-md">
        <h2 className="font-semibold text-lg mb-2">Perhatian & Aturan</h2>
        <ul className="list-disc list-inside text-neutral-400 space-y-1">
          <li>
            Laporan hanya bisa diisi <span className="font-semibold">satu kali</span> setiap hari.
          </li>
          <li>
            Jika sudah mengirim, Anda masih bisa{" "}
            <span className="font-semibold">mengubah</span> laporan di hari yang sama.
          </li>
          <li>Pilih nama Anda, lalu centang sholat yang sudah dilaksanakan.</li>
          <li>Klik tombol &quot;Kirim Laporan&quot; untuk menyimpan.</li>
        </ul>
      </div>

      {/* History */}
      {fetchingReport && selectedSiswa && (
        <div className="w-full flex justify-center items-center mb-4">
          <span className="text-blue-400 text-sm">Mengambil data laporan...</span>
        </div>
      )}

      {selectedSiswa && (
        <div className="mb-6 rounded-xl bg-neutral-800 p-4 shadow-md">
          <h2 className="font-semibold text-lg mb-2">Riwayat 7 Hari Terakhir</h2>
          {historyLoading ? (
            <p className="text-neutral-400 text-sm">Memuat riwayat...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-neutral-300">
                <thead className="text-xs uppercase bg-neutral-700 text-neutral-200">
                  <tr>
                    <th className="px-3 py-2">Tanggal</th>
                    {sholatTimes.map(({ key, label }) => (
                      <th key={key} className="px-3 py-2 text-center">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.map(({ tanggal, report }) => (
                    <tr
                      key={tanggal}
                      className="border-b border-neutral-700 hover:bg-neutral-700/40"
                    >
                      <td className="px-3 py-2 font-medium">{tanggal}</td>
                      {sholatTimes.map(({ key }) => (
                        <td key={key} className="px-3 py-2 text-center">
                          {report ? (
                            report[key] ? (
                              <span className="text-green-400">✅</span>
                            ) : (
                              <span className="text-red-500">❌</span>
                            )
                          ) : (
                            <span className="text-neutral-600">—</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="text-sm text-neutral-400 italic mt-3">
            * jika ada yang terlewat, hubungi admin
          </p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="rounded-xl bg-neutral-800 p-4 shadow-md">
        <div className="mb-6 text-neutral-300">
          <label
            htmlFor="siswa"
            className="block text-sm font-medium text-neutral-200 mb-2"
          >
            Nama Lengkap
          </label>
          <select
            id="siswa"
            value={selectedSiswa}
            onChange={(e) => setSelectedSiswa(e.target.value)}
            className="w-full border border-neutral-700 rounded-md px-3 py-2 bg-neutral-900 text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-neutral-800"
            disabled={isSubmitted}
          >
            <option value="" disabled>
              -- Pilih Nama --
            </option>
            {siswaOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nama}
              </option>
            ))}
          </select>
          {isSubmitted && (
            <p className="text-sm text-blue-400 mt-2">
              Anda sudah mengirim laporan hari ini. Anda hanya bisa mengedit.
            </p>
          )}
        </div>

        {selectedSiswa && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-neutral-200 mb-3">
              Sholat yang Dilaksanakan
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {sholatTimes.map(({ key, label }) => (
                <label
                  key={key}
                  className="flex items-center gap-2 text-neutral-200 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={getSholatValue(key)}
                    onChange={() => handleCheckboxChange(key)}
                    className="h-5 w-5 rounded border-neutral-600 bg-neutral-900 text-blue-500 focus:ring-blue-500"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
        )}

        <button
          type="submit"
          className="w-full rounded-md bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 transition disabled:bg-neutral-600"
          disabled={loading || !selectedSiswa}
        >
          {loading
            ? "Menyimpan..."
            : isSubmitted
            ? "Update Laporan"
            : "Kirim Laporan"}
        </button>
      </form>
    </div>
  </main>
  );
}