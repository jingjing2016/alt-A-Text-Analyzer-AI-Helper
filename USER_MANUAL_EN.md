# alt+A Text Analyzer AI Helper - User Manual

## 1. Overview

Welcome to the alt+A Text Analyzer AI Helper! This browser extension is designed to help you quickly understand segments of text you encounter on webpages. By simply hovering over text and pressing a keyboard shortcut (`Alt+A` or `Option+A` on Mac), the extension sends the selected text to an Artificial Intelligence (AI) model for analysis. The AI's explanation or analysis is then displayed directly on the webpage, right below the text you selected.

You can customize the extension to use your preferred AI service, specific AI models, and even tailor the instructions (the "prompt") given to the AI to suit your needs.

## 2. Installation

The alt+A Text Analyzer AI Helper is a browser extension. Installation is typically done in one of two ways:

*   **From your browser's extension store:** The easiest way is to find and install the extension from your browser's official add-on marketplace (like the Chrome Web Store, Firefox Add-ons, etc.).
*   **Manual Installation (Developer Mode):** If you have the extension files, you can load it as an "unpacked extension" through your browser's developer mode. Specific steps vary by browser (e.g., in Chrome, go to `chrome://extensions`, enable "Developer mode," and click "Load unpacked").

Once installed, you should see the extension's icon in your browser's toolbar.

## 3. Configuration

To use the alt+A Text Analyzer AI Helper, you'll first need to configure it with your AI service details. You can access the extension's settings by clicking on its icon in your browser's toolbar. This will open a popup window with two main views: "Settings" and "Model Presets."

### 3.1. API Settings

This section is crucial for the extension to communicate with an AI service.

1.  **Access Settings:** Click the extension icon in your browser toolbar. The popup should open to the "Settings" view by default. If you are in the "Model Presets" view, click the "Settings" button at the top.
2.  **API Endpoint:**
    *   In the "API Endpoint" field, enter the complete URL provided by your AI service provider for making API requests. For example, for OpenAI, this might look like `https://api.openai.com/v1/chat/completions`.
3.  **API Key:**
    *   In the "API Key" field, enter your unique API key. This key is used to authenticate your requests with the AI service. Keep this key confidential. The input field will typically mask your key for privacy.
4.  **Save Settings:** After entering both the endpoint and key, click the **"Save Settings"** button. A confirmation message like "API Settings saved!" will appear briefly.

*Importance:* The extension cannot analyze text without a valid API Endpoint and Key.

### 3.2. Model Presets

Model presets allow you to save and quickly switch between different AI model names you might use.

1.  **Access Model Presets View:** In the extension popup, click the **"Model Presets"** button at the top.
2.  **Define Presets:** You will see five input fields labeled "Preset 1" through "Preset 5."
    *   In each field, you can enter a specific model name provided by your AI service (e.g., "gpt-4o", "gpt-3.5-turbo", "claude-3-opus-20240229", etc.).
    *   You can define as many as five, or just one or two if you prefer.
3.  **Save Presets:** Once you've entered your desired model names, click the **"Save Model Presets"** button. A confirmation message "Model presets saved!" will appear.

### 3.3. Selecting a Model

Once you have defined your model presets, you can select which one to use for analysis back in the "Settings" view.

1.  **Access Settings View:** If you're not already there, click the "Settings" button in the popup.
2.  **Choose a Preset:** You will see buttons labeled (e.g., "P1", "P2", or "P1: gpt-4o" if the preset is named). These correspond to the presets you defined. Click on the button for the model you wish to use.
    *   The selected preset button will usually appear bold or highlighted.
3.  **Selected Model Display:** The name of the model you just selected will appear under "Selected Model:". If a preset is empty, it might say "Preset not set".

The extension will use this selected model for all subsequent analyses.

### 3.4. Custom Prompt Template

The prompt template tells the AI what kind of analysis you want it to perform on the selected text.

