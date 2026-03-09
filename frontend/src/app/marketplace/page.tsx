'use client';
import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { marketplaceApi } from '@/lib/api';
import { ShoppingBag, Star, Download, Search, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/lib/store';

export default function MarketplacePage() {
  const { user } = useAuthStore();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const loadItems = async () => {
    setLoading(true);
    try {
      const res = await marketplaceApi.list({ search, type: typeFilter || undefined });
      setItems(res.data.items || []);
    } catch {
      toast.error('Failed to load marketplace');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadItems(); }, [search, typeFilter]);

  const handlePurchase = async (id: string) => {
    setPurchasing(id);
    try {
      await marketplaceApi.purchase(id);
      toast.success('Purchase successful! 🎉');
      loadItems();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Purchase failed');
    } finally {
      setPurchasing(null);
    }
  };

  const typeOptions = [
    { value: '', label: 'All' },
    { value: 'flashcard_pack', label: 'Flashcard Packs' },
    { value: 'study_guide', label: 'Study Guides' },
    { value: 'exam_prep', label: 'Exam Prep' },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-extrabold flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-green-400" />
              </div>
              Marketplace
            </h1>
            <p className="text-slate-400 mt-2">Buy and sell flashcard packs and study guides.</p>
          </div>
        </div>

        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search packs..." className="input pl-10" />
          </div>
          <div className="flex gap-2">
            {typeOptions.map(opt => (
              <button key={opt.value} onClick={() => setTypeFilter(opt.value)} className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${typeFilter === opt.value ? 'bg-brand-500/20 border-brand-500/40 text-brand-400' : 'border-surface-border text-slate-400 hover:text-white'}`}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-48" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-slate-500"
