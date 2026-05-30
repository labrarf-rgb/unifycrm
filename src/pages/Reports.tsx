import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Plus, 
  Trash2, 
  ChevronRight, 
  Database, 
  PieChart as PieChartIcon, 
  LayoutList, 
  TrendingUp,
  ArrowLeft,
  Save,
  Download,
  Edit2
} from 'lucide-react';
import { reportService, donationService, volunteerService, settingsService } from '../services/db';
import { Report } from '../types';
import { format } from 'date-fns';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

const COLORS = ['#5A5A40', '#8a8a6f', '#2d2d2a', '#e8e8df', '#a0a08b'];

export default function Reports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isBuilding, setIsBuilding] = useState(false);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [reportData, setReportData] = useState<any[]>([]);
  const [currency, setCurrency] = useState('USD');

  // Builder State
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<'donations' | 'volunteers'>('donations');
  const [newFields, setNewFields] = useState<string[]>([]);
  const [newViz, setNewViz] = useState<Report['visualization']>('table');

  const donationFields = [
    { id: 'constituentName', label: 'Constituent' },
    { id: 'amount', label: 'Amount' },
    { id: 'method', label: 'Method' },
    { id: 'timestamp', label: 'Date' }
  ];

  const volunteerFields = [
    { id: 'constituentName', label: 'Constituent' },
    { id: 'hours', label: 'Hours' },
    { id: 'status', label: 'Status' },
    { id: 'checkIn', label: 'Date' }
  ];

  useEffect(() => {
    loadReports();
    settingsService.getCurrency().then(setCurrency);
  }, []);

  const loadReports = async () => {
    const data = await reportService.getAll();
    setReports(data);
  };

  const handleSelectReport = async (report: Report) => {
    setSelectedReport(report);
    setIsBuilding(false);
    setEditingReport(null);
    let data = [];
    if (report.type === 'donations') {
      data = await donationService.listAll();
    } else {
      data = await volunteerService.listAll();
    }
    setReportData(data);
  };

  const handleSaveReport = async () => {
    if (!newName || newFields.length === 0) return;
    
    if (editingReport) {
      await reportService.update(editingReport.id, {
        name: newName,
        type: newType,
        fields: newFields,
        visualization: newViz
      });
      // Update selected report if it was the one being edited
      if (selectedReport?.id === editingReport.id) {
        handleSelectReport({ ...editingReport, name: newName, type: newType, fields: newFields, visualization: newViz });
      }
    } else {
      await reportService.create({
        name: newName,
        type: newType,
        fields: newFields,
        visualization: newViz
      });
    }
    
    resetBuilder();
    loadReports();
  };

  const resetBuilder = () => {
    setNewName('');
    setNewFields([]);
    setNewType('donations');
    setNewViz('table');
    setIsBuilding(false);
    setEditingReport(null);
  };

  const handleEditReport = (report: Report, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingReport(report);
    setNewName(report.name);
    setNewType(report.type);
    setNewFields(report.fields);
    setNewViz(report.visualization);
    setIsBuilding(true);
    setSelectedReport(null);
  };

  const handleDeleteReport = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Delete this custom report?')) {
      await reportService.delete(id);
      if (selectedReport?.id === id) setSelectedReport(null);
      loadReports();
    }
  };

  const safeFormat = (date: any, formatStr: string) => {
    if (!date) return 'N/A';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return 'Invalid';
      return format(d, formatStr);
    } catch (e) {
      return 'Invalid';
    }
  };

  const renderVisualization = () => {
    if (!selectedReport || reportData.length === 0) return null;

    if (selectedReport.visualization === 'table') {
      return (
        <div className="overflow-x-auto bg-white rounded-3xl border border-[#5A5A40]/10 overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#f5f5f0]/50 border-b border-[#5A5A40]/10">
              <tr>
                {selectedReport.fields.map(field => (
                  <th key={field} className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/60">
                    {field === 'constituentName' ? 'Constituent' : field}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f5f5f0]">
              {reportData.map((row, idx) => (
                <tr key={idx} className="hover:bg-[#f5f5f0]/20 transition-colors">
                  {selectedReport.fields.map(field => (
                    <td key={field} className="px-6 py-4 text-sm text-[#2d2d2a] font-medium">
                      {field === 'amount' ? settingsService.formatCurrency(row[field], currency) :
                       field === 'timestamp' || field === 'checkIn' ? safeFormat(row[field], 'MMM d, yyyy') :
                       String(row[field] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (selectedReport.visualization === 'bar' || selectedReport.visualization === 'line') {
      // Group by date for charts
      const groupedData = reportData.reduce((acc: any, item) => {
        const timestamp = item.timestamp || item.checkIn;
        if (!timestamp) return acc;
        const date = safeFormat(timestamp, 'MMM d');
        if (date === 'Invalid' || date === 'N/A') return acc;
        
        if (!acc[date]) acc[date] = { name: date, value: 0 };
        acc[date].value += item.amount || item.hours || 1;
        return acc;
      }, {});

      const chartData = Object.values(groupedData).reverse().slice(-7);

      return (
        <div className="h-[400px] w-full bg-white p-6 rounded-3xl border border-[#5A5A40]/10 shadow-sm">
          <ResponsiveContainer width="100%" height="100%">
            {selectedReport.visualization === 'bar' ? (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E8DF" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#5A5A4066' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#5A5A4066' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px -10px rgba(90,90,64,0.2)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#5A5A40' }}
                />
                <Bar dataKey="value" fill="#5A5A40" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            ) : (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E8DF" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#5A5A4066' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#5A5A4066' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px -10px rgba(90,90,64,0.2)' }}
                />
                <Line type="monotone" dataKey="value" stroke="#5A5A40" strokeWidth={3} dot={{ fill: '#5A5A40', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      );
    }

    if (selectedReport.visualization === 'pie') {
      const groupedData = reportData.reduce((acc: any, item) => {
        const key = item.type || item.method || item.status || 'Other';
        if (!acc[key]) acc[key] = { name: key, value: 0 };
        acc[key].value++;
        return acc;
      }, {});

      const chartData = Object.values(groupedData);

      return (
        <div className="h-[400px] w-full bg-white p-6 rounded-3xl border border-[#5A5A40]/10 shadow-sm flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={120}
                paddingAngle={5}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px -10px rgba(90,90,64,0.2)' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 flex flex-col lg:flex-row gap-6 md:gap-8">
      {/* Sidebar List */}
      <div className="w-full lg:w-80 flex-shrink-0 space-y-6 md:space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-xl md:text-2xl font-bold brand-font italic text-[#2d2d2a]">Reports</h1>
          <button 
            onClick={() => {
              setIsBuilding(true);
              setSelectedReport(null);
            }}
            className="p-2 bg-[#5A5A40] text-white rounded-full hover:bg-[#4a4a35] transition-all shadow-lg shadow-[#5A5A40]/20"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-[10px] font-bold uppercase text-[#5A5A40]/60 tracking-widest ml-1">Stored Reports</h3>
            <div className="space-y-2">
              {reports.map(report => (
                <div
                  key={report.id}
                  onClick={() => handleSelectReport(report)}
                  className={`group flex items-center justify-between p-4 cursor-pointer rounded-2xl border transition-all ${
                    selectedReport?.id === report.id 
                    ? 'bg-white border-[#5A5A40]/20 shadow-md shadow-[#5A5A40]/5' 
                    : 'bg-[#f5f5f0]/50 border-transparent hover:bg-white hover:border-[#5A5A40]/10 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-xl ${selectedReport?.id === report.id ? 'bg-[#5A5A40] text-white' : 'bg-[#e8e8df] text-[#5A5A40]'}`}>
                      {report.visualization === 'table' && <LayoutList className="w-4 h-4" />}
                      {report.visualization === 'bar' && <BarChart3 className="w-4 h-4" />}
                      {report.visualization === 'line' && <TrendingUp className="w-4 h-4" />}
                      {report.visualization === 'pie' && <PieChartIcon className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#2d2d2a]">{report.name}</p>
                      <p className="text-[9px] uppercase font-bold text-[#5A5A40]/40 tracking-wider capitalize">{report.type}</p>
                    </div>
                  </div>
                  {!report.id.startsWith('r') && (
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button 
                        onClick={(e) => handleEditReport(report, e)}
                        className="p-2 text-[#5A5A40]/60 hover:text-[#5A5A40] hover:bg-[#5A5A40]/5 rounded-lg transition-all"
                        title="Edit Report"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => handleDeleteReport(report.id, e)}
                        className="p-2 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete Report"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  <ChevronRight className={`w-4 h-4 text-[#5A5A40]/20 ${selectedReport?.id === report.id ? 'opacity-100' : 'opacity-0'}`} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main View */}
      <div className="flex-1 min-w-0">
        {isBuilding ? (
          <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] border border-[#5A5A40]/10 shadow-xl p-6 md:p-10 space-y-6 md:space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-xl md:text-2xl font-bold brand-font italic text-[#2d2d2a]">
                  {editingReport ? 'Edit Custom Report' : 'Build Custom Report'}
                </h2>
                <p className="text-[#5A5A40]/60 text-xs md:text-sm">Design your own view and save it for later.</p>
              </div>
              <button 
                onClick={resetBuilder}
                className="p-2 md:p-3 text-[#5A5A40]/40 hover:text-[#5A5A40] hover:bg-[#f5f5f0] rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-[#5A5A40]/60 tracking-widest ml-1">Report Name</label>
                  <input 
                    type="text" 
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Monthly Performance"
                    className="w-full px-6 py-4 rounded-2xl bg-[#f5f5f0] border-transparent focus:bg-white focus:ring-2 focus:ring-[#5A5A40]/20 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-[#5A5A40]/60 tracking-widest ml-1">Data Source</label>
                  <div className="flex p-1 bg-[#f5f5f0] rounded-2xl">
                    <button 
                      onClick={() => {
                        setNewType('donations');
                        setNewFields([]);
                      }}
                      className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-xl transition-all ${newType === 'donations' ? 'bg-white text-[#5A5A40] shadow-sm' : 'text-[#5A5A40]/40'}`}
                    >
                      Donations
                    </button>
                    <button 
                      onClick={() => {
                        setNewType('volunteers');
                        setNewFields([]);
                      }}
                      className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-xl transition-all ${newType === 'volunteers' ? 'bg-white text-[#5A5A40] shadow-sm' : 'text-[#5A5A40]/40'}`}
                    >
                      Volunteers
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-[#5A5A40]/60 tracking-widest ml-1">Visualization Style</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'table', icon: LayoutList, label: 'Table' },
                      { id: 'bar', icon: BarChart3, label: 'Bar' },
                      { id: 'line', icon: TrendingUp, label: 'Trend' },
                      { id: 'pie', icon: PieChartIcon, label: 'Pie' }
                    ].map(viz => (
                      <button
                        key={viz.id}
                        onClick={() => setNewViz(viz.id as any)}
                        className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${
                          newViz === viz.id 
                          ? 'bg-[#5A5A40] text-white border-transparent' 
                          : 'bg-[#f5f5f0] text-[#5A5A40]/40 border-transparent hover:bg-white hover:border-[#5A5A40]/20'
                        }`}
                      >
                        <viz.icon className="w-5 h-5 mb-2" />
                        <span className="text-[9px] font-bold uppercase tracking-widest">{viz.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-[#5A5A40]/60 tracking-widest ml-1">Select Fields</label>
                  <div className="space-y-2 bg-[#f5f5f0]/50 p-6 rounded-3xl border border-[#5A5A40]/5">
                    {(newType === 'donations' ? donationFields : volunteerFields).map(field => (
                      <label key={field.id} className="flex items-center space-x-3 cursor-pointer group p-2 hover:bg-white rounded-xl transition-all">
                        <input 
                          type="checkbox"
                          checked={newFields.includes(field.id)}
                          onChange={() => {
                            if (newFields.includes(field.id)) {
                              setNewFields(newFields.filter(f => f !== field.id));
                            } else {
                              setNewFields([...newFields, field.id]);
                            }
                          }}
                          className="w-4 h-4 rounded border-[#5A5A40]/20 text-[#5A5A40] focus:ring-[#5A5A40]/20"
                        />
                        <span className="text-sm font-bold text-[#2d2d2a]/80 group-hover:text-[#5A5A40] transition-colors">{field.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    onClick={handleSaveReport}
                    disabled={!newName || newFields.length === 0}
                    className="w-full py-5 bg-[#5A5A40] text-white rounded-full font-bold hover:bg-[#4a4a35] transition-all shadow-2xl shadow-[#5A5A40]/20 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-5 h-5 mr-3" />
                    Save Configuration
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : selectedReport ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-2 duration-300">
            <div className="bg-white rounded-2xl md:rounded-[2rem] border border-[#5A5A40]/10 shadow-lg p-5 md:p-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
                <div className="flex items-center space-x-3 md:space-x-4">
                  <div className="p-3 md:p-4 bg-[#5A5A40] text-white rounded-xl md:rounded-[1.5rem]">
                    {selectedReport.visualization === 'table' && <LayoutList className="w-5 h-5 md:w-6 md:h-6" />}
                    {selectedReport.visualization === 'bar' && <BarChart3 className="w-5 h-5 md:w-6 md:h-6" />}
                    {selectedReport.visualization === 'line' && <TrendingUp className="w-5 h-5 md:w-6 md:h-6" />}
                    {selectedReport.visualization === 'pie' && <PieChartIcon className="w-5 h-5 md:w-6 md:h-6" />}
                  </div>
                  <div>
                    <h2 className="text-lg md:text-2xl font-bold brand-font italic text-[#2d2d2a]">{selectedReport.name}</h2>
                    <p className="text-[#5A5A40]/40 text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em]">
                      Generated: {safeFormat(selectedReport.createdAt, 'MMM d, yyyy HH:mm')}
                    </p>
                  </div>
                </div>
                <div className="flex w-full sm:w-auto">
                  <button 
                    onClick={() => {
                      if (!selectedReport || reportData.length === 0) return;
                      
                      const headers = selectedReport.fields.join(',');
                      const rows = reportData.map(row => 
                        selectedReport.fields.map(field => {
                          let val = row[field];
                          if (field === 'timestamp' || field === 'checkIn') {
                            val = format(new Date(val), 'yyyy-MM-dd HH:mm');
                          }
                          // Escape quotes and wrap in quotes if contains comma
                          const stringVal = String(val ?? '');
                          return stringVal.includes(',') ? `"${stringVal.replace(/"/g, '""')}"` : stringVal;
                        }).join(',')
                      );
                      
                      const csvContent = [headers, ...rows].join('\n');
                      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                      const link = document.createElement('a');
                      const url = URL.createObjectURL(blob);
                      
                      link.setAttribute('href', url);
                      link.setAttribute('download', `${selectedReport.name.toLowerCase().replace(/\s+/g, '_')}_export.csv`);
                      link.style.visibility = 'hidden';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-5 py-3 bg-[#f5f5f0] text-[#5A5A40] rounded-full hover:bg-[#e8e8df] transition-all text-sm font-bold"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              {renderVisualization()}
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-10 md:p-20 space-y-6">
            <div className="p-6 md:p-8 bg-[#f5f5f0] text-[#5A5A40]/20 rounded-full">
              <Database className="w-12 h-12 md:w-16 md:h-16" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl md:text-2xl font-bold brand-font italic text-[#2d2d2a]">Statistical Intelligence</h3>
              <p className="text-[#5A5A40]/60 max-w-sm text-sm">Select a report or create a custom builder to analyze your organization's impact.</p>
            </div>
            <button 
              onClick={() => setIsBuilding(true)}
              className="px-6 md:px-8 py-3 md:py-4 bg-white border border-[#5A5A40]/10 text-[#5A5A40] rounded-full font-bold hover:bg-[#f5f5f0] transition-all shadow-sm flex items-center"
            >
              <Plus className="w-4 h-4 mr-3" />
              Build New Perspective
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
