# NextStep Healthcare Navigator

A professional AI-powered healthcare resource navigator for Houston, Texas. NextStep connects users with essential healthcare services through intelligent search and empathetic assistance.

## Features

- **AI-Powered Assistance**: Empathetic social worker-style responses powered by OpenAI
- **Voice Conversation**: Full voice-to-voice interaction with 6 professional tones
- **Comprehensive Database**: 101+ Houston healthcare resources across 11 categories
- **Smart Search**: Semantic search using RAG (Retrieval-Augmented Generation)
- **Professional Interface**: Clinical design optimized for healthcare navigation
- **Real-time Chat**: Interactive chat interface with category filtering
- **Mobile Responsive**: Works seamlessly across all devices

## Healthcare Categories

- Mental Health Services
- Substance Abuse Treatment
- Housing Assistance
- Food Security
- Healthcare Services
- Legal Aid
- Employment Services
- Transportation
- Financial Assistance
- Education & Training
- Emergency Services

## Technology Stack

- **Backend**: FastAPI with Python 3.8+
- **Database**: DataStax Astra DB (Cassandra)
- **AI**: OpenAI GPT-4 with RAG implementation
- **Search**: Sentence Transformers for semantic embeddings
- **Frontend**: Vanilla JavaScript with Web Speech API
- **Voice**: Speech Recognition & Synthesis APIs

## Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/dumbandstupid123/NextStepBeta.git
   cd NextStepBeta
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables**
   Create a `.env` file with:
   ```
   OPENAI_API_KEY=your_openai_api_key
   ASTRA_DB_APPLICATION_TOKEN=your_astra_token
   ASTRA_DB_API_ENDPOINT=your_astra_endpoint
   ```

4. **Run the application**
   ```bash
   python run_nextstep.py
   ```

5. **Access the application**
   Open http://localhost:8000 in your browser

## Voice Features

NextStep includes advanced voice interaction with 6 professional tones:

- **Clinical & Professional** (Default)
- **Empathetic & Supportive**
- **Calm & Therapeutic**
- **Collaborative & Approachable**
- **Motivational & Encouraging**
- **Gentle & Reassuring**

## API Endpoints

- `GET /` - Main application interface
- `GET /health` - Health check endpoint
- `POST /chat` - AI chat interaction
- `GET /categories` - Available service categories
- `GET /stats` - Database statistics

## Development

The application follows a clean architecture:

```
NextStepBeta/
├── backend/
│   ├── app.py              # FastAPI application
│   └── nextstep_assistant.py # AI assistant logic
├── frontend/
│   ├── index.html          # Main interface
│   ├── styles.css          # Professional styling
│   └── script.js           # Interactive functionality
├── requirements.txt        # Python dependencies
└── run_nextstep.py        # Application launcher
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is designed to serve the Houston community by connecting residents with essential healthcare resources.

## Support

For technical support or healthcare resource updates, please open an issue on GitHub.

---

**NextStep Healthcare Navigator** - Connecting Houston residents with essential healthcare services through AI-powered assistance. 