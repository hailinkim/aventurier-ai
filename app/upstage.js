// "openai": "^4.21.0"(https://github.com/openai/openai-node)

// import OpenAI from "openai";

// const apiKey = process.env.OPENAI_API_KEY;
// console.log(apiKey)

// const openai = new OpenAI({
//   apiKey: apiKey,
//   baseURL: 'https://api.upstage.ai/v1/solar'
// })

// const chatCompletion = await openai.chat.completions.create({
//   model: 'solar-1-mini-chat',
//   messages: [
//     {
//       role: 'user',
//       content: 'Say this is a test'
//     }
//   ],
//   stream: true
// });

// for await (const chunk of chatCompletion) {
//   console.log(chunk.choices[0]?.delta?.content || '');
// }

// Use with stream=false
// console.log(chatCompletion.choices[0].message.content || '');

import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

// const filePath = './public/test.png';
// const form = new FormData();
// form.append('document', fs.createReadStream(filePath));

// Create a FormData object and append the image buffer
const url = 'https://scontent-ssn1-1.cdninstagram.com/v/t51.29350-15/441117961_352957433974683_5916713906718155162_n.jpg?se=7&stp=dst-jpg_e35&efg=eyJ2ZW5jb2RlX3RhZyI6ImltYWdlX3VybGdlbi4xNDQweDE4MDAuc2RyLmYyOTM1MCJ9&_nc_ht=scontent-ssn1-1.cdninstagram.com&_nc_cat=103&_nc_ohc=llcX2Td5wl0Q7kNvgGle4vw&gid=f658e559f0cd4a02bbfae54b0d4a313e&edm=AIBN0-EBAAAA&ccb=7-5&ig_cache_key=MzM1ODQzODAzNzcwNjMxNjYzNw%3D%3D.2-ccb7-5&oh=00_AYCeRXy-gojRbfC30hYqX64ga5In_R5j6w7sYHNN1DbkJQ&oe=66B6C6C9&_nc_sid=53f715';
const res = await fetch(url);
const arrayBuffer = await res.arrayBuffer();
const buffer = Buffer.from(arrayBuffer);
const form = new FormData();
form.append('document', buffer, {
  filename: 'image.jpg',
  contentType: 'image/jpeg'
});

// Set the headers
// const ocr = await fetch('https://api.upstage.ai/v1/document-ai/ocr', {
//     method: 'POST',
//     body: form,
//     headers: {
//       'Authorization': `Bearer ${process.env.UPSTAGE_API_KEY}`,
//       ...form.getHeaders()
//     }
//     });
// ocr.json().then(data => console.log(data)).catch(err => console.error(err));

// Make the POST request
axios.post('https://api.upstage.ai/v1/document-ai/ocr', form, {
  headers: {
    'Authorization': `Bearer ${process.env.UPSTAGE_API_KEY}`
  }
})
.then(response => {
  console.log('Response:', response);
})
.catch(error => {
  console.error('Error:', error.response ? error.response.data : error.message);
});

// const downloadFile = async (url, outputPath) => {
//     const response = await axios({ url, responseType: 'stream' });
//     return new Promise((resolve, reject) => {
//       const writer = fs.createWriteStream(outputPath);
//       response.data.pipe(writer);
//       writer.on('finish', resolve);
//       writer.on('error', reject);
//     });
//   };

// import dbConnect from './lib/db.js';
// import Post from './db/models/Post.js';

// const getDate30DaysAgo = () => {
//     const date = new Date();
//     date.setDate(date.getDate() - 20);
//     return date;
// };

// const updatePosts = async () => {
//     await dbConnect();

//     const date30DaysAgo = getDate30DaysAgo();
//     const filter = {}; // Empty filter to update all documents
//     const update = { $set: { lastFetchDate: date30DaysAgo } };

//     try {
//         const result = await Post.updateMany(filter, update);
//         console.log(`Update complete: ${result.nModified} documents were updated.`);
//     } catch (err) {
//         console.error('Error updating documents:', err);
//     }
// };

// const verifyUpdate = async () => {
//     await dbConnect();

//     try {
//         const docs = await Post.find({ lastFetchDate: { $exists: true } }).limit(10); // Limit to 10 documents for verification
//         console.log('Documents with the new field:');
//         docs.forEach(doc => console.log(doc));
//     } catch (err) {
//         console.error('Error retrieving documents:', err);
//     }
// };

// const main = async () => {
//     await updatePosts();
//     await verifyUpdate();
// };

// main();


const saveImage = async (url, filename) => {
    try {
        const res = await fetch(url);
        // console.log(res);
        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        console.log('Buffer:', buffer);
        const filePath = "./public/" + filename;

        fs.writeFile(filePath, buffer, () => {
            console.log('File saved successfully!');
        });

        const tmp = fs.createReadStream("./public/" + filename);
        console.log('tmp:', tmp);
    } catch (error) {
        console.error('Error saving the file:', error);
    }
};

const imageUrl = 'https://scontent-ssn1-1.cdninstagram.com/v/t51.29350-15/441117961_352957433974683_5916713906718155162_n.jpg?se=7&stp=dst-jpg_e35&efg=eyJ2ZW5jb2RlX3RhZyI6ImltYWdlX3VybGdlbi4xNDQweDE4MDAuc2RyLmYyOTM1MCJ9&_nc_ht=scontent-ssn1-1.cdninstagram.com&_nc_cat=103&_nc_ohc=llcX2Td5wl0Q7kNvgGle4vw&gid=f658e559f0cd4a02bbfae54b0d4a313e&edm=AIBN0-EBAAAA&ccb=7-5&ig_cache_key=MzM1ODQzODAzNzcwNjMxNjYzNw%3D%3D.2-ccb7-5&oh=00_AYCeRXy-gojRbfC30hYqX64ga5In_R5j6w7sYHNN1DbkJQ&oe=66B6C6C9&_nc_sid=53f715';
const filename = 'image.jpeg';

// saveImage(imageUrl, filename);
