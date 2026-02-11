/**
 * Personal Finance Copilot — entry point.
 * Run work tree for one user and print the report.
 * Use --mock to run with built-in mock user data (no Supabase).
 */
import "dotenv/config";
import { runWorkTree, runWorkTreeWithContext, formatCopilotReport } from "./work-tree/orchestrator";
import { getMockUserContext } from "./data/mock-user-data";

const useMock = process.env.USE_MOCK_DATA === "1" || process.argv.includes("--mock");
const userId = process.env.USER_ID ?? process.argv.find((a) => a !== "--mock");

function main() {
  if (useMock) {
    const context = getMockUserContext();
    const result = runWorkTreeWithContext(context);
    console.log(formatCopilotReport(result.output));
    return;
  }
  if (!userId) {
    console.error("Provide USER_ID in env or as first argument, or use --mock for mock data.");
    process.exit(1);
  }
  runWorkTree(userId)
    .then((result) => {
      console.log(formatCopilotReport(result.output));
    })
    .catch((err) => {
      console.error("Copilot run failed:", err);
      process.exit(1);
    });
}

main();
