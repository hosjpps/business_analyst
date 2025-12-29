/**
 * Tests for Security Pattern Analyzer
 *
 * Tests vulnerability detection patterns:
 * - SQL Injection (CWE-89)
 * - XSS (CWE-79)
 * - Hardcoded Secrets (CWE-798)
 * - Command Injection (CWE-78)
 * - Path Traversal (CWE-22)
 * - Insecure Randomness (CWE-330)
 * - Sensitive Data Exposure (CWE-200)
 */

import { describe, it, expect } from 'vitest';
import {
  analyzeSecurityPatterns,
  detectSQLInjection,
  detectXSS,
  detectHardcodedSecrets,
  detectCommandInjection,
  detectPathTraversal,
} from '@/lib/analyzers/security';
import type { FileInput } from '@/types';

// ===========================================
// Test Suite: SQL Injection Detection
// ===========================================

describe('Security Analyzer - SQL Injection', () => {
  it('should detect SQL injection with template literals', () => {
    const file: FileInput = {
      path: 'src/db.ts',
      content: `
        const userId = req.params.id;
        db.query(\`SELECT * FROM users WHERE id = \${userId}\`);
      `,
    };

    const findings = detectSQLInjection(file);
    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0].type).toBe('sql_injection');
    expect(findings[0].severity).toBe('critical');
    expect(findings[0].cwe_id).toBe('CWE-89');
  });

  it('should detect SQL injection with string concatenation', () => {
    const file: FileInput = {
      path: 'src/api.ts',
      content: `
        const query = "SELECT * FROM products WHERE name = '" + req.body.name + "'";
        db.execute(query + req.body.filter);
      `,
    };

    const findings = detectSQLInjection(file);
    expect(findings.length).toBeGreaterThan(0);
  });

  it('should detect raw SQL injection', () => {
    const file: FileInput = {
      path: 'src/prisma.ts',
      content: `
        await prisma.rawQuery(\`DELETE FROM orders WHERE id = \${orderId}\`);
      `,
    };

    const findings = detectSQLInjection(file);
    expect(findings.length).toBeGreaterThan(0);
  });

  it('should detect Python f-string SQL injection', () => {
    const file: FileInput = {
      path: 'app/db.py',
      content: `
        cursor.execute(f"SELECT * FROM users WHERE email = '{email}'")
      `,
    };

    const findings = detectSQLInjection(file);
    expect(findings.length).toBeGreaterThan(0);
  });

  it('should NOT flag parameterized queries', () => {
    const file: FileInput = {
      path: 'src/safe.ts',
      content: `
        db.query("SELECT * FROM users WHERE id = ?", [userId]);
        db.execute("INSERT INTO logs (msg) VALUES (?)", [message]);
      `,
    };

    const findings = detectSQLInjection(file);
    expect(findings.length).toBe(0);
  });
});

// ===========================================
// Test Suite: XSS Detection
// ===========================================

describe('Security Analyzer - XSS', () => {
  it('should detect dangerouslySetInnerHTML with dynamic content', () => {
    const file: FileInput = {
      path: 'src/components/Comment.tsx',
      content: `
        <div dangerouslySetInnerHTML={{ __html: \`<p>\${userInput}</p>\` }} />
      `,
    };

    const findings = detectXSS(file);
    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0].type).toBe('xss');
    expect(findings[0].cwe_id).toBe('CWE-79');
  });

  it('should detect dangerouslySetInnerHTML with user data', () => {
    const file: FileInput = {
      path: 'src/Article.tsx',
      content: `
        <div dangerouslySetInnerHTML={{ __html: props.content }} />
        <span dangerouslySetInnerHTML={{ __html: userData.bio }} />
      `,
    };

    const findings = detectXSS(file);
    expect(findings.length).toBeGreaterThan(0);
  });

  it('should detect innerHTML assignment with dynamic content', () => {
    const file: FileInput = {
      path: 'src/render.js',
      content: `
        element.innerHTML = \`<div>\${userContent}</div>\`;
        container.innerHTML = "Hello " + req.body.name;
      `,
    };

    const findings = detectXSS(file);
    expect(findings.length).toBeGreaterThan(0);
  });

  it('should detect document.write with user input', () => {
    const file: FileInput = {
      path: 'src/legacy.js',
      content: `
        document.write("Welcome, " + userName);
        document.write(\`<script src="\${userScript}"></script>\`);
      `,
    };

    const findings = detectXSS(file);
    expect(findings.length).toBeGreaterThan(0);
  });

  it('should NOT flag safe React JSX', () => {
    const file: FileInput = {
      path: 'src/Safe.tsx',
      content: `
        <div>{userName}</div>
        <p className={styles.text}>{content}</p>
      `,
    };

    const findings = detectXSS(file);
    expect(findings.length).toBe(0);
  });
});

