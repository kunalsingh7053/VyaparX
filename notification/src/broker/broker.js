const amqplib = require('amqplib');

let channel , connection;

async function connectRabbitMQ() { 

if(connection) return connection;

try {
    connection = await amqplib.connect(process.env.RABBIT_URL);
    console.log("Connected to RabbitMQ");
    channel = await connection.createChannel();

} catch (error) {
    console.error("Error connecting to RabbitMQ:", error);
}







}

async function publishToQueue(queueName, data={}) {

if(!channel || !connection) {
 await connectRabbitMQ();


}
await channel.assertQueue(queueName, 
    {
        
         durable: true 


});
 channel.sendToQueue(queueName, Buffer.from(JSON.stringify(data)));
 console.log("Message published to queue:", queueName);
}

async function consumeFromQueue(queueName, callback) {

if(!channel || !connection) {
 await connectRabbitMQ();


}
await channel.assertQueue(queueName, 
    {
        
         durable: true 


});
 console.log("[Broker] Starting consumer for queue:", queueName);

channel.consume(queueName, async (msg) => {
    if(msg !== null) {
        const data = JSON.parse(msg.content.toString());
         await callback(data);
          channel.ack(msg);

    }


});


}

module.exports = {
    
    connectRabbitMQ, 
    channel, 
    connection ,
    publishToQueue,
    consumeFromQueue,
    


};