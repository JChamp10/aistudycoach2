'use client';
import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { flashcardApi } from '@/lib/api';
import { Search, Users, Copy, Check, Clock, Layers } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { StaggerContainer, StaggerItem } from '@/components/layout/StaggerContainer';

export default function CommunityPage() {
  const [decks, setDecks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    // Custom fetch until we add it to api.ts properly, so let's just use fetch
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/flashcards/community`)
      .then(r => r.json())
      .then(d => setDecks(d.decks || []))
      .catch(() => toast.error('Failed to load community decks'))
      .finally(() => setLoading(false));
  }, []);

  const copyLink = (token: string, id: string) => {
    const url = `${window.location.origin}/study/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success('Link copied!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredDecks = decks.filter(d => 
    d.title?.toLowerCase().includes(search.toLowerCase()) || 
    d.description?.toLowerCase().includes(search.toLowerCase()) ||
    d.creator_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-extrabold flex items-center gap-3 text-ink">
              <div className="w-12 h-12 rounded-2xl bg-brand-500/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-brand-500" />
              </div>
              Community Decks
            </h1>
            <p className="text-ink-muted mt-2 tracking-wide">
              Discover and study flashcards created by the StudyCoach community.
            </p>
          </div>
          
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" />
            <input 
              type="text" 
              placeholder="Search decks, topics, creators..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input pl-11 w-full bg-white shadow-sm"
            />
          </div>
        </div>

        {/* Decks Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-48 rounded-3xl" />)}
          </div>
        ) : filteredDecks.length === 0 ? (
          <div className="text-center py-20 rounded-3xl card border-dashed border-2 bg-surface-muted/50">
            <Users className="w-12 h-12 text-ink-faint mx-auto mb-4" />
            <h2 className="text-xl font-bold text-ink">No decks found</h2>
            <p className="text-ink-muted mt-2">Try adjusting your search terms.</p>
          </div>
        ) : (
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredDecks.map((deck, i) => (
              <StaggerItem key={deck.id}>
                <div
                  className="card p-6 flex flex-col hover:-translate-y-1 hover:shadow-xl transition-all"
                  style={{ borderColor: 'var(--border-primary)' }}>
                
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0 pr-4">
                    <h3 className="font-bold text-lg truncate" style={{ color: 'var(--text-primary)' }}>{deck.title}</h3>
                    <p className="text-sm truncate" style={{ color: 'var(--text-light)' }}>By <span className="font-semibold" style={{ color: 'var(--brand-400)' }}>@{deck.creator_name}</span></p>
                  </div>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                    style={{ background: 'var(--bg-muted)', color: 'var(--text-light)' }}>
                    {deck.creator_name?.charAt(0).toUpperCase()}
                  </div>
                </div>

                <p className="text-sm line-clamp-2 mb-6 flex-1" style={{ color: 'var(--text-muted)' }}>
                  {deck.description || 'No description provided.'}
                </p>

                <div className="flex items-center gap-4 text-xs font-semibold mb-6" style={{ color: 'var(--text-light)' }}>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg" style={{ background: 'var(--bg-muted)' }}>
                    <Layers className="w-3.5 h-3.5" />
                    <span>{deck.card_count || 0} cards</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" style={{ color: 'var(--text-faint)' }} />
                    <span>{new Date(deck.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-auto">
                  <Link href={`/study/${deck.share_token}`} className="btn-primary flex-1 text-center py-2.5">
                    Study Now
                  </Link>
                  <button onClick={() => copyLink(deck.share_token, deck.id)}
                    className="btn-ghost px-3 py-2.5" title="Copy Link">
                    {copiedId === deck.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </div>
    </AppLayout>
  );
}