1.  **Access Custom Prompt:** In the "Settings" view, find the "Custom Prompt Template" section.
2.  **Edit the Template:**
    *   You'll see a text area where you can type or paste your desired instructions for the AI.
    *   **Crucially, your prompt MUST include the placeholder `{{TEXT_TO_ANALYZE}}`.** This exact placeholder will be replaced by the actual text you select on a webpage.
    *   For example, a simple prompt could be: "Explain this text in simple terms: {{TEXT_TO_ANALYZE}}"
3.  **Default Prompt:** The default prompt is designed for English language learners. It asks the AI to identify English phrases and collocations within the selected text and explain them in simple English, with the final answer provided in Chinese. You can always revert to this.
4.  **Save or Reset:**
    *   To save your custom prompt, click the **"Save Prompt"** button.
    *   To revert to the default prompt, click the **"Reset to Default"** button.
    *   A status message will confirm the action.

### 3.5. Testing API Configuration

After setting up your API Endpoint, Key, and selecting a model, it's a good idea to test if everything is working correctly.

1.  **Access Test Button:** In the "Settings" view, find the **"Test API Configuration"** button.
2.  **Run Test:** Click the button. The extension will attempt to send a very simple request (like "Hello!") to your configured AI service using the current API settings and selected model.
3.  **Interpret Results:**
    *   A message will appear in the "Test Result" area.
    *   **Success:** If you see a message like "Success: API connection successful!", your setup is likely correct.
    *   **Error:** If there's an issue, an error message will be displayed (e.g., "Error: API returned status: 401" for an invalid API key, or "Error: Network error..."). This message can help you diagnose the problem.

### 3.6. Response Processing (Filtering Thought Processes)

This feature allows you to automatically hide or remove verbose "thought processes," debugging information, or other specified segments from the AI's response before it's displayed on the page. This can help in keeping the final analysis clean and focused on the main answer.

These settings are found in the "Settings" view of the popup, typically located below the "Custom Prompt Template" section.

1.  **Enable Filtering:**
    *   Check the **"Enable filtering of thought process"** checkbox to turn this feature on. If it's unchecked, no filtering will occur regardless of the symbols defined below.
2.  **Start Symbol:**
    *   In the "Start Symbol" input field, define the exact sequence of characters that marks the beginning of a text segment you want to remove.
    *   For example, the default is `"<think>"`. Many AI models use this or similar tags to encapsulate their internal reasoning steps.
3.  **End Symbol:**
    *   In the "End Symbol" input field, define the exact sequence of characters that marks the end of a text segment you want to remove.
    *   For example, the default is `"</think>"`.
4.  **How it Works:**
    *   When enabled, the extension will look for text segments in the AI's response that start with your defined "Start Symbol" and end with your "End Symbol."
    *   Any text found between these two symbols, including the symbols themselves, will be removed from the analysis before it is displayed on your webpage.
    *   If only a "Start Symbol" is found without a matching "End Symbol" in the response, the text from that point onwards might remain visible to prevent accidental data loss (this depends on the specific response structure).
    *   If you leave the "Start Symbol" or "End Symbol" fields empty while filtering is enabled, the extension will automatically use the default values (`"<think>"` and `"</think>"`) for filtering.
    *   **New Feature:** If you leave the **"Start Symbol"** field empty but provide a value for the **"End Symbol"** field, the extension will remove everything from the beginning of the AI's response up to and including the first instance of your "End Symbol". This is useful for trimming a variable-length preamble or "thinking" process at the start of an AI response.
5.  **Saving:** These response processing settings are saved along with your API details when you click the main **"Save Settings"** button.

## 4. Usage

Once configured, using the extension is straightforward.

### 4.1. Selecting Text

The extension works with the text content of the HTML element your mouse cursor is currently hovering over. Simply move your mouse pointer over the paragraph, sentence, or even a single word you want to analyze.

### 4.2. Triggering Analysis

There are two primary ways to trigger analysis:

