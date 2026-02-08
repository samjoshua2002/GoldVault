'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, MapPin, Phone, ChevronRight, User, Filter, ArrowUpDown, Trash2, AlertTriangle, X } from 'lucide-react';

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
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchUsers = () => {
        setLoading(true);
        setError(null);
        fetch('/api/users')
            .then(res => {
                if (!res.ok) throw new Error('Failed to access user registry');
                return res.json();
            })
            .then(data => {
                setUsers(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setError(err.message);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleDeleteUser = async () => {
        if (!userToDelete) return;

        setIsDeleting(true);
        try {
            const res = await fetch(`/api/users/${userToDelete._id}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                setShowDeleteModal(false);
                setUserToDelete(null);
                fetchUsers();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to delete user');
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('Network error occurred');
        } finally {
            setIsDeleting(false);
        }
    };

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
                            ) : error ? (
                                <tr>
                                    <td colSpan={5} className="p-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <p className="text-red-500 font-bold uppercase tracking-widest text-xs">Registry Connection Failed</p>
                                            <p className="text-[10px] text-muted-foreground">{error}</p>
                                            <button onClick={() => fetchUsers()} className="bg-primary text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20">Sync Registry</button>
                                        </div>
                                    </td>
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
                                            <div className="flex items-center justify-end gap-3">
                                                <button
                                                    onClick={() => {
                                                        setUserToDelete(user);
                                                        setShowDeleteModal(true);
                                                    }}
                                                    className="p-3 text-muted hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                                                    title="Delete User"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                                <Link
                                                    href={`/users/${user._id}`}
                                                    className="inline-flex items-center gap-2 bg-muted/20 border-2 border-border text-foreground hover:text-white hover:bg-gold-gradient hover:border-transparent px-6 py-2 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
                                                >
                                                    Details <ChevronRight size={14} />
                                                </Link>
                                            </div>
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
                    ) : error ? (
                        <div className="p-10 text-center space-y-6">
                            <div className="space-y-2">
                                <p className="text-red-500 font-bold uppercase tracking-widest text-[10px]">Registry Offline</p>
                                <p className="text-muted-foreground text-[9px]">{error}</p>
                            </div>
                            <button onClick={() => fetchUsers()} className="w-full gold-gradient text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl">Connect to Vault</button>
                        </div>
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

                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => {
                                                    setUserToDelete(user);
                                                    setShowDeleteModal(true);
                                                }}
                                                className="w-14 items-center justify-center flex bg-red-500/10 text-red-500 border-2 border-red-500/20 rounded-[1.2rem] transition-all active:scale-90"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                            <Link
                                                href={`/users/${user._id}`}
                                                className="inline-flex items-center justify-center flex-1 gap-3 gold-gradient text-white font-black text-[10px]  tracking-widest px-6 py-4 rounded-[1.5rem] shadow-xl shadow-primary/20 transition-all active:scale-95"
                                            >
                                                View Details <ChevronRight size={14} />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && userToDelete && (
                <div className="fixed inset-0 backdrop-blur-xl flex items-center justify-center z-[120] p-4 animate-in fade-in duration-500">
                    <div className="backdrop-blur-3xl rounded-[3rem] w-full max-w-md overflow-hidden shadow-[0_32px_64px_-15px_rgba(0,0,0,0.2)] border border-white dark:border-white/10 animate-in zoom-in-95 duration-300 bg-background/80">
                        <div className="p-8 text-center space-y-6">
                            <div className="w-20 h-20 bg-red-500/10 rounded-[2rem] flex items-center justify-center text-red-500 mx-auto border-2 border-red-500/20">
                                <AlertTriangle size={32} />
                            </div>

                            <div className="space-y-2">
                                <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">Serious Alert</h2>
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Permanent Data Erasure Sequence</p>
                            </div>

                            <div className="bg-muted/30 p-6 rounded-[2rem] border border-border">
                                <p className="text-sm font-bold text-foreground">
                                    You are about to delete <span className="text-primary">{userToDelete.name}</span> and all associated records.
                                </p>
                                <p className="text-xs text-muted-foreground mt-3 font-medium">
                                    This includes all active loans, historical records, pledged assets, and payment history. This action cannot be undone.
                                </p>
                            </div>

                            <div className="flex gap-4 pt-2">
                                <button
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setUserToDelete(null);
                                    }}
                                    className="flex-1 bg-muted/50 text-foreground py-5 rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest hover:bg-muted transition-all flex items-center justify-center gap-2"
                                >
                                    <X size={14} /> Cancel
                                </button>
                                <button
                                    onClick={handleDeleteUser}
                                    disabled={isDeleting}
                                    className="flex-[1.5] bg-red-500 text-white py-5 rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest shadow-xl shadow-red-500/30 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isDeleting ? 'Erasing...' : <><Trash2 size={14} /> Delete Forever</>}
                                </button>
                            </div>
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
                : 'text-muted hover:bg-muted/50'
                }`}
        >
            {children}
        </button>
    );
}
