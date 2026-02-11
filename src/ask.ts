/**
 * Finance Copilot — ask questions; OpenAI answers using your Supabase data.
 * Requires OPENAI_API_KEY in .env.
 * Usage: npm run ask   (chat loop; type exit or quit to leave)
 *        npm run ask -- "your question"   (one question)
 */
import "dotenv/config";
import * as readline from "readline";
import { runWorkTreeWithContext } from "./work-tree/orchestrator";
import { getMockUserContext } from "./data/mock-user-data";
import { isOpenAIAvailable, answerWithData } from "./llm";

const useMock = process.env.USE_MOCK_DATA === "1" || process.argv.includes("--mock");
const userId = process.env.USER_ID ?? "default-user";

function isExit(q: string): boolean {
  const t = q.toLowerCase().trim();
  return t === "exit" || t === "quit" || t === "bye" || t === "q" || t === "no";
}

async function runChat() {
  if (!isOpenAIAvailable()) {
    console.error("Set OPENAI_API_KEY in .env to use the copilot.");
    process.exit(1);
  }

  const context = useMock
    ? getMockUserContext()
    : await (await import("./data/supabase")).fetchUserFinancialContext(userId);
  const result = runWorkTreeWithContext(context);
  const output = result.output;

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  console.log("\nFinance Copilot — ask anything. Your data from Supabase, answers from OpenAI.");
  console.log("Type exit or quit when done.\n");

  function askAgain() {
    rl.question("You: ", (q) => {
      if (isExit(q)) {
        console.log("Bye.");
        rl.close();
        return;
      }
      answerWithData(q, output)
        .then((out) => {
          console.log("\nCopilot: " + out + "\n");
          askAgain();
        })
        .catch((err) => {
          console.error("Error:", err.message || err);
          askAgain();
        });
    });
  }

  askAgain();
}

const args = process.argv.slice(2).filter((a) => a !== "--mock" && !a.startsWith("--"));
const argQuestion = args.length > 0 ? args.join(" ") : undefined;

if (argQuestion) {
  if (!isOpenAIAvailable()) {
    console.error("Set OPENAI_API_KEY in .env to use the copilot.");
    process.exit(1);
  }
  (async () => {
    const context = useMock
      ? getMockUserContext()
      : await (await import("./data/supabase")).fetchUserFinancialContext(userId);
    const result = runWorkTreeWithContext(context);
    const out = await answerWithData(argQuestion, result.output);
    console.log(out);
    process.exit(0);
  })().catch((e) => {
    console.error(e);
    process.exit(1);
  });
} else {
  runChat().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
