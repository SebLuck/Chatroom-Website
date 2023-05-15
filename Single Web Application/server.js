//Import the express, body-parser, and express-session modules.
const express = require('express');
const bodyParser = require('body-parser');
const expressSession = require('express-session');
//Import the mysql module.
const mysql = require('mysql');
//Create express app and configure it with body-parser.
const app = express();
app.use(bodyParser.json());
// http with express
const http = require("http").createServer(app);
// create socket with http
const io = require("socket.io") (http, {
    cors: {
        origin: "http://localhost:8080",
        methods: ["GET", "POST"],
        transports: ['websocket', 'polling'],
        credentials: true
    },
    allowEIO3: true
});


//Import the file upload module.
//Configure Express to use the file upload module.
const fileUpload = require("express-fileupload");
app.use(fileUpload());


//Set up express to serve static files from the directory called 'public'
app.use(express.static('public'));
//Create a connection pool with the user's details.
const connectionPool = mysql.createPool({
    connectionLimit: 1,
    host: "localhost",
    user: "Seb",
    password: "****",
    database: "chatroom",
    port: 8111,
    debug: false
});

//Configure express to use express-session.
app.use(
    expressSession({
        secret: '123Chat',
        cookie: { maxAge: 60000 },
        resave: false,
        saveUninitialized: true
    })
);



//Set up an application to handle POST requests.
app.post('/login', login);//Logs the user in
app.post('/register', registers);//Register a new user


function registers(request, response){

    let userNew = request.body;



    let sqlSelect = "SELECT * FROM user";
    connectionPool.query(sqlSelect, (err, result) => {
        if (err){//Check for errors
            console.error("Error executing query: " + JSON.stringify(err));
        }

        else{
                let registerUser = result;
                // Make sure that the user uses a different username from the other users.
                for(let c = 0; c < Object.keys(registerUser).length; c++){
                    if(registerUser[c].username === userNew.username){
                        return response.status(500).send("Username already taken"); 
                    }
                }
                //Build query
                let sql1 = "INSERT INTO user (user_id, username, password, imagename) " + 
                `VALUES (${Object.keys(registerUser).length + 1}, '${userNew.username}', '${userNew.password}', ` +
                `'default.png')`;
                //Execute query and output results
                connectionPool.query(sql1, (error, res) => {
                    if (error){//Check for errors
                        console.error("Error executing query: " + JSON.stringify(error));
                    }
                    else{
                        //Finish off the interaction.
                        response.send('{"registration":true, "username": "' +
                        userNew.username + '" }');
                        console.log(JSON.stringify(res));       
                    }
                });

        }
    });
  
}


function login(request, response){
    let userlogin = request.body;
    let sql2 = "SELECT * FROM user";
    //Execute query and output results
    connectionPool.query(sql2, (err, result) => {
        if (err){//Check for errors
            console.error("Error executing query: " + JSON.stringify(err));
        }
        else{//Output results in JSON format - a web service would return this string.
            
            let loginUser = result;
            //Look to see if we have a matching user
            let userfound = false;
            for(let c = 0; c < Object.keys(loginUser).length; c++){
                if(loginUser[c].username === userlogin.username && loginUser[c].password === userlogin.password){//Found matching user
                    //Store details of logged in user
    
                    request.session.username = loginUser.username;
                    userfound = true;
                    break; 
                }

            }
            // This if statement will allow the user to access the roomchat if its username and password are correct.
            if(userfound){
                return response.status(200).send("Login: success");
            }else{
                console.log("Wrong username or Password")
                return response.status(500).send("Wrong Username or Password"); 
            }


        }    

    });

}


// In this object, there will be the user's username and socket ID.
var userId = {};
io.on('connection', (socket) => {
    // handle users that connect to the chatroom
    socket.on('new-user', (userConnect) => {
        // Add the username and socket ID to the object userId.
        userId[socket.id] = userConnect.username;

        // When a user is connected, a message will be sent to users that are currently connected to let them know 
        // that the user has joined the chat room.
        socket.broadcast.emit("user-connected", {
            user: 'server',
            message: `${userConnect.username} has joined the chat. 
                      There are currently ${Object.keys(userId).length} users connected`,
        });

        // This if statement will tell the user how many users are currently connected to the room chat when the user
        // connects to the chat.
        if (Object.keys(userId).length === 1){
            socket.emit("user-connected", {
                user: 'server',
                message: "Welcome to this chat room, you are the only user connected",
            });
        }else{
            socket.emit("user-connected", {
                user: 'server',
                message: `Welcome to this chat room, there are currently ${Object.keys(userId).length} users connected`,
            }); 
        }



    });
    // Display a message when the user logs out.
    socket.on("disconnects", (userConnect) =>{
        delete userId[socket.id]; // delete the user from the object userId when the user disconnects.
        socket.broadcast.emit("user-disconnect", {
            user: 'log-out',
            message: `${userConnect.username} has left the chat`,    
        });
        
    });
    // Display messages of the users
    socket.on("add-message", (userConnect)=>{
        socket.broadcast.emit("display-message", {
            user: userId[userConnect.user],
            message: userConnect.message,
        });
    });

    socket.on("upload-file", (userConnect) =>{
            //Build a query to change the imagename of a user who wants to modify his profile picture.
            let sql4 = `UPDATE user SET imagename='${userConnect.imageName}' WHERE username='${userConnect.username}'`;
            //Execute query and output results
            connectionPool.query(sql4, (error, res) => {
                if (error){//Check for errors
                    console.error("Error executing query: " + JSON.stringify(error));
                }
                else{
                    socket.emit("update-profile", {
                        file: userConnect.imageName,
                    });
                    console.log(res.affectedRows + ' rows updated');
                }
            });
    });

     socket.on("update-file", (userConnect) =>{
        //Build query to apply the changes made to the profile picture
        let sql5 = `SELECT username, imagename FROM user`;
        //Execute query and output results
        connectionPool.query(sql5, (error, res) => {
            for(let j=0; j < Object.keys(res).length; j++){
                if (error){//Check for errors
                    console.error("Error executing query: " + JSON.stringify(error));
                }
                else{
                    // Apply the changes made to the profile picture.
                    if(userConnect.username === res[j].username){
                        socket.emit("profile-picture", {
                            file: res[j].imagename,
                        });
                    }
                }
            }
        });
    })

});

//Handle POST requests sent to /upload path
app.post('/upload', function(request, response) {
    //Check to see if a file has been submitted on this path
    if (!request.files || Object.keys(request.files).length === 0) {
        return response.status(400).send('{"upload": false, "error": "Files missing"}');
    }

    // The name of the input field (i.e. "myFile") is used to retrieve the uploaded file
    let myFile = request.files.myFile;
    // Use mv() method to place the file in the folder called 'uploads' on the server.
    myFile.mv('./public/uploads/' + myFile.name, function(err) {
        if (err){
            return response.status(500).send('{"filename": "' +
            myFile.name + '", "upload": false, "error": "' +
            JSON.stringify(err) + '"}');
        }
        //Send back confirmation of the upload to the client.
        response.send('{"filename": "' + myFile.name +
            '", "upload": true}');
    
    });
});



//Start the app listening on port 8080
http.listen(8080, function(){
    console.log("Listening on port 8080");
});


//Export server for testing
module.exports = app;
