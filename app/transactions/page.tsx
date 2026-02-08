'use client';

import { useState, useEffect } from 'react';
import { History, Search, ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react';

interface Transaction {
    _id: string;
    amount: number;
    paymentDate: string;
    remainingAmount: number;
    loanId: {
        loanId: string;
        userId: {
            name: string;
            phone: string;
        };
    };
}

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/payments/recent?limit=50');
            if (res.ok) {
                setTransactions(await res.json());
            }
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, []);

    const filteredTransactions = transactions.filter(t =>
        t.loanId?.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.loanId?.loanId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.loanId?.userId?.phone?.includes(searchTerm)
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">Transaction Ledger</h1>
                    <p className="text-sm text-muted font-medium mt-1.5">Historical record of all payments and settlements</p>
                </div>
            </div>

            <div className="glass-card rounded-[2.5rem] border-border overflow-hidden">
                <div className="p-8 border-b border-border flex flex-col md:flex-row justify-between items-center gap-6 bg-muted/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <History size={20} />
                        </div>
                        <h2 className="text-lg font-bold text-foreground tracking-tight">Real-time Activity</h2>
                    </div>

                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name, ID or phone..."
                            className="w-full bg-background border-2 border-border rounded-2xl py-3.5 pl-12 pr-6 text-sm font-bold text-foreground focus:outline-none focus:ring-8 focus:ring-primary/5 focus:border-primary transition-all placeholder:text-muted/40 shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-muted/30 text-muted text-[10px] font-black uppercase tracking-widest border-b border-border">
                                <th className="p-6 pl-10">Timestamp</th>
                                <th className="p-6">Customer</th>
                                <th className="p-6">Protocol ID</th>
                                <th className="p-6">Transaction</th>
                                <th className="p-6 text-right pr-10">Balance Remaining</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-20 text-center text-muted font-bold italic animate-pulse">Accessing Secure Vault Records...</td>
                                </tr>
                            ) : filteredTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-20 text-center text-muted font-bold italic">No transaction history found.</td>
                                </tr>
                            ) : (
                                filteredTransactions.map((t) => (
                                    <tr key={t._id} className="hover:bg-primary/5 transition-colors group">
                                        <td className="p-6 pl-10">
                                            <div className="flex items-center gap-3">
                                                <Clock size={14} className="text-muted" />
                                                <div>
                                                    <div className="text-xs font-bold text-foreground">{new Date(t.paymentDate).toLocaleDateString()}</div>
                                                    <div className="text-[10px] text-muted font-medium">{new Date(t.paymentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="font-bold text-foreground text-xs uppercase tracking-tight">{t.loanId?.userId?.name}</div>
                                            <div className="text-[10px] text-muted font-mono">{t.loanId?.userId?.phone}</div>
                                        </td>
                                        <td className="p-6">
                                            <span className="text-[10px] font-mono font-black bg-muted/30 px-3 py-1.5 rounded-xl border border-border uppercase">
                                                {t.loanId?.loanId}
                                            </span>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                                    <ArrowDownLeft size={14} />
                                                </div>
                                                <span className="text-sm font-black text-emerald-600">₹{t.amount.toLocaleString()}</span>
                                            </div>
                                        </td>
                                        <td className="p-6 text-right pr-10 font-bold text-foreground text-sm">
                                            ₹{t.remainingAmount.toLocaleString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden">
                    {loading ? (
                        <div className="p-10 text-center text-muted font-bold italic animate-pulse">Syncing...</div>
                    ) : filteredTransactions.length === 0 ? (
                        <div className="p-10 text-center text-muted font-bold italic">No records.</div>
                    ) : (
                        <div className="divide-y divide-border/30">
                            {filteredTransactions.map((t) => (
                                <div key={t._id} className="p-6 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                                <ArrowDownLeft size={18} />
                                            </div>
                                            <div>
                                                <div className="font-black text-foreground uppercase tracking-tight text-sm">{t.loanId?.userId?.name}</div>
                                                <div className="text-[10px] text-muted font-mono">{t.loanId?.userId?.phone}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-black text-emerald-600 text-lg">₹{t.amount.toLocaleString()}</div>
                                            <div className="text-[9px] text-muted font-black uppercase tracking-widest">Received</div>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center bg-muted/20 p-4 rounded-2xl border border-border/50">
                                        <div>
                                            <span className="text-[9px] text-muted font-black uppercase tracking-widest block mb-1">Protocol ID</span>
                                            <span className="font-mono text-[10px] font-black text-foreground">{t.loanId?.loanId}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[9px] text-muted font-black uppercase tracking-widest block mb-1">Date</span>
                                            <span className="text-[10px] font-bold text-foreground">{new Date(t.paymentDate).toLocaleDateString()}</span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center px-2">
                                        <div className="flex items-center gap-2 text-muted">
                                            <Clock size={12} />
                                            <span className="text-[10px] font-bold">{new Date(t.paymentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[9px] text-muted font-black uppercase tracking-widest mr-2">New Balance:</span>
                                            <span className="text-sm font-black text-foreground">₹{t.remainingAmount.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
