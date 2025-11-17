from django.conf import settings
from openai import OpenAI
import logging

logger = logging.getLogger(__name__)

def run_prompt(prompt: str, model: str = "gpt-4.1-mini") -> str:
    """
    Run a prompt through the OpenAI API.

    Args:
        prompt: The prompt string to send to the LLM
        model: The model name to use (default: gpt-4)

    Returns:
        The response text from the LLM

    Raises:
        Returns error message string if the API call fails
    """
    try:
        client = OpenAI(api_key=settings.OPENAI_API_KEY)

        response = client.responses.create(
            model=model,
            input=prompt
        )

        return response.output_text

    except Exception as e:
        error_message = f"LLM API Error: {str(e)}"
        logger.error(error_message)
        return error_message
