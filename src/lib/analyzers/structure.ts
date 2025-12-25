import type { FileInput, ProjectStructure, ProjectStage } from '@/types';

// ===========================================
// Analyze Project Structure
// ===========================================

export function analyzeStructure(files: FileInput[]): ProjectStructure {
  const folders = new Set<string>();
  const fileNames = new Set<string>();
  const entryPoints: string[] = [];

  for (const file of files) {
    fileNames.add(file.path);

    // Извлекаем папки
    const parts = file.path.split('/');
    if (parts.length > 1) {
      folders.add(parts[0]);
    }

    // Определяем entry points
    if (file.path.match(/^(src\/)?(index|main|app|server)\.(ts|tsx|js|jsx|py)$/)) {
      entryPoints.push(file.path);
    }
  }

  return {
    folders: Array.from(folders),
    files: Array.from(fileNames),
    entry_points: entryPoints,
    has_package_json: fileNames.has('package.json'),
    has_deploy_config:
      fileNames.has('vercel.json') ||
      fileNames.has('netlify.toml') ||
      fileNames.has('Dockerfile') ||
      fileNames.has('docker-compose.yml') ||
      fileNames.has('fly.toml') ||
      fileNames.has('railway.json'),
    has_tests:
      folders.has('tests') ||
      folders.has('test') ||
      folders.has('__tests__') ||
      Array.from(fileNames).some(f => f.includes('.test.') || f.includes('.spec.')),
    has_docs:
      folders.has('docs') ||
      folders.has('documentation') ||
      fileNames.has('README.md') ||
      fileNames.has('readme.md')
  };
}

// ===========================================
// Detect Tech Stack
// ===========================================

export function detectTechStack(files: FileInput[]): string[] {
  const stack: string[] = [];

  // Ищем package.json
  const packageJson = files.find(f => f.path === 'package.json');
  if (packageJson) {
    try {
      const pkg = JSON.parse(packageJson.content);
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

      if (allDeps['next']) stack.push('Next.js');
      else if (allDeps['react']) stack.push('React');
      if (allDeps['vue']) stack.push('Vue');
      if (allDeps['svelte']) stack.push('Svelte');
      if (allDeps['express']) stack.push('Express');
      if (allDeps['fastify']) stack.push('Fastify');
      if (allDeps['typescript']) stack.push('TypeScript');
      if (allDeps['tailwindcss']) stack.push('Tailwind CSS');
      if (allDeps['prisma']) stack.push('Prisma');
      if (allDeps['drizzle-orm']) stack.push('Drizzle');
      if (allDeps['@supabase/supabase-js']) stack.push('Supabase');
      if (allDeps['firebase']) stack.push('Firebase');
      if (allDeps['mongoose']) stack.push('MongoDB');
      if (allDeps['pg']) stack.push('PostgreSQL');
    } catch {
      // Невалидный JSON
    }
  }

  // requirements.txt для Python
  const requirements = files.find(f => f.path === 'requirements.txt');
  if (requirements) {
    stack.push('Python');
    if (requirements.content.includes('fastapi')) stack.push('FastAPI');
    if (requirements.content.includes('django')) stack.push('Django');
    if (requirements.content.includes('flask')) stack.push('Flask');
  }

  // pyproject.toml
  const pyproject = files.find(f => f.path === 'pyproject.toml');
  if (pyproject) {
    stack.push('Python');
  }

  // Go
  const goMod = files.find(f => f.path === 'go.mod');
  if (goMod) {
    stack.push('Go');
  }

  // Rust
  const cargoToml = files.find(f => f.path === 'Cargo.toml');
  if (cargoToml) {
    stack.push('Rust');
  }

  return [...new Set(stack)];
}

// ===========================================
// Detect Project Stage
// ===========================================

export function detectStage(
  files: FileInput[],
  structure: ProjectStructure
): ProjectStage {
  const hasSrc = structure.folders.includes('src') || structure.entry_points.length > 0;
  const hasDocs = structure.has_docs;
  const hasDeployConfig = structure.has_deploy_config;
  const hasTests = structure.has_tests;

  // Подсчитываем количество кода
  const codeFiles = files.filter(f =>
    f.path.match(/\.(ts|tsx|js|jsx|py|go|rs)$/) &&
    !f.path.includes('test') &&
    !f.path.includes('spec')
  );
  const totalCodeLines = codeFiles.reduce((sum, f) =>
    sum + f.content.split('\n').length, 0
  );

  // Логика определения стадии
  if (totalCodeLines < 50 && !hasSrc) {
    return 'documentation';
  }

  if (hasDeployConfig && totalCodeLines > 500 && hasTests) {
    return 'growing';
  }

  if (hasDeployConfig && totalCodeLines > 200) {
    return 'launched';
  }

  if (hasSrc || totalCodeLines > 100) {
    return 'mvp';
  }

  return 'documentation';
}

// ===========================================
// Count Lines
// ===========================================

export function countTotalLines(files: FileInput[]): number {
  return files.reduce((sum, file) => sum + file.content.split('\n').length, 0);
}
