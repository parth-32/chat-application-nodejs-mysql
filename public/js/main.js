const socket = io();
const msgForm = document.getElementById("chat-form");
const chatMessage = document.querySelector(".chat-messages");
const roomName = document.getElementById("room-name");
const userList = document.getElementById("users");

//get username and room name from url using qs cdn
const { username, room } = Qs.parse(location.search, {
    ignoreQueryPrefix: true,
});

function sanitize(string) {
    const map = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#x27;",
        "/": "&#x2F;",
    };
    const reg = /[&<>"'/]/gi;
    return string.replace(reg, (match) => map[match]);
}

//join chatroom
socket.emit("joinRoom", {
    username: username[0].toUpperCase() + username.slice(1),
    room,
});

socket.on("roomUser", ({ room, users }) => {
    //console.log(room, users)
    outputRoom(room);
    outputUser(users);
});

//message form server
socket.on("message", (msg) => {
    //console.log(msg)
    if (username == msg.username) {
        var msg_data = {
            username: "You",
            time: msg.time,
            text: msg.text,
        };
        // console.log(msg.username)
        // console.log(msg_data.username)
        outputMessage(msg_data);
    } else {
        outputMessage(msg);
    }
    //scrolling
    chatMessage.scrollTop = chatMessage.scrollHeight;
});

// =========================== Send Message with sanitization ========================//

msgForm.addEventListener("keyup", (e) => {
    e.preventDefault();
    // console.log("event : ",e)

    var msg = document.getElementById("msg").value;

    if (msg.length > 0) {
        socket.emit("typing", {
            username: username[0].toUpperCase() + username.slice(1),
            room,
            length: msg.length,
        });
    }

    const keyCode = e.which || e.keyCode;

    // 13 represents the Enter key
    if (keyCode === 13 && !e.shiftKey) {
        //remove typing msg after enter
        socket.emit("typing", {
            username: username[0].toUpperCase() + username.slice(1),
            room,
            length: 0,
        });

        sendSanitizeMessgae(msg);
    }
});

msgForm.addEventListener("submit", (e) => {
    e.preventDefault();
    var msg = document.getElementById("msg").value;

    //remove typing msg after enter
    socket.emit("typing", {
        username: username[0].toUpperCase() + username.slice(1),
        room,
        length: 0,
    });

    sendSanitizeMessgae(msg);
});

function deleteMsg(id) {
    socket.emit("delete", id);
}

socket.on("delete_msg", async ({ message, id }) => {
    console.log(id);
    let div = await document.getElementById(id);
    if (div) {
        div.innerHTML =
            "<p class='text' style='color:gray;'><i>" + message + "</i></p>";
    }

    //chatMessage.scrollTop = chatMessage.scrollHeight
});

socket.on("isTyping", async ({ typer, length }) => {
    if (length > 1) {
        document.getElementById("typing").innerHTML = typer;
    } else {
        document.getElementById("typing").innerHTML = "";
    }
});

function sendSanitizeMessgae(msg) {
    // const sanitizeMsg = sanitize(msg)
    const sanitizeMsg = msg;
    //emit msg to server

    socket.emit("chatMessage", { sanitizeMsg, username });

    //clear input field
    document.getElementById("msg").value = "";
    document.getElementById("msg").focus();
}

// =================================  broadcast message  ===============================//
function outputMessage(msg) {
    const mainDiv = document.createElement("div");
    if (msg.username == "boat") {
        mainDiv.classList.add("message_boat");
        mainDiv.innerHTML = `
			<p class="text" style="font-weight:normal">${msg.text}</p>
		`;
        document.querySelector(".chat-messages").appendChild(mainDiv);
    } else if (msg.username == username[0].toUpperCase() + username.slice(1)) {
        mainDiv.classList.add("message_send");
        mainDiv.innerHTML = `
			<p class="meta">You <span>${msg.time}</span></p>
			<div id="${msg.last_id}">
				<p class="text">${sanitize(msg.text)}</p>
				<p class="action" ><button class="btn1" onClick="deleteMsg(${
                    msg.last_id
                })">delete</button></p>
			</div>
			`;
        document.querySelector(".chat-messages").appendChild(mainDiv);
    } else {
        mainDiv.classList.add("message_received");
        mainDiv.innerHTML = `
			<p class="meta">${msg.username} <span>${msg.time}</span></p>
			<p class="text" id="${msg.last_id}">${sanitize(msg.text)}</p>
		`;
        document.querySelector(".chat-messages").appendChild(mainDiv);
    }
}

