import { Queue } from "bullmq"

export type QueueItem = {
    uniqueName: string,
    queue: Queue;
}