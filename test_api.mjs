import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

async function test() {
  try {
    console.log("Testing with model: claude-3-sonnet-20240229");
    const response = await client.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 100,
      messages: [{ role: "user", content: "Hi" }],
    });
    console.log("Success!");
    console.log(response.content[0]);
  } catch (error) {
    console.error("Error:", error.message);
    if (error.error) {
      console.error("API Error:", error.error);
    }
  }
}

test();
