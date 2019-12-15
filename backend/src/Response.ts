interface IResponse {
    statusCode: number;
    message: any;
} 

export default function response(statusCode: number, message: any): IResponse {
    return { statusCode: statusCode, message: message }
}