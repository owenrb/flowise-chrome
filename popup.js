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

// Completion
document
  .getElementById("openCompletion")
  .addEventListener("click", async (evt) => {
    openTab(evt, "Completion")
    // show erase
    document.getElementById("binImage").style.display = "inline"
  })

let chatInitialized = false

// Chat
document.getElementById("openChat").addEventListener("click", async (evt) => {
  openTab(evt, "Chat")
  // hide erase
  document.getElementById("binImage").style.display = "none"

  if (!chatInitialized) {
    chrome.storage.local.get(["flowise", "flowId"], async (result) => {
      Chatbot.initFull({
        chatflowid: result.flowId,
        apiHost: result.flowise || "http://127.0.0.1:3000",
      })
    })

    chatInitialized = true
  }
})

// Setting
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
  const flowise = document.getElementById("flowise").value
  const flowId = document.getElementById("flowId").value
  chrome.storage.local.set({ modelName, hostName, flowise, flowId }, () => {
    alert("Settings saved!")
  })
})

// Load settings when the popup is opened
document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.local.get(
    ["modelName", "hostName", "flowise", "flowId", "prompt", "result"],
    (data) => {
      const { modelName, hostName, prompt, result, flowise, flowId } = data

      modelName && (document.getElementById("modelName").value = modelName)
      hostName && (document.getElementById("hostName").value = hostName)
      prompt && (document.getElementById("promptInput").value = prompt)
      result &&
        (document.getElementById("responseOutput").innerHTML =
          marked.parse(result))
      flowise && (document.getElementById("flowise").value = flowise)
      flowId && (document.getElementById("flowId").value = flowId)
    }
  )
})

const GRADIENT = [
  "#cce2ed",
  "#bedceb",
  "#bedceb",
  "#b0d5e8",
  "#b0d5e8",
  "#a1cde3",
  "#a1cde3",
  "#96c8e0",
  "#96c8e0",
  "#a1cde3",
  "#a1cde3",
  "#b0d5e8",
  "#b0d5e8",
  "#bedceb",
  "#bedceb",
  "#cce2ed",
]

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

      let counter = 0

      while (true) {
        responseOutput.style.backgroundColor =
          GRADIENT[counter++ % GRADIENT.length]

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
              responseOutput.innerHTML = marked.parse(result)
            }
          }
        }
      }
      chrome.storage.local.set({ result })
      responseOutput.style.backgroundColor = null
    } catch (error) {
      responseOutput.textContent = "Error: " + error.message
      responseOutput.style.backgroundColor = null
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
