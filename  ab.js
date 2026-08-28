// LocalStorage Database Keys
const DB_USERS = 'hb_users';
const DB_POSTS = 'hb_posts';
const DB_MESSAGES = 'hb_messages';
const DB_FOLLOWS = 'hb_follows'; // { "userA": ["userB", "userC"] }
const DB_SESSION = 'hb_session';

let currentUser = localStorage.getItem(DB_SESSION) || '';
let activeChatReceiver = '';

// App Initialization
window.onload = () => {
    if (currentUser) {
        showApp();
    }
};

// ----------------- AUTH LOGIC -----------------
function loginUser() {
    const u = document.getElementById('authUsername').value.trim();
    const p = document.getElementById('authPassword').value.trim();

    if (!u || !p) return showError('दोनों फ़ील्ड भरें!');

    const users = JSON.parse(localStorage.getItem(DB_USERS)) || {};
    if (users[u] && users[u] === p) {
        currentUser = u;
        localStorage.setItem(DB_SESSION, currentUser);
        showApp();
    } else {
        showError('गलत Username या Password!');
    }
}

function registerUser() {
    const u = document.getElementById('authUsername').value.trim();
    const p = document.getElementById('authPassword').value.trim();

    if (!u || !p) return showError('दोनों फ़ील्ड भरें!');

    const users = JSON.parse(localStorage.getItem(DB_USERS)) || {};
    if (users[u]) {
        showError('यह Username पहले से लिया गया है!');
        return;
    }

    users[u] = p;
    localStorage.setItem(DB_USERS, JSON.stringify(users));
    currentUser = u;
    localStorage.setItem(DB_SESSION, currentUser);
    showApp();
}

function logout() {
    localStorage.removeItem(DB_SESSION);
    currentUser = '';
    document.getElementById('appSection').classList.add('hidden');
    document.getElementById('authSection').classList.remove('hidden');
}

function showError(msg) {
    const err = document.getElementById('authError');
    err.innerText = msg;
    err.classList.remove('hidden');
}

function showApp() {
    document.getElementById('authSection').classList.add('hidden');
    document.getElementById('appSection').classList.remove('hidden');
    renderPosts();
}

function previewMediaName() {
    const fileInput = document.getElementById('mediaInput');
    const display = document.getElementById('fileNameDisplay');
    if (fileInput.files.length > 0) {
        display.innerText = fileInput.files[0].name;
    } else {
        display.innerText = '';
    }
}

// ----------------- TABS & NAVIGATION -----------------
function switchTab(tab) {
    const feedView = document.getElementById('feedView');
    const usersView = document.getElementById('usersView');
    const chatView = document.getElementById('chatView');

    const navFeed = document.getElementById('navFeed');
    const navUsers = document.getElementById('navUsers');
    const navChat = document.getElementById('navChat');

    feedView.classList.add('hidden');
    usersView.classList.add('hidden');
    chatView.classList.add('hidden');

    navFeed.classList.remove('active-nav');
    navUsers.classList.remove('active-nav');
    navChat.classList.remove('active-nav');

    if (tab === 'feed') {
        feedView.classList.remove('hidden');
        navFeed.classList.add('active-nav');
        renderPosts();
    } else if (tab === 'users') {
        usersView.classList.remove('hidden');
        navUsers.classList.add('active-nav');
        renderAllUsers();
    } else {
        chatView.classList.remove('hidden');
        navChat.classList.add('active-nav');
        renderFriendsList();
    }
}

// ----------------- FOLLOW / UNFOLLOW LOGIC -----------------
function toggleFollow(targetUser) {
    let follows = JSON.parse(localStorage.getItem(DB_FOLLOWS)) || {};
    if (!follows[currentUser]) follows[currentUser] = [];

    const index = follows[currentUser].indexOf(targetUser);
    if (index === -1) {
        follows[currentUser].push(targetUser);
    } else {
        follows[currentUser].splice(index, 1);
    }

    localStorage.setItem(DB_FOLLOWS, JSON.stringify(follows));
    renderAllUsers();
}

