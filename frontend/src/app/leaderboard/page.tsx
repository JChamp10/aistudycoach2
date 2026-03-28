'use client';
import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Trophy, Zap, Flame, MapPin } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { motion } from 'framer-motion';
import { StaggerContainer, StaggerItem } from '@/components/layout/StaggerContainer';
import { getLevelFromXP } from '@/lib/utils';

const API = process.env.NEXT_PUBLIC_API_URL;

// ─── Podium ───────────────────────────────────────────────────────────────────
function Podium({ entries, tab }: { entries: any[]; tab: string }) {
  if (entries.length < 3) return null;
  const user = useAuthStore.getState().user;

  const metalColors = [
    { gradient: 'linear-gradient(135deg, #FFD700, #FFA500)', glow: 'rgba(255,215,0,0.4)', border: '#FFD700', label: '🥇' },
    { gradient: 'linear-gradient(135deg, #C0C0C0, #A0A0A0)', glow: 'rgba(192,192,192,0.3)', border: '#C0C0C0', label: '🥈' },
    { gradient: 'linear-gradient(135deg, #CD7F32, #8B4513)', glow: 'rgba(205,127,50,0.3)', border: '#CD7F32', label: '🥉' },
  ];

  // Reorder: [2nd, 1st, 3rd]
  const podiumOrder = [1, 0, 2];
  const heights = [140, 180, 110];

  return (
    <div className="flex items-end justify-center gap-3 mb-8 pt-4">
      {podiumOrder.map((rankIdx, visualIdx) => {
        const entry = entries[rankIdx];
        if (!entry) return null;
        const metal = metalColors[rankIdx];
        const xp = tab === 'weekly' ? entry.weekly_xp : entry.xp;
        const isMe = entry.id === user?.id;
        const level = getLevelFromXP(xp || 0);
        const stage = level.level <= 3 ? '🥚' : level.level <= 8 ? '🐣' : level.level <= 15 ? '🦅' : '🔥';

        return (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: visualIdx * 0.15, type: 'spring', stiffness: 200 }}
            className="flex flex-col items-center relative"
            style={{ minWidth: rankIdx === 0 ? 130 : 110 }}
          >
            {/* Aura particles */}
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="aura-particle"
                style={{
                  width: 4 + Math.random() * 4,
                  height: 4 + Math.random() * 4,
                  background: metal.border,
                  top: `${10 + Math.random() * 30}%`,
                  left: `${20 + Math.random() * 60}%`,
                  animationDelay: `${i * 0.5}s`,
                  opacity: 0.5,
                }}
              />
            ))}

            {/* Medal */}
            <div className="text-3xl mb-2">{metal.label}</div>

            {/* Avatar */}
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl mb-2 relative"
              style={{
                background: metal.gradient,
                boxShadow: `0 0 20px ${metal.glow}`,
                color: rankIdx === 0 ? '#2d1f0e' : 'white',
              }}
            >
              {entry.username?.[0]?.toUpperCase()}
              <span className="absolute -bottom-1 -right-1 text-sm">{stage}</span>
            </div>

            {/* Name */}
            <div className="text-sm font-bold text-center truncate max-w-[100px]" style={{ color: 'var(--text-primary)' }}>
              {entry.username}
              {isMe && <span className="text-xs ml-1" style={{ color: 'var(--brand-400)' }}>(You)</span>}
            </div>

            {/* XP */}
            <div className="flex items-center gap-1 mt-1">
              <Zap className="w-3 h-3" style={{ color: metal.border }} />
              <span className="text-xs font-bold" style={{ color: metal.border }}>
                {Number(xp || 0).toLocaleString()}
              </span>
            </div>

            {/* Podium block */}
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: heights[visualIdx] }}
              transition={{ delay: 0.3 + visualIdx * 0.1, duration: 0.6, ease: 'easeOut' }}
              className="w-full mt-3 rounded-t-xl"
              style={{
                background: metal.gradient,
                boxShadow: `0 -4px 20px ${metal.glow}`,
                opacity: 0.85,
                minHeight: 0,
              }}
            />
          </motion.div>
        );
      })}
    </div>
  );
}

