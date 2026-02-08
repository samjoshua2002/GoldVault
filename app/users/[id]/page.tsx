'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
    Users, Phone, MapPin, Calendar, CreditCard, Award, ChevronLeft, Flag, CheckCircle2,
    Edit2, Save, X
} from 'lucide-react';
import Link from 'next/link';

export default function UserDetailPage() {
    const { id } = useParams();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'active' | 'history' | 'payments'>('active');

    // Payment State
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedLoan, setSelectedLoan] = useState<any>(null);
    const [paymentAmount, setPaymentAmount] = useState('');

    // Edit User State
    const [isEditingUser, setIsEditingUser] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', phone: '', address: '' });

    const fetchData = () => {
        if (!id) return;
        setLoading(true);
        fetch(`/api/users/${id}`)
            .then(res => res.json())
            .then(d => {
                setData(d);
                setLoading(false);
                // Initialize edit form
                if (d.user) {
                    setEditForm({ name: d.user.name, phone: d.user.phone, address: d.user.address });
                }
            });
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedLoan) return;

        const amount = Number(paymentAmount);
        if (amount <= 0 || amount > selectedLoan.totalAmount) {
            alert("Invalid amount");
            return;
        }

        try {
            const res = await fetch(`/api/loans/${selectedLoan._id}/payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount })
            });
            if (res.ok) {
                setShowPaymentModal(false);
                setPaymentAmount('');
                fetchData(); // Refresh data
            } else {
                alert("Payment failed");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleUpdateUser = async () => {
        try {
            const res = await fetch(`/api/users/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm)
            });
            if (res.ok) {
                setIsEditingUser(false);
                fetchData();
            } else {
                alert("Failed to update user");
            }
        } catch (error) {
            console.error(error);
        }
    };



    if (loading) return <div className="p-8 text-center text-muted animate-pulse">Loading customer profile...</div>;
    if (!data || !data.user) return <div className="p-8 text-center text-muted italic">User not found.</div>;

    const { user, activeLoans, completedLoans, goldItems } = data;

    return (
        <div className="space-y-10 animate-in fade-in duration-700 pb-20">
            {/* Action Bar */}
            <div className="flex justify-between items-center">
                <Link href="/users" className="group flex items-center gap-3 bg-muted/20 hover:bg-muted/40 border-2 border-border/50 text-foreground px-5 py-3 rounded-2xl transition-all duration-300">
                    <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Registry Exit</span>
                </Link>
            </div>

            {/* Profile Matrix */}
            <div className="glass-card p-6 sm:p-10 rounded-[2.5rem] sm:rounded-[3rem] border-border flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 sm:gap-10 bg-muted/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] -mr-48 -mt-48"></div>

                <div className="flex flex-col sm:flex-row items-center sm:items-center gap-6 sm:gap-8 w-full lg:w-auto relative z-10">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[1.8rem] sm:rounded-[2.2rem] gold-gradient flex items-center justify-center text-white font-black text-3xl sm:text-4xl shadow-2xl shadow-primary/30 border-2 border-white/20 shrink-0 rotate-3">
                        {user.name.charAt(0).toUpperCase()}
                    </div>

                    {isEditingUser ? (
                        <div className="space-y-4 w-full max-w-lg text-center sm:text-left">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="bg-background/50 border-2 border-border p-4 rounded-2xl text-foreground text-sm font-black w-full outline-none focus:ring-8 focus:ring-primary/5 focus:border-primary transition-all uppercase placeholder:text-muted/30" placeholder="Identity Name" />
                                <input value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} className="bg-background/50 border-2 border-border p-4 rounded-2xl text-foreground text-sm font-black w-full outline-none focus:ring-8 focus:ring-primary/5 focus:border-primary transition-all placeholder:text-muted/30" placeholder="Contact String" />
                            </div>
                            <input value={editForm.address} onChange={e => setEditForm({ ...editForm, address: e.target.value })} className="bg-background/50 border-2 border-border p-4 rounded-2xl text-foreground text-sm font-black w-full outline-none focus:ring-8 focus:ring-primary/5 focus:border-primary transition-all placeholder:text-muted/30" placeholder="Geographic Base" />
                            <div className="flex flex-col sm:flex-row gap-4 pt-2">
                                <button onClick={handleUpdateUser} className="gold-gradient text-white text-[10px] px-8 py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-primary/20 hover:scale-105 transition-all"><Save size={14} /> Commit Update</button>
                                <button onClick={() => setIsEditingUser(false)} className="bg-muted text-foreground text-[10px] px-8 py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-muted hover:scale-105 transition-all"><X size={14} /> Abort</button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center sm:text-left">
                            <div className="flex items-center justify-center sm:justify-start gap-4">
                                <h1 className="text-2xl sm:text-3xl font-black text-foreground uppercase tracking-tight">{user.name}</h1>
                                <button onClick={() => setIsEditingUser(true)} className="text-muted hover:text-primary transition-all p-2 bg-muted/30 hover:bg-primary/10 rounded-xl"><Edit2 size={16} /></button>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-muted text-sm mt-3">
                                <span className="flex items-center justify-center sm:justify-start gap-2 font-black text-[10px] sm:text-xs uppercase tracking-widest"><Phone size={14} className="text-primary" /> {user.phone}</span>
                                <div className="hidden sm:block w-1.5 h-1.5 rounded-full bg-border"></div>
                                <span className="flex items-center justify-center sm:justify-start gap-2 text-[10px] sm:text-xs font-bold italic opacity-60"><MapPin size={14} className="text-primary" /> {user.address}</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-around sm:justify-center lg:justify-start gap-8 sm:gap-12 w-full lg:w-auto border-t lg:border-t-0 lg:border-l border-border/50 pt-8 lg:pt-0 lg:pl-12 relative z-10">
                    <div className="text-center lg:text-left">
                        <p className="text-[9px] sm:text-[10px] font-black text-muted uppercase tracking-[0.2em] sm:tracking-[0.3em] mb-2 px-1">Holding Volume</p>
                        <p className="text-2xl sm:text-3xl font-black text-foreground">{goldItems.reduce((sum: number, item: any) => sum + item.weight, 0)}<span className="text-xs text-primary ml-1 uppercase font-black">g.</span></p>
                    </div>
                    <div className="text-center lg:text-left">
                        <p className="text-[9px] sm:text-[10px] font-black text-primary uppercase tracking-[0.2em] sm:tracking-[0.3em] mb-2 px-1">Target Dues</p>
                        <p className="text-2xl sm:text-3xl font-black text-red-500">₹{activeLoans?.reduce((sum: number, loan: any) => sum + loan.totalAmount, 0).toLocaleString()}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Operation Modules */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="glass-card rounded-[3rem] border-border overflow-hidden">
                        {/* Status Nav */}
                        <div className="border-b border-border px-4 sm:px-10 py-2 flex gap-4 sm:gap-10 bg-muted/5 overflow-x-auto no-scrollbar">
                            <button
                                onClick={() => setActiveTab('active')}
                                className={`py-4 sm:py-6 text-[9px] sm:text-xs font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] transition-all border-b-4 whitespace-nowrap ${activeTab === 'active' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-foreground'}`}
                            >
                                Active Protocols <span className="ml-1 sm:ml-2 opacity-40">[{activeLoans?.length || 0}]</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('history')}
                                className={`py-4 sm:py-6 text-[9px] sm:text-xs font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] transition-all border-b-4 whitespace-nowrap ${activeTab === 'history' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-foreground'}`}
                            >
                                Legacy History <span className="ml-1 sm:ml-2 opacity-40">[{completedLoans?.length || 0}]</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('payments')}
                                className={`py-4 sm:py-6 text-[9px] sm:text-xs font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] transition-all border-b-4 whitespace-nowrap ${activeTab === 'payments' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-foreground'}`}
                            >
                                Transaction Ledger <span className="ml-1 sm:ml-2 opacity-40">[{data.payments?.length || 0}]</span>
                            </button>
                        </div>

                        <div className="p-0">
                            {activeTab === 'active' ? (
                                <div className="divide-y divide-border/30">
                                    {activeLoans.length === 0 ? (
                                        <div className="p-24 text-center">
                                            <div className="w-24 h-24 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-6 text-muted/30 border-2 border-border/50">
                                                <CheckCircle2 size={48} />
                                            </div>
                                            <p className="text-muted font-black uppercase tracking-widest text-xs">Clearance Level Green - No Dues Detected</p>
                                        </div>
                                    ) : (
                                        activeLoans.map((loan: any) => (
                                            <div key={loan._id} className="p-10 hover:bg-primary/5 transition-colors group relative overflow-hidden">
                                                <div className="flex flex-col xl:flex-row justify-between items-start gap-10">
                                                    <div className="flex-1 space-y-4">
                                                        <div className="flex items-center gap-4">
                                                            <span className="text-[10px] font-black font-mono text-muted bg-muted/20 px-3 py-1.5 rounded-xl border border-border uppercase tracking-tight">{loan.loanId}</span>
                                                            <span className="text-[10px] font-black bg-primary/10 text-primary px-3 py-1.5 rounded-xl border border-primary/20 uppercase tracking-[0.2em]">Live Authorization</span>
                                                        </div>
                                                        <div>
                                                            <h3 className="text-5xl font-black text-foreground tracking-tighter">₹{loan.totalAmount.toLocaleString()}</h3>
                                                            <p className="text-[10px] font-black text-muted uppercase tracking-[0.3em] mt-2 px-1">Total Vault Liability</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6 w-full xl:w-auto">
                                                        <div className="bg-muted/10 p-6 rounded-3xl border-2 border-border min-w-[220px] text-left">
                                                            <div className="text-[10px] text-muted uppercase tracking-[0.2em] font-black mb-3 flex items-center gap-3">
                                                                <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(212,175,55,1)]"></div> Pledged Reserve
                                                            </div>
                                                            <div className="font-black text-foreground text-sm uppercase tracking-tight">{loan.goldId?.category}</div>
                                                            <div className="text-[10px] text-muted font-black mt-1.5 tracking-tight uppercase opacity-60">{loan.goldId?.goldType} • {loan.goldId?.weight}g (Net Mass)</div>
                                                        </div>
                                                        <button
                                                            onClick={() => { setSelectedLoan(loan); setShowPaymentModal(true); setPaymentAmount(''); }}
                                                            className="w-full xl:w-auto gold-gradient text-white px-10 py-5 rounded-[1.8rem] text-xs font-black uppercase tracking-widest shadow-2xl shadow-primary/30 transition-all hover:scale-[1.05] active:scale-95"
                                                        >
                                                            Settle Ledger
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-10 mt-10 pt-8 border-t border-border/30">
                                                    <div>
                                                        <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-2">Base Capital</p>
                                                        <p className="text-lg font-black text-foreground">₹{loan.principalAmount.toLocaleString()}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-2">Accrued Yield (1% / mo)</p>
                                                        <p className="text-lg font-black text-green-500">+ ₹{loan.currentInterest.toLocaleString()}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            ) : activeTab === 'history' ? (
                                <div className="divide-y divide-border/30">
                                    {completedLoans.length === 0 ? (
                                        <div className="p-20 text-center text-muted font-black uppercase tracking-widest text-[10px] italic">No legacy data processed for this identity.</div>
                                    ) : (
                                        completedLoans.map((loan: any) => (
                                            <div key={loan._id} className="p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 hover:bg-muted/10 transition-colors bg-muted/5 opacity-80">
                                                <div>
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <span className="text-[9px] font-mono font-black text-muted/50 uppercase tracking-tighter">{loan.loanId}</span>
                                                        <span className="bg-green-500/10 text-green-500 text-[9px] font-black px-3 py-1 rounded-xl border border-green-500/20 uppercase tracking-widest">Protocol Settled</span>
                                                    </div>
                                                    <p className="font-black text-lg text-foreground uppercase tracking-tight">₹{loan.totalPaid.toLocaleString()} <span className="text-[9px] font-black text-muted uppercase ml-3 tracking-widest opacity-40">Final Liquidation</span></p>
                                                </div>
                                                <div className="text-left sm:text-right w-full sm:w-auto flex flex-row sm:flex-col justify-between sm:justify-end items-center sm:items-end gap-2">
                                                    <p className="font-black text-xs text-foreground uppercase tracking-widest">{new Date(loan.completedDate).toLocaleDateString()}</p>
                                                    <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">{loan.durationMonths} Cycle Duration</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            ) : (
                                <div className="divide-y divide-border/30">
                                    {(!data.payments || data.payments.length === 0) ? (
                                        <div className="p-20 text-center text-muted font-black uppercase tracking-widest text-[10px] italic">No transaction records detected.</div>
                                    ) : (
                                        data.payments.map((payment: any) => (
                                            <div key={payment._id} className="p-8 flex justify-between items-center hover:bg-muted/10 transition-colors">
                                                <div>
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <span className="text-[9px] font-black text-primary uppercase tracking-widest">Ref: {payment.loanId?.loanId || 'N/A'}</span>
                                                        <span className="text-[9px] font-black text-muted/50 uppercase tracking-widest">{new Date(payment.paymentDate).toLocaleTimeString()}</span>
                                                    </div>
                                                    <p className="font-black text-sm text-foreground uppercase tracking-tight">{new Date(payment.paymentDate).toLocaleDateString()}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-black text-lg text-emerald-500">₹{payment.amount.toLocaleString()}</p>
                                                    <p className="text-[9px] font-black text-muted uppercase tracking-widest">Remaining: ₹{payment.remainingAmount.toLocaleString()}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Reserve Inventory */}
                <div className="space-y-8">
                    <div className="glass-card rounded-[3rem] border-border h-full overflow-hidden bg-muted/5">
                        <div className="bg-muted/20 p-8 border-b border-border">
                            <h2 className="font-black text-foreground flex items-center gap-3 text-xs uppercase tracking-[0.2em]">
                                <Award className="text-primary" size={20} /> Reserve Inventory
                            </h2>
                        </div>
                        <div className="p-8 space-y-6">
                            {goldItems.length === 0 ? (
                                <p className="text-center text-muted font-black uppercase tracking-widest text-[9px] py-20 opacity-40 italic">No assets registered.</p>
                            ) : (
                                goldItems.map((item: any) => (
                                    <div key={item._id} className=" rounded-[1.8rem] p-6 border-2 border-border shadow-sm flex justify-between items-center group hover:border-primary/50 transition-all duration-500">
                                        <div>
                                            <h4 className="font-black text-foreground text-xs uppercase tracking-widest">{item.category}</h4>
                                            <p className="text-[9px] font-black text-muted mt-2 uppercase tracking-tighter opacity-60">{new Date(item.date).toLocaleDateString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs font-black text-primary bg-primary/10 px-4 py-2 rounded-xl border-2 border-primary/20">{item.weight}g</span>
                                            <p className="text-[9px] font-black text-muted mt-3 tracking-widest uppercase opacity-40">{item.goldType}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Settlement Modal */}
            {showPaymentModal && selectedLoan && (
                <div className="fixed inset-0 backdrop-blur-xl flex items-center justify-center z-[110] p-4 animate-in fade-in duration-500">
                    <div className="backdrop-blur-3xl rounded-[3rem] w-full max-w-md overflow-hidden shadow-[0_32px_64px_-15px_rgba(0,0,0,0.2)] border border-white dark:border-white/10 animate-in zoom-in-95 duration-300">
                        <div className="bg-white/20 dark:bg-muted/10 border-b border-white/20 dark:border-border p-8 flex justify-between items-center">
                            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-4 text-foreground">
                                <div className="w-12 h-12 rounded-2xl gold-gradient flex items-center justify-center text-white shadow-lg shadow-primary/30 rotate-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" /></svg>
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


