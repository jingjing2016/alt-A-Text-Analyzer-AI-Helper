let lastHoveredElement = null;
let analysisDisplayIdCounter = 0; // To give unique IDs to analysis divs if needed
let lastMouseX = 0;
let lastMouseY = 0;

// Track the element currently under the mouse
document.addEventListener('mouseover', (event) => {
  lastHoveredElement = event.target;
});

// Track mouse position continuously
document.addEventListener('mousemove', (event) => {
  lastMouseX = event.clientX;
  lastMouseY = event.clientY;
});

// Listen for the hotkey
let currentActionBar = null; // Global variable for the action bar

function removeExistingActionBar() {
  if (currentActionBar) {
    currentActionBar.remove();
    currentActionBar = null;
  }
}

function showActionBar(anchorElement, identifiedWordText, clientX, clientY) {
  removeExistingActionBar(); // Remove any existing bar first

  const actionBar = document.createElement('div');
  actionBar.style.position = 'absolute';
  actionBar.style.backgroundColor = '#f0f0f0';
  actionBar.style.border = '1px solid #ccc';
  actionBar.style.padding = '5px';
  actionBar.style.borderRadius = '3px';
  actionBar.style.zIndex = '10000';
  actionBar.style.display = 'flex';
  actionBar.style.gap = '5px';

  for (let i = 0; i < 6; i++) {
    const button = document.createElement('button');
    button.textContent = (i + 1).toString();
    button.dataset.promptIndex = i.toString();
    button.style.padding = '2px 5px';
    button.style.fontSize = '12px';
    button.onclick = () => {
      const promptIndex = parseInt(button.dataset.promptIndex, 10);
      // identifiedWordText and anchorElement are available from the showActionBar scope

      // First, set the active prompt index
      chrome.runtime.sendMessage(
        { action: "setActivePromptIndex", index: promptIndex },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error("Error setting active prompt index:", chrome.runtime.lastError.message);
            displayAnalysis(anchorElement, `Error setting active prompt: ${chrome.runtime.lastError.message}`, true);
            removeExistingActionBar();
            return;
          }
          if (response && response.success) {
            // Index set successfully, now analyze the text
            chrome.runtime.sendMessage(
              { action: "analyzeText", text: identifiedWordText },
              (analysisResponse) => {
                if (chrome.runtime.lastError) {
                  console.error("Error analyzing text:", chrome.runtime.lastError.message);
                  displayAnalysis(anchorElement, `Error analyzing text: ${chrome.runtime.lastError.message}`, true);
                  removeExistingActionBar();
                  return;
                }
                if (analysisResponse) {
                  if (analysisResponse.error) {
                    console.error("Error from background script (analyzeText):", analysisResponse.error);
                    displayAnalysis(anchorElement, `Error: ${analysisResponse.error}`, true);
                  } else if (analysisResponse.analysis) {
                    displayAnalysis(anchorElement, analysisResponse.analysis, false);
                  }
                } else {
                  console.error("No response from background script (analyzeText) or response was undefined.");
                  displayAnalysis(anchorElement, "Error: No response from analysis service.", true);
                }
                removeExistingActionBar(); // Remove bar after analysis attempt
              }
            );
          } else {
            // Failed to set prompt index
            console.error("Failed to set active prompt index.", response ? response.error : "No response");
            displayAnalysis(anchorElement, `Error: Could not set active prompt. ${response ? response.error : ''}`, true);
            removeExistingActionBar();
          }
        }
      );
    };
    actionBar.appendChild(button);
  }

  document.body.appendChild(actionBar);
  currentActionBar = actionBar; // Store reference to the new bar

  // Positioning based on mouse cursor
  let topPosition = window.scrollY + clientY - actionBar.offsetHeight - 5; // Subtract height and a small margin
  actionBar.style.top = topPosition + 'px';
  actionBar.style.left = (window.scrollX + clientX) + 'px';

  // Ensure it's visible if it overflows horizontally
  // This check should happen after initial positioning.
  const barRect = actionBar.getBoundingClientRect();
  if (barRect.right > window.innerWidth) {
      actionBar.style.left = (window.innerWidth - barRect.width - 5) + 'px'; // Adjust left to keep it in view
  }
   if (barRect.left < 0) {
      actionBar.style.left = '5px';
  }

}

