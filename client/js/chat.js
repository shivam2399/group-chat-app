const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user"));

if (!token || !user) {
    window.location.href = "./login.html";
}

/* ==================== STATE ==================== */

let currentGroupId = null;
let currentPersonalUserId = null;


/* ==================== DOM ELEMENTS ==================== */

const groupList = document.getElementById("group-list");
const userList = document.getElementById("user-list");    
const profileName = document.getElementById("profile-name");
const profileAvatar = document.getElementById("profile-avatar");
const chatHeader = document.getElementById("chat-header");
const chatHeaderAvatar = document.getElementById("chat-header-avatar");
const chatMemberCount = document.getElementById("chat-member-count");
const chatMessages = document.getElementById("chat-messages");
const messageInput = document.querySelector(".chat-input input");
const sendButton = document.querySelector(".send-button");


/* ==================== SOCKET.IO ==================== */

const socket = io("http://localhost:5000", {
    auth: {
        token: token
    }
});

socket.on("connect", () => {

    console.log(
        "Connected to Socket.IO server:",
        socket.id
    );

    /*
        Groups are loaded separately.

        Once the groups are loaded,
        renderGroups() will join the
        appropriate room.
    */

});

socket.on("disconnect", () => {

    console.log(
        "Disconnected from Socket.IO server"
    );

});

socket.on("connect_error", (error) => {

    console.error(
        "Socket connection failed:",
        error.message
    );

});


/* ==================== PROFILE ==================== */

function renderProfile() {

    profileName.textContent =
        user.name;

    profileAvatar.textContent =
        user.name
            .charAt(0)
            .toUpperCase();
}


/* ==================== LOAD GROUPS ==================== */

async function loadGroups() {

    try {

        const response =
            await fetch(
                `${API_BASE_URL}/groups`,
                {
                    method: "GET",
                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.message
            );
        }

        renderGroups(data.data);

    } catch (error) {

        console.error(
            "Failed to load groups:",
            error
        );

        alert(
            "Failed to load groups."
        );
    }
}

