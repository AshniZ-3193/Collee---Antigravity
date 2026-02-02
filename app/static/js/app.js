const app = {
    api: {
        baseUrl: 'http://localhost:8000',
        async request(endpoint, method = 'GET', data = null) {
            const options = {
                method,
                headers: { 'Content-Type': 'application/json' }
            };
            if (data) options.body = JSON.stringify(data);
            const res = await fetch(this.baseUrl + endpoint, options);
            if (!res.ok) throw new Error(await res.text());
            return res.json();
        }
    },

    state: {
        currentUser: null,
        colleges: [],
        currentCollege: null,
        currentPrompt: null,
        lensNotes: []
    },

    init: async () => {
        // Check for user
        try {
            app.state.currentUser = await app.api.request('/onboarding/user');
            app.router.navigate('dashboard');
        } catch (e) {
            app.router.navigate('onboarding');
        }

        // Setup Event Listeners
        app.ui.setupListeners();
    },

    router: {
        navigate: (viewName) => {
            document.querySelectorAll('.view').forEach(el => el.classList.add('hidden'));
            document.getElementById(`view-${viewName}`).classList.remove('hidden');

            if (viewName !== 'onboarding') {
                document.getElementById('sidebar').classList.remove('hidden');
                app.controllers[viewName]?.load();
            } else {
                document.getElementById('sidebar').classList.add('hidden');
            }
        }
    },

    controllers: {
        dashboard: {
            load: async () => {
                const colleges = await app.api.request('/colleges/');
                app.state.colleges = colleges;
                app.ui.renderCollegeList(colleges);
            }
        },
        colleges: {
            load: async () => {
                const colleges = await app.api.request('/colleges/');
                app.ui.renderCollegeManager(colleges);
            }
        },
        lens: {
            load: async () => {
                const notes = await app.api.request('/lens/');
                app.state.lensNotes = notes;
                app.ui.renderLensNotes(notes);
            }
        },
        workspace: {
            load: async (promptId) => {
                if (!promptId && app.state.currentPrompt) promptId = app.state.currentPrompt.id;
                // If still no promptId, maybe redirect or show empty state
                if (promptId) {
                    app.controllers.workspace.selectPrompt(promptId);
                }
            },
            selectPrompt: async (promptId) => {
                const prompt = app.state.colleges.flatMap(c => c.prompts).find(p => p.id == promptId);
                const college = app.state.colleges.find(c => c.id == prompt.college_id);
                app.state.currentPrompt = prompt;
                app.state.currentCollege = college;

                // Load Essay
                const essay = await app.api.request(`/workspace/essays/${promptId}`);

                // Update UI
                document.getElementById('editor-college-name').innerText = college.name;
                document.getElementById('editor-prompt-text').innerText = prompt.text;
                document.getElementById('essay-editor').value = essay.content;
                document.getElementById('editor-word-count').innerText = `${essay.content.split(' ').filter(w => w).length} / ${prompt.word_count_max} words`;

                // Load Suggestions
                if (essay.suggestions) { // Wait, suggestions likely not in prompt/essay model directly on fetch?
                    // Essay model has suggestions relation? Yes.
                    // But standard fetch might not join them.
                    // For MVP, lets assume frontend just shows 'Generate' initially or we fetch suggestions separate if needed.
                    // Actually, schema `Essay` doesn't include list of suggestions by default in `EssayBase`.
                    // Let's rely on manual generation or separate fetch if needed.
                }

                app.ui.renderPromptList();
            }
        }
    },

    workspace: {
        saveEssay: async () => {
            const content = document.getElementById('essay-editor').value;
            const promptId = app.state.currentPrompt.id;
            await app.api.request(`/workspace/essays/${promptId}`, 'POST', { content });
            alert('Saved!');
        },
        generateSuggestions: async () => {
            const promptId = app.state.currentPrompt.id;
            const btn = document.querySelector('.workspace-suggestions button');
            const originalText = btn.innerText;
            btn.innerText = "Generating...";
            btn.disabled = true;

            try {
                const suggestion = await app.api.request(`/workspace/essays/${promptId}/suggest`, 'POST');
                const div = document.createElement('div');
                div.className = 'card suggestion-card';
                div.innerHTML = `<p>${suggestion.content.replace(/\n/g, '<br>')}</p>`;
                document.getElementById('suggestion-list').prepend(div);
            } catch (e) {
                alert("Error generating suggestions: " + e.message);
            } finally {
                btn.innerText = originalText;
                btn.disabled = false;
            }
        }
    },

    lens: {
        addNote: async () => {
            const content = document.getElementById('lens-note-input').value;
            if (!content) return;
            await app.api.request('/lens/', 'POST', { content });
            document.getElementById('lens-note-input').value = '';
            app.controllers.lens.load();
        }
    },

    ui: {
        setupListeners: () => {
            document.getElementById('onboarding-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                const data = Object.fromEntries(new FormData(e.target));
                await app.api.request('/onboarding/user', 'POST', data);
                app.init();
            });

            document.getElementById('add-college-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                const data = Object.fromEntries(new FormData(e.target));
                await app.api.request('/colleges/', 'POST', data);
                app.ui.hideModals();
                app.controllers.dashboard.load(); // Refresh
                app.controllers.colleges.load();
            });

            document.getElementById('add-prompt-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const data = Object.fromEntries(formData);
                const collegeId = data.college_id;
                delete data.college_id;
                data.is_optional = data.is_optional === 'on';

                await app.api.request(`/colleges/${collegeId}/prompts/`, 'POST', data);
                app.ui.hideModals();
                app.controllers.colleges.load();
            });
        },

        renderCollegeList: (colleges) => {
            const container = document.getElementById('college-list-dashboard');
            if (!colleges.length) {
                container.innerHTML = '<p>No colleges yet. Add one!</p>';
                return;
            }
            container.innerHTML = colleges.map(c => `
               <div class="card">
                   <h3>${c.name}</h3>
                   <p>${c.application_type}</p>
                   <p>Due: ${c.deadline ? new Date(c.deadline).toLocaleDateString() : 'N/A'}</p>
                   <button class="btn-primary" onclick="app.router.navigate('workspace'); app.controllers.workspace.load(${c.prompts[0]?.id})">
                        ${c.prompts.length} Prompts
                   </button>
               </div>
           `).join('');
        },

        renderCollegeManager: (colleges) => {
            const container = document.getElementById('college-manager-list');
            container.innerHTML = colleges.map(c => `
                <div class="card" style="margin-bottom: 20px;">
                    <h3>${c.name} <button class="btn-secondary small" onclick="app.ui.showAddPromptModal(${c.id})">+ Add Prompt</button></h3>
                    <ul>
                        ${c.prompts.map(p => `<li>${p.text.substring(0, 50)}... (${p.word_count_max} words)</li>`).join('')}
                    </ul>
                </div>
            `).join('');
        },

        renderLensNotes: (notes) => {
            const container = document.getElementById('lens-notes-list');
            container.innerHTML = notes.map(n => `
                <div class="card">
                    <p>${n.content}</p>
                    <small>${new Date(n.created_at).toLocaleDateString()}</small>
                </div>
            `).join('');
        },

        renderPromptList: () => {
            const list = document.getElementById('workspace-prompt-list');
            list.innerHTML = '';
            app.state.colleges.forEach(c => {
                c.prompts.forEach(p => {
                    const li = document.createElement('li');
                    li.innerText = `${c.name}: ${p.prompt_type || 'Essay'}`;
                    li.className = (app.state.currentPrompt && app.state.currentPrompt.id == p.id) ? 'active' : '';
                    li.onclick = () => app.controllers.workspace.selectPrompt(p.id);
                    list.appendChild(li);
                });
            });
        },

        showAddCollegeModal: () => {
            document.getElementById('modal-add-college').classList.remove('hidden');
        },

        showAddPromptModal: (collegeId) => {
            document.getElementById('prompt-college-id').value = collegeId;
            document.getElementById('modal-add-prompt').classList.remove('hidden');
        },

        hideModals: () => {
            document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
        }
    }
};

document.addEventListener('DOMContentLoaded', app.init);
