import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export interface DatabaseStackProps extends cdk.StackProps {
  stage: string;
}

export class DatabaseStack extends cdk.Stack {
  public readonly tables: {
    users: dynamodb.Table;
    verificationCodes: dynamodb.Table;
    pendingApprovals: dynamodb.Table;
    userPreferences: dynamodb.Table;
    classrooms: dynamodb.Table;
    userClassrooms: dynamodb.Table;
  };

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    const { stage } = props;
    const serviceName = 'sjc1990app';

    // 1. Users Table
    this.tables = {} as any;

    this.tables.users = new dynamodb.Table(this, 'UsersTable', {
      tableName: `${serviceName}-users-${stage}`,
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN, // Don't delete user data on stack delete
    });

    // GSI1: phoneNumberHash index
    this.tables.users.addGlobalSecondaryIndex({
      indexName: 'GSI1',
      partitionKey: { name: 'phoneNumberHash', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI2: email index
    this.tables.users.addGlobalSecondaryIndex({
      indexName: 'GSI2',
      partitionKey: { name: 'email', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI3: status + createdAt index
    this.tables.users.addGlobalSecondaryIndex({
      indexName: 'GSI3',
      partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.NUMBER },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // 2. VerificationCodes Table
    this.tables.verificationCodes = new dynamodb.Table(this, 'VerificationCodesTable', {
      tableName: `${serviceName}-verification-codes-${stage}`,
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: 'phoneNumberHash', type: dynamodb.AttributeType.STRING },
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      timeToLiveAttribute: 'expiresAt', // Auto-delete expired codes
      removalPolicy: cdk.RemovalPolicy.DESTROY, // OK to delete verification codes
    });

    // 3. PendingApprovals Table
    this.tables.pendingApprovals = new dynamodb.Table(this, 'PendingApprovalsTable', {
      tableName: `${serviceName}-pending-approvals-${stage}`,
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // GSI1: status + requestedAt index
    this.tables.pendingApprovals.addGlobalSecondaryIndex({
      indexName: 'GSI1',
      partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'requestedAt', type: dynamodb.AttributeType.NUMBER },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // 4. UserPreferences Table
    this.tables.userPreferences = new dynamodb.Table(this, 'UserPreferencesTable', {
      tableName: `${serviceName}-user-preferences-${stage}`,
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // 5. Classrooms Table
    this.tables.classrooms = new dynamodb.Table(this, 'ClassroomsTable', {
      tableName: `${serviceName}-classrooms-${stage}`,
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: 'classroomId', type: dynamodb.AttributeType.STRING },
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // GSI1: year + displayName index
    this.tables.classrooms.addGlobalSecondaryIndex({
      indexName: 'GSI1',
      partitionKey: { name: 'year', type: dynamodb.AttributeType.NUMBER },
      sortKey: { name: 'displayName', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // 6. UserClassrooms Table (many-to-many)
    this.tables.userClassrooms = new dynamodb.Table(this, 'UserClassroomsTable', {
      tableName: `${serviceName}-user-classrooms-${stage}`,
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'classroomId', type: dynamodb.AttributeType.STRING },
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // GSI1: classroomId + userId index (reverse lookup)
    this.tables.userClassrooms.addGlobalSecondaryIndex({
      indexName: 'GSI1',
      partitionKey: { name: 'classroomId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // CloudFormation Outputs
    new cdk.CfnOutput(this, 'UsersTableName', {
      value: this.tables.users.tableName,
      description: 'Users table name',
      exportName: `${serviceName}-${stage}-users-table`,
    });

    new cdk.CfnOutput(this, 'VerificationCodesTableName', {
      value: this.tables.verificationCodes.tableName,
      description: 'Verification codes table name',
      exportName: `${serviceName}-${stage}-verification-codes-table`,
    });

    new cdk.CfnOutput(this, 'PendingApprovalsTableName', {
      value: this.tables.pendingApprovals.tableName,
      description: 'Pending approvals table name',
      exportName: `${serviceName}-${stage}-pending-approvals-table`,
    });

    new cdk.CfnOutput(this, 'UserPreferencesTableName', {
      value: this.tables.userPreferences.tableName,
      description: 'User preferences table name',
      exportName: `${serviceName}-${stage}-user-preferences-table`,
    });

    new cdk.CfnOutput(this, 'ClassroomsTableName', {
      value: this.tables.classrooms.tableName,
      description: 'Classrooms table name',
      exportName: `${serviceName}-${stage}-classrooms-table`,
    });

    new cdk.CfnOutput(this, 'UserClassroomsTableName', {
      value: this.tables.userClassrooms.tableName,
      description: 'User classrooms table name',
      exportName: `${serviceName}-${stage}-user-classrooms-table`,
    });
  }
}
