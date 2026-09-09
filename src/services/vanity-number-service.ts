import { inject, injectable } from 'inversify';
import type { ICallerRecordRepository } from '../db/callers-repository';
import type { CallerRecord, VanityResult } from '../types/models';
import { TYPES } from '../types/symbols';
import { convertToVanity } from '../utils/vanity-converter';

export interface IVanityNumberService {
  convert(
    phone: string,
    opts?: { top?: number; all?: boolean },
  ): VanityResult[];
  processAndSave(
    phone: string,
    opts?: { top?: number },
  ): Promise<VanityResult[]>;
  findByPhone(phone: string): Promise<CallerRecord | null>;
  getRecentCallers(limit: number): Promise<CallerRecord[]>;
}

@injectable()
export class VanityNumberService implements IVanityNumberService {
  constructor(
    @inject(TYPES.CallerRecordRepository)
    private readonly repository: ICallerRecordRepository,
  ) {}

  convert(
    phone: string,
    opts?: { top?: number; all?: boolean },
  ): VanityResult[] {
    return convertToVanity(phone, opts);
  }

  async processAndSave(
    phone: string,
    opts?: { top?: number },
  ): Promise<VanityResult[]> {
    const results = convertToVanity(phone, { top: opts?.top ?? 5 });
    await this.repository.save(phone, results);
    return results;
  }

  async findByPhone(phone: string): Promise<CallerRecord | null> {
    return this.repository.findByPhone(phone);
  }

  async getRecentCallers(limit: number): Promise<CallerRecord[]> {
    return this.repository.findRecent(limit);
  }
}
