const DEFAULT_PROMPT_TEMPLATE_BG = "I'm a beginner in English. I know some individual words, but I don't know which words should be read together as fixed expressions or collocations. Please help me analyze the following sentence. Show me all the word groups that are fixed expressions, collocations, or commonly used phrases — like “right now”, “as soon as possible”, or “by the way”. For each group, explain what it means in simple English. answer in chinese The sentence is: {{TEXT_TO_ANALYZE}}";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "analyzeText") {
    const textToAnalyze = request.text;

    chrome.storage.local.get(
      ['apiEndpoint', 'apiKey', 'modelPresets', 'selectedModelPresetIndex', 'customLLMPrompts', 'selectedCustomPromptIndex', 'enableFiltering', 'filterStartSymbol', 'filterEndSymbol'],
      (config) => {
      if (!config.apiEndpoint || !config.apiKey) {
        console.error('API endpoint or key not configured.');
        sendResponse({ error: "API not configured. Please set it in the extension popup." });
        return true;
      }

      let modelForAnalysis = "gpt-3.5-turbo"; // Default model
      if (config.modelPresets && Array.isArray(config.modelPresets) &&
          typeof config.selectedModelPresetIndex === 'number' &&
          config.selectedModelPresetIndex >= 0 &&
          config.selectedModelPresetIndex < config.modelPresets.length &&
          config.modelPresets[config.selectedModelPresetIndex] && // Check if the preset string itself is not empty
          config.modelPresets[config.selectedModelPresetIndex].trim() !== "") {
        modelForAnalysis = config.modelPresets[config.selectedModelPresetIndex];
      } else {
        console.warn(`Text Analyzer: Model preset not properly configured or selected. Defaulting to ${modelForAnalysis}. Presets: ${JSON.stringify(config.modelPresets)}, Index: ${config.selectedModelPresetIndex}`);
      }

      let chosenPromptTemplate = DEFAULT_PROMPT_TEMPLATE_BG;
      let updateStorageWithDefaults = false;

      if (config.customLLMPrompts && Array.isArray(config.customLLMPrompts) && config.customLLMPrompts.length === 6 &&
          typeof config.selectedCustomPromptIndex === 'number' &&
          config.selectedCustomPromptIndex >= 0 && config.selectedCustomPromptIndex < 6) {

          const selectedPrompt = config.customLLMPrompts[config.selectedCustomPromptIndex];
          if (selectedPrompt && typeof selectedPrompt === 'string' && selectedPrompt.includes("{{TEXT_TO_ANALYZE}}")) {
              chosenPromptTemplate = selectedPrompt;
          } else {
              console.warn("Text Analyzer: Selected custom prompt is invalid or missing placeholder. Using default prompt.");
              // If the selected prompt is bad, but the structure exists, we still use default.
              // We might not want to overwrite the entire array if just one selected prompt is bad.
              // However, for robust initialization, if the structure is present but content bad,
              // it might indicate a corrupted state.
              // For now, just use default, don't trigger full reset if structure is OK.
          }
      } else {
          // Data structure is missing or invalid, use default and plan to save defaults.
          console.warn("Text Analyzer: Custom prompts data not found or invalid in storage. Using default prompt and initializing storage.");
          updateStorageWithDefaults = true;
      }

      if (updateStorageWithDefaults) {
          const defaultPrompts = Array(6).fill(DEFAULT_PROMPT_TEMPLATE_BG);
          chrome.storage.local.set({
              customLLMPrompts: defaultPrompts,
              selectedCustomPromptIndex: 0
          }, () => {
              console.log("Text Analyzer: Initialized custom prompts in storage with defaults.");
          });
          // chosenPromptTemplate is already DEFAULT_PROMPT_TEMPLATE_BG in this case.
      }

      const finalPrompt = chosenPromptTemplate.replace("{{TEXT_TO_ANALYZE}}", textToAnalyze);

      const requestBody = {
        model: modelForAnalysis, // This logic for modelForAnalysis should already exist
        messages: [
          { role: "user", content: finalPrompt } // NEW: Use finalPrompt
        ],
        temperature: 0.7 // Or make this configurable later
      };

      fetch(config.apiEndpoint, { // Uses saved endpoint and key
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify(requestBody)
      })
      .then(response => {
        if (!response.ok) {
          return response.json().then(errorData => {
            const errorMessage = errorData?.error?.message || `HTTP error! status: ${response.status}`;
            throw new Error(errorMessage);
          });
        }
        return response.json();
      })
      .then(data => {
        if (data.choices && data.choices.length > 0 && data.choices[0].message && data.choices[0].message.content) {
          let analysisContent = data.choices[0].message.content;

          // Default filtering values if not present in config (though popup.js should set them)
          const enableFiltering = typeof config.enableFiltering === 'boolean' ? config.enableFiltering : false;
          const filterStartSymbol = config.filterStartSymbol?.trim() || "";
          const filterEndSymbol = config.filterEndSymbol?.trim() || "";

          if (enableFiltering) {
            if (filterStartSymbol === "" && filterEndSymbol !== "") {
              // New logic: trim from the beginning to the end symbol
              const endIndex = analysisContent.indexOf(filterEndSymbol);
              if (endIndex !== -1) {
                analysisContent = analysisContent.substring(endIndex + filterEndSymbol.length);
              }
            } else if (filterStartSymbol !== "" && filterEndSymbol !== "") {
              // Existing logic for removing content between two symbols
              let currentText = analysisContent;
              let resultText = "";
              let pointer = 0;

              while (true) {
                let startIndex = currentText.indexOf(filterStartSymbol, pointer);
                if (startIndex === -1) {
                  resultText += currentText.substring(pointer);
                  break;
                }
                resultText += currentText.substring(pointer, startIndex);
                let endIndex = currentText.indexOf(filterEndSymbol, startIndex + filterStartSymbol.length);
                if (endIndex === -1) {
                  console.warn("Filtering: Start symbol found without a matching end symbol. Text from that point onwards might be unfiltered or partially filtered.");
                  resultText += currentText.substring(startIndex);
                  break;
                }
                pointer = endIndex + filterEndSymbol.length;
              }
              analysisContent = resultText;
            }
          }
          sendResponse({ analysis: analysisContent });
        } else {
          console.error('Unexpected API response structure for analysis:', data);
          sendResponse({ error: "Failed to parse analysis from API response." });
        }
      })
      .catch(error => {
        console.error('Error calling LLM API for analysis:', error);
        sendResponse({ error: `Error calling LLM API: ${error.message}` });
      });
    });
    return true; // Crucial for async analyzeText

  } else if (request.action === "testApiConfig") {
    const { endpoint, apiKey, model: modelFromPopup } = request; // Renamed to avoid conflict

    // Validation for endpoint and apiKey still makes sense here
    if (!endpoint || !apiKey) {
      sendResponse({ success: false, error: "Endpoint or API Key missing in test request." });
      return true; // Asynchronous, even for this early return
    }

    const modelForTest = modelFromPopup || "gpt-3.5-turbo"; // Default if model not provided from popup

    const testBody = {
      model: modelForTest,
      messages: [{ role: "user", content: "Hello!" }],
      max_tokens: 5
    };

    fetch(endpoint, { // Uses endpoint and key from the popup directly for testing
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(testBody)
    })
    .then(response => {
      if (response.ok) {
        // Optionally, you could try to parse response.json() to see if it's valid
        // but for a simple test, response.ok might be enough.
        sendResponse({ success: true, message: "API connection successful!" });
      } else {
        // Try to get a more specific error from the API response body
        response.json().then(errorData => {
          const errorMessage = errorData?.error?.message || `API returned status: ${response.status}`;
          sendResponse({ success: false, error: errorMessage });
        }).catch(() => {
          // If parsing the error JSON fails
          sendResponse({ success: false, error: `API returned status: ${response.status}. Could not parse error details.` });
        });
      }
    })
    .catch(error => {
      console.error('Error during API test:', error);
      sendResponse({ success: false, error: `Network error or other issue: ${error.message}` });
    });

    return true; // Crucial for async testApiConfig
  } else if (request.action === "setActivePromptIndex") {
    const newIndex = request.index;

    if (typeof newIndex === 'number' && newIndex >= 0 && newIndex <= 5) {
      chrome.storage.local.set({ selectedCustomPromptIndex: newIndex }, () => {
        if (chrome.runtime.lastError) {
          console.error("Error saving selectedCustomPromptIndex:", chrome.runtime.lastError);
          sendResponse({ success: false, error: "Failed to save prompt selection." });
        } else {
          // console.log("Active prompt index successfully updated to:", newIndex); // Optional: for debugging
          sendResponse({ success: true });
        }
      });
    } else {
      console.error("Invalid prompt index received:", newIndex);
      sendResponse({ success: false, error: "Invalid prompt index provided." });
    }
    return true; // Indicate asynchronous response
  } else if (request.action === "analyzeTextForAltW") {
    const { word, textBlock } = request;

    chrome.storage.local.get(
      ['apiEndpoint', 'apiKey', 'modelPresets', 'selectedModelPresetIndex', 'customLLMPrompts', 'enableFiltering', 'filterStartSymbol', 'filterEndSymbol'],
      (config) => {
        if (!config.apiEndpoint || !config.apiKey) {
          console.error('API endpoint or key not configured for Alt+W.');
          sendResponse({ error: "API not configured. Please set it in the extension popup." });
          return true;
        }

        let modelForAnalysis = "gpt-3.5-turbo"; // Default model
        if (config.modelPresets && Array.isArray(config.modelPresets) &&
            typeof config.selectedModelPresetIndex === 'number' &&
            config.selectedModelPresetIndex >= 0 &&
            config.selectedModelPresetIndex < config.modelPresets.length &&
            config.modelPresets[config.selectedModelPresetIndex] &&
            config.modelPresets[config.selectedModelPresetIndex].trim() !== "") {
          modelForAnalysis = config.modelPresets[config.selectedModelPresetIndex];
        } else {
          console.warn(`Alt+W: Model preset not properly configured. Defaulting to ${modelForAnalysis}.`);
        }

        // Alt+W uses Custom Prompt Slot 6 (index 5)
        const altWPromptIndex = 5;
        let chosenPromptTemplate = `Analyze the word "{{WORD}}" within the context of the following text block: "{{TEXT_BLOCK}}". Explain the word's meaning and usage in this specific context.`; // Default fallback

        if (config.customLLMPrompts && Array.isArray(config.customLLMPrompts) &&
            config.customLLMPrompts.length === 6 &&
            config.customLLMPrompts[altWPromptIndex] && typeof config.customLLMPrompts[altWPromptIndex] === 'string' &&
            config.customLLMPrompts[altWPromptIndex].includes("{{WORD}}") && // Basic check for placeholders
            config.customLLMPrompts[altWPromptIndex].includes("{{TEXT_BLOCK}}")) {
          chosenPromptTemplate = config.customLLMPrompts[altWPromptIndex];
        } else {
          console.warn(`Alt+W: Custom Prompt Slot 6 (index 5) is not configured correctly or missing placeholders. Using a default prompt. Prompt found: ${config.customLLMPrompts ? config.customLLMPrompts[altWPromptIndex] : 'not found'}`);
          // Users should be guided by popup.html to set this up.
        }

        let finalPrompt = chosenPromptTemplate.replace("{{WORD}}", word);
        finalPrompt = finalPrompt.replace("{{TEXT_BLOCK}}", textBlock);

        const requestBody = {
          model: modelForAnalysis,
          messages: [{ role: "user", content: finalPrompt }],
          temperature: 0.7 // Or make this configurable
        };

        fetch(config.apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey}`
          },
          body: JSON.stringify(requestBody)
        })
        .then(response => {
          if (!response.ok) {
            return response.json().then(errorData => {
              const errorMessage = errorData?.error?.message || `HTTP error! status: ${response.status}`;
              throw new Error(errorMessage);
            });
          }
          return response.json();
        })
        .then(data => {
          if (data.choices && data.choices.length > 0 && data.choices[0].message && data.choices[0].message.content) {
            let analysisContent = data.choices[0].message.content;

            const enableFiltering = typeof config.enableFiltering === 'boolean' ? config.enableFiltering : false;
            const filterStartSymbol = config.filterStartSymbol?.trim() || "";
            const filterEndSymbol = config.filterEndSymbol?.trim() || "";

            if (enableFiltering) {
                if (filterStartSymbol === "" && filterEndSymbol !== "") {
                    // New logic: trim from the beginning to the end symbol
                    const endIndex = analysisContent.indexOf(filterEndSymbol);
                    if (endIndex !== -1) {
                        analysisContent = analysisContent.substring(endIndex + filterEndSymbol.length);
                    }
                } else if (filterStartSymbol !== "" && filterEndSymbol !== "") {
                    // Existing logic for removing content between two symbols
                    let currentText = analysisContent;
                    let resultText = "";
                    let pointer = 0;
                    while (true) {
                        let startIndex = currentText.indexOf(filterStartSymbol, pointer);
                        if (startIndex === -1) {
                            resultText += currentText.substring(pointer);
                            break;
                        }
                        resultText += currentText.substring(pointer, startIndex);
                        let endIndex = currentText.indexOf(filterEndSymbol, startIndex + filterStartSymbol.length);
                        if (endIndex === -1) {
                            console.warn("Alt+W Filtering: Start symbol found without a matching end symbol.");
                            resultText += currentText.substring(startIndex);
                            break;
                        }
                        pointer = endIndex + filterEndSymbol.length;
                    }
                    analysisContent = resultText;
                }
            }
            sendResponse({ analysis: analysisContent });
          } else {
            console.error('Alt+W: Unexpected API response structure:', data);
            sendResponse({ error: "Failed to parse analysis from API response for Alt+W." });
          }
        })
        .catch(error => {
          console.error('Error calling LLM API for Alt+W analysis:', error);
          sendResponse({ error: `Error calling LLM API (Alt+W): ${error.message}` });
        });
      }
    );
    return true; // Crucial for async operation
  }
  // If you have more actions, add more else if blocks.
  // Optional: return false if no async operation is pending for a specific message type.
});

// Optional: Log when the extension is installed or updated
chrome.runtime.onInstalled.addListener(() => {
  console.log("Text Analyzer AI Helper extension installed/updated.");
});
