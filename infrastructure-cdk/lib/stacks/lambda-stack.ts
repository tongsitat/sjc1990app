import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as path from 'path';

export interface LambdaStackProps extends cdk.StackProps {
  stage: string;
  tables: {
    users: dynamodb.Table;
    verificationCodes: dynamodb.Table;
    pendingApprovals: dynamodb.Table;
    userPreferences: dynamodb.Table;
    classrooms: dynamodb.Table;
    userClassrooms: dynamodb.Table;
  };
  photosBucket: s3.Bucket;
}

export class LambdaStack extends cdk.Stack {
  // Updated to 3 consolidated services (down from 14 individual functions)
  public readonly functions: {
    authService: nodejs.NodejsFunction;
    usersService: nodejs.NodejsFunction;
    classroomsService: nodejs.NodejsFunction;
  };

  public readonly layers: {
    awsSdkLayer: lambda.LayerVersion;
    nodeModulesLayer: lambda.LayerVersion;
  };

  constructor(scope: Construct, id: string, props: LambdaStackProps) {
    super(scope, id, props);

    const { stage, tables, photosBucket } = props;
    const serviceName = 'sjc1990app';

    // Get JWT secret from Secrets Manager
    // Note: We store the secret NAME in env var, Lambda fetches value at runtime
    const jwtSecret = secretsmanager.Secret.fromSecretNameV2(
      this,
      'JwtSecret',
      `${serviceName}/${stage}/jwt-secret`
    );

    // Common environment variables for all Lambda functions
    const commonEnvironment = {
      STAGE: stage,
      TABLE_USERS: tables.users.tableName,
      TABLE_VERIFICATION_CODES: tables.verificationCodes.tableName,
      TABLE_PENDING_APPROVALS: tables.pendingApprovals.tableName,
      TABLE_USER_PREFERENCES: tables.userPreferences.tableName,
      TABLE_CLASSROOMS: tables.classrooms.tableName,
      TABLE_USER_CLASSROOMS: tables.userClassrooms.tableName,
      S3_PHOTOS_BUCKET: photosBucket.bucketName,
      CDN_BASE_URL: `https://${photosBucket.bucketName}.s3.${cdk.Stack.of(this).region}.amazonaws.com`,
      JWT_SECRET_NAME: jwtSecret.secretName,
    };

    // Project root for bundling
    const projectRoot = path.join(__dirname, '../../..');

    // ===== Lambda Layers =====
    // Layer 1: AWS SDK v3 clients (~200KB)
    this.layers = {} as any;

    this.layers.awsSdkLayer = new lambda.LayerVersion(this, 'AwsSdkLayer', {
      layerVersionName: `${serviceName}-${stage}-aws-sdk`,
      description: 'AWS SDK v3 clients (DynamoDB, S3, SNS, Secrets Manager)',
      code: lambda.Code.fromAsset(path.join(projectRoot, 'backend/layers/aws-sdk-layer'), {
        bundling: {
          image: lambda.Runtime.NODEJS_20_X.bundlingImage,
          command: [
            'bash',
            '-c',
            'cd /asset-input/nodejs && npm install --production && cp -r /asset-input/. /asset-output/',
          ],
        },
      }),
      compatibleRuntimes: [lambda.Runtime.NODEJS_20_X],
    });

    // Layer 2: Third-party node modules (jsonwebtoken, uuid, middy) (~150KB)
    this.layers.nodeModulesLayer = new lambda.LayerVersion(this, 'NodeModulesLayer', {
      layerVersionName: `${serviceName}-${stage}-node-modules`,
      description: 'Third-party dependencies (jsonwebtoken, uuid, middy)',
      code: lambda.Code.fromAsset(path.join(projectRoot, 'backend/layers/node-modules-layer'), {
        bundling: {
          image: lambda.Runtime.NODEJS_20_X.bundlingImage,
          command: [
            'bash',
            '-c',
            'cd /asset-input/nodejs && npm install --production && cp -r /asset-input/. /asset-output/',
          ],
        },
      }),
      compatibleRuntimes: [lambda.Runtime.NODEJS_20_X],
    });

    // Note: shared utilities are bundled with each function to maintain relative imports
    // Alternative: Create shared-utils-layer and update all imports to use layer path

    // Common Lambda configuration
    const commonLambdaProps = {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 256,
      timeout: cdk.Duration.seconds(30),
      environment: commonEnvironment,
      layers: [this.layers.awsSdkLayer, this.layers.nodeModulesLayer],
      bundling: {
        minify: true,
        sourceMap: true,
        // External modules provided by layers
        externalModules: [
          'aws-sdk',
          '@aws-sdk/client-dynamodb',
          '@aws-sdk/client-s3',
          '@aws-sdk/client-secrets-manager',
          '@aws-sdk/client-sns',
          '@aws-sdk/lib-dynamodb',
          '@aws-sdk/s3-request-presigner',
          'jsonwebtoken',
          'uuid',
          '@middy/core',
          '@middy/http-cors',
          '@middy/http-error-handler',
          '@middy/http-json-body-parser',
        ],
        target: 'es2020',
      },
    };

    // Helper function to create consolidated service Lambda
    const createServiceFunction = (
      name: string,
      entry: string,
      description: string
    ): nodejs.NodejsFunction => {
      const fn = new nodejs.NodejsFunction(this, name, {
        ...commonLambdaProps,
        functionName: `${serviceName}-${stage}-${name}`,
        entry: path.join(__dirname, '../../../backend/services', entry),
        handler: 'handler',
        description,
        projectRoot,
        depsLockFilePath: path.join(projectRoot, 'backend', 'package-lock.json'),
      });

      // Grant read access to JWT secret
      jwtSecret.grantRead(fn);

      return fn;
    };

    // ===== 3 Consolidated Lambda Functions =====

    // 1. Auth Service (5 endpoints: register, verify, pending-approvals, approve, reject)
    this.functions = {} as any;

    this.functions.authService = createServiceFunction(
      'auth-service',
      'auth-service/index.ts',
      'Authentication service: registration, verification, approval'
    );

    // 2. Users Service (5 endpoints: profile, photo upload, photo complete, preferences get/update)
    this.functions.usersService = createServiceFunction(
      'users-service',
      'users-service/index.ts',
      'Users service: profile management, photos, preferences'
    );

    // 3. Classrooms Service (4 endpoints: list, assign, get user classrooms, get members)
    this.functions.classroomsService = createServiceFunction(
      'classrooms-service',
      'classrooms-service/index.ts',
      'Classrooms service: classroom and membership management'
    );

    // ===== Grant Permissions =====
    const allFunctions = Object.values(this.functions);

    // DynamoDB permissions for all services
    allFunctions.forEach((fn) => {
      tables.users.grantReadWriteData(fn);
      tables.verificationCodes.grantReadWriteData(fn);
      tables.pendingApprovals.grantReadWriteData(fn);
      tables.userPreferences.grantReadWriteData(fn);
      tables.classrooms.grantReadWriteData(fn);
      tables.userClassrooms.grantReadWriteData(fn);

      // Scan permission for classrooms table (list all)
      fn.addToRolePolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['dynamodb:Scan'],
          resources: [tables.classrooms.tableArn],
        })
      );
    });

    // S3 permissions for users-service (photo upload/complete)
    photosBucket.grantPut(this.functions.usersService);
    photosBucket.grantRead(this.functions.usersService);
    this.functions.usersService.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:HeadObject'],
        resources: [`${photosBucket.bucketArn}/*`],
      })
    );

    // SNS publish permission for auth-service (SMS sending)
    this.functions.authService.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['sns:Publish'],
        resources: ['*'], // SNS SMS doesn't support resource-level permissions
      })
    );

    // ===== CloudFormation Outputs =====
    new cdk.CfnOutput(this, 'AuthServiceFunctionName', {
      value: this.functions.authService.functionName,
      description: 'Auth Service Lambda function name',
      exportName: `${serviceName}-${stage}-auth-service-name`,
    });

    new cdk.CfnOutput(this, 'UsersServiceFunctionName', {
      value: this.functions.usersService.functionName,
      description: 'Users Service Lambda function name',
      exportName: `${serviceName}-${stage}-users-service-name`,
    });

    new cdk.CfnOutput(this, 'ClassroomsServiceFunctionName', {
      value: this.functions.classroomsService.functionName,
      description: 'Classrooms Service Lambda function name',
      exportName: `${serviceName}-${stage}-classrooms-service-name`,
    });

    new cdk.CfnOutput(this, 'AwsSdkLayerArn', {
      value: this.layers.awsSdkLayer.layerVersionArn,
      description: 'AWS SDK Lambda Layer ARN',
    });

    new cdk.CfnOutput(this, 'NodeModulesLayerArn', {
      value: this.layers.nodeModulesLayer.layerVersionArn,
      description: 'Node Modules Lambda Layer ARN',
    });
  }
}
