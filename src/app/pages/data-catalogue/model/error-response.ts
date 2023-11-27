export class ErrorResponse {
    statusCode: string;
    technicalMessage: string;
    errorCode: string;
    userMessage?: string;

    constructor() { }
}