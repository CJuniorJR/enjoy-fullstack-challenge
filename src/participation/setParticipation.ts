import { Context, Callback } from 'aws-lambda'
import IResponse from '../IResponse';
import AWS from 'aws-sdk'
import uuid from 'uuid/v4'

const db = new AWS.DynamoDB.DocumentClient()

function response(statusCode: number, message: any): IResponse {
    return { statusCode: statusCode, message: message }
}

function getProject(id: string) {
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

function updatePercentage(id: string, paramName: string, paramValue: any) {
    return {
        Key: {
          id: id
        },
        TableName: 'projects',
        ConditionExpression: 'attribute_exists(id)',
        UpdateExpression: 'set ' + paramName + ' = :v',
        ExpressionAttributeValues: {
          ':v': paramValue
        },
        ReturnValue: 'ALL_NEW'
    }
}

function updateContributors(id: string, paramValue: any) {
    return {
        Key: {
          id: id
        },
        TableName: 'projects',
        ConditionExpression: 'attribute_exists(id)',
        UpdateExpression: 'set #contributors = list_append(if_not_exists(#contributors, :empty_list), :contributor)',
        ExpressionAttributeNames: {
          '#contributors': 'contributors'
        },
        ExpressionAttributeValues: {
          ':contributor': [paramValue],
          ':empty_list': []
        },
        ReturnValue: 'ALL_NEW'
    }
}

module.exports.handler = async (event: any, context: Context, callback: Callback) => {
    const id = event.pathParameters.id
    let newPercentage = null;

    if(!event.name.first || event.name.first.trim() === '' || !event.name.last || event.name.last.trim() === '') {
        return callback(null, response(400, 'Post must have a first and a last name and they must be not empty.'))
    }

    if(!event.percentage) {
        return callback(null, response(400, 'Post must have a participation percentage.'))
    }

    const project = await getProject(id);


    if(project.error.statusCode) {
        return callback(null, response(project.error.statusCode, project.error.message))
    }
    
    if(project.data) {
        if(project.data.percentage === 0) {
            return callback(null, response(400, 'Full'))
        }

        if(event.percentage > project.data.percentage) {
            return callback(null, response(400, 'Participation percentage is exceeding remaining limit'))
        }

        newPercentage = project.data.percentage - event.percentage
    }

    const contributor = {
        id: uuid(),
        name: event.name,
        participationPercentage: event.percentage
    }

    await db.update(updatePercentage(id, 'percentage', newPercentage)).promise()

    return await db.update(updateContributors(id, contributor)).promise().then(res => {
        callback(null, response(200, res.Attributes))
    }).catch(err => callback(null, response(err.statusCode, err)))
}