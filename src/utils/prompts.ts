import { stdin, stdout } from "node:process";
import { createInterface } from "node:readline/promises";

export async function prompt(question: string, defaultValue?: string): Promise<string> {
  const rl = createInterface({ input: stdin, output: stdout });
  const answer = await rl.question(`  ${question} `);
  rl.close();
  return answer || defaultValue || "";
}
