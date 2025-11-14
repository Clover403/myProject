const axios = require('axios');

const BASE_URL = 'https://www.virustotal.com/api/v3';
const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 5;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const encodeUrlId = (url) =>
  Buffer.from(url)
    .toString('base64')
    .replace(/=+$/, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

async function fetchAnalysis(apiKey, analysisId) {
  const client = axios.create({
    baseURL: BASE_URL,
    headers: {
      'x-apikey': apiKey,
    },
  });

  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt += 1) {
    const response = await client.get(`/analyses/${analysisId}`);
    const attributes = response.data?.data?.attributes;

    if (attributes?.status === 'completed') {
      return attributes;
    }

    await sleep(POLL_INTERVAL_MS);
  }

  return null;
}

async function getCachedUrlInfo(apiKey, url) {
  const urlId = encodeUrlId(url);

  const response = await axios.get(`${BASE_URL}/urls/${urlId}`, {
    headers: {
      'x-apikey': apiKey,
    },
  });

  return response.data?.data?.attributes || null;
}

function createSummary(attributes) {
  if (!attributes) {
    return null;
  }

  const stats = attributes.stats || attributes.last_analysis_stats;
  const maliciousCount = stats?.malicious || 0;
  const suspiciousCount = stats?.suspicious || 0;
  const harmlessCount = stats?.harmless || 0;
  const undetectedCount = stats?.undetected || 0;

  const verdict = (() => {
    if (maliciousCount > 0) return 'malicious';
    if (suspiciousCount > 0) return 'suspicious';
    if (harmlessCount > 0 && suspiciousCount === 0 && maliciousCount === 0) return 'harmless';
    return 'unknown';
  })();

  return {
    verdict,
    maliciousCount,
    suspiciousCount,
    harmlessCount,
    undetectedCount,
    stats,
    lastAnalysisDate: attributes.last_analysis_date
      ? new Date(attributes.last_analysis_date * 1000).toISOString()
      : null,
    permalink: attributes?.links?.self || attributes?.permalink || null,
  };
}

async function scanUrl(url) {
  const apiKey = process.env.VT_API_KEY;

  if (!apiKey) {
    console.log('⚠️ VirusTotal API key not configured. Skipping VirusTotal scan.');
    return null;
  }

  try {
    const submitResponse = await axios.post(
      `${BASE_URL}/urls`,
      new URLSearchParams({ url }),
      {
        headers: {
          'x-apikey': apiKey,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const analysisId = submitResponse.data?.data?.id;
    let attributes = null;

    if (analysisId) {
      try {
        attributes = await fetchAnalysis(apiKey, analysisId);
      } catch (pollError) {
        console.error('❌ VirusTotal polling error:', pollError.message);
      }
    }

    if (!attributes) {
      try {
        attributes = await getCachedUrlInfo(apiKey, url);
      } catch (cacheError) {
        console.error('❌ VirusTotal cached lookup failed:', cacheError.message);
      }
    }

    const summary = createSummary(attributes);

    if (!summary) {
      return null;
    }

    return summary;
  } catch (error) {
    console.error('❌ VirusTotal scan failed:', error.message);
    return {
      error: error.response?.data?.error?.message || error.message,
    };
  }
}

module.exports = {
  scanUrl,
};
