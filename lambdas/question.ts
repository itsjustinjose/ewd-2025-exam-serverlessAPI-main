import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
const client = createDDbDocClient();

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const tableName = "CinemaTable";
  const cinemaId = event.pathParameters?.cinemaId;
  const movieId = event.queryStringParameters?.movieId;
  const period = event.queryStringParameters?.period;

  if (!cinemaId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "cinemaId is required" }),
    };
  }

  try {
    if (movieId) {
      // Query for a specific movie in the cinema
      const result = await client.send(
        new QueryCommand({
          TableName: tableName,
          KeyConditionExpression: "cinemaId = :cinemaId AND movieId = :movieId",
          ExpressionAttributeValues: {
            ":cinemaId": Number(cinemaId),
            ":movieId": movieId,
          },
        })
      );
      return {
        statusCode: 200,
        body: JSON.stringify(result.Items),
      };
    } else if (period) {
      // Query for all movies in the cinema for a specific period
      const result = await client.send(
        new QueryCommand({
          TableName: tableName,
          KeyConditionExpression: "cinemaId = :cinemaId",
          FilterExpression: "#period = :period",
          ExpressionAttributeNames: {
            "#period": "period",
          },
          ExpressionAttributeValues: {
            ":cinemaId": Number(cinemaId),
            ":period": period,
          },
        })
      );
      return {
        statusCode: 200,
        body: JSON.stringify(result.Items),
      };
    } else {
      // Query for all movies in the cinema
      const result = await client.send(
        new QueryCommand({
          TableName: tableName,
          KeyConditionExpression: "cinemaId = :cinemaId",
          ExpressionAttributeValues: {
            ":cinemaId": Number(cinemaId),
          },
        })
      );
      return {
        statusCode: 200,
        body: JSON.stringify(result.Items),
      };
    }
  } catch (error) {
    console.error("DynamoDB error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};

function createDDbDocClient() {
  const ddbClient = new DynamoDBClient({ region: process.env.REGION });
  const marshallOptions = {
    convertEmptyValues: true,
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  };
  const unmarshallOptions = {
    wrapNumbers: false,
  };
  const translateConfig = { marshallOptions, unmarshallOptions };
  return DynamoDBDocumentClient.from(ddbClient, translateConfig);
}