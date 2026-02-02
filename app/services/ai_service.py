import openai
from sqlalchemy.orm import Session
from .. import models

# HARDCODED API KEY FROM CREDENTIALS FILE
API_KEY = "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"

client = openai.OpenAI(api_key=API_KEY)

def generate_story_suggestions(essay_content: str, prompt_text: str, user_notes: list[str]) -> str:
    """
    Generates story suggestions based on the essay prompt, current content (if any), 
    and the user's personal lens notes.
    """
    
    notes_context = "\n".join([f"- {note}" for note in user_notes])
    
    system_prompt = (
        "You are an expert college admissions consultant. "
        "Your goal is to help a student find authentic, personal stories to write about. "
        "Based on their personal notes and the essay prompt, generate 1 highly relevant story suggestion. "
        "You must return a raw JSON object (no markdown formatting) with the following structure: "
        "{"
        "  \"experience_name\": \"Short, catchy title for this story angle\","
        "  \"story_pillar\": \"The core theme (e.g., Resilience, Curiosity)\","
        "  \"why_it_fits\": \"2-3 sentences explaining why this fits the prompt and user's profile\","
        "  \"framing_guidance\": [\"Tip 1\", \"Tip 2\", \"Tip 3\"],"
        "  \"start_with\": \"A specific opening sentence idea\","
        "  \"focus_on\": \"What to emphasize\","
        "  \"avoid_focus\": \"What pitfalls to avoid\""
        "}"
    )

    user_message = f"""
    Essay Prompt: {prompt_text}
    
    Current Essay Draft:
    {essay_content}
    
    Student's Personal Lens Notes (Themes/Experiences):
    {notes_context}
    
    Provide the story suggestion in the specified JSON format.
    """

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            response_format={"type": "json_object"}
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"Error generating suggestions: {str(e)}"

def analyze_prompt_compatibility(prompt_text: str, other_prompts: list[str]) -> str:
    """
    Identifies which other prompts might be similar to the current one for reuse.
    """
    # This might be overkill for MVP, but we can implement a simple version.
    pass