function renderAllUsers() {
    const users = JSON.parse(localStorage.getItem(DB_USERS)) || {};
    const follows = JSON.parse(localStorage.getItem(DB_FOLLOWS)) || {};
    const myFollowing = follows[currentUser] || [];

    const container = document.getElementById('allUsersContainer');
    container.innerHTML = '';

    const otherUsers = Object.keys(users).filter(u => u !== currentUser);

    if (otherUsers.length === 0) {
        container.innerHTML = `<p style="color:#65676b;">No other users on the app yet.</p>`;
        return;
    }

    otherUsers.forEach(u => {
        const isFollowing = myFollowing.includes(u);
        const div = document.createElement('div');
        div.className = 'user-list-item';
        div.innerHTML = `
            <span><b>👤 @${u}</b></span>
            <button onclick="toggleFollow('${u}')" class="btn-follow ${isFollowing ? 'following' : ''}">
                ${isFollowing ? '✔ Following' : '+ Follow'}
            </button>
        `;
        container.appendChild(div);
    });
}

// ----------------- POSTS SYSTEM -----------------
function createPost() {
    const text = document.getElementById('postInput').value.trim();
    const fileInput = document.getElementById('mediaInput');
    const file = fileInput.files[0];

    if (!text && !file) return alert('कुछ टेक्स्ट लिखें या फोटो/वीडियो सेलेक्ट करें!');

    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const mediaData = e.target.result;
            const mediaType = file.type.startsWith('video') ? 'video' : 'image';
            savePostToStorage(text, mediaData, mediaType);
        };
        reader.readAsDataURL(file);
    } else {
        savePostToStorage(text, null, null);
    }
}

function savePostToStorage(text, mediaData, mediaType) {
    const posts = JSON.parse(localStorage.getItem(DB_POSTS)) || [];
    posts.unshift({
        id: Date.now(),
        author: currentUser,
        content: text,
        mediaData: mediaData,
        mediaType: mediaType,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        likes: [],
        comments: []
    });

    localStorage.setItem(DB_POSTS, JSON.stringify(posts));
    document.getElementById('postInput').value = '';
    document.getElementById('mediaInput').value = '';
    document.getElementById('fileNameDisplay').innerText = '';
    renderPosts();
}

function toggleLike(postId) {
    let posts = JSON.parse(localStorage.getItem(DB_POSTS)) || [];
    posts = posts.map(p => {
        if (p.id === postId) {
            const idx = p.likes.indexOf(currentUser);
            if (idx === -1) p.likes.push(currentUser);
            else p.likes.splice(idx, 1);
        }
        return p;
    });
    localStorage.setItem(DB_POSTS, JSON.stringify(posts));
    renderPosts();
}

function addComment(postId) {
    const input = document.getElementById(`comment-input-${postId}`);
    const text = input.value.trim();
    if (!text) return;

    let posts = JSON.parse(localStorage.getItem(DB_POSTS)) || [];
    posts = posts.map(p => {
        if (p.id === postId) {
            p.comments.push({ author: currentUser, text: text });
        }
        return p;
    });

    localStorage.setItem(DB_POSTS, JSON.stringify(posts));
    renderPosts();
}

