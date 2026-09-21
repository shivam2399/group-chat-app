/**
 * AI Assistant Module (Gemini typing suggestions & smart replies)
 */

import { getApiBaseUrl } from "./utils.js";

export function getRecentMessagesForAI(chatMessagesElement) {
  if (!chatMessagesElement) return [];
  const messageElements = chatMessagesElement.querySelectorAll(".message");
  const messages = [];

  Array.from(messageElements)
    .slice(-10)
    .forEach((element) => {
      const contentElement = element.querySelector(".message-content");
      if (!contentElement) return;

      const content = contentElement.textContent.trim();
      if (!content) return;

      const isOwnMessage = element.classList.contains("outgoing");
      messages.push({
        sender: isOwnMessage ? "You" : "Other",
        content,
      });
    });

  return messages;
}

export async function fetchTypingSuggestions({ draft, recentMessages, token }) {
  const baseUrl = getApiBaseUrl();
  try {
    const response = await fetch(`${baseUrl}/ai/typing-suggestions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ draft, recentMessages }),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      return [];
    }
    return data.data.suggestions || [];
  } catch (error) {
    console.error("Typing suggestion error:", error);
    return [];
  }
}

export async function fetchSmartReplies({
  incomingMessage,
  recentMessages,
  token,
}) {
  const baseUrl = getApiBaseUrl();
  try {
    const response = await fetch(`${baseUrl}/ai/smart-replies`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ incomingMessage, recentMessages }),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      return [];
    }
    return data.data.replies || [];
  } catch (error) {
    console.error("Smart reply error:", error);
    return [];
  }
}

export function renderTypingSuggestions(container, suggestions, onSelect) {
  container.innerHTML = "";
  if (!suggestions || suggestions.length === 0) return;

  suggestions.forEach((suggestion) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "ai-typing-suggestion";
    button.textContent = suggestion;
    button.addEventListener("click", () => {
      container.innerHTML = "";
      if (typeof onSelect === "function") {
        onSelect(suggestion);
      }
    });
    container.appendChild(button);
  });
}

export function renderSmartReplies(container, replies, onSelect) {
  container.innerHTML = "";
  if (!replies || replies.length === 0) return;

  replies.forEach((reply) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "ai-smart-reply";
    button.textContent = reply;
    button.addEventListener("click", () => {
      container.innerHTML = "";
      if (typeof onSelect === "function") {
        onSelect(reply);
      }
    });
    container.appendChild(button);
  });
}
