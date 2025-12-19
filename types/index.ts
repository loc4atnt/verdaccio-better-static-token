import { Config, Logger, RemoteUser } from '@verdaccio/types';
import { Request } from 'express';

export interface AccessToken {
  key: string;
  user: string;
  pass: string;
  groups?: string;
}

export interface CustomConfig extends Config {
  staticAccessTokens: AccessToken[];
}

export interface $RequestExtend extends Request {
  remote_user?: RemoteUser;
  log: Logger;
}