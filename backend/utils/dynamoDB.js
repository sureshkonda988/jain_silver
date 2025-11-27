const { dynamoDocClient, AWS_CONFIG } = require('../config/aws');
const { PutCommand, GetCommand, UpdateCommand, DeleteCommand, ScanCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');

/**
 * Put item in DynamoDB
 * @param {Object} item - Item to put
 * @returns {Promise<Object>} - Put result
 */
const putItem = async (item, tableName = AWS_CONFIG.DYNAMODB_TABLE_NAME) => {
  try {
    const command = new PutCommand({
      TableName: tableName,
      Item: item,
    });
    await dynamoDocClient.send(command);
    return item;
  } catch (error) {
    console.error('DynamoDB Put Error:', error);
    throw new Error(`Failed to put item in DynamoDB: ${error.message}`);
  }
};

/**
 * Get item from DynamoDB
 * @param {String} key - Primary key value
 * @param {String} keyName - Primary key name (default: 'id')
 * @returns {Promise<Object|null>} - Item or null
 */
const getItem = async (key, keyName = 'id', tableName = AWS_CONFIG.DYNAMODB_TABLE_NAME) => {
  try {
    const command = new GetCommand({
      TableName: tableName,
      Key: {
        [keyName]: key,
      },
    });
    const result = await dynamoDocClient.send(command);
    return result.Item || null;
  } catch (error) {
    console.error('DynamoDB Get Error:', error);
    throw new Error(`Failed to get item from DynamoDB: ${error.message}`);
  }
};

/**
 * Update item in DynamoDB
 * @param {String} key - Primary key value
 * @param {Object} updates - Fields to update
 * @param {String} keyName - Primary key name (default: 'id')
 * @returns {Promise<Object>} - Updated item
 */
const updateItem = async (key, updates, keyName = 'id', tableName = AWS_CONFIG.DYNAMODB_TABLE_NAME) => {
  try {
    const updateExpression = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    Object.keys(updates).forEach((field, index) => {
      const nameKey = `#field${index}`;
      const valueKey = `:value${index}`;
      updateExpression.push(`${nameKey} = ${valueKey}`);
      expressionAttributeNames[nameKey] = field;
      expressionAttributeValues[valueKey] = updates[field];
    });

    const command = new UpdateCommand({
      TableName: tableName,
      Key: {
        [keyName]: key,
      },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    });

    const result = await dynamoDocClient.send(command);
    return result.Attributes;
  } catch (error) {
    console.error('DynamoDB Update Error:', error);
    throw new Error(`Failed to update item in DynamoDB: ${error.message}`);
  }
};

/**
 * Delete item from DynamoDB
 * @param {String} key - Primary key value
 * @param {String} keyName - Primary key name (default: 'id')
 * @returns {Promise<Boolean>} - Success status
 */
const deleteItem = async (key, keyName = 'id', tableName = AWS_CONFIG.DYNAMODB_TABLE_NAME) => {
  try {
    const command = new DeleteCommand({
      TableName: tableName,
      Key: {
        [keyName]: key,
      },
    });
    await dynamoDocClient.send(command);
    return true;
  } catch (error) {
    console.error('DynamoDB Delete Error:', error);
    throw new Error(`Failed to delete item from DynamoDB: ${error.message}`);
  }
};

/**
 * Scan all items from DynamoDB table
 * @param {Object} filterExpression - Optional filter expression
 * @returns {Promise<Array>} - Array of items
 */
const scanItems = async (filterExpression = null, tableName = AWS_CONFIG.DYNAMODB_TABLE_NAME) => {
  try {
    const params = {
      TableName: tableName,
    };

    if (filterExpression) {
      params.FilterExpression = filterExpression;
    }

    const command = new ScanCommand(params);
    const result = await dynamoDocClient.send(command);
    return result.Items || [];
  } catch (error) {
    console.error('DynamoDB Scan Error:', error);
    throw new Error(`Failed to scan items from DynamoDB: ${error.message}`);
  }
};

/**
 * Query items from DynamoDB
 * @param {String} keyConditionExpression - Key condition expression
 * @param {Object} expressionAttributeValues - Expression attribute values
 * @returns {Promise<Array>} - Array of items
 */
const queryItems = async (keyConditionExpression, expressionAttributeValues, tableName = AWS_CONFIG.DYNAMODB_TABLE_NAME) => {
  try {
    const command = new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: keyConditionExpression,
      ExpressionAttributeValues: expressionAttributeValues,
    });
    const result = await dynamoDocClient.send(command);
    return result.Items || [];
  } catch (error) {
    console.error('DynamoDB Query Error:', error);
    throw new Error(`Failed to query items from DynamoDB: ${error.message}`);
  }
};

module.exports = {
  putItem,
  getItem,
  updateItem,
  deleteItem,
  scanItems,
  queryItems,
};

