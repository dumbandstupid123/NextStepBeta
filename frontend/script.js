// NextStep Healthcare Assistant Frontend with Voice Support
class NextStepApp {
    constructor() {
        this.apiBase = '';
        this.currentCategory = null;
        this.isLoading = false;

        this.currentAudio = null;
        this.isSpeaking = false;
        this.voiceIndicator = null;
        this.selectedVoice = 'alloy';
        this.currentCategory = null;
        this.voiceTones = {
            'professional': { voice: 'nova', description: 'Professional and clear' },
            'friendly': { voice: 'alloy', description: 'Warm and approachable' },
            'calm': { voice: 'shimmer', description: 'Soothing and gentle' },
            'confident': { voice: 'onyx', description: 'Strong and assured' },
            'conversational': { voice: 'echo', description: 'Natural and engaging' }
        };
        this.voiceTone = 'friendly';
        this.audioCache = new Map();
        
        // Voice functionality
        this.isVoiceMode = false;
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        this.isListening = false; // Default tone
        // this.voiceTones = {
        //     professional: {
        //         rate: 1.0,
        //         pitch: 0.9,
        //         volume: 0.85,
        //         preferredVoices: ['Microsoft David', 'Google US English', 'Alex', 'Daniel'],
        //         description: 'Clear, authoritative, and clinical'
        //     },
        //     caring: {
        //         rate: 0.9,
        //         pitch: 1.0,
        //         volume: 0.8,
        //         preferredVoices: ['Microsoft Zira', 'Google US English Female', 'Samantha', 'Fiona'],
        //         description: 'Warm, empathetic, and supportive'
        //     },
        //     calm: {
        //         rate: 0.8,
        //         pitch: 0.95,
        //         volume: 0.75,
        //         preferredVoices: ['Samantha', 'Microsoft Zira', 'Fiona', 'Moira'],
        //         description: 'Slow, peaceful, and therapeutic'
        //     },
        //     friendly: {
        //         rate: 1.1,
        //         pitch: 1.1,
        //         volume: 0.9,
        //         preferredVoices: ['Microsoft Zira', 'Google US English Female', 'Samantha', 'Karen'],
        //         description: 'Collaborative, approachable, and engaging'
        //     },
        //     energetic: {
        //         rate: 1.2,
        //         pitch: 1.15,
        //         volume: 0.9,
        //         preferredVoices: ['Karen', 'Google US English Female', 'Samantha', 'Microsoft Zira'],
        //         description: 'Fast, motivational, and encouraging'
        //     },
        //     gentle: {
        //         rate: 0.85,
        //         pitch: 1.05,
        //         volume: 0.7,
        //         preferredVoices: ['Samantha', 'Fiona', 'Microsoft Zira', 'Moira'],
        //         description: 'Soft, reassuring, and nurturing'
        //     }
        // };
        
        this.initElements();
        this.setupEvents();
        this.setupVoice();
        this.setupSpeech();
        this.loadData();
    }
    
    initElements() {
        // Get DOM elements
        this.messageInput = document.getElementById('message-input');
        this.sendButton = document.getElementById('send-button');
        this.chatContainer = document.getElementById('chat-container');
        this.loadingOverlay = document.getElementById('loading-overlay');
        this.clearChatButton = document.getElementById('clear-chat');
        this.statusText = document.getElementById('status-text');
        this.categoriesList = document.getElementById('categories-list');
        this.totalResources = document.getElementById('total-resources');
        this.totalCategories = document.getElementById('total-categories');
        this.statsContent = document.getElementById('stats-content');
        
        // Voice elements
        this.voiceModeBtn = document.getElementById('voice-mode-btn');
        this.voiceStatus = document.getElementById('voice-status');
        this.voiceIndicator = document.getElementById('voice-indicator');
        this.voiceText = document.getElementById('voice-text');
        this.voiceControls = document.getElementById('voice-controls');
        this.voiceListenBtn = document.getElementById('voice-listen-btn');
        this.voiceStopBtn = document.getElementById('voice-stop-btn');
        this.voiceExitBtn = document.getElementById('voice-exit-btn');
        this.textInputWrapper = document.getElementById('text-input-wrapper');
        this.inputSuggestions = document.getElementById('input-suggestions');
        this.voiceToneSelector = document.getElementById('voice-tone-selector');
        this.voiceToneSelect = document.getElementById('voice-tone-select');
    }
    
