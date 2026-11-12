import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { FiFileText, FiDownload, FiPlus, FiCalendar } from 'react-icons/fi';

const ReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [reportType, setReportType] = useState('Daily');
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      const res = await API.get('/reports');
      setReports(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleGenerateReport = async () => {
    try {
      const res = await API.post('/reports/generate', { type: reportType });
      alert(`${reportType} Excel Report Generated Successfully!`);
      fetchReports();
    } catch (err) {
      alert('Error generating Excel report');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            ExcelJS Automated Reports & Analytics
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Generate Styled Excel Spreadsheets (.xlsx) for Daily, Weekly and Monthly Audit Reports
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border rounded-xl text-xs font-bold"
          >
            <option value="Daily">Daily Report</option>
            <option value="Weekly">Weekly Report</option>
            <option value="Monthly">Monthly Report</option>
          </select>

          <button
            onClick={handleGenerateReport}
            className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all"
          >
            <FiPlus className="w-4 h-4" />
            <span>Generate Excel Report</span>
          </button>
        </div>
      </div>

      {/* Generated Reports List Table */}
      <div className="glass-card rounded-3xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/70 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 text-xs font-extrabold uppercase border-b">
                <th className="py-3.5 px-4">Report Title</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Generated Date</th>
                <th className="py-3.5 px-4">Total Sales</th>
                <th className="py-3.5 px-4">Total Revenue</th>
                <th className="py-3.5 px-4 text-right">Download</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
              {reports.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    No Excel reports generated yet. Click 'Generate Excel Report' above.
                  </td>
                </tr>
              ) : (
                reports.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                      <FiFileText className="w-4 h-4 text-emerald-600" />
                      <span>{r.title}</span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-blue-600">{r.type}</td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono">
                      {new Date(r.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-bold">{r.statsSummary?.totalSales || 0} Bills</td>
                    <td className="py-3.5 px-4 font-bold text-emerald-600">
                      ₹{r.statsSummary?.totalRevenue?.toLocaleString() || 0}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <a
                        href={`/api/reports/download/${r.filename}`}
                        download
                        className="inline-flex items-center space-x-1 px-3 py-1.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded-lg font-bold text-xs hover:bg-emerald-200 transition-all"
                      >
                        <FiDownload className="w-3.5 h-3.5" />
                        <span>Download .XLSX</span>
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
