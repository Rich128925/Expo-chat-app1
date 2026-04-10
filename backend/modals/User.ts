import { Schema, model, Types } from "mongoose";

export interface UserProps {
  name: string;
  email: string;
  password: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<UserProps>(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

export default model<UserProps>("User", UserSchema);