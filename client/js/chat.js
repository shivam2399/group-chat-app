const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user"));

if (!token || !user) {
    window.location.href = "./login.html";
}

/* ==================== STATE ==================== */

let currentGroupId = null;
let currentPersonalUserId = null;
let selectedFile = null;


/* ==================== DOM ELEMENTS ==================== */

const groupList = document.getElementById("group-list");
const userList = document.getElementById("user-list");    
const profileName = document.getElementById("profile-name");
const profileAvatar = document.getElementById("profile-avatar");
const chatHeader = document.getElementById("chat-header");
const chatHeaderAvatar = document.getElementById("chat-header-avatar");
const chatMemberCount = document.getElementById("chat-member-count");
const chatMessages = document.getElementById("chat-messages");
const messageInput = document.getElementById("message-input");
const sendButton = document.querySelector(".send-button");
const createGroupBtn = document.getElementById("create-group-btn");
const createGroupModal = document.getElementById("create-group-modal");
const closeCreateGroupModal = document.getElementById("close-create-group-modal");
const createGroupForm = document.getElementById("create-group-form");
const groupNameInput = document.getElementById("group-name");
const createGroupError = document.getElementById("create-group-error");
const groupInfoBtn = document.getElementById("group-info-btn");
const groupInfoModal = document.getElementById("group-info-modal");
const closeGroupInfoModal = document.getElementById("close-group-info-modal");
const groupInfoName = document.getElementById("group-info-name");
const groupMemberCount =document.getElementById("group-member-count");
const groupMemberList =document.getElementById("group-member-list");
const addMembersBtn = document.getElementById("add-members-btn");
const leaveGroupBtn = document.getElementById("leave-group-btn");
const addMembersModal = document.getElementById("add-members-modal");
const closeAddMembersModal = document.getElementById("close-add-members-modal");
const availableUsersList = document.getElementById("available-users-list");
const confirmAddMembersBtn = document.getElementById("confirm-add-members-btn");
const addMembersError = document.getElementById("add-members-error");
const attachFileBtn = document.getElementById("attach-file-btn");
const fileInput = document.getElementById("file-input");
const attachmentPreview = document.getElementById("attachment-preview");

const MAX_FILE_SIZE = 25 * 1024 * 1024;

const ALLOWED_FILE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",

    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",

    "video/mp4",
    "video/webm",

    "audio/mpeg",
    "audio/wav",
    "audio/ogg"
];

function validateFile(file) {

    if (!file) {
        return {
            valid: false,
            message: "Please select a file"
        };
    }

    if (file.size > MAX_FILE_SIZE) {
        return {
            valid: false,
            message: "File size cannot exceed 25 MB"
        };
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        return {
            valid: false,
            message: "This file type is not supported"
        };
    }

    return {
        valid: true
    };
}

function getMessageType(file) {

    if (file.type.startsWith("image/")) {
        return "image";
    }

    if (file.type.startsWith("video/")) {
        return "video";
    }

    if (file.type.startsWith("audio/")) {
        return "audio";
    }

    return "file";
}

function showAttachmentPreview(file) {

    attachmentPreview.innerHTML = "";

    attachmentPreview.hidden = false;

    const previewContent =
        document.createElement("div");

    previewContent.classList.add(
        "attachment-preview-content"
    );

    // Image preview
    if (file.type.startsWith("image/")) {

        const image =
            document.createElement("img");

        image.src =
            URL.createObjectURL(file);

        image.alt = file.name;

        image.classList.add(
            "attachment-preview-image"
        );

        previewContent.appendChild(image);
    }

    // Non-image file
    else {

        const fileIcon =
            document.createElement("div");

        fileIcon.classList.add(
            "attachment-preview-icon"
        );

        fileIcon.textContent = "📄";

        previewContent.appendChild(
            fileIcon
        );
    }

    const fileInfo =
        document.createElement("div");

    fileInfo.classList.add(
        "attachment-preview-info"
    );

    const fileName =
        document.createElement("div");

    fileName.classList.add(
        "attachment-preview-name"
    );

    fileName.textContent =
        file.name;

    const fileSize =
        document.createElement("div");

    fileSize.classList.add(
        "attachment-preview-size"
    );

    fileSize.textContent =
        formatFileSize(file.size);

    fileInfo.appendChild(fileName);
    fileInfo.appendChild(fileSize);

    previewContent.appendChild(
        fileInfo
    );

    // Remove button
    const removeButton =
        document.createElement("button");

    removeButton.type = "button";

    removeButton.textContent = "×";

    removeButton.classList.add(
        "attachment-preview-remove"
    );

    removeButton.addEventListener(
        "click",
        removeSelectedFile
    );

    previewContent.appendChild(
        removeButton
    );

    attachmentPreview.appendChild(
        previewContent
    );
}

