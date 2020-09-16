#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';
import { StackConfiguration } from '../lib/configuration/stack-configuration';
import { TechTalkAwsGlueStack } from '../lib/tech-talk-aws-glue-stack';

const properties: cdk.StackProps = {
    ...StackConfiguration,
    ...{
        tags: {
            'Name': StackConfiguration.stackName
        },
        env: {
            region: process.env.CDK_DEFAULT_REGION,
            account: process.env.CDK_DEFAULT_ACCOUNT
        }
    }
};

const app = new cdk.App();
new TechTalkAwsGlueStack(app, StackConfiguration.stackName, properties);
