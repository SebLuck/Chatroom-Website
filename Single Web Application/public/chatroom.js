let passwordValidation = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{5,})");
let password;
let button_register;
let confirmPassword;
let loginButton;
window.onload = init;
// connect to the localhost
var origin = window.location.origin;
var socket = io.connect(origin);
// call all the function
function init(){
    register.disabled = true;
    button_register = document.getElementById("register");
    button_register.onclick = registers;
    password = document.getElementById("password_register");
    confirmPassword = document.getElementById("password_confirm");
    password.onkeydown = validation_register;
    confirmPassword.onkeydown = validation_register;
    loginButton = document.getElementById("login");
    loginButton.onclick = logins;
    registerLoginButton = document.getElementById("register_login");
    registerLoginButton.onclick = registerLogin;
    loginRegisterButton = document.getElementById("login_register");
    loginRegisterButton.onclick = loginRegister;

}

// Go to the login field
function registerLogin(){
    document.querySelector("#register_part").style.display = "none";
    document.querySelector("#login_part").style.display = "block";
}
// Go to the register field
function loginRegister(){
    document.querySelector("#register_part").style.display = "block";
    document.querySelector("#login_part").style.display = "none";
}

// Validation of password
function validation_register(){
    let passwordUser = document.getElementById("password_register").value;
    let validPassword = passwordValidation.test(passwordUser);
    let confirmPasswordUser = document.getElementById("password_confirm").value;
    let ValidConfirmPassword = passwordValidation.test(confirmPasswordUser);
    if ((passwordUser == confirmPasswordUser) && (validPassword) && (ValidConfirmPassword)){
        register.disabled = false;
        document.getElementById("error_register").innerHTML = "Password Valid";
    }else{
        document.getElementById("error_register").innerHTML = "Password Invalid. Please use at least one capital letter and 5 characters";
        register.disabled = true;
    }
}

// Make the user register.
function registers(){
    //Set up XMLHttpRequest
    let xhttp = new XMLHttpRequest();
    let username = document.getElementById("username_register").value;
    let passwordUser = document.getElementById("password_register").value;
    //Create object with user data
    let userObject = {
        username: username,
        password: passwordUser
    };
    //Set up a function that is called when a reply is received from the server.
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            document.getElementById("error_register").innerHTML = "Password Valid";
            document.querySelector("#register_part").style.display = "none";
            document.querySelector("#login_part").style.display = "block";
        }
        else{
            document.getElementById("error_register").innerHTML = "Username already taken";
        }

    };
    
    //Send new user data to server
    xhttp.open("POST", "/register", true);
    xhttp.setRequestHeader("Content-type", "application/json");
    xhttp.send(JSON.stringify(userObject));
    
}    

//Make the user login
function logins(){
    
    //Set up XMLHttpRequest
    let xhttp = new XMLHttpRequest();  
    let username = document.getElementById("username_login").value;
    let passwordUser = document.getElementById("password_login").value;
    //Create object with user data
    let userObject = {
        username: username,
        password: passwordUser
    };

    

    //Set up a function that is called when a reply is received from the server.
    xhttp.onreadystatechange = function() {
        // Check if the status is  200 and the readystate is 4 to allow the user to join the room chat.
        if (this.readyState == 4 && this.status == 200) {
            document.querySelector("#login_part").style.display = "none";
            document.querySelector("#roomchat").style.display = "block";
            document.getElementById("username").innerHTML = username;
            // Send the username connected to the server.
            socket.emit("update-file", {username});
            // Take the imagename from the database and apply it to the profile.
            socket.on("profile-picture", (userConnect) => {
                userUpdateProfile(userConnect);
            }); 
            function userUpdateProfile(userConnect){
                document.getElementById("profilePic").src=`uploads/${userConnect.file}`;
            }
            //document.getElementById("profilePic").src=`uploads/${userConnect.file}`;
            // send the username to the server
            socket.emit("new-user", {username});
            // display messages when a user connects to the room chat
            socket.on("user-connected", (userConnect) => {
                sendMessage(userConnect, false);
            });


            const logoutButton = document.getElementById("logout");
            // This function will be called whenever the user clicks on the logout button.
            logoutButton.addEventListener("click", function(){
                 // Send the username to the server.
                socket.emit("disconnects", {username});
                window.location.reload();

            });
            // display a message when the user disconnects.
            socket.on("user-disconnect", (userConnect) => {
                sendMessage(userConnect, false);
            }); 
            
            const uploadButton = document.getElementById("uploadImage");
            uploadButton.addEventListener("click", function(){
                let imageName = document.getElementById("fileImage").files[0].name;
                socket.emit("upload-file", {username, imageName});
                let fileArray = document.getElementById("fileImage").files;
                if(fileArray.length !== 1){
                    return;
                }
                //Put file inside FormData object
                const formData = new FormData();
                formData.append('myFile', fileArray[0]);

                //Set up HTTP Request
                let httpReq = new XMLHttpRequest();

                //Send off message to upload file
                httpReq.open('POST', '/upload');
                httpReq.send(formData);

            });
            // Make the profile picture change.
            socket.on("update-profile", (userConnect) => {
                userProfile(userConnect);
            }); 
            function userProfile(userConnect){
                document.getElementById("profilePic").src=`uploads/${userConnect.file}`;

            }
            
            function sendMessage(userConnect, myMessage = false){
                // Create an element in the chat box to display the messages.
                const messagePart = document.createElement("messagePart");
                // This if statement will display your message or the message of the other users
                if (myMessage){
                    messagePart.innerHTML = `<p class="myMessage"> ${userConnect.message}</p>`;
                }else{
                    messagePart.innerHTML = `<p class="yourMessage"> ${userConnect.user}: ${userConnect.message}</p>`;
                }
                // display messages when a user has entered the chat room.
                if (userConnect.user === "server"){
                    messagePart.innerHTML = `<p class="connected"> ${userConnect.message}</p>`;
                } 
                //Display a message that shows that a user has left the room.
                if (userConnect.user == "log-out"){
                    messagePart.innerHTML = `<p class="disconnects"> ${userConnect.message}</p>`;
                }

                const chat = document.getElementById("chat");
                chat.append(messagePart);
            }

            const chatForm = document.getElementById("chatForm");
            // This function will be called whenever the user clicks on the send button.
            chatForm.addEventListener('submit', event => {
                event.preventDefault(); // prevent the page from reloading.
                const chat_input = document.getElementById("meassageUser");
                // Check if the input text is empty.
                if(chat_input.value !== ""){
                    let addMessage = chat_input.value;
                    socket.emit("add-message", {user: socket.id, message: addMessage});
                    // Set the myMessage variable to true to display your message in the room chat.
                    sendMessage({message: addMessage}, true); 
                    // put the input text empty
                    chat_input.value = "";
                }
            });

            // display messages of the users
            socket.on("display-message", (userConnect)=>{
                sendMessage(userConnect, false);
            });


        }
        else{
            document.getElementById("error_login").innerHTML = "Wrong password or username";

        }

    };
    //Send new user data to server
    xhttp.open("POST", "/login", true);
    xhttp.setRequestHeader("Content-type", "application/json");
    xhttp.send(JSON.stringify(userObject));   
}

