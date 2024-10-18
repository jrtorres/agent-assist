import json
import logging
import os
from ibm_watson import NaturalLanguageUnderstandingV1
from ibm_cloud_sdk_core.authenticators import IAMAuthenticator
from ibm_watson.natural_language_understanding_v1 import Features, EmotionOptions

# Initialize logging
logging.basicConfig(level=logging.INFO)

# Setup IBM Watson NLU service
authenticator = IAMAuthenticator(os.environ.get('AAN_NLU_API_KEY'))
natural_language_understanding = NaturalLanguageUnderstandingV1(
    version='2022-04-07',
    authenticator=authenticator
)
natural_language_understanding.set_service_url(os.environ.get('AAN_NLU_URL'))

def assess_sentiment(session_id, transcript):
    """
    Analyze the sentiment of the most recent message in the transcript using IBM Watson Natural Language Understanding.
    :param session_id: The session ID for the current call.
    :param transcript: The full transcript of the call so far.
    :return: A float value representing the sentiment of the most recent message.
    """
    try:
        recent_message = transcript.split("\n")[-1] if "\n" in transcript else transcript
        if len(recent_message.split(" ")) < 3:
            return False
        response = natural_language_understanding.analyze(
            text=recent_message,
            features=Features(emotion=EmotionOptions(document=True))
        ).get_result()
        emotions = response['emotion']['document']['emotion']
        print(f"Emotions returned: {emotions}")
        return emotions
    except Exception as e:
        logging.error(f"Error during sentiment assessment for session {session_id}: {e}")
        return False