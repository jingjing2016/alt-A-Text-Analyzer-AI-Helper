# alt+A Text Analyzer AI Helper Documentation

## 1. Name
alt+A Text Analyzer AI Helper

## 2. Overall Purpose
The main goal of the extension is to help users understand text segments on webpages by leveraging AI. Users can select text by hovering over it and using a keyboard shortcut (Alt+A), which then sends the text to a configurable AI model for analysis. The results are displayed directly on the page.

## 3. Core Functionalities

### Text Selection & Trigger
*   **How:** The user hovers over any text element on a webpage. Pressing the `Alt+A` keyboard shortcut triggers the analysis for the text content of the currently hovered element.
*   **File responsible:** `content.js` (event listeners for `mouseover` and `keydown`).

### AI Analysis
*   **Process:**
    1.  The selected text is captured by `content.js`.
    2.  A message containing the text is sent to `background.js`.
    3.  `background.js` retrieves API configuration (endpoint, key), selected model, and the custom prompt template from `chrome.storage.local`.
    4.  It constructs a request to the specified AI API endpoint. The request includes the AI model to use and the prompt (with the selected text inserted into the `{{TEXT_TO_ANALYZE}}` placeholder).
    5.  The AI service processes the request and returns the analysis.
*   **Default Analysis Behavior/Prompt:**
    *   The default prompt is designed for English language learners. It asks the AI to identify fixed expressions, collocations, or commonly used phrases within the provided sentence.
    *   For each identified group, the AI is asked to explain its meaning in simple English and to provide the answer in Chinese.
    *   The default prompt is: `"I'm a beginner in English. I know some individual words, but I don't know which words should be read together as fixed expressions or collocations. Please help me analyze the following sentence. Show me all the word groups that are fixed expressions, collocations, or commonly used phrases — like “right now”, “as soon as possible”, or “by the way”. For each group, explain what it means in simple English. answer in chinese The sentence is: {{TEXT_TO_ANALYZE}}"`
    *   This default prompt is stored in `background.js` (as `DEFAULT_PROMPT_TEMPLATE_BG`) and `popup.js` (as `DEFAULT_PROMPT_TEMPLATE`).
*   **Default Model:** If no model is configured or selected through presets, it defaults to `"gpt-3.5-turbo"` (as seen in `background.js`).

### Display of Results
*   **How & Where:** The analysis result (or any error message) is displayed in a dynamically created `div` element.
*   This `div` is inserted directly below the HTML element from which the text was originally captured.
*   The display `div` is styled for readability and includes a "Close Analysis" button to remove it from the page.
*   **File responsible:** `content.js` (the `displayAnalysis` function).

### Configuration Options (via Popup - `popup.html` & `popup.js`)

*   **API Settings:**
    *   Users can configure the **API Endpoint** (URL for the AI service) and their **API Key**.
    *   These are saved to `chrome.storage.local`.
    *   Input fields: `apiEndpoint`, `apiKey`.
*   **Model Selection:**
    *   Users choose an AI model by selecting one of five predefined **Model Presets** (P1-P5).
    *   The name of the currently selected model preset is displayed.
    *   Selection buttons: `selectModelPreset1` through `selectModelPreset5`.
    *   Display area: `selectedModelDisplay`.
*   **Model Presets:**
    *   Users can define and manage a list of up to 5 preferred AI model names (e.g., "gpt-4o", "gpt-3.5-turbo").
    *   This is done in a separate "Model Presets" view within the popup.
    *   These presets are saved to `chrome.storage.local`.
    *   Input fields: `modelPresetInput1` through `modelPresetInput5`.
    *   Saved via `saveModelPresetsButton`.
*   **Custom Prompt:**
    *   Users can change the instructions given to the AI by modifying the **Custom Prompt Template**.
    *   The placeholder `{{TEXT_TO_ANALYZE}}` **must** be included in the template; this is where the selected text from the webpage will be inserted.
    *   A "Save Prompt" button saves the custom prompt to `chrome.storage.local`.
    *   A "Reset to Default" button reverts the prompt to the default English learning prompt.
    *   Textarea: `customPromptTemplate`.
    *   Buttons: `savePromptButton`, `resetPromptButton`.
