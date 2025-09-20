// The shape of a single chat message
export interface ChatMessage {
    sender: Sender;
    id: string; // Unique message ID (e.g., from the database)
    channel: string;
    timestamp: string;
    type: 'text' | 'image' | 'reaction';
    content: TextContent | ImageContent | ReactionContent;
}

interface MessageBase {
    id: string; // Unique message ID (e.g., from the database)
    channel: string;
    timestamp: string;
    sender: Sender;
}

export interface TextMessage extends MessageBase {
    type: 'text';
    content: {
        text: string;
    };
    // Add a field for replies
    replyToMessageId?: string;
}

export interface ImageMessage extends MessageBase {
    type: 'image';
    content: {
        url: string; // URL of the uploaded image
        caption?: string;
    };
}

export interface ReactionMessage extends MessageBase {
    type: 'reaction';
    content: {
        emoji: string;
        // The ID of the message this reaction is for
        reactsToMessageId: string;
    };
}

// The shape of the context value provided by the hook
export interface WebSocketContextType {
    readyState: 'CONNECTING' | 'OPEN' | 'CLOSED';
    chatMessages: ChatMessage[];
    adminUpdates: AdminUpdate[];
    subscribe: (channel: string) => void;
    unsubscribe: (channel: string) => void;
    onChannelMessage: (prefix: string, handler: (message: { channel: string; event?: string; data?: unknown; [k: string]: unknown }) => void) => void;
    offChannelMessage: (prefix: string, handler: (message: { channel: string; event?: string; data?: unknown; [k: string]: unknown }) => void) => void;
    // We'll update the send functions to be more specific
    sendTextMessage: (channel: string, text: string, replyToMessageId?: string) => void;
    sendImageMessage: (channel: string, url: string, caption?: string) => void;
    sendReaction: (channel: string, emoji: string, reactsToMessageId: string) => void;
}

export interface TextContent {
    text: string;
}

export interface ImageContent {
    url: string;
    caption?: string;
}

export interface ReactionContent {
    emoji: string;
    reactsToMessageId: string;
}

export interface Sender {
    id: string; // User's UUID from Supabase
    username: string;
    avatarUrl?: string; // Optional avatar image URL
}

// The shape of an admin update message
export interface AdminUpdate {
    message: string;
    severity: 'info' | 'warning' | 'error';
    timestamp: string;
}