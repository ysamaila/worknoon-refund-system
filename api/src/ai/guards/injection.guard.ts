export type InjectionCheckResult = {
  isFlagged: boolean;
  matchedPatterns: string[];
};

export const INJECTION_PATTERNS: { name: string; regex: RegExp }[] = [
  {
    name: 'Instruction Override',
    regex: /\b(?:ignore|disregard|forget|bypass)\s+(?:all\s+)?(?:previous|prior|above|system)\s+(?:instructions|rules|prompts|commands)\b/i,
  },
  {
    name: 'Role Impersonation / Jailbreak',
    regex: /\b(?:you\s+are\s+now|act\s+as|pretend\s+to\s+be|simulate|dan\s+mode)\b/i,
  },
  {
    name: 'System Prompt Extraction / Tampering',
    regex: /\b(?:system\s+prompt|reveal\s+(?:your\s+)?instructions|developer\s+mode|maintenance\s+mode|debug\s+mode)\b/i,
  },
  {
    name: 'Policy / Decision Override Command',
    regex: /\b(?:override\s+(?:policy|rules|system)|set\s+(?:status|decision)\s+to\s+(?:approved|approve)|force\s+approval|always\s+approve)\b/i,
  },
  {
    name: 'Adversarial Role Delimiters',
    regex: /(?:<\|im_start\|>|<\|im_end\|>|\[SYSTEM\]|\[ADMIN\]|Assistant:|Human:)/i,
  },
  {
    name: 'XML Boundary Escape Attempt',
    regex: /<\/?customer_message>/i,
  },
  {
    name: 'Suspicious Base64 Payload',
    // Matches base64 strings of length 32 or more
    regex: /(?:[A-Za-z0-9+/]{4}){8,}(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?/,
  },
];

/**
 * Defensive Layer 4: Heuristic Prompt Injection Pre-Screen
 * Inspects raw customer text before invoking AI extraction.
 *
 * When flagged, the pipeline sets injectionFlag: true and forces
 * the decision to ESCALATED, routing to a human supervisor.
 */
export function checkPromptInjection(rawMessage: string): InjectionCheckResult {
  if (!rawMessage || typeof rawMessage !== 'string') {
    return { isFlagged: false, matchedPatterns: [] };
  }

  const matchedPatterns: string[] = [];

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.regex.test(rawMessage)) {
      matchedPatterns.push(pattern.name);
    }
  }

  return {
    isFlagged: matchedPatterns.length > 0,
    matchedPatterns,
  };
}