export default function LeaderboardPage() {
  const { user, token } = useAuthStore();
  const [tab, setTab] = useState<'global' | 'weekly' | 'regional'>('global');
  const [data, setData] = useState<any[]>([]);
  const [region, setRegion] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/leaderboard/${tab}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => {
        setData(d.leaderboard || []);
        if (d.region) setRegion(d.region);
      })
      .finally(() => setLoading(false));
  }, [tab, token]);

  const tabs = [
    { key: 'global', label: '🌍 All Time' },
    { key: 'weekly', label: '📅 This Week' },
    { key: 'regional', label: '📍 My Region' },
  ];

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(217,119,6,0.1)' }}>
              <Trophy className="w-6 h-6 text-amber-400" />
            </div>
            Leaderboard
          </h1>
          <p className="mt-2" style={{ color: 'var(--text-light)' }}>Top students by XP earned.</p>
        </div>

        {user?.region && (
          <div className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl border w-fit"
            style={{ background: 'var(--bg-muted)', borderColor: 'var(--border-primary)', color: 'var(--text-light)' }}>
            <MapPin className="w-4 h-4" style={{ color: 'var(--brand-400)' }} />
            Your region: <span className="font-medium ml-1" style={{ color: 'var(--text-primary)' }}>{user.region}</span>
          </div>
        )}

        <div className="flex gap-2 p-1 rounded-xl" style={{ background: 'var(--bg-muted)' }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
              style={tab === t.key
                ? { background: `linear-gradient(135deg, var(--brand-400), var(--brand-500))`, color: 'white' }
                : { color: 'var(--text-light)' }}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'regional' && region && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl border"
            style={{ borderColor: 'var(--border-brand)', background: 'var(--brand-50)' }}>
            <MapPin className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--brand-400)' }} />
            <div>
              <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Regional Rankings</div>
              <div className="text-xs" style={{ color: 'var(--text-light)' }}>
                Showing top students in <span style={{ color: 'var(--brand-400)' }}>{region}</span>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[...Array(10)].map((_, i) => <div key={i} className="skeleton h-16 w-full" />)}
          </div>
        ) : (
          <>
            {/* Podium for top 3 */}
            <Podium entries={data.slice(0, 3)} tab={tab} />

            {/* Remaining entries */}
            <StaggerContainer className="space-y-2">
              {data.slice(3).map((entry: any, i: number) => {
                const isMe = entry.id === user?.id;
                const xp = tab === 'weekly' ? entry.weekly_xp : entry.xp;
                return (
                  <StaggerItem key={entry.id}>
                    <div
                      className="flex items-center gap-4 px-4 py-3 rounded-xl border transition-colors"
                      style={{
                        borderColor: isMe ? 'var(--border-brand)' : 'var(--border-primary)',
                        background: isMe ? 'var(--brand-50)' : 'var(--bg-card)',
                      }}>
                      <div className="w-10 text-center flex-shrink-0">
                        <span className="text-lg font-bold" style={{ color: 'var(--text-faint)' }}>#{entry.rank || i + 4}</span>
                      </div>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0"
                        style={{
                          background: 'rgba(var(--brand-400-rgb, 255,107,26), 0.15)',
                          border: '1.5px solid var(--border-brand)',
                          color: 'var(--brand-400)',
                        }}>
                        {entry.username?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold flex items-center gap-2 flex-wrap" style={{ color: 'var(--text-primary)' }}>
                          {entry.username}
                          {isMe && (
                            <span className="text-xs px-2 py-0.5 rounded-full"
                              style={{ background: 'var(--brand-50)', color: 'var(--brand-400)', border: '1px solid var(--border-brand)' }}>
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-xs flex items-center gap-3 mt-0.5" style={{ color: 'var(--text-faint)' }}>
                          <span className="flex items-center gap-1">
                            <Flame className="w-3 h-3 text-amber-400" />
                            {entry.streak || 0} day streak
                          </span>
                          {entry.region && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" style={{ color: 'var(--brand-400)' }} />
                              {entry.region}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="flex items-center gap-1 font-bold" style={{ color: 'var(--brand-400)' }}>
                          <Zap className="w-4 h-4" />
                          {Number(xp || 0).toLocaleString()}
                        </div>
                        <div className="text-xs" style={{ color: 'var(--text-faint)' }}>XP</div>
                      </div>
                    </div>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>

            {data.length === 0 && (
              <div className="text-center py-12" style={{ color: 'var(--text-faint)' }}>
                {tab === 'regional'
                  ? 'No one in your region yet. Be the first!'
                  : 'No data yet. Start studying to appear here!'}
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
