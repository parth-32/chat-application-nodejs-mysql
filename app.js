const express = require('express')
const http = require('http')
const bodyParser = require('body-parser')
const socketio = require('socket.io')
const msgFormat = require('./utils/message')
const { userJoin, getCurrentUser, leaveRoom, roomUser,getUserDetailByName } = require('./utils/user')
const app = express()
const port = 3000
const server = http.createServer(app)
const io = socketio(server)
const pool = require('./config/db.config')

app.use(bodyParser.json()); 

app.use(express.static(__dirname+'/public'))
app.get('/fetch_allMsg', (req, res) =>{
    pool.query('CALL fetch_allMsg()', (err, rows) => {
        if (err) { 
            console.log(err) 
        }else{ 
            res.end(JSON.stringify(rows[0])) 
        }
    })
})

app.use('/api', require('./utils/api'))

//=========================================================================================//
io.on('connection', socket=>{

    socket.on('joinRoom', async ({username, room})=>{

        const user = await userJoin(socket.id,username,room)
        // console.log("userJoin : ", user)
        socket.join(user.room)
        //for single user
        socket.emit('message' , await msgFormat('boat','<center><b>Welcome to chat</b></center>'))
        //for all except self
        socket.broadcast.to(user.room).emit('message' ,await msgFormat('boat', `<center><b>${user.username} has joined</b></center>`))

        io.to(user.room).emit('roomUser', {
            room : user.room,
            users : await roomUser(user.room)
        })
    })

    //listen chatMessage event
    socket.on('chatMessage', async (msg)=>{
        // console.log("msg : ",msg)
        var user = await getUserDetailByName(msg.username)
        user = user[0]
        // console.log("user : ",user)
        try{
            const formatted = await msgFormat(user.username, msg.sanitizeMsg)
            
            io.to(user.room).emit('message',formatted)

            await pool.query('CALL insert_msg(?,?,?,?)',[formatted.username, user.room, formatted.text, formatted.time],(err, rows) =>{
                if(err) console.log(err)
            })
        }catch(e){
            console.log(new Date().toString()," : ",e)
        }
    })

    //when user left chat
    socket.on('disconnect',async ()=>{
        try{
            const urlArr = (socket.handshake.headers.referer).replace("?",' ').replace("=",' ').replace("&",' ').split(' ')
            const u_name = urlArr[2]
            // console.log(u_name)
            // const leave = await leaveRoom(socket.id)
            const leave = await leaveRoom(u_name)
            // console.log("leave", leave.data[0].room)
            if(leave){
                io.to(leave.data[0].room).emit('message', await msgFormat('boat',`<center><b>${leave.data[0].username} has left the room</b></center>`))

                io.to(leave.data[0].room).emit('roomUser', {
                    room : leave.data[0].room,
                    users : await roomUser(leave.data[0].room)
                })
            }
        }catch(e){
            console.log(new Date().toString, " : ",e)
        }
    })
})

server.listen(port, () => console.log(`chat app listening on port ${port}!`))