**A. General Text Analysis (`Alt+A` or `Option+A` on Mac):**

*   With your mouse hovering over the desired text block (e.g., a paragraph or sentence):
    *   Press the **`Alt+A`** keys simultaneously on your keyboard (or **`Option+A`** on Mac).
*   The extension captures the text content of the hovered element.
*   This text is then sent for analysis using the **currently active custom prompt** (selected in the Popup -> Settings -> "Select Active Custom Prompt" 1-6).

**B. Word and Text Block Analysis (`Alt+W` or `Option+W` on Mac):**

*   With your mouse hovering over a specific word within a larger text block:
    *   Press the **`Alt+W`** keys simultaneously on your keyboard (or **`Option+W`** on Mac).
*   The extension attempts to identify:
    1.  The specific **word** under your mouse cursor.
    2.  The entire **text block** (e.g., paragraph) containing that word (similar to what `Alt+A` captures).
*   Both the word and the text block are sent for analysis using **Custom Prompt Slot 6**.
    *   **Important:** You must configure Custom Prompt Slot 6 (in Popup -> Custom Prompts) specifically for this functionality. Your prompt template for slot 6 should use the placeholders **`{{WORD}}`** (for the identified word) and **`{{TEXT_BLOCK}}`** (for the surrounding text content).
    *   Example for Prompt 6: "Explain the meaning and usage of the word `{{WORD}}` as it appears in the following text: `{{TEXT_BLOCK}}`."
    *   The popup (Custom Prompts view, next to Prompt 6) provides a hint for this.

The extension will then send the captured information and the appropriate prompt to the AI for analysis.

### 4.3. Viewing Analysis

After a moment (processing time depends on the AI service and the complexity of the request), the analysis result will appear directly on the webpage.
*   A new box or section will be inserted immediately below the HTML element containing the text you selected.
*   This box will contain the response from the AI.

### 4.4. Closing Analysis

The analysis box that appears will also contain a **"Close Analysis"** button. Clicking this button will remove the analysis display from the page.

## 5. Troubleshooting

Here are some common issues and how to address them:

*   **"Error: API not configured. Please set it in the extension popup." (displayed on the webpage):**
    *   This means you haven't saved your API Endpoint and Key in the extension's settings.
    *   **Fix:** Click the extension icon in your browser toolbar, go to "Settings," enter your API Endpoint and Key, and click "Save Settings."

*   **API Errors during analysis or testing (e.g., "Error: API returned status: 401", "Error: Network error...", "Error calling LLM API: ..."):**
    *   These indicate a problem with your API configuration or connection to the AI service.
    *   **Fixes to try:**
        *   Double-check that your API Key and API Endpoint are correctly entered in the extension settings.
        *   Ensure your selected model preset is valid for your API provider and that your API key has permissions for it.
        *   Verify that your internet connection is working.
        *   Use the "Test API Configuration" button in the settings to get more specific feedback.
        *   Consult the documentation of your AI service provider for the meaning of specific error codes (like 401, 403, 429, 500).

*   **No text selected or analyzed when pressing Alt+A:**
    *   Ensure your mouse cursor is actively hovering over a web page element that *contains text* when you press the hotkey. If you hover over an image or an empty area, there might be no text to analyze.
    *   Try hovering over a different piece of text on the page.

*   **Analysis not appearing, or other unexpected behavior:**
    *   **Check Permissions:** Ensure the extension has the necessary permissions to operate on the current webpage. Sometimes, browser security settings or other extensions can interfere.
    *   **Reload Page:** Try reloading the webpage and then attempting the analysis again. If the extension was just installed or updated, a page reload is often necessary for the content script to load properly.
    *   **Check for Error Messages:** Look for any error messages displayed by the extension (either on the page or in the popup's test result area).
    *   **Developer Console:** For more technical users, check the browser's developer console (usually opened with F12) for error messages related to the extension.

---
We hope this manual helps you get the most out of the alt+A Text Analyzer AI Helper!