// ===========================================
// Test Suite: Hardcoded Secrets Detection
// ===========================================

describe('Security Analyzer - Hardcoded Secrets', () => {
  it('should detect hardcoded API keys', () => {
    const file: FileInput = {
      path: 'src/config.ts',
      content: `
        const api_key = "test_key_abcdefghijklmnop1234567890";
        const apiKey = "demo_key_abcdefghijklmnop123456";
      `,
    };

    const findings = detectHardcodedSecrets(file);
    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0].cwe_id).toBe('CWE-798');
  });

  it('should detect OpenAI secret keys', () => {
    const file: FileInput = {
      path: 'src/ai.ts',
      content: `
        const OPENAI_KEY = "sk-abcdefghijklmnopqrstuvwxyz1234567890";
      `,
    };

    const findings = detectHardcodedSecrets(file);
    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0].description).toContain('OpenAI');
  });

  it('should detect GitHub personal access tokens', () => {
    const file: FileInput = {
      path: 'src/github.ts',
      content: `
        const token = "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
      `,
    };

    const findings = detectHardcodedSecrets(file);
    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0].description).toContain('GitHub');
  });

  it('should detect AWS access keys', () => {
    const file: FileInput = {
      path: 'src/aws.ts',
      content: `
        const awsKey = "AKIAIOSFODNN7EXAMPLE";
      `,
    };

    const findings = detectHardcodedSecrets(file);
    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0].description).toContain('AWS');
  });

  it('should detect Slack tokens', () => {
    const file: FileInput = {
      path: 'src/slack.ts',
      content: `
        const slackToken = "xoxb-test-token-placeholder-abc";
      `,
    };

    const findings = detectHardcodedSecrets(file);
    expect(findings.length).toBeGreaterThan(0);
  });

  it('should detect hardcoded passwords', () => {
    const file: FileInput = {
      path: 'src/db.ts',
      content: `
        const password = "super_secret_password123";
        const dbPwd = "MyDatabasePassword!@#";
      `,
    };

    const findings = detectHardcodedSecrets(file);
    expect(findings.length).toBeGreaterThan(0);
  });

  it('should detect private keys', () => {
    const file: FileInput = {
      path: 'src/auth.ts',
      content: `
        const privateKey = "-----BEGIN RSA PRIVATE KEY-----";
      `,
    };

    const findings = detectHardcodedSecrets(file);
    expect(findings.length).toBeGreaterThan(0);
  });

  it('should SKIP .env.example files', () => {
    const file: FileInput = {
      path: '.env.example',
      content: `
        API_KEY="your-api-key-here-minimum-16-chars"
        SECRET="your-secret-here-minimum-8-chars"
      `,
    };

    const findings = detectHardcodedSecrets(file);
    expect(findings.length).toBe(0);
  });

  it('should SKIP test/mock files for passwords', () => {
    const file: FileInput = {
      path: 'src/auth.test.ts',
      content: `
        const password = "test_password_123";
      `,
    };

    const findings = detectHardcodedSecrets(file);
    expect(findings.length).toBe(0);
  });

  it('should NOT flag environment variable usage', () => {
    const file: FileInput = {
      path: 'src/config.ts',
      content: `
        const apiKey = process.env.API_KEY;
        const secret = process.env.SECRET;
      `,
    };

    const findings = detectHardcodedSecrets(file);
    expect(findings.length).toBe(0);
  });
});

// ===========================================
// Test Suite: Command Injection Detection
// ===========================================

