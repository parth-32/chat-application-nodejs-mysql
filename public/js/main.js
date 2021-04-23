const socket  = io()
const msgForm = document.getElementById('chat-form')
const chatMessage = document.querySelector('.chat-messages')
const roomName = document.getElementById('room-name')
const userList = document.getElementById('users')

//get username and room name from url using qs cdn
const { username, room } = Qs.parse(location.search ,{
    ignoreQueryPrefix: true
})

function sanitize(string) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        "/": '&#x2F;',
    };
    const reg = /[&<>"'/]/ig;
    return string.replace(reg, (match)=>(map[match]));
}

//join chatroom
socket.emit('joinRoom', { username : username[0].toUpperCase() + username.slice(1), room })

socket.on('roomUser', ({room, users})=> {
    console.log(room, users)
    outputRoom(room)
    outputUser(users)
})

//message form server
socket.on('message', (msg) =>{
    
    if(username == msg.username){
        var msg_data ={
            username: "You",
            time: msg.time,
            text: msg.text
        }
        // console.log(msg.username)
        // console.log(msg_data.username)
        outputMessage(msg_data)
    }else{
        outputMessage(msg)
    }
    //scrolling
    chatMessage.scrollTop = chatMessage.scrollHeight
})


// =========================== Send Message with sanitization ========================//

msgForm.addEventListener('keyup', (e)=>{
    e.preventDefault()
    // console.log("event : ",e)

    var msg = document.getElementById('msg').value
    const keyCode = e.which || e.keyCode;
    // 13 represents the Enter key
    if (keyCode === 13 && !e.shiftKey) {
        console.log(msg)
        sendSanitizeMessgae(msg)
    } 
})
msgForm.addEventListener('submit', (e)=>{
    e.preventDefault()
    var msg = document.getElementById('msg').value
    sendSanitizeMessgae(msg)
})

function sendSanitizeMessgae(msg){
    const sanitizeMsg = sanitize(msg)
    //emit msg to server
    socket.emit('chatMessage', {sanitizeMsg, username})

    //clear input field
    document.getElementById('msg').value = ''
    document.getElementById('msg').focus()
}


// =================================  broadcast message  ===============================//
function outputMessage(msg){
    const mainDiv = document.createElement('div')
    mainDiv.classList.add('message')
    mainDiv.innerHTML = `
        <p class="meta">${msg.username} <span>${msg.time}</span></p>
        <pre class="text">${msg.text}</pre>
    `
    document.querySelector('.chat-messages').appendChild(mainDiv)
}

// ============================== fetch msg from database ===============================//
$.ajax({
    url : "http://localhost:3000/fetch_allMsg",
    method : "GET",
    success : function(msg) {
        var data = JSON.parse(msg)
        //console.log(data)
                
        for(var a=0; a < data.length; a++) {
            if(data[a].room == room) {
                //console.log(data[a].user_name)
                const mainDiv = document.createElement('div')

                mainDiv.classList.add('message')
                mainDiv.innerHTML = `
                    <p class="meta" style:"padding-left:5px">${data[a].user_name} <span> ${data[a].date}</span></p>
                    <pre class="text">${data[a].message}</pre>
                    <p class="action" hidden>${data[a].id}</p>
                `
                document.querySelector('.chat-messages').appendChild(mainDiv)
            }
        }
    }
})
// ===========================================================================================//

function outputRoom(room){
    roomName.innerHTML = room
}

function outputUser(user){
    //console.log(user)
    
    userList.innerHTML = (user.map(user => {
        if(user.username === username[0].toUpperCase() + username.slice(1)){
            return '<li><b>'+ user.username +' (You)</b></li>'
        }else{
            return '<li>'+ user.username +'</li>'
        }
    })).join('')
}


// msgForm.addEventListener('keyup', (e)=>{
//     e.preventDefault()
//     console.log("event : ",e)
//     // var msg = e.target.elements.msg.value
//     var msg = document.getElementById('msg').value
//     if(e.key == 'Enter'){
//         console.log(msg)
    
//         // msg = msg.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;').replace(/>/g, '&gt');
//         msg = sanitize(msg)
//         //emit msg to server
//         socket.emit('chatMessage', msg)

//         //clear input field
//         document.getElementById('msg').value = ''
//         document.getElementById('msg').focus()
//     } 
// })
