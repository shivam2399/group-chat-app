/**
 * Main application coordinator (ES Module entry point)
 */

import { state } from "./state.js";
import {
  dom,
  renderProfile,
  updateChatHeader,
  clearActiveChats,
  renderGroups,
  renderUsers,
  addMessageToUI,
  scrollToBottom,
  updateConnectionBanner,
  updateGroupPreview,
  updatePersonalPreview,
  incrementUnreadCount,
  clearUnreadCount,
  incrementPersonalUnreadCount,
  clearPersonalUnreadCount,
  renderGroupMembers,
  renderAvailableUsers,
} from "./ui.js";
import {
  validateFile,
  getMessageType,
  renderAttachmentPreview,
  uploadMediaFile,
} from "./media.js";
import {
  getRecentMessagesForAI,
  fetchTypingSuggestions,
  fetchSmartReplies,
  renderTypingSuggestions,
  renderSmartReplies,
} from "./ai.js";
import { initSocket, onConnectionStateChange } from "./socket.js";
import { getApiBaseUrl, parseResponseJson } from "./utils.js";

const baseUrl = getApiBaseUrl();
const socket = initSocket();

// Monitor connection status
onConnectionStateChange((status, detail) => {
  updateConnectionBanner(status, detail);
});

/* ==================== REST API CALLS ==================== */

async function loadGroups() {
  try {
    const response = await fetch(`${baseUrl}/groups`, {
      headers: { Authorization: `Bearer ${state.token}` },
    });
    const data = await parseResponseJson(response);
    if (!response.ok)
      throw new Error(data.message || `HTTP ${response.status}`);

    const groups = data.data || [];
    renderGroups(groups, state.currentGroupId, async (group, groupElement) => {
      if (state.currentGroupId === group.id) return;

      clearActiveChats();
      groupElement.classList.add("active");
      clearUnreadCount(groupElement);

      state.setCurrentGroup(group.id);
      socket.emit("join_group", group.id);

      updateChatHeader({
        title: group.name,
        avatarText: group.name.charAt(0).toUpperCase(),
        subtitle: "",
      });

      await loadMessages(group.id);
    });

    // Auto-select first group on initial load
    if (
      groups.length > 0 &&
      !state.currentGroupId &&
      !state.currentPersonalUserId
    ) {
      const firstGroup = groups[0];
      state.setCurrentGroup(firstGroup.id);
      updateChatHeader({
        title: firstGroup.name,
        avatarText: firstGroup.name.charAt(0).toUpperCase(),
      });
      const firstGroupElem = dom.groupList.querySelector(
        `.group-item[data-group-id="${firstGroup.id}"]`,
      );
      if (firstGroupElem) firstGroupElem.classList.add("active");

      groups.forEach((g) => socket.emit("join_group", g.id));
      await loadMessages(firstGroup.id);
    }
  } catch (error) {
    console.error("Failed to load groups:", error);
  }
}

async function loadUsers() {
  try {
    const response = await fetch(`${baseUrl}/users`, {
      headers: { Authorization: `Bearer ${state.token}` },
    });
    const data = await parseResponseJson(response);
    if (!response.ok)
      throw new Error(data.message || `HTTP ${response.status}`);

    renderUsers(
      data.data || [],
      state.currentPersonalUserId,
      async (otherUser, userElement) => {
        clearActiveChats();
        userElement.classList.add("active");
        clearPersonalUnreadCount(userElement);

        state.setCurrentPersonalUser(otherUser.id);
        dom.messageInput.value = "";
        socket.emit("join_room", { userId: otherUser.id });

        updateChatHeader({
          title: otherUser.name,
          avatarText: otherUser.name.charAt(0).toUpperCase(),
          subtitle: "Online",
        });

        await loadPersonalMessages(otherUser.id);
      },
    );
  } catch (error) {
    console.error("Failed to load users:", error);
  }
}

async function loadMessages(groupId, page = 1, appendOlder = false) {
  if (state.loadingGroupMessages) return;
  state.loadingGroupMessages = true;

  try {
    const response = await fetch(
      `${baseUrl}/messages/${groupId}?page=${page}&limit=50`,
      {
        headers: { Authorization: `Bearer ${state.token}` },
      },
    );
    const data = await parseResponseJson(response);
    if (!response.ok)
      throw new Error(data.message || `HTTP ${response.status}`);

    const messages = data.data.messages || [];
    state.groupMessagesHasMore = Boolean(data.data.hasMore);

    if (!appendOlder) {
      dom.chatMessages.innerHTML = "";
      messages
        .slice()
        .reverse()
        .forEach((msg) => addMessageToUI(msg, state.user.id));
      state.groupMessagesPage = page;
      scrollToBottom();
    } else {
      const prevHeight = dom.chatMessages.scrollHeight;
      const prevTop = dom.chatMessages.scrollTop;
      messages.forEach((msg) => addMessageToUI(msg, state.user.id, true));
      dom.chatMessages.scrollTop =
        prevTop + (dom.chatMessages.scrollHeight - prevHeight);
      state.groupMessagesPage = page;
    }
  } catch (error) {
    console.error("Failed to load group messages:", error);
  } finally {
    state.loadingGroupMessages = false;
  }
}

