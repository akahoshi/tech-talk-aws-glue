import * as ec2 from '@aws-cdk/aws-ec2';
import * as glue from '@aws-cdk/aws-glue';
import * as iam from '@aws-cdk/aws-iam';
import * as rds from '@aws-cdk/aws-rds';
import * as s3 from '@aws-cdk/aws-s3';
import * as s3_deployment from '@aws-cdk/aws-s3-deployment';
import * as cdk from '@aws-cdk/core';
import { StackConfiguration } from './configuration/stack-configuration';


export class TechTalkAwsGlueStack extends cdk.Stack {
    constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const vpc = this.createVpc();

        const bastionHost = this.createBastionHost(vpc);

        const dbSecurityGroup = this.createDbSecurityGroup(vpc);
        dbSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(3306));

        const mySqlDb = this.createDbInstance(vpc, dbSecurityGroup);
        mySqlDb.grantConnect(bastionHost);

        const itemsS3Bucket = this.createItemsS3Bucket();

        this.setupGlue(itemsS3Bucket);
    }

    private createVpc(): ec2.IVpc {
        return new ec2.Vpc(this, 'Vpc', {
            maxAzs: 2,
            subnetConfiguration: [{
                name: 'PublicSubnet',
                subnetType: ec2.SubnetType.PUBLIC
            }, {
                name: 'DBSubnet',
                subnetType: ec2.SubnetType.ISOLATED
            }]
        })
    }

    private createDbSecurityGroup(vpc: ec2.IVpc): ec2.ISecurityGroup {
        return new ec2.SecurityGroup(this, 'DbSecurityGroup', {
            vpc: vpc,
            allowAllOutbound: false
        });
    }

    private createDbInstance(vpc: ec2.IVpc, securityGroup: ec2.ISecurityGroup): rds.IDatabaseInstance {
        const dbInstance = new rds.DatabaseInstance(this, 'MySqlDb', {
            engine: rds.DatabaseInstanceEngine.mysql({ version: rds.MysqlEngineVersion.VER_8_0 }),
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO),
            masterUsername: 'master',
            vpcSubnets: {
                subnetType: ec2.SubnetType.ISOLATED
            },
            vpc: vpc,
            allocatedStorage: 20,
            storageType: rds.StorageType.GP2,
            databaseName: 'shop',
            deleteAutomatedBackups: true,
            deletionProtection: false,
            iamAuthentication: true,
            securityGroups: [securityGroup]
        });
        return dbInstance;
    }

    private createBastionHost(vpc: ec2.IVpc): ec2.IInstance {
        const bastionHost = new ec2.BastionHostLinux(this, 'BastionHost', {
            vpc: vpc,
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO),
            subnetSelection: {
                subnets: [
                    vpc.publicSubnets[0] // random public subnet in VPC
                ]
            }
        });
        bastionHost.allowSshAccessFrom(ec2.Peer.anyIpv4()); // allow SSH connection to everyone
        return bastionHost;
    }

    private createItemsS3Bucket(): s3.IBucket {
        const s3Bucket = new s3.Bucket(this, 'ItemsS3Bucket', {
            bucketName: `${StackConfiguration.bucketNamePrefix}.items`
        });
        new s3_deployment.BucketDeployment(this, 'ItemsBucketCSVUpload', {
            destinationBucket: s3Bucket,
            sources: [
                s3_deployment.Source.asset('csv')
            ]
        })
        return s3Bucket;
    }

    private setupGlue(itemsS3Bucket: s3.IBucket) {
        const dataCatalogDb = new glue.Database(this, 'DataCatalogDb', {
            databaseName: 'data_catalog'
        });

        const glueRole = new iam.Role(this, 'GlueRole', {
            assumedBy: new iam.ServicePrincipal('glue.amazonaws.com'),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess')
            ]
        })

        const itemsS3BucketCrawler = new glue.CfnCrawler(this, 'ItemsBucketCrawler', {
            databaseName: dataCatalogDb.databaseName,
            targets: {
                s3Targets: [{ path: itemsS3Bucket.s3UrlForObject() }]
            },
            role: glueRole.roleArn
        });
    }
}
