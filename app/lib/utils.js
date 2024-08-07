import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

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