const { query } = require('../db/pool');

const XP_REWARDS = {
  quiz_complete: 20,
  quiz_correct_answer: 5,
  quiz_perfect_score: 50,
  flashcard_review: 2,
  flashcard_mastered: 10,
  study_session_30min: 15,
  study_session_1hr: 35,
  free_recall: 25,
  homework_question: 10,
  streak_bonus_multiplier: 0.1,
};

async function awardXP(userId, action, bonus = 0) {
  const baseXP = XP_REWARDS[action] || 0;
  const userResult = await query('SELECT xp, streak FROM users WHERE id = $1', [userId]);
  if (!userResult.rows[0]) throw new Error('User not found');

  const { streak } = userResult.rows[0];
  const multiplier = 1 + Math.min(streak * XP_REWARDS.streak_bonus_multiplier, 1.0);
  const totalXP = Math.round((baseXP + bonus) * multiplier);

  const updated = await query(
    'UPDATE users SET xp = xp + $1, updated_at = NOW() WHERE id = $2 RETURNING xp',
    [totalXP, userId]
  );

  const newTotal = updated.rows[0].xp;
  const newAchievements = await checkAchievements(userId, { streak });
  return { xpGained: totalXP, newTotal, newAchievements };
}

async function updateStreak(userId) {
  const result = await query('SELECT last_study_date, streak FROM users WHERE id = $1', [userId]);
  if (!result.rows[0]) return;

  const { last_study_date, streak } = result.rows[0];
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  let newStreak = streak;
  if (last_study_date === today) return { streak: newStreak, extended: false };
  else if (last_study_date === yesterday) newStreak = streak + 1;
  else newStreak = 1;

  await query(
    'UPDATE users SET streak = $1, last_study_date = $2, updated_at = NOW() WHERE id = $3',
    [newStreak, today, userId]
  );

  const achievements = await checkAchievements(userId, { streak: newStreak });
  return { streak: newStreak, extended: true, achievements };
}

async function checkAchievements(userId, stats = {}) {
  const newAchievements = [];
  const result = await query(`
    SELECT a.* FROM achievements a
    WHERE a.id NOT IN (SELECT achievement_id FROM user_achievements WHERE user_id = $1)
  `, [userId]);

  for (const achievement of result.rows) {
    let earned = false;
    switch (achievement.key) {
      case 'streak_3':  earned = (stats.streak || 0) >= 3;  break;
      case 'streak_7':  earned = (stats.streak || 0) >= 7;  break;
      case 'streak_30': earned = (stats.streak || 0) >= 30; break;
      case 'quiz_10':   earned = await checkSessionCount(userId, 'quiz', 10);  break;
      case 'quiz_100':  earned = await checkSessionCount(userId, 'quiz', 100); break;
      case 'recall_first': earned = await checkSessionCount(userId, 'free_recall', 1); break;
    }
    if (earned) {
      await query('INSERT INTO user_achievements (user_id, achievement_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [userId, achievement.id]);
      await query('UPDATE users SET xp = xp + $1 WHERE id = $2', [achievement.xp_reward, userId]);
      newAchievements.push(achievement);
    }
  }
  return newAchievements;
}

async function checkSessionCount(userId, type, minCount) {
  const result = await query('SELECT COUNT(*) FROM study_sessions WHERE user_id = $1 AND type = $2', [userId, type]);
  return parseInt(result.rows[0].count) >= minCount;
}

function getLevelFromXP(xp) {
  const level = Math.floor(xp / 500) + 1;
  const currentLevelXP = (level - 1) * 500;
  const nextLevelXP = level * 500;
  const progress = (xp - currentLevelXP) / 500;
  return { level, currentLevelXP, nextLevelXP, progress };
}

module.exports = { awardXP, updateStreak, checkAchievements, getLevelFromXP, XP_REWARDS };
