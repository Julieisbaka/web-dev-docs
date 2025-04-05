document.addEventListener('DOMContentLoaded', () => {
    const snippets = [];
    const gallery = document.getElementById('snippet-gallery');
    const searchBar = document.getElementById('search-bar');
    const uploadBtn = document.getElementById('upload-snippet-btn');
    const modal = document.getElementById('upload-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const saveSnippetBtn = document.getElementById('save-snippet-btn');
    const snippetTitleInput = document.getElementById('snippet-title');
    const snippetCodeInput = document.getElementById('snippet-code');
    const snippetDocsInput = document.getElementById('snippet-docs');
    const previewModal = document.getElementById('preview-modal');
    const closePreviewBtn = document.getElementById('close-preview-btn');
    const previewTitle = document.getElementById('preview-title');
    const previewCode = document.getElementById('preview-code');
    const previewDocs = document.getElementById('preview-docs');
    const loginGithubBtn = document.getElementById('login-github-btn');
    let githubAccessToken = null;

    // Initialize CodeMirror
    const codeMirror = CodeMirror.fromTextArea(snippetCodeInput, {
        mode: 'javascript',
        lineNumbers: true,
        theme: 'default',
    });

    function renderSnippets(filter = '') {
        gallery.innerHTML = '';
        snippets
            .filter(snippet => snippet.title.toLowerCase().includes(filter.toLowerCase()))
            .forEach(snippet => {
                const card = document.createElement('div');
                card.className = 'snippet-card';
                card.innerHTML = `
                    <h3>${snippet.title}</h3>
                    <pre><code>${snippet.code}</code></pre>
                    <button class="preview-btn">Preview</button>
                `;
                gallery.appendChild(card);

                card.querySelector('.preview-btn').addEventListener('click', () => {
                    previewTitle.textContent = snippet.title;
                    previewCode.textContent = snippet.code;
                    previewDocs.textContent = snippet.docs || 'No documentation provided.';
                    previewModal.classList.remove('hidden');
                });
            });
    }

    searchBar.addEventListener('input', () => {
        renderSnippets(searchBar.value);
    });

    uploadBtn.addEventListener('click', () => {
        modal.classList.remove('hidden');
    });

    closeModalBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
    });

    closePreviewBtn.addEventListener('click', () => {
        previewModal.classList.add('hidden');
    });

    loginGithubBtn.addEventListener('click', () => {
        // Redirect to GitHub OAuth login
        const clientId = '__GITHUB_CLIENT_ID__';
        const redirectUri = window.location.origin;
        const scope = 'repo';
        window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
    });

    // Check for GitHub OAuth token in URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('code')) {
        const code = urlParams.get('code');
        fetch('/api/github/authenticate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code }),
        })
            .then(response => response.json())
            .then(data => {
                githubAccessToken = data.access_token;
                loginGithubBtn.textContent = 'Logged in with GitHub';
                uploadBtn.disabled = false;
            })
            .catch(error => console.error('GitHub authentication failed:', error));
    }

    saveSnippetBtn.addEventListener('click', () => {
        const title = snippetTitleInput.value.trim();
        const code = codeMirror.getValue().trim();
        const docs = snippetDocsInput.value.trim();

        if (title && code) {
            if (githubAccessToken) {
                // Create a pull request on GitHub
                fetch('/api/github/create-pull-request', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${githubAccessToken}`,
                    },
                    body: JSON.stringify({ title, code, docs }),
                })
                    .then(response => response.json())
                    .then(data => {
                        alert('Pull request created successfully!');
                        modal.classList.add('hidden');
                        snippetTitleInput.value = '';
                        codeMirror.setValue('');
                        snippetDocsInput.value = '';
                    })
                    .catch(error => console.error('Failed to create pull request:', error));
            } else {
                alert('Please log in with GitHub to upload snippets.');
            }
        } else {
            alert('Please provide both a title and code.');
        }
    });

    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const closeSettingsBtn = document.getElementById('close-settings-btn');
    const saveSettingsBtn = document.getElementById('save-settings-btn');
    const themeSelect = document.getElementById('theme-select');
    const fontSelect = document.getElementById('font-select');
    const fontSizeInput = document.getElementById('font-size');
    const customCssInput = document.getElementById('custom-css');
    const keybindingsInput = document.getElementById('keybindings');
    const readAloudCheckbox = document.getElementById('read-aloud');
    const captionsCheckbox = document.getElementById('captions');

    settingsBtn.addEventListener('click', () => {
        settingsModal.classList.remove('hidden');
    });

    closeSettingsBtn.addEventListener('click', () => {
        settingsModal.classList.add('hidden');
    });

    saveSettingsBtn.addEventListener('click', () => {
        // Apply theme
        document.body.classList.remove('dark-mode', 'high-contrast');
        if (themeSelect.value === 'dark') {
            document.body.classList.add('dark-mode');
        } else if (themeSelect.value === 'high-contrast') {
            document.body.classList.add('high-contrast');
        }

        // Apply font and font size
        document.body.style.fontFamily = fontSelect.value || 'Arial, sans-serif';
        document.body.style.fontSize = `${fontSizeInput.value}px`;

        // Apply custom CSS
        const customStyle = document.getElementById('custom-style');
        if (customStyle) {
            customStyle.textContent = customCssInput.value;
        } else {
            const style = document.createElement('style');
            style.id = 'custom-style';
            style.textContent = customCssInput.value;
            document.head.appendChild(style);
        }

        // Apply keybindings (placeholder for actual implementation)
        try {
            const keybindings = JSON.parse(keybindingsInput.value || '{}');
            console.log('Custom keybindings:', keybindings);
        } catch (error) {
            alert('Invalid keybindings format. Please use JSON.');
        }

        // Enable/disable read-aloud and captions
        if (readAloudCheckbox.checked) {
            alert('Read-aloud enabled (placeholder for actual implementation).');
        }
        if (captionsCheckbox.checked) {
            alert('Captions enabled (placeholder for actual implementation).');
        }

        settingsModal.classList.add('hidden');
    });

    renderSnippets();
});
