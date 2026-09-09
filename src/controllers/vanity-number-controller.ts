import { inject, injectable } from 'inversify';
import type { IVanityNumberService } from '../services/vanity-number-service';
import type { ILogger } from '../types/logger';
import type { CallerRecord } from '../types/models';
import { TYPES } from '../types/symbols';

export interface RecentCallersResult {
  callers: CallerRecord[];
  count: number;
}

@injectable()
export class VanityNumberController {
  constructor(
    @inject(TYPES.VanityNumberService)
    private readonly svc: IVanityNumberService,
    @inject(TYPES.Logger) private readonly logger: ILogger,
  ) {}

  async getRecent(limit: number): Promise<RecentCallersResult> {
    this.logger.info('Fetching recent callers', { limit });
    const callers = await this.svc.getRecentCallers(limit);
    return { callers, count: callers.length };
  }
}
