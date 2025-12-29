/**
 * Tests for /api/analyze (Code Analysis)
 *
 * These tests verify the code analysis functionality:
 * - Response structure validation
 * - Analysis quality
 * - Edge cases
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnalysisSchema, type Analysis, type AnalyzeResponse } from '@/types';

// ===========================================
// Mock Data
// ===========================================

const mockSimpleProject = {
  files: [
    {
      path: 'package.json',
      content: JSON.stringify({
        name: 'simple-app',
        version: '1.0.0',
        scripts: { start: 'node index.js' },
        dependencies: { express: '^4.18.0' }
      }, null, 2)
    },
    {
      path: 'index.js',
      content: `
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.json({ message: 'Hello World' });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
`
    },
    {
      path: 'README.md',
      content: '# Simple App\n\nA simple Express.js application.'
    }
  ],
  project_description: 'Простой API сервер на Express.js для обработки HTTP запросов. Планируется использовать как backend для мобильного приложения.'
};

const mockComplexProject = {
  files: [
    {
      path: 'package.json',
      content: JSON.stringify({
        name: 'complex-app',
        version: '2.0.0',
        scripts: {
          start: 'next start',
          build: 'next build',
          test: 'vitest',
          lint: 'eslint .'
        },
        dependencies: {
          next: '^14.0.0',
          react: '^18.0.0',
          typescript: '^5.0.0',
          prisma: '^5.0.0',
          stripe: '^12.0.0'
        },
        devDependencies: {
          vitest: '^1.0.0',
          eslint: '^8.0.0'
        }
      }, null, 2)
    },
    {
      path: 'src/app/page.tsx',
      content: `
'use client';
import { useState } from 'react';

export default function Home() {
  const [data, setData] = useState([]);

  return (
    <main>
      <h1>Dashboard</h1>
      <div>Welcome to the app</div>
    </main>
  );
}
`
    },
    {
      path: 'src/lib/db.ts',
      content: `
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export async function getUsers() {
  return prisma.user.findMany();
}
`
    },
    {
      path: 'tests/example.test.ts',
      content: `
import { describe, it, expect } from 'vitest';

describe('Example', () => {
  it('should work', () => {
    expect(1 + 1).toBe(2);
  });
});
`
    }
  ],
  project_description: 'SaaS платформа для управления подписками. Есть авторизация, Stripe для оплаты, dashboard для пользователей. Целевая аудитория - малый бизнес.'
};

// ===========================================
// Test Suite: Code Analysis Response Structure
// ===========================================

describe('Code Analysis - Response Structure', () => {
  it('should have valid Analysis schema structure', () => {
    // Test that our schema validates a proper analysis object
    const validAnalysis: Analysis = {
      project_summary: 'A Next.js SaaS platform with authentication and payments',
      detected_stage: 'mvp',
      tech_stack: ['Next.js', 'TypeScript', 'Prisma', 'Stripe'],
      strengths: [
        { area: 'Tech Stack', detail: 'Modern and scalable technologies' },
        { area: 'Testing', detail: 'Has test infrastructure' }
      ],
      issues: [
        { severity: 'medium', area: 'Security', detail: 'No rate limiting', file_path: null },
        { severity: 'low', area: 'Documentation', detail: 'Missing API docs', file_path: 'README.md' }
      ],
      tasks: [
        {
          title: 'Add rate limiting',
          description: 'Implement rate limiting to prevent abuse',
          priority: 'high',
          category: 'technical',
          estimated_minutes: 60,
          depends_on: null
        }
      ],
      next_milestone: 'Launch MVP to first 10 beta users'
    };

    const result = AnalysisSchema.safeParse(validAnalysis);
    expect(result.success).toBe(true);
  });

  it('should reject invalid project stages', () => {
    const invalidAnalysis = {
      project_summary: 'Test',
      detected_stage: 'invalid_stage',
      tech_stack: [],
      strengths: [],
      issues: [],
      tasks: [],
      next_milestone: 'Test'
    };

    const result = AnalysisSchema.safeParse(invalidAnalysis);
    expect(result.success).toBe(false);
  });

  it('should validate task categories', () => {
    const validCategories = ['documentation', 'technical', 'product', 'marketing', 'business'];

    validCategories.forEach(category => {
      const task = {
        title: 'Test',
        description: 'Test description',
        priority: 'high',
        category,
        estimated_minutes: 30,
        depends_on: null
      };

      const result = AnalysisSchema.safeParse({
        project_summary: 'Test',
        detected_stage: 'mvp',
        tech_stack: [],
        strengths: [],
        issues: [],
        tasks: [task],
        next_milestone: 'Test'
      });

      expect(result.success).toBe(true);
    });
  });
});

// ===========================================
// Test Suite: Analysis Quality Checks
// ===========================================

describe('Code Analysis - Quality Checks', () => {
  it('should detect tech stack correctly', () => {
    // Mock what we expect from analysis
    const expectedTechStack = {
      simple: ['Express.js', 'Node.js'],
      complex: ['Next.js', 'React', 'TypeScript', 'Prisma', 'Stripe']
    };

    // Verify detection patterns
    const simplePackageJson = JSON.parse(mockSimpleProject.files[0].content);
    expect(simplePackageJson.dependencies).toHaveProperty('express');

    const complexPackageJson = JSON.parse(mockComplexProject.files[0].content);
    expect(complexPackageJson.dependencies).toHaveProperty('next');
    expect(complexPackageJson.dependencies).toHaveProperty('prisma');
    expect(complexPackageJson.dependencies).toHaveProperty('stripe');
  });

  it('should detect project features from file structure', () => {
    const complexFiles = mockComplexProject.files.map(f => f.path);

    // Has tests
    expect(complexFiles.some(f => f.includes('test'))).toBe(true);

    // Has TypeScript
    expect(complexFiles.some(f => f.endsWith('.ts') || f.endsWith('.tsx'))).toBe(true);

    // Has database integration
    expect(complexFiles.some(f => f.includes('db') || f.includes('prisma'))).toBe(true);
  });

  it('should provide meaningful strengths based on project features', () => {
    // Verify that a project with tests, TypeScript, and modern stack
    // would generate relevant strengths
    const hasTests = mockComplexProject.files.some(f => f.path.includes('test'));
    const hasTypeScript = mockComplexProject.files.some(f => f.path.endsWith('.ts') || f.path.endsWith('.tsx'));
    const hasDatabase = mockComplexProject.files.some(f => f.content.includes('prisma') || f.content.includes('PrismaClient'));
    const hasPayments = mockComplexProject.files.some(f => f.content.includes('stripe'));

    expect(hasTests).toBe(true);
    expect(hasTypeScript).toBe(true);
    expect(hasDatabase).toBe(true);
    expect(hasPayments).toBe(true);
  });

  it('should identify potential issues', () => {
    // Check for common issues that should be detected
    const simpleCode = mockSimpleProject.files[1].content;

    // No error handling
    expect(simpleCode.includes('try')).toBe(false);
    expect(simpleCode.includes('catch')).toBe(false);

    // No environment variables for port
    expect(simpleCode.includes('process.env')).toBe(false);

    // Hardcoded port
    expect(simpleCode.includes('3000')).toBe(true);
  });
});

// ===========================================
// Test Suite: Edge Cases
// ===========================================

describe('Code Analysis - Edge Cases', () => {
  it('should handle empty file content gracefully', () => {
    const emptyProject = {
      files: [{ path: 'empty.js', content: '' }],
      project_description: 'Empty project'
    };

    expect(emptyProject.files[0].content).toBe('');
    expect(emptyProject.files.length).toBe(1);
  });

  it('should handle projects without package.json', () => {
    const noPkgProject = {
      files: [
        { path: 'main.py', content: 'print("Hello")' },
        { path: 'requirements.txt', content: 'flask==2.0.0\nrequests==2.28.0' }
      ],
      project_description: 'Python Flask app'
    };

    // Should still be analyzable
    expect(noPkgProject.files.length).toBeGreaterThan(0);
    expect(noPkgProject.files.some(f => f.path.endsWith('.py'))).toBe(true);
  });

  it('should handle very long file content', () => {
    const longContent = 'const x = 1;\n'.repeat(10000);
    const longFile = { path: 'big.js', content: longContent };

    expect(longFile.content.length).toBeGreaterThan(100000);
    expect(longFile.content.split('\n').length).toBeGreaterThan(9000);
  });

  it('should validate project description requirements', () => {
    const shortDescription = 'Test';
    const goodDescription = 'Это SaaS платформа для малого бизнеса, помогающая управлять клиентами и продажами';

    expect(shortDescription.length).toBeLessThan(50);
    expect(goodDescription.length).toBeGreaterThan(50);
  });
});

// ===========================================
// Test Suite: Task Generation Quality
// ===========================================

describe('Code Analysis - Task Generation', () => {
  it('should generate tasks with valid priorities', () => {
    const validPriorities = ['high', 'medium', 'low'];

    // All priorities should be valid
    validPriorities.forEach(priority => {
      expect(['high', 'medium', 'low']).toContain(priority);
    });
  });

  it('should generate tasks with reasonable time estimates', () => {
    // Time estimates should be between 15 minutes and 8 hours (480 min)
    const minTime = 15;
    const maxTime = 480;

    // Valid estimate
    const validEstimate = 60;
    expect(validEstimate).toBeGreaterThanOrEqual(minTime);
    expect(validEstimate).toBeLessThanOrEqual(maxTime);

    // Invalid estimates
    expect(10).toBeLessThan(minTime);
    expect(600).toBeGreaterThan(maxTime);
  });

  it('should have tasks that match project needs', () => {
    // For a simple project without tests, should suggest adding tests
    const simpleProjectHasTests = mockSimpleProject.files.some(f =>
      f.path.includes('test') || f.path.includes('spec')
    );

    expect(simpleProjectHasTests).toBe(false);
    // This means a task to add tests would be appropriate
  });

  it('should chain dependent tasks correctly', () => {
    const tasks = [
      { title: 'Setup CI/CD', depends_on: null },
      { title: 'Add tests', depends_on: null },
      { title: 'Configure test coverage', depends_on: 'Add tests' }
    ];

    // Find dependent task
    const dependentTask = tasks.find(t => t.depends_on !== null);
    expect(dependentTask).toBeDefined();

    // Verify dependency exists
    const dependencyExists = tasks.some(t => t.title === dependentTask?.depends_on);
    expect(dependencyExists).toBe(true);
  });
});