// ============================== fetch msg from database ===============================//
$.ajax({
    url: "http://localhost:3000/api/fetch_allMsg/" + room,
    method: "GET",
    success: function (msg) {
        var DATE_DATA = JSON.parse(msg);
        //console.log(DATE_DATA)
        //data = data.msg
        const result = DATE_DATA.date.map((x) => {
            let rawData = DATE_DATA.msg.filter((y) => {
                if (x.total == y.total) {
                    return true;
                } else {
                    return false;
                }
            });

            let obj = { [x.total]: rawData };
            return obj;
        });

        // console.log(result)

        for (var a = 0; a < result.length; a++) {
            const mainDiv = document.createElement("div");
            mainDiv.classList.add("message_boat");
            var date_format = new Date(Object.keys(result[a]));

            mainDiv.innerHTML = `
				<p class="text" style="font-weight:normal"><center>${date_format.toDateString()}</center></p>
			`;
            document.querySelector(".chat-messages").appendChild(mainDiv);
            // console.log(result[a])
            for (var i = 0; i < Object.values(result[a])[0].length; i++) {
                let data = Object.values(result[a])[0][i];
                //  console.log("data",data)
                if (data.room == room) {
                    //console.log(data[i].user_name)
                    const mainDiv = document.createElement(`div`);
                    const msgData = sanitize(data.message);
                    //mainDiv.classList.add('message')

                    if (
                        data.user_name ==
                        username[0].toUpperCase() + username.slice(1)
                    ) {
                        mainDiv.classList.add("message_send");
                        if (data.status == 1) {
                            mainDiv.innerHTML = `
								<p class="meta" >You <span> ${data.date}</span></p>
								<div id="${data.id}">
									<p class="text" >${msgData}</p>
									<p class="action" ><button class="btn1" onClick="deleteMsg(${data.id})">delete</button></p>
								</div>
								`;
                        } else {
                            mainDiv.innerHTML = `
								<p class="meta" >You <span> ${data.date}</span></p>
								<p class="text" style="color:gray;" id="${data.id}"><i>${msgData}</i></p>
							`;
                        }
                        document
                            .querySelector(".chat-messages")
                            .appendChild(mainDiv);
                    } else {
                        mainDiv.classList.add("message_received");
                        if (data.status == 1) {
                            mainDiv.innerHTML = `
								<p class="meta" >${data.user_name} <span> ${data.date}</span></p>
								<p class="text" id="${data.id}">${msgData}</p>  
							`;
                        } else {
                            mainDiv.innerHTML = `
								<p class="meta" > ${data.user_name} <span> ${data.date}</span></p>
								<p class="text" style="color:gray;" id="${data.id}"><i>${msgData}</i></p>
							`;
                        }
                        document
                            .querySelector(".chat-messages")
                            .appendChild(mainDiv);
                    }
                }
            }
        }
    },
});
// ===========================================================================================//

function outputRoom(room) {
    roomName.innerHTML = room;
}

function outputUser(user) {
    //console.log(user)

    userList.innerHTML = user
        .map((user) => {
            if (
                user.username ===
                username[0].toUpperCase() + username.slice(1)
            ) {
                return "<li><b>" + user.username + " (You)</b></li>";
            } else {
                return "<li>" + user.username + "</li>";
            }
        })
        .join("");
}
