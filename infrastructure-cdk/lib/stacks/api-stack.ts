import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';

export interface ApiStackProps extends cdk.StackProps {
  stage: string;
  functions: {
    authService: nodejs.NodejsFunction;
    usersService: nodejs.NodejsFunction;
    classroomsService: nodejs.NodejsFunction;
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
      description: 'API Gateway for sjc1990app backend (consolidated 3-service architecture)',
      deployOptions: {
        stageName: stage,
        throttlingRateLimit: 1000,
        throttlingBurstLimit: 2000,
        metricsEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: stage === 'dev', // Detailed logs in dev only
        // API Gateway caching (per ADR-012 optimization)
        cachingEnabled: true,
        cacheClusterEnabled: true,
        cacheClusterSize: '0.5', // 0.5GB cache
        cacheTtl: cdk.Duration.minutes(5), // 5-minute TTL for GET requests
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

    // ===== /auth resource (Auth Service) =====
    const authResource = this.api.root.addResource('auth');
    const authIntegration = createIntegration(functions.authService);

    // POST /auth/register
    authResource
      .addResource('register')
      .addMethod('POST', authIntegration);

    // POST /auth/verify
    authResource
      .addResource('verify')
      .addMethod('POST', authIntegration);

    // GET /auth/pending-approvals (with caching)
    authResource
      .addResource('pending-approvals')
      .addMethod('GET', authIntegration, {
        requestParameters: {
          'method.request.header.Authorization': true,
        },
      });

    // POST /auth/approve/{userId}
    const approveResource = authResource.addResource('approve');
    approveResource
      .addResource('{userId}')
      .addMethod('POST', authIntegration);

    // POST /auth/reject/{userId}
    const rejectResource = authResource.addResource('reject');
    rejectResource
      .addResource('{userId}')
      .addMethod('POST', authIntegration);

    // ===== /users resource (Users Service) =====
    const usersResource = this.api.root.addResource('users');
    const userResource = usersResource.addResource('{userId}');
    const usersIntegration = createIntegration(functions.usersService);

    // PUT /users/{userId}/profile
    userResource
      .addResource('profile')
      .addMethod('PUT', usersIntegration);

    // POST /users/{userId}/profile-photo
    userResource
      .addResource('profile-photo')
      .addMethod('POST', usersIntegration);

    // PUT /users/{userId}/profile-photo-complete
    userResource
      .addResource('profile-photo-complete')
      .addMethod('PUT', usersIntegration);

    // GET /users/{userId}/preferences (with caching)
    // PUT /users/{userId}/preferences
    const preferencesResource = userResource.addResource('preferences');

    preferencesResource.addMethod('GET', usersIntegration, {
      requestParameters: {
        'method.request.path.userId': true,
        'method.request.header.Authorization': true,
      },
    });

    preferencesResource.addMethod('PUT', usersIntegration);

    // GET /users/{userId}/classrooms (with caching)
    // POST /users/{userId}/classrooms
    const userClassroomsResource = userResource.addResource('classrooms');
    const classroomsIntegration = createIntegration(functions.classroomsService);

    userClassroomsResource.addMethod('GET', classroomsIntegration, {
      requestParameters: {
        'method.request.path.userId': true,
        'method.request.header.Authorization': true,
      },
    });

    userClassroomsResource.addMethod('POST', classroomsIntegration);

    // ===== /classrooms resource (Classrooms Service) =====
    const classroomsResource = this.api.root.addResource('classrooms');

    // GET /classrooms (with caching)
    classroomsResource.addMethod('GET', classroomsIntegration, {
      requestParameters: {
        'method.request.header.Authorization': true,
        'method.request.querystring.year': false, // Optional query param
      },
    });

    // GET /classrooms/{classroomId}/members (with caching)
    const classroomResource = classroomsResource.addResource('{classroomId}');
    classroomResource
      .addResource('members')
      .addMethod('GET', classroomsIntegration, {
        requestParameters: {
          'method.request.path.classroomId': true,
          'method.request.header.Authorization': true,
        },
      });

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

    new cdk.CfnOutput(this, 'ApiCacheEnabled', {
      value: 'true',
      description: 'API Gateway caching enabled (5-minute TTL for GET requests)',
    });
  }
}
