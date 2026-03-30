export type ExecutorMessageType = "print" | "error";

export type ExecutorMessagePayload = {
    message: string;
    messageType: ExecutorMessageType;
};

export type ExecutorStatusPayload = {
    port: number;
    isAttached: boolean;
};
