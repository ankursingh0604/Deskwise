from groq import Groq
from .config import settings

client = Groq(api_key=settings.groq_api_key)

MODEL = "openai/gpt-oss-120b"


def build_system_prompt(agent_config, org_name: str) -> str:
    greeting = agent_config.greeting_message or f"Hi! Thanks for contacting {org_name}."
    hours = agent_config.business_hours or "Not specified."
    services = agent_config.services_offered or "Not specified."
    faq = agent_config.faq_knowledge_base or "No additional FAQ information available."

    return f"""You are the AI receptionist for {org_name}. Be warm, concise, and helpful.

Business hours: {hours}
Services offered: {services}
FAQ / knowledge base: {faq}

Opening greeting to use if this is the customer's first message: "{greeting}"

Answer customer questions using only the information above. If you don't know something, say so honestly and suggest they call or leave their contact info instead of making something up. Do not invent business details not listed above."""


def get_ai_reply(system_prompt: str, conversation_history: list[dict], new_message: str) -> str:
    messages = [{"role": "system", "content": system_prompt}]
    for msg in conversation_history:
        messages.append({"role": msg["role"], "content": msg["content"]})
    messages.append({"role": "user", "content": new_message})

    response = client.chat.completions.create(
        model=MODEL,
        messages=messages,
        temperature=0.7,
        max_tokens=500,
    )
    return response.choices[0].message.content