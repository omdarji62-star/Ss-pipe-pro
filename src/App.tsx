import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Info, 
  Table as TableIcon, 
  Calculator, 
  ArrowRightLeft, 
  ChevronDown,
  Download,
  Settings2,
  Maximize2,
  Minimize2,
  FileText,
  FileSpreadsheet,
  Printer,
  Plus,
  Trash2,
  X,
  Save,
  History,
  Monitor,
  Share2,
  Copy,
  CheckCircle2,
  MessageCircle
} from 'lucide-react';
import { PIPE_DATA, SCHEDULES, type PipeSize } from './data/pipeData';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface SavedEntry {
  id: string;
  nps: string;
  dn: number;
  od: number;
  schedule: string;
  thickness: string;
  timestamp: number;
}

export default function App() {
  const [nps, setNps] = useState<string>('');
  const [dn, setDn] = useState<string>('');
  const [od, setOd] = useState<string>('');
  const [schedule, setSchedule] = useState<string>('40s');
  const [thickness, setThickness] = useState<string>('');
  const [selectedPipe, setSelectedPipe] = useState<PipeSize | null>(null);
  const [viewMode, setViewMode] = useState<'calculator' | 'chart'>('calculator');
  const [searchTerm, setSearchTerm] = useState('');
  const [savedEntries, setSavedEntries] = useState<SavedEntry[]>([]);
  const [copied, setCopied] = useState(false);

  const sharedUrl = typeof window !== 'undefined' ? window.location.origin : '';

  // Load saved entries from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('pipe_saved_entries');
    if (saved) {
      try {
        setSavedEntries(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved entries", e);
      }
    }
  }, []);

  // Save entries to localStorage when they change
  useEffect(() => {
    localStorage.setItem('pipe_saved_entries', JSON.stringify(savedEntries));
  }, [savedEntries]);

  // Sync inputs when one changes
  const handleNpsChange = (val: string) => {
    setNps(val);
    const pipe = PIPE_DATA.find(p => p.nps === val);
    if (pipe) {
      setDn(pipe.dn.toString());
      setOd(pipe.od.toString());
      setSelectedPipe(pipe);
    } else {
      setDn('');
      setOd('');
      setSelectedPipe(null);
    }
  };

  const handleDnChange = (val: string) => {
    setDn(val);
    const pipe = PIPE_DATA.find(p => p.dn.toString() === val);
    if (pipe) {
      setNps(pipe.nps);
      setOd(pipe.od.toString());
      setSelectedPipe(pipe);
    } else {
      setNps('');
      setOd('');
      setSelectedPipe(null);
    }
  };

  const handleOdChange = (val: string) => {
    setOd(val);
    const pipe = PIPE_DATA.find(p => p.od.toString() === val);
    if (pipe) {
      setNps(pipe.nps);
      setDn(pipe.dn.toString());
      setSelectedPipe(pipe);
    } else {
      setNps('');
      setDn('');
      setSelectedPipe(null);
    }
  };

  // Update thickness when pipe or schedule changes
  useEffect(() => {
    if (selectedPipe && schedule) {
      const t = selectedPipe.thickness[schedule];
      setThickness(t ? t.toString() : 'N/A');
    } else {
      setThickness('');
    }
  }, [selectedPipe, schedule]);

  const saveCurrentEntry = () => {
    if (!selectedPipe || !thickness || thickness === 'N/A') return;
    
    const newEntry: SavedEntry = {
      id: Math.random().toString(36).substr(2, 9),
      nps: selectedPipe.nps,
      dn: selectedPipe.dn,
      od: selectedPipe.od,
      schedule: schedule,
      thickness: thickness,
      timestamp: Date.now()
    };
    
    setSavedEntries([newEntry, ...savedEntries]);
  };

  const deleteEntry = (id: string) => {
    setSavedEntries(savedEntries.filter(e => e.id !== id));
  };

  const clearAllEntries = () => {
    if (window.confirm("Are you sure you want to delete all saved entries?")) {
      setSavedEntries([]);
    }
  };

  const filteredData = useMemo(() => {
    return PIPE_DATA.filter(p => 
      p.nps.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.dn.toString().includes(searchTerm) ||
      p.od.toString().includes(searchTerm)
    );
  }, [searchTerm]);

  // Export Functions (Targeted at Saved Entries)
  const exportSavedToExcel = () => {
    if (savedEntries.length === 0) return;
    
    const data = savedEntries.map((e, index) => ({
      "Sr. No": index + 1,
      "NPS (in)": e.nps,
      "DN (mm)": e.dn,
      "OD (mm)": e.od,
      "Schedule": e.schedule,
      "Thickness (mm)": e.thickness,
      "Date": new Date(e.timestamp).toLocaleString()
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Saved Calculations");
    XLSX.writeFile(workbook, "Saved_Pipe_Calculations.xlsx");
  };

  const exportSavedToPDF = () => {
    if (savedEntries.length === 0) return;
    
    const doc = new jsPDF('p', 'mm', 'a4');
    doc.setFontSize(16);
    doc.text("Saved Pipe Dimension Calculations", 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);
    
    const head = [["Sr. No", "NPS", "DN", "OD", "Schedule", "Thickness (mm)"]];
    const body = savedEntries.map((e, index) => [
      index + 1,
      e.nps + '"',
      e.dn,
      e.od,
      e.schedule,
      e.thickness
    ]);

    autoTable(doc, {
      head: head,
      body: body,
      startY: 30,
      headStyles: { fillColor: [37, 99, 235] }
    });

    doc.save("Saved_Pipe_Calculations.pdf");
  };

  const handlePrintSaved = () => {
    window.print();
  };

  const copyLink = () => {
    navigator.clipboard.writeText(sharedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    const text = `Check out this SS Pipe Dimension Pro app: ${sharedUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] text-[#1D1D1F] font-sans selection:bg-blue-100 print:bg-white">
      {/* Desktop Sidebar Navigation */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-[#1D1D1F] text-white z-50 hidden lg:flex flex-col print:hidden">
        <div className="p-6 flex items-center gap-3 border-b border-white/10">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Monitor className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">Pipe Pro</h1>
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">Desktop Edition</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setViewMode('calculator')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${viewMode === 'calculator' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
          >
            <Calculator className="w-5 h-5" />
            Calculator
          </button>
          <button 
            onClick={() => setViewMode('chart')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${viewMode === 'chart' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
          >
            <TableIcon className="w-5 h-5" />
            Reference Chart
          </button>
        </nav>

        <div className="p-4 space-y-4 border-t border-white/10">
          <div className="bg-white/5 rounded-2xl p-4">
            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Share App</h4>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={copyLink}
                className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all gap-1"
              >
                {copied ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-blue-400" />}
                <span className="text-[9px] font-bold uppercase tracking-tighter">{copied ? 'Copied' : 'Copy Link'}</span>
              </button>
              <button 
                onClick={shareWhatsApp}
                className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all gap-1"
              >
                <MessageCircle className="w-4 h-4 text-green-500" />
                <span className="text-[9px] font-bold uppercase tracking-tighter">WhatsApp</span>
              </button>
            </div>
          </div>

          <div className="bg-white/5 rounded-2xl p-4">
            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Saved Items</h4>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{savedEntries.length}</span>
              <History className="w-5 h-5 text-blue-400" />
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="lg:pl-64 min-h-screen flex flex-col">
        {/* Header (Mobile & Desktop Top Bar) */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40 print:hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="lg:hidden flex items-center gap-3">
              <Calculator className="w-6 h-6 text-blue-600" />
              <h1 className="text-lg font-bold">Pipe Pro</h1>
            </div>
            
            <div className="hidden lg:block">
              <h2 className="text-sm font-semibold text-gray-500">
                {viewMode === 'calculator' ? 'Dimension Calculator' : 'Master Reference Chart'}
              </h2>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-xs font-medium text-gray-400 hidden sm:block">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
              <div className="lg:hidden flex items-center gap-2">
                <button onClick={shareWhatsApp} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all">
                  <MessageCircle className="w-5 h-5" />
                </button>
                <button onClick={copyLink} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                  <Copy className="w-5 h-5" />
                </button>
              </div>
              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors hidden sm:block">
                <Settings2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full print:p-0">
          <AnimatePresence mode="wait">
            {viewMode === 'calculator' ? (
              <motion.div 
                key="calculator"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4 sm:space-y-8"
              >
                {/* Top Section: Inputs */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-8">
                  <div className="xl:col-span-2 space-y-4 sm:space-y-6">
                    <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-sm border border-gray-200">
                      <div className="flex items-center justify-between mb-4 sm:mb-8">
                        <div className="flex items-center gap-2">
                          <ArrowRightLeft className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                          <h2 className="text-base sm:text-lg font-bold">Size Selection</h2>
                        </div>
                        <span className="text-[9px] sm:text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full uppercase tracking-widest">Step 1</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                        <div className="space-y-1 sm:space-y-2">
                          <label className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest">NPS (Inch)</label>
                          <div className="relative">
                            <select 
                              value={nps}
                              onChange={(e) => handleNpsChange(e.target.value)}
                              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 sm:px-4 py-2 sm:py-3 appearance-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none font-medium text-sm"
                            >
                              <option value="">Select NPS</option>
                              {PIPE_DATA.map(p => (
                                <option key={p.nps} value={p.nps}>{p.nps}"</option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-gray-400 pointer-events-none" />
                          </div>
                        </div>

                        <div className="space-y-1 sm:space-y-2">
                          <label className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest">DN (mm)</label>
                          <div className="relative">
                            <select 
                              value={dn}
                              onChange={(e) => handleDnChange(e.target.value)}
                              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 sm:px-4 py-2 sm:py-3 appearance-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none font-medium text-sm"
                            >
                              <option value="">Select DN</option>
                              {PIPE_DATA.map(p => (
                                <option key={p.dn} value={p.dn}>{p.dn}</option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-gray-400 pointer-events-none" />
                          </div>
                        </div>

                        <div className="space-y-1 sm:space-y-2">
                          <label className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest">OD (mm)</label>
                          <div className="relative">
                            <select 
                              value={od}
                              onChange={(e) => handleOdChange(e.target.value)}
                              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 sm:px-4 py-2 sm:py-3 appearance-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none font-medium text-sm"
                            >
                              <option value="">Select OD</option>
                              {PIPE_DATA.map(p => (
                                <option key={p.od} value={p.od}>{p.od}</option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-gray-400 pointer-events-none" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-sm border border-gray-200">
                      <div className="flex items-center justify-between mb-4 sm:mb-8">
                        <div className="flex items-center gap-2">
                          <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                          <h2 className="text-base sm:text-lg font-bold">Schedule & Result</h2>
                        </div>
                        <span className="text-[9px] sm:text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full uppercase tracking-widest">Step 2</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
                        <div className="space-y-3 sm:space-y-4">
                          <label className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest">Select Schedule</label>
                          <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                            {SCHEDULES.map(sch => (
                              <button
                                key={sch}
                                onClick={() => setSchedule(sch)}
                                className={`py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold transition-all border ${
                                  schedule === sch 
                                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200' 
                                    : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300'
                                }`}
                              >
                                {sch}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-col gap-3 sm:gap-4">
                          <div className="bg-blue-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 flex flex-col justify-center items-center border border-blue-100 flex-1">
                            <span className="text-[9px] sm:text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Thickness</span>
                            <div className="flex items-baseline gap-1">
                              <span className="text-3xl sm:text-5xl font-black text-blue-600 tracking-tighter">{thickness || '--'}</span>
                              <span className="text-xs sm:text-sm font-bold text-blue-400">mm</span>
                            </div>
                          </div>
                          
                          <button 
                            onClick={saveCurrentEntry}
                            disabled={!selectedPipe || !thickness || thickness === 'N/A'}
                            className="w-full bg-[#1D1D1F] hover:bg-black text-white py-3 sm:py-4 rounded-xl sm:rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-xl shadow-gray-200"
                          >
                            <Save className="w-4 h-4 sm:w-5 sm:h-5" />
                            Save Calculation
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sidebar: Quick Info */}
                  <div className="space-y-4 sm:space-y-6">
                    <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-sm border border-gray-200">
                      <h3 className="text-xs sm:text-sm font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
                        <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                        Active Parameters
                      </h3>
                      <div className="space-y-2 sm:space-y-4">
                        <div className="flex justify-between items-center py-1.5 sm:py-2 border-b border-gray-50">
                          <span className="text-gray-400 text-[10px] sm:text-xs font-medium">NPS</span>
                          <span className="font-mono font-bold text-xs sm:text-sm">{nps || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center py-1.5 sm:py-2 border-b border-gray-50">
                          <span className="text-gray-400 text-[10px] sm:text-xs font-medium">DN</span>
                          <span className="font-mono font-bold text-xs sm:text-sm">{dn || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center py-1.5 sm:py-2 border-b border-gray-50">
                          <span className="text-gray-400 text-[10px] sm:text-xs font-medium">OD</span>
                          <span className="font-mono font-bold text-xs sm:text-sm">{od || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center py-1.5 sm:py-2">
                          <span className="text-gray-400 text-[10px] sm:text-xs font-medium">Schedule</span>
                          <span className="font-mono font-bold text-xs sm:text-sm text-blue-600">{schedule}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xl shadow-blue-200">
                      <h4 className="text-xs sm:text-sm font-bold mb-2 sm:mb-4">Export Saved List</h4>
                      <p className="text-[10px] sm:text-xs text-blue-100 mb-4 sm:mb-6 leading-relaxed">Export your saved calculations directly to professional formats.</p>
                      <div className="grid grid-cols-2 gap-2 sm:gap-3">
                        <button 
                          onClick={exportSavedToPDF}
                          disabled={savedEntries.length === 0}
                          className="bg-white/10 hover:bg-white/20 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-30"
                        >
                          <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          PDF
                        </button>
                        <button 
                          onClick={exportSavedToExcel}
                          disabled={savedEntries.length === 0}
                          className="bg-white/10 hover:bg-white/20 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-30"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          Excel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Section: Saved Calculations List */}
                <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="bg-gray-100 p-1.5 sm:p-2 rounded-lg">
                        <History className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-lg font-bold">Saved Calculations</h3>
                        <p className="text-[9px] sm:text-xs text-gray-400 font-medium">Session History</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 sm:gap-2">
                      <button 
                        onClick={handlePrintSaved}
                        disabled={savedEntries.length === 0}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg sm:rounded-xl transition-all disabled:opacity-30"
                      >
                        <Printer className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                      <button 
                        onClick={clearAllEntries}
                        disabled={savedEntries.length === 0}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg sm:rounded-xl transition-all disabled:opacity-30"
                      >
                        <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[600px] sm:min-w-0">
                      <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100">
                          <th className="px-4 sm:px-8 py-3 sm:py-4 text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sr. No</th>
                          <th className="px-4 sm:px-8 py-3 sm:py-4 text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest">NPS</th>
                          <th className="px-4 sm:px-8 py-3 sm:py-4 text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest">DN</th>
                          <th className="px-4 sm:px-8 py-3 sm:py-4 text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest">OD</th>
                          <th className="px-4 sm:px-8 py-3 sm:py-4 text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest">Schedule</th>
                          <th className="px-4 sm:px-8 py-3 sm:py-4 text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest">Thickness</th>
                          <th className="px-4 sm:px-8 py-3 sm:py-4 text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {savedEntries.map((e, idx) => (
                          <motion.tr 
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            key={e.id} 
                            className="hover:bg-gray-50/50 transition-colors group"
                          >
                            <td className="px-4 sm:px-8 py-3 sm:py-4 text-[10px] sm:text-xs font-medium text-gray-400">{savedEntries.length - idx}</td>
                            <td className="px-4 sm:px-8 py-3 sm:py-4 text-xs sm:text-sm font-bold text-gray-900">{e.nps}"</td>
                            <td className="px-4 sm:px-8 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 font-mono">{e.dn}</td>
                            <td className="px-4 sm:px-8 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 font-mono">{e.od}</td>
                            <td className="px-4 sm:px-8 py-3 sm:py-4 text-xs sm:text-sm">
                              <span className="bg-blue-50 text-blue-600 px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg font-bold text-[9px] sm:text-[10px]">{e.schedule}</span>
                            </td>
                            <td className="px-4 sm:px-8 py-3 sm:py-4 text-xs sm:text-sm font-bold text-blue-600 font-mono">{e.thickness} mm</td>
                            <td className="px-4 sm:px-8 py-3 sm:py-4 text-right">
                              <button 
                                onClick={() => deleteEntry(e.id)}
                                className="p-1.5 sm:p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-100 sm:opacity-0 group-hover:opacity-100"
                              >
                                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              </button>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                    
                    {savedEntries.length === 0 && (
                      <div className="py-20 text-center">
                        <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                          <History className="w-8 h-8 text-gray-200" />
                        </div>
                        <p className="text-gray-400 text-sm font-medium">No calculations saved yet.</p>
                        <p className="text-gray-300 text-[10px] mt-1 uppercase tracking-widest">Perform a calculation and click "Save"</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="chart"
                initial={{ opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.99 }}
                className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden"
              >
                <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="text"
                      placeholder="Search sizes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button 
                      onClick={() => setViewMode('calculator')}
                      className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-200"
                    >
                      <Calculator className="w-4 h-4" />
                      Back to Calculator
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto print:overflow-visible">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/50 border-b border-gray-100 print:bg-white">
                        <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest sticky left-0 bg-gray-50 z-10 print:static print:text-black">Sr. No</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest sticky left-16 bg-gray-50 z-10 print:static print:text-black">NPS (in)</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest print:text-black">DN (mm)</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest print:text-black">OD (mm)</th>
                        {SCHEDULES.map(sch => (
                          <th key={sch} className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center print:text-black">Sch {sch}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 print:divide-gray-200">
                      {filteredData.map((p, idx) => (
                        <tr 
                          key={p.nps} 
                          className={`hover:bg-blue-50/50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'} print:bg-white`}
                        >
                          <td className="px-6 py-4 text-xs text-gray-400 sticky left-0 bg-inherit z-10 border-r border-gray-100 print:static print:text-black">{idx + 1}</td>
                          <td className="px-6 py-4 text-sm font-bold text-gray-900 sticky left-16 bg-inherit z-10 border-r border-gray-100 print:static print:text-black">{p.nps}"</td>
                          <td className="px-6 py-4 text-sm text-gray-600 font-mono print:text-black">{p.dn}</td>
                          <td className="px-6 py-4 text-sm text-gray-600 font-mono print:text-black">{p.od}</td>
                          {SCHEDULES.map(sch => (
                            <td key={sch} className="px-6 py-4 text-sm text-center">
                              {p.thickness[sch] ? (
                                <span className="font-mono text-gray-900 font-medium print:text-black">{p.thickness[sch]}</span>
                              ) : (
                                <span className="text-gray-200 print:text-gray-400">—</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-gray-200 mt-auto print:hidden">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 opacity-30">
              <Monitor className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Pipe Pro Desktop Edition</span>
            </div>
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">
              © {new Date().getFullYear()} Technical Reference Tool • All Dimensions in mm
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
