/**
 * Seed Supabase with sample data for user_id = default-user.
 * Run: npx ts-node src/scripts/seed-supabase.ts
 */
import "dotenv/config";
import { getSupabase } from "../data/supabase";

const USER_ID = process.env.USER_ID ?? "default-user";

async function seed() {
  const supabase = getSupabase();

  // Clear existing data for this user (optional - comment out to only insert)
  await supabase.from("expenses").delete().eq("user_id", USER_ID);
  await supabase.from("monthly_income").delete().eq("user_id", USER_ID);
  await supabase.from("savings_goals").delete().eq("user_id", USER_ID);

  const deadline = new Date();
  deadline.setMonth(deadline.getMonth() + 6);
  const deadlineStr = deadline.toISOString().slice(0, 10);

  const { error: e1 } = await supabase.from("monthly_income").insert([
    { user_id: USER_ID, month: "2025-01", amount: 30000 },
    { user_id: USER_ID, month: "2025-02", amount: 30000 },
    { user_id: USER_ID, month: "2025-03", amount: 30000 },
  ]);

  if (e1) {
    console.error("monthly_income insert failed:", e1.message);
    process.exit(1);
  }

  const { error: e2 } = await supabase.from("expenses").insert([
    { user_id: USER_ID, date: "2025-01-05", category: "Rent", amount: 8000 },
    { user_id: USER_ID, date: "2025-01-10", category: "Food", amount: 5879 },
    { user_id: USER_ID, date: "2025-01-15", category: "Entertainment", amount: 3920 },
    { user_id: USER_ID, date: "2025-02-05", category: "Rent", amount: 8000 },
    { user_id: USER_ID, date: "2025-02-12", category: "Food", amount: 8640 },
    { user_id: USER_ID, date: "2025-02-18", category: "Entertainment", amount: 5759 },
    { user_id: USER_ID, date: "2025-03-05", category: "Rent", amount: 8000 },
    { user_id: USER_ID, date: "2025-03-11", category: "Food", amount: 5640 },
    { user_id: USER_ID, date: "2025-03-20", category: "Entertainment", amount: 3759 },
  ]);

  if (e2) {
    console.error("expenses insert failed:", e2.message);
    process.exit(1);
  }

  const { error: e3 } = await supabase.from("savings_goals").insert([
    {
      user_id: USER_ID,
      name: "Emergency Fund",
      target_amount: 60000,
      current_amount: 0,
      deadline: deadlineStr,
    },
  ]);

  if (e3) {
    console.error("savings_goals insert failed:", e3.message);
    process.exit(1);
  }

  console.log("Seed done. Data in Supabase for user_id:", USER_ID);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
