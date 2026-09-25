/**
 * UI Rendering and DOM Manipulation Module
 */

import { escapeHTML, formatMessageTime } from "./utils.js";

export const dom = {
  chatMessages: document.getElementById("chat-messages"),
  messageInput: document.getElementById("message-input"),
  sendButton: document.querySelector(".send-button"),
  groupList: document.getElementById("group-list"),
  userList: document.getElementById("user-list"),
  profileName: document.getElementById("profile-name"),
  profileAvatar: document.getElementById("profile-avatar"),
  chatHeader: document.getElementById("chat-header"),
  chatHeaderAvatar: document.getElementById("chat-header-avatar"),
  chatMemberCount: document.getElementById("chat-member-count"),
  createGroupBtn: document.getElementById("create-group-btn"),
  createGroupModal: document.getElementById("create-group-modal"),
  closeCreateGroupModal: document.getElementById("close-create-group-modal"),
  createGroupForm: document.getElementById("create-group-form"),
  groupNameInput: document.getElementById("group-name"),
  createGroupError: document.getElementById("create-group-error"),
  groupInfoBtn: document.getElementById("group-info-btn"),
  groupInfoModal: document.getElementById("group-info-modal"),
  closeGroupInfoModal: document.getElementById("close-group-info-modal"),
  groupInfoName: document.getElementById("group-info-name"),
  groupMemberCount: document.getElementById("group-member-count"),
  groupMemberList: document.getElementById("group-member-list"),
  addMembersBtn: document.getElementById("add-members-btn"),
  leaveGroupBtn: document.getElementById("leave-group-btn"),
  addMembersModal: document.getElementById("add-members-modal"),
  closeAddMembersModal: document.getElementById("close-add-members-modal"),
  availableUsersList: document.getElementById("available-users-list"),
  confirmAddMembersBtn: document.getElementById("confirm-add-members-btn"),
  addMembersError: document.getElementById("add-members-error"),
  attachFileBtn: document.getElementById("attach-file-btn"),
  fileInput: document.getElementById("file-input"),
  attachmentPreview: document.getElementById("attachment-preview"),
  aiTypingSuggestions: document.getElementById("ai-typing-suggestions"),
  aiSmartReplies: document.getElementById("ai-smart-replies"),
  connectionBanner: document.getElementById("connection-banner"),
  logoutBtn: document.getElementById("logout-btn"),
  chatLayout: document.querySelector(".chat-layout"),
  mobileBackBtn: document.getElementById("mobile-back-btn"),
};

export function openChatView() {
  if (dom.chatLayout) {
    dom.chatLayout.classList.add("chat-open");
  }
}

export function closeChatView() {
  if (dom.chatLayout) {
    dom.chatLayout.classList.remove("chat-open");
  }
}

export function renderProfile(user) {
  if (!user) return;
  if (dom.profileName) dom.profileName.textContent = user.name;
  if (dom.profileAvatar)
    dom.profileAvatar.textContent = user.name.charAt(0).toUpperCase();
}

export function updateChatHeader({ title, subtitle = "", avatarText = "" }) {
  if (dom.chatHeader) dom.chatHeader.textContent = title;
  if (dom.chatHeaderAvatar)
    dom.chatHeaderAvatar.textContent =
      avatarText || title.charAt(0).toUpperCase();
  if (dom.chatMemberCount) dom.chatMemberCount.textContent = subtitle;
}

export function clearActiveChats() {
  document
    .querySelectorAll(".group-item.active, .user-item.active")
    .forEach((item) => item.classList.remove("active"));
}

export function renderGroups(groups, activeGroupId, onSelectGroup) {
  if (!dom.groupList) return;
  dom.groupList.innerHTML = "";

  if (!groups || groups.length === 0) {
    dom.groupList.innerHTML = `<div class="empty-groups">No groups available</div>`;
    return;
  }

  groups.forEach((group) => {
    const groupElement = document.createElement("div");
    groupElement.classList.add("group-item");
    groupElement.dataset.groupId = group.id;

    if (activeGroupId && Number(activeGroupId) === Number(group.id)) {
      groupElement.classList.add("active");
    }

    const latestMessage = group.latestMessage;
    let previewText = "No messages yet";
    let previewTime = "";

    if (latestMessage) {
      const senderName = latestMessage.sender?.name || "Unknown";
      previewText = `${senderName}: ${latestMessage.content || "Shared media"}`;
      previewTime = formatMessageTime(latestMessage.createdAt);
    }

    groupElement.innerHTML = `
      <div class="group-avatar">${escapeHTML(group.name.charAt(0).toUpperCase())}</div>
      <div class="group-info">
        <div class="group-top">
          <h4>${escapeHTML(group.name)}</h4>
          <span class="group-time">${escapeHTML(previewTime)}</span>
        </div>
        <div class="group-bottom">
          <p class="group-preview">${escapeHTML(previewText)}</p>
          <span class="unread-count" style="display: none !important;"></span>
        </div>
      </div>
    `;

    groupElement.addEventListener("click", () => {
      if (typeof onSelectGroup === "function") {
        onSelectGroup(group, groupElement);
      }
    });

    dom.groupList.appendChild(groupElement);
  });
}

