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


// export const ocr = async (items) => {
//     return Promise.all(items.map(async (item) => {
//         try {
//             const ocrResults = await Promise.all(item.images.map(async (imageUrl) => {
//                 try {
//                     const ocrResult = await runOCR(imageUrl);
//                     return { imageUrl, ocrResult };
//                 } catch (error) {
//                     console.error(`Failed to process OCR for image ${imageUrl}:`, error);
//                     return null;
//                 }
//             }));

//             // Filter out any null results (in case of OCR failure)
//             item.ocrResults = ocrResults.filter(result => result !== null);
//         } catch (error) {
//             console.error(`Failed to process item ${item}:`, error);
//             item.ocrResults = [];
//         }
//         return item;
//     }));
// };

// const processImagesParallel = async (images, concurrency) => {
//     console.log("started");

//     const sema = new Sema(concurrency);
//     const rateLimit = RateLimit(5, { timeUnit: 1000 }); // Limit to 5 requests per second
//     const results = [];

//     const tasks = images.map(async (image) => {
//         await sema.acquire();
//         try {
//             await rateLimit(); // This ensures we respect the rate limit of 5 requests per second
//             const text = await runOCR(image);
//             results.push(text);
//         } finally {
//             sema.release();
//         }
//     });

//     await Promise.all(tasks);
//     return results.join('\n');
// };


// const processImages = async (images) => {
//     const results = [];
//     for (const image of post.images) {
//         const text = await runOCR(image);
//         results.push(text);
//         // Adding a delay of 1 second (1000 milliseconds)
//         await delay(1000);
//     }
//     return results.join('\n');
// };


