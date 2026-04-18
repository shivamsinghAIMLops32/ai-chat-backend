import { Agent, run } from "@openai/agents";

const agent = new Agent({
  name: "History tutor",
  instructions:
    "You answer history questions clearly and concisely.",
  model: "google/gemma-4-e4b", // Still required so LM Studio knows which model to use
});

const result = await run(agent, "When did the Roman Empire fall?");
console.log(result.finalOutput);