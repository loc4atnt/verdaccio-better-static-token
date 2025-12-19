import { Config, Logger, RemoteUser } from '@verdaccio/types';
import { Request } from 'express';

export interface AccessToken {
  user: string;
  key: string;
  readonly?: boolean;
}

export interface CustomConfig extends Config {
  staticAccessTokens: AccessToken[];
}

export interface $RequestExtend extends Request {
  remote_user?: RemoteUser;
  log: Logger;
}