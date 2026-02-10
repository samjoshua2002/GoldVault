'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Users,
  Coins,
  CheckCircle,
  TrendingUp,
  Plus,
  Search,
  BadgeIndianRupee,
  ArrowUpRight
} from 'lucide-react';
import { differenceInMonths, startOfMonth } from 'date-fns';

interface Loan {
  _id: string;
  loanId: string;
  principalAmount: number;
  currentInterest: number;
  totalAmount: number;
  amountPaid: number;
  status: string;
  startDate: string;
  userId: {
    _id: string;
    name: string;
    phone: string;
    address: string;
  };
  goldId: {
    category: string;
    goldType: string;
    weight: number;
  };
}

interface Stats {
  activeLoansCount: number;
  completedLoansCount: number;
  totalPrincipal: number;
  totalInterest: number;
  totalAmount: number;
}

interface ExistingUser {
  _id: string;
  name: string;
  phone: string;
  address: string;
}

export default function Dashboard() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [completedLoans, setCompletedLoans] = useState<any[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewLoanModal, setShowNewLoanModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');

  // Existing users for dropdown
  const [existingUsers, setExistingUsers] = useState<ExistingUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    userName: '', phone: '', address: '',
    goldId: '', category: '', goldType: '22K', weight: '',
    principalAmount: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [loansRes, statsRes, completedRes, usersRes] = await Promise.all([
        fetch('/api/loans/active'),
        fetch('/api/dashboard/stats'),
        fetch('/api/loans/completed'),
        fetch('/api/users')
      ]);

      if (!loansRes.ok || !statsRes.ok || !completedRes.ok || !usersRes.ok) {
        throw new Error('Database connection failed or API error occurred.');
      }

      const loansData = await loansRes.json();
      const statsData = await statsRes.json();
      const completedData = await completedRes.json();
      const usersData = await usersRes.json();

      setLoans(Array.isArray(loansData) ? loansData : []);
      setStats(statsData);
      setCompletedLoans(Array.isArray(completedData) ? completedData : []);
      setExistingUsers(Array.isArray(usersData) ? usersData : []);

      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Unknown error');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setShowNewLoanModal(true);
      router.replace('/', { scroll: false });
    }
  }, [searchParams, router]);

  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/loans/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, weight: Number(formData.weight), principalAmount: Number(formData.principalAmount) })
      });
      if (res.ok) {
        setShowNewLoanModal(false);
        fetchData();
        setFormData({
          userName: '', phone: '', address: '',
          goldId: '', category: '', goldType: '22K', weight: '',
          principalAmount: ''
        });
        setSelectedUserId('');
      } else {
        const err = await res.json();
        alert('Error: ' + err.error);
      }
    } catch (error) {
      console.error('Error creating loan:', error);
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan) return;

    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    if (amount > selectedLoan.totalAmount) {
      alert(`Payment cannot exceed total due amount: ₹${selectedLoan.totalAmount}`);
      return;
    }

    try {
      const res = await fetch(`/api/loans/${selectedLoan._id}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      });

      const data = await res.json();

      if (res.ok) {
        setShowPaymentModal(false);
        setPaymentAmount('');
        fetchData();
      } else {
        alert(data?.error || 'Payment failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Network error occurred');
    }
  };

  const filteredLoans = loans.filter(loan =>
    loan.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loan.loanId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loan.userId?.phone?.includes(searchTerm)
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Dashboard Overview</h1>
          <p className="text-sm text-muted font-medium mt-1.5 text-muted-foreground">Real-time status of your gold vault and active protocols</p>
        </div>
        <button
          onClick={() => setShowNewLoanModal(true)}
          className="w-full md:w-auto flex items-center justify-center gap-2 gold-gradient text-white px-8 py-4 rounded-2xl font-bold text-sm shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
        >
          <Plus size={20} />
          Create New Loan
        </button>
      </div>



      {/* Main Content Area */}
      <div className="w-full space-y-8">
        <div className="glass-card rounded-[2.5rem] border-border overflow-hidden">
          <div className="p-8 border-b border-border flex flex-col md:flex-row justify-between items-center gap-6 bg-muted/5">
            <div className="flex gap-2 bg-muted/20 p-2 rounded-2xl">
              <TabButton active={activeTab === 'active'} onClick={() => setActiveTab('active')}>
                Active Loans
              </TabButton>
              <TabButton active={activeTab === 'completed'} onClick={() => setActiveTab('completed')}>
                History
              </TabButton>
            </div>

            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
              <input
                type="text"
                placeholder="Search by name, ID or phone..."
                className="w-full bg-muted/20 border-2 border-border rounded-2xl py-3.5 pl-12 pr-6 text-sm font-bold text-foreground focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all placeholder:text-muted/40"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/30 text-muted text-xs font-semibold border-b border-border">
                  <th className="p-6 pl-10">Customer Name</th>
                  <th className="p-6">Gold Item</th>
                  <th className="p-6">Loan Amount</th>
                  <th className="p-6">Interest</th>
                  <th className="p-6">Total Owed</th>
                  <th className="p-6">Date Started</th>
                  <th className="p-6 text-right pr-10">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {loading ? (
                  <tr><td colSpan={7} className="p-20 text-center text-muted font-bold italic animate-pulse">Accessing Secure Records...</td></tr>
                ) : error ? (
                  <tr>
                    <td colSpan={7} className="p-20 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <p className="text-red-500 font-bold">Failed to connect to database</p>
                        <p className="text-xs text-muted max-w-sm">{error}</p>
                        <button onClick={() => fetchData()} className="bg-primary text-white px-6 py-2 rounded-xl text-xs font-bold">Retry Connection</button>
                      </div>
                    </td>
                  </tr>
                ) : activeTab === 'active' ? (
                  filteredLoans.length === 0 ? (
                    <tr><td colSpan={7} className="p-20 text-center text-muted font-bold italic">No active holdings found.</td></tr>
                  ) : (
                    filteredLoans.map((loan) => {
                      const months = differenceInMonths(startOfMonth(new Date()), startOfMonth(new Date(loan.startDate)));
                      return (
                        <tr
                          key={loan._id}
                          className="hover:bg-muted/20 transition-all group border-b border-border/50 cursor-pointer relative"
                          onClick={() => router.push(`/users/${loan.userId?._id}`)}
                        >
                          <td className="p-6 pl-10">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center text-white font-black text-xs shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                                {loan.userId?.name?.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-bold text-foreground text-sm flex items-center gap-2">
                                  {loan.userId?.name}
                                  <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                                </div>
                                <div className="text-xs text-muted font-medium mt-0.5">{loan.userId?.phone}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-6">
                            <div className="text-sm font-semibold text-foreground/90">{loan.goldId?.category}</div>
                            <div className="text-xs text-muted font-medium mt-0.5">{loan.goldId?.goldType} • {loan.goldId?.weight}g</div>
                          </td>
                          <td className="p-6 text-foreground font-bold text-sm">₹{loan.principalAmount?.toLocaleString()}</td>
                          <td className="p-6 text-emerald-600 font-bold text-sm">
                            + ₹{loan.currentInterest?.toLocaleString()}
                            <div className="text-[10px] text-muted font-medium mt-0.5">
                              {months} Month{months !== 1 ? 's' : ''}
                            </div>
                          </td>
                          <td className="p-6 font-bold text-foreground text-base">₹{loan.totalAmount?.toLocaleString()}</td>
                          <td className="p-6 text-xs font-medium text-muted">
                            {new Date(loan.startDate).toLocaleDateString()}
                          </td>
                          <td className="p-6 text-right pr-10">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedLoan(loan);
                                setShowPaymentModal(true);
                              }}
                              className="bg-muted/20 border-2 border-border text-foreground hover:text-white hover:bg-gold-gradient hover:border-transparent px-6 py-2 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 relative z-10"
                            >
                              Receive Payment
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )
                ) : (
                  completedLoans.length === 0 ? (
                    <tr><td colSpan={7} className="p-20 text-center text-muted font-bold italic">No historical data available.</td></tr>
                  ) : (
                    completedLoans.map((cl) => (
                      <tr
                        key={cl._id}
                        className="hover:bg-muted/5 transition-all opacity-80 hover:opacity-100 cursor-pointer group"
                        onClick={() => router.push(`/users/${cl.userId?._id}`)}
                      >
                        <td className="p-6 pl-10">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-muted/20 flex items-center justify-center text-muted font-black text-xs group-hover:bg-primary/20 group-hover:text-primary transition-all">
                              {cl.userId?.name?.charAt(0).toUpperCase() || 'C'}
                            </div>
                            <div>
                              <div className="font-bold text-foreground text-sm uppercase tracking-tight flex items-center gap-2">
                                {cl.userId?.name || 'Customer'}
                                <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                              </div>
                              <div className="text-[10px] text-muted font-mono mt-1">{cl.loanId}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-6">
                          <div className="text-xs font-bold text-foreground uppercase">{cl.goldId?.category || 'Unknown'}</div>
                          <div className="text-[10px] text-muted font-bold mt-1 tracking-tight">{cl.goldId?.weight}g</div>
                        </td>
                        <td className="p-6 text-muted font-bold text-sm">₹{cl.principalAmount?.toLocaleString()}</td>
                        <td className="p-6 text-green-500 font-bold text-sm">₹{(cl.totalPaid - cl.principalAmount).toLocaleString()}</td>
                        <td className="p-6 font-black text-foreground">₹{cl.totalPaid?.toLocaleString()}</td>
                        <td className="p-6 text-[10px] font-bold text-muted uppercase">
                          {new Date(cl.completedDate).toLocaleDateString()}
                          <div className="text-[9px] text-primary mt-1">{cl.durationMonths} Mo Duration</div>
                        </td>
                        <td className="p-6 text-right pr-10">
                          <span className="bg-green-500/10 text-green-500 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border border-green-500/20 shadow-sm">Settled</span>
                        </td>
                      </tr>
                    ))
                  )
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden">
            {loading ? (
              <div className="p-10 text-center text-muted font-bold italic animate-pulse">Syncing...</div>
            ) : error ? (
              <div className="p-10 text-center space-y-4">
                <p className="text-red-500 font-bold text-sm">System Link Failure</p>
                <p className="text-[10px] text-muted">{error}</p>
                <button onClick={() => fetchData()} className="w-full bg-primary text-white py-3 rounded-xl text-xs font-bold">Retry</button>
              </div>
            ) : activeTab === 'active' ? (
              filteredLoans.length === 0 ? (
                <div className="p-10 text-center text-muted font-bold italic">Empty vault.</div>
              ) : (
                <div className="divide-y divide-border/30">
                  {filteredLoans.map((loan) => {
                    const months = differenceInMonths(startOfMonth(new Date()), startOfMonth(new Date(loan.startDate)));
                    return (
                      <div
                        key={loan._id}
                        className="p-6 space-y-5 hover:bg-muted/10 transition-colors cursor-pointer"
                        onClick={() => router.push(`/users/${loan.userId?._id}`)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl gold-gradient flex items-center justify-center text-white font-black shadow-lg">
                              {loan.userId?.name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-black text-foreground uppercase tracking-tight flex items-center gap-2">
                                {loan.userId?.name}
                                <ArrowUpRight size={14} className="text-primary" />
                              </div>
                              <div className="text-[10px] text-muted font-mono mt-0.5">{loan.userId?.phone}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-black text-foreground text-lg">₹{loan.totalAmount?.toLocaleString()}</div>
                            <div className="text-[9px] text-muted font-black uppercase tracking-widest">Outstanding</div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <span className="bg-muted/10 border border-border px-3 py-1 rounded-xl text-[10px] font-black text-foreground uppercase tracking-tight">{loan.goldId?.category}</span>
                          <span className="bg-muted/10 border border-border px-3 py-1 rounded-xl text-[10px] font-black text-muted tracking-tight">{loan.goldId?.weight}g</span>
                          <span className="bg-primary/10 border border-primary/20 px-3 py-1 rounded-xl text-[10px] font-black text-primary uppercase tracking-tight">{months} Mo</span>
                        </div>

                        <div className="grid grid-cols-2 gap-6 pt-5 border-t border-border/30">
                          <div>
                            <span className="text-[9px] text-muted font-black uppercase tracking-widest block mb-1">Capital</span>
                            <span className="font-black text-foreground text-sm">₹{loan.principalAmount?.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-muted font-black uppercase tracking-widest block mb-1">Interest</span>
                            <span className="font-black text-green-500 text-sm">+ ₹{loan.currentInterest?.toLocaleString()}</span>
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLoan(loan);
                            setShowPaymentModal(true);
                          }}
                          className="w-full gold-gradient text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 transition-all active:scale-95 relative z-10"
                        >
                          Repay
                        </button>
                      </div>
                    )
                  })}
                </div>
              )
            ) : (
              completedLoans.length === 0 ? (
                <div className="p-10 text-center text-muted font-bold italic">No history.</div>
              ) : (
                <div className="divide-y divide-border/30">
                  {completedLoans.map((cl) => (
                    <div
                      key={cl._id}
                      className="p-6 space-y-4 opacity-80 hover:opacity-100 hover:bg-muted/5 transition-all cursor-pointer"
                      onClick={() => router.push(`/users/${cl.userId?._id}`)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-muted/20 flex items-center justify-center text-muted font-black">
                            {cl.userId?.name?.charAt(0).toUpperCase() || 'C'}
                          </div>
                          <div>
                            <div className="font-black text-foreground uppercase tracking-tight text-sm flex items-center gap-2">
                              {cl.userId?.name || 'Customer'}
                              <ArrowUpRight size={12} className="text-primary" />
                            </div>
                            <div className="text-[10px] text-muted font-mono mt-0.5">{cl.loanId}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-black text-foreground">₹{cl.totalPaid?.toLocaleString()}</div>
                          <div className="text-[9px] text-muted font-black uppercase tracking-widest">Paid</div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <span className="bg-muted/10 border border-border px-3 py-1 rounded-xl text-[9px] font-black text-muted uppercase">{cl.goldId?.category}</span>
                        <span className="bg-muted/10 border border-border px-3 py-1 rounded-xl text-[9px] font-black text-muted">{cl.goldId?.weight}g</span>
                      </div>

                      <div className="flex justify-between items-center pt-2">
                        <span className="text-[10px] font-black text-muted uppercase tracking-widest">{new Date(cl.completedDate).toLocaleDateString()}</span>
                        <span className="bg-green-500/10 text-green-500 px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border border-green-500/20">Settled</span>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* New Loan Modal */}
      {showNewLoanModal && (
        <div className="fixed inset-0 backdrop-blur-xl flex items-center justify-center z-[100] p-4 animate-in fade-in duration-500">
          <div className="backdrop-blur-3xl rounded-[3rem] w-full max-w-2xl overflow-hidden shadow-[0_32px_64px_-15px_rgba(0,0,0,0.2)] border border-white dark:border-white/10 animate-in zoom-in-95 duration-300">
            <div className="bg-white/20 dark:bg-muted/10 border-b border-white/20 dark:border-border p-8 flex justify-between items-center">
              <h2 className="text-2xl font-bold tracking-tight flex items-center gap-4 text-foreground">
                <div className="w-12 h-12 rounded-2xl gold-gradient flex items-center justify-center text-white shadow-lg shadow-primary/30 rotate-1">
                  <Plus size={24} />
                </div>
                New Loan Entry
              </h2>
              <button
                onClick={() => setShowNewLoanModal(false)}
                className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-white/40 dark:hover:bg-muted font-bold text-muted hover:text-foreground transition-all"
              >✕</button>
            </div>

            <form onSubmit={handleCreateLoan} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
              {/* User Section */}
              <div className="md:col-span-2 space-y-6">
                <h3 className="text-sm font-bold text-primary uppercase tracking-widest flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary shadow-lg shadow-primary/40"></div> Customer Information
                </h3>

                <div className="relative">
                  <InputField
                    label="Customer Name"
                    value={formData.userName}
                    onChange={(val: string) => {
                      setFormData({ ...formData, userName: val });
                      if (selectedUserId && val !== existingUsers.find(u => u._id === selectedUserId)?.name) {
                        setSelectedUserId('');
                      }
                    }}
                    required
                    placeholder="Search or enter name..."
                    autoComplete="off"
                  />

                  {/* Auto-complete Suggestions */}
                  {formData.userName && !selectedUserId && existingUsers.filter(u => u.name.toLowerCase().includes(formData.userName.toLowerCase())).length > 0 && (
                    <div className="absolute z-[110] w-full glass rounded-[1.5rem] shadow-2xl mt-3 max-h-56 overflow-hidden border-2 border-primary/20 p-2 animate-in slide-in-from-top-2 duration-300">
                      <div className="max-h-52 overflow-y-auto custom-scrollbar space-y-1">
                        {existingUsers.filter(u => u.name.toLowerCase().includes(formData.userName.toLowerCase())).map(u => (
                          <div
                            key={u._id}
                            className="p-4 hover:bg-primary/10 rounded-xl cursor-pointer flex justify-between items-center transition-all group"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, userName: u.name, phone: u.phone, address: u.address }));
                              setSelectedUserId(u._id);
                            }}
                          >
                            <span className="font-black text-foreground uppercase text-xs tracking-tight group-hover:text-primary transition-colors">{u.name}</span>
                            <span className="text-[10px] text-muted font-mono font-bold">{u.phone}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-2">
                  <InputField label="Phone Number" value={formData.phone} onChange={(v: string) => setFormData({ ...formData, phone: v })} required placeholder="Enter mobile number" />
                  <InputField label="Address" value={formData.address} onChange={(v: string) => setFormData({ ...formData, address: v })} required placeholder="Enter city or home address" />
                </div>
                <div className="h-[1px] w-full bg-border/30 mt-4"></div>
              </div>

              {/* Gold Section */}
              <div className="space-y-6">
                <h3 className="text-sm font-bold text-primary uppercase tracking-widest flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary shadow-lg shadow-primary/40"></div> Gold Details
                </h3>
                <InputField label="Gold ID / Reference" value={formData.goldId} onChange={(v: string) => setFormData({ ...formData, goldId: v })} placeholder="e.g. GOLD-001" required />
                <InputField label="Item Description" value={formData.category} onChange={(v: string) => setFormData({ ...formData, category: v })} placeholder="e.g. Gold Necklace" required />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-foreground/70 ml-1">Gold Purity</label>
                    <select
                      className="w-full bg-background border-2 border-border rounded-2xl p-4 text-sm font-bold focus:outline-none focus:ring-8 focus:ring-primary/5 focus:border-primary transition-all text-foreground appearance-none shadow-sm"
                      value={formData.goldType}
                      onChange={(e) => setFormData({ ...formData, goldType: e.target.value })}
                    >
                      <option>22K</option>
                      <option>24K</option>
                      <option>18K</option>
                    </select>
                  </div>
                  <InputField label="Weight (grams)" type="number" value={formData.weight} onChange={(v: string) => setFormData({ ...formData, weight: v })} required placeholder="0.00" />
                </div>
              </div>

              {/* Loan Section */}
              <div className="space-y-6">
                <h3 className="text-sm font-bold text-primary uppercase tracking-widest flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary shadow-lg shadow-primary/40"></div> Loan Details
                </h3>
                <InputField label="Loan Amount (₹)" type="number" value={formData.principalAmount} onChange={(v: string) => setFormData({ ...formData, principalAmount: v })} required placeholder="Enter amount" />
                <div className="p-6 bg-slate-900 dark:bg-slate-950 border-2 border-white/5 rounded-[2rem] shadow-xl space-y-3 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                  <p className="text-[11px] text-primary font-bold uppercase tracking-widest">Interest Calculation</p>
                  <p className="text-sm text-white font-mono italic">GENERATING REFERENCE...</p>
                  <p className="text-[10px] text-white/60 font-medium leading-relaxed">Monthly interest is 2% based on the loan amount.</p>
                </div>
              </div>

              <div className="md:col-span-2 flex justify-end gap-4 mt-8 pt-8 border-t border-border">
                <button
                  type="submit"
                  className="gold-gradient text-white px-10 py-5 rounded-2xl text-sm font-bold shadow-2xl shadow-primary/30 transition-all transform hover:scale-[1.05] active:scale-95"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedLoan && (
        <div className="fixed inset-0 backdrop-blur-xl flex items-center justify-center z-[110] p-4 animate-in fade-in duration-500">
          <div className="backdrop-blur-3xl rounded-[3rem] w-full max-w-md overflow-hidden shadow-[0_32px_64px_-15px_rgba(0,0,0,0.2)] border border-white dark:border-white/10 animate-in zoom-in-95 duration-300">
            <div className="bg-white/20 dark:bg-muted/10 border-b border-white/20 dark:border-border p-8 flex justify-between items-center">
              <h2 className="text-2xl font-bold tracking-tight flex items-center gap-4 text-foreground">
                <div className="w-12 h-12 rounded-2xl gold-gradient flex items-center justify-center text-white shadow-lg shadow-primary/30 rotate-1">
                  <BadgeIndianRupee size={24} />
                </div>
                Payment
              </h2>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-white/40 dark:hover:bg-muted font-bold text-muted hover:text-foreground transition-all"
              >✕</button>
            </div>
            <div className="p-8 space-y-8">
              <div className="flex justify-between items-center bg-muted/10 p-6 rounded-[2rem] border-2 border-border">
                <div>
                  <p className="text-xs text-muted font-semibold mb-2">Total Amount Due</p>
                  <p className="text-3xl font-bold text-foreground font-mono">₹{selectedLoan.totalAmount?.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted font-semibold mb-2">Principal</p>
                  <p className="text-xl font-bold text-primary">₹{selectedLoan.principalAmount?.toLocaleString()}</p>
                </div>
              </div>
              <form onSubmit={handlePayment} className="space-y-6">
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-foreground/90 ml-1">Payment Amount (₹) <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="w-full bg-background border-2 border-border rounded-2xl p-4 pr-20 text-lg font-bold focus:ring-8 focus:ring-primary/5 focus:border-primary outline-none transition-all placeholder:text-muted/40 text-foreground shadow-sm"
                      required
                      max={selectedLoan.totalAmount}
                    />
                    <button
                      type="button"
                      onClick={() => setPaymentAmount(selectedLoan.totalAmount.toString())}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-primary text-white px-4 py-2 rounded-xl font-bold text-xs shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 transition-all"
                    >
                      MAX
                    </button>
                  </div>
                  <p className="text-xs text-muted text-right font-medium">Remaining: ₹{(selectedLoan.totalAmount - (Number(paymentAmount) || 0)).toLocaleString()}</p>
                </div>
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="flex-1 bg-muted/50 text-foreground py-4 rounded-2xl font-bold text-sm hover:bg-muted transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-[2] gold-gradient text-white py-4 rounded-2xl font-bold text-sm shadow-2xl shadow-primary/30 active:scale-95 transition-all transform hover:scale-[1.02]"
                  >
                    Submit Payment
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Components
function TabButton({ active, children, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`px-8 py-3 rounded-xl text-sm font-bold transition-all ${active
        ? 'gold-gradient text-white shadow-lg shadow-primary/20'
        : 'text-slate-500 hover:bg-slate-100'
        }`}
    >
      {children}
    </button>
  );
}

function InputField({ label, value, onChange, placeholder = '', type = 'text', required = false, autoComplete = 'on' }: any) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-foreground/90 ml-1">{label} {required && <span className="text-red-500">*</span>}</label>
      <input
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full bg-background border-2 border-border rounded-2xl p-4 text-sm font-bold focus:outline-none focus:ring-8 focus:ring-primary/5 focus:border-primary transition-all text-foreground placeholder:text-muted/40 shadow-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      />
    </div>
  );
}

function StatsCard({ title, value, icon, trend, loading }: any) {
  return (
    <div className="glass-card p-6 rounded-[2rem] border-border relative overflow-hidden group hover:border-primary/50 transition-all duration-500">
      <div className="flex justify-between items-start mb-4">
        <div className="w-12 h-12 rounded-2xl bg-muted/20 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
          {icon}
        </div>
        <span className={`text-[10px] font-black px-3 py-1 rounded-full border ${trend.includes('+') ? 'border-emerald-500/20 text-emerald-500 bg-emerald-500/5' : 'border-primary/20 text-primary bg-primary/5'} uppercase tracking-widest`}>
          {trend}
        </span>
      </div>
      <div>
        <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-1">{title}</p>
        {loading ? (
          <div className="h-9 w-24 bg-muted animate-pulse rounded-lg"></div>
        ) : (
          <h3 className="text-2xl font-black text-foreground tracking-tight">{value}</h3>
        )}
      </div>
    </div>
  );
}
