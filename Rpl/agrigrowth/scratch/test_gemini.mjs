// Native global fetch will be used

const key = "AIzaSyAMFcFRjsTvwqyztsSG3LjB0T1vYleur2c";

async function run() {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Hello" }] }]
        })
      }
    );
    const data = await response.json();
    console.log("gemini-1.5-flash response:", JSON.stringify(data, null, 2));

    const response2 = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Hello" }] }]
        })
      }
    );
    const data2 = await response2.json();
    console.log("gemini-2.5-flash response:", JSON.stringify(data2, null, 2));

    const response3 = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Hello" }] }]
        })
      }
    );
    const data3 = await response3.json();
    console.log("gemini-3.1-flash-lite response:", JSON.stringify(data3, null, 2));
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

run();
