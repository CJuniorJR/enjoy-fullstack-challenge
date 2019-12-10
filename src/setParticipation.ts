import { Handler, Context, Callback } from 'aws-lambda'
import IResponse from './IResponse';
import uuid from 'uuid/v4'
import AWS from 'aws-sdk'

const db = new AWS.DynamoDB.DocumentClient()

function response(statusCode: number, body: any): IResponse {
    return { statusCode, body }
}

module.exports.handler = (event: any, context: Context, callback: Callback) => {
    const reqBody = JSON.parse(event.body)

    if(!reqBody.name.first || reqBody.name.fisrt.trim() === '' || !reqBody.name.last || reqBody.name.last.trim() === '') {
        return callback(null, response(400, 'Post must have a first and a last name and they must be not empty.'))
    }

    if(!reqBody.participation || reqBody.participation.trim() === '') {
        return callback(null, response(400, 'Post must have a participation percentage.'))
    }

    const participation = {
        id: uuid(),
        name: reqBody.name,
        participation: reqBody.participation,
        createdAt: new Date().toISOString()
    }

    return db.put({
        TableName: 'participations',
        Item: participation
    }).promise().then(() => {
        callback(null, response(201, participation))
    }).catch(err => callback(null, response(err.statusCode, err)))
}