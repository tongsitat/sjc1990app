import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import { Construct } from 'constructs';

export interface StorageStackProps extends cdk.StackProps {
  stage: string;
}

export class StorageStack extends cdk.Stack {
  public readonly photosBucket: s3.Bucket;
  public readonly photosCdn: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id, props);

    const { stage } = props;
    const serviceName = 'sjc1990app';

    // S3 bucket for profile photos and class photos
    this.photosBucket = new s3.Bucket(this, 'PhotosBucket', {
      bucketName: `${serviceName}-${stage}-photos`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL, // Private bucket
      cors: [
        {
          allowedHeaders: ['*'],
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
            s3.HttpMethods.HEAD,
          ],
          allowedOrigins: ['*'], // TODO: Restrict to actual app domains in production
          maxAge: 3000,
        },
      ],
      lifecycleRules: [
        {
          // Archive old photos to Glacier Deep Archive after 1 year (95% cost savings)
          id: 'archive-old-photos',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.GLACIER_INSTANT_RETRIEVAL,
              transitionAfter: cdk.Duration.days(90), // 3 months
            },
            {
              storageClass: s3.StorageClass.DEEP_ARCHIVE,
              transitionAfter: cdk.Duration.days(365), // 1 year
            },
          ],
        },
        {
          // Delete incomplete multipart uploads after 7 days (cost optimization)
          id: 'cleanup-incomplete-uploads',
          enabled: true,
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
        },
      ],
      versioned: false, // No versioning needed for photos
      removalPolicy: cdk.RemovalPolicy.RETAIN, // Don't delete photos on stack delete
      autoDeleteObjects: false, // Safety: never auto-delete
    });

    // CloudFront CDN for global photo delivery (per ADR-012 optimization)
    this.photosCdn = new cloudfront.Distribution(this, 'PhotosCdn', {
      comment: `${serviceName}-${stage} Photos CDN`,
      defaultBehavior: {
        origin: new origins.S3Origin(this.photosBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
        compress: true, // Enable gzip/brotli compression
        cachePolicy: new cloudfront.CachePolicy(this, 'PhotosCachePolicy', {
          cachePolicyName: `${serviceName}-${stage}-photos-cache`,
          comment: 'Cache policy for photos (1 day TTL)',
          defaultTtl: cdk.Duration.days(1),
          minTtl: cdk.Duration.hours(1),
          maxTtl: cdk.Duration.days(365),
          enableAcceptEncodingGzip: true,
          enableAcceptEncodingBrotli: true,
          headerBehavior: cloudfront.CacheHeaderBehavior.allowList(
            'Origin',
            'Access-Control-Request-Method',
            'Access-Control-Request-Headers'
          ),
          queryStringBehavior: cloudfront.CacheQueryStringBehavior.none(),
          cookieBehavior: cloudfront.CacheCookieBehavior.none(),
        }),
      },
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100, // North America, Europe (most cost-effective)
      enableLogging: stage === 'prod', // CloudFront access logs in production only
      logBucket: stage === 'prod' ? new s3.Bucket(this, 'CdnLogsBucket', {
        bucketName: `${serviceName}-${stage}-cdn-logs`,
        encryption: s3.BucketEncryption.S3_MANAGED,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        lifecycleRules: [
          {
            id: 'delete-old-logs',
            enabled: true,
            expiration: cdk.Duration.days(90), // Keep logs for 90 days
          },
        ],
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
      }) : undefined,
    });

    // CloudFormation Outputs
    new cdk.CfnOutput(this, 'PhotosBucketName', {
      value: this.photosBucket.bucketName,
      description: 'S3 bucket for profile and class photos',
      exportName: `${serviceName}-${stage}-photos-bucket`,
    });

    new cdk.CfnOutput(this, 'PhotosBucketArn', {
      value: this.photosBucket.bucketArn,
      description: 'S3 bucket ARN',
      exportName: `${serviceName}-${stage}-photos-bucket-arn`,
    });

    new cdk.CfnOutput(this, 'PhotosCdnUrl', {
      value: `https://${this.photosCdn.distributionDomainName}`,
      description: 'CloudFront CDN URL for photos',
      exportName: `${serviceName}-${stage}-cdn-url`,
    });

    new cdk.CfnOutput(this, 'PhotosCdnDistributionId', {
      value: this.photosCdn.distributionId,
      description: 'CloudFront Distribution ID',
      exportName: `${serviceName}-${stage}-cdn-id`,
    });
  }
}
