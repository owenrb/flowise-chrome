// Function to open tabs
function openTab(evt, tabName) {
  const tabcontent = document.getElementsByClassName("tabcontent")
  for (let i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none"
  }

  const tablinks = document.getElementsByClassName("tablinks")
  for (let i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "")
  }

  document.getElementById(tabName).style.display = "block"
  evt.currentTarget.className += " active"
}

// Set the default tab to open
document
  .getElementById("openCompletion")
  .addEventListener("click", async (evt) => {
    openTab(evt, "Completion")
  })

// Set the default tab to open
document
  .getElementById("openSettings")
  .addEventListener("click", async (evt) => {
    openTab(evt, "Settings")
  })

document.getElementById("openCompletion").click()

// Save settings
document.getElementById("saveSettings").addEventListener("click", () => {
  const modelName = document.getElementById("modelName").value
  chrome.storage.local.set({ modelName: modelName }, () => {
    alert("Settings saved!")
  })
})

// Load settings when the popup is opened
document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.local.get(["modelName"], (result) => {
    if (result.modelName) {
      document.getElementById("modelName").value = result.modelName
    }
  })
})

async function chatCompletion(prompt) {
  chrome.storage.local.get(["modelName"], async (result) => {
    const modelName = result.modelName || "llama3.2" // Default to 'gpt-4' if no model is set

    try {
      const response = await fetch(
        "http://localhost:11434/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: modelName,
            messages: [{ role: "user", content: prompt }],
            stream: true,
          }),
        }
      )

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let result = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split("\n")

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const json = line.slice(6)
            if (json === "[DONE]") {
              break
            }
            const data = JSON.parse(json)
            const content = data.choices[0].delta.content
            if (content) {
              result += content
              responseOutput.textContent = result
            }
          }
        }
      }
    } catch (error) {
      responseOutput.textContent = "Error: " + error.message
    }
  })
}

// Generate response
document
  .getElementById("generateButton")
  .addEventListener("click", async () => {
    const prompt = document.getElementById("promptInput").value
    const responseOutput = document.getElementById("responseOutput")
    responseOutput.textContent = "Generating response..."
    await chatCompletion(prompt)
  })

// Check grammar
document.getElementById("grammarButton").addEventListener("click", async () => {
  const prompt = document.getElementById("promptInput").value
  const responseOutput = document.getElementById("responseOutput")
  responseOutput.textContent = "Checking grammar..."
  await chatCompletion("Check any grammar mistakes:\n\n" + prompt)
})

// Rewrite
document.getElementById("rewriteButton").addEventListener("click", async () => {
  const prompt = document.getElementById("promptInput").value
  const responseOutput = document.getElementById("responseOutput")
  responseOutput.textContent = "Rewriting..."
  await chatCompletion("Rewrite the following paragraph:\n\n" + prompt)
})

// Explain
document.getElementById("explainButton").addEventListener("click", async () => {
  const prompt = document.getElementById("promptInput").value
  const responseOutput = document.getElementById("responseOutput")
  responseOutput.textContent = "Analyzing..."
  await chatCompletion("Explain the following:\n\n" + prompt)
})
