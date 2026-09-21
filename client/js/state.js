/**
 * Central application state management
 */

// Authenticate user session
const storedToken = localStorage.getItem("token");
let parsedUser = null;
try {
  parsedUser = JSON.parse(localStorage.getItem("user"));
} catch (e) {
  parsedUser = null;
}

if (!storedToken || !parsedUser) {
  window.location.href = "./login.html";
}

export const state = {
  token: storedToken,
  user: parsedUser,

  currentGroupId: null,
  currentPersonalUserId: null,
  selectedFile: null,

  // Pagination & Loading
  personalMessagesPage: 1,
  personalMessagesHasMore: false,
  loadingPersonalMessages: false,

  groupMessagesPage: 1,
  groupMessagesHasMore: false,
  loadingGroupMessages: false,

  // AI Typing Suggestions
  typingSuggestionTimer: null,
  typingSuggestionRequestId: 0,

  // State mutators
  setCurrentGroup(groupId) {
    this.currentGroupId = groupId ? Number(groupId) : null;
    this.currentPersonalUserId = null;
    this.groupMessagesPage = 1;
    this.groupMessagesHasMore = false;
  },

  setCurrentPersonalUser(userId) {
    this.currentPersonalUserId = userId ? Number(userId) : null;
    this.currentGroupId = null;
    this.personalMessagesPage = 1;
    this.personalMessagesHasMore = false;
  },

  clearActiveChat() {
    this.currentGroupId = null;
    this.currentPersonalUserId = null;
    this.groupMessagesPage = 1;
    this.personalMessagesPage = 1;
  },

  setSelectedFile(file) {
    this.selectedFile = file;
  },

  clearSelectedFile() {
    this.selectedFile = null;
  },
};
