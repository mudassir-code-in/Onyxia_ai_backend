import { createClient } from 'redis';


const redisClient = createClient({
  url: process.env.REDIS_URL! 
});


redisClient.on('error', (error: any) => {

  console.error('Redis client error:', error);

});


export const connectRedis = async (): Promise<void> => {
  try {

    await redisClient.connect();
    console.log('Redis connected');

  } catch (error) {

    console.error('Redis connection error:', error);
    process.exit(1); 

  }
};


export default redisClient;