async function loadPersonalMessages(userId, page = 1, appendOlder = false) {
  if (state.loadingPersonalMessages) return;
  state.loadingPersonalMessages = true;

  try {
    const response = await fetch(
      `${baseUrl}/personal-messages/${userId}?page=${page}&limit=50`,
      {
        headers: { Authorization: `Bearer ${state.token}` },
      },
    );
    const data = await parseResponseJson(response);
    if (!response.ok)
      throw new Error(data.message || `HTTP ${response.status}`);

    const messages = data.data.messages || [];
    state.personalMessagesHasMore = Boolean(data.data.hasMore);

    if (!appendOlder) {
      dom.chatMessages.innerHTML = "";
      messages
        .slice()
        .reverse()
        .forEach((msg) => addMessageToUI(msg, state.user.id));
      state.personalMessagesPage = page;
      scrollToBottom();
    } else {
      const prevHeight = dom.chatMessages.scrollHeight;
      const prevTop = dom.chatMessages.scrollTop;
      messages.forEach((msg) => addMessageToUI(msg, state.user.id, true));
      dom.chatMessages.scrollTop =
        prevTop + (dom.chatMessages.scrollHeight - prevHeight);
      state.personalMessagesPage = page;
    }
  } catch (error) {
    console.error("Failed to load personal messages:", error);
  } finally {
    state.loadingPersonalMessages = false;
  }
}

/* ==================== MESSAGE DISPATCHING ==================== */

async function sendMessage() {
  const messageText = dom.messageInput.value.trim();
  const file = state.selectedFile;

  if (!messageText && !file) return;

  // Media Attachment Message
  if (file) {
    try {
      const uploadedFile = await uploadMediaFile(file, state.token);
      const messageType = getMessageType(file);

      const payload = {
        content: messageText || null,
        messageType,
        mediaKey: uploadedFile.mediaKey,
        mediaUrl: uploadedFile.url,
        mediaName: uploadedFile.fileName,
        mediaSize: uploadedFile.fileSize,
        mimeType: uploadedFile.mimeType,
      };

      if (state.currentPersonalUserId) {
        socket.emit("send_personal_message", {
          ...payload,
          receiverId: state.currentPersonalUserId,
        });
      } else if (state.currentGroupId) {
        socket.emit("send_message", {
          ...payload,
          groupId: state.currentGroupId,
        });
      }

      dom.messageInput.value = "";
      state.clearSelectedFile();
      dom.fileInput.value = "";
      dom.attachmentPreview.innerHTML = "";
      dom.attachmentPreview.hidden = true;
      dom.messageInput.focus();
    } catch (error) {
      console.error("Failed to send media message:", error);
      alert(error.message || "Failed to send file");
    }
    return;
  }

  // Pure Text Message
  if (state.currentPersonalUserId) {
    socket.emit("send_personal_message", {
      receiverId: state.currentPersonalUserId,
      content: messageText,
    });
    dom.messageInput.value = "";
    dom.messageInput.focus();
  } else if (state.currentGroupId) {
    socket.emit("send_message", {
      groupId: state.currentGroupId,
      content: messageText,
    });
    dom.messageInput.value = "";
    dom.messageInput.focus();
  }
}

/* ==================== SOCKET EVENT LISTENERS ==================== */

socket.on("new_personal_message", (message) => {
  const senderId = Number(message.senderId);
  const receiverId = Number(message.receiverId);
  const loggedInUserId = Number(state.user.id);
  const activePersonalUserId = Number(state.currentPersonalUserId);
  const otherUserId = senderId === loggedInUserId ? receiverId : senderId;

  updatePersonalPreview(message, loggedInUserId);

  if (otherUserId === activePersonalUserId) {
    addMessageToUI(message, loggedInUserId);
    scrollToBottom();

    if (senderId !== loggedInUserId) {
      fetchSmartReplies({
        incomingMessage: message.content,
        recentMessages: getRecentMessagesForAI(dom.chatMessages),
        token: state.token,
      }).then((replies) => {
        renderSmartReplies(dom.aiSmartReplies, replies, (reply) => {
          dom.messageInput.value = reply;
          dom.messageInput.focus();
          dom.aiSmartReplies.innerHTML = "";
          dom.aiTypingSuggestions.innerHTML = "";
        });
      });
    }
    return;
  }

  const userElement = document.querySelector(
    `.user-item[data-user-id="${otherUserId}"]`,
  );
  if (userElement) incrementPersonalUnreadCount(userElement);
});

