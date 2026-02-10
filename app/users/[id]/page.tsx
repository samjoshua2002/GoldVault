'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
    Users, Phone, MapPin, Calendar, CreditCard, Award, ChevronLeft, Flag, CheckCircle2,
    Edit2, Save, X, ArrowDownLeft, Clock, ShieldCheck, PlayCircle
} from 'lucide-react';
import Link from 'next/link';

export default function UserDetailPage() {
    const { id } = useParams();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
    const [selectedGoldId, setSelectedGoldId] = useState<string | null>(null);

    useEffect(() => {
        if (!data) return;
        // Default to first active loan's gold ID if nothing selected
        if (!selectedGoldId && data.activeLoans?.length > 0) {
            setSelectedGoldId(data.activeLoans[0].goldId?.goldId);
        } else if (!selectedGoldId && data.goldItems?.length > 0) {
            setSelectedGoldId(data.goldItems[0].goldId);
        }
    }, [data]);

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

    const { user, activeLoans, completedLoans, goldItems, payments } = data;

    const totalLiability = activeLoans?.reduce((sum: number, loan: any) => sum + loan.totalAmount, 0) || 0;
    const totalWeight = goldItems?.reduce((sum: number, item: any) => sum + item.weight, 0) || 0;

    // Components
    function TabButtonHorizontal({ active, label, count, onClick }: any) {
        return (
            <button
                onClick={onClick}
                className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${active
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'text-muted hover:text-foreground'
                    }`}
            >
                <div className="flex items-center gap-2">
                    {label}
                    {count !== undefined && (
                        <span className={`px-1.5 py-0.5 rounded-md border text-[8px] font-bold ${active ? 'bg-white/20 border-white/10' : 'bg-muted/20 border-border'}`}>
                            {count}
                        </span>
                    )}
                </div>
            </button>
        );
    }

    function TabButton({ active, children, onClick }: any) {
        return (
            <button
                onClick={onClick}
                className={`px-8 py-3 rounded-xl text-sm font-bold transition-all ${active
                    ? 'gold-gradient text-white shadow-lg shadow-primary/20'
                    : 'text-muted hover:bg-muted/50'
                    }`}
            >
                {children}
            </button>
        );
    }

    // Construct unified timeline events with sort priorities
    let timelineEvents = [
        ...(activeLoans || []).map((loan: any) => ({
            id: `loan-active-${loan._id}`,
            date: loan.startDate ? new Date(loan.startDate) : new Date(0),
            type: 'initiation',
            label: 'Protocol Initiated',
            amount: loan.principalAmount,
            loanId: loan.loanId,
            assetId: loan.goldId?.goldId,
            status: 'active',
            priority: 0 // Oldest
        })),
        ...(completedLoans || []).map((loan: any) => {
            const startDate = loan.startDate ? new Date(loan.startDate) :
                (loan.completedDate ? new Date(new Date(loan.completedDate).setMonth(new Date(loan.completedDate).getMonth() - (loan.durationMonths || 0))) : new Date(0));
            return {
                id: `loan-comp-init-${loan._id}`,
                date: startDate,
                type: 'initiation',
                label: 'Protocol Initiated',
                amount: loan.principalAmount,
                loanId: loan.loanId,
                assetId: loan.goldId?.goldId,
                status: 'completed',
                priority: 0
            };
        }),
        ...(completedLoans || []).map((loan: any) => ({
            id: `loan-settled-${loan._id}`,
            date: loan.completedDate ? new Date(loan.completedDate) : new Date(),
            type: 'settlement',
            label: 'Protocol Settled',
            amount: loan.totalPaid,
            loanId: loan.loanId,
            assetId: loan.goldId?.goldId,
            priority: 2 // Newest
        })),
        ...(payments || []).map((payment: any) => ({
            id: `payment-${payment._id}`,
            date: payment.paymentDate ? new Date(payment.paymentDate) : new Date(),
            type: 'payment',
            label: 'Payment Received',
            amount: payment.amount,
            remaining: payment.remainingAmount,
            loanId: payment.loanId?.loanId,
            assetId: payment.loanId?.goldId?.goldId,
            priority: 1 // Intermediate
        }))
    ].filter(e => e.date && !isNaN(e.date.getTime()))
        .sort((a, b) => {
            // Force initiation to the absolute bottom (oldest)
            if (a.type === 'initiation' && b.type !== 'initiation') return 1;
            if (b.type === 'initiation' && a.type !== 'initiation') return -1;

            const dateDiff = b.date.getTime() - a.date.getTime();
            if (dateDiff !== 0) return dateDiff;
            return b.priority - a.priority;
        });

    if (selectedGoldId) {
        timelineEvents = timelineEvents.filter(e => e.assetId === selectedGoldId);
    }

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

                <div className="flex flex-wrap lg:flex-nowrap justify-center lg:justify-start gap-4 lg:gap-6 w-full lg:w-auto border-t lg:border-t-0 lg:border-l border-border/50 pt-8 lg:pt-0 lg:pl-10 relative z-10">
                    {/* Liability Card */}
                    <div className="glass-card bg-red-500/5 border-red-500/20 p-4 rounded-[2rem] min-w-[180px] group transition-all duration-500 hover:bg-red-500/10 hover:scale-105">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 transition-transform group-hover:rotate-12">
                                <ShieldCheck size={16} />
                            </div>
                            <p className="text-[10px] font-black text-red-500/60 uppercase tracking-widest">Liability Score</p>
                        </div>
                        <p className="text-2xl font-black text-red-500 tracking-tighter">₹{totalLiability.toLocaleString()}</p>
                    </div>

                    {/* Asset Mass Card */}
                    <div className="glass-card bg-primary/5 border-primary/20 p-4 rounded-[2rem] min-w-[180px] group transition-all duration-500 hover:bg-primary/10 hover:scale-105">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary transition-transform group-hover:-rotate-12">
                                <Award size={16} />
                            </div>
                            <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest">Asset Mass</p>
                        </div>
                        <p className="text-2xl font-black text-foreground tracking-tighter">{totalWeight}<span className="text-xs text-primary ml-1 uppercase font-black">g</span></p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Action Hub */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="glass-card rounded-[3rem] border-border overflow-hidden bg-background/50 min-h-[700px]">
                        {/* Operation Mode Header */}
                        <div className="bg-muted/10 border-b border-border px-8 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                    <Flag size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xs font-black text-foreground uppercase tracking-[0.2em]">Operation Mode</h2>
                                    <p className="text-[9px] font-bold text-muted uppercase tracking-widest mt-0.5">System Protocol Management</p>
                                </div>
                            </div>

                            <div className="flex bg-muted/20 p-1.5 rounded-2xl border border-border/50">
                                <TabButtonHorizontal active={activeTab === 'active'} onClick={() => setActiveTab('active')} label="Active Protocols" count={activeLoans?.length} />
                                <TabButtonHorizontal active={activeTab === 'history'} onClick={() => setActiveTab('history')} label="Legacy History" count={completedLoans?.length} />
                            </div>
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
                                            <div
                                                key={loan._id}
                                                onClick={() => setSelectedGoldId(loan.goldId?.goldId)}
                                                className={`p-10 transition-all group relative overflow-hidden cursor-pointer border-l-4 ${selectedGoldId === loan.goldId?.goldId ? 'bg-primary/10 border-primary' : 'hover:bg-primary/5 border-transparent'}`}
                                            >
                                                <div className="flex flex-col xl:flex-row justify-between items-start gap-10">
                                                    <div className="flex-1 space-y-4">
                                                        <div className="flex items-center gap-4">
                                                            <span className="text-[10px] font-black font-mono text-muted bg-muted/20 px-3 py-1.5 rounded-xl border border-border uppercase tracking-tight">{loan.goldId?.goldId}</span>
                                                            <span className="text-[10px] font-black bg-emerald-500/10 text-emerald-500 px-3 py-1.5 rounded-xl border border-emerald-500/20 uppercase tracking-[0.2em]">Active Reserve</span>
                                                        </div>
                                                        <div>
                                                            <h3 className="text-5xl font-black text-foreground tracking-tighter">₹{loan.totalAmount.toLocaleString()}</h3>
                                                            <p className="text-[10px] font-black text-muted uppercase tracking-[0.3em] mt-2 px-1">Current Liquidation Value</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6 w-full xl:w-auto">
                                                        <div className="bg-muted/10 p-6 rounded-3xl border-2 border-border min-w-[220px] text-left">
                                                            <div className="text-[10px] text-muted uppercase tracking-[0.2em] font-black mb-3 flex items-center gap-3">
                                                                <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(212,175,55,1)]"></div> Pledged Asset: {loan.goldId?.goldId}
                                                            </div>
                                                            <div className="font-black text-foreground text-sm uppercase tracking-tight">{loan.goldId?.category}</div>
                                                            <div className="text-[10px] text-muted font-black mt-1.5 tracking-tight uppercase opacity-60">{loan.goldId?.goldType} • {loan.goldId?.weight}g</div>
                                                        </div>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setSelectedLoan(loan); setShowPaymentModal(true); setPaymentAmount(''); }}
                                                            className="w-full xl:w-auto gold-gradient text-white px-10 py-5 rounded-[1.8rem] text-xs font-black uppercase tracking-widest shadow-2xl shadow-primary/30 transition-all hover:scale-[1.05] active:scale-95"
                                                        >
                                                            Process Payment
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-10 mt-10 pt-8 border-t border-border/30">
                                                    <div>
                                                        <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-2">Principal Fund</p>
                                                        <p className="text-lg font-black text-foreground">₹{loan.principalAmount.toLocaleString()}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-2">Accumulated Yield</p>
                                                        <p className="text-lg font-black text-green-500">+ ₹{loan.currentInterest.toLocaleString()}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            ) : (
                                <div className="divide-y divide-border/30">
                                    {completedLoans.length === 0 ? (
                                        <div className="p-20 text-center text-muted font-black uppercase tracking-widest text-[10px] italic">No legacy data processed for this identity.</div>
                                    ) : (
                                        completedLoans.map((loan: any) => (
                                            <div
                                                key={loan._id}
                                                onClick={() => setSelectedGoldId(loan.goldId?.goldId)}
                                                className={`p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 transition-all border-l-4 cursor-pointer ${selectedGoldId === loan.goldId?.goldId ? 'bg-muted/20 border-primary opacity-100' : 'hover:bg-muted/10 border-transparent opacity-80'}`}
                                            >
                                                <div>
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <span className="text-[9px] font-mono font-black text-muted/50 uppercase tracking-tighter">{loan.loanId} • Asset: {loan.goldId?.goldId}</span>
                                                        <span className="bg-amber-500/10 text-amber-500 text-[9px] font-black px-3 py-1 rounded-xl border border-amber-500/20 uppercase tracking-widest">Protocol Settled</span>
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
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Asset Lifecycle Ledger */}
                <div className="space-y-8">
                    <div className="glass-card rounded-[3rem] border-border h-[800px] overflow-hidden bg-muted/5 flex flex-col">
                        <div className="bg-muted/20 p-8 border-b border-border">
                            <h2 className="font-black text-foreground flex items-center gap-3 text-xs uppercase tracking-[0.2em]">
                                <Clock className="text-primary" size={20} /> Asset Lifecycle
                            </h2>
                            {selectedGoldId && (
                                <div className="mt-3 flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(212,175,55,1)]"></div>
                                    <p className="text-[9px] font-black text-primary uppercase tracking-widest">Live Tracking: {selectedGoldId}</p>
                                </div>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto no-scrollbar">
                            {!selectedGoldId ? (
                                <div className="p-20 text-center space-y-4">
                                    <div className="w-16 h-16 bg-muted/10 rounded-full flex items-center justify-center mx-auto text-muted/30 border border-border">
                                        <Award size={32} />
                                    </div>
                                    <p className="text-muted font-black uppercase tracking-widest text-[9px] opacity-40 italic">Select a protocol to view its lifecycle ledger.</p>
                                </div>
                            ) : timelineEvents.length === 0 ? (
                                <p className="p-20 text-center text-muted font-black uppercase tracking-widest text-[9px] opacity-40 italic">No associated activity found.</p>
                            ) : (
                                <div className="p-8 relative">
                                    {/* Vertical Chain Connector */}
                                    <div className="absolute left-[51px] top-12 bottom-12 w-0.5 bg-border/50"></div>

                                    <div className="space-y-10">
                                        {timelineEvents.map((event: any) => (
                                            <div key={event.id} className="relative flex items-start gap-4 group">
                                                {/* Stepper Node */}
                                                <div className={`relative z-10 w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-300 group-hover:scale-110 shadow-sm ${event.type === 'payment' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' :
                                                    event.type === 'initiation' ? 'bg-blue-500/10 text-blue-500 border-blue-500/30' :
                                                        'bg-amber-500/10 text-amber-500 border-amber-500/30'
                                                    }`}>
                                                    {event.type === 'payment' ? <ArrowDownLeft size={16} /> :
                                                        event.type === 'initiation' ? <PlayCircle size={16} /> :
                                                            <ShieldCheck size={16} />
                                                    }
                                                </div>

                                                <div className="flex-1 min-w-0 bg-muted/5 p-4 rounded-2xl border border-border/30 hover:border-primary/20 transition-all">
                                                    <div className="flex justify-between items-start mb-1 gap-2">
                                                        <div className="flex flex-col">
                                                            <span className="text-[8px] font-black text-muted uppercase tracking-tighter shrink-0">{event.date.toLocaleDateString()}</span>
                                                            <span className="text-[7px] font-bold text-muted/50 uppercase tracking-widest shrink-0">{event.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        </div>
                                                        <span className={`text-[10px] font-black tracking-tighter shrink-0 ${event.type === 'payment' ? 'text-emerald-500' :
                                                            event.type === 'initiation' ? 'text-blue-500' :
                                                                'text-amber-500'
                                                            }`}>
                                                            {event.type === 'payment' ? '-' : event.type === 'initiation' ? '+' : ''}₹{event.amount.toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-[10px] font-black text-foreground uppercase tracking-tight leading-tight truncate">{event.label}</p>
                                                    {event.type === 'payment' && (
                                                        <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-border/20">
                                                            <span className="text-[7px] font-black text-muted uppercase tracking-widest">Remaining:</span>
                                                            <span className="text-[9px] font-black text-foreground tracking-tighter">₹{event.remaining.toLocaleString()}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
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
