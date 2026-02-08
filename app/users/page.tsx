'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, MapPin, Phone, ChevronRight, User, Filter, ArrowUpDown } from 'lucide-react';

interface UserData {
    _id: string;
    name: string;
    phone: string;
    address: string;
    createdAt: string;
    activeLoans: number;
}

export default function UsersPage() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

    useEffect(() => {
        fetch('/api/users')
            .then(res => res.json())
            .then(data => {
                setUsers(Array.isArray(data) ? data : []);
                setLoading(false);
            });
    }, []);

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.phone.includes(searchTerm);

        if (!matchesSearch) return false;

        if (filterStatus === 'active') return user.activeLoans > 0;
        if (filterStatus === 'inactive') return user.activeLoans === 0;

        return true;
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">Customer List</h1>
                    <p className="text-sm text-muted font-medium mt-1.5">View and manage all customer records</p>
                </div>
            </div>

            <div className="glass-card rounded-[2.5rem] border-border overflow-hidden">
                <div className="p-8 border-b border-border flex flex-col md:flex-row justify-between items-center gap-6 bg-muted/5">
                    <div className="flex gap-2 bg-muted/10 p-2 rounded-2xl">
                        <TabButton active={filterStatus === 'all'} onClick={() => setFilterStatus('all')}>
                            All Customers
                        </TabButton>
                        <TabButton active={filterStatus === 'active'} onClick={() => setFilterStatus('active')}>
                            Active Loans
                        </TabButton>
                    </div>

                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name or phone..."
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
                            <tr className="bg-muted/30 text-muted text-xs font-semibold border-b border-border">
                                <th className="p-6 pl-10">Name</th>
                                <th className="p-6">Phone</th>
                                <th className="p-6">Address</th>
                                <th className="p-6 text-center">Status</th>
                                <th className="p-6 text-right pr-10">Profile</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-20 text-center text-muted font-bold italic animate-pulse">Loading customers...</td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-20 text-center text-muted font-bold italic">
                                        {filterStatus === 'active' ? 'No customers with active loans found.' : 'No matching customers found.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map(user => (
                                    <tr key={user._id} className="hover:bg-primary/5 transition-colors group">
                                        <td className="p-6 pl-10">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl gold-gradient flex items-center justify-center text-white font-bold text-sm shadow-md">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="font-bold text-foreground text-sm">{user.name}</div>
                                            </div>
                                        </td>
                                        <td className="p-6 text-muted font-mono text-sm font-medium">{user.phone}</td>
                                        <td className="p-6 text-muted/60 text-xs font-medium max-w-[200px] truncate" title={user.address}>{user.address}</td>
                                        <td className="p-6 text-center">
                                            {user.activeLoans > 0 ? (
                                                <span className="inline-flex items-center px-4 py-2 rounded-xl text-[9px] font-black bg-green-500/10 text-green-500 border border-green-500/20 uppercase tracking-widest shadow-sm">
                                                    {user.activeLoans} Active Vault{user.activeLoans !== 1 ? 's' : ''}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-4 py-2 rounded-xl text-[9px] font-black bg-muted/30 text-muted/60 uppercase tracking-widest">
                                                    Inactive
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-6 text-right pr-10">
                                            <Link
                                                href={`/users/${user._id}`}
                                                className="inline-flex items-center gap-2 bg-muted/20 border-2 border-border text-foreground hover:text-white hover:bg-gold-gradient hover:border-transparent px-6 py-2 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
                                            >
                                                Details <ChevronRight size={14} />
                                            </Link>
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
                        <div className="p-10 text-center text-muted font-bold italic animate-pulse">Loading customers...</div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="p-10 text-center text-muted font-bold italic">
                            {filterStatus === 'active' ? 'No customers with active loans found.' : 'No matching customers found.'}
                        </div>
                    ) : (
                        <div className="divide-y divide-border/30">
                            {filteredUsers.map(user => (
                                <div key={user._id} className="p-6 space-y-6 hover:bg-muted/5 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-2xl gold-gradient flex items-center justify-center text-white font-black text-xl shadow-xl border-2 border-white/20">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-black text-foreground text-base uppercase tracking-tight">{user.name}</div>
                                                <div className="text-[10px] font-mono text-muted font-bold mt-0.5">{user.phone}</div>
                                            </div>
                                        </div>
                                        {user.activeLoans > 0 && (
                                            <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-[9px] font-black bg-green-500/10 text-green-500 border border-green-500/20 uppercase tracking-widest shadow-sm">
                                                Active
                                            </span>
                                        )}
                                    </div>

                                    <div className="pl-1 space-y-5">
                                        <p className="text-[11px] text-muted font-medium italic opacity-60 line-clamp-2 leading-relaxed">&quot;{user.address}&quot;</p>

                                        <Link
                                            href={`/users/${user._id}`}
                                            className="inline-flex items-center justify-center w-full gap-3 gold-gradient text-white font-black text-[10px]  tracking-widest px-6 py-4 rounded-[1.5rem] shadow-xl shadow-primary/20 transition-all active:scale-95"
                                        >
                                            View Details <ChevronRight size={14} />
                                        </Link>
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

// Components
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
