import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';

export interface ApiStackProps extends cdk.StackProps {
  stage: string;
  functions: {
    authRegister: nodejs.NodejsFunction;
    authVerify: nodejs.NodejsFunction;
    authPendingApprovals: nodejs.NodejsFunction;
    authApprove: nodejs.NodejsFunction;
    authReject: nodejs.NodejsFunction;
    updateProfile: nodejs.NodejsFunction;
    uploadPhoto: nodejs.NodejsFunction;
    completePhotoUpload: nodejs.NodejsFunction;
    getPreferences: nodejs.NodejsFunction;
    updatePreferences: nodejs.NodejsFunction;
    listClassrooms: nodejs.NodejsFunction;
    assignClassrooms: nodejs.NodejsFunction;
    getUserClassrooms: nodejs.NodejsFunction;
    getClassroomMembers: nodejs.NodejsFunction;
  };
}

export class ApiStack extends cdk.Stack {
  public readonly api: apigateway.RestApi;
  public readonly apiUrl: string;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const { stage, functions } = props;
    const serviceName = 'sjc1990app';

    // Create REST API
    this.api = new apigateway.RestApi(this, 'Api', {
      restApiName: `${serviceName}-${stage}-api`,
      description: 'API Gateway for sjc1990app backend',
      deployOptions: {
        stageName: stage,
        throttlingRateLimit: 1000,
        throttlingBurstLimit: 2000,
        metricsEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: stage === 'dev', // Detailed logs in dev only
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS, // TODO: Restrict in production
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token',
        ],
        maxAge: cdk.Duration.hours(1),
      },
      cloudWatchRole: true, // Enable CloudWatch logging
    });

    // Lambda integration options
    const lambdaIntegrationOptions = {
      proxy: true, // Lambda proxy integration
      allowTestInvoke: true,
    };

    // Helper to create Lambda integration
    const createIntegration = (fn: nodejs.NodejsFunction) => {
      return new apigateway.LambdaIntegration(fn, lambdaIntegrationOptions);
    };

    // /auth resource
    const authResource = this.api.root.addResource('auth');

    // POST /auth/register
    authResource
      .addResource('register')
      .addMethod('POST', createIntegration(functions.authRegister));

    // POST /auth/verify
    authResource
      .addResource('verify')
      .addMethod('POST', createIntegration(functions.authVerify));

    // GET /auth/pending-approvals
    authResource
      .addResource('pending-approvals')
      .addMethod('GET', createIntegration(functions.authPendingApprovals));

    // POST /auth/approve/{userId}
    const approveResource = authResource.addResource('approve');
    approveResource
      .addResource('{userId}')
      .addMethod('POST', createIntegration(functions.authApprove));

    // POST /auth/reject/{userId}
    const rejectResource = authResource.addResource('reject');
    rejectResource
      .addResource('{userId}')
      .addMethod('POST', createIntegration(functions.authReject));

    // /users resource
    const usersResource = this.api.root.addResource('users');
    const userResource = usersResource.addResource('{userId}');

    // PUT /users/{userId}/profile
    userResource
      .addResource('profile')
      .addMethod('PUT', createIntegration(functions.updateProfile));

    // POST /users/{userId}/profile-photo
    userResource
      .addResource('profile-photo')
      .addMethod('POST', createIntegration(functions.uploadPhoto));

    // PUT /users/{userId}/profile-photo-complete
    userResource
      .addResource('profile-photo-complete')
      .addMethod('PUT', createIntegration(functions.completePhotoUpload));

    // GET /users/{userId}/preferences
    // PUT /users/{userId}/preferences
    const preferencesResource = userResource.addResource('preferences');
    preferencesResource.addMethod('GET', createIntegration(functions.getPreferences));
    preferencesResource.addMethod('PUT', createIntegration(functions.updatePreferences));

    // GET /users/{userId}/classrooms
    // POST /users/{userId}/classrooms
    const userClassroomsResource = userResource.addResource('classrooms');
    userClassroomsResource.addMethod('GET', createIntegration(functions.getUserClassrooms));
    userClassroomsResource.addMethod('POST', createIntegration(functions.assignClassrooms));

    // /classrooms resource
    const classroomsResource = this.api.root.addResource('classrooms');

    // GET /classrooms
    classroomsResource.addMethod('GET', createIntegration(functions.listClassrooms));

    // GET /classrooms/{classroomId}/members
    const classroomResource = classroomsResource.addResource('{classroomId}');
    classroomResource
      .addResource('members')
      .addMethod('GET', createIntegration(functions.getClassroomMembers));

    // API URL
    this.apiUrl = this.api.url;

    // CloudFormation Outputs
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: this.apiUrl,
      description: 'API Gateway endpoint URL',
      exportName: `${serviceName}-${stage}-api-url`,
    });

    new cdk.CfnOutput(this, 'ApiId', {
      value: this.api.restApiId,
      description: 'API Gateway REST API ID',
      exportName: `${serviceName}-${stage}-api-id`,
    });
  }
}
