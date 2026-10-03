import type { Request, Response } from "express";
import { requestLogsService } from "./request-logs.service";
import type { ListRequestLogsQuery } from "./request-logs.schema";

export class RequestLogsController {
  async list(req: Request, res: Response): Promise<void> {
    const query = req.query as unknown as ListRequestLogsQuery;
    const logs = await requestLogsService.list(req.organization.id, query);
    res.status(200).json({ data: logs });
  }
}

export const requestLogsController = new RequestLogsController();
