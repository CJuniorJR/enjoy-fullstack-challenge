interface IResponse {
    statusCode: number;
    data: any;
} 

export default function response(statusCode: number, data: any): IResponse {
    return { statusCode: statusCode, data: data }
}