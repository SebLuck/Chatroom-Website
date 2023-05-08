//Server code that we are testing
let server = require ('../server')
//Database code that we are testing
let db = require('../database_test');
//Set up Chai library 
let chai = require('chai');
let should = chai.should();
let assert = chai.assert;
let expect = chai.expect;

//Set up Chai for testing web service
let chaiHttp = require ('chai-http');
chai.use(chaiHttp);

//Import the mysql module and create a connection pool with the user details
const mysql = require('mysql');
const res = require('express/lib/response');
const connectionPool = mysql.createPool({
    connectionLimit: 1,
    host: "localhost",
    user: "Seb",
    password: "1234",
    database: "chatroom",
    port: 8111,
    debug: false
});

describe('#registers', () => {
    it('should register a user', (done) => {
        //Call function that we are testing
        db.registerUser();
        //Check that user has been added to database
        let sql = "SELECT username FROM user WHERE username='Sebastien';";
        connectionPool.query(sql, (err, result) => {
            if (err){//Check for errors
                assert.fail(err);//Fail test if this does not work.
                done();//End test
            }
            else{

                //Clean up database
                let sql = "DELETE FROM user WHERE username='Sebastien'";
                connectionPool.query(sql, (err, result) => {
                    if (err){//Check for errors
                        assert.fail(err);//Fail test if this does not work.
                        done();//End test
                    }
                    else{
                        done();//End test
                    }
                });
            }
        });
    });
});
// Test the login functionality of the website
describe('#logins', () => {
    it('should login a user', (done) => {

        let sql = "SELECT * FROM user";

        let userlogin = {
            username: 'JL1231', 
            password: 'Go1234' 
        }
        connectionPool.query(sql, (err, result) => {
            if (err){//Check for errors
                console.error("Error executing query: " + JSON.stringify(err));
            }
            else{//Output results in JSON format - a web service would return this string.
                //Call function that we are testing
                db.loginUser(result, userlogin);
                if (err){//Check for errors
                    assert.fail(err);//Fail test if this does not work.
                    done();//End test
                }
                else{
                    done();//End test
                }
            }
        });

    });
});


describe('#uploadFile', () => {
    it('should change the profile picture of the user', (done) => {
        let sql = "SELECT username, imagename FROM user WHERE username='JL1231'";
        let userFile = {
            username: 'JL1231', 
            imagename: 'profile1.png' 
        }
        //Execute query 
        connectionPool.query(sql, (err, result) => {
            if (err){//Check for errors
                console.error("Error executing query: " + JSON.stringify(err));
            }
            else{//Output results in JSON format - a web service would return this string.
                //Call function that we are testing
                db.uploadFile(result, userFile);
                if (err){//Check for errors
                    assert.fail(err);//Fail test if this does not work.
                    done();//End test
                }
                else{
                    //Bring back the data
                    let sql = `UPDATE user SET imagename='${result[0].imagename}' WHERE username='${result[0].username}'`;
                    connectionPool.query(sql, (err, result) => {
                        if (err){//Check for errors
                            assert.fail(err);//Fail test if this does not work.
                            done();//End test
                        }
                        else{
                            done();//End test
                        }
                    });
                }
            }
        });
    });
});


// Check the POST request of /login
describe('/POST login', () => {
     it('it should not POST a user which are not in the database', (done) => {
         let userObject = {
             username: "JL1231",
             password: "Go1234"
         }
         chai.request(server)
             .post('/login')
             .set('Content-Type', 'application/json')
             .send(userObject)
             .end((err, res) => {
                 //Check the status code
                 res.should.have.status(200);
                 //Check that an object of user is returned
                 res.body.should.be.a('object');
                 done();
             });
     });

});