//Import the mysql module and create a connection pool with user details.
const mysql = require('mysql');

const connectionPool = mysql.createPool({
    connectionLimit: 1,
    host: "localhost",
    user: "Seb",
    password: "*****",
    database: "chatroom",
    port: 8111,
    debug: false
});

//Adds a new customer to the database.

exports.registerUser = () => {
        let sql = "INSERT INTO user (username, password, imagename) " + 
        "VALUES ('Sebastien', 'Sl123', " +
        "'default.png');";
        //Execute query
        connectionPool.query(sql, (err, result) => {
            if (err){//Check for errors
                let errMsg = "{Error: " + err + "}";
                console.error(errMsg);
            }
            else{//Send back result
                console.log("{result: 'User registered successfully'}");
            }
        });
}

exports.loginUser = (result, userlogin) => {
    let loginUser = result;
    //Look to see if we have a matching user.
    let userfound = false;
    for(let c = 0; c < Object.keys(loginUser).length; c++){
        if(loginUser[c].username === userlogin.username && loginUser[c].password === userlogin.password){//Found matching user
            //Store details of logged in user
            userfound = true;
            break; 
        }

    }
    // This if statement will allow the user to access the roomchat if its username and password are correct.
    if(userfound){
        console.log("Login: success");
    }else{
        console.log("Wrong username or Password");
    }   

}

exports.uploadFile = (result, userFile) => {
     //Build a query to change the imagename of a user who wants to modify his profile picture.
     let sql = `UPDATE user SET imagename='${userFile.imagename}' WHERE username='${userFile.username}'`;
     //Execute the query and output the results.
     connectionPool.query(sql, (error, result) => {
         if (error){//Check for errors
             console.error("Error executing query: " + JSON.stringify(error));
         }
         else{
             console.log(result.affectedRows + ' rows updated');
         }
     });
}
