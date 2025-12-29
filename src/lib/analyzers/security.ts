import type {
  FileInput,
  SecurityIssueType,
  SecuritySeverity,
  SecurityFinding,
  SecurityAnalysisResult,
} from '@/types';
import { v4 as uuidv4 } from 'uuid';

// Re-export types for convenience
export type { SecurityIssueType, SecuritySeverity, SecurityFinding, SecurityAnalysisResult };

// ===========================================
// Pattern Definitions
// ===========================================

interface PatternMatcher {
  pattern: RegExp;
  type: SecurityIssueType;
  severity: SecuritySeverity;
  description: string;
  recommendation: string;
  cwe_id?: string;
  fileTypes?: string[];
  skipFiles?: RegExp[];
}

const SECURITY_PATTERNS: PatternMatcher[] = [
  // ===========================================
  // SQL Injection Patterns (CWE-89)
  // ===========================================
  {
    pattern: /\.(query|execute)\s*\(\s*['"`].*\$\{/gi,
    type: 'sql_injection',
    severity: 'critical',
    description: 'Potential SQL injection: template literal used in database query',
    recommendation: 'Use parameterized queries or prepared statements instead of string interpolation',
    cwe_id: 'CWE-89',
    fileTypes: ['.ts', '.js', '.tsx', '.jsx'],
  },
  {
    pattern: /\.(query|execute)\s*\([^)]*\+\s*(req\.|params\.|body\.|query\.)/gi,
    type: 'sql_injection',
    severity: 'critical',
    description: 'Potential SQL injection: user input concatenated in query',
    recommendation: 'Use parameterized queries or an ORM to prevent SQL injection',
    cwe_id: 'CWE-89',
    fileTypes: ['.ts', '.js', '.tsx', '.jsx'],
  },
  {
    pattern: /\.(raw|rawQuery)\s*\(\s*['"`].*\$\{/gi,
    type: 'sql_injection',
    severity: 'critical',
    description: 'Potential SQL injection in raw query with template literal',
    recommendation: 'Use parameterized queries instead of raw SQL with interpolation',
    cwe_id: 'CWE-89',
    fileTypes: ['.ts', '.js', '.tsx', '.jsx'],
  },
  {
    pattern: /execute\s*\(\s*f["'].*\{.*\}/gi,
    type: 'sql_injection',
    severity: 'critical',
    description: 'Potential SQL injection: f-string used in SQL query (Python)',
    recommendation: 'Use parameterized queries with placeholders',
    cwe_id: 'CWE-89',
    fileTypes: ['.py'],
  },

  // ===========================================
  // XSS Patterns (CWE-79)
  // ===========================================
  {
    pattern: /dangerouslySetInnerHTML\s*=\s*\{\s*\{\s*__html:\s*[^}]*\$\{/gi,
    type: 'xss',
    severity: 'high',
    description: 'Potential XSS: dangerouslySetInnerHTML with dynamic content',
    recommendation: 'Sanitize HTML content with DOMPurify before rendering',
    cwe_id: 'CWE-79',
    fileTypes: ['.tsx', '.jsx'],
  },
  {
    pattern: /dangerouslySetInnerHTML\s*=\s*\{\s*\{\s*__html:\s*(props|data|response|user|input)/gi,
    type: 'xss',
    severity: 'high',
    description: 'Potential XSS: dangerouslySetInnerHTML with user-controlled data',
    recommendation: 'Sanitize user input with DOMPurify or use safe rendering methods',
    cwe_id: 'CWE-79',
    fileTypes: ['.tsx', '.jsx'],
  },
  {
    pattern: /\.innerHTML\s*=\s*[^;]*(\$\{|req\.|params\.|body\.|user|input)/gi,
    type: 'xss',
    severity: 'high',
    description: 'Potential XSS: innerHTML assignment with dynamic content',
    recommendation: 'Use textContent for text or sanitize HTML with DOMPurify',
    cwe_id: 'CWE-79',
    fileTypes: ['.ts', '.js', '.tsx', '.jsx'],
  },
  {
    pattern: /document\.write\s*\([^)]*(\$\{|req\.|params\.|user|input)/gi,
    type: 'xss',
    severity: 'high',
    description: 'Potential XSS: document.write with dynamic content',
    recommendation: 'Avoid document.write; use DOM manipulation methods instead',
    cwe_id: 'CWE-79',
    fileTypes: ['.ts', '.js', '.tsx', '.jsx'],
  },

  // ===========================================
  // Hardcoded Secrets (CWE-798)
  // ===========================================
  {
    pattern: /(api[_-]?key|apikey)\s*[:=]\s*['"][a-zA-Z0-9_\-]{16,}['"]/gi,
    type: 'hardcoded_secret',
    severity: 'critical',
    description: 'Hardcoded API key detected',
    recommendation: 'Move API keys to environment variables (.env file)',
    cwe_id: 'CWE-798',
    skipFiles: [/\.env\.example$/i, /\.env\.sample$/i, /\.env\.template$/i],
  },
  {
    pattern: /(secret|password|passwd|pwd)\s*[:=]\s*['"][^'"]{8,}['"]/gi,
    type: 'hardcoded_secret',
    severity: 'critical',
    description: 'Hardcoded secret or password detected',
    recommendation: 'Store secrets in environment variables, never in code',
    cwe_id: 'CWE-798',
    skipFiles: [/\.env\.example$/i, /\.test\./i, /\.spec\./i, /mock/i],
  },
  {
    pattern: /['"]sk-[a-zA-Z0-9]{32,}['"]/gi,
    type: 'hardcoded_secret',
    severity: 'critical',
    description: 'Hardcoded OpenAI/Stripe secret key detected',
    recommendation: 'Use environment variables for API keys: process.env.OPENAI_API_KEY',
    cwe_id: 'CWE-798',
    skipFiles: [/\.env\.example$/i],
  },
  {
    pattern: /['"]ghp_[a-zA-Z0-9]{36}['"]/gi,
    type: 'hardcoded_secret',
    severity: 'critical',
    description: 'Hardcoded GitHub personal access token detected',
    recommendation: 'Use GITHUB_TOKEN environment variable',
    cwe_id: 'CWE-798',
  },
  {
    pattern: /['"]xox[baprs]-[a-zA-Z0-9\-]{10,}['"]/gi,
    type: 'hardcoded_secret',
    severity: 'critical',
    description: 'Hardcoded Slack token detected',
    recommendation: 'Store Slack tokens in environment variables',
    cwe_id: 'CWE-798',
  },
  {
    pattern: /['"]AKIA[A-Z0-9]{16}['"]/gi,
    type: 'hardcoded_secret',
    severity: 'critical',
    description: 'Hardcoded AWS Access Key ID detected',
    recommendation: 'Use AWS credentials file or environment variables',
    cwe_id: 'CWE-798',
  },
  {
    pattern: /['"]pk_live_[a-zA-Z0-9]{24,}['"]/gi,
    type: 'hardcoded_secret',
    severity: 'high',
    description: 'Hardcoded Stripe live publishable key detected',
    recommendation: 'Use environment variables for Stripe keys',
    cwe_id: 'CWE-798',
  },
  {
    pattern: /(private[_-]?key|privatekey)\s*[:=]\s*['"]-----BEGIN/gi,
    type: 'hardcoded_secret',
    severity: 'critical',
    description: 'Hardcoded private key detected',
    recommendation: 'Store private keys in secure key management systems',
    cwe_id: 'CWE-798',
  },

  // ===========================================
  // Command Injection (CWE-78)
  // ===========================================
  {
    pattern: /(exec|execSync|spawn|spawnSync)\s*\([^)]*(\$\{|req\.|params\.|body\.|user|input)/gi,
    type: 'command_injection',
    severity: 'critical',
    description: 'Potential command injection: user input in shell command',
    recommendation: 'Validate and sanitize input, use allowlists for commands',
    cwe_id: 'CWE-78',
    fileTypes: ['.ts', '.js'],
  },
  {
    pattern: /child_process[^;]*\([^)]*(\+|`)/gi,
    type: 'command_injection',
    severity: 'high',
    description: 'Potential command injection via child_process with dynamic input',
    recommendation: 'Avoid dynamic command construction, use parameterized arguments',
    cwe_id: 'CWE-78',
    fileTypes: ['.ts', '.js'],
  },
  {
    pattern: /subprocess\.(run|call|Popen)\s*\([^)]*f["']/gi,
    type: 'command_injection',
    severity: 'critical',
    description: 'Potential command injection in Python subprocess with f-string',
    recommendation: 'Pass command as list of arguments, not shell string',
    cwe_id: 'CWE-78',
    fileTypes: ['.py'],
  },
  {
    pattern: /os\.system\s*\([^)]*(\+|f["']|%)/gi,
    type: 'command_injection',
    severity: 'critical',
    description: 'Potential command injection via os.system',
    recommendation: 'Use subprocess with list arguments instead of os.system',
    cwe_id: 'CWE-78',
    fileTypes: ['.py'],
  },

  // ===========================================
  // Path Traversal (CWE-22)
  // ===========================================
  {
    pattern: /path\.join\s*\([^)]*(\.\.|req\.|params\.|body\.|query\.)/gi,
    type: 'path_traversal',
    severity: 'high',
    description: 'Potential path traversal: user input in file path',
    recommendation: 'Validate path does not contain ".." and stays within allowed directory',
    cwe_id: 'CWE-22',
    fileTypes: ['.ts', '.js'],
  },
  {
    pattern: /(readFile|writeFile|readFileSync|writeFileSync)\s*\([^)]*(\$\{|req\.|params\.|body\.)/gi,
    type: 'path_traversal',
    severity: 'high',
    description: 'Potential path traversal in file operation',
    recommendation: 'Use path.resolve and validate paths against a base directory',
    cwe_id: 'CWE-22',
    fileTypes: ['.ts', '.js'],
  },
  {
    pattern: /open\s*\([^)]*(\+|f["'].*\{|%)/gi,
    type: 'path_traversal',
    severity: 'high',
    description: 'Potential path traversal in Python file open',
    recommendation: 'Validate and sanitize file paths, use pathlib for path manipulation',
    cwe_id: 'CWE-22',
    fileTypes: ['.py'],
  },

  // ===========================================
  // Insecure Randomness (CWE-330)
  // ===========================================
  {
    pattern: /Math\.random\s*\(\s*\).*(?:token|key|secret|password|session|auth|id)/gi,
    type: 'insecure_random',
    severity: 'medium',
    description: 'Insecure randomness: Math.random() used for security-sensitive value',
    recommendation: 'Use crypto.randomBytes() or crypto.randomUUID() for security tokens',
    cwe_id: 'CWE-330',
    fileTypes: ['.ts', '.js', '.tsx', '.jsx'],
  },

  // ===========================================
  // Sensitive Data Exposure (CWE-200)
  // ===========================================
  {
    pattern: /console\.(log|info|debug)\s*\([^)]*(?:password|secret|token|key|credential)/gi,
    type: 'sensitive_data_exposure',
    severity: 'medium',
    description: 'Sensitive data may be logged to console',
    recommendation: 'Remove console logs with sensitive data before production',
    cwe_id: 'CWE-200',
    fileTypes: ['.ts', '.js', '.tsx', '.jsx'],
  },
  {
    pattern: /print\s*\([^)]*(?:password|secret|token|key|credential)/gi,
    type: 'sensitive_data_exposure',
    severity: 'medium',
    description: 'Sensitive data may be printed (Python)',
    recommendation: 'Use proper logging with sensitive data masking',
    cwe_id: 'CWE-200',
    fileTypes: ['.py'],
  },
];

// ===========================================
// Main Analysis Function
// ===========================================

export function analyzeSecurityPatterns(files: FileInput[]): SecurityAnalysisResult {
  const findings: SecurityFinding[] = [];
  let filesScanned = 0;

  for (const file of files) {
    // Skip non-code files
    if (!isCodeFile(file.path)) continue;

    filesScanned++;
    const fileFindings = scanFile(file);
    findings.push(...fileFindings);
  }

  // Calculate stats
  const stats = {
    critical: findings.filter(f => f.severity === 'critical').length,
    high: findings.filter(f => f.severity === 'high').length,
    medium: findings.filter(f => f.severity === 'medium').length,
    low: findings.filter(f => f.severity === 'low').length,
    files_scanned: filesScanned,
  };

  return {
    findings,
    stats,
    has_critical_issues: stats.critical > 0,
  };
}

// ===========================================
// File Scanner
// ===========================================

function scanFile(file: FileInput): SecurityFinding[] {
  const findings: SecurityFinding[] = [];
  const lines = file.content.split('\n');
  const fileExt = getFileExtension(file.path);

  for (const matcher of SECURITY_PATTERNS) {
    // Check file type filter
    if (matcher.fileTypes && !matcher.fileTypes.includes(fileExt)) {
      continue;
    }

    // Check skip patterns
    if (matcher.skipFiles?.some(skip => skip.test(file.path))) {
      continue;
    }

    // Search for pattern in file
    const regex = new RegExp(matcher.pattern.source, matcher.pattern.flags);
    let match;

    while ((match = regex.exec(file.content)) !== null) {
      // Find line number
      const lineNumber = getLineNumber(file.content, match.index);
      const codeLine = lines[lineNumber - 1]?.trim();

      // Skip if it looks like a comment
      if (isComment(codeLine, fileExt)) {
        continue;
      }

      findings.push({
        id: uuidv4(),
        type: matcher.type,
        severity: matcher.severity,
        file_path: file.path,
        line_number: lineNumber,
        code_snippet: truncateSnippet(codeLine, 100),
        description: matcher.description,
        recommendation: matcher.recommendation,
        cwe_id: matcher.cwe_id,
      });
    }
  }

  return findings;
}

// ===========================================
// Individual Detectors (for direct testing)
// ===========================================

export function detectSQLInjection(file: FileInput): SecurityFinding[] {
  const patterns = SECURITY_PATTERNS.filter(p => p.type === 'sql_injection');
  return runPatterns(file, patterns);
}

export function detectXSS(file: FileInput): SecurityFinding[] {
  const patterns = SECURITY_PATTERNS.filter(p => p.type === 'xss');
  return runPatterns(file, patterns);
}

export function detectHardcodedSecrets(file: FileInput): SecurityFinding[] {
  const patterns = SECURITY_PATTERNS.filter(p => p.type === 'hardcoded_secret');
  return runPatterns(file, patterns);
}

export function detectCommandInjection(file: FileInput): SecurityFinding[] {
  const patterns = SECURITY_PATTERNS.filter(p => p.type === 'command_injection');
  return runPatterns(file, patterns);
}

export function detectPathTraversal(file: FileInput): SecurityFinding[] {
  const patterns = SECURITY_PATTERNS.filter(p => p.type === 'path_traversal');
  return runPatterns(file, patterns);
}

function runPatterns(file: FileInput, patterns: PatternMatcher[]): SecurityFinding[] {
  const findings: SecurityFinding[] = [];
  const lines = file.content.split('\n');
  const fileExt = getFileExtension(file.path);

  for (const matcher of patterns) {
    if (matcher.fileTypes && !matcher.fileTypes.includes(fileExt)) continue;
    if (matcher.skipFiles?.some(skip => skip.test(file.path))) continue;

    const regex = new RegExp(matcher.pattern.source, matcher.pattern.flags);
    let match;

    while ((match = regex.exec(file.content)) !== null) {
      const lineNumber = getLineNumber(file.content, match.index);
      const codeLine = lines[lineNumber - 1]?.trim();

      if (isComment(codeLine, fileExt)) continue;

      findings.push({
        id: uuidv4(),
        type: matcher.type,
        severity: matcher.severity,
        file_path: file.path,
        line_number: lineNumber,
        code_snippet: truncateSnippet(codeLine, 100),
        description: matcher.description,
        recommendation: matcher.recommendation,
        cwe_id: matcher.cwe_id,
      });
    }
  }

  return findings;
}

// ===========================================
// Helper Functions
// ===========================================

function isCodeFile(path: string): boolean {
  const codeExtensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs', '.java', '.rb', '.php'];
  return codeExtensions.some(ext => path.endsWith(ext));
}

function getFileExtension(path: string): string {
  const lastDot = path.lastIndexOf('.');
  return lastDot !== -1 ? path.slice(lastDot) : '';
}

function getLineNumber(content: string, index: number): number {
  const beforeMatch = content.slice(0, index);
  return (beforeMatch.match(/\n/g) || []).length + 1;
}

function truncateSnippet(code: string, maxLength: number): string {
  if (code.length <= maxLength) return code;
  return code.slice(0, maxLength - 3) + '...';
}

function isComment(line: string, ext: string): boolean {
  const trimmed = line.trim();

  // JavaScript/TypeScript comments
  if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
    return trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*');
  }

  // Python comments
  if (ext === '.py') {
    return trimmed.startsWith('#') || trimmed.startsWith('"""') || trimmed.startsWith("'''");
  }

  return false;
}
