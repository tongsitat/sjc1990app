#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DatabaseStack } from '../lib/stacks/database-stack';
import { LambdaStack } from '../lib/stacks/lambda-stack';
import { ApiStack } from '../lib/stacks/api-stack';
import { StorageStack } from '../lib/stacks/storage-stack';

const app = new cdk.App();

// Get stage from context (default: dev)
const stage = app.node.tryGetContext('stage') || 'dev';
const region = app.node.tryGetContext('region') || 'ap-southeast-1';

// Stack naming
const stackPrefix = `sjc1990app-${stage}`;

// Environment configuration
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: region,
};

// Tags applied to all stacks
const tags = {
  Project: 'sjc1990app',
  Stage: stage,
  ManagedBy: 'CDK',
};

// 1. Storage Stack (S3 bucket for photos)
const storageStack = new StorageStack(app, `${stackPrefix}-storage`, {
  env,
  stackName: `${stackPrefix}-storage`,
  description: 'S3 bucket for profile photos and class photos',
  tags,
  stage,
});

// 2. Database Stack (DynamoDB tables)
const databaseStack = new DatabaseStack(app, `${stackPrefix}-database`, {
  env,
  stackName: `${stackPrefix}-database`,
  description: 'DynamoDB tables for users, classrooms, preferences, and approvals',
  tags,
  stage,
});

// 3. Lambda Stack (Lambda functions)
const lambdaStack = new LambdaStack(app, `${stackPrefix}-lambda`, {
  env,
  stackName: `${stackPrefix}-lambda`,
  description: 'Lambda functions for backend API',
  tags,
  stage,
  tables: databaseStack.tables,
  photosBucket: storageStack.photosBucket,
});

// 4. API Stack (API Gateway)
const apiStack = new ApiStack(app, `${stackPrefix}-api`, {
  env,
  stackName: `${stackPrefix}-api`,
  description: 'API Gateway REST API',
  tags,
  stage,
  functions: lambdaStack.functions,
});

// Stack dependencies
lambdaStack.addDependency(databaseStack);
lambdaStack.addDependency(storageStack);
apiStack.addDependency(lambdaStack);

app.synth();