function getWordUnderCursor(event) {
  const clientX = event.clientX;
  const clientY = event.clientY;

  try {
    const range = document.caretRangeFromPoint(clientX, clientY);
    if (!range) {
      // console.log("caretRangeFromPoint returned null");
      return null;
    }

    if (range.startContainer.nodeType !== Node.TEXT_NODE || range.startContainer.textContent.trim() === '') {
      // console.log("Not a text node or empty text node", range.startContainer);
      return null;
    }

    let textNode = range.startContainer;
    let offset = range.startOffset;
    let text = textNode.textContent;

    let startIndex = offset;
    let endIndex = offset;

    // Iterate backwards for startIndex
    while (startIndex > 0) {
      const char = text[startIndex - 1];
      if (/\s|[.,;:!?()[\]{}"']/.test(char)) { // Word boundary characters
        break;
      }
      startIndex--;
    }

    // Iterate forwards for endIndex
    while (endIndex < text.length) {
      const char = text[endIndex];
      if (/\s|[.,;:!?()[\]{}"']/.test(char)) { // Word boundary characters
        break;
      }
      endIndex++;
    }

    let word = text.substring(startIndex, endIndex);

    if (!word || word.trim() === '') {
        // console.log("Extracted word is empty");
        return null;
    }

    return { word: word, anchorElement: textNode.parentElement || lastHoveredElement };

  } catch (e) {
    console.error("Error in getWordUnderCursor:", e);
    return null;
  }
}


document.addEventListener('keydown', (event) => {
  if (event.altKey && event.key === 'a') {
    event.preventDefault(); // Prevent any default browser action for 'alt+a'
    removeExistingActionBar(); // Remove action bar if Alt+A is used

    if (lastHoveredElement) {
      const textContent = lastHoveredElement.textContent?.trim();

      if (textContent) {
        // console.log("Hotkey pressed. Text to analyze:", textContent); // Optional: original console log
        const originalElementForAnalysis = lastHoveredElement;

        chrome.runtime.sendMessage({ action: "analyzeText", text: textContent }, (response) => {
          if (chrome.runtime.lastError) {
            // Handle errors from sending the message (e.g., if background script isn't ready)
            const LCRmessage = `Failed to communicate with the extension's background script: ${chrome.runtime.lastError.message}. If the extension was just installed or updated, try reloading the page.`;
            console.error("Error sending message to background script:", LCRmessage);
            displayAnalysis(originalElementForAnalysis, `Error: ${LCRmessage}`, true); // Enhanced message
            return;
          }

          if (response) {
            if (response.error) {
              console.error("Error from background script:", response.error);
              displayAnalysis(originalElementForAnalysis, `Error: ${response.error}`, true);
            } else if (response.analysis) {
              // console.log("Analysis received:", response.analysis); // Optional: original console log
              displayAnalysis(originalElementForAnalysis, response.analysis, false);
            }
          } else {
            // This case might occur if the background script doesn't send a response
            // or if it was closed before responding.
            console.error("No response from background script or response was undefined.");
            displayAnalysis(originalElementForAnalysis, "Error: No response from analysis service.", true);
          }
        });
      } else {
        // console.log("Hotkey pressed, but no text content found in the hovered element."); // Optional: original console log
      }
    } else {
      // console.log("Hotkey pressed, but no element was hovered."); // Optional: original console log
    }
  } else if (event.altKey && event.key === 'z') {
    event.preventDefault();
    let identifiedWordText = null;
    let anchorElementForBar = null;

    // Pass the actual event to getWordUnderCursor, which contains clientX/Y
    const wordInfo = getWordUnderCursor(event);

    if (wordInfo && wordInfo.word) {
      identifiedWordText = wordInfo.word;
      anchorElementForBar = wordInfo.anchorElement;
      // console.log("Alt+Z (caret). Word:", identifiedWordText, "Anchor:", anchorElementForBar);
    } else {
      // Fallback to lastHoveredElement if getWordUnderCursor fails
      if (lastHoveredElement) {
        identifiedWordText = lastHoveredElement.textContent?.trim();
        anchorElementForBar = lastHoveredElement;
        // console.log("Alt+Z (fallback). Text:", identifiedWordText, "Anchor:", anchorElementForBar);
      }
    }

    // console.log('Alt+Z pressed. Mouse X:', lastMouseX, 'Mouse Y:', lastMouseY); // lastMouseX/Y can be used for positioning

    if (identifiedWordText && anchorElementForBar) {
      // Use lastMouseX and lastMouseY for positioning the action bar, as event for keydown might not have X/Y.
      showActionBar(anchorElementForBar, identifiedWordText, lastMouseX, lastMouseY);
    } else {
      // console.log("Alt+Z pressed, but no text content or anchor element could be determined.");
      removeExistingActionBar();
    }
  } else if (event.altKey && event.key === 'w') {
    event.preventDefault();
    removeExistingActionBar(); // Ensure any existing action bar is removed

    // We need clientX and clientY for getWordUnderCursor.
    // The event object for 'keydown' might not have clientX/Y directly.
    // We rely on lastMouseX and lastMouseY which are continuously updated.
    const syntheticEventForWord = { clientX: lastMouseX, clientY: lastMouseY };
    const wordInfo = getWordUnderCursor(syntheticEventForWord);
    const textBlockContent = lastHoveredElement ? lastHoveredElement.textContent?.trim() : null;

    let originalElementForAnalysis = null;
    if (wordInfo && wordInfo.anchorElement && document.body.contains(wordInfo.anchorElement)) {
      originalElementForAnalysis = wordInfo.anchorElement;
    } else if (lastHoveredElement && document.body.contains(lastHoveredElement)) {
      originalElementForAnalysis = lastHoveredElement;
    }

    if (wordInfo && wordInfo.word && textBlockContent && originalElementForAnalysis) {
      // console.log(`Alt+W: Word='${wordInfo.word}', TextBlock='${textBlockContent}'`, originalElementForAnalysis);
      chrome.runtime.sendMessage(
        { action: "analyzeTextForAltW", word: wordInfo.word, textBlock: textBlockContent },
        (response) => {
          if (chrome.runtime.lastError) {
            const errMsg = `Failed to communicate with background script (Alt+W): ${chrome.runtime.lastError.message}.`;
            console.error(errMsg);
            displayAnalysis(originalElementForAnalysis, `Error: ${errMsg}`, true);
            return;
          }
          if (response) {
            if (response.error) {
              console.error("Error from background script (Alt+W):", response.error);
              displayAnalysis(originalElementForAnalysis, `Error: ${response.error}`, true);
            } else if (response.analysis) {
              const analysisPrefix = "[Alt+W Result (Prompt 6)]\n"; // As per plan
              displayAnalysis(originalElementForAnalysis, analysisPrefix + response.analysis, false);
            }
          } else {
            console.error("No response from background script (Alt+W) or response was undefined.");
            displayAnalysis(originalElementForAnalysis, "Error: No response from Alt+W analysis service.", true);
          }
        }
      );
    } else {
      let errorMsg = "Alt+W Error: Could not identify required information. Issues found:\n";
      if (!wordInfo || !wordInfo.word) {
        errorMsg += "- Word under cursor not found.\n";
      }
      if (!textBlockContent) {
        errorMsg += "- Surrounding text block not found (is mouse over text?).\n";
      }
      if (!originalElementForAnalysis) {
        errorMsg += "- No valid element to anchor the analysis display.\n";
      }
      errorMsg += "Please ensure your mouse is over the specific word within a text block.";

      const displayAnchor = originalElementForAnalysis || lastHoveredElement || document.body;
      if (document.body.contains(displayAnchor)) { // Check if anchor is valid before using
         displayAnalysis(displayAnchor, errorMsg, true);
      } else {
         alert(errorMsg); // Absolute fallback
      }
    }
  }
});


// Add a click listener to the document to remove the action bar if clicking outside
document.addEventListener('click', (event) => {
  if (currentActionBar && !currentActionBar.contains(event.target)) {
    removeExistingActionBar();
  }
}, true); // Use capture phase

function displayAnalysis(originalElement, analysisText, isError) {
  if (!originalElement || !document.body.contains(originalElement)) {
    console.warn("Original element for analysis is no longer in the DOM. Cannot display analysis.");
    // Fallback to alert if the original element is gone, to ensure user still sees the result/error.
    alert((isError ? "Error: " : "Analysis Result: ") + analysisText);
    return;
  }

  const analysisDiv = document.createElement('div');
  analysisDisplayIdCounter++;
  const uniqueId = `text_analyzer_ai_helper_result_${analysisDisplayIdCounter}`;
  analysisDiv.id = uniqueId;
  analysisDiv.style.marginTop = '5px';
  analysisDiv.style.padding = '8px';
  analysisDiv.style.border = '1px solid #ddd';
  analysisDiv.style.backgroundColor = '#f9f9f9';
  analysisDiv.style.fontSize = '0.9em';
  analysisDiv.style.fontFamily = 'sans-serif';
  analysisDiv.style.color = isError ? 'red' : '#333';
  analysisDiv.style.textAlign = 'left';
  analysisDiv.style.whiteSpace = 'pre-wrap'; // Handles newlines and spaces in the analysis text

  analysisDiv.textContent = analysisText; // Using textContent to prevent XSS

  // Attempt to insert below the original element.
  // If originalElement is an inline element, its parentNode.insertBefore might be more stable.
  const parent = originalElement.parentNode;
  if (parent) {
    parent.insertBefore(analysisDiv, originalElement.nextSibling);
  } else {
    // Fallback if parentNode is null (e.g. originalElement is document.body or detached)
    document.body.appendChild(analysisDiv);
    console.warn("displayAnalysis: originalElement has no parentNode, appending to body. This might not be the desired position.");
  }


  const closeButton = document.createElement('button');
  closeButton.textContent = 'Close Analysis';
  closeButton.style.display = 'block';
  closeButton.style.marginTop = '5px';
  closeButton.style.fontSize = '0.8em';
  closeButton.onclick = () => {
    analysisDiv.remove();
  };
  analysisDiv.appendChild(closeButton);
}

// console.log("Text Analyzer AI Helper content script loaded.");