function formatFileSize(bytes) {

    if (bytes < 1024) {
        return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function removeSelectedFile() {

    selectedFile = null;

    fileInput.value = "";

    attachmentPreview.innerHTML = "";

    attachmentPreview.hidden = true;
}


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

socket.on(
    "personal_room_error",
    (data) => {

        console.error(
            "Personal room error:",
            data.message
        );

        alert(
            data.message ||
            "Unable to open personal chat."
        );
    }
);




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

                <div class="user-top">
                    <h4>${otherUser.name}</h4>

                    <span class="user-time"></span>
                </div>

                <div class="user-bottom">

                    <p class="user-preview">
                        No messages yet
                    </p>

                    <span class="personal-unread-count">
                        0
                    </span>

                </div>

            </div>
        `;

        userList.appendChild(userElement);
        userElement.addEventListener("click", async () => {

            const otherUserId =
                Number(userElement.dataset.userId);

            clearActiveChats();

            userElement.classList.add("active");
            clearPersonalUnreadCount(userElement);
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

function incrementPersonalUnreadCount(userElement) {

    const unreadCount =
        userElement.querySelector(
            ".personal-unread-count"
        );

    if (!unreadCount) {
        return;
    }

    let count =
        Number(unreadCount.textContent) || 0;

    count++;

    unreadCount.textContent =
        count;

    unreadCount.style.display =
        "flex";
}

function clearPersonalUnreadCount(userElement) {

    const unreadCount =
        userElement.querySelector(
            ".personal-unread-count"
        );

    if (!unreadCount) {
        return;
    }

    unreadCount.textContent =
        "0";

    unreadCount.style.display =
        "none";
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

function moveUserToTop(userElement) {
    userList.prepend(userElement);
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

function updatePersonalPreview(message) {

    const senderId =
        Number(message.senderId);

    const receiverId =
        Number(message.receiverId);

    const loggedInUserId =
        Number(user.id);

    const otherUserId =
        senderId === loggedInUserId
            ? receiverId
            : senderId;


    const userElement =
        document.querySelector(
            `.user-item[data-user-id="${otherUserId}"]`
        );

    if (!userElement) {
        return;
    }


    const preview =
        userElement.querySelector(
            ".user-preview"
        );

    const time =
        userElement.querySelector(
            ".user-time"
        );


    preview.textContent =
        message.content;

    time.textContent =
        formatMessageTime(
            message.createdAt
        );


    moveUserToTop(
        userElement
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

    /*
        TEXT MESSAGE
    */

    if (message.messageType === "text") {

        messageBubble.textContent =
            message.content || "";

    }

    /*
        IMAGE MESSAGE
    */

    else if (message.messageType === "image") {

        const image =
            document.createElement("img");

        image.src =
            message.mediaUrl;

        image.alt =
            message.mediaName ||
            "Shared image";

        image.classList.add(
            "chat-image"
        );

        messageBubble.appendChild(
            image
        );

    }


    /*
        FILE MESSAGE
    */

    else if (message.messageType === "file") {

        const fileLink =
            document.createElement("a");

        fileLink.href =
            message.mediaUrl;

        fileLink.target = "_blank";

        fileLink.rel =
            "noopener noreferrer";

        fileLink.textContent =
            message.mediaName ||
            "Open file";

        fileLink.classList.add(
            "chat-file"
        );

        messageBubble.appendChild(
            fileLink
        );

    }


    /*
        VIDEO MESSAGE
    */

    else if (message.messageType === "video") {

        const video =
            document.createElement("video");

        video.src =
            message.mediaUrl;

        video.controls = true;

        video.classList.add(
            "chat-video"
        );

        messageBubble.appendChild(
            video
        );

    }


    /*
        AUDIO MESSAGE
    */

    else if (message.messageType === "audio") {

        const audio =
            document.createElement("audio");

        audio.src =
            message.mediaUrl;

        audio.controls = true;

        audio.classList.add(
            "chat-audio"
        );

        messageBubble.appendChild(
            audio
        );

    }

    if (
        message.messageType !== "text" &&
        message.content
    ) {

        const caption =
            document.createElement("div");

        caption.classList.add(
            "media-caption"
        );

        caption.textContent =
            message.content;

        messageBubble.appendChild(
            caption
        );
    }

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

async function uploadMediaFile(file) {
    try {
        const formData = new FormData();

        formData.append("file", file);

        const response = await fetch(
            `${API_BASE_URL}/media/upload`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: formData
            }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.message ||
                "Failed to upload file"
            );
        }

        console.log(
            "MEDIA UPLOAD SUCCESS:",
            result
        );

        return result.data;

    } catch (error) {

        console.error(
            "MEDIA UPLOAD ERROR:",
            error
        );

        throw error;
    }
}

attachFileBtn.addEventListener(
    "click",
    () => {
        fileInput.click();
    }
);

fileInput.addEventListener(
    "change",
    () => {

        const file =
            fileInput.files[0];

        if (!file) {
            return;
        }

        const validation =
            validateFile(file);

        if (!validation.valid) {
            alert(validation.message);
            fileInput.value = "";
            return;
        }

        selectedFile = file;
        showAttachmentPreview(file);

        console.log(
            "PENDING FILE:",
            {
                name: file.name,
                size: file.size,
                type: file.type
            }
        );
    }
);


/* ==================== SEND MESSAGE ==================== */

async function sendMessage() {
    console.log("Text message received")

    const messageText =
        messageInput.value.trim();

    // Nothing to send
    if (!messageText && !selectedFile) {
        return;
    }


    // =========================
    // MEDIA MESSAGE
    // =========================

    if (selectedFile) {

        try {

            console.log(
                "UPLOADING ATTACHMENT..."
            );

            const uploadedFile =
                await uploadMediaFile(
                    selectedFile
                );

            console.log(
                "FILE UPLOADED:",
                uploadedFile
            );

            const messageType =
                getMessageType(
                    selectedFile
                );


            // =========================
            // PERSONAL MEDIA
            // =========================

            if (currentPersonalUserId) {

                socket.emit(
                    "send_personal_message",
                    {
                        receiverId:
                            currentPersonalUserId,

                        content:
                            messageText || null,

                        messageType,

                        mediaKey:
                            uploadedFile.mediaKey,

                        mediaUrl:
                            uploadedFile.url,

                        mediaName:
                            uploadedFile.fileName,

                        mediaSize:
                            uploadedFile.fileSize,

                        mimeType:
                            uploadedFile.mimeType
                    }
                );
            }


            // =========================
            // GROUP MEDIA
            // =========================

            else if (currentGroupId) {

                socket.emit(
                    "send_message",
                    {
                        groupId:
                            currentGroupId,

                        content:
                            messageText || null,

                        messageType,

                        mediaKey:
                            uploadedFile.mediaKey,

                        mediaUrl:
                            uploadedFile.url,

                        mediaName:
                            uploadedFile.fileName,

                        mediaSize:
                            uploadedFile.fileSize,

                        mimeType:
                            uploadedFile.mimeType
                    }
                );
            }


            // =========================
            // CLEAN UP
            // =========================

            messageInput.value = "";

            removeSelectedFile();

            messageInput.focus();

        } catch (error) {

            console.error(
                "FAILED TO SEND MEDIA:",
                error
            );

            alert(
                error.message ||
                "Failed to send file"
            );
        }

        return;
    }


    // =========================
    // TEXT MESSAGE
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

createGroupBtn.addEventListener(
    "click",
    () => {
        createGroupError.textContent = "";
        groupNameInput.value = "";

        createGroupModal.classList.add("active");

        groupNameInput.focus();
    }
);

closeCreateGroupModal.addEventListener(
    "click",
    () => {
        createGroupModal.classList.remove(
            "active"
        );
    }
);

createGroupModal.addEventListener(
    "click",
    (event) => {
        if (
            event.target === createGroupModal
        ) {
            createGroupModal.classList.remove(
                "active"
            );
        }
    }
);

createGroupForm.addEventListener(
    "submit",
    async (event) => {
        event.preventDefault();

        const name = groupNameInput.value.trim();

        if (!name) {
            createGroupError.textContent =
                "Group name is required";
            return;
        }

        try {
            createGroupError.textContent = "";

            const response = await fetch(
                `${API_BASE_URL}/groups`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${token}`
                    },

                    body: JSON.stringify({
                        name
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Failed to create group"
                );
            }

            console.log(
                "Group created:",
                data.data
            );

            createGroupModal.classList.remove(
                "active"
            );

            await loadGroups();

        } catch (error) {
            console.error(
                "Create group error:",
                error
            );

            createGroupError.textContent =
                error.message ||
                "Failed to create group";
        }
    }
);

