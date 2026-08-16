import type { Request, Response } from "express";
import { usersService } from "./users.service";

export class UsersController {
  async getMe(req: Request, res: Response): Promise<void> {
    const me = await usersService.getMe(req.user);
    res.status(200).json(me);
  }
}

export const usersController = new UsersController();
