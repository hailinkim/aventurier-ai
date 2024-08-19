import axios from 'axios';
import { urlToJPG } from './utils.js';
import { Sema, RateLimit } from 'async-sema';

var RPS = 5;

const runOCR = async (url) => {
    console.log("ocr started")
    try {
        const form = await urlToJPG(url);
        if (!form) {
            throw new Error('Failed to create form data for OCR');
        }
        const response = await axios.post('https://api.upstage.ai/v1/document-ai/ocr', form, {
            headers: {
                'Authorization': `Bearer ${process.env.UPSTAGE_API_KEY}`,
            }
        });
        return response.data.text;
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
        return null;
    }
};

// Helper function to create a delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const processImagesParallel = async (images, concurrency) => {
    if(!images || images.length === 0){
        return [];
    }
    console.time("Parallel Processing Time");
    const sema = new Sema(concurrency);
    const rateLimit = RateLimit(RPS, { timeUnit: 1000 }); // Limit to 5 requests per second
    const results = [];
    console.log(images);
    console.log(images.length);
    const tasks = images.map(async (image) => {
        await sema.acquire();
        try {
            await rateLimit(); // This ensures we respect the rate limit of 5 requests per second
            const text = await runOCR(image);
            if(text && text.length>0){
                results.push(text);
            }
            await delay(100); 
        } finally {
            sema.release();
        }
    });

    await Promise.all(tasks);
    console.timeEnd("Parallel Processing Time");
    if(results.length >0){
        return results.join('\n');
    } else{
        return '';
    }
};

const processImages = async (images) => {
    console.time("Sequential Processing Time");
    const results = [];
    for (const image of images) {
        const text = await runOCR(image);
        if(text && text.length>0){
            results.push(text);
        }
    }
    console.timeEnd("Sequential Processing Time");
    if(results.length >0){
        return results.join('\n');
    } else{
        return '';
    }
};

export const ocr = async (feed) => {
    if(!feed || feed.length === 0){
        return [];
    }
    const image_arr = [];
    const updatedFeed = [];
    for (const post of feed) {
        const images = post.carousel_media?.map(item => item.image_versions2?.candidates?.[0].url) || 
            [post.image_versions2?.candidates?.[0].url].filter(Boolean) || 
            [];
        if(images && images.length > 0){
            image_arr
            const ocrResults = await processImagesParallel(images, RPS);
            if(ocrResults.length === 0){
                continue;
            }
            const postJSON = JSON.parse(JSON.stringify(post));
            postJSON.caption = postJSON.caption || {};
            postJSON.caption.text = postJSON.caption.text || '';
            postJSON.caption.text = postJSON.caption.text.concat('\n', ocrResults);
            updatedFeed.push(postJSON);
        }
    }
    return updatedFeed;
};
