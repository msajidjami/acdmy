// app/models/Counter.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICounter extends Document {
  enrolled: number;
  completed: number;
  teachers: number;
  updatedAt: Date;
}

// Define the interface for static methods
interface CounterModel extends Model<ICounter> {
  getCounter(): Promise<ICounter>;
  updateCounter(updates: Partial<ICounter>): Promise<ICounter>;
  incrementCounter(field: keyof Pick<ICounter, 'enrolled' | 'completed' | 'teachers'>, amount?: number): Promise<ICounter>;
}

const CounterSchema: Schema<ICounter> = new Schema({
  enrolled: { 
    type: Number, 
    default: 500,
    min: 0
  },
  completed: { 
    type: Number, 
    default: 1000,
    min: 0
  },
  teachers: { 
    type: Number, 
    default: 50,
    min: 0
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Define static methods
CounterSchema.statics.getCounter = async function(): Promise<ICounter> {
  let counter = await this.findOne();
  if (!counter) {
    counter = await this.create({});
  }
  return counter;
};

CounterSchema.statics.updateCounter = async function(updates: Partial<ICounter>): Promise<ICounter> {
  let counter = await this.findOne();
  if (!counter) {
    counter = await this.create(updates);
  } else {
    Object.assign(counter, updates);
    counter.updatedAt = new Date();
    await counter.save();
  }
  return counter;
};

CounterSchema.statics.incrementCounter = async function(
  field: keyof Pick<ICounter, 'enrolled' | 'completed' | 'teachers'>, 
  amount: number = 1
): Promise<ICounter> {
  let counter = await this.findOne();
  if (!counter) {
    counter = await this.create({ [field]: amount });
  } else {
    counter[field] = (counter[field] || 0) + amount;
    counter.updatedAt = new Date();
    await counter.save();
  }
  return counter;
};

// Create and export the model
const Counter = mongoose.models.Counter as CounterModel || 
  mongoose.model<ICounter, CounterModel>('Counter', CounterSchema);

export default Counter;