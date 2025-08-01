import { NextRequest, NextResponse } from 'next/server';

// Store last scrape time in memory (resets on server restart)
let lastScrapeTime: number | null = null;

export async function POST(_request: NextRequest) {
  try {
    // Check rate limiting (10 minutes)
    const now = Date.now();
    if (lastScrapeTime && (now - lastScrapeTime) < 10 * 60 * 1000) {
      const remainingMinutes = Math.ceil((10 * 60 * 1000 - (now - lastScrapeTime)) / 60000);
      return NextResponse.json(
        { 
          error: `Can't refresh more often than every 10 minutes. Please wait ${remainingMinutes} more minute${remainingMinutes > 1 ? 's' : ''}.` 
        },
        { status: 429 }
      );
    }

    // GitHub API configuration
    const owner = 'stechermichal';
    const repo = 'scrapetizer';
    const workflow_id = 'manual-scrape.yml';
    
    // Need a GitHub token with workflow permissions
    const githubToken = process.env.GITHUB_TOKEN;
    
    if (!githubToken) {
      // In development, just simulate the response
      if (process.env.NODE_ENV === 'development') {
        console.log('Development mode: Simulating GitHub Action trigger');
        lastScrapeTime = now;
        return NextResponse.json({
          success: true,
          message: 'Scraping started (simulated in development). This might take up to 4 minutes.',
          startedAt: new Date().toISOString()
        });
      }
      
      console.error('GITHUB_TOKEN not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Trigger the GitHub Action
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflow_id}/dispatches`,
      {
        method: 'POST',
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `Bearer ${githubToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ref: 'master',
          inputs: {
            restaurant: '' // Empty means scrape all
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GitHub API error:', response.status, errorText);
      return NextResponse.json(
        { error: 'Failed to trigger scraping' },
        { status: response.status }
      );
    }

    // Update last scrape time
    lastScrapeTime = now;

    return NextResponse.json({
      success: true,
      message: 'Scraping started. This might take up to 4 minutes.',
      startedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error triggering scrape:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}