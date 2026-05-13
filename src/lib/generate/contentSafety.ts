import type { GenerateRequest } from '@/lib/generate/validation';

type BlockedPattern = {
  pattern: RegExp;
  reason: string;
};

export class UnsafePromptError extends Error {
  readonly code = 'unsafe_prompt';

  constructor(readonly reason: string) {
    super('Prompt contains disallowed content');
  }
}

const blockedPatterns: BlockedPattern[] = [
  {
    pattern:
      /\b(child|children|minor|underage|kid|kids|teen|teenager|schoolgirl|schoolboy)\b[\s\S]{0,120}\b(nude|naked|nsfw|sex|sexual|erotic|porn|lingerie)\b/i,
    reason: 'sexual content involving minors',
  },
  {
    pattern:
      /\b(nude|naked|nsfw|sex|sexual|erotic|porn|lingerie)\b[\s\S]{0,120}\b(child|children|minor|underage|kid|kids|teen|teenager|schoolgirl|schoolboy)\b/i,
    reason: 'sexual content involving minors',
  },
  {
    pattern: /\b(rape|raped|non[-\s]?consensual|forced sex|sexual assault)\b/i,
    reason: 'non-consensual sexual content',
  },
  {
    pattern: /\b(bestiality|zoophilia)\b/i,
    reason: 'sexual content involving animals',
  },
  {
    pattern: /\b(gore|gory|dismembered|dismemberment|decapitated|decapitation|mutilated|mutilation)\b/i,
    reason: 'graphic violence',
  },
];

export function assertPromptAllowed(input: GenerateRequest) {
  const prompt = input.prompt.trim();

  for (const blocked of blockedPatterns) {
    if (blocked.pattern.test(prompt)) {
      throw new UnsafePromptError(blocked.reason);
    }
  }
}
