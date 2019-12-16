import { Context, Callback } from 'aws-lambda'
import AWS from 'aws-sdk'
const db = new AWS.DynamoDB.DocumentClient()

import Response from '../Response'

function sortByDate(a: any, b: any) {
    if (a.createdAt > b.createdAt) {
      return -1;
    } else return 1;
  }

module.exports.handler = (event: any, context: Context, callback: Callback) => {
    return db.scan({TableName: 'projects'}).promise().then(res => {
        if(res.Items) {
            return callback(null, Response(200, res.Items.sort(sortByDate)))
        }
        return callback(null, Response(200, res.Items)
    )}).catch(err => callback(null, Response(err.statusCode, err)))
}