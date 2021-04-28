const router = require("express").Router();
const pool = require("../config/db.config");

router.get("/fetch_allMsg/:room", (req, res) => {
    pool.query("CALL fetch_allMsg(?)", [req.params.room], (err, rows) => {
        if (err) {
            console.log(err);
        } else {
            const msg = rows[0];
            pool.query(
                "CALL fetch_date_vise(?)",
                [req.params.room],
                (err, rows) => {
                    if (err) {
                        console.log(err);
                    } else {
                        const data = { date: rows[0], msg };
                        res.end(JSON.stringify(data));
                    }
                }
            );
        }
    });
});

router.post("/user", async (req, res) => {
    try {
        const results = await checkUser(req.body);
        const err = results[0][0].err;
        const success = results[0][0].success;
        if (err) {
            return res.json({ success: 0, message: err });
        }
        if (success) {
            return res.json({ success: 1, message: success });
        }
    } catch (e) {
        return res.json({ error: e.message, stack: e.stack });
    }
});

router.get("/user/:del_id", async (req, res) => {
    try {
        const results = await deleteMsg(req.params.del_id);
        console.log(results[0]);
        return res.json({
            success: 1,
            message: "Message Deleted Successfully",
        });
    } catch (e) {
        return res.json({ error: e.message, stack: e.stack });
    }
});

router.post("/user/register", async (req, res) => {
    try {
        const results = await registerUser(req.body);
        if (results.affectedRows == 0) {
            return res.json({ success: 0, message: "Try Again" });
        }
        if (results[0][0].err == "fail") {
            return res.json({ success: 0, message: "User already exists" });
        }
        return res.json({ success: 1, message: "register completed" });
    } catch (e) {
        return res.json({ error: e.message, stack: e.stack });
    }
});

function checkUser(data) {
    return new Promise((resolve, reject) => {
        pool.query(
            "CALL checkUser(?,?)",
            [data.username, data.room],
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

function deleteMsg(id) {
    return new Promise((resolve, reject) => {
        pool.query("CALL deleteMsg(?)", [id], (err, rows) => {
            if (err) {
                return reject(err);
            } else {
                return resolve(rows);
            }
        });
    });
}

function registerUser(data) {
    return new Promise((resolve, reject) => {
        pool.query(
            "CALL registerUser(?,?,?)",
            [data.username, data.phone, data.password],
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

module.exports = router;
