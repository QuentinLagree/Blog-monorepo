export interface Post {
    id?: number;
    authorId: number,
    title: string,
    content: string,
    description: string,
    published_at: string,
    created_at: Date,
    updated_at?: Date,
}