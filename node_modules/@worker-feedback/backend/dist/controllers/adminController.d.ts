import { Request, Response } from 'express';
export declare class AdminController {
    static login(req: Request, res: Response): void;
    static getSubmissions(req: Request, res: Response): void;
    static getStats(req: Request, res: Response): void;
    static exportExcel(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=adminController.d.ts.map