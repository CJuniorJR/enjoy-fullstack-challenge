import { Context, Callback } from 'aws-lambda'
import IResponse from './IResponse';
import AWS from 'aws-sdk'

const db = new AWS.DynamoDB.DocumentClient()

function response(statusCode: number, body: any): IResponse {
    return { statusCode, body }
}

function getProject(id: string) {
    const params = {
        Key: {
            id
        },
        TableName: 'project'
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

function updateParams(id: string, paramName: string, paramValue: any) {
    return {
        Key: {
          id: id
        },
        TableName: 'project',
        ConditionExpression: 'attribute_exists(id)',
        UpdateExpression: 'set ' + paramName + ' = :v',
        ExpressionAttributeValues: {
          ':v': paramValue
        },
        ReturnValue: 'ALL_NEW'
    }
}

module.exports.handler = async (event: any, context: Context, callback: Callback) => {
    const reqBody = JSON.parse(event.body)
    const id = event.pathParameters.id
    let newPercentage = null;

    if(!reqBody.name.first || reqBody.name.first.trim() === '' || !reqBody.name.last || reqBody.name.last.trim() === '') {
        return callback(null, response(400, 'Post must have a first and a last name and they must be not empty.'))
    }

    if(!reqBody.participation || reqBody.participation.trim() === '') {
        return callback(null, response(400, 'Post must have a participation percentage.'))
    }

    const project = await getProject(id);

    if(project.error) {
        return callback(null, response(project.error.statusCode, project.error.message))
    } else if(project.data) {
        if(reqBody.participation > project.data.percentage) {
            return callback(null, response(400, 'Participation percentage is exceeding remaining limit'))
        }
        newPercentage = project.data.percentage - reqBody.participation
    }

    const participation = {
        name: reqBody.name,
        participation: reqBody.participation
    }

    await db.update(updateParams(id, 'percentage', newPercentage)).promise()

    return await db.update(updateParams(id, 'contributors', participation)).promise().then(res => {
        callback(null, response(200, res.Attributes))
    }).catch(err => callback(null, response(err.statusCode, err)))
}