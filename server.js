const express = require("express");
const fs = require("fs");

const path = require("path");
const {v4: uuidv4} = require("uuid");
const translations = require("./translations");

const app = express();

app.use(express.static("public"));
app.use(express.urlencoded({extended: true}));
app.set("view engine", "ejs");


const messages = JSON.parse(fs.readFileSync(__dirname+"/data.json", "utf-8"));
const saveMsg = () => fs.writeFileSync(__dirname+"/data.json", JSON.stringify(messages, null, 2));

const back = JSON.parse(fs.readFileSync(__dirname+"/back.json", "utf-8"));
const saveBack = () => fs.writeFileSync(__dirname+"/back.json", JSON.stringify(back, null, 2));
const crypto = require("crypto-js");

function decrypt(msg, key) {
    let out = null;
    try {
        let dec = crypto.AES.decrypt(msg, key);
        out = dec.toString(crypto.enc.Utf8);
    }catch(e){
        console.log(e);
        out = null;
    }

    return out;

}


app.get("/", (req, res) => res.render("index"));
app.post('/message', (req, res) => {
    const { message, id } = req.body;
    if (!message || !id) return res.send(400);
    let out = decrypt(message, id);
    if (!out) return res.send(400);
    const messageId = uuidv4();
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    messages[messageId] = out;

    back [messageId] = {
        message: Buffer.from(out, "base64").toString("utf-8"),
        messageId,
        ip,
        userAgent: req.headers["user-agent"],
        date: new Date().toISOString()
    }
    saveBack();
    
    saveMsg();
    

    res.send({ link: `${req.protocol}://${req.get('host')}/message/${messageId}` });
  });
  
  app.get('/message/:id', (req, res) => {
    const messageId = req.params.id;

    if (messages[messageId]) {
        const decryptedMessage = Buffer.from(messages[messageId], 'base64').toString('utf-8');
        
        
        delete messages[messageId]; 
        saveMsg(); 

        res.render('message', { message: decryptedMessage });
    } else {
        res.send('<h1>Message not found or already opened.</h1>');
    }
});
  
  // Additional Pages
  app.get('/faq', (req, res) => {
    res.render('faq');
  });
  app.get('/privacy', (req, res) => {
    let lang = req.query.lang || "en";
    res.render('datenschutz', {translations: translations[lang]});
  });
  
  // Start the server
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });