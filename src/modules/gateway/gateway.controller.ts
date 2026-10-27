import type { Request, Response } from "express";
import { gatewayService, type GatewayService } from "./gateway.service";

export class GatewayController {
  constructor(private readonly gateway: GatewayService) {}

  async handle(req: Request, res: Response): Promise<void> {
    await this.gateway.authenticate(req.header("authorization"));

    // Route matching, proxying, rate limits, and request logs come later.
    res.status(501).json({
      error: {
        code: "GATEWAY_NOT_READY",
        message:
          "The API key is valid. This gateway does not proxy requests yet.",
      },
    });
  }
}

export const gatewayController = new GatewayController(gatewayService);
