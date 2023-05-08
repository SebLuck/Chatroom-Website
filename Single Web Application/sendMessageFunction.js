export function sendMessage(userConnect, myMessage){
    // This if statement will display your message or the message of the other users.
    if (myMessage){
        return userConnect.message;
    }else{
        return `${userConnect.user}: ${userConnect.message}`;
    }
}