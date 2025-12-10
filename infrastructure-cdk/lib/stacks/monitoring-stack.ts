import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';

export interface MonitoringStackProps extends cdk.StackProps {
  stage: string;
  functions: {
    authService: nodejs.NodejsFunction;
    usersService: nodejs.NodejsFunction;
    classroomsService: nodejs.NodejsFunction;
  };
  api: apigateway.RestApi;
  alarmEmail?: string; // Optional email for alarm notifications
}

export class MonitoringStack extends cdk.Stack {
  public readonly alarmTopic: sns.Topic;

  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    const { stage, functions, api, alarmEmail } = props;
    const serviceName = 'sjc1990app';

    // SNS Topic for CloudWatch alarms
    this.alarmTopic = new sns.Topic(this, 'AlarmTopic', {
      topicName: `${serviceName}-${stage}-alarms`,
      displayName: `${serviceName} ${stage} Alarms`,
    });

    // Subscribe email if provided
    if (alarmEmail) {
      this.alarmTopic.addSubscription(
        new subscriptions.EmailSubscription(alarmEmail)
      );
    }

    const alarmAction = new cloudwatch_actions.SnsAction(this.alarmTopic);

    // ===== Lambda Function Alarms =====
    const allFunctions = Object.values(functions);

    allFunctions.forEach((fn, index) => {
      const functionName = fn.functionName;
      const alarmIdPrefix = `Function${index}`;

      // 1. Lambda Errors Alarm (> 1% error rate)
      new cloudwatch.Alarm(this, `${alarmIdPrefix}-Errors`, {
        alarmName: `${functionName}-errors`,
        alarmDescription: `Errors for ${functionName} exceed 1%`,
        metric: fn.metricErrors({
          statistic: cloudwatch.Stats.SUM,
          period: cdk.Duration.minutes(5),
        }),
        threshold: 5, // 5 errors in 5 minutes (assuming ~500 invocations = 1%)
        evaluationPeriods: 2, // 2 consecutive periods
        datapointsToAlarm: 2,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }).addAlarmAction(alarmAction);

      // 2. Lambda Throttles Alarm
      new cloudwatch.Alarm(this, `${alarmIdPrefix}-Throttles`, {
        alarmName: `${functionName}-throttles`,
        alarmDescription: `Throttles detected for ${functionName}`,
        metric: fn.metricThrottles({
          statistic: cloudwatch.Stats.SUM,
          period: cdk.Duration.minutes(5),
        }),
        threshold: 1, // Any throttle is concerning
        evaluationPeriods: 1,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }).addAlarmAction(alarmAction);

      // 3. Lambda Duration Alarm (> 10 seconds for 80% of invocations)
      new cloudwatch.Alarm(this, `${alarmIdPrefix}-Duration`, {
        alarmName: `${functionName}-duration`,
        alarmDescription: `Duration for ${functionName} exceeds 10 seconds (p80)`,
        metric: fn.metricDuration({
          statistic: 'p80', // 80th percentile
          period: cdk.Duration.minutes(5),
        }),
        threshold: 10000, // 10 seconds in milliseconds
        evaluationPeriods: 3, // 3 consecutive periods (15 minutes)
        datapointsToAlarm: 3,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }).addAlarmAction(alarmAction);

      // 4. Lambda Concurrent Executions Alarm (approaching limit)
      new cloudwatch.Alarm(this, `${alarmIdPrefix}-ConcurrentExecutions`, {
        alarmName: `${functionName}-concurrent-executions`,
        alarmDescription: `Concurrent executions for ${functionName} approaching limit`,
        metric: new cloudwatch.Metric({
          namespace: 'AWS/Lambda',
          metricName: 'ConcurrentExecutions',
          dimensionsMap: {
            FunctionName: fn.functionName,
          },
          statistic: cloudwatch.Stats.MAXIMUM,
          period: cdk.Duration.minutes(1),
        }),
        threshold: 800, // Warn at 800 (limit is usually 1000)
        evaluationPeriods: 2,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }).addAlarmAction(alarmAction);
    });

    // ===== API Gateway Alarms =====

