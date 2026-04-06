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
  payload?: ((data: GetContactsResponse) => void),
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