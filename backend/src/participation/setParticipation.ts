import { Context, Callback } from 'aws-lambda'
import AWS from 'aws-sdk'
import uuid from 'uuid/v4'

const db = new AWS.DynamoDB.DocumentClient()

import { getProject } from '../project/getProject'

import Response from '../Response'

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

    if(!event.name || event.name.trim() === '' || !event.name|| event.name.trim() === '') {
        return callback(null, Response(400, 'Post must have a name and it must be not empty.'))
    }

    if(!event.percentage) {
        return callback(null, Response(400, 'Post must have a participation percentage.'))
    }

    const project = await getProject(id);


    if(project.error.statusCode) {
        return callback(null, Response(project.error.statusCode, project.error.message))
    }
    
    if(project.data) {
        if(project.data.percentage === 0) {
            return callback(null, Response(400, 'Full'))
        }

        if(event.percentage > project.data.percentage) {
            return callback(null, Response(400, 'Participation percentage is exceeding remaining limit'))
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
        callback(null, Response(200, res.Attributes))
    }).catch(err => callback(null, Response(err.statusCode, err)))
}