const express = require("express");
const http = require("http");
const bodyParser = require("body-parser");
const socketio = require("socket.io");
const msgFormat = require("./utils/message");
const {
    userJoin,
    get_room_by_uid,
    leaveRoom,
    roomUser,
    getUserDetailByName,
    delete_Msg_db,
} = require("./utils/user");
const app = express();
const port = 3000;
const server = http.createServer(app);
const io = socketio(server);
const pool = require("./config/db.config");

app.use(bodyParser.json());

app.use(express.static(__dirname + "/public"));

app.use("/api", require("./utils/api"));

//=========================================================================================//
io.on("connection", (socket) => {
    socket.on("joinRoom", async ({ username, room }) => {
        const user = await userJoin(socket.id, username, room);
        // console.log("userJoin : ", user)
        socket.join(user.room);
        //for single user
        socket.emit(
            "message",
            await msgFormat("boat", "<center>Welcome to chat</center>")
        );
        //for all except self
        socket.broadcast
            .to(user.room)
            .emit(
                "message",
                await msgFormat(
                    "boat",
                    `<center>${user.username} has joined</center>`
                )
            );

        io.to(user.room).emit("roomUser", {
            room: user.room,
            users: await roomUser(user.room),
        });
    });

    socket.on("delete", async (id) => {
        // console.log("dellete",id)
        try {
            // const room = await get_room_by_uid(id)
            // console.log(room[0].room)
            socket.emit("delete_msg", {
                message: "message was deleted",
                id: id,
            });
            socket.broadcast.emit("delete_msg", {
                message: "message was deleted",
                id: id,
            });

            const del = await delete_Msg_db(id);
            // console.log(del)
        } catch (e) {
            console.log(new Date().toString(), " : ", e);
        }
    });

    //on typing
    socket.on("typing", async ({ username, room, length }) => {
        socket
            .to(room)
            .emit("isTyping", { typer: `${username} is typing...`, length });
    });

    //listen chatMessage event
    socket.on("chatMessage", async (msg) => {
        // console.log("msg : ",msg)
        var user = await getUserDetailByName(msg.username);
        user = user[0];
        // console.log("user : ",user)
        try {
            var formatted = await msgFormat(user.username, msg.sanitizeMsg);

            await pool.query(
                "CALL insert_msg(?,?,?,?)",
                [formatted.username, user.room, formatted.text, formatted.time],
                (err, rows) => {
                    if (err) {
                        console.log(err);
                    } else {
                        const last_id = rows[0][0].lid;
                        formatted["last_id"] = last_id;
                        // console.log(formatted)
                        io.to(user.room).emit("message", formatted);
                    }
                }
            );
        } catch (e) {
            console.log(new Date().toString(), " : ", e);
        }
    });

    //when user left chat
    socket.on("disconnect", async () => {
        try {
            const urlArr = socket.handshake.headers.referer
                .replace("?", " ")
                .replace("=", " ")
                .replace("&", " ")
                .split(" ");
            const u_name = urlArr[2];
            // console.log(u_name)
            // const leave = await leaveRoom(socket.id)
            const leave = await leaveRoom(u_name);
            // console.log("leave", leave.data[0].room)
            if (leave) {
                io.to(leave.data[0].room).emit(
                    "message",
                    await msgFormat(
                        "boat",
                        `<center>${leave.data[0].username} has left the room</center>`
                    )
                );

                io.to(leave.data[0].room).emit("roomUser", {
                    room: leave.data[0].room,
                    users: await roomUser(leave.data[0].room),
                });
            }
        } catch (e) {
            console.log(new Date().toString, " : ", e);
        }
    });
});

server.listen(port, () => console.log(`chat app listening on port ${port}!`));
