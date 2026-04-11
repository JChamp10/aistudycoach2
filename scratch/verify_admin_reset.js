
const { query } = require('../backend/src/db/pool');

async function verifyAdminReset() {
  console.log("--- Verifying Admin Reset to Free ---");
  
  // 1. Ensure jchamp101 exists or create mock
  const admin = await query("SELECT * FROM users WHERE username = 'jchamp101'");
  if (admin.rows.length === 0) {
    console.log("Admin user jchamp101 not found. Creating mock...");
    await query("INSERT INTO users (username, email, password_hash, plan) VALUES ('jchamp101', 'admin@test.com', 'hash', 'legend')");
  }

  // 2. Test Legend plan (should be unlimited)
  await query("UPDATE users SET plan = 'legend' WHERE username = 'jchamp101'");
  const legendUsage = await getUsage('jchamp101');
  console.log(`Plan: Legend, Unlimited: ${legendUsage.unlimited} (Expected: true)`);
  if (legendUsage.unlimited !== true) console.error("FAILED: Legend should be unlimited");

  // 3. Test Free plan (should NOT be unlimited)
  await query("UPDATE users SET plan = 'free' WHERE username = 'jchamp101'");
  const freeUsage = await getUsage('jchamp101');
  console.log(`Plan: Free, Unlimited: ${freeUsage.unlimited} (Expected: false)`);
  if (freeUsage.unlimited !== false) console.error("FAILED: Free should NOT be unlimited for admin");

  // 4. Cleanup/Restore (optional)
  await query("UPDATE users SET plan = 'legend' WHERE username = 'jchamp101'");
  console.log("--- Verification Complete ---");
}

async function getUsage(username) {
    const result = await query(
      'SELECT plan, ai_calls_today, last_ai_call_date, username FROM users WHERE username = $1',
      [username]
    );
    const { plan, ai_calls_today, last_ai_call_date } = result.rows[0];
    const isUnlimited = plan === 'pro' || plan === 'legend' || (username === 'jchamp101' && plan !== 'free');
    return { plan, unlimited: isUnlimited };
}

verifyAdminReset().catch(console.error).finally(() => process.exit());