    setupEvents() {
        // Send message events
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // Clear chat
        this.clearChatButton.addEventListener('click', () => this.clearChat());
        
        // Voice mode events
        this.voiceModeBtn.addEventListener('click', () => this.toggleVoiceMode());
        this.voiceListenBtn.addEventListener('click', () => this.startListening());
        this.voiceStopBtn.addEventListener('click', () => this.stopSpeaking());
        this.voiceExitBtn.addEventListener('click', () => this.exitVoiceMode());
        
        // Voice tone change
        this.voiceToneSelect.addEventListener('change', (e) => this.changeVoiceTone(e.target.value));
        
        // Suggestion pills
        document.querySelectorAll('.suggestion').forEach(suggestion => {
            suggestion.addEventListener('click', () => {
                const text = suggestion.getAttribute('data-text');
                if (this.isVoiceMode) {
                    this.processVoiceInput(text);
                } else {
                    this.messageInput.value = text;
                    this.sendMessage();
                }
            });
        });
        
        // Input focus effects
        this.messageInput.addEventListener('focus', () => {
            document.querySelector('.input-wrapper').classList.add('focused');
        });
        
        this.messageInput.addEventListener('blur', () => {
            document.querySelector('.input-wrapper').classList.remove('focused');
        });
    }
    
    setupVoice() {
        // Check for speech recognition support
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';
            
            this.recognition.onstart = () => {
                this.isListening = true;
                this.updateVoiceStatus('listening', 'Listening... speak now');
                this.voiceIndicator.classList.add('listening');
            };
            
            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.processVoiceInput(transcript);
            };
            
            this.recognition.onerror = (event) => {
                this.handleVoiceError(`Speech recognition error: ${event.error}`);
            };
            
