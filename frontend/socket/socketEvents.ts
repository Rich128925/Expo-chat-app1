import { getSocket } from "./socket";

export type UpdateProfilePayload = {
  name?: string;
  avatar?: string | null;
  username?: string;
  phone?: string;
  address?: string;
  bio?: string;
};

export type UpdateProfileResponse = {
  success: boolean;
  msg: string;
  data?: {
    token?: string;
    user?: UpdateProfilePayload & {
      email?: string;
      id?: string;
    };
  };
};

type TestSocketPayload = {
  msg: string;
};

export type ContactType = {
  id: string;
  name: string;
  avatar: string | null;
  email?: string;
};

export type GetContactsResponse = {
  success: boolean;
  msg?: string;
  data?: ContactType[];
};

export type NewConversationPayload = {
  type: "direct" | "group";
  participants: string[];
  name?: string;
  avatar?: string | null;
};

export type NewConversationResponse = {
  success: boolean;
  msg?: string;
  data?: any;
};

export const testSocket = (
  payload: TestSocketPayload | ((data: TestSocketPayload) => void),
  off: boolean = false
) => {
  const socket = getSocket();

  if (!socket) {
    console.log("Socket is not connected");
    return;
  }

  if (off) {
    if (typeof payload === "function") {
      socket.off("testSocket", payload);
    }
  } else if (typeof payload === "function") {
    socket.on("testSocket", payload);
  } else {
    socket.emit("testSocket", payload);
  }
};

export const updateProfile = (
  payload: UpdateProfilePayload | ((data: UpdateProfileResponse) => void),
  off: boolean = false
) => {
  const socket = getSocket();

  if (!socket) {
    console.log("Socket is not connected");
    return;
  }

  if (off) {
    if (typeof payload === "function") {
      socket.off("updateProfile", payload);
    }
  } else if (typeof payload === "function") {
    socket.on("updateProfile", payload);
  } else {
    socket.emit("updateProfile", payload);
  }
};

export const getContacts = (
  payload?: (data: GetContactsResponse) => void,
  off: boolean = false
) => {
  const socket = getSocket();

  if (!socket) {
    console.log("Socket is not connected");
    return;
  }

  if (off) {
    if (typeof payload === "function") {
      socket.off("getContacts", payload);
    }
  } else if (typeof payload === "function") {
    socket.on("getContacts", payload);
  } else {
    socket.emit("getContacts");
  }
};

export const onNewConversation = (
  callback: (data: NewConversationResponse) => void,
  off: boolean = false
) => {
  const socket = getSocket();

  if (!socket) {
    console.log("Socket is not connected");
    return;
  }

  if (off) {
    socket.off("newConversation", callback);
  } else {
    socket.on("newConversation", callback);
  }
};

export const emitNewConversation = (payload: NewConversationPayload) => {
  const socket = getSocket();

  if (!socket) {
    console.log("Socket is not connected");
    return;
  }

  socket.emit("newConversation", payload);
};

export type GetConversationsResponse = {
  success: boolean;
  msg?: string;
  data?: any[];
};

export type GetMessagesPayload = {
  conversationId: string;
};

export type GetMessagesResponse = {
  success: boolean;
  msg?: string;
  data?: any[];
};

export type SendMessagePayload = {
  conversationId: string;
  content?: string;
  attachment?: string;
};

export type SendMessageResponse = {
  success: boolean;
  msg?: string;
  data?: any;
};

export const getConversations = (
  payload?: (data: GetConversationsResponse) => void,
  off: boolean = false
) => {
  const socket = getSocket();
  if (!socket) return;
  if (off) {
    if (typeof payload === "function") socket.off("getConversations", payload);
  } else if (typeof payload === "function") {
    socket.on("getConversations", payload);
  } else {
    socket.emit("getConversations");
  }
};

export const getMessages = (
  payload: GetMessagesPayload | ((data: GetMessagesResponse) => void),
  off: boolean = false
) => {
  const socket = getSocket();
  if (!socket) return;
  if (off) {
    if (typeof payload === "function") socket.off("getMessages", payload);
  } else if (typeof payload === "function") {
    socket.on("getMessages", payload);
  } else {
    socket.emit("getMessages", payload);
  }
};

export const sendMessage = (payload: SendMessagePayload) => {
  const socket = getSocket();
  if (!socket) return;
  socket.emit("sendMessage", payload);
};

export const onNewMessage = (
  callback: (data: SendMessageResponse) => void,
  off: boolean = false
) => {
  const socket = getSocket();
  if (!socket) return;
  if (off) socket.off("newMessage", callback);
  else socket.on("newMessage", callback);
};

export const onRefreshConversations = (
  callback: () => void,
  off: boolean = false
) => {
  const socket = getSocket();
  if (!socket) return;
  if (off) socket.off("refreshConversations", callback);
  else socket.on("refreshConversations", callback);
};

export type AddContactPayload = {
  name: string;
  email: string;
  avatar: string | null;
};

export type AddContactResponse = {
  success: boolean;
  msg?: string;
  data?: ContactType;
};

export const addContact = (
  payload: AddContactPayload | ((data: AddContactResponse) => void),
  off: boolean = false
) => {
  const socket = getSocket();
  if (!socket) return;
  if (off) {
    if (typeof payload === "function") socket.off("addContact", payload);
  } else if (typeof payload === "function") {
    socket.on("addContact", payload);
  } else {
    socket.emit("addContact", payload);
  }
};

export interface MessageDeletedResponse {
   messageId: string;
   conversationId: string;
}

export interface ConversationDeletedResponse {
   conversationId: string;
}

export const deleteMessage = (data: { messageId: string, conversationId: string }) => {
  const socket = getSocket();
  if (!socket) return;
  socket.emit("deleteMessage", data);
}

export const deleteConversation = (data: { conversationId: string }) => {
  const socket = getSocket();
  if (!socket) return;
  socket.emit("deleteConversation", data);
}

export const onMessageDeleted = (
  callback: (data: MessageDeletedResponse) => void,
  off: boolean = false
) => {
  const socket = getSocket();
  if (!socket) return;
  if (off) socket.off("messageDeleted", callback);
  else socket.on("messageDeleted", callback);
}

export const onConversationDeleted = (
  callback: (data: ConversationDeletedResponse) => void,
  off: boolean = false
) => {
  const socket = getSocket();
  if (!socket) return;
  if (off) socket.off("conversationDeleted", callback);
  else socket.on("conversationDeleted", callback);
}