const router = require('express').Router();
const pool = require('../config/db.config')

router.post('/user', async (req, res) => {
    try{    
        //console.log(req.body)
        const results = await checkUser(req.body)
        const err = results[0][0].err
        const success = results[0][0].success
        if(err){
            return res.json({ success:0, message:err})
        }
        if(success){
            return res.json({ success:1, message:success }) 
        }  
    }catch(e){
        return res.json({error : e.message, stack : e.stack})
    }
})

router.post('/user/register', async (req, res)=>{
    try{
        const results = await registerUser(req.body)
        if(results.affectedRows == 0){
            return res.json({success:0, message : "Try Again"})
        }
        if(results[0][0].err == "fail"){
            return res.json({success:0, message : "User already exists"})
        }
        return res.json({success:1, message : "register completed"})

    }catch(e){
        return res.json({error : e.message, stack : e.stack})
    }
})

function checkUser(data){
    return new Promise((resolve, reject) =>{
        pool.query('CALL checkUser(?,?)', [data.username, data.room], (err, rows) =>{
            if(err){
                return reject(err)
            }else{
                return resolve(rows)
            }
        })
    })
}

function registerUser(data){
    return new Promise((resolve, reject) =>{
        pool.query('CALL registerUser(?,?,?)',[data.username, data.phone, data.password], (err, rows) =>{
            if(err){
                return reject(err)
            }else{
                return resolve(rows)
            }
        })
    })
}

module.exports = router