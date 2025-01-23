document
  .getElementById("generateButton")
  .addEventListener("click", async () => {
    const prompt =
      "Check for any grammar mistake:\n\n" +
      document.getElementById("promptInput").value;
    const responseOutput = document.getElementById("responseOutput");
    responseOutput.textContent = "Generating response...";

    try {
      const response = await fetch(
        "http://localhost:11434/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "llama3.2",
            messages: [{ role: "user", content: prompt }],
            stream: true,
          }),
        }
      );

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let result = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const json = line.slice(6);
            if (json === "[DONE]") {
              break;
            }
            const data = JSON.parse(json);
            const content = data.choices[0].delta.content;
            if (content) {
              result += content;
              responseOutput.textContent = result;
            }
          }
        }
      }
    } catch (error) {
      responseOutput.textContent = "Error: " + error.message;
    }
  });
