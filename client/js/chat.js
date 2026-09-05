const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user"));

if (!token) {
    window.location.href = "./login.html";
}

const socket = io("http://localhost:5000", {
    auth: {
        token: token
    }
});

socket.on("connect", () => {
    console.log("Connected to Socket.IO server:", socket.id);

    socket.emit("join_group", currentGroupId);
});

socket.on("disconnect", () => {
    console.log("Disconnected from Socket.IO server");
});

socket.on("connect_error", (error) => {
    console.error("Socket connection failed:", error.message);
});

let currentGroupId = 1;

const chatMessages = document.querySelector(".chat-messages");
const messageInput = document.querySelector(".chat-input input");
const sendButton = document.querySelector(".send-button");

const chatHeader = document.querySelector(".chat-header h2");
const groupItems = document.querySelectorAll(".group-item");



/* ========================================
   GROUP SELECTION
======================================== */

groupItems.forEach((group) => {
    group.addEventListener("click", () => {
        groupItems.forEach((item) => {
            item.classList.remove("active");
        });

        group.classList.add("active");

        const groupName =
            group.querySelector(".group-top h4").textContent;

        const groupId = group.dataset.groupId;

        const previousGroupId = currentGroupId;

        socket.emit(
            "leave_group",
            previousGroupId
        );

        currentGroupId = Number(groupId);

        socket.emit(
            "join_group",
            currentGroupId
        );

        chatHeader.textContent = groupName;

        loadMessages(currentGroupId);
    });
});


/* ========================================
   SEND MESSAGE
======================================== */

async function sendMessage() {
    const messageText = messageInput.value.trim();

    if (!messageText) {
        return;
    }

    try {
        const response = await fetch(
            `${API_BASE_URL}/messages`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },

                body: JSON.stringify({
                    groupId: currentGroupId,
                    content: messageText
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message);
        }

        console.log("Message saved:", data);

        addMessageToUI(data.data);

        messageInput.value = "";

        scrollToBottom();

        messageInput.focus();

    } catch (error) {
        console.error("Failed to send message:", error);

        alert("Failed to send message. Please try again.");
    }
}

function addMessageToUI(message) {
    const messageElement = document.createElement("div");

    const isOwnMessage =
        Number(message.senderId) === Number(user.id);

    messageElement.classList.add(
        "message",
        isOwnMessage ? "outgoing" : "incoming"
    );


    if (!isOwnMessage) {
        const avatar = document.createElement("div");

        avatar.classList.add("message-avatar");

        avatar.textContent =
            message.sender?.name?.charAt(0).toUpperCase() || "?";

        messageElement.appendChild(avatar);
    }


    const messageContent =
        document.createElement("div");

    messageContent.classList.add("message-content");


    if (!isOwnMessage) {
        const senderName =
            document.createElement("div");

        senderName.classList.add("message-sender");

        senderName.textContent =
            message.sender?.name || "Unknown User";

        messageContent.appendChild(senderName);
    }


    const messageBubble =
        document.createElement("div");

    messageBubble.classList.add("message-bubble");

    messageBubble.textContent =
        message.content;


    const messageMeta =
        document.createElement("div");

    messageMeta.classList.add("message-meta");

    const date =
        new Date(message.createdAt);

    messageMeta.textContent =
        date.toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit"
        });


    messageContent.appendChild(messageBubble);
    messageContent.appendChild(messageMeta);

    messageElement.appendChild(messageContent);

    chatMessages.appendChild(messageElement);
}

async function loadMessages(groupId) {
    try {
        const response = await fetch(
            `${API_BASE_URL}/messages/${groupId}`,
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
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
        console.error("Failed to load messages:", error);

        alert("Failed to load messages.");
    }
}


/* ========================================
   GET CURRENT TIME
======================================== */

function getCurrentTime() {

    const now = new Date();

    return now.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit"
    });
}


/* ========================================
   AUTO SCROLL
======================================== */

function scrollToBottom() {

    chatMessages.scrollTop =
        chatMessages.scrollHeight;
}


/* ========================================
   SEND BUTTON
======================================== */

sendButton.addEventListener(
    "click",
    sendMessage
);


/* ========================================
   ENTER KEY
======================================== */

messageInput.addEventListener(
    "keydown",
    (event) => {

        if (event.key === "Enter") {

            event.preventDefault();

            sendMessage();
        }

    }
);

loadMessages(currentGroupId);