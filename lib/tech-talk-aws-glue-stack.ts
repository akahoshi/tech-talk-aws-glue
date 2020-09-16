import * as ec2 from '@aws-cdk/aws-ec2';
import * as rds from '@aws-cdk/aws-rds';
import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as path from 'path';

export class TechTalkAwsGlueStack extends cdk.Stack {
    constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const vpc = this.createVpc();
        const mySqlDb = this.createDbInstance(vpc);
    }

    private createVpc(): ec2.Vpc {
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

    private createDbInstance(vpc: ec2.Vpc): rds.DatabaseInstance {
        const id: string = 'MySqlDb';
        return new rds.DatabaseInstance(this, id, {
            engine: rds.DatabaseInstanceEngine.mysql({ version: rds.MysqlEngineVersion.VER_8_0 }),
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO),
            masterUsername: 'master',
            vpcSubnets: {
                subnetType: ec2.SubnetType.ISOLATED
            },
            vpc: vpc,
            allocatedStorage: 20,
            storageType: rds.StorageType.GP2,
            instanceIdentifier: id,
            databaseName: 'shop',
            deleteAutomatedBackups: true,
            deletionProtection: false
        });
    }
}
