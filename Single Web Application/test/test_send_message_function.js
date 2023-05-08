//File containing the functions that we are testing.
import {sendMessage} from '../sendMessageFunction.js';

//Import expect from chai
let expect = chai.expect;

//Mocha test for multiply function
describe('#testSendMessage', () => {
    it('should return a message', (done) => {
        //Run some tests that sensibly explore the behaviour of the function.

        let result = sendMessage({
            message: "Hi"
        }, true);
        expect(result).to.equal("Hi");
        
        result = sendMessage({
            message: "Hello",
            user: "JL1231"
        }, false);
        expect(result).to.equal("JL1231: Hello");

        //Call function to signal that the test is complete.
        done();
    });
});