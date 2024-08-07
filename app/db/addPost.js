'use server'
import Post from '@/db/models/Post'
import User from '@/db/models/User'

const addPost = async (username, posts) => {
    try {
        const user = await User.findOne({ username: username });
        if (!user) {
            throw new Error('User not found');
        }
        const operations = posts.map(post => ({
            updateOne: {
                filter: { postPk: post.pk }, // filter by postPk
                update: {
                    $set: { // Fields to update if the document already exists or for new documents
                        user: user._id,
                        postOwner: {
                            username: post.owner?.username,
                            profileUrl: post.owner?.profile_pic_url,
                        },
                        location: post.location || null,
                        caption: post.caption?.text || null,
                        images: post.carousel_media?.map(item => item.image_versions2?.candidates?.[0].url) || post.image_versions2?.candidates?.[0].url || null,
                        videos: post.video_versions?.[0]?.url || null,
                        lastFetchDate: new Date(),
                    },
                    // $setOnInsert: { // Fields to set only if a new document is inserted
                    //     postPk: post.pk,
                    // }
                },
                upsert: true // Perform an insert if no document matches the filter
            }
        }));
        
        if (operations.length > 0) {
            await Post.bulkWrite(operations);
            console.log('Posts added successfully.');
        } else {
            console.log('No new posts to add.');
        }        
    } catch (error) {
        console.error('Failed to add posts:', error);
        throw error;
    }
}
export { addPost }
