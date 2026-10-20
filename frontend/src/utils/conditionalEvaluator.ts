import { ConditionExpression } from '@worker-feedback/shared';

export function evaluateCondition(
  condition: ConditionExpression,
  parentAnswer: string | string[] | undefined
): boolean {
  if (parentAnswer === undefined || parentAnswer === null) {
    return false;
  }

  const { operator, value: targetValue } = condition;

  switch (operator) {
    case 'equals':
      return parentAnswer === targetValue;
    case 'not_equals':
      return parentAnswer !== targetValue;
    case 'includes':
      return Array.isArray(parentAnswer) && parentAnswer.includes(targetValue as string);
    case 'not_includes':
      return !Array.isArray(parentAnswer) || !parentAnswer.includes(targetValue as string);
    default:
      return false;
  }
}
