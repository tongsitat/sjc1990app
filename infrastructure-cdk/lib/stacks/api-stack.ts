import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
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

    // Create CloudWatch Log Group for API Gateway access logs
    const accessLogGroup = new logs.LogGroup(this, 'ApiAccessLogs', {
      logGroupName: `/aws/apigateway/${serviceName}-${stage}-access-logs`,
      retention: logs.RetentionDays.ONE_MONTH, // 30 days retention
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Delete logs when stack is destroyed (dev only)
    });

    // Create REST API
    this.api = new apigateway.RestApi(this, 'Api', {
      restApiName: `${serviceName}-${stage}-api`,
      description: 'API Gateway for sjc1990app backend (consolidated 3-service architecture)',
      deployOptions: {
        stageName: stage,
        // Security hardening: Reduced rate limits (per SECURITY_INCIDENT_2025-12-11.md)
        throttlingRateLimit: 10, // 10 requests/second (reduced from 1000)
        throttlingBurstLimit: 20, // 20 burst (reduced from 2000)
        metricsEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: stage === 'dev', // Detailed logs in dev only
        // Security: API Gateway access logging (tracks source IP, user agent, endpoint)
        accessLogDestination: new apigateway.LogGroupLogDestination(accessLogGroup),
        accessLogFormat: apigateway.AccessLogFormat.custom(
          JSON.stringify({
            requestId: '$context.requestId',
            sourceIp: '$context.identity.sourceIp',
            requestTime: '$context.requestTime',
            httpMethod: '$context.httpMethod',
            resourcePath: '$context.resourcePath',
            status: '$context.status',
            protocol: '$context.protocol',
            responseLength: '$context.responseLength',
            userAgent: '$context.identity.userAgent',
            errorMessage: '$context.error.message',
            errorType: '$context.error.messageString',
          })
        ),
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

    // ===== WAF (Web Application Firewall) =====
    // Protect API against common web attacks
    const webAcl = new wafv2.CfnWebACL(this, 'ApiWebACL', {
      name: `${serviceName}-${stage}-api-waf`,
      description: 'WAF rules to protect API Gateway from common attacks',
      scope: 'REGIONAL', // For API Gateway (not CloudFront)
      defaultAction: { allow: {} },
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: `${serviceName}-${stage}-api-waf-metrics`,
      },
      rules: [
        // Rule 1: AWS Managed Core Rule Set (SQL injection, XSS, etc.)
        {
          name: 'AWSManagedRulesCommonRuleSet',
          priority: 10,
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesCommonRuleSet',
            },
          },
          overrideAction: { none: {} },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'AWSManagedRulesCommonRuleSetMetric',
          },
        },
        // Rule 2: AWS Managed Known Bad Inputs (malformed requests)
        {
          name: 'AWSManagedRulesKnownBadInputsRuleSet',
          priority: 20,
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesKnownBadInputsRuleSet',
            },
          },
          overrideAction: { none: {} },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'AWSManagedRulesKnownBadInputsRuleSetMetric',
          },
        },
        // Rule 3: Rate-based rule (block IPs with >100 requests in 5 minutes)
        {
          name: 'RateLimitRule',
          priority: 30,
          statement: {
            rateBasedStatement: {
              limit: 100, // 100 requests per 5 minutes per IP
              aggregateKeyType: 'IP',
            },
          },
          action: { block: {} },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'RateLimitRuleMetric',
          },
        },
      ],
    });

    // Associate WAF with API Gateway
    const webAclAssociation = new wafv2.CfnWebACLAssociation(this, 'ApiWebACLAssociation', {
      resourceArn: `arn:aws:apigateway:${this.region}::/restapis/${this.api.restApiId}/stages/${stage}`,
      webAclArn: webAcl.attrArn,
    });

    // Ensure WAF is created before association
    webAclAssociation.addDependency(webAcl);

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

    new cdk.CfnOutput(this, 'AccessLogGroup', {
      value: accessLogGroup.logGroupName,
      description: 'CloudWatch Log Group for API Gateway access logs (includes source IPs)',
      exportName: `${serviceName}-${stage}-access-log-group`,
    });

    new cdk.CfnOutput(this, 'RateLimits', {
      value: '10 req/sec, 20 burst',
      description: 'API Gateway rate limiting (security hardening)',
    });

    new cdk.CfnOutput(this, 'WafWebAclArn', {
      value: webAcl.attrArn,
      description: 'WAF WebACL ARN protecting API Gateway (SQL injection, XSS, rate limiting)',
      exportName: `${serviceName}-${stage}-waf-arn`,
    });
  }
}