            this.recognition.onend = () => {
                this.isListening = false;
                this.voiceIndicator.classList.remove('listening');
                if (this.isVoiceMode && !this.isSpeaking) {
                    this.updateVoiceStatus('ready', 'Tap to speak again');
                }
            };
        } else {
            this.showVoiceUnsupported();
        }
    }
    
    setupSpeech() {
        // Wait for voices to load
        const voices = this.synthesis.getVoices();
        if (voices.length === 0) {
            this.synthesis.addEventListener('voiceschanged', () => {
                console.log('Voices loaded, selecting best voice');
                this.selectBestVoice();
            });
        } else {
            console.log('Voices already available, selecting best voice');
            this.selectBestVoice();
        }
    }
    
    selectBestVoice() {
        const voices = this.synthesis.getVoices();
        console.log(`Available voices: ${voices.length}`);
        
        if (voices.length === 0) {
            console.warn('No voices available for speech synthesis');
            this.selectedVoice = null;
            return;
        }
        
        const toneConfig = this.voiceTones[this.voiceTone];
        
        // Try to find preferred voices for the current tone
        for (const preferredName of toneConfig.preferredVoices) {
            const voice = voices.find(v => v.name.includes(preferredName) && !v.localService);
            if (voice) {
                this.selectedVoice = voice;
                console.log(`Selected preferred voice: ${voice.name} for tone: ${this.voiceTone}`);
                return;
            }
        }
        
        // Try again with local voices if no remote voices found
        for (const preferredName of toneConfig.preferredVoices) {
            const voice = voices.find(v => v.name.includes(preferredName));
            if (voice) {
                this.selectedVoice = voice;
                console.log(`Selected preferred local voice: ${voice.name} for tone: ${this.voiceTone}`);
                return;
            }
        }
        
        // Fallback to first English voice (prefer non-local first)
        let fallbackVoice = voices.find(v => v.lang.startsWith('en') && !v.localService);
        if (!fallbackVoice) {
            fallbackVoice = voices.find(v => v.lang.startsWith('en'));
        }
        if (!fallbackVoice) {
            fallbackVoice = voices[0]; // Last resort
        }
        
        this.selectedVoice = fallbackVoice;
        console.log(`Fallback voice selected: ${this.selectedVoice?.name || 'None'} for tone: ${this.voiceTone}`);
        
        if (!this.selectedVoice) {
            console.error('Could not select any voice for speech synthesis');
        }
    }
    
    toggleVoiceMode() {
        if (!this.recognition) {
            this.showVoiceUnsupported();
            return;
        }
        
        this.isVoiceMode = !this.isVoiceMode;
        
        if (this.isVoiceMode) {
            this.enterVoiceMode();
        } else {
            this.exitVoiceMode();
        }
    }
    
    enterVoiceMode() {
        this.isVoiceMode = true;
        
        // Update UI
        this.voiceModeBtn.classList.add('active');
        this.voiceModeBtn.innerHTML = '<i class="fas fa-microphone-slash"></i><span>Exit Voice Mode</span>';
        
        this.textInputWrapper.style.display = 'none';
        this.voiceControls.style.display = 'flex';
        this.voiceToneSelector.style.display = 'flex';
        this.inputSuggestions.style.display = 'flex';
        
        this.updateVoiceStatus('ready', 'Voice mode active - preparing...');
        
        // Add welcome voice message with delay to ensure voice setup is complete
        setTimeout(() => {
            this.addVoiceWelcomeMessage();
        }, 500);
    }
    
    exitVoiceMode() {
        this.isVoiceMode = false;
        
        // Stop any ongoing speech
        this.stopSpeaking();
        this.stopListening();
        
        // Update UI
        this.voiceModeBtn.classList.remove('active');
        this.voiceModeBtn.innerHTML = '<i class="fas fa-microphone"></i><span>Start Voice Conversation</span>';
        
        this.textInputWrapper.style.display = 'flex';
        this.voiceControls.style.display = 'none';
        this.voiceToneSelector.style.display = 'none';
        
        this.updateVoiceStatus('inactive', 'Click to start talking');
        this.voiceIndicator.className = 'voice-indicator';
    }
    
    startListening() {
        if (!this.recognition || this.isListening || this.isSpeaking) return;
        
        try {
            this.recognition.start();
        } catch (error) {
            this.handleVoiceError('Could not start speech recognition');
        }
    }
    
    stopListening() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
        }
    }
    
    processVoiceInput(transcript) {
        this.updateVoiceStatus('processing', 'Processing your request...');
        
        // Add user voice message
        this.addUserVoiceMessage(transcript);
        
        // Send to assistant
        this.sendVoiceMessage(transcript);
    }
    
    async sendVoiceMessage(message) {
        this.setLoading(true);
        
        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    category: this.currentCategory
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.addAssistantVoiceMessage(data);
            
            if (data.audio_url) {
                await this.playAudioFromUrl(data.audio_url);
            } else if (data.response) {
                await this.speakText(data.response);
            }
            
        } catch (error) {
            console.error('Error sending voice message:', error);
            this.handleVoiceError('Sorry, I had trouble processing your request. Please try again.');
        } finally {
            this.setLoading(false);
        }
    }
    
    async speakText(text, onEnd = null, isRetry = false) {
        if (!text || text.trim() === '') {
            console.warn('Empty text provided to speakText');
            return;
        }
        
        if (this.isSpeaking && !isRetry) {
            this.stopSpeaking();
        }
        
        try {
            const cacheKey = `${text}-${this.selectedVoice}`;
            let audioUrl = this.audioCache.get(cacheKey);
            
            if (!audioUrl) {
                const response = await fetch('/tts', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        text: text,
                        voice: this.voiceTones[this.voiceTone].voice || this.selectedVoice,
                        model: 'tts-1'
                    })
                });
                
                if (!response.ok) {
                    throw new Error(`TTS API error: ${response.status}`);
                }
                
                const audioBlob = await response.blob();
                audioUrl = URL.createObjectURL(audioBlob);
                
                if (this.audioCache.size > 50) {
                    const firstKey = this.audioCache.keys().next().value;
                    URL.revokeObjectURL(this.audioCache.get(firstKey));
                    this.audioCache.delete(firstKey);
                }
                this.audioCache.set(cacheKey, audioUrl);
            }

            
            await this.playAudioFromUrl(audioUrl, onEnd);
            
        } catch (error) {
            console.error('Error generating speech:', error);
            this.handleVoiceError(`Speech error: ${error.message}`, false);
        }
    }
    
    async playAudioFromUrl(audioUrl, onEnd = null) {
        return new Promise((resolve, reject) => {
            this.stopSpeaking();
            
            this.currentAudio = new Audio(audioUrl);
            
            this.currentAudio.onloadstart = () => {
                this.isSpeaking = true;
                this.updateVoiceStatus('loading', 'Loading audio...');
                this.voiceIndicator?.classList.add('loading');
                console.log('Audio loading started');
            };
            
            this.currentAudio.oncanplay = () => {
                this.voiceIndicator?.classList.remove('loading');
                this.voiceIndicator?.classList.add('speaking');
                this.updateVoiceStatus('speaking', `NextStep is speaking (${this.voiceTone} tone)...`);
                console.log('Audio can play');
            };
            
            this.currentAudio.onplay = () => {
                this.isSpeaking = true;
                this.voiceIndicator?.classList.add('speaking');
                console.log('Audio playback started');
            };
            
            this.currentAudio.onended = () => {
                this.isSpeaking = false;
                this.voiceIndicator?.classList.remove('speaking', 'loading');
                
                if (this.isVoiceMode) {
                    this.updateVoiceStatus('ready', 'Tap to speak again');
                }
                
                if (onEnd) onEnd();
                console.log('Audio playback ended');
                resolve();
            };
            
            this.currentAudio.onerror = (event) => {
                console.error('Audio playback error:', event);
                this.isSpeaking = false;
                this.voiceIndicator?.classList.remove('speaking', 'loading');
                this.handleVoiceError(`Audio error: ${event.error || 'Unknown error'}`, false);
                reject(new Error('Audio playback failed'));
            };
            
            this.currentAudio.play().catch(error => {
                console.error('Failed to play audio:', error);
                this.handleVoiceError('Failed to play audio', false);
                reject(error);
            });
        });
    }
    
    stopSpeaking() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.currentAudio = null;
        }
        
        this.isSpeaking = false;
        this.voiceIndicator?.classList.remove('speaking', 'loading');
        
        if (this.isVoiceMode) {
            this.updateVoiceStatus('ready', 'Tap to speak again');
        }
    }
    
    // Voice selection methods
    async loadAvailableVoices() {
        try {
            const response = await fetch('/voices');
            const data = await response.json();
            return data.voices || [];
        } catch (error) {
            console.error('Error loading voices:', error);
            return Object.keys(this.voiceTones).map(tone => ({
                id: this.voiceTones[tone].voice,
                name: tone,
                description: this.voiceTones[tone].description
            }));
        }
    }
    
    setVoiceTone(tone) {
        if (this.voiceTones[tone]) {
            this.voiceTone = tone;
            this.selectedVoice = this.voiceTones[tone].voice;
            console.log(`Voice tone set to: ${tone} (${this.selectedVoice})`);
        }
    }
    
    // Utility methods
    setLoading(isLoading) {
        // Update UI loading state
        const loadingIndicator = document.querySelector('.loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = isLoading ? 'block' : 'none';
        }
    }
    
    updateVoiceStatus(status, message) {
        const statusElement = document.querySelector('.voice-status');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = `voice-status ${status}`;
        }
    }
    
    handleVoiceError(message, shouldSpeak = true) {
        console.error('Voice error:', message);
        this.updateVoiceStatus('error', message);
        
        // Show error in UI
        const errorElement = document.querySelector('.voice-error');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
            setTimeout(() => {
                errorElement.style.display = 'none';
            }, 5000);
        }
        
        // Don't try to speak error messages to prevent loops
        if (shouldSpeak && !message.includes('Speech error') && !message.includes('Audio error')) {
            this.speakText(message);
        }
    }
    
    addAssistantVoiceMessage(data) {
        // Add the assistant's response to the chat interface
        const chatContainer = document.querySelector('.chat-messages');
        if (chatContainer) {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message assistant-message';
            messageDiv.innerHTML = `
                <div class="message-content">
                    <p>${data.response}</p>
                    ${data.top_resources.length > 0 ? `
                        <div class="resources">
                            <h4>Recommended Resources:</h4>
                            <ul>
                                ${data.top_resources.map(resource => `
                                    <li>
                                        <strong>${resource.name}</strong>
                                        ${resource.address ? `<br>📍 ${resource.address}` : ''}
                                        ${resource.phone ? `<br>📞 ${resource.phone}` : ''}
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                    ` : ''}
                </div>
                <div class="message-actions">
                    <button onclick="voiceInterface.speakText('${data.response.replace(/'/g, "\\'")}')">🔊 Repeat</button>
                    <button onclick="voiceInterface.stopSpeaking()">⏹️ Stop</button>
                </div>
            `;
            chatContainer.appendChild(messageDiv);
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    }
    
    // Cleanup method
    cleanup() {
        this.stopSpeaking();
        
        // Clean up audio cache
        for (const [key, url] of this.audioCache.entries()) {
            URL.revokeObjectURL(url);
        }
        this.audioCache.clear();
    }
    
    updateVoiceStatus(state, text) {
        this.voiceText.textContent = text;
        
        // Update indicator
        this.voiceIndicator.className = 'voice-indicator';
        if (state !== 'inactive') {
            this.voiceIndicator.classList.add(state);
        }
    }
    
    addVoiceWelcomeMessage() {
        const welcomeText = "Hello! I'm NextStep, your healthcare navigator. Voice mode is now active. Tap 'Tap to Speak' and tell me what kind of help you need.";
        
        // Ensure we have a voice selected
        if (!this.selectedVoice) {
            this.selectBestVoice();
        }
        
        if (this.selectedVoice) {
        this.speakText(welcomeText);
        } else {
            console.warn('No voice available for welcome message');
            this.updateVoiceStatus('ready', 'Voice mode active - tap "Tap to Speak" to start');
        }
    }
    
    addUserVoiceMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'user-message voice-message';
        messageDiv.innerHTML = `
            <div class="avatar">
                <i class="fas fa-microphone"></i>
            </div>
            <div class="message-content">
                <p>${this.escapeHtml(message)}</p>
            </div>
        `;
        
        this.chatContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }
    
    addAssistantVoiceMessage(data) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'assistant-message speaking-response';
        
        let resourcesHtml = '';
        if (data.top_resources && data.top_resources.length > 0) {
            resourcesHtml = `
                <div class="resources-grid">
                    ${data.top_resources.map(resource => `
                        <div class="resource-card">
                            <div class="resource-header">
                                <div class="resource-name">${this.escapeHtml(resource.name)}</div>
                                <div class="resource-score">${Math.round(resource.score * 100)}% match</div>
                            </div>
                            <div class="resource-info">
                                ${resource.address ? `
                                    <div class="resource-info-item">
                                        <i class="fas fa-map-marker-alt"></i>
                                        <span>${this.escapeHtml(resource.address)}</span>
                                    </div>
                                ` : ''}
                                ${resource.phone ? `
                                    <div class="resource-info-item">
                                        <i class="fas fa-phone"></i>
                                        <span>${this.escapeHtml(resource.phone)}</span>
                                    </div>
                                ` : ''}
                                <div class="resource-info-item">
                                    <i class="fas fa-tag"></i>
                                    <span>${this.escapeHtml(resource.category)}</span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        messageDiv.innerHTML = `
            <div class="avatar">
                <i class="fas fa-heart-pulse"></i>
            </div>
            <div class="message-content">
                <div class="assistant-response">${this.formatResponse(data.response)}</div>
                ${resourcesHtml}
                ${data.resources_found > 0 ? `
                    <div class="resources-summary">
                        <small><i class="fas fa-info-circle"></i> Found ${data.resources_found} relevant resources</small>
                    </div>
                ` : ''}
            </div>
        `;
        
        this.chatContainer.appendChild(messageDiv);
        this.scrollToBottom();
        
        // Speak the response
        this.speakText(data.response);
    }
    
    handleVoiceError(errorMessage, shouldSpeak = false) {
        console.error('Voice error:', errorMessage);
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'voice-error';
        errorDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${errorMessage}`;
        
        this.chatContainer.appendChild(errorDiv);
        this.scrollToBottom();
        
        this.updateVoiceStatus('error', 'Error occurred - tap to try again');
        
        // Only try to speak error message if explicitly requested and not already in error state
        if (shouldSpeak && !this.isSpeaking) {
            // Use a timeout to avoid cascading errors
            setTimeout(() => {
                this.speakText(`I'm sorry, there was an issue. Please try again.`, null, true);
            }, 500);
        }
    }
    
    showVoiceUnsupported() {
        const unsupportedDiv = document.createElement('div');
        unsupportedDiv.className = 'voice-unsupported';
        unsupportedDiv.innerHTML = `
            <i class="fas fa-microphone-slash"></i>
            Voice conversation is not supported in your browser. Please use a modern browser like Chrome, Edge, or Safari for voice features.
        `;
        
        this.voiceStatus.appendChild(unsupportedDiv);
        this.voiceModeBtn.disabled = true;
        this.voiceModeBtn.style.opacity = '0.5';
    }
    
    async loadData() {
        try {
            // Check health and load categories/stats
            await Promise.all([
                this.checkHealth(),
                this.loadCategories(),
                this.loadStats()
            ]);
        } catch (error) {
            console.error('Failed to load initial data:', error);
            this.updateStatus('Offline', false);
        }
    }
    
    async checkHealth() {
        try {
            const response = await fetch('/health');
            const data = await response.json();
            
            if (data.status === 'healthy') {
                this.updateStatus('Online', true);
            } else {
                this.updateStatus('Issues Detected', false);
            }
        } catch (error) {
            this.updateStatus('Offline', false);
            throw error;
        }
    }
    
    async loadCategories() {
        try {
            const response = await fetch('/categories');
            const data = await response.json();
            
            this.renderCategories(data.categories);
        } catch (error) {
            console.error('Failed to load categories:', error);
        }
    }
    
    async loadStats() {
        try {
            const response = await fetch('/stats');
            const data = await response.json();
            
            this.renderStats(data);
        } catch (error) {
            console.error('Failed to load stats:', error);
        }
    }
    
    renderCategories(categories) {
        this.categoriesList.innerHTML = categories.map(category => `
            <div class="category-item" data-category="${category.id}">
                <span class="category-icon">${category.icon}</span>
                <span class="category-name">${category.name}</span>
            </div>
        `).join('');
        
        // Add click listeners
        this.categoriesList.querySelectorAll('.category-item').forEach(item => {
            item.addEventListener('click', () => {
                const categoryId = item.getAttribute('data-category');
                this.selectCategory(categoryId, item);
            });
        });
    }
    
    renderStats(stats) {
        this.totalResources.textContent = stats.total_resources;
        this.totalCategories.textContent = stats.categories;
        
        // Update timestamp
        const timestamp = new Date(stats.last_updated).toLocaleTimeString();
        const timestampEl = document.getElementById('stats-timestamp');
        if (timestampEl) {
            timestampEl.textContent = `Updated: ${timestamp}`;
        }
    }
    
    selectCategory(categoryId, element) {
        // Remove active class from all categories
        this.categoriesList.querySelectorAll('.category-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Toggle category selection
        if (this.currentCategory === categoryId) {
            this.currentCategory = null;
        } else {
            this.currentCategory = categoryId;
            element.classList.add('active');
        }
    }
    
    updateStatus(text, isOnline) {
        this.statusText.textContent = text;
        const statusDot = document.querySelector('.status-dot');
        
        if (isOnline) {
            statusDot.style.background = '#10b981';
        } else {
            statusDot.style.background = '#ef4444';
        }
    }
    
    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message || this.isLoading) return;
        
        // Add user message to chat
        this.addUserMessage(message);
        
        // Clear input
        this.messageInput.value = '';
        
        // Show loading
        this.setLoading(true);
        
        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    category: this.currentCategory
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.addAssistantMessage(data);
            
        } catch (error) {
            console.error('Error sending message:', error);
            this.addAssistantMessage({
                response: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment, or call 211 for immediate assistance.",
                resources_found: 0,
                top_resources: []
            });
        } finally {
            this.setLoading(false);
        }
    }
    
    addUserMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'user-message';
        messageDiv.innerHTML = `
            <div class="avatar">
                <i class="fas fa-user"></i>
            </div>
            <div class="message-content">
                <p>${this.escapeHtml(message)}</p>
            </div>
        `;
        
        this.chatContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }
    
    addAssistantMessage(data) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'assistant-message';
        
        let resourcesHtml = '';
        if (data.top_resources && data.top_resources.length > 0) {
            resourcesHtml = `
                <div class="resources-grid">
                    ${data.top_resources.map(resource => `
                        <div class="resource-card">
                            <div class="resource-header">
                                <div class="resource-name">${this.escapeHtml(resource.name)}</div>
                                <div class="resource-score">${Math.round(resource.score * 100)}% match</div>
                            </div>
                            <div class="resource-info">
                                ${resource.address ? `
                                    <div class="resource-info-item">
                                        <i class="fas fa-map-marker-alt"></i>
                                        <span>${this.escapeHtml(resource.address)}</span>
                                    </div>
                                ` : ''}
                                ${resource.phone ? `
                                    <div class="resource-info-item">
                                        <i class="fas fa-phone"></i>
                                        <span>${this.escapeHtml(resource.phone)}</span>
                                    </div>
                                ` : ''}
                                <div class="resource-info-item">
                                    <i class="fas fa-tag"></i>
                                    <span>${this.escapeHtml(resource.category)}</span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        messageDiv.innerHTML = `
            <div class="avatar">
                <i class="fas fa-heart-pulse"></i>
            </div>
            <div class="message-content">
                <div class="assistant-response">${this.formatResponse(data.response)}</div>
                ${resourcesHtml}
                ${data.resources_found > 0 ? `
                    <div class="resources-summary">
                        <small><i class="fas fa-info-circle"></i> Found ${data.resources_found} relevant resources</small>
                    </div>
                ` : ''}
            </div>
        `;
        
        this.chatContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }
    
    formatResponse(response) {
        // Convert markdown-style formatting to HTML
        return response
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>')
            .replace(/^(.*)$/, '<p>$1</p>');
    }
    
    clearChat() {
        // Stop any speaking
        this.stopSpeaking();
        
        // Remove all messages except welcome
        const messages = this.chatContainer.querySelectorAll('.user-message, .assistant-message:not(.welcome-message .assistant-message), .voice-error');
        messages.forEach(message => message.remove());
        
        // Reset category selection
        this.currentCategory = null;
        this.categoriesList.querySelectorAll('.category-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Reset voice mode if active
        if (this.isVoiceMode) {
            this.updateVoiceStatus('ready', 'Voice mode active - tap "Tap to Speak" to start');
        }
    }
    
    setLoading(loading) {
        this.isLoading = loading;
        this.sendButton.disabled = loading;
        
        if (loading) {
            this.loadingOverlay.classList.add('show');
            this.sendButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        } else {
            this.loadingOverlay.classList.remove('show');
            this.sendButton.innerHTML = '<i class="fas fa-paper-plane"></i>';
        }
    }
    
    scrollToBottom() {
        setTimeout(() => {
            this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
        }, 100);
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    changeVoiceTone(tone) {
        this.voiceTone = tone;
        this.selectBestVoice(); // Re-select voice based on new tone
        
        // Update UI with tone description
        const toneConfig = this.voiceTones[tone];
        this.updateVoiceStatus('ready', `Voice tone: ${toneConfig.description}`);
        
        // Test the new voice tone
        if (this.isVoiceMode) {
            this.speakText(`Voice tone changed to ${tone}. ${toneConfig.description}.`);
        }
        
        console.log(`Voice tone changed to: ${tone}`, toneConfig);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.nextStepApp = new NextStepApp();
});

// Add some nice interactions
document.addEventListener('DOMContentLoaded', () => {
    // Add typing indicator effect
    let typingTimeout;
    const messageInput = document.getElementById('message-input');
    
    messageInput.addEventListener('input', () => {
        clearTimeout(typingTimeout);
        
        // Show typing indicator (if you want to add one)
        typingTimeout = setTimeout(() => {
            // Hide typing indicator
        }, 1000);
    });
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + K to focus search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            if (window.nextStepApp && !window.nextStepApp.isVoiceMode) {
                messageInput.focus();
            }
        }
        
        // Spacebar to start listening in voice mode
        if (e.code === 'Space' && window.nextStepApp && window.nextStepApp.isVoiceMode) {
            e.preventDefault();
            window.nextStepApp.startListening();
        }
        
        // Escape to clear category selection or exit voice mode
        if (e.key === 'Escape') {
            if (window.nextStepApp) {
                if (window.nextStepApp.isVoiceMode) {
                    window.nextStepApp.exitVoiceMode();
                } else {
                    const activeCategory = document.querySelector('.category-item.active');
                    if (activeCategory) {
                        activeCategory.classList.remove('active');
                        window.nextStepApp.currentCategory = null;
                    }
                }
            }
        }
    });
    
    // Add loading states for better UX
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            button.style.transform = 'scale(0.98)';
            setTimeout(() => {
                button.style.transform = '';
            }, 150);
        });
    });
}); 