import mongoose, { Document, Model, Schema } from "mongoose";

export interface userInterface {
    [Key: string]: string | number;
}

interface IQuestion extends Document {
    user: userInterface;
    question: string;
    questionRelies?: IQuestion[]
}

interface IReview extends Document {
    user: userInterface;
    rating: number;
    comment: string;
    replies: [object]
}

interface ILink extends Document {
    title: string;
    url: string;
}

interface ICourseData extends Document {
    title: string;
    description: string;
    videoUrl: string;
    videoThumbnail: object;
    videoSection: string;
    videoLength: number;
    videoPlayer: string;
    links: ILink[];
    suggestions: string;
    questions: IQuestion[];
}

interface ICourse extends Document {
    name: string;
    description: string;
    createdBy: object
    price: number;
    estimatedPrice?: number;
    thumbnail: object;
    tags: string;
    level: string;
    demoUrl: string;
    benefits: { title: string }[];
    prerequisites: { title: string }[];
    reviews: IReview[];
    courseData: ICourseData[];
    ratings?: number;
    purchased?: number;
}

const reviewsSchema = new Schema<IReview>({
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, default: 0 },
    comment: String,
    replies: [Object]
});

const linkSchema = new Schema<ILink>({
    title: String,
    url: String,
})

const commentSchema = new Schema<IQuestion>({
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    question: String,
    questionRelies: [Object],
});

const courseDataSchema = new Schema<ICourseData>({
    title: { type: String, required: [true, "Please provide course title"] },
    description: { type: String, required: [true, "Please provide course title"] },
    videoUrl: { type: String, required: [true, "Please provide video url"] },
    videoSection: { type: String, required: [true, "Please provide video section"] },
    videoLength: Number,
    videoPlayer: String,
    links: [linkSchema],
    suggestions: String,
    questions: [commentSchema]
});

const courseSchema = new Schema<ICourse>({
    name: { type: String, required: [true, "Please provide course name"] },
    description: { type: String, required: [true, "Please provide course description"] },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    price: { type: Number, required: [true, "Please provide course price"] },
    estimatedPrice: { type: Number },
    thumbnail: {
        public_id: { type: String, required: [true, "Please provide thumbnail public id"] },
        url: { type: String, required: [true, "Please provide thumbnail url"] }
    },
    tags: { type: String },
    level: { type: String, required: true },
    demoUrl: { type: String, required: true },
    benefits: [{ title: String }],
    prerequisites: [{ title: String }],
    reviews: [reviewsSchema],
    courseData: [courseDataSchema],
    ratings: { type: Number, default: 0 },
    purchased: { type: Number, default: 0 },
}, { timestamps: true });

const courseModel: Model<ICourse> = mongoose.model("Course", courseSchema);

export default courseModel;