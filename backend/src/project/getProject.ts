import { Context, Callback } from 'aws-lambda'
import AWS from 'aws-sdk'

const db = new AWS.DynamoDB.DocumentClient()

import Response from '../Response'

export function getProject(id: string) {
    const params = {
        Key: {
            id
        },
        TableName: 'projects'
    }

    return db.get(params).promise().then(res => {
        if(res.Item) {
            return { data: res.Item, error: { statusCode: null, message: null } }
        } else {
            return { data: null, error: { statusCode: 404, message: 'Project not found' } }
        }
    }).catch(err => { 
        return { 
            data: null, 
            error: { statusCode: err.statusCode, message: err }
        }
    })
}

module.exports.handler = async (event: any, context: Context, callback: Callback) => {
    const id = event.pathParameters.id

    const project = await getProject(id)

    if(project.error.statusCode) {
        return callback(null, Response(project.error.statusCode, project.error.message))
    }

    return callback(null, Response(200, project))
}