describe('Security Analyzer - Command Injection', () => {
  it('should detect exec with user input', () => {
    const file: FileInput = {
      path: 'src/utils.ts',
      content: `
        exec(\`rm -rf \${req.body.path}\`);
        execSync("ls " + params.dir);
      `,
    };

    const findings = detectCommandInjection(file);
    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0].cwe_id).toBe('CWE-78');
  });

  it('should detect spawn with dynamic arguments', () => {
    const file: FileInput = {
      path: 'src/process.ts',
      content: `
        spawn("bash", ["-c", \`echo \${userInput}\`]);
      `,
    };

    const findings = detectCommandInjection(file);
    expect(findings.length).toBeGreaterThan(0);
  });

  it('should detect child_process with concatenation', () => {
    const file: FileInput = {
      path: 'src/shell.ts',
      content: `
        require('child_process').exec("cat " + filename);
      `,
    };

    const findings = detectCommandInjection(file);
    expect(findings.length).toBeGreaterThan(0);
  });

  it('should detect Python subprocess with f-string', () => {
    const file: FileInput = {
      path: 'app/utils.py',
      content: `
        subprocess.run(f"grep {pattern} {file}")
        subprocess.Popen(f"curl {url}")
      `,
    };

    const findings = detectCommandInjection(file);
    expect(findings.length).toBeGreaterThan(0);
  });

  it('should detect Python os.system', () => {
    const file: FileInput = {
      path: 'app/legacy.py',
      content: `
        os.system("rm " + filename)
        os.system(f"chmod 755 {path}")
      `,
    };

    const findings = detectCommandInjection(file);
    expect(findings.length).toBeGreaterThan(0);
  });

  it('should NOT flag spawn with array arguments', () => {
    const file: FileInput = {
      path: 'src/safe.ts',
      content: `
        spawn("ls", ["-la", directory]);
        execFile("convert", [input, output]);
      `,
    };

    const findings = detectCommandInjection(file);
    expect(findings.length).toBe(0);
  });
});

// ===========================================
// Test Suite: Path Traversal Detection
// ===========================================

describe('Security Analyzer - Path Traversal', () => {
  it('should detect path.join with user input', () => {
    const file: FileInput = {
      path: 'src/files.ts',
      content: `
        const filePath = path.join(baseDir, req.params.filename);
        const full = path.join(uploads, "../" + name);
      `,
    };

    const findings = detectPathTraversal(file);
    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0].cwe_id).toBe('CWE-22');
  });

  it('should detect readFile with dynamic path', () => {
    const file: FileInput = {
      path: 'src/read.ts',
      content: `
        fs.readFile(\`/data/\${req.body.file}\`, callback);
        fs.readFileSync(basePath + req.query.name);
      `,
    };

    const findings = detectPathTraversal(file);
    expect(findings.length).toBeGreaterThan(0);
  });

  it('should detect writeFile with user input', () => {
    const file: FileInput = {
      path: 'src/write.ts',
      content: `
        fs.writeFile(\`./uploads/\${params.name}\`, data);
      `,
    };

    const findings = detectPathTraversal(file);
    expect(findings.length).toBeGreaterThan(0);
  });

  it('should detect Python open with dynamic path', () => {
    const file: FileInput = {
      path: 'app/files.py',
      content: `
        with open(f"/data/{filename}") as f:
            data = f.read()
      `,
    };

    const findings = detectPathTraversal(file);
    expect(findings.length).toBeGreaterThan(0);
  });

  it('should NOT flag validated paths', () => {
    const file: FileInput = {
      path: 'src/safe.ts',
      content: `
        const safePath = path.join(__dirname, "static", "images");
        fs.readFile(path.resolve("./config.json"), callback);
      `,
    };

    const findings = detectPathTraversal(file);
    expect(findings.length).toBe(0);
  });
});

// ===========================================
// Test Suite: Main Analysis Function
// ===========================================