groupInfoBtn.addEventListener(
    "click",
    async () => {

        if (!currentGroupId) {
            return;
        }

        await openGroupInfo(
            currentGroupId
        );
    }
);

async function openGroupInfo(groupId) {
    try {
        const response = await fetch(
            `${API_BASE_URL}/groups/${groupId}/members`,
            {
                headers: {
                    Authorization:
                        `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                "Failed to load group members"
            );
        }

        const groupElement =
            document.querySelector(
                `.group-item[data-group-id="${groupId}"]`
            );

        if (groupElement) {
            const groupName =
                groupElement
                    .querySelector("h4")
                    .textContent
                    .trim();

            groupInfoName.textContent =
                groupName;
        }

        renderGroupMembers(data.data);

        groupInfoModal.classList.add(
            "active"
        );

    } catch (error) {
        console.error(
            "Group info error:",
            error
        );

        alert(
            error.message ||
            "Failed to load group information"
        );
    }
}

function renderGroupMembers(members) {
    groupMemberList.innerHTML = "";

    groupMemberCount.textContent =
        `${members.length} member${members.length === 1 ? "" : "s"}`;

    const currentMembership =
        members.find(
            (membership) =>
                Number(membership.userId) ===
                Number(user.id)
        );

    const isAdmin =
        currentMembership?.role === "admin";

    addMembersBtn.style.display =
        isAdmin ? "block" : "none";

    if (!members.length) {
        groupMemberList.innerHTML =
            "<p>No members found.</p>";

        return;
    }

    members.forEach((membership) => {

        const member = membership.user;

        const memberElement =
            document.createElement("div");

        memberElement.className =
            "group-member";

        const initial =
            member.name
                .charAt(0)
                .toUpperCase();

        memberElement.innerHTML = `
            <div class="group-member-avatar">
                ${initial}
            </div>

            <div class="group-member-info">
                <p class="group-member-name">
                    ${member.name}
                </p>

                <p class="group-member-role">
                    ${membership.role}
                </p>
            </div>
        `;

        groupMemberList.appendChild(
            memberElement
        );
    });
}

closeGroupInfoModal.addEventListener(
    "click",
    () => {
        groupInfoModal.classList.remove(
            "active"
        );
    }
);

groupInfoModal.addEventListener(
    "click",
    (event) => {
        if (
            event.target === groupInfoModal
        ) {
            groupInfoModal.classList.remove(
                "active"
            );
        }
    }
);

addMembersBtn.addEventListener(
    "click",
    async () => {
        await openAddMembersModal(
            currentGroupId
        );
    }
);

closeAddMembersModal.addEventListener(
    "click",
    () => {
        addMembersModal.classList.remove(
            "active"
        );
    }
);

addMembersModal.addEventListener(
    "click",
    (event) => {
        if (
            event.target === addMembersModal
        ) {
            addMembersModal.classList.remove(
                "active"
            );
        }
    }
);

async function getGroupMembers(groupId) {
    const response = await fetch(
        `${API_BASE_URL}/groups/${groupId}/members`,
        {
            headers: {
                Authorization:
                    `Bearer ${token}`
            }
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message ||
            "Failed to fetch group members"
        );
    }

    return data.data;
}

async function getAllUsers() {
    const response = await fetch(
        `${API_BASE_URL}/users`,
        {
            headers: {
                Authorization:
                    `Bearer ${token}`
            }
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message ||
            "Failed to fetch users"
        );
    }

    return data.data;
}

async function openAddMembersModal(groupId) {
    try {
        addMembersError.textContent = "";

        const [
            members,
            users
        ] = await Promise.all([
            getGroupMembers(groupId),
            getAllUsers()
        ]);

        const memberIds =
            new Set(
                members.map(
                    (membership) =>
                        Number(
                            membership.userId
                        )
                )
            );

        const availableUsers =
            users.filter(
                (otherUser) =>
                    !memberIds.has(
                        Number(otherUser.id)
                    )
            );

        renderAvailableUsers(
            availableUsers
        );

        addMembersModal.classList.add(
            "active"
        );

    } catch (error) {
        console.error(
            "Failed to open add members:",
            error
        );

        alert(
            error.message ||
            "Failed to load users"
        );
    }
}

function renderAvailableUsers(users) {
    availableUsersList.innerHTML = "";

    if (!users.length) {
        availableUsersList.innerHTML = `
            <p class="form-error">
                There are no users available to add.
            </p>
        `;

        return;
    }

    users.forEach((otherUser) => {
        const userElement =
            document.createElement("label");

        userElement.className =
            "available-user";

        userElement.innerHTML = `
            <input
                type="checkbox"
                value="${otherUser.id}"
                class="add-member-checkbox"
            >

            <div class="group-member-avatar">
                ${otherUser.name
                    .charAt(0)
                    .toUpperCase()}
            </div>

            <div class="group-member-info">
                <p class="group-member-name">
                    ${otherUser.name}
                </p>

                <p class="group-member-role">
                    ${otherUser.email}
                </p>
            </div>
        `;

        availableUsersList.appendChild(
            userElement
        );
    });
}

confirmAddMembersBtn.addEventListener(
    "click",
    async () => {

        const selectedCheckboxes =
            document.querySelectorAll(
                ".add-member-checkbox:checked"
            );

        if (!selectedCheckboxes.length) {
            addMembersError.textContent =
                "Select at least one user";

            return;
        }

        try {
            addMembersError.textContent = "";

            confirmAddMembersBtn.disabled =
                true;

            for (
                const checkbox
                of selectedCheckboxes
            ) {

                const userId =
                    Number(
                        checkbox.value
                    );

                const response =
                    await fetch(
                        `${API_BASE_URL}/groups/${currentGroupId}/members`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                Authorization:
                                    `Bearer ${token}`
                            },

                            body:
                                JSON.stringify({
                                    userId
                                })
                        }
                    );

                const data =
                    await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message ||
                        "Failed to add member"
                    );
                }
            }

            addMembersModal.classList.remove(
                "active"
            );

            await openGroupInfo(
                currentGroupId
            );

        } catch (error) {
            console.error(
                "Add members error:",
                error
            );

            addMembersError.textContent =
                error.message ||
                "Failed to add members";

        } finally {
            confirmAddMembersBtn.disabled =
                false;
        }
    }
);

leaveGroupBtn.addEventListener(
    "click",
    async () => {

        if (!currentGroupId) {
            return;
        }

        const groupIdToLeave =
            currentGroupId;

        const confirmed = confirm(
            "Are you sure you want to leave this group?"
        );

        if (!confirmed) {
            return;
        }

        try {
            leaveGroupBtn.disabled = true;

            const response = await fetch(
                `${API_BASE_URL}/groups/${groupIdToLeave}/members/me`,
                {
                    method: "DELETE",

                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Failed to leave group"
                );
            }

            // Leave Socket.IO room
            socket.emit(
                "leave_group",
                groupIdToLeave
            );

            // Close Group Info
            groupInfoModal.classList.remove(
                "active"
            );

            // Reset current chat
            currentGroupId = null;
            currentPersonalUserId = null;

            clearActiveChats();

            // Reload groups
            await loadGroups();

            // Clear messages
            chatMessages.innerHTML = "";

        } catch (error) {
            console.error(
                "Leave group error:",
                error
            );

            alert(
                error.message ||
                "Failed to leave group"
            );

        } finally {
            leaveGroupBtn.disabled = false;
        }
    }
);


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


        const otherUserId =
            senderId === loggedInUserId
                ? receiverId
                : senderId;


        // Update sidebar preview
        updatePersonalPreview(
            message
        );


        // Message belongs to the
        // currently open conversation
        if (
            otherUserId ===
            activePersonalUserId
        ) {

            addMessageToUI(message);

            scrollToBottom();

            return;
        }


        // Message belongs to another
        // personal conversation
        const userElement =
            document.querySelector(
                `.user-item[data-user-id="${otherUserId}"]`
            );

        if (userElement) {

            incrementPersonalUnreadCount(
                userElement
            );
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

socket.on("group_room_error", (data) => {
    console.error(
        "Group room error:",
        data.message
    );

    alert(
        data.message ||
        "Unable to join group"
    );
});

socket.on("group_message_error", (data) => {
    console.error(
        "Group message error:",
        data.message
    );

    alert(
        data.message ||
        "Unable to send message"
    );
});


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