    // 1. API Gateway 4XX Errors (> 5% of requests)
    new cloudwatch.Alarm(this, 'ApiGateway-4XXErrors', {
      alarmName: `${serviceName}-${stage}-api-4xx-errors`,
      alarmDescription: 'API Gateway 4XX errors exceed 5% of requests',
      metric: api.metricClientError({
        statistic: cloudwatch.Stats.SUM,
        period: cdk.Duration.minutes(5),
      }),
      threshold: 25, // 25 errors in 5 minutes (assuming ~500 requests = 5%)
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(alarmAction);

    // 2. API Gateway 5XX Errors (> 1% of requests)
    new cloudwatch.Alarm(this, 'ApiGateway-5XXErrors', {
      alarmName: `${serviceName}-${stage}-api-5xx-errors`,
      alarmDescription: 'API Gateway 5XX errors exceed 1% of requests',
      metric: api.metricServerError({
        statistic: cloudwatch.Stats.SUM,
        period: cdk.Duration.minutes(5),
      }),
      threshold: 5, // 5 errors in 5 minutes (assuming ~500 requests = 1%)
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(alarmAction);

    // 3. API Gateway Latency (p95 > 3 seconds)
    new cloudwatch.Alarm(this, 'ApiGateway-Latency', {
      alarmName: `${serviceName}-${stage}-api-latency`,
      alarmDescription: 'API Gateway latency (p95) exceeds 3 seconds',
      metric: api.metricLatency({
        statistic: 'p95',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 3000, // 3 seconds in milliseconds
      evaluationPeriods: 3, // 15 minutes
      datapointsToAlarm: 3,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(alarmAction);

    // 4. API Gateway Cache Hit Rate (< 50% for cached endpoints)
    if (stage !== 'dev') {
      // Only enable cache monitoring in staging/prod
      new cloudwatch.Alarm(this, 'ApiGateway-CacheHitRate', {
        alarmName: `${serviceName}-${stage}-api-cache-hit-rate`,
        alarmDescription: 'API Gateway cache hit rate below 50%',
        metric: api.metricCacheHitCount({
          statistic: cloudwatch.Stats.SUM,
          period: cdk.Duration.hours(1),
        }),
        threshold: 50, // Expect at least 50% hit rate
        evaluationPeriods: 2, // 2 hours
        comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }).addAlarmAction(alarmAction);
    }

    // ===== Cost Alarms (Estimated) =====
    // Note: CloudWatch doesn't directly monitor costs. For cost monitoring:
    // 1. Set up AWS Budgets in the AWS Console
    // 2. Configure billing alarms in CloudWatch (requires enabling in billing preferences)

    // Estimated cost alarm using Lambda invocations as proxy
    const totalInvocationsMetric = new cloudwatch.MathExpression({
      expression: 'm1 + m2 + m3',
      usingMetrics: {
        m1: functions.authService.metricInvocations({
          statistic: cloudwatch.Stats.SUM,
          period: cdk.Duration.days(1),
        }),
        m2: functions.usersService.metricInvocations({
          statistic: cloudwatch.Stats.SUM,
          period: cdk.Duration.days(1),
        }),
        m3: functions.classroomsService.metricInvocations({
          statistic: cloudwatch.Stats.SUM,
          period: cdk.Duration.days(1),
        }),
      },
      label: 'Total Lambda Invocations',
    });

    new cloudwatch.Alarm(this, 'EstimatedCost-DailyInvocations', {
      alarmName: `${serviceName}-${stage}-high-daily-invocations`,
      alarmDescription: `Daily Lambda invocations exceed expected threshold (cost proxy)`,
      metric: totalInvocationsMetric,
      threshold: stage === 'dev' ? 10000 : 100000, // Dev: 10K, Prod: 100K
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(alarmAction);

    // ===== CloudFormation Outputs =====
    new cdk.CfnOutput(this, 'AlarmTopicArn', {
      value: this.alarmTopic.topicArn,
      description: 'SNS Topic ARN for CloudWatch alarms',
      exportName: `${serviceName}-${stage}-alarm-topic-arn`,
    });

    new cdk.CfnOutput(this, 'AlarmTopicName', {
      value: this.alarmTopic.topicName,
      description: 'SNS Topic name for CloudWatch alarms',
    });
  }
}
