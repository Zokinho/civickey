import { NextRequest, NextResponse } from 'next/server';

const VERCEL_API_TOKEN = process.env.VERCEL_API_TOKEN;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;
const DOMAINS_API_SECRET = process.env.DOMAINS_API_SECRET;

function isAuthorized(request: NextRequest): boolean {
  if (!DOMAINS_API_SECRET) return false;
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return false;
  return authHeader === `Bearer ${DOMAINS_API_SECRET}`;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!VERCEL_API_TOKEN || !VERCEL_PROJECT_ID) {
    return NextResponse.json({ error: 'Vercel API not configured' }, { status: 500 });
  }

  const { domain, action } = await request.json();

  if (!domain || typeof domain !== 'string') {
    return NextResponse.json({ error: 'Domain is required' }, { status: 400 });
  }

  const sanitizedDomain = domain.trim().toLowerCase();

  try {
    if (action === 'add') {
      const resp = await fetch(
        `https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/domains`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${VERCEL_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: sanitizedDomain }),
        }
      );

      const data = await resp.json();
      if (!resp.ok) {
        return NextResponse.json({ error: data.error?.message || 'Failed to add domain' }, { status: resp.status });
      }

      return NextResponse.json({ success: true, domain: data });
    }

    if (action === 'remove') {
      const resp = await fetch(
        `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/domains/${sanitizedDomain}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${VERCEL_API_TOKEN}`,
          },
        }
      );

      if (!resp.ok) {
        const data = await resp.json();
        return NextResponse.json({ error: data.error?.message || 'Failed to remove domain' }, { status: resp.status });
      }

      return NextResponse.json({ success: true });
    }

    if (action === 'verify') {
      const resp = await fetch(
        `https://dns.google/resolve?name=${encodeURIComponent(sanitizedDomain)}&type=CNAME`
      );
      const data = await resp.json();
      const answers = data.Answer || [];
      const hasCname = answers.some(
        (a: { type: number; data?: string }) =>
          a.type === 5 && a.data?.includes('cname.vercel-dns.com')
      );

      return NextResponse.json({ verified: hasCname });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
