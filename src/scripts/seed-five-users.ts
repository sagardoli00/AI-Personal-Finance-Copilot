/**
 * Create 5 users with 5 months of history.
 * Requires: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in .env
 * Run: npx ts-node src/scripts/seed-five-users.ts
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

const USERS = [
  { email: "user1@finance-copilot.test", password: "Test123!@#" },
  { email: "user2@finance-copilot.test", password: "Test123!@#" },
  { email: "user3@finance-copilot.test", password: "Test123!@#" },
  { email: "user4@finance-copilot.test", password: "Test123!@#" },
  { email: "user5@finance-copilot.test", password: "Test123!@#" },
];

const CATEGORIES = ["Food", "Rent", "Entertainment", "Transport", "Shopping", "Health", "Utilities"];

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function seedUser(userId: string, baseIncome: number) {
  const months = ["2024-10", "2024-11", "2024-12", "2025-01", "2025-02"];

  for (const month of months) {
    const inc = baseIncome + randomBetween(-2000, 2000);
    await supabase.from("monthly_income").insert({ user_id: userId, month, amount: inc, source: "Salary" });
  }

  for (const month of months) {
    const [y, m] = month.split("-").map(Number);
    const daysInMonth = new Date(y, m, 0).getDate();
    const numExpenses = randomBetween(8, 15);
    for (let i = 0; i < numExpenses; i++) {
      const day = randomBetween(1, daysInMonth);
      const date = `${month}-${String(day).padStart(2, "0")}`;
      const category = randomChoice(CATEGORIES);
      const amount = randomBetween(100, 5000);
      await supabase.from("expenses").insert({ user_id: userId, date, category, amount });
    }
  }

  const goals = [
    { name: "Emergency Fund", target: 60000, current: randomBetween(5000, 25000) },
    { name: "Vacation", target: 30000, current: randomBetween(0, 10000) },
  ];
  const deadline = new Date();
  deadline.setMonth(deadline.getMonth() + 6);
  const deadlineStr = deadline.toISOString().slice(0, 10);

  for (const g of goals) {
    await supabase.from("savings_goals").insert({
      user_id: userId,
      name: g.name,
      target_amount: g.target,
      current_amount: g.current,
      deadline: deadlineStr,
    });
  }
}

async function main() {
  const created: { email: string; password: string; id?: string }[] = [];

  for (const u of USERS) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
    });
    if (error) {
      const existing = await supabase.auth.admin.listUsers();
      const found = existing.data.users.find((x) => x.email === u.email);
      if (found) {
        console.log(`User ${u.email} exists, seeding data…`);
        await seedUser(found.id, 30000 + randomBetween(0, 15000));
        created.push({ ...u, id: found.id });
      } else {
        console.error(`Failed ${u.email}:`, error.message);
      }
    } else if (data.user) {
      console.log(`Created ${u.email}`);
      await seedUser(data.user.id, 30000 + randomBetween(0, 15000));
      created.push({ ...u, id: data.user.id });
    }
  }

  console.log("\nDone. Test users:");
  created.forEach((u) => console.log(`  ${u.email} / ${u.password}`));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
