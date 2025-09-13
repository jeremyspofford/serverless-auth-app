import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";

export const handler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
    // Log the incoming event request for debugging
    console.log("Event:", JSON.stringify(event, null, 2));

    // Parse the request body if it exists
    const body = event.body ? JSON.parse(event.body) : {};

    // return a response
    return {
        statusCode: 200,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*" 
        },
        body: JSON.stringify({ 
            message: "Hello, World!", 
            timestamp: new Date().toISOString(),
            requestId: context.awsRequestId,
            body: body
        })
    };
};