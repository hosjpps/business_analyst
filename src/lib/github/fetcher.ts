import { Octokit } from '@octokit/rest';
import type { FileInput, RepoInfo } from '@/types';
import { withGitHubRetry } from '@/lib/utils/retry';

// ===========================================
// GitHub URL Parser
// ===========================================

export function parseRepoUrl(url: string): RepoInfo | null {
  // Поддерживаемые форматы:
  // https://github.com/owner/repo
  // https://github.com/owner/repo/tree/branch
  // github.com/owner/repo

  const patterns = [
    /github\.com\/([^\/]+)\/([^\/]+?)(?:\/tree\/([^\/]+))?(?:\/|$)/,
    /github\.com\/([^\/]+)\/([^\/]+?)(?:\.git)?$/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return {
        owner: match[1],
        repo: match[2].replace(/\.git$/, ''),
        branch: match[3]
      };
    }
  }

  return null;
}

// ===========================================
// File Filter
// ===========================================

const PRIORITY_FILES = [
  'README.md',
  'readme.md',
  'package.json',
  'requirements.txt',
  'pyproject.toml',
  'Cargo.toml',
  'go.mod',
  '.gitignore',
  'tsconfig.json',
  '.env.example',
  'docker-compose.yml',
  'Dockerfile',
  'vercel.json',
  'netlify.toml'
];

const IGNORE_PATTERNS = [
  /^node_modules\//,
  /^\.git\//,
  /^dist\//,
  /^build\//,
  /^\.next\//,
  /^__pycache__\//,
  /^\.venv\//,
  /^venv\//,
  /^target\//,
  /^vendor\//,
  /\.min\.js$/,
  /\.min\.css$/,
  /package-lock\.json$/,
  /yarn\.lock$/,
  /pnpm-lock\.yaml$/
];

const MAX_FILE_SIZE = 50 * 1024; // 50KB

export function shouldFetchFile(path: string, size: number): boolean {
  // Проверяем игнор-паттерны
  for (const pattern of IGNORE_PATTERNS) {
    if (pattern.test(path)) {
      return false;
    }
  }

  // Проверяем размер
  if (size > MAX_FILE_SIZE) {
    return false;
  }

  // Приоритетные файлы
  if (PRIORITY_FILES.some(f => path.endsWith(f))) {
    return true;
  }

  // Документация
  if (path.startsWith('docs/') && path.endsWith('.md')) {
    return true;
  }

  // Entry points
  if (path.match(/^src\/(index|main|app|server)\.(ts|tsx|js|jsx|py)$/)) {
    return true;
  }

  // Конфиги в корне
  if (!path.includes('/') && (path.endsWith('.json') || path.endsWith('.md'))) {
    return true;
  }

  // Исходный код (ограниченно)
  if (path.match(/\.(ts|tsx|js|jsx|py|go|rs)$/) && !path.includes('test')) {
    return true;
  }

  return false;
}

// ===========================================
// GitHub Fetcher
// ===========================================

export async function fetchRepoFiles(
  repoUrl: string,
  accessToken?: string
): Promise<FileInput[]> {
  const repoInfo = parseRepoUrl(repoUrl);

  if (!repoInfo) {
    throw new Error(`Invalid GitHub URL: ${repoUrl}`);
  }

  const octokit = new Octokit({
    auth: accessToken || process.env.GITHUB_TOKEN
  });

  const { owner, repo, branch } = repoInfo;

  // Получаем дерево файлов
  let treeSha = branch || 'HEAD';

  try {
    // Если ветка не указана, получаем default branch
    if (!branch) {
      const { data: repoData } = await withGitHubRetry(() =>
        octokit.repos.get({ owner, repo })
      );
      treeSha = repoData.default_branch;
    }

    const { data: tree } = await withGitHubRetry(() =>
      octokit.git.getTree({
        owner,
        repo,
        tree_sha: treeSha,
        recursive: 'true'
      })
    );

    // Фильтруем файлы
    const filesToFetch = tree.tree
      .filter(item => item.type === 'blob' && item.path && item.size !== undefined)
      .filter(item => shouldFetchFile(item.path!, item.size!))
      .slice(0, 50); // Максимум 50 файлов

    // Скачиваем содержимое параллельно
    const files = await Promise.all(
      filesToFetch.map(async (item): Promise<FileInput | null> => {
        try {
          const { data } = await octokit.repos.getContent({
            owner,
            repo,
            path: item.path!,
            ref: treeSha
          });

          if ('content' in data && data.encoding === 'base64') {
            return {
              path: item.path!,
              content: Buffer.from(data.content, 'base64').toString('utf-8')
            };
          }
          return null;
        } catch {
          // Игнорируем ошибки отдельных файлов
          return null;
        }
      })
    );

    return files.filter((f): f is FileInput => f !== null);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Not Found')) {
        throw new Error(`Repository not found: ${owner}/${repo}`);
      }
      if (error.message.includes('rate limit')) {
        throw new Error('GitHub API rate limit exceeded. Please provide an access token.');
      }
    }
    throw error;
  }
}

// ===========================================
// Get Latest Commit SHA (for caching)
// ===========================================

export async function getLatestCommitSha(
  repoUrl: string,
  accessToken?: string
): Promise<string | null> {
  const repoInfo = parseRepoUrl(repoUrl);

  if (!repoInfo) {
    return null;
  }

  const octokit = new Octokit({
    auth: accessToken || process.env.GITHUB_TOKEN
  });

  try {
    const { data: commits } = await withGitHubRetry(() =>
      octokit.repos.listCommits({
        owner: repoInfo.owner,
        repo: repoInfo.repo,
        per_page: 1
      })
    );

    return commits[0]?.sha || null;
  } catch {
    return null;
  }
}

// ===========================================
// Get Recent Commits (Optional)
// ===========================================

export async function getRecentCommits(
  repoUrl: string,
  accessToken?: string,
  limit: number = 10
): Promise<string[]> {
  const repoInfo = parseRepoUrl(repoUrl);

  if (!repoInfo) {
    return [];
  }

  const octokit = new Octokit({
    auth: accessToken || process.env.GITHUB_TOKEN
  });

  try {
    const { data: commits } = await octokit.repos.listCommits({
      owner: repoInfo.owner,
      repo: repoInfo.repo,
      per_page: limit
    });

    return commits.map(c => c.commit.message);
  } catch {
    return [];
  }
}
