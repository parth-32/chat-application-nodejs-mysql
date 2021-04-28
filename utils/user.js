const { json } = require("body-parser");
const pool = require("../config/db.config");

function userJoin(id, username, room) {
    return new Promise((resolve, reject) => {
        pool.query(
            "CALL userJoin(?,?,?)",
            [id, username, room],
            (err, rows) => {
                if (err) {
                    return reject(err);
                } else {
                    const user = { id, username, room };
                    // console.log(user)
                    return resolve(user);
                }
            }
        );
    });
}

function getUserDetailByName(name) {
    return new Promise((resolve, reject) => {
        pool.query("CALL getUserDetailByName(?)", [name], (err, rows) => {
            if (err) {
                return reject(err);
            } else {
                return resolve(rows[0]);
            }
        });
    });
}

function delete_Msg_db(id) {
    return new Promise((resolve, reject) => {
        pool.query(
            "UPDATE chat SET message='message was deleted',status=0 WHERE id IN (?)",
            [id],
            (err, rows) => {
                if (err) {
                    return reject(err);
                } else {
                    return resolve(rows);
                }
            }
        );
    });
}
function get_room_by_uid(id) {
    return new Promise((resolve, reject) => {
        pool.query("CALL get_room_by_uid(?)", [id], (err, rows) => {
            if (err) {
                return reject(err);
            } else {
                // console.log(rows[0][0])
                return resolve(rows[0]);
            }
        });
    });
}
function getCurrentUser(id) {
    return new Promise((resolve, reject) => {
        pool.query("CALL getCurrentUser(?)", [id], (err, rows) => {
            if (err) {
                return reject(err);
            } else {
                // console.log(rows[0][0])
                return resolve(rows[0][0]);
            }
        });
    });
}

function leaveRoom(name) {
    return new Promise((resolve, reject) => {
        // console.log("lid",id)
        pool.query("CALL getUserDetailByName(?)", [name], (err, rows) => {
            if (err) {
                return reject(err);
            } else {
                //console.log(rows[0])
                const data = rows[0];
                pool.query("CALL leaveRoom(?)", [name], (err, rows) => {
                    if (err) {
                        return reject(err);
                    } else {
                        return resolve({ data });
                    }
                });
            }
        });
    });
}

function roomUser(room) {
    return new Promise((resolve, reject) => {
        pool.query("CALL roomUser(?)", [room], (err, rows) => {
            if (err) {
                return reject(err);
            } else {
                return resolve(rows[0]);
            }
        });
    });
}

// const users = []
//join user to chat group
// function userJoin(id, username, room){
//     const user = { id, username, room }

//     users.push(user)

//     return user
// }

// function getCurrentUser(id){
//     return users.find(user => user.id == id)
// }

// function leaveRoom(id){
//     const index = users.findIndex(user => user.id == id)
//     if(index != -1){
//         return users.splice(index, 1)
//     }
// }

// function roomUser(room){
//     return users.filter(user => user.room == room)
// }

module.exports = {
    userJoin,
    getCurrentUser,
    leaveRoom,
    roomUser,
    getUserDetailByName,
    delete_Msg_db,
    get_room_by_uid,
};