export function renderUsers(users, activeUserId, onSelectUser) {
  if (!dom.userList) return;
  dom.userList.innerHTML = "";

  if (!users || users.length === 0) {
    dom.userList.innerHTML = `<div class="empty-users">No other users</div>`;
    return;
  }

  users.forEach((otherUser) => {
    const userElement = document.createElement("div");
    userElement.classList.add("user-item");
    userElement.dataset.userId = otherUser.id;

    if (activeUserId && Number(activeUserId) === Number(otherUser.id)) {
      userElement.classList.add("active");
    }

    userElement.innerHTML = `
      <div class="user-avatar">${escapeHTML(otherUser.name.charAt(0).toUpperCase())}</div>
      <div class="user-info">
        <div class="user-top">
          <h4>${escapeHTML(otherUser.name)}</h4>
          <span class="user-time"></span>
        </div>
        <div class="user-bottom">
          <p class="user-preview">No messages yet</p>
          <span class="personal-unread-count" style="display: none !important;"></span>
        </div>
      </div>
    `;

    userElement.addEventListener("click", () => {
      if (typeof onSelectUser === "function") {
        onSelectUser(otherUser, userElement);
      }
    });

    dom.userList.appendChild(userElement);
  });
}

export function addMessageToUI(message, currentUserId, prepend = false) {
  if (!dom.chatMessages) return;

  const messageElement = document.createElement("div");
  const isOwnMessage = Number(message.senderId) === Number(currentUserId);

  messageElement.classList.add(
    "message",
    isOwnMessage ? "outgoing" : "incoming",
  );

  if (!isOwnMessage) {
    const avatar = document.createElement("div");
    avatar.classList.add("message-avatar");
    avatar.textContent = message.sender?.name?.charAt(0).toUpperCase() || "?";
    messageElement.appendChild(avatar);
  }

  const messageContent = document.createElement("div");
  messageContent.classList.add("message-content");

  if (!isOwnMessage) {
    const senderName = document.createElement("div");
    senderName.classList.add("message-sender");
    senderName.textContent = message.sender?.name || "Unknown User";
    messageContent.appendChild(senderName);
  }

  const messageBubble = document.createElement("div");
  messageBubble.classList.add("message-bubble");

  if (message.messageType === "text") {
    messageBubble.textContent = message.content || "";
  } else if (message.messageType === "image") {
    const image = document.createElement("img");
    image.src = message.mediaUrl;
    image.alt = message.mediaName || "Shared image";
    image.classList.add("chat-image");
    messageBubble.appendChild(image);
  } else if (message.messageType === "file") {
    const fileLink = document.createElement("a");
    fileLink.href = message.mediaUrl;
    fileLink.target = "_blank";
    fileLink.rel = "noopener noreferrer";
    fileLink.textContent = message.mediaName || "Open file";
    fileLink.classList.add("chat-file");
    messageBubble.appendChild(fileLink);
  } else if (message.messageType === "video") {
    const video = document.createElement("video");
    video.src = message.mediaUrl;
    video.controls = true;
    video.classList.add("chat-video");
    messageBubble.appendChild(video);
  } else if (message.messageType === "audio") {
    const audio = document.createElement("audio");
    audio.src = message.mediaUrl;
    audio.controls = true;
    audio.classList.add("chat-audio");
    messageBubble.appendChild(audio);
  }

  if (message.messageType !== "text" && message.content) {
    const caption = document.createElement("div");
    caption.classList.add("media-caption");
    caption.textContent = message.content;
    messageBubble.appendChild(caption);
  }

  const messageMeta = document.createElement("div");
  messageMeta.classList.add("message-meta");
  const date = new Date(message.createdAt);
  messageMeta.textContent = date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  messageContent.appendChild(messageBubble);
  messageContent.appendChild(messageMeta);
  messageElement.appendChild(messageContent);

  if (prepend) {
    dom.chatMessages.prepend(messageElement);
  } else {
    dom.chatMessages.appendChild(messageElement);
  }
}

export function scrollToBottom() {
  if (dom.chatMessages) {
    dom.chatMessages.scrollTop = dom.chatMessages.scrollHeight;
  }
}

