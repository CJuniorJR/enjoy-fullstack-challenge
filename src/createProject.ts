import { Context, Callback } from 'aws-lambda'
import IResponse from './IResponse'
import uuid from 'uuid/v4'
import AWS from 'aws-sdk'

const db = new AWS.DynamoDB.DocumentClient()

function response(statusCode: number, body: any): IResponse {
    return { statusCode, body }
}

module.exports.handler = (event: any, context: Context, callback: Callback) => {
    const reqBody = JSON.parse(event.body)
    
    console.log(reqBody)

    if(!reqBody.projectName || reqBody.projectName.trim() === '') {
        return callback(null, response(400, 'Post must have a project name and it must be not empty.'))
    }

    const project = {
        id: uuid(),
        name: reqBody.projectName,
        contributors: [],
        percentage: 100,
        createdAt: new Date().toISOString()
    }

    return db.put({
        TableName: 'projects',
        Item: project
    }).promise().then(() => {
        callback(null, response(201, project))
    }).catch(err => callback(null, response(err.statusCode, err)))
}