from ibm_watson_machine_learning.foundation_models import Model
from ibm_watson_machine_learning.metanames import GenTextParamsMetaNames as GenParams
import os
import logging
import re
import json

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

def extract_entities(agent_text, user_text):
    """
    Extracts entities from the given message using the LLM model, following the specified prompt instructions.
    :param message: The customer message from which to extract entities.
    :return: Extracted entities in the required format or "none" if no entities were found.
    """
    print (f"extract_entities: agent_text: {agent_text}")
    print (f"extract_entities: user_text: {user_text}")

    try:
        entities_to_extract = str(os.environ.get('AAN_ENTITY_EXTRACTION_ENTITIES'))
        if model_name == 'meta-llama/llama-3-70b-instruct' or model_name == 'meta-llama/llama-3-1-70b-instruct' or model_name == 'meta-llama/llama-3-3-70b-instruct':
            
            entity_extraction_prompt = """ 
                <|begin_of_text|><|start_header_id|>system<|end_header_id|>
                You are an assistant with the task of precisely extracting entities from the user part of a conversation text between an agent and a user. Focus on extracting: {2}. Your responses must be direct, only including detected entities with their labels, or response with no text if no relevant entities are found. Be concise and direct, avoiding additional context or narrative. If an entity type is not mentioned, do not infer it. Ensure accuracy and relevancy in your responses, remaining neutral and unbiased.
                Output answer in JSON using the following format: {{entity name: entity value, entity name: entity value, entity name: entity value}}
                <</SYS>>
                What entities exist in the following text? Only extract entities from User Text. Use the Agent Text for context. The only entities that you are to look for are:
                {2}
                If none of these entities are found, return nothing. Only provide an entity if very confident it has been said in the conversation.
                Output answer in JSON using the following format: {{entity name: entity value, entity name: entity value, entity name: entity value}}
                Agent Text: okay and can i also have your email address and was the city name Cana?
                User Text: sure it's steve simmons just like it's spelled at gmail.com and the city name is King of Prussia[/INST]
                {{\"Email Address\": \"stevesimmons@gmail.com\",\"City\":\"King of Prussia\"}} 
               
                What entities exist in the following text? Only extract entities from User Text, not from the Agent Text. Only statements from the User Text can contain entities. Use the Agent Text for context. The only entities that you are to look for are:
                {2}
                If none of these entities are found, return nothing. Only provide an entity if very confident it has been said in the conversation.
                Output answer in JSON using the following format: {{entity name: entity value, entity name: entity value, entity name: entity value}}
                <|eot_id|>
                <|start_header_id|>user<|end_header_id|>
                Agent Text: {0}
                User Text: {1}
                <|eot_id|><|start_header_id|>assistant<|end_header_id|>""".format(agent_text, user_text, entities_to_extract)
        else:
            entity_extraction_prompt = """ 
                <s>[INST] <<SYS>> 
                You are an assistant with the task of precisely extracting entities from the user part conversation text between an agent and a user. Focus on extracting: {2}. Your responses must be direct, only including detected entities with their labels, or response with no text if no relevant entities are found. Be concise and direct, avoiding additional context or narrative. If an entity type is not mentioned, do not infer it. Ensure accuracy and relevancy in your responses, remaining neutral and unbiased.
                Output answer in JSON using the following format: {{entity name: entity value, entity name: entity value, entity name: entity value}}
                <</SYS>>
                What entities exist in the following text? Only extract entities from User Text. Use the Agent Text for context. The only entities that you are to look for are:
                {2}
                If none of these entities are found, return nothing. Only provide an entity if very confident it has been said in the conversation.
                Output answer in JSON using the following format: {{entity name: entity value, entity name: entity value, entity name: entity value}}
                Agent Text: okay and can i also have your email address and was the city name Cana?
                User Text: sure it's steve simmons just like it's spelled at gmail.com and the city name is King of Prussia[/INST]
                {{\"Email Address\": \"stevesimmons@gmail.com\",\"City\":\"King of Prussia\"}} 
                </s>
                <s>[INST]
                What entities exist in the following text? Only extract entities from User Text, not from the Agent Text. Only statements from the User Text can contain entities. Use the Agent Text for context. The only entities that you are to look for are:
                {2}
                If none of these entities are found, return nothing. Only provide an entity if very confident it has been said in the conversation.
                Output answer in JSON using the following format: {{entity name: entity value, entity name: entity value, entity name: entity value}}
                Agent Text: {0}
                User Text: {1}
                [/INST]""".format(agent_text, user_text, entities_to_extract)
        extraction_response = model.generate_text(prompt=entity_extraction_prompt)
        extracted_text = extraction_response if isinstance(extraction_response, str) else extraction_response.get('generated_text', '')
        entities = parse_llm_response(extracted_text)
        return entities
    except Exception as e:
        logging.error(f"Error during entity extraction: {e}")
        return {}

def process_message(agent_transcript, user_transcript):
    """
    Processes the transcript message to extract entities.
    :param transcript: The full transcript or latest customer message.
    :return: The extracted entities or indication of none found.
    """
    extracted_entities = extract_entities(agent_transcript, user_transcript)
    return extracted_entities


def parse_llm_response(response_text):
    """
    Parse the LLM response to extract entities and their values.
    Dynamically accepts any entity titles provided by the LLM.
    Returns a dictionary of the entities with their extracted values or 'None'.
    """

    print(f"Parsing this generated text: {response_text[200:]}")

    """ REMOVE
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
    """

    return json.loads(response_text)