export function updateConnectionBanner(status, detail) {
  if (!dom.connectionBanner) return;

  if (status === "connected") {
    dom.connectionBanner.className = "connection-banner banner-connected";
    dom.connectionBanner.textContent = "Connected";
    setTimeout(() => {
      dom.connectionBanner.hidden = true;
    }, 2000);
  } else if (status === "reconnecting") {
    dom.connectionBanner.hidden = false;
    dom.connectionBanner.className = "connection-banner banner-reconnecting";
    dom.connectionBanner.textContent = `Reconnecting to server (attempt ${detail || 1})...`;
  } else if (status === "disconnected" || status === "error") {
    dom.connectionBanner.hidden = false;
    dom.connectionBanner.className = "connection-banner banner-disconnected";
    dom.connectionBanner.textContent = "Offline. Attempting to reconnect...";
  }
}

export function updateGroupPreview(message) {
  const groupElement = document.querySelector(
    `.group-item[data-group-id="${message.groupId}"]`,
  );
  if (!groupElement) return;

  const preview = groupElement.querySelector(".group-preview");
  const time = groupElement.querySelector(".group-time");
  const senderName = message.sender?.name || "Unknown";

  preview.textContent = `${senderName}: ${message.content || "Shared media"}`;
  time.textContent = formatMessageTime(message.createdAt);
  dom.groupList.prepend(groupElement);
}

export function updatePersonalPreview(message, loggedInUserId) {
  const senderId = Number(message.senderId);
  const receiverId = Number(message.receiverId);
  const otherUserId =
    senderId === Number(loggedInUserId) ? receiverId : senderId;

  const userElement = document.querySelector(
    `.user-item[data-user-id="${otherUserId}"]`,
  );
  if (!userElement) return;

  const preview = userElement.querySelector(".user-preview");
  const time = userElement.querySelector(".user-time");

  preview.textContent = message.content || "Shared media";
  time.textContent = formatMessageTime(message.createdAt);
  dom.userList.prepend(userElement);
}

export function incrementUnreadCount(groupElement) {
  const unreadCount = groupElement?.querySelector(".unread-count");
  if (!unreadCount) return;
  let count = Number(unreadCount.textContent) || 0;
  count++;
  unreadCount.textContent = count;
  unreadCount.style.setProperty("display", "inline-flex", "important");
}

export function clearUnreadCount(groupElement) {
  const unreadCount = groupElement?.querySelector(".unread-count");
  if (!unreadCount) return;
  unreadCount.textContent = "";
  unreadCount.style.setProperty("display", "none", "important");
}

export function incrementPersonalUnreadCount(userElement) {
  const unreadCount = userElement?.querySelector(".personal-unread-count");
  if (!unreadCount) return;
  let count = Number(unreadCount.textContent) || 0;
  count++;
  unreadCount.textContent = count;
  unreadCount.style.setProperty("display", "inline-flex", "important");
}

export function clearPersonalUnreadCount(userElement) {
  const unreadCount = userElement?.querySelector(".personal-unread-count");
  if (!unreadCount) return;
  unreadCount.textContent = "";
  unreadCount.style.setProperty("display", "none", "important");
}

export function renderGroupMembers(members, loggedInUserId) {
  if (!dom.groupMemberList) return;
  dom.groupMemberList.innerHTML = "";
  dom.groupMemberCount.textContent = `${members.length} member${members.length === 1 ? "" : "s"}`;

  const currentMembership = members.find(
    (membership) => Number(membership.userId) === Number(loggedInUserId),
  );
  const isAdmin = currentMembership?.role === "admin";
  if (dom.addMembersBtn) {
    dom.addMembersBtn.style.display = isAdmin ? "block" : "none";
  }

  if (!members.length) {
    dom.groupMemberList.innerHTML = "<p>No members found.</p>";
    return;
  }

  members.forEach((membership) => {
    const member = membership.user;
    const memberElement = document.createElement("div");
    memberElement.className = "group-member";
    const initial = member.name.charAt(0).toUpperCase();

    memberElement.innerHTML = `
      <div class="group-member-avatar">${escapeHTML(initial)}</div>
      <div class="group-info">
        <p class="group-member-name">${escapeHTML(member.name)}</p>
        <p class="group-member-role">${escapeHTML(membership.role)}</p>
      </div>
    `;
    dom.groupMemberList.appendChild(memberElement);
  });
}

export function renderAvailableUsers(users) {
  if (!dom.availableUsersList) return;
  dom.availableUsersList.innerHTML = "";

  if (!users.length) {
    dom.availableUsersList.innerHTML = `
      <p class="form-error">There are no users available to add.</p>
    `;
    return;
  }

  users.forEach((otherUser) => {
    const userElement = document.createElement("label");
    userElement.className = "available-user";
    userElement.innerHTML = `
      <input type="checkbox" value="${escapeHTML(otherUser.id)}" class="add-member-checkbox">
      <div class="group-member-avatar">${escapeHTML(otherUser.name.charAt(0).toUpperCase())}</div>
      <div class="group-member-info">
        <p class="group-member-name">${escapeHTML(otherUser.name)}</p>
        <p class="group-member-role">${escapeHTML(otherUser.email)}</p>
      </div>
    `;
    dom.availableUsersList.appendChild(userElement);
  });
}
