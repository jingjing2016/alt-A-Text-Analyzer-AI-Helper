document.addEventListener('DOMContentLoaded', () => {
  const DEFAULT_PROMPT_TEMPLATE = "I'm a beginner in English. I know some individual words, but I don't know which words should be read together as fixed expressions or collocations. Please help me analyze the following sentence. Show me all the word groups that are fixed expressions, collocations, or commonly used phrases — like “right now”, “as soon as possible”, or “by the way”. For each group, explain what it means in simple English. answer in chinese The sentence is: {{TEXT_TO_ANALYZE}}";

  // View navigation elements
  const showSettingsViewButton = document.getElementById('showSettingsView');
  const showModelPresetsViewButton = document.getElementById('showModelPresetsView');
  const showCustomPromptsViewButton = document.getElementById('showCustomPromptsViewButton'); // New
  const settingsView = document.getElementById('settingsView');
  const modelPresetsView = document.getElementById('modelPresetsView');
  const customPromptsView = document.getElementById('customPromptsView'); // New

  // Settings View elements
  const apiEndpointInput = document.getElementById('apiEndpoint');
  const apiKeyInput = document.getElementById('apiKey');
  const selectedModelDisplay = document.getElementById('selectedModelDisplay');
  const modelPresetSelectionControls = document.getElementById('modelPresetSelectionControls'); // Parent of P1-P5 buttons
  const saveSettingsButton = document.getElementById('save'); // Existing save button
  const statusDiv = document.getElementById('status'); // Existing status for save settings
  const testApiButton = document.getElementById('testApiButton');
  const testResultDiv = document.getElementById('testResult');
  const activePromptStatus = document.getElementById('activePromptStatus'); // New
  const selectCustomPromptButtons = []; // New
  for (let i = 1; i <= 6; i++) {
    selectCustomPromptButtons.push(document.getElementById(`selectCustomPromptButton${i}`));
  }

  // Model Presets View elements
  const modelPresetInput1 = document.getElementById('modelPresetInput1');
  const modelPresetInput2 = document.getElementById('modelPresetInput2');
  const modelPresetInput3 = document.getElementById('modelPresetInput3');
  const modelPresetInput4 = document.getElementById('modelPresetInput4');
  const modelPresetInput5 = document.getElementById('modelPresetInput5');
  const modelPresetInputs = [modelPresetInput1, modelPresetInput2, modelPresetInput3, modelPresetInput4, modelPresetInput5];
  const saveModelPresetsButton = document.getElementById('saveModelPresets');
  const modelPresetsStatusDiv = document.getElementById('modelPresetsStatus');

  // Custom Prompts View elements (New)
  const customPromptInputs = [];
  for (let i = 1; i <= 6; i++) {
    customPromptInputs.push(document.getElementById(`customPromptInput${i}`));
  }
  const saveCustomPromptsButton = document.getElementById('saveCustomPromptsButton');
  const customPromptsStatus = document.getElementById('customPromptsStatus');

  // Response Processing elements
  const enableFilteringToggle = document.getElementById('enableFilteringToggle');
  const filterStartSymbolInput = document.getElementById('filterStartSymbol');
  const filterEndSymbolInput = document.getElementById('filterEndSymbol');

  // Data variables
  let currentModelPresets = ["", "", "", "", ""];
  let selectedModelPresetIndex = 0;
  let customLLMPrompts = ['', '', '', '', '', '']; // New
  let selectedCustomPromptIndex = 0; // New

  // --- View Switching Logic ---
  function showView(viewToShow) {
    settingsView.style.display = 'none';
    modelPresetsView.style.display = 'none';
    customPromptsView.style.display = 'none'; // New
    viewToShow.style.display = 'block';
  }

  showSettingsViewButton.addEventListener('click', () => showView(settingsView));
  showModelPresetsViewButton.addEventListener('click', () => showView(modelPresetsView));
  showCustomPromptsViewButton.addEventListener('click', () => showView(customPromptsView)); // New

  // --- Loading Data ---
  function loadData() {
    chrome.storage.local.get([
      'apiEndpoint', 'apiKey', 'modelPresets', 'selectedModelPresetIndex',
      'customLLMPrompts', 'selectedCustomPromptIndex', // New
      'enableFiltering', 'filterStartSymbol', 'filterEndSymbol'
    ], (result) => {
      if (result.apiEndpoint) apiEndpointInput.value = result.apiEndpoint;
      if (result.apiKey) apiKeyInput.value = result.apiKey;

      if (result.modelPresets && Array.isArray(result.modelPresets) && result.modelPresets.length === 5) {
        currentModelPresets = result.modelPresets;
        modelPresetInputs.forEach((input, index) => {
          input.value = currentModelPresets[index] || "";
        });
      } else {
        // Initialize with empty strings if not found or malformed
         modelPresetInputs.forEach(input => input.value = "");
      }

      selectedModelPresetIndex = (typeof result.selectedModelPresetIndex === 'number' && result.selectedModelPresetIndex >= 0 && result.selectedModelPresetIndex < 5) ? result.selectedModelPresetIndex : 0;

      updateSelectedModelDisplay();
      updatePresetButtonLabels();
      highlightActivePresetButton();

      // Load Custom LLM Prompts
      if (result.customLLMPrompts && Array.isArray(result.customLLMPrompts) && result.customLLMPrompts.length === 6) {
        customLLMPrompts = result.customLLMPrompts;
      } else {
        // Initialize with DEFAULT_PROMPT_TEMPLATE if not found or malformed
        customLLMPrompts = Array(6).fill(DEFAULT_PROMPT_TEMPLATE);
        chrome.storage.local.set({ customLLMPrompts: customLLMPrompts }); // Save defaults
      }
      customPromptInputs.forEach((textarea, index) => {
        textarea.value = customLLMPrompts[index] || DEFAULT_PROMPT_TEMPLATE;
      });

      selectedCustomPromptIndex = (typeof result.selectedCustomPromptIndex === 'number' && result.selectedCustomPromptIndex >= 0 && result.selectedCustomPromptIndex < 6) ? result.selectedCustomPromptIndex : 0;
      highlightActiveCustomPromptButton(); // New function call

      // Load filtering settings
      enableFilteringToggle.checked = typeof result.enableFiltering === 'boolean' ? result.enableFiltering : false;
      filterStartSymbolInput.value = typeof result.filterStartSymbol === 'string' ? result.filterStartSymbol : "<think>";
      filterEndSymbolInput.value = typeof result.filterEndSymbol === 'string' ? result.filterEndSymbol : "</think>";

      // If defaults were applied because settings weren't in storage, save them back.
      // This ensures that if the user opens and saves other settings, these defaults are also persisted.
      // However, this might be better handled by explicitly saving them only if they were truly absent,
      // or just letting the main save button handle all saves. For now, we'll ensure defaults are in the UI fields
      // and the main save button will pick them up.
      // Let's ensure defaults are saved if they were undefined
      const defaultsToSave = {};
      if (typeof result.enableFiltering === 'undefined') defaultsToSave.enableFiltering = false;
      if (typeof result.filterStartSymbol === 'undefined') defaultsToSave.filterStartSymbol = "<think>";
      if (typeof result.filterEndSymbol === 'undefined') defaultsToSave.filterEndSymbol = "</think>";
      if (Object.keys(defaultsToSave).length > 0) {
          chrome.storage.local.set(defaultsToSave);
      }

    });
  }

  // --- Settings View Logic ---
  saveSettingsButton.addEventListener('click', () => {
    const endpoint = apiEndpointInput.value.trim();
    const key = apiKeyInput.value.trim();
    const enableFiltering = enableFilteringToggle.checked;
    const filterStartSymbol = filterStartSymbolInput.value.trim();
    const filterEndSymbol = filterEndSymbolInput.value.trim();

    if (!endpoint || !key) {
      statusDiv.textContent = 'Error: API Endpoint and Key are required.';
      statusDiv.style.color = 'red';
      return;
    }

    const settingsToSave = {
      apiEndpoint: endpoint,
      apiKey: key,
      enableFiltering: enableFiltering,
      filterStartSymbol: filterStartSymbol,
      filterEndSymbol: filterEndSymbol
      // modelPresets, selectedModelPresetIndex, customLLMPrompts, selectedCustomPromptIndex are saved separately
    };

    chrome.storage.local.set(settingsToSave, () => {
      statusDiv.textContent = 'Settings saved!'; // General message
      statusDiv.style.color = 'green';
      setTimeout(() => { statusDiv.textContent = ''; }, 1500);
    });
  });

  testApiButton.addEventListener('click', () => {
    const endpoint = apiEndpointInput.value.trim();
    const key = apiKeyInput.value.trim();
    const modelToTest = currentModelPresets[selectedModelPresetIndex] || "gpt-3.5-turbo"; // Use selected or default

    if (!endpoint || !key) {
      testResultDiv.textContent = 'Error: API Endpoint and Key are required to test.';
      testResultDiv.style.color = 'red';
      return;
    }
     if (!modelToTest) {
      testResultDiv.textContent = 'Error: No model selected/defined for testing. Please check Model Presets.';
      testResultDiv.style.color = 'red';
      return;
    }

    testResultDiv.textContent = 'Testing...';
    testResultDiv.style.color = 'blue';

    chrome.runtime.sendMessage(
      { action: "testApiConfig", endpoint: endpoint, apiKey: key, model: modelToTest },
      (response) => {
        if (chrome.runtime.lastError) {
          testResultDiv.textContent = `Error: ${chrome.runtime.lastError.message}`;
          testResultDiv.style.color = 'red';
          return;
        }
        if (response) {
          if (response.success) {
            testResultDiv.textContent = `Success: ${response.message}`;
            testResultDiv.style.color = 'green';
          } else {
            testResultDiv.textContent = `Error: ${response.error || 'Test failed.'}`;
            testResultDiv.style.color = 'red';
          }
        } else {
           testResultDiv.textContent = 'Error: No response from background script.';
           testResultDiv.style.color = 'red';
        }
      }
    );
  });

  // Preset selection buttons (P1-P5)
  for (let i = 0; i < 5; i++) {
    const button = document.getElementById(`selectModelPreset${i + 1}`);
    if (button) {
      button.addEventListener('click', () => {
        selectedModelPresetIndex = i;
        chrome.storage.local.set({ selectedModelPresetIndex: i }, () => {
          updateSelectedModelDisplay();
          highlightActivePresetButton();
          // console.log(`Selected model preset index: ${i}`);
        });
      });
    }
  }

  function updateSelectedModelDisplay() {
    const selectedModel = currentModelPresets[selectedModelPresetIndex];
    if (selectedModel && selectedModel.trim() !== "") {
      selectedModelDisplay.textContent = selectedModel;
    } else {
      selectedModelDisplay.textContent = "Preset not set";
    }
  }

  function highlightActivePresetButton() {
    for (let i = 0; i < 5; i++) {
      const button = document.getElementById(`selectModelPreset${i + 1}`);
      if (button) {
        if (i === selectedModelPresetIndex) {
          button.style.fontWeight = 'bold';
          button.style.borderWidth = '2px';
        } else {
          button.style.fontWeight = 'normal';
          button.style.borderWidth = '1px';
        }
      }
    }
  }

  function updatePresetButtonLabels() {
    for (let i = 0; i < 5; i++) {
        const button = document.getElementById(`selectModelPreset${i+1}`);
        if (button) {
            const presetName = currentModelPresets[i];
            if (presetName && presetName.trim() !== "") {
                // Keep labels short, e.g., first 10 chars or a generic P1, P2
                button.textContent = presetName.length > 10 ? `P${i+1}: ${presetName.substring(0,7)}...` : `P${i+1}: ${presetName}`;
            } else {
                button.textContent = `P${i+1}`;
            }
        }
    }
  }


  // --- Model Presets View Logic ---
  saveModelPresetsButton.addEventListener('click', () => {
    const newPresets = modelPresetInputs.map(input => input.value.trim());
    // Basic validation: ensure all 5 are filled, or allow empty for "unused"
    // For now, we save whatever is there.
    currentModelPresets = newPresets;
    chrome.storage.local.set({ modelPresets: newPresets }, () => {
      modelPresetsStatusDiv.textContent = 'Model presets saved!';
      modelPresetsStatusDiv.style.color = 'green';
      updateSelectedModelDisplay(); // Update display in Settings view if it's affected
      updatePresetButtonLabels();   // Update P1-P5 button labels
      setTimeout(() => { modelPresetsStatusDiv.textContent = ''; }, 1500);
    });
  });

  // --- Initial Load ---
  loadData(); // Load all data when popup opens
  showView(settingsView); // Show Settings view by default

  // --- Custom Prompts View Logic (New) ---
  saveCustomPromptsButton.addEventListener('click', () => {
    customLLMPrompts = customPromptInputs.map(textarea => textarea.value);
    // Optional: Add validation for {{TEXT_TO_ANALYZE}} here if desired in the future
    chrome.storage.local.set({ customLLMPrompts: customLLMPrompts }, () => {
      customPromptsStatus.textContent = 'Custom prompts saved!';
      customPromptsStatus.style.color = 'green';
      setTimeout(() => { customPromptsStatus.textContent = ''; }, 2000);
    });
  });

  // Event listeners for selecting an active custom prompt (buttons 1-6 in Settings View)
  selectCustomPromptButtons.forEach((button, index) => {
    if (button) {
      button.addEventListener('click', () => {
        selectedCustomPromptIndex = parseInt(button.dataset.promptIndex);
        chrome.storage.local.set({ selectedCustomPromptIndex: selectedCustomPromptIndex }, () => {
          highlightActiveCustomPromptButton();
          activePromptStatus.textContent = `Prompt ${selectedCustomPromptIndex + 1} selected as active.`;
          activePromptStatus.style.color = 'green';
          setTimeout(() => { activePromptStatus.textContent = ''; }, 1500);
        });
      });
    }
  });

  function highlightActiveCustomPromptButton() {
    selectCustomPromptButtons.forEach((button, index) => {
      if (button) {
        if (index === selectedCustomPromptIndex) {
          button.style.fontWeight = 'bold';
          button.style.borderWidth = '2px';
          button.style.borderColor = '#007bff'; // Example active border color
        } else {
          button.style.fontWeight = 'normal';
          button.style.borderWidth = '1px';
          button.style.borderColor = ''; // Reset to default or specific inactive color
        }
      }
    });
  }
});
