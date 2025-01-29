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
    // show erase
    document.getElementById("binImage").style.display = "inline"
  })

// Set the default tab to open
document
  .getElementById("openSettings")
  .addEventListener("click", async (evt) => {
    openTab(evt, "Settings")
    // hide erase
    document.getElementById("binImage").style.display = "none"
  })

document.getElementById("openCompletion").click()

// Save settings
document.getElementById("saveSettings").addEventListener("click", () => {
  const modelName = document.getElementById("modelName").value
  const hostName = document.getElementById("hostName").value
  chrome.storage.local.set({ modelName, hostName }, () => {
    alert("Settings saved!")
  })
})

// Load settings when the popup is opened
document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.local.get(
    ["modelName", "hostName", "prompt", "result"],
    (result) => {
      if (result.modelName) {
        document.getElementById("modelName").value = result.modelName
      }
      if (result.hostName) {
        document.getElementById("hostName").value = result.hostName
      }
      if (result.prompt) {
        document.getElementById("promptInput").value = result.prompt
      }
      if (result.result) {
        document.getElementById("responseOutput").textContent = result.result
      }
    }
  )
})

async function chatCompletion(prompt) {
  chrome.storage.local.set({ prompt })

  chrome.storage.local.get(["modelName", "hostName"], async (result) => {
    const modelName = result.modelName || "llama3.2"
    const hostName = result.hostName || "http://localhost:11434"

    try {
      const response = await fetch(`${hostName}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: modelName,
          messages: [{ role: "user", content: prompt }],
          stream: true,
        }),
      })

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
      chrome.storage.local.set({ result })
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

// Clear Content
document.getElementById("binImage").addEventListener("click", () => {
  chrome.storage.local.set({ result: "", prompt: "" })

  const prompt = document.getElementById("promptInput")
  prompt.value = ""
  const responseOutput = document.getElementById("responseOutput")
  responseOutput.textContent = ""
})
