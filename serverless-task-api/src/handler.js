const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");
const crypto = require("crypto");

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.createTask = async (event) => {
    try {
        const task = {
            taskId: crypto.randomUUID(),
            title: "Learn AWS Lambda",
            status: "OPEN"
        };

        await docClient.send(
            new PutCommand({
                TableName: "Tasks",
                Item: task
            })
        );

        return {
            statusCode: 200,
            body: JSON.stringify(task)
        };
    } catch (error) {
        console.error("Error creating task:", error);

        return {
            statusCode: 500,
            body: JSON.stringify({
                message: "Failed to create task",
                error: error.message
            })
        };
    }
};