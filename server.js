const express = require('express');
const fetch = require('node-fetch');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

const CLIENT_ID = 'YOUR_GITHUB_APP_CLIENT_ID';
const CLIENT_SECRET = 'YOUR_GITHUB_APP_CLIENT_SECRET';
const REPO_OWNER = 'YOUR_GITHUB_USERNAME';
const REPO_NAME = 'YOUR_REPOSITORY_NAME';

app.post('/api/github/authenticate', async (req, res) => {
    const { code } = req.body;
    const response = await fetch('https://github.com/login/oauth/access_token', {
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
});

app.post('/api/github/create-pull-request', async (req, res) => {
    const { title, code, docs } = req.body;
    const { authorization } = req.headers;

    const branchName = `snippet-${Date.now()}`;
    const fileName = `${title.replace(/\s+/g, '-').toLowerCase()}.js`;

    // Create a new branch and commit the snippet
    await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/refs`, {
        method: 'POST',
        headers: { Authorization: authorization, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ref: `refs/heads/${branchName}`,
            sha: 'main', // Replace with the actual SHA of the main branch
        }),
    });

    await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${fileName}`, {
        method: 'PUT',
        headers: { Authorization: authorization, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message: `Add snippet: ${title}`,
            content: Buffer.from(`// ${docs}\n${code}`).toString('base64'),
            branch: branchName,
        }),
    });

    // Create a pull request
    const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/pulls`, {
        method: 'POST',
        headers: { Authorization: authorization, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            title: `Add snippet: ${title}`,
            head: branchName,
            base: 'main',
        }),
    });

    const data = await response.json();
    res.json(data);
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
