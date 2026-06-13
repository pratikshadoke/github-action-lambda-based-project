// const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
// const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");
// const crypto = require("crypto");

// const client = new DynamoDBClient({});
// const docClient = DynamoDBDocumentClient.from(client);

// exports.createTask = async (event) => {
//     try {
//         const task = {
//             taskId: crypto.randomUUID(),
//             title: "Learn AWS Lambda",
//             status: "OPEN"
//         };

//         await docClient.send(
//             new PutCommand({
//                 TableName: "Tasks",
//                 Item: task
//             })
//         );

//         return {
//             statusCode: 200,
//             body: JSON.stringify(task)
//         };
//     } catch (error) {
//         console.error("Error creating task:", error);

//         return {
//             statusCode: 500,
//             body: JSON.stringify({
//                 message: "Failed to create task",
//                 error: error.message
//             })
//         };
//     }
// };



const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
    DynamoDBDocumentClient,
    PutCommand,
    ScanCommand,
    DeleteCommand
} = require("@aws-sdk/lib-dynamodb");

const crypto = require("crypto");

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const {
    UpdateCommand
  } = require("@aws-sdk/lib-dynamodb");
exports.createTask = async (event) => {

    try {

        const method = event.requestContext?.http?.method;

        // GET /tasks
        if (method === "GET") {

            const result = await docClient.send(
                new ScanCommand({
                    TableName: "Tasks"
                })
            );
        
            return {
                statusCode: 200,
                headers: {
                    "Access-Control-Allow-Origin": "*"
                },
                body: JSON.stringify(result.Items || [])
            };
        }
        if (method === "PUT") {

            const taskId = event.pathParameters?.id;
        
            await docClient.send(
                new UpdateCommand({
                    TableName: "Tasks",
                    Key: {
                        taskId
                    },
                    UpdateExpression:
                        "SET #status = :status",
                    ExpressionAttributeNames: {
                        "#status": "status"
                    },
                    ExpressionAttributeValues: {
                        ":status": "DONE"
                    }
                })
            );
        
            return {
                statusCode: 200,
                body: JSON.stringify({
                    message: "Task completed"
                })
            };
        }
        // POST /tasks
        if (method === "POST") {

            const body = JSON.parse(event.body || "{}");
        
            const task = {
                taskId: crypto.randomUUID(),
                title: body.title,
                status: "OPEN",
                createdAt: new Date().toISOString()
            };
        
            await docClient.send(
                new PutCommand({
                    TableName: "Tasks",
                    Item: task
                })
            );
        
            return {
                statusCode: 201,
                headers: {
                    "Access-Control-Allow-Origin": "*"
                },
                body: JSON.stringify(task)
            };
        }

        // DELETE /tasks/{id}
        if (method === "DELETE") {

            const taskId = event.pathParameters?.id;

            await docClient.send(
                new DeleteCommand({
                    TableName: "Tasks",
                    Key: {
                        taskId
                    }
                })
            );

            return {
                statusCode: 200,
                body: JSON.stringify({
                    message: "Task deleted"
                })
            };
        }

        return {
            statusCode: 400,
            body: JSON.stringify({
                message: "Unsupported method"
            })
        };

    } catch (error) {

        console.error(error);

        return {
            statusCode: 500,
            body: JSON.stringify({
                error: error.message
            })
        };
    }
};