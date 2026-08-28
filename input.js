{
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