// (async () => {
//     const images = [
//         'https://scontent-ssn1-1.cdninstagram.com/v/t51.29350-15/441117961_352957433974683_5916713906718155162_n.jpg?se=7&stp=dst-jpg_e35&efg=eyJ2ZW5jb2RlX3RhZyI6ImltYWdlX3VybGdlbi4xNDQweDE4MDAuc2RyLmYyOTM1MCJ9&_nc_ht=scontent-ssn1-1.cdninstagram.com&_nc_cat=103&_nc_ohc=kjY6QYUYFyUQ7kNvgE1ys7g&edm=AIBN0-EBAAAA&ccb=7-5&ig_cache_key=MzM1ODQzODAzNzcwNjMxNjYzNw%3D%3D.2-ccb7-5&oh=00_AYAfkRoiA6UzMjB-EwTsmrHqsD10x6OHZ63EOI6Gn2hFrg&oe=66C314C9&_nc_sid=53f715',
//         'https://scontent-ssn1-1.cdninstagram.com/v/t51.29350-15/441100359_411214568499020_8387481657132817399_n.jpg?se=7&stp=dst-jpg_e35&efg=eyJ2ZW5jb2RlX3RhZyI6ImltYWdlX3VybGdlbi4xNDQweDE4MDAuc2RyLmYyOTM1MCJ9&_nc_ht=scontent-ssn1-1.cdninstagram.com&_nc_cat=108&_nc_ohc=NrjXdtD4dQYQ7kNvgEA_l7Y&edm=AIBN0-EBAAAA&ccb=7-5&ig_cache_key=MzM1ODQzODAzNzY4OTUxNzA2Ng%3D%3D.2-ccb7-5&oh=00_AYDMvR5-GtvcXmF_9iKf-nXe25i0amF6afGr58LAj8nJAw&oe=66C33D43&_nc_sid=53f715',
//         'https://scontent-ssn1-1.cdninstagram.com/v/t51.29350-15/441114095_407266958797745_4175306306742192436_n.jpg?se=7&stp=dst-jpg_e35&efg=eyJ2ZW5jb2RlX3RhZyI6ImltYWdlX3VybGdlbi4xNDQweDE4MDAuc2RyLmYyOTM1MCJ9&_nc_ht=scontent-ssn1-1.cdninstagram.com&_nc_cat=105&_nc_ohc=bMgrkd5cJaoQ7kNvgG9ZXy9&edm=AIBN0-EBAAAA&ccb=7-5&ig_cache_key=MzM1ODQzODAzNzc2NTE4MDIzNA%3D%3D.2-ccb7-5&oh=00_AYCTph081fw4UZJdnXctFt_lghRN1JPZMQyE_rCBpHz8WQ&oe=66C30F4B&_nc_sid=53f715',
//         'https://scontent-ssn1-1.cdninstagram.com/v/t51.29350-15/441114449_962201411867342_5131268337294331055_n.jpg?se=7&stp=dst-jpg_e35&efg=eyJ2ZW5jb2RlX3RhZyI6ImltYWdlX3VybGdlbi4xNDQweDE4MDAuc2RyLmYyOTM1MCJ9&_nc_ht=scontent-ssn1-1.cdninstagram.com&_nc_cat=102&_nc_ohc=nuYx-Al_YeYQ7kNvgGJ-cce&edm=AIBN0-EBAAAA&ccb=7-5&ig_cache_key=MzM1ODQzODAzNzY4OTY4MTg4OA%3D%3D.2-ccb7-5&oh=00_AYAga2umcboltugdWIkKQ6aBWw4XuF4-ts68_5e03khlFQ&oe=66C32E89&_nc_sid=53f715',
//         'https://scontent-ssn1-1.cdninstagram.com/v/t51.29350-15/441097370_3799009266993621_809850819598663770_n.jpg?se=7&stp=dst-jpg_e35&efg=eyJ2ZW5jb2RlX3RhZyI6ImltYWdlX3VybGdlbi4xNDQweDE4MDAuc2RyLmYyOTM1MCJ9&_nc_ht=scontent-ssn1-1.cdninstagram.com&_nc_cat=109&_nc_ohc=cWx3hMgyUOQQ7kNvgE3TyFR&edm=AIBN0-EBAAAA&ccb=7-5&ig_cache_key=MzM1ODQzODAzNzcwNjM2NTUyMw%3D%3D.2-ccb7-5&oh=00_AYCtPZLj-mXQKZV0K_sNpA8sQuRd1gSrBG6x1j6vgnwJIA&oe=66C3296C&_nc_sid=53f715',
//         'https://scontent-ssn1-1.cdninstagram.com/v/t51.29350-15/440994819_331102216362287_833347540174015789_n.jpg?se=7&stp=dst-jpg_e35&efg=eyJ2ZW5jb2RlX3RhZyI6ImltYWdlX3VybGdlbi4xNDQweDE4MDAuc2RyLmYyOTM1MCJ9&_nc_ht=scontent-ssn1-1.cdninstagram.com&_nc_cat=111&_nc_ohc=OBInv_3IcJcQ7kNvgHOQEE0&edm=AIBN0-EBAAAA&ccb=7-5&ig_cache_key=MzM1ODQzODAzNzcwNjQyODYwNg%3D%3D.2-ccb7-5&oh=00_AYASXMzyIMs0aBSQ6Z4JuDBI8BxYrMG-SrUDHkCyKK1bRQ&oe=66C31FE4&_nc_sid=53f715',
//         'https://scontent-ssn1-1.cdninstagram.com/v/t51.29350-15/441284634_1486040271985216_1104850923640261508_n.jpg?se=7&stp=dst-jpg_e35&efg=eyJ2ZW5jb2RlX3RhZyI6ImltYWdlX3VybGdlbi4xNDQweDE4MDAuc2RyLmYyOTM1MCJ9&_nc_ht=scontent-ssn1-1.cdninstagram.com&_nc_cat=104&_nc_ohc=sgxdavPZqWkQ7kNvgFXywzc&edm=AIBN0-EBAAAA&ccb=7-5&ig_cache_key=MzM1ODQzODAzNzcwNjQyNTQzMQ%3D%3D.2-ccb7-5&oh=00_AYC6OKz48dwVIqAa1P0p95sbGl8LodiiUbedKMKuAUMLBw&oe=66C333FC&_nc_sid=53f715',
//         'https://scontent-ssn1-1.cdninstagram.com/v/t51.29350-15/441170154_1656139574921244_2378766452972777234_n.jpg?se=7&stp=dst-jpg_e35&efg=eyJ2ZW5jb2RlX3RhZyI6ImltYWdlX3VybGdlbi4xNDQweDE4MDAuc2RyLmYyOTM1MCJ9&_nc_ht=scontent-ssn1-1.cdninstagram.com&_nc_cat=100&_nc_ohc=Gy9FxUymw9UQ7kNvgF3qikN&edm=AIBN0-EBAAAA&ccb=7-5&ig_cache_key=MzM1ODQzODAzNzcwNjQxMDgyOQ%3D%3D.2-ccb7-5&oh=00_AYByXJJ_ZMSVPSbOEVOy7XLQKEFZmPtowufc5NSbSJbPQA&oe=66C3460B&_nc_sid=53f715',
//         'https://scontent-ssn1-1.cdninstagram.com/v/t51.29350-15/441093738_749559017388319_4773416125655974728_n.jpg?se=7&stp=dst-jpg_e35&efg=eyJ2ZW5jb2RlX3RhZyI6ImltYWdlX3VybGdlbi4xNDQweDE4MDAuc2RyLmYyOTM1MCJ9&_nc_ht=scontent-ssn1-1.cdninstagram.com&_nc_cat=107&_nc_ohc=16EeE240shwQ7kNvgHEu0f8&edm=AIBN0-EBAAAA&ccb=7-5&ig_cache_key=MzM1ODQzODAzNzcwNjQyOTY0NQ%3D%3D.2-ccb7-5&oh=00_AYD_ETWuKaFWTXbDu6_bx49YbUjqYbLSjs0VYxjWXT7cvw&oe=66C31B18&_nc_sid=53f715',
//         'https://scontent-ssn1-1.cdninstagram.com/v/t51.29350-15/441101925_1457552825177762_3888516892732622312_n.jpg?se=7&stp=dst-jpg_e35&efg=eyJ2ZW5jb2RlX3RhZyI6ImltYWdlX3VybGdlbi4xNDQweDE4MDAuc2RyLmYyOTM1MCJ9&_nc_ht=scontent-ssn1-1.cdninstagram.com&_nc_cat=102&_nc_ohc=5GAUpHnFp0YQ7kNvgGNsEk7&edm=AIBN0-EBAAAA&ccb=7-5&ig_cache_key=MzM1ODQzODAzNzY5NzkzMjM1Ng%3D%3D.2-ccb7-5&oh=00_AYACeEdpjgovwgxSK9jjmIdoue8xiP1IDYxGMX_Bpbh5sg&oe=66C313BA&_nc_sid=53f715'
//     ];
//     const res = await processImages(images, images.length);
//     console.log(res);
// })();