function renderPosts() {
    const posts = JSON.parse(localStorage.getItem(DB_POSTS)) || [];
    const container = document.getElementById('postsContainer');
    container.innerHTML = '';

    if (posts.length === 0) {
        container.innerHTML = `<div class="card" style="text-align:center; color:#65676b;">No posts yet. Write something above!</div>`;
        return;
    }

    posts.forEach(p => {
        const isLiked = p.likes.includes(currentUser);
        let commentsHTML = p.comments.map(c => `
            <div class="comment-item"><b>@${c.author}:</b> ${c.text}</div>
        `).join('');

        let mediaHTML = '';
        if (p.mediaData) {
            if (p.mediaType === 'image') {
                mediaHTML = `<img src="${p.mediaData}" class="post-media-img">`;
            } else if (p.mediaType === 'video') {
                mediaHTML = `<video src="${p.mediaData}" controls class="post-media-video"></video>`;
            }
        }

        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="post-author">@${p.author}</div>
            <div class="post-time">${p.timestamp}</div>
            ${p.content ? `<div class="post-content">${p.content}</div>` : ''}
            ${mediaHTML}
            
            <div class="post-actions">
                <button onclick="toggleLike(${p.id})" class="btn-like ${isLiked ? 'liked' : ''}">
                    👍 Like (${p.likes.length})
                </button>
                <span style="font-size:13px; color:#65676b;">💬 ${p.comments.length} Comments</span>
            </div>

            <div class="comments-section">
                ${commentsHTML}
                <div class="comment-form">
                    <input type="text" id="comment-input-${p.id}" placeholder="Write a comment...">
                    <button onclick="addComment(${p.id})" class="btn-reply">Reply</button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

// ----------------- CHAT SYSTEM (FOLLOWERS / FRIENDS ONLY) -----------------
function renderFriendsList() {
    const follows = JSON.parse(localStorage.getItem(DB_FOLLOWS)) || {};
    const container = document.getElementById('friendsContainer');
    container.innerHTML = '';

    // Logged in user system
    const myFollowing = follows[currentUser] || [];
    
    // Check who follows currentUser
    const myFollowers = [];
    Object.keys(follows).forEach(user => {
        if (follows[user].includes(currentUser)) {
            myFollowers.push(user);
        }
    });

    // Combine following and followers (Unique List)
    const allowedChatUsers = [...new Set([...myFollowing, ...myFollowers])];

    if (allowedChatUsers.length === 0) {
        container.innerHTML = `<p style="color:#65676b; text-align:center;">आप केवल उन्हीं से बात कर सकते हैं जो आपको Follow करते हैं या जिन्हें आप Follow करते हैं।<br><br><b>'👥 Friends'</b> टैब में जाकर किसी को Follow करें!</p>`;
        return;
    }

    allowedChatUsers.forEach(u => {
        const div = document.createElement('div');
        div.className = 'user-list-item';
        div.innerHTML = `
            <span><b>👤 @${u}</b></span>
            <button onclick="openChat('${u}')" class="btn-chat">Chat</button>
        `;
        container.appendChild(div);
    });
}

function openChat(receiver) {
    activeChatReceiver = receiver;
    document.getElementById('userListCard').classList.add('hidden');
    document.getElementById('activeChatCard').classList.remove('hidden');
    document.getElementById('chatWithTitle').innerText = `Chat with @${receiver}`;
    renderMessages();
}

function closeChat() {
    activeChatReceiver = '';
    document.getElementById('activeChatCard').classList.add('hidden');
    document.getElementById('userListCard').classList.remove('hidden');
}

function sendMessage() {
    const input = document.getElementById('chatInput');
    const msg = input.value.trim();
    if (!msg || !activeChatReceiver) return;

    const messages = JSON.parse(localStorage.getItem(DB_MESSAGES)) || [];
    messages.push({
        sender: currentUser,
        receiver: activeChatReceiver,
        text: msg
    });

    localStorage.setItem(DB_MESSAGES, JSON.stringify(messages));
    input.value = '';
    renderMessages();
}

function renderMessages() {
    const messages = JSON.parse(localStorage.getItem(DB_MESSAGES)) || [];
    const chatBox = document.getElementById('chatBox');
    chatBox.innerHTML = '';

    const relevantMsgs = messages.filter(m => 
        (m.sender === currentUser && m.receiver === activeChatReceiver) ||
        (m.sender === activeChatReceiver && m.receiver === currentUser)
    );

    if (relevantMsgs.length === 0) {
        chatBox.innerHTML = `<div style="text-align:center; color:#65676b; margin:auto;">No messages yet. Say Hi! 👋</div>`;
    } else {
        relevantMsgs.forEach(m => {
            const isMine = m.sender === currentUser;
            const msgDiv = document.createElement('div');
            msgDiv.className = `msg ${isMine ? 'sent' : 'received'}`;
            msgDiv.innerText = m.text;
            chatBox.appendChild(msgDiv);
        });
    }

    chatBox.scrollTop = chatBox.scrollHeight;
}