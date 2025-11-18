import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as ssm from 'aws-cdk-lib/aws-ssm';
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
  public readonly functions: {
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

  constructor(scope: Construct, id: string, props: LambdaStackProps) {
    super(scope, id, props);

    const { stage, tables, photosBucket } = props;
    const serviceName = 'sjc1990app';

    // Get JWT secret from Parameter Store
    const jwtSecretParameter = ssm.StringParameter.fromSecureStringParameterAttributes(
      this,
      'JwtSecret',
      {
        parameterName: `/${serviceName}/${stage}/jwt-secret`,
      }
    );

    // Common environment variables for all Lambda functions
    // Note: AWS_REGION is automatically provided by Lambda runtime
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
      JWT_SECRET: jwtSecretParameter.stringValue,
    };

    // Common Lambda configuration
    const commonLambdaProps = {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 256,
      timeout: cdk.Duration.seconds(30),
      environment: commonEnvironment,
      bundling: {
        minify: true,
        sourceMap: true,
        externalModules: ['aws-sdk'], // Use Lambda runtime SDK
        target: 'es2020',
      },
    };

    // Project root for bundling (parent of infrastructure-cdk)
    const projectRoot = path.join(__dirname, '../../..');

    // Helper function to create Lambda function
    const createFunction = (
      name: string,
      entry: string,
      description: string
    ): nodejs.NodejsFunction => {
      return new nodejs.NodejsFunction(this, name, {
        ...commonLambdaProps,
        functionName: `${serviceName}-${stage}-${name}`,
        entry: path.join(__dirname, '../../../backend/functions', entry),
        handler: 'handler',
        description,
        projectRoot, // Tell CDK to mount the project root directory
        depsLockFilePath: path.join(projectRoot, 'backend', 'package-lock.json'),
      });
    };

    // 1. Authentication Functions
    this.functions = {} as any;

    this.functions.authRegister = createFunction(
      'authRegister',
      'auth/register.ts',
      'User registration with phone number'
    );

    this.functions.authVerify = createFunction(
      'authVerify',
      'auth/verify.ts',
      'Verify SMS code and create user'
    );

    this.functions.authPendingApprovals = createFunction(
      'authPendingApprovals',
      'auth/pending-approvals.ts',
      'List users pending approval (admin)'
    );

    this.functions.authApprove = createFunction(
      'authApprove',
      'auth/approve.ts',
      'Approve user registration (admin)'
    );

    this.functions.authReject = createFunction(
      'authReject',
      'auth/reject.ts',
      'Reject user registration (admin)'
    );

    // 2. User Profile Functions
    this.functions.updateProfile = createFunction(
      'updateProfile',
      'users/update-profile.ts',
      'Update user profile (name, bio)'
    );

    this.functions.uploadPhoto = createFunction(
      'uploadPhoto',
      'users/upload-photo.ts',
      'Generate S3 pre-signed URL for photo upload'
    );

    this.functions.completePhotoUpload = createFunction(
      'completePhotoUpload',
      'users/complete-photo-upload.ts',
      'Complete photo upload and update user record'
    );

    // 3. User Preferences Functions
    this.functions.getPreferences = createFunction(
      'getPreferences',
      'users/get-preferences.ts',
      'Get user communication preferences'
    );

    this.functions.updatePreferences = createFunction(
      'updatePreferences',
      'users/update-preferences.ts',
      'Update user communication preferences'
    );

    // 4. Classroom Functions
    this.functions.listClassrooms = createFunction(
      'listClassrooms',
      'classrooms/list-classrooms.ts',
      'List all classrooms (filter by year)'
    );

    this.functions.assignClassrooms = createFunction(
      'assignClassrooms',
      'classrooms/assign-classrooms.ts',
      'Assign multiple classrooms to user'
    );

    this.functions.getUserClassrooms = createFunction(
      'getUserClassrooms',
      'classrooms/get-user-classrooms.ts',
      "Get user's classroom history"
    );

    this.functions.getClassroomMembers = createFunction(
      'getClassroomMembers',
      'classrooms/get-classroom-members.ts',
      'Get all members of a classroom'
    );

    // Grant DynamoDB permissions
    const allFunctions = Object.values(this.functions);

    allFunctions.forEach((fn) => {
      // Read/write permissions for all tables
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

    // Grant S3 permissions to photo-related functions
    const photoFunctions = [
      this.functions.uploadPhoto,
      this.functions.completePhotoUpload,
    ];

    photoFunctions.forEach((fn) => {
      photosBucket.grantPut(fn);
      photosBucket.grantRead(fn);
      // HeadObject permission for checking upload completion
      fn.addToRolePolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['s3:HeadObject'],
          resources: [`${photosBucket.bucketArn}/*`],
        })
      );
    });

    // Grant SNS publish permission for SMS
    const smsFunctions = [
      this.functions.authRegister,
      this.functions.authApprove,
      this.functions.authReject,
    ];

    smsFunctions.forEach((fn) => {
      fn.addToRolePolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['sns:Publish'],
          resources: ['*'], // SNS SMS doesn't support resource-level permissions
        })
      );
    });

    // CloudFormation Outputs
    new cdk.CfnOutput(this, 'AuthRegisterFunctionName', {
      value: this.functions.authRegister.functionName,
      description: 'Auth Register Lambda function name',
    });

    new cdk.CfnOutput(this, 'AuthVerifyFunctionName', {
      value: this.functions.authVerify.functionName,
      description: 'Auth Verify Lambda function name',
    });
  }
}
