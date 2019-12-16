import { Context, Callback } from 'aws-lambda'
import uuid from 'uuid/v4'
import AWS from 'aws-sdk'

const db = new AWS.DynamoDB.DocumentClient()

import Response from '../Response'

module.exports.handler = (event: any, context: Context, callback: Callback) => {
    if(!event.projectName || event.projectName.trim() === '') {
        return callback(null, Response(400, 'Post must have a project name and it must be not empty.'))
    }

    const project = {
        id: uuid(),
        name: event.projectName,
        contributors: [],
        percentage: 100,
        createdAt: new Date().toISOString()
    }

    return db.put({
        TableName: 'projects',
        Item: project
    }).promise().then(() => {
        return callback(null, Response(201, project))
    }).catch(err => callback(null, Response(err.statusCode, err)))
}