/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  initAuthCreds,
  BufferJSON,
  proto,
  type AuthenticationCreds,
  type AuthenticationState,
} from '@whiskeysockets/baileys';
import connectDB from '@/app/lib/dbConnect';
import mongoose from 'mongoose';

/* ============================================================
   Mongo-backed auth state for Baileys
   ============================================================ */

interface IWhatsAppAuth {
  key: string;
  value: string;
}

const WhatsAppAuthSchema = new mongoose.Schema<IWhatsAppAuth>(
  {
    key: { type: String, required: true, unique: true, index: true },
    value: { type: String, required: true },
  },
  { timestamps: true, collection: 'whatsapp_auth' }
);

const WhatsAppAuth =
  (mongoose.models.WhatsAppAuth as mongoose.Model<IWhatsAppAuth>) ||
  mongoose.model<IWhatsAppAuth>('WhatsAppAuth', WhatsAppAuthSchema);

/* ------------------------------------------------------------ */

export async function useMongoAuthState(): Promise<{
  state: AuthenticationState;
  saveCreds: () => Promise<void>;
}> {
  await connectDB();

  /* ---------- Write ---------- */
  const writeData = async (data: any, key: string): Promise<void> => {
    const value = JSON.stringify(data, BufferJSON.replacer);
    await WhatsAppAuth.updateOne(
      { key },
      { $set: { key, value } },
      { upsert: true }
    );
  };

  /* ---------- Read ---------- */
  const readData = async (key: string): Promise<any | null> => {
    const doc: any = await WhatsAppAuth.findOne({ key }).lean();
    if (!doc?.value) return null;
    try {
      return JSON.parse(doc.value, BufferJSON.reviver);
    } catch {
      return null;
    }
  };

  /* ---------- Remove ---------- */
  const removeData = async (key: string): Promise<void> => {
    await WhatsAppAuth.deleteOne({ key });
  };

  /* ---------- Creds ---------- */
  const creds: AuthenticationCreds =
    (await readData('creds')) || initAuthCreds();

  return {
    state: {
      creds,
      keys: {
        get: async (type: any, ids: string[]) => {
          const data: { [id: string]: any } = {};

          await Promise.all(
            ids.map(async (id) => {
              const value = await readData(`${type}-${id}`);
              if (value) {
                if (type === 'app-state-sync-key') {
                  data[id] =
                    proto.Message.AppStateSyncKeyData.fromObject(value);
                } else {
                  data[id] = value;
                }
              }
            })
          );

          return data as any;
        },

        set: async (data: any) => {
          const tasks: Promise<void>[] = [];

          for (const category in data) {
            for (const id in data[category]) {
              const value = data[category][id];
              const key = `${category}-${id}`;
              tasks.push(value ? writeData(value, key) : removeData(key));
            }
          }

          await Promise.all(tasks);
        },
      },
    },
    saveCreds: () => writeData(creds, 'creds'),
  };
}