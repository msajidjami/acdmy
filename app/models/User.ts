// app/models/User.ts

import mongoose, {
  Schema,
  Model,
  HydratedDocument,
  InferSchemaType,
} from "mongoose";
import bcrypt from "bcryptjs";

export type UserRole =
  | "user"
  | "admin"
  | "education-admin"
  | "darul-ifta-admin"
  | "section1-admin"
  | "section2-admin";

const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email address"],
    },

    password: {
      type: String,
      required: function (this: any) {
        return this.provider === "credentials";
      },
    },

    provider: {
      type: String,
      enum: ["credentials", "google"],
      default: "credentials",
    },

    googleId: {
      type: String,
      unique: true,
      sparse: true,
      default: undefined,
    },

    avatar: {
      type: String,
      default: "",
    },

    role: {
      type: String,
      enum: [
        "user",
        "admin",
        "education-admin",
        "darul-ifta-admin",
        "section1-admin",
        "section2-admin",
      ],
      default: "user",
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    emailVerified: {
      type: Boolean,
      default: false,
    },

    loginCount: {
      type: Number,
      default: 0,
    },

    lastLogin: {
      type: Date,
      default: null,
    },
    profileCompleted: {
  type: Boolean,
  default: false,
},
accountType: {
    type: String,
    enum: ["student", "parent"],
    default: undefined,
},
  },
  {
    timestamps: true,
  },
  
);

export type IUser = InferSchemaType<typeof UserSchema>;

export interface IUserMethods {
  comparePassword(password: string): Promise<boolean>;
}

export type UserDocument = HydratedDocument<IUser, IUserMethods>;

UserSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  if (!this.password) return;

  this.password = await bcrypt.hash(this.password, 12);
});


UserSchema.method(
  "comparePassword",
  async function (password: string): Promise<boolean> {
    if (!this.password) return false;

    return bcrypt.compare(password, this.password);
  }
);

const User =
  (mongoose.models.User as Model<IUser, {}, IUserMethods>) ||
  mongoose.model<IUser, Model<IUser, {}, IUserMethods>>(
    "User",
    UserSchema
  );

export default User;