import { Context, Callback } from 'aws-lambda'
import AWS from 'aws-sdk'
import uuid from 'uuid/v4'

const db = new AWS.DynamoDB.DocumentClient()

import { getProject } from '../project/getProject'
import Response from '../Response'

module.exports.handler = async (event: any, context: Context, callback: Callback) => {
    const projectId = event.pathParameters.id
    const contributorId = event.pathParameters.contributorId

    const project = await getProject(projectId)

    if(project.data) {

        const indexToRemove = project.data.contributors.map((contributor: any) => {
            return contributor.id
        }).indexOf(contributorId);

        if(indexToRemove === -1) {
            return callback(null, Response(404, 'Not found'))
        }
    
        return await db.update({
            Key: {
                id: projectId
            },
            TableName: 'projects',
            UpdateExpression: `REMOVE contributors[${indexToRemove}]`
        }).promise().then(res => {
            callback(null, Response(200, res.Attributes))
        }).catch(err => callback(null, Response(err.statusCode, err)))
    }
}