socket.on("new_message", (message) => {
  updateGroupPreview(message);

  const messageGroupId = Number(message.groupId);
  const activeGroupId = Number(state.currentGroupId);

  if (messageGroupId === activeGroupId) {
    addMessageToUI(message, state.user.id);
    scrollToBottom();
    return;
  }

  const groupElement = document.querySelector(
    `.group-item[data-group-id="${messageGroupId}"]`,
  );
  if (groupElement) incrementUnreadCount(groupElement);
});

socket.on("personal_room_error", (data) =>
  alert(data.message || "Unable to open personal chat."),
);
socket.on("message_error", (data) =>
  alert(data.message || "Failed to send message"),
);
socket.on("group_room_error", (data) =>
  alert(data.message || "Unable to join group"),
);
socket.on("group_message_error", (data) =>
  alert(data.message || "Unable to send message"),
);

/* ==================== USER INTERACTION LISTENERS ==================== */

// Send Button & Enter Key
dom.sendButton?.addEventListener("click", sendMessage);
dom.messageInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    sendMessage();
  }
});

// File Attachment Input
dom.attachFileBtn?.addEventListener("click", () => dom.fileInput.click());
dom.fileInput?.addEventListener("change", () => {
  const file = dom.fileInput.files[0];
  if (!file) return;

  const validation = validateFile(file);
  if (!validation.valid) {
    alert(validation.message);
    dom.fileInput.value = "";
    return;
  }

  state.setSelectedFile(file);
  renderAttachmentPreview(file, dom.attachmentPreview, () => {
    state.clearSelectedFile();
    dom.fileInput.value = "";
  });
});

// AI Typing Suggestions Debounced
dom.messageInput?.addEventListener("input", () => {
  clearTimeout(state.typingSuggestionTimer);
  state.typingSuggestionRequestId++;
  const reqId = state.typingSuggestionRequestId;

  dom.aiTypingSuggestions.innerHTML = "";
  dom.aiSmartReplies.innerHTML = "";

  const draft = dom.messageInput.value.trim();
  if (!draft || draft.length < 3) return;

  state.typingSuggestionTimer = setTimeout(async () => {
    const suggestions = await fetchTypingSuggestions({
      draft,
      recentMessages: getRecentMessagesForAI(dom.chatMessages),
      token: state.token,
    });
    if (reqId === state.typingSuggestionRequestId) {
      renderTypingSuggestions(
        dom.aiTypingSuggestions,
        suggestions,
        (suggestion) => {
          dom.messageInput.value = suggestion;
          dom.messageInput.focus();
          dom.aiTypingSuggestions.innerHTML = "";
        },
      );
    }
  }, 500);
});

// Infinite Scroll Pagination
dom.chatMessages?.addEventListener("scroll", async () => {
  if (dom.chatMessages.scrollTop <= 50) {
    if (
      state.personalMessagesHasMore &&
      !state.loadingPersonalMessages &&
      state.currentPersonalUserId
    ) {
      await loadPersonalMessages(
        state.currentPersonalUserId,
        state.personalMessagesPage + 1,
        true,
      );
    } else if (
      state.groupMessagesHasMore &&
      !state.loadingGroupMessages &&
      state.currentGroupId
    ) {
      await loadMessages(
        state.currentGroupId,
        state.groupMessagesPage + 1,
        true,
      );
    }
  }
});

/* ==================== GROUP MANAGEMENT MODALS ==================== */

// Create Group Modal
dom.createGroupBtn?.addEventListener("click", () => {
  dom.createGroupError.textContent = "";
  dom.groupNameInput.value = "";
  dom.createGroupModal.classList.add("active");
  dom.groupNameInput.focus();
});

dom.closeCreateGroupModal?.addEventListener("click", () => {
  dom.createGroupModal.classList.remove("active");
});