const processImagesParallel = async (images, concurrency) => {
    console.time("Parallel Processing Time");

    console.log("started");

    const sema = new Sema(concurrency);
    const rateLimit = RateLimit(RPS, { timeUnit: 1000 }); // Limit to 5 requests per second
    const results = [];

    const tasks = images.map(async (image) => {
        await sema.acquire();
        try {
            await rateLimit(); // This ensures we respect the rate limit of 5 requests per second
            const text = await runOCR(image);
            if(text && text.length>0){
                results.push(text);
            }
            // await delay(1); 
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
    const updatedFeed = [];
    for (const post of feed) {
        const images = post.carousel_media?.map(item => item.image_versions2?.candidates?.[0].url) || post.image_versions2?.candidates?.[0].url || null;
        if(images && images.length > 0){
            const ocrResults = await processImagesParallel(images, RPS);
            const postJSON = JSON.parse(JSON.stringify(post));
            postJSON.caption = postJSON.caption || {};
            postJSON.caption.text = postJSON.caption.text || '';
            // Safely concatenate the ocrResults
            postJSON.caption.text = postJSON.caption.text.concat('\n', ocrResults);
            console.log('Updated caption text:', postJSON.caption.text);
            updatedFeed.push(postJSON);
        }
    }
    return updatedFeed;
};

// Example usage:
// const images = [
//     'https://scontent-ssn1-1.cdninstagram.com/v/t51.29350-15/447093217_1544768593089486_4275481504591559843_n.jpg?stp=dst-jpg_e15_p480x480&efg=eyJ2ZW5jb2RlX3RhZyI6ImltYWdlX3VybGdlbi4xMDgweDE5MjAuc2RyLmYyOTM1MCJ9&_nc_ht=scontent-ssn1-1.cdninstagram.com&_nc_cat=106&_nc_ohc=MHxgocqjmXgQ7kNvgHkqf2S&edm=AIBN0-EBAAAA&ccb=7-5&ig_cache_key=MzM4MDYyMzU5NDcxMjI5NjQ2ODM3NjUxMjk1ODM3Njk5NTA%3D.2-ccb7-5&oh=00_AYCaY8T5jYmo3W6hwL5otoOHWMCCLho-J33bDltb0WEx_w&oe=66C37791&_nc_sid=53f715.jpg',
//     'https://scontent-ssn1-1.cdninstagram.com/v/t51.29350-15/441100359_411214568499020_8387481657132817399_n.jpg?se=7&stp=dst-jpg_e35&efg=eyJ2ZW5jb2RlX3RhZyI6ImltYWdlX3VybGdlbi4xNDQweDE4MDAuc2RyLmYyOTM1MCJ9&_nc_ht=scontent-ssn1-1.cdninstagram.com&_nc_cat=108&_nc_ohc=NrjXdtD4dQYQ7kNvgEA_l7Y&edm=AIBN0-EBAAAA&ccb=7-5&ig_cache_key=MzM1ODQzODAzNzY4OTUxNzA2Ng%3D%3D.2-ccb7-5&oh=00_AYDMvR5-GtvcXmF_9iKf-nXe25i0amF6afGr58LAj8nJAw&oe=66C33D43&_nc_sid=53f715',
//     'https://scontent-ssn1-1.cdninstagram.com/v/t51.29350-15/441114095_407266958797745_4175306306742192436_n.jpg?se=7&stp=dst-jpg_e35&efg=eyJ2ZW5jb2RlX3RhZyI6ImltYWdlX3VybGdlbi4xNDQweDE4MDAuc2RyLmYyOTM1MCJ9&_nc_ht=scontent-ssn1-1.cdninstagram.com&_nc_cat=105&_nc_ohc=bMgrkd5cJaoQ7kNvgG9ZXy9&edm=AIBN0-EBAAAA&ccb=7-5&ig_cache_key=MzM1ODQzODAzNzc2NTE4MDIzNA%3D%3D.2-ccb7-5&oh=00_AYCTph081fw4UZJdnXctFt_lghRN1JPZMQyE_rCBpHz8WQ&oe=66C30F4B&_nc_sid=53f715',
//     'https://scontent-ssn1-1.cdninstagram.com/v/t51.29350-15/441114449_962201411867342_5131268337294331055_n.jpg?se=7&stp=dst-jpg_e35&efg=eyJ2ZW5jb2RlX3RhZyI6ImltYWdlX3VybGdlbi4xNDQweDE4MDAuc2RyLmYyOTM1MCJ9&_nc_ht=scontent-ssn1-1.cdninstagram.com&_nc_cat=102&_nc_ohc=nuYx-Al_YeYQ7kNvgGJ-cce&edm=AIBN0-EBAAAA&ccb=7-5&ig_cache_key=MzM1ODQzODAzNzY4OTY4MTg4OA%3D%3D.2-ccb7-5&oh=00_AYAga2umcboltugdWIkKQ6aBWw4XuF4-ts68_5e03khlFQ&oe=66C32E89&_nc_sid=53f715',
//     'https://scontent-ssn1-1.cdninstagram.com/v/t51.29350-15/441097370_3799009266993621_809850819598663770_n.jpg?se=7&stp=dst-jpg_e35&efg=eyJ2ZW5jb2RlX3RhZyI6ImltYWdlX3VybGdlbi4xNDQweDE4MDAuc2RyLmYyOTM1MCJ9&_nc_ht=scontent-ssn1-1.cdninstagram.com&_nc_cat=109&_nc_ohc=cWx3hMgyUOQQ7kNvgE3TyFR&edm=AIBN0-EBAAAA&ccb=7-5&ig_cache_key=MzM1ODQzODAzNzcwNjM2NTUyMw%3D%3D.2-ccb7-5&oh=00_AYCtPZLj-mXQKZV0K_sNpA8sQuRd1gSrBG6x1j6vgnwJIA&oe=66C3296C&_nc_sid=53f715',
//     'https://scontent-ssn1-1.cdninstagram.com/v/t51.29350-15/440994819_331102216362287_833347540174015789_n.jpg?se=7&stp=dst-jpg_e35&efg=eyJ2ZW5jb2RlX3RhZyI6ImltYWdlX3VybGdlbi4xNDQweDE4MDAuc2RyLmYyOTM1MCJ9&_nc_ht=scontent-ssn1-1.cdninstagram.com&_nc_cat=111&_nc_ohc=OBInv_3IcJcQ7kNvgHOQEE0&edm=AIBN0-EBAAAA&ccb=7-5&ig_cache_key=MzM1ODQzODAzNzcwNjQyODYwNg%3D%3D.2-ccb7-5&oh=00_AYASXMzyIMs0aBSQ6Z4JuDBI8BxYrMG-SrUDHkCyKK1bRQ&oe=66C31FE4&_nc_sid=53f715',
//     'https://scontent-ssn1-1.cdninstagram.com/v/t51.29350-15/441284634_1486040271985216_1104850923640261508_n.jpg?se=7&stp=dst-jpg_e35&efg=eyJ2ZW5jb2RlX3RhZyI6ImltYWdlX3VybGdlbi4xNDQweDE4MDAuc2RyLmYyOTM1MCJ9&_nc_ht=scontent-ssn1-1.cdninstagram.com&_nc_cat=104&_nc_ohc=sgxdavPZqWkQ7kNvgFXywzc&edm=AIBN0-EBAAAA&ccb=7-5&ig_cache_key=MzM1ODQzODAzNzcwNjQyNTQzMQ%3D%3D.2-ccb7-5&oh=00_AYC6OKz48dwVIqAa1P0p95sbGl8LodiiUbedKMKuAUMLBw&oe=66C333FC&_nc_sid=53f715',
//     'https://scontent-ssn1-1.cdninstagram.com/v/t51.29350-15/441170154_1656139574921244_2378766452972777234_n.jpg?se=7&stp=dst-jpg_e35&efg=eyJ2ZW5jb2RlX3RhZyI6ImltYWdlX3VybGdlbi4xNDQweDE4MDAuc2RyLmYyOTM1MCJ9&_nc_ht=scontent-ssn1-1.cdninstagram.com&_nc_cat=100&_nc_ohc=Gy9FxUymw9UQ7kNvgF3qikN&edm=AIBN0-EBAAAA&ccb=7-5&ig_cache_key=MzM1ODQzODAzNzcwNjQxMDgyOQ%3D%3D.2-ccb7-5&oh=00_AYByXJJ_ZMSVPSbOEVOy7XLQKEFZmPtowufc5NSbSJbPQA&oe=66C3460B&_nc_sid=53f715',
//     'https://scontent-ssn1-1.cdninstagram.com/v/t51.29350-15/441093738_749559017388319_4773416125655974728_n.jpg?se=7&stp=dst-jpg_e35&efg=eyJ2ZW5jb2RlX3RhZyI6ImltYWdlX3VybGdlbi4xNDQweDE4MDAuc2RyLmYyOTM1MCJ9&_nc_ht=scontent-ssn1-1.cdninstagram.com&_nc_cat=107&_nc_ohc=16EeE240shwQ7kNvgHEu0f8&edm=AIBN0-EBAAAA&ccb=7-5&ig_cache_key=MzM1ODQzODAzNzcwNjQyOTY0NQ%3D%3D.2-ccb7-5&oh=00_AYD_ETWuKaFWTXbDu6_bx49YbUjqYbLSjs0VYxjWXT7cvw&oe=66C31B18&_nc_sid=53f715',
//     'https://scontent-ssn1-1.cdninstagram.com/v/t51.29350-15/441101925_1457552825177762_3888516892732622312_n.jpg?se=7&stp=dst-jpg_e35&efg=eyJ2ZW5jb2RlX3RhZyI6ImltYWdlX3VybGdlbi4xNDQweDE4MDAuc2RyLmYyOTM1MCJ9&_nc_ht=scontent-ssn1-1.cdninstagram.com&_nc_cat=102&_nc_ohc=5GAUpHnFp0YQ7kNvgGNsEk7&edm=AIBN0-EBAAAA&ccb=7-5&ig_cache_key=MzM1ODQzODAzNzY5NzkzMjM1Ng%3D%3D.2-ccb7-5&oh=00_AYACeEdpjgovwgxSK9jjmIdoue8xiP1IDYxGMX_Bpbh5sg&oe=66C313BA&_nc_sid=53f715'
// ];
// processImagesParallel(images, RPS).then(parallelResults => {
//     console.log("Parallel results:", parallelResults);
// });

