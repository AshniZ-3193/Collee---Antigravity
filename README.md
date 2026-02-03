# Collee - MVP

Your personal admissions copilot.

## Prerequisites

- Python 3.8+
- OpenAI API Key (Configured in `app/services/ai_service.py`)

## Setup

1.  **Clone/Open the repository**:
    Ensure you are in the `c:/Collee - Antigravity` directory.

2.  **Create a Virtual Environment** (Recommended):
    ```bash
    python -m venv venv
    # Windows
    venv\Scripts\activate
    # Mac/Linux
    source venv/bin/activate
    ```

3.  **Install Dependencies**:
    ```bash
    pip install -r requirements.txt
    ```

## Running the Application

1.  **Start the Server**:
    Run the following command from the root directory:
    ```bash
    uvicorn app.main:app --reload
    ```

2.  **Access the App**:
    Open your browser and navigate to: [http://localhost:8000](http://localhost:8000)

## Features

- **Onboarding**: Set up your profile (interests, motivation, voice).
- **Colleges**: Manage your college list and application types.
- **Personal Lens**: Record personal stories and notes.
- **Workspace**: Write essays with an integrated word counter and AI-powered story suggestions.

## Troubleshooting

- **Database**: The `collee.db` SQLite file is automatically created in the root directory on the first run.
- **AI Suggestions**: Ensure the OpenAI API Key in `app/services/ai_service.py` is valid.

TESTING