*   **Testing:**
    *   Users can verify their API Endpoint and API Key by clicking the "Test API Configuration" button.
    *   This sends a simple test message ("Hello!") to the configured AI model and endpoint.
    *   The result (success or error) is displayed in the popup.
    *   Button: `testApiButton`.
    *   Display area: `testResult`.

## 4. Key Technical Components

*   **`content.js`:**
    *   Runs in the context of web pages visited by the user.
    *   Handles text selection:
        *   Tracks the element currently hovered by the mouse (`mouseover`).
        *   Listens for the `Alt+A` keyboard shortcut (`keydown`).
    *   When triggered, captures `textContent` from the hovered element.
    *   Sends the text to `background.js` for analysis via `chrome.runtime.sendMessage`.
    *   Receives the analysis result (or error) back from `background.js`.
    *   Dynamically creates a `div` to display the result (or error) on the page, below the original text element, and adds a close button.
*   **`background.js` (Service Worker):**
    *   Acts as the central hub for API communication and state management.
    *   Listens for messages from `content.js` (e.g., `analyzeText`) and `popup.js` (e.g., `testApiConfig`).
    *   **For text analysis:**
        *   Retrieves API endpoint, API key, selected model name (from presets), and custom prompt template from `chrome.storage.local`.
        *   Formats the API request with the correct model and user prompt (inserting selected text).
        *   Makes the `fetch` call to the AI API.
        *   Parses the API response and sends the analysis (or error) back to `content.js`.
    *   **For API testing:**
        *   Receives endpoint, key, and model directly from `popup.js`.
        *   Makes a test `fetch` call.
        *   Sends success/failure status back to `popup.js`.
    *   Contains the default prompt template (`DEFAULT_PROMPT_TEMPLATE_BG`) as a fallback.
*   **`popup.js` / `popup.html`:**
    *   Provide the user interface for configuring the extension.
    *   `popup.html` defines the structure (input fields, buttons, status areas) for:
        *   API Endpoint and Key.
        *   Model Preset definition (up to 5 models).
        *   Selection of the active Model Preset.
        *   Custom Prompt Template editing.
        *   API Test button.
        *   Navigation between "Settings" and "Model Presets" views.
    *   `popup.js` handles the logic:
        *   Loading saved settings (API details, model presets, selected preset index, custom prompt) from `chrome.storage.local` when the popup is opened.
        *   Saving user changes to these settings back to `chrome.storage.local`.
        *   Updating the display of the selected model and preset button labels.
        *   Validating the custom prompt to ensure it contains `{{TEXT_TO_ANALYZE}}`.
        *   Communicating with `background.js` to test the API configuration.
        *   Displaying status messages (e.g., "Settings saved", "API test successful/failed").
        *   Contains the default prompt template (`DEFAULT_PROMPT_TEMPLATE`) for reset functionality.
*   **`chrome.storage.local`:**
    *   Used to persist all user configurations:
        *   `apiEndpoint`: The URL of the AI API.
        *   `apiKey`: The user's API key.
        *   `modelPresets`: An array of up to 5 strings, each a model name.
        *   `selectedModelPresetIndex`: The index (0-4) of the currently active model preset.
        *   `customPromptTemplate`: The user-defined prompt string.
    *   This allows settings to be saved across browser sessions.
*   **`manifest.json`:**
    *   Defines the extension's name, version, description, and permissions (`activeTab`, `storage`, `scripting`).
    *   Registers `background.js` as the service worker.
    *   Declares `content.js` to be injected into all web pages (`<all_urls>`).
    *   Specifies `popup.html` as the default popup for the browser action.

This document should cover all the requested points and provide a solid foundation for user manuals.
