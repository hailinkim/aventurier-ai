import React, {useMemo, useState} from 'react';
import {useManualServerSentEvents} from '@/hooks/useManualServerEvents';

const ChatComponent = () => {
    const [messageText, setMessageText] = useState("부산 빙수 맛집 찾아줘.");

    const {
        messages,
        startFetching,
        stopFetching
    } = useManualServerSentEvents('/api/python', {messages: messageText, username: 'celine__lover'});

    // Combine messages and replace '\n\n' with HTML line break '<br /><br />'
    const combinedMessages = useMemo(() => {
        return messages.join('').replace(/\n\n/g, '<br /><br />');
    }, [messages]);

    return (
        <div className="max-w-md mx-auto my-10 space-y-4">
            <button
                onClick={startFetching}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 transition duration-300"
            >
                Start Streaming
            </button>
            <button
                onClick={stopFetching}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-700 transition duration-300"
            >
                Stop Streaming
            </button>
            <div className="mt-4 p-2 bg-gray-100 rounded shadow" dangerouslySetInnerHTML={{__html: combinedMessages}}/>
        </div>
    );
};

export default ChatComponent;