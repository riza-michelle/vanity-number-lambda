import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { injectable } from 'inversify';
import { env } from '../config/env';
import type { CallerRecord, VanityResult } from '../types/models';

const RECORD_TYPE = 'CALLER';
const RECORY_TYPE_GSI_NAME = 'recordType-createdAt-index';

export interface ICallerRecordRepository {
  save(phoneNumber: string, results: VanityResult[]): Promise<void>;
  findByPhone(phoneNumber: string): Promise<CallerRecord | null>;
  findRecent(limit: number): Promise<CallerRecord[]>;
}

@injectable()
export class CallerRecordDDBRepository implements ICallerRecordRepository {
  private readonly client: DynamoDBDocumentClient;
  private readonly table: string;

  constructor() {
    this.client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
    this.table = env.CALLER_RECORD_TABLE_NAME;
  }

  async save(phoneNumber: string, results: VanityResult[]): Promise<void> {
    await this.client.send(
      new PutCommand({
        TableName: this.table,
        Item: {
          phoneNumber,
          recordType: RECORD_TYPE,
          topVanityNumbers: results,
          createdAt: new Date().toISOString(),
        },
      }),
    );
  }

  async findByPhone(phoneNumber: string): Promise<CallerRecord | null> {
    const result = await this.client.send(
      new QueryCommand({
        TableName: this.table,
        KeyConditionExpression: 'phoneNumber = :phone',
        ExpressionAttributeValues: { ':phone': phoneNumber },
        ScanIndexForward: false,
        Limit: 1,
      }),
    );
    return (result.Items?.[0] as CallerRecord) ?? null;
  }

  async findRecent(limit: number): Promise<CallerRecord[]> {
    const result = await this.client.send(
      new QueryCommand({
        TableName: this.table,
        IndexName: RECORY_TYPE_GSI_NAME,
        KeyConditionExpression: 'recordType = :type',
        ExpressionAttributeValues: { ':type': RECORD_TYPE },
        ScanIndexForward: false,
        Limit: limit,
      }),
    );
    return (result.Items ?? []) as CallerRecord[];
  }
}
