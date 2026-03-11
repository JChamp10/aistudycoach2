'use client';
import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { marketplaceApi } from '@/lib/api';
import { ShoppingBag, Star, Download, Search, Plus, X, BookOpen, FileText, GraduationCap, PenTool } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';

const ITEM_TYPES = [
  { value: '', label: 'All', icon: ShoppingBag },
  { value: 'flashcard_pack', label: 'Flashcards', icon: BookOpen },
  { value: 'study_guide', label: 'Study Guides', icon: FileText },
  { value: 'exam_prep', label: 'Exam Prep', icon: GraduationCap },
  { value: 'homework', label: 'Homework', icon: PenTool },
];

export default function MarketplacePage() {
  const { user } = useAuthStore();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [showSell, setShowSell] = useState(false);
  const [sellForm, setSellForm] = useState({
    title: '', description: '', price: '', item_type: 'flashcard_pack', subject: '', content: ''
  });
  const [selling, setSelling] = useState(false);

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

  const handleSell = async () => {
    if (!sellForm.title.trim() || !sellForm.description.trim()) return toast.error('Fill in title and description');
    setSelling(true);
    try {
      await marketplaceApi.create({
        title: sellForm.title,
        description: sellForm.description,
        price: parseFloat(sellForm.price) || 0,
        item_type: sellForm.item_type,
        subject: sellForm.subject,
        preview_content: sellForm.content,
        homework_content: sellForm.item_type === 'homework' ? sellForm.content : undefined,
      });
      toast.success('Listing created! 🎉');
      setShowSell(false);
      setSellForm({ title: '', description: '', price: '', item_type: 'flashcard_pack', subject: '', content: '' });
      loadItems();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create listing');
    } finally {
      setSelling(false);
    }
  };

  const typeIcons: Record<string, any> = {
    flashcard_pack: BookOpen,
    study_guide: FileText,
    exam_prep: GraduationCap,
    homework: PenTool,
  };

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
            <p className="text-slate-400 mt-2">Buy and sell flashcard packs, study guides, and homework.</p>
          </div>
          <button onClick={() => setShowSell(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Sell Something
          </button>
        </div>

        {/* Sell modal */}
        <AnimatePresence>
          {showSell && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={e => e.target === e.currentTarget && setShowSell(false)}>
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                className="card w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-extrabold">Create a Listing</h2>
                  <button onClick={() => setShowSell(false)} className="text-slate-500 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {ITEM_TYPES.filter(t => t.value).map(t => (
                      <button key={t.value} onClick={() => setSellForm(f => ({ ...f, item_type: t.value }))}
                        className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${sellForm.item_type === t.value ? 'bg-brand-500/20 border-brand-500/50 text-brand-400' : 'border-surface-border text-slate-400 hover:text-white'}`}>
                        <t.icon className="w-4 h-4" /> {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">Title</label>
                  <input value={sellForm.title} onChange={e => setSellForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. Complete Biology Flashcard Pack" className="input" />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">Subject</label>
                  <input value={sellForm.subject} onChange={e => setSellForm(f => ({ ...f, subject: e.target.value }))}
                    placeholder="e.g. Biology, Math, History..." className="input" />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">Description</label>
                  <textarea value={sellForm.description} onChange={e => setSellForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Describe what's included..." className="input min-h-[80px] resize-none" />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">
                    {sellForm.item_type === 'homework' ? 'Homework Content / Solution' : 'Preview Content'}
                  </label>
                  <textarea value={sellForm.content} onChange={e => setSellForm(f => ({ ...f, content: e.target.value }))}
                    placeholder={sellForm.item_type === 'homework'
                      ? 'Paste the homework question and your solution here...'
                      : 'Add a preview of your content...'}
                    className="input min-h-[100px] resize-none" />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">Price (USD) — leave 0 for free</label>
                  <input type="number" min="0" step="0.99" value={sellForm.price}
                    onChange={e => setSellForm(f => ({ ...f, price: e.target.value }))}
                    placeholder="0.00" className="input" />
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowSell(false)} className="btn-ghost flex-1">Cancel</button>
                  <button onClick={handleSell} disabled={selling} className="btn-primary flex-1 disabled:opacity-50">
                    {selling ? 'Publishing...' : 'Publish Listing'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="input pl-10" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {ITEM_TYPES.map(opt => (
              <button key={opt.value} onClick={() => setTypeFilter(opt.value)}
                className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition-all flex items-center gap-1.5 ${typeFilter === opt.value ? 'bg-brand-500/20 border-brand-500/40 text-brand-400' : 'border-surface-border text-slate-400 hover:text-white'}`}>
                <opt.icon className="w-3.5 h-3.5" /> {opt.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-48" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No items found. Be the first to sell!</p>
            <button onClick={() => setShowSell(true)} className="btn-primary mt-4 mx-auto flex items-center gap-2">
              <Plus className="w-4 h-4" /> Create Listing
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => {
              const IconComp = typeIcons[item.item_type] || ShoppingBag;
              return (
                <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="card hover:border-brand-500/30 transition-all group flex flex-col">
                  <div className="flex items-start justify-between mb-3">
                    <span className="badge bg-brand-500/10 text-brand-400 border-brand-500/20 capitalize flex items-center gap-1">
                      <IconComp className="w-3 h-3" />
                      {item.item_type?.replace('_', ' ')}
                    </span>
                    {item.rating_count > 0 && (
                      <div className="flex items-center gap-1 text-amber-400 text-sm">
                        <Star className="w-4 h-4 fill-amber-400" />
                        {parseFloat(item.rating_avg).toFixed(1)}
                        <span className="text-slate-500">({item.rating_count})</span>
                      </div>
                    )}
                  </div>
                  <h3 className="font-bold text-base mb-1 group-hover:text-brand-400 transition-colors">{item.title}</h3>
                  {item.subject && <div className="text-xs text-slate-500 mb-2">{item.subject}</div>}
                  <p className="text-sm text-slate-400 line-clamp-2 flex-1">{item.description}</p>
                  <div className="mt-4 pt-4 border-t border-surface-border flex items-center justify-between">
                    <div>
                      <div className="font-bold text-lg">
                        {item.price === '0.00' || !item.price
                          ? <span className="text-green-400">Free</span>
                          : <span>${parseFloat(item.price).toFixed(2)}</span>}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1">
                        <Download className="w-3 h-3" /> {item.download_count} downloads
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="text-xs text-slate-500">by {item.creator_name}</div>
                      {item.creator_id !== user?.id && (
                        <button onClick={() => handlePurchase(item.id)} disabled={purchasing === item.id}
                          className="btn-primary text-xs py-1.5 px-3 disabled:opacity-50">
                          {purchasing === item.id ? '...' : item.price === '0.00' ? 'Get free' : 'Buy'}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
