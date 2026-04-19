import { Agent, run, tool } from "@openai/agents";
import { z } from "zod";


const outputType = z.object({
  finalOutput: z.string().describe("The final answer to the user's query")
})
// Define the weather tool using Open-Meteo API 
const getWeatherTool = tool({
  name: "get_weather",
  description: "Get the current weather for a specific city.",
  parameters: z.object({
    city: z.string().describe("The name of the city to get weather for"),
  }),
  execute: async ({ city }: { city: string }) => {
    try {
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
      return `The current weather in ${name}, ${country} is ${temperature}°C with a wind speed of ${windspeed} km/h.`;
    } catch (error: any) {
      return `Error fetching weather for ${city}: ${error.message}`;
    }
  }
});

const agent = new Agent({
  name: "Weather Agent",
  instructions:
    "You are a helpful weather assistant. Use the tools provided to answer weather-related queries.",
  model: "nvidia/nemotron-3-nano-4b", 
  tools: [getWeatherTool],
  outputType: outputType
});

const result = await run(agent, "What is the weather like in Paris,korea,delhi?");
console.log(result.finalOutput);
