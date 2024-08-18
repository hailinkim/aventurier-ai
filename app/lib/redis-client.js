import { createClient } from 'redis';

let client;

async function initializeRedis() {
    if (!client) {
        client = createClient({
            password: process.env.REDIS_PW, 
            socket: {
                host: 'redis-18401.c98.us-east-1-4.ec2.redns.redis-cloud.com',
                port: 18401,
                connectTimeout: 10000
            }
        });

        client.on('error', (err) => console.log('Redis Client Error', err));

        await client.connect();
    }
    return client;
}

export default initializeRedis;