import { body, validationResult, type ValidationChain } from 'express-validator';
import type { Request, Response, NextFunction } from 'express';

/** Place after validation chains: turns the first error into a 400 response. */
export function handleValidation(req: Request, res: Response, next: NextFunction): void {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: errors.array()[0].msg as string,
      errors: errors.array().map((e) => ({
        field: e.type === 'field' ? e.path : 'unknown',
        msg: e.msg,
      })),
    });
    return;
  }
  next();
}

/**
 * Validators for a typical "ask the model about X" request.
 * Length caps matter twice here: they bound token cost and shrink the room
 * available for injection payloads.
 */
export const validateLlmRequest: ValidationChain[] = [
  body('category')
    .trim()
    .notEmpty()
    .withMessage('category is required')
    .isIn(['general', 'technical', 'billing'])
    .withMessage('category must be one of: general, technical, billing'),
  body('resourceId').optional().isUUID(4).withMessage('resourceId must be a valid UUID'),
  body('userText')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('userText must be at most 1000 characters'),
];
