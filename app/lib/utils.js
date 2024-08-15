import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import FormData from 'form-data';

const saveImage = async (url, filename) => {
    try {
        const res = await fetch(url);
        console.log(res);
        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const filePath = "./public/" + filename;

        fs.writeFile(filePath, buffer, () => {
            console.log('File saved successfully!');
        });
    } catch (error) {
        console.error('Error saving the image from url:', error);
    }
};


// Function to generate a random filename
function randomFilename(extension) {
    const randomString = Math.random().toString(36).substring(2, 15) + 
                        Math.random().toString(36).substring(2, 15);
    const timestamp = Date.now();
    return `${randomString}_${timestamp}.${extension}`;
}

// Function to convert URL to JPG and return FormData
export const urlToJPG = async (url) => {
    try {
        const res = await fetch(url);
        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const filename = randomFilename('jpg');
        const form = new FormData();
        form.append('document', buffer, {
            filename: filename,
            contentType: 'image/jpeg'
        });
        return form;
    } catch (error) {
        console.error('Error converting image to JPG:', error.response ? error.response.data : error.message);
        return null;
    }
};