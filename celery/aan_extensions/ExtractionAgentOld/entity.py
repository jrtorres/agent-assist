from ibm_watson_machine_learning.foundation_models import Model
from ibm_watson_machine_learning.metanames import GenTextParamsMetaNames as GenParams
import os
import logging
import re

logging.basicConfig(level=logging.INFO)

DETAIL = 0.5
MAX_NEW_TOKENS = 500
TOKEN_LIMIT = 1024
# Initialize the model
generate_params = {GenParams.MAX_NEW_TOKENS: MAX_NEW_TOKENS}
model_name = os.environ.get('AAN_ENTITY_EXTRACTION_LLM_MODEL_NAME', 'ibm/granite-13b-chat-v2')
logging.info(f'LLM model name to be used for entity extraction: {model_name}')
model = Model(
    model_id=model_name,
    params=generate_params,
    credentials={
        "apikey": os.environ.get('AAN_WML_APIKEY'),
        "url": os.environ.get('AAN_WML_URL', "https://us-south.ml.cloud.ibm.com")
    },
    project_id=os.environ.get('AAN_WML_PROJECT_ID')
)

def extract_entities(message):
    """
    Extracts entities from the given message using the LLM model, following the specified prompt instructions.

    :param message: The customer message from which to extract entities.
    :return: Extracted entities in the required format or "none" if no entities were found.
    """
    try:
        entity_extraction_prompt = entity_extraction_prompt = entity_extraction_prompt = """
            <s>[INST] <<SYS>> 
            You are an assistant with the task of precisely identifying and listing specific entities from texts. Focus on extracting: street address, city, state, zipcode, phone number, person's name, email address, and issues described. Your responses must be direct, only including detected entities with their labels, or "None" if no relevant entities are found. 

            - Be concise and direct, avoiding additional context or narrative. 
            - If an entity type is not mentioned, do not infer it.
            - Ensure accuracy and relevancy in your responses, remaining neutral and unbiased.

            The following are example instructions for clarity:
            - "Phone number: [number]" if a phone number is mentioned.
            - "Issue: [brief issue description]" for any issues described.
            - "None" if no relevant entities are found in the text.

            Using this guidance, extract entities from the conversation excerpt below, adhering strictly to the outlined instructions and examples. Your role is to provide helpful, accurate, and straightforward entity identifications based on the text.
            <</SYS>>[INST] 
            {}
            [/INST]</s>
            """.format(message)

        extraction_response = model.generate_text(prompt=entity_extraction_prompt)
        extracted_text = extraction_response if isinstance(extraction_response, str) else extraction_response.get('generated_text', '')
        entities = parse_llm_response(extracted_text)
        return entities
    except Exception as e:
        logging.error(f"Error during entity extraction: {e}")
        return {}

def process_message(transcript):
    """
    Processes the transcript message to extract entities.

    :param transcript: The full transcript or latest customer message.
    :return: The extracted entities or indication of none found.
    """
    extracted_entities = extract_entities(transcript)
    return extracted_entities


def parse_llm_response(response_text):
    """
    Parse the LLM response to extract entities and their values.
    Dynamically accepts any entity titles provided by the LLM.
    Returns a dictionary of the entities with their extracted values or 'None'.
    """

    entities = {}

    entity_regex = re.compile(r"(?P<entity>[^:\n]+):\s*(?P<value>.+?)(?=\n[^:\n]+:|$)", re.DOTALL)
    
    matches = entity_regex.finditer(response_text)

    for match in matches:
        entity = match.group("entity").strip()
        entity = re.sub(r"^[^a-zA-Z]+", "", entity)
        value = match.group("value").strip()
        value = None if value.lower() == "none" else value

        # Add or update the entity in the dictionary
        entities[entity] = value

    return entities

