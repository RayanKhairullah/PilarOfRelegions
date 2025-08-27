"use client";
import React from "react";
import { SholatReport } from "@/types/sholat";

type SholatItem = { key: keyof SholatReport; label: string };

type Props = {
  reports: SholatReport[];
  sholatList: SholatItem[];
  page: number;
  totalPages: number;
  rowsPerPage: number;
  totalRows: number;
  setPage: (n: number) => void;
  onEdit: (report: SholatReport) => void;
  onDelete: (report: SholatReport) => void;
};

export default function ReportTable({
  reports,
  sholatList,
  page,
  totalPages,
  rowsPerPage,
  totalRows,
  setPage,
  onEdit,
  onDelete,
}: Props) {
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-700 dark:text-neutral-200">
          <thead className="text-xs text-gray-700 dark:text-neutral-200 uppercase bg-gray-100 dark:bg-neutral-700">
            <tr>
              <th scope="col" className="px-4 py-3">Tanggal</th>
              <th scope="col" className="px-4 py-3">Nama Siswa</th>
              <th scope="col" className="px-4 py-3">Gender</th>
              {sholatList.map((s) => (
                <th key={s.key as string} scope="col" className="px-4 py-3 text-center">{s.label}</th>
              ))}
              <th scope="col" className="px-4 py-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {reports.length > 0 ? (
              reports.map((report) => (
                <tr key={report.id} className="bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-700/60">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-neutral-100">{report.tanggal}</td>
                  <th scope="row" className="px-4 py-3 font-medium text-gray-900 dark:text-neutral-100">{report.siswa?.nama}</th>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${report.siswa?.gender === 'L' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' : 'bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300'}`}>
                      {report.siswa?.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                    </span>
                  </td>
                  {sholatList.map((s) => (
                    <td key={s.key as string} className="px-4 py-3 text-center">
                      {report[s.key] ? (
                        <span className="text-green-400 font-bold">✅</span>
                      ) : (
                        <span className="text-red-500">❌</span>
                      )}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        className="p-1.5 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 transition dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
                        onClick={() => onEdit(report)}
                      >
                        Edit
                      </button>
                      <button
                        className="p-1.5 bg-red-100 text-red-600 rounded-md hover:bg-red-200 transition dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50"
                        onClick={() => onDelete(report)}
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={sholatList.length + 4} className="text-center p-8 text-gray-500 dark:text-neutral-400">
                  Tidak ada data yang cocok dengan filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {/* Pagination Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 px-4 py-3 border-t bg-gray-50 dark:bg-neutral-800 dark:border-neutral-700">
          <div className="text-sm text-gray-600 dark:text-neutral-300 mb-2 sm:mb-0">
            {totalRows > 0
              ? `Menampilkan ${(page - 1) * rowsPerPage + 1}–${Math.min(page * rowsPerPage, totalRows)} dari ${totalRows} data`
              : 'Tidak ada data'}
          </div>
          <div className="flex gap-2">
            <button
              className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 dark:bg-neutral-700 dark:hover:bg-neutral-600 dark:text-neutral-100"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
            >Sebelumnya</button>
            <span className="text-gray-700 dark:text-neutral-300 px-2">Halaman {page} / {totalPages}</span>
            <button
              className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 dark:bg-neutral-700 dark:hover:bg-neutral-600 dark:text-neutral-100"
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
            >Berikutnya</button>
          </div>
        </div>
      </div>
    </div>
  );
}
