/**
 * parses intent schema into a lookup object
 * @param alexaApp the alexa app instance
 * @param intentSchema intent schema JSON file, copied from Amazon console
 */
export function parseIntentSchema(intentSchema: any) {
  const intents = intentSchema.interactionModel.languageModel.intents;

  const result = {};
  for (let intent of intents) {
    result[intent.name] = {
      slots: (intent.slots && intent.slots.map(s => s.name)) || undefined,
      utterances: intent.samples
    }
  }

  return result;
}