import { NextRequest, NextResponse } from 'next/server';
import { getLatestCommitSha } from '@/lib/github/fetcher';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('repo_url');

  if (!url) {
    return NextResponse.json({ error: 'repo_url is required' }, { status: 400 });
  }

  try {
    const sha = await getLatestCommitSha(url);
    return NextResponse.json({ sha, repo_url: url });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get commit SHA' },
      { status: 400 }
    );
  }
}
