#!/usr/bin/env node
import 'source-map-support/register';
import cdk = require('@aws-cdk/core');
import { AmazonConnectExtension002Stack } from '../lib/cdk-stack';

const app = new cdk.App();
new AmazonConnectExtension002Stack(app, 'AmazonConnectExtension002Stack');
