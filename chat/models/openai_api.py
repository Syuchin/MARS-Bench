import openai
from tenacity import retry, stop_after_attempt, wait_exponential

class OpenAIChat:
    def __init__(self, model_name, api_key=None):
        self.model_name = model_name
        if api_key:
            openai.api_key = api_key

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
    def __call__(self, prompts, histories, **kwargs):
        responses = []
        for prompt, history in zip(prompts, histories):
            messages = []
            if history:
                messages.extend(history)
            messages.append({"role": "user", "content": prompt})
            
            try:
                response = openai.ChatCompletion.create(
                    model=self.model_name,
                    messages=messages,
                    **kwargs
                )
                responses.append(response.choices[0].message.content)
            except Exception as e:
                responses.append({"error": str(e)})
        return responses

def load_model(model_name, **kwargs):
    return OpenAIChat(model_name, **kwargs) 