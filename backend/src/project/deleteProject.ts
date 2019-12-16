import { Context, Callback } from 'aws-lambda'
import AWS from 'aws-sdk'
import uuid from 'uuid/v4'

const db = new AWS.DynamoDB.DocumentClient()

import { getProject } from '../project/getProject'
import Response from '../Response'

module.exports.handler = async (event: any, context: Context, callback: Callback) => {
    const id = event.pathParameters.id

    const project = await getProject(id)

    if(project.data) {
        const params = {
            Key: {
                id: project.data.id
            },
            TableName: 'projects'
        }

        return db.delete(params).promise()
            .then(() => callback(null, Response(200, 'Project deleted successfully')))
            .catch((err) => callback(null, Response(err.statusCode, err)))
    } else {
        return callback(null, Response(404, 'Project not found'))
    }
}