describe('Security Analyzer - analyzeSecurityPatterns', () => {
  it('should return empty results for clean files', () => {
    const files: FileInput[] = [
      {
        path: 'src/clean.ts',
        content: `
          const x = 1 + 2;
          console.log(x);
        `,
      },
    ];

    const result = analyzeSecurityPatterns(files);
    expect(result.findings.length).toBe(0);
    expect(result.has_critical_issues).toBe(false);
    expect(result.stats.files_scanned).toBe(1);
  });

  it('should aggregate findings from multiple files', () => {
    const files: FileInput[] = [
      {
        path: 'src/db.ts',
        content: `db.query(\`SELECT * FROM x WHERE id = \${id}\`);`,
      },
      {
        path: 'src/ui.tsx',
        content: `<div dangerouslySetInnerHTML={{ __html: props.html }} />`,
      },
    ];

    const result = analyzeSecurityPatterns(files);
    expect(result.findings.length).toBe(2);
    expect(result.stats.files_scanned).toBe(2);
  });

  it('should calculate stats correctly', () => {
    const files: FileInput[] = [
      {
        path: 'src/vulnerable.ts',
        content: `
          db.query(\`SELECT * FROM x WHERE id = \${id}\`);
          const key = "sk-abcdefghijklmnopqrstuvwxyz123456789012";
          element.innerHTML = \`<div>\${userInput}</div>\`;
        `,
      },
    ];

    const result = analyzeSecurityPatterns(files);
    expect(result.stats.critical).toBeGreaterThan(0);
    expect(result.has_critical_issues).toBe(true);
  });

  it('should skip non-code files', () => {
    const files: FileInput[] = [
      { path: 'README.md', content: 'password = "test"' },
      { path: 'data.json', content: '{"api_key": "secret123456789"}' },
      { path: 'styles.css', content: '.password { color: red; }' },
    ];

    const result = analyzeSecurityPatterns(files);
    expect(result.stats.files_scanned).toBe(0);
    expect(result.findings.length).toBe(0);
  });

  it('should include line numbers in findings', () => {
    const files: FileInput[] = [
      {
        path: 'src/test.ts',
        content: `const a = 1;
const b = 2;
db.query(\`SELECT * FROM x WHERE id = \${id}\`);
const c = 3;`,
      },
    ];

    const result = analyzeSecurityPatterns(files);
    expect(result.findings.length).toBe(1);
    expect(result.findings[0].line_number).toBe(3);
  });

  it('should include code snippets in findings', () => {
    const files: FileInput[] = [
      {
        path: 'src/test.ts',
        content: `db.query(\`SELECT * FROM x WHERE id = \${id}\`);`,
      },
    ];

    const result = analyzeSecurityPatterns(files);
    expect(result.findings[0].code_snippet).toBeDefined();
    expect(result.findings[0].code_snippet).toContain('query');
  });

  it('should generate unique IDs for each finding', () => {
    const files: FileInput[] = [
      {
        path: 'src/multi.ts',
        content: `
          db.query(\`SELECT \${a}\`);
          db.query(\`SELECT \${b}\`);
        `,
      },
    ];

    const result = analyzeSecurityPatterns(files);
    const ids = result.findings.map(f => f.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('should skip commented code', () => {
    const files: FileInput[] = [
      {
        path: 'src/commented.ts',
        content: `
          // db.query(\`SELECT * FROM x WHERE id = \${id}\`);
          /* const key = "sk-abcdefghijklmnopqrstuvwxyz123456789012"; */
        `,
      },
    ];

    const result = analyzeSecurityPatterns(files);
    expect(result.findings.length).toBe(0);
  });
});

// ===========================================
// Test Suite: Insecure Randomness
// ===========================================

describe('Security Analyzer - Insecure Randomness', () => {
  it('should detect Math.random for tokens', () => {
    const files: FileInput[] = [
      {
        path: 'src/auth.ts',
        content: `
          function generateToken() {
            return Math.random().toString(36).substring(2) + '_token';
          }
          const sessionId = Math.random().toString() + '_session';
        `,
      },
    ];

    const result = analyzeSecurityPatterns(files);
    const randomFindings = result.findings.filter(f => f.type === 'insecure_random');
    expect(randomFindings.length).toBeGreaterThan(0);
    expect(randomFindings[0].cwe_id).toBe('CWE-330');
  });
});

// ===========================================
// Test Suite: Sensitive Data Exposure
// ===========================================

describe('Security Analyzer - Sensitive Data Exposure', () => {
  it('should detect sensitive data in console.log', () => {
    const files: FileInput[] = [
      {
        path: 'src/debug.ts',
        content: `
          console.log("Password:", password);
          console.log("Token: " + token);
        `,
      },
    ];

    const result = analyzeSecurityPatterns(files);
    const exposureFindings = result.findings.filter(f => f.type === 'sensitive_data_exposure');
    expect(exposureFindings.length).toBeGreaterThan(0);
    expect(exposureFindings[0].cwe_id).toBe('CWE-200');
  });

  it('should detect Python print with sensitive data', () => {
    const files: FileInput[] = [
      {
        path: 'app/debug.py',
        content: `
          print("API Key:", api_key)
          print(f"Password: {password}")
        `,
      },
    ];

    const result = analyzeSecurityPatterns(files);
    const exposureFindings = result.findings.filter(f => f.type === 'sensitive_data_exposure');
    expect(exposureFindings.length).toBeGreaterThan(0);
  });
});
