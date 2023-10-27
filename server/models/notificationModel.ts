import mongoose, { Document, Model, Schema } from 'mongoose';

interface INotification {
    title: string;
    message: string;
    status: string;
    userId: string;
}

const notificationSchema = new Schema<INotification>({
    title: { type: String, required: true },
    userId: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, default: "sent" },
}, { timestamps: true });

const notificationModel: Model<INotification> = mongoose.model("Notification", notificationSchema);

export default notificationModel;