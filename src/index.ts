import { Agent, run, tool } from "@openai/agents";
import { z } from "zod";

const outputType = z.object({
  finalOutput: z.string().describe("The final answer to the user's query"),
});
// Define the weather tool using Open-Meteo API
const getWeatherTool = tool({
  name: "get_weather",
  description: "Get the current weather for a specific city.",
  parameters: z.object({
    cities: z
      .array(z.string())
      .describe("An array of city names to get weather for"),
  }),
  execute: async ({ cities }: { cities: string[] }) => {
    try {
      const weatherResults = await Promise.all(
        cities.map(async (city) => {
          // 1. Geocode the city to get lat/lon
          const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
          const geoRes = await fetch(geoUrl);
          const geoData = await geoRes.json();

          if (!geoData.results || geoData.results.length === 0) {
            return `Could not find coordinates for city: ${city}`;
          }

          const { latitude, longitude, name, country } = geoData.results[0];

          // 2. Get weather data
          const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`;
          const weatherRes = await fetch(weatherUrl);
          const weatherData = await weatherRes.json();

          const { temperature, windspeed } = weatherData.current_weather;
          return `Location: ${name}, ${country} | Temp: ${temperature}°C | Wind: ${windspeed} km/h`;
        }),
      );

      return weatherResults.join("\n");
    } catch (error: any) {
      return `Error fetching weather data: ${error.message}`;
    }
  },
});

const agent = new Agent({
  name: "Weather Agent",
  instructions:
    'You are an efficient, professional weather assistant. You can retrieve weather data for multiple cities at once to be as fast as possible. Summarize the requested data accurately in a human-readable format. You MUST return your final response as a RAW JSON object matching the requested schema. Do NOT wrap your response in markdown code blocks (like ```json ... ```). Just return the JSON object directly. Your JSON object must have exactly one key called "finalOutput" that contains your text summary.',
  model: "google/gemma-4-e2b",
  tools: [getWeatherTool],
  outputType: outputType,
});

try {
  const result: any = await run(
    agent,
    "What is the weather like in Paris, Seoul, and New Delhi?",
  );
  console.log(result.finalOutput);
} catch (error) {
  console.error("Agent execution failed:", error);
}
