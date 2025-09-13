import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as path from 'path';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class InfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here
    const helloLambda = new lambda.Function(this, 'HelloHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler', // index.ts -> handler function
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/dist')),
      environment: {
        NODE_ENV: 'production',
      },
    });

    const api = new apigateway.RestApi(this, 'HelloApi', {
      restApiName: 'Serverless Auth Service',
      description: 'API Gateway for Serverless Auth Service',
    });

    const helloIntegration = new apigateway.LambdaIntegration(helloLambda);
    api.root.addMethod('GET', helloIntegration);

    // example resource
    // const queue = new sqs.Queue(this, 'InfrastructureQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
  }
}