dom.createGroupForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = dom.groupNameInput.value.trim();
  if (!name) {
    dom.createGroupError.textContent = "Group name is required";
    return;
  }

  try {
    dom.createGroupError.textContent = "";
    const response = await fetch(`${baseUrl}/groups`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${state.token}`,
      },
      body: JSON.stringify({ name }),
    });
    const data = await parseResponseJson(response);
    if (!response.ok) throw new Error(data.message || "Failed to create group");

    dom.createGroupModal.classList.remove("active");
    await loadGroups();
  } catch (error) {
    dom.createGroupError.textContent =
      error.message || "Failed to create group";
  }
});

// Group Info Modal
dom.groupInfoBtn?.addEventListener("click", async () => {
  if (!state.currentGroupId) return;
  try {
    const response = await fetch(
      `${baseUrl}/groups/${state.currentGroupId}/members`,
      {
        headers: { Authorization: `Bearer ${state.token}` },
      },
    );
    const data = await parseResponseJson(response);
    if (!response.ok)
      throw new Error(data.message || "Failed to load group members");

    const groupElem = document.querySelector(
      `.group-item[data-group-id="${state.currentGroupId}"]`,
    );
    if (groupElem) {
      dom.groupInfoName.textContent = groupElem
        .querySelector("h4")
        .textContent.trim();
    }
    renderGroupMembers(data.data || [], state.user.id);
    dom.groupInfoModal.classList.add("active");
  } catch (error) {
    alert(error.message || "Failed to load group information");
  }
});

dom.closeGroupInfoModal?.addEventListener("click", () => {
  dom.groupInfoModal.classList.remove("active");
});

// Add Members Modal
dom.addMembersBtn?.addEventListener("click", async () => {
  if (!state.currentGroupId) return;
  try {
    dom.addMembersError.textContent = "";
    const [membersRes, usersRes] = await Promise.all([
      fetch(`${baseUrl}/groups/${state.currentGroupId}/members`, {
        headers: { Authorization: `Bearer ${state.token}` },
      }),
      fetch(`${baseUrl}/users`, {
        headers: { Authorization: `Bearer ${state.token}` },
      }),
    ]);
    const [membersData, usersData] = await Promise.all([
      parseResponseJson(membersRes),
      parseResponseJson(usersRes),
    ]);

    const memberIds = new Set(
      (membersData.data || []).map((m) => Number(m.userId)),
    );
    const availableUsers = (usersData.data || []).filter(
      (u) => !memberIds.has(Number(u.id)),
    );

    renderAvailableUsers(availableUsers);
    dom.addMembersModal.classList.add("active");
  } catch (error) {
    alert(error.message || "Failed to load users");
  }
});

dom.closeAddMembersModal?.addEventListener("click", () => {
  dom.addMembersModal.classList.remove("active");
});

dom.confirmAddMembersBtn?.addEventListener("click", async () => {
  const selected = document.querySelectorAll(".add-member-checkbox:checked");
  if (!selected.length) {
    dom.addMembersError.textContent = "Select at least one user";
    return;
  }

  try {
    dom.confirmAddMembersBtn.disabled = true;
    for (const checkbox of selected) {
      const response = await fetch(
        `${baseUrl}/groups/${state.currentGroupId}/members`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${state.token}`,
          },
          body: JSON.stringify({ userId: Number(checkbox.value) }),
        },
      );
      const data = await parseResponseJson(response);
      if (!response.ok) throw new Error(data.message || "Failed to add member");
    }

    dom.addMembersModal.classList.remove("active");
    // Refresh group info
    dom.groupInfoBtn.click();
  } catch (error) {
    dom.addMembersError.textContent = error.message || "Failed to add members";
  } finally {
    dom.confirmAddMembersBtn.disabled = false;
  }
});

// Leave Group
dom.leaveGroupBtn?.addEventListener("click", async () => {
  if (!state.currentGroupId) return;
  if (!confirm("Are you sure you want to leave this group?")) return;

  const groupId = state.currentGroupId;
  try {
    dom.leaveGroupBtn.disabled = true;
    const response = await fetch(`${baseUrl}/groups/${groupId}/members/me`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${state.token}` },
    });
    const data = await parseResponseJson(response);
    if (!response.ok) throw new Error(data.message || "Failed to leave group");

    socket.emit("leave_group", groupId);
    dom.groupInfoModal.classList.remove("active");
    state.clearActiveChat();
    clearActiveChats();
    dom.chatMessages.innerHTML = "";
    await loadGroups();
  } catch (error) {
    alert(error.message || "Failed to leave group");
  } finally {
    dom.leaveGroupBtn.disabled = false;
  }
// Logout
dom.logoutBtn?.addEventListener("click", () => {
  if (confirm("Are you sure you want to log out?")) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "./login.html";
  }
});

/* ==================== INITIALIZE APP ==================== */

renderProfile(state.user);
loadGroups();
loadUsers();
