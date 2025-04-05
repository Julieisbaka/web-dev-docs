const express = require('express');
const fetch = require('node-fetch');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

const CLIENT_ID = process.env.CLIENT_ID; // Use environment variables
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REPO_OWNER = process.env.REPO_OWNER;
const REPO_NAME = process.env.REPO_NAME;
const GITHUB_API_URL = process.env.GITHUB_API_URL || 'https://api.github.com';

app.post('/api/github/authenticate', async (req, res) => {
    const { code } = req.body;
    try {
        const response = await fetch(`${GITHUB_API_URL}/login/oauth/access_token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                code,
            }),
        });
        const data = await response.text();
        const params = new URLSearchParams(data);
        res.json({ access_token: params.get('access_token') });
    } catch (error) {
        console.error('Error during GitHub authentication:', error);
        res.status(500).json({ error: 'GitHub authentication failed' });
    }
});

app.post('/api/github/create-pull-request', async (req, res) => {
    const { title, code, docs } = req.body;
    const { authorization } = req.headers;

    try {
        // Fetch the latest SHA of the main branch
        const mainBranchResponse = await fetch(`${GITHUB_API_URL}/repos/${REPO_OWNER}/${REPO_NAME}/git/refs/heads/main`, {
            headers: { Authorization: authorization },
        });
        const mainBranchData = await mainBranchResponse.json();
        const mainBranchSha = mainBranchData.object.sha;

        const branchName = `snippet-${Date.now()}`;
        const fileName = `${title.replace(/\s+/g, '-').toLowerCase()}.js`;

        // Create a new branch
        await fetch(`${GITHUB_API_URL}/repos/${REPO_OWNER}/${REPO_NAME}/git/refs`, {
            method: 'POST',
            headers: { Authorization: authorization, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ref: `refs/heads/${branchName}`,
                sha: mainBranchSha,
            }),
        });

        // Commit the snippet to the new branch
        await fetch(`${GITHUB_API_URL}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${fileName}`, {
            method: 'PUT',
            headers: { Authorization: authorization, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: `Add snippet: ${title}`,
                content: Buffer.from(`// ${docs}\n${code}`).toString('base64'),
                branch: branchName,
            }),
        });

        // Create a pull request
        const pullRequestResponse = await fetch(`${GITHUB_API_URL}/repos/${REPO_OWNER}/${REPO_NAME}/pulls`, {
            method: 'POST',
            headers: { Authorization: authorization, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: `Add snippet: ${title}`,
                head: branchName,
                base: 'main',
            }),
        });

        const pullRequestData = await pullRequestResponse.json();
        res.json(pullRequestData);
    } catch (error) {
        console.error('Error during pull request creation:', error);
        res.status(500).json({ error: 'Failed to create pull request' });
    }
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
