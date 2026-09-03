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

        // Remove active state from all groups
        groupItems.forEach((item) => {
            item.classList.remove("active");
        });

        // Add active state to clicked group
        group.classList.add("active");

        // Get group name
        const groupName =
            group.querySelector(".group-top h4").textContent;

        // Update chat header
        chatHeader.textContent = groupName;

    });

});


/* ========================================
   SEND MESSAGE
======================================== */

function sendMessage() {

    const messageText = messageInput.value.trim();

    // Don't send empty messages
    if (!messageText) {
        return;
    }


    // Create message container
    const message = document.createElement("div");

    message.classList.add(
        "message",
        "outgoing"
    );


    // Create message content
    const messageContent =
        document.createElement("div");

    messageContent.classList.add(
        "message-content"
    );


    // Create message bubble
    const messageBubble =
        document.createElement("div");

    messageBubble.classList.add(
        "message-bubble"
    );

    messageBubble.textContent = messageText;


    // Create timestamp
    const messageMeta =
        document.createElement("div");

    messageMeta.classList.add(
        "message-meta"
    );

    messageMeta.textContent =
        getCurrentTime();


    // Build message
    messageContent.appendChild(messageBubble);
    messageContent.appendChild(messageMeta);

    message.appendChild(messageContent);

    chatMessages.appendChild(message);


    // Clear input
    messageInput.value = "";

    // Scroll to bottom
    scrollToBottom();

    // Put cursor back in input
    messageInput.focus();
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