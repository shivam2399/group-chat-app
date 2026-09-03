const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user"));

if (!token) {
    window.location.href = "./login.html";
}

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

        const groupId =
            group.dataset.groupId;

        currentGroupId = Number(groupId);

        chatHeader.textContent = groupName;
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

    messageElement.classList.add("message", "outgoing");

    const messageContent = document.createElement("div");

    messageContent.classList.add("message-content");

    const messageBubble = document.createElement("div");

    messageBubble.classList.add("message-bubble");

    messageBubble.textContent = message.content;

    const messageMeta = document.createElement("div");

    messageMeta.classList.add("message-meta");

    const date = new Date(message.createdAt);

    messageMeta.textContent = date.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit"
    });

    messageContent.appendChild(messageBubble);
    messageContent.appendChild(messageMeta);

    messageElement.appendChild(messageContent);

    chatMessages.appendChild(messageElement);
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