async function loadUsers() {
    try {
        const response = await fetch(
            `${API_BASE_URL}/users`,
            {
                method: "GET",
                headers: {
                    "Authorization":
                        `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message);
        }

        renderUsers(data.data);

    } catch (error) {
        console.error(
            "Failed to load users:",
            error
        );
    }
}


/* ==================== RENDER GROUPS ==================== */

function renderGroups(groups) {

    groupList.innerHTML = "";

    if (groups.length === 0) {

        groupList.innerHTML = `
            <div class="empty-groups">
                No groups available
            </div>
        `;

        return;
    }

    groups.forEach((group, index) => {

        const groupElement =
            document.createElement("div");

        groupElement.classList.add(
            "group-item"
        );

        groupElement.dataset.groupId =
            group.id;

        /*
            Get latest message
        */

        const latestMessage =
            group.latestMessage;

        let previewText =
            "No messages yet";

        let previewTime =
            "";

        if (latestMessage) {

            const senderName =
                latestMessage.sender?.name ||
                "Unknown";

            previewText =
                `${senderName}: ${latestMessage.content}`;

            previewTime =
                formatMessageTime(
                    latestMessage.createdAt
                );
        }

        /*
            Select first group by default
        */

        if (index === 0) {

            groupElement.classList.add("active");

            currentGroupId = group.id;
            currentPersonalUserId = null;

            updateChatHeader(group);
        }

        groupElement.innerHTML = `
            <div class="group-avatar">
                ${group.name
                    .charAt(0)
                    .toUpperCase()}
            </div>

            <div class="group-info">

                <div class="group-top">

                    <h4>
                        ${group.name}
                    </h4>

                    <span class="group-time">
                        ${previewTime}
                    </span>

                </div>

                <div class="group-bottom">
                    <p class="group-preview">
                        ${previewText}
                    </p>

                    <span class="unread-count">0</span>
                </div>

            </div>
        `;

        groupList.appendChild(
            groupElement
        );
    });

    attachGroupListeners();

    /*
        Join the initially selected group
        and load its messages.
    */

    if (currentGroupId) {

    groups.forEach((group) => {
        socket.emit(
            "join_group",
            group.id
        );
    });

    loadMessages(
        currentGroupId
    );
}
}

function renderUsers(users) {
    userList.innerHTML = "";

    if (users.length === 0) {
        userList.innerHTML = `
            <div class="empty-users">
                No other users
            </div>
        `;

        return;
    }

    users.forEach((otherUser) => {

        const userElement =
            document.createElement("div");

        userElement.classList.add("user-item");

        userElement.dataset.userId =
            otherUser.id;

        userElement.innerHTML = `
            <div class="user-avatar">
                ${otherUser.name
                    .charAt(0)
                    .toUpperCase()}
            </div>

            <div class="user-info">
                <h4>${otherUser.name}</h4>
                <span>Online</span>
            </div>
        `;

        userList.appendChild(userElement);
        userElement.addEventListener("click", async () => {

            const otherUserId =
                Number(userElement.dataset.userId);

            clearActiveChats();

            userElement.classList.add("active");

            currentGroupId = null;
            currentPersonalUserId = otherUserId;

            messageInput.value = "";

            socket.emit("join_room", {
                userId: otherUserId
            });

            console.log(
                "Joining personal chat with user:",
                otherUserId
            );

            const userName =
                userElement
                    .querySelector("h4")
                    .textContent;

            chatHeader.textContent = userName;

            chatHeaderAvatar.textContent =
                userName
                    .charAt(0)
                    .toUpperCase();

            chatMemberCount.textContent =
                "Online";

            await loadPersonalMessages(
                otherUserId
            );
        });
    });
}

function incrementUnreadCount(groupElement) {
    const unreadCount =
        groupElement.querySelector(".unread-count");

    if (!unreadCount) {
        return;
    }

    let count =
        Number(unreadCount.textContent) || 0;

    count++;

    unreadCount.textContent = count;
    unreadCount.style.display = "flex";
}

function clearUnreadCount(groupElement) {
    const unreadCount =
        groupElement.querySelector(".unread-count");

    if (!unreadCount) {
        return;
    }

    unreadCount.textContent = "0";
    unreadCount.style.display = "none";
}

function formatMessageTime(createdAt) {
    const date = new Date(createdAt);
    const now = new Date();

    const isToday =
        date.toDateString() === now.toDateString();

    if (isToday) {
        return date.toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit"
        });
    }

    const yesterday = new Date();

    yesterday.setDate(
        yesterday.getDate() - 1
    );

    if (
        date.toDateString() ===
        yesterday.toDateString()
    ) {
        return "Yesterday";
    }

    return date.toLocaleDateString([], {
        day: "numeric",
        month: "short"
    });
}

function moveGroupToTop(groupElement) {
    groupList.prepend(groupElement);
}


/* ==================== GROUP LISTENERS ==================== */

function attachGroupListeners() {

    const groupItems =
        document.querySelectorAll(
            ".group-item"
        );

    groupItems.forEach((group) => {

        group.addEventListener(
            "click",
            async () => {

                const previousGroupId =
                    currentGroupId;

                const newGroupId =
                    Number(
                        group.dataset.groupId
                    );

                /*
                    Don't do anything if
                    the user clicks the
                    currently selected group.
                */

                if (
                    previousGroupId ===
                    newGroupId
                ) {
                    return;
                }


                clearActiveChats(); 

                group.classList.add(
                    "active"
                );
                clearUnreadCount(group);
                currentPersonalUserId = null;
                currentGroupId = newGroupId;

                /*
                    Join new room.
                */

                socket.emit(
                    "join_group",
                    currentGroupId
                );

                /*
                    Update header.
                */

                const groupName = group.querySelector("h4").textContent.trim();

                chatHeader.textContent = groupName;
                chatHeaderAvatar.textContent = groupName.charAt(0).toUpperCase();

                /*
                    Load message history.
                */

                await loadMessages(
                    currentGroupId
                );
            }
        );
    });
}


/* ==================== UPDATE CHAT HEADER ==================== */

function updateChatHeader(group) {

    chatHeader.textContent =
        group.name;

    chatHeaderAvatar.textContent =
        group.name
            .charAt(0)
            .toUpperCase();

    /*
        We don't have group membership
        implemented yet, so don't show
        fake member counts.
    */

    chatMemberCount.textContent = "";
}

function updateGroupPreview(message) {

    const groupElement =
        document.querySelector(
            `.group-item[data-group-id="${message.groupId}"]`
        );

    if (!groupElement) {
        return;
    }

    const preview =
        groupElement.querySelector(
            ".group-preview"
        );

    const time =
        groupElement.querySelector(
            ".group-time"
        );

    const senderName =
        message.sender?.name ||
        "Unknown";

    preview.textContent =
        `${senderName}: ${message.content}`;

    time.textContent =
        formatMessageTime(
            message.createdAt
        );

    /*
        Move the group to the top
        because it has new activity.
    */

    moveGroupToTop(
        groupElement
    );
}


/* ==================== LOAD MESSAGES ==================== */

async function loadMessages(groupId) {

    try {

        const response =
            await fetch(
                `${API_BASE_URL}/messages/${groupId}`,
                {
                    method: "GET",
                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.message
            );
        }

        chatMessages.innerHTML = "";

        data.data.forEach(
            (message) => {
                addMessageToUI(message);
            }
        );

        scrollToBottom();

    } catch (error) {

        console.error(
            "Failed to load messages:",
            error
        );

        alert(
            "Failed to load messages."
        );
    }
}

async function loadPersonalMessages(userId) {
    try {
        const response = await fetch(
            `${API_BASE_URL}/personal-messages/${userId}`,
            {
                method: "GET",
                headers: {
                    "Authorization":
                        `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message);
        }

        chatMessages.innerHTML = "";

        data.data.forEach((message) => {
            addMessageToUI(message);
        });

        scrollToBottom();

    } catch (error) {
        console.error(
            "Failed to load personal messages:",
            error
        );

        alert(
            "Failed to load personal messages."
        );
    }
}

function clearActiveChats() {
    document
        .querySelectorAll(".group-item.active, .user-item.active")
        .forEach((item) => {
            item.classList.remove("active");
        });
}

/* ==================== ADD MESSAGE TO UI ==================== */

function addMessageToUI(message) {

    const messageElement =
        document.createElement("div");

    const isOwnMessage =
        Number(message.senderId) ===
        Number(user.id);

    messageElement.classList.add(
        "message",
        isOwnMessage
            ? "outgoing"
            : "incoming"
    );

    /*
        Incoming message avatar
    */

    if (!isOwnMessage) {

        const avatar =
            document.createElement("div");

        avatar.classList.add(
            "message-avatar"
        );

        avatar.textContent =
            message.sender?.name
                ?.charAt(0)
                .toUpperCase() || "?";

        messageElement.appendChild(
            avatar
        );
    }

    const messageContent =
        document.createElement("div");

    messageContent.classList.add(
        "message-content"
    );

    /*
        Sender name for incoming
        messages.
    */

    if (!isOwnMessage) {

        const senderName =
            document.createElement("div");

        senderName.classList.add(
            "message-sender"
        );

        senderName.textContent =
            message.sender?.name ||
            "Unknown User";

        messageContent.appendChild(
            senderName
        );
    }

    const messageBubble =
        document.createElement("div");

    messageBubble.classList.add(
        "message-bubble"
    );

    messageBubble.textContent =
        message.content;

    const messageMeta =
        document.createElement("div");

    messageMeta.classList.add(
        "message-meta"
    );

    const date =
        new Date(message.createdAt);

    messageMeta.textContent =
        date.toLocaleTimeString(
            [],
            {
                hour: "numeric",
                minute: "2-digit"
            }
        );

    messageContent.appendChild(
        messageBubble
    );

    messageContent.appendChild(
        messageMeta
    );

    messageElement.appendChild(
        messageContent
    );

    chatMessages.appendChild(
        messageElement
    );
}


/* ==================== SEND MESSAGE ==================== */

function sendMessage() {

    const messageText =
        messageInput.value.trim();

    if (!messageText) {
        return;
    }


    // =========================
    // PERSONAL CHAT
    // =========================

    if (currentPersonalUserId) {

        socket.emit(
            "send_personal_message",
            {
                receiverId:
                    currentPersonalUserId,

                content:
                    messageText
            }
        );

        messageInput.value = "";
        messageInput.focus();

        return;
    }


    // =========================
    // GROUP CHAT
    // =========================

    if (currentGroupId) {

        socket.emit(
            "send_message",
            {
                groupId:
                    currentGroupId,

                content:
                    messageText
            }
        );

        messageInput.value = "";
        messageInput.focus();
    }
}


/* ==================== RECEIVE MESSAGE ==================== */

socket.on(
    "new_personal_message",
    (message) => {

        console.log(
            "Personal message received:",
            message
        );

        const senderId =
            Number(message.senderId);

        const receiverId =
            Number(message.receiverId);

        const loggedInUserId =
            Number(user.id);

        const activePersonalUserId =
            Number(currentPersonalUserId);


        // Find the other person involved
        // in this conversation.

        const otherUserId =
            senderId === loggedInUserId
                ? receiverId
                : senderId;


        // Only render if that person's
        // conversation is currently open.

        if (
            otherUserId ===
            activePersonalUserId
        ) {
            addMessageToUI(message);
            scrollToBottom();
        }
    }
);

socket.on("new_message", (message) => {
    updateGroupPreview(message);

    const messageGroupId =
        Number(message.groupId);

    const activeGroupId =
        Number(currentGroupId);

    // Message belongs to the currently open chat
    if (messageGroupId === activeGroupId) {

        addMessageToUI(message);
        scrollToBottom();

        return;
    }

    // Message belongs to another chat
    const groupElement =
        document.querySelector(
            `.group-item[data-group-id="${messageGroupId}"]`
        );

    if (groupElement) {
        incrementUnreadCount(groupElement);
    }
});


/* ==================== MESSAGE ERROR ==================== */

socket.on(
    "message_error",
    (data) => {

        console.error(
            "Message error:",
            data.message
        );

        alert(
            data.message ||
            "Failed to send message"
        );
    }
);


/* ==================== AUTO SCROLL ==================== */

function scrollToBottom() {

    chatMessages.scrollTop =
        chatMessages.scrollHeight;
}


/* ==================== SEND BUTTON ==================== */

sendButton.addEventListener(
    "click",
    sendMessage
);


/* ==================== ENTER KEY ==================== */

messageInput.addEventListener(
    "keydown",
    (event) => {

        if (event.key === "Enter") {

            event.preventDefault();

            sendMessage();
        }
    }
);


/* ==================== INITIALIZE ==================== */

renderProfile();
loadGroups();
loadUsers();