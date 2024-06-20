class Tokenizer {
  /**
   * Converts a list of message objects with `"role"` and `"content"` keys to a list of token
   * ids. This method is intended for use with chat models, and will read the tokenizer's chat_template attribute to
   * determine the format and control tokens to use when converting. When chat_template is None, it will fall back
   * to the default_chat_template specified at the class level.
   * 
   * See [here](https://huggingface.co/docs/transformers/chat_templating) for more information.
   * 
   * **Example:** Applying a chat template to a conversation.
   * 
   * ```javascript
   * import { AutoTokenizer } from "@xenova/transformers";
   * 
   * const tokenizer = await AutoTokenizer.from_pretrained("Xenova/mistral-tokenizer-v1");
   * 
   * const chat = [
   *   { "role": "user", "content": "Hello, how are you?" },
   *   { "role": "assistant", "content": "I'm doing great. How can I help you today?" },
   *   { "role": "user", "content": "I'd like to show off how chat templating works!" },
   * ]
   * 
   * const text = tokenizer.apply_chat_template(chat, { tokenize: false });
   * // "<s>[INST] Hello, how are you? [/INST]I'm doing great. How can I help you today?</s> [INST] I'd like to show off how chat templating works! [/INST]"
   * 
   * const input_ids = tokenizer.apply_chat_template(chat, { tokenize: true, return_tensor: false });
   * // [1, 733, 16289, 28793, 22557, 28725, 910, 460, 368, 28804, 733, 28748, 16289, 28793, 28737, 28742, 28719, 2548, 1598, 28723, 1602, 541, 315, 1316, 368, 3154, 28804, 2, 28705, 733, 16289, 28793, 315, 28742, 28715, 737, 298, 1347, 805, 910, 10706, 5752, 1077, 3791, 28808, 733, 28748, 16289, 28793]
   * ```
   * 
   * @param {Message[]} conversation A list of message objects with `"role"` and `"content"` keys.
   * @param {Object} options An optional object containing the following properties:
   * @param {string} [options.chat_template=null] A Jinja template to use for this conversion. If
   * this is not passed, the model's default chat template will be used instead.
   * @param {boolean} [options.add_generation_prompt=false] Whether to end the prompt with the token(s) that indicate
   * the start of an assistant message. This is useful when you want to generate a response from the model.
   * Note that this argument will be passed to the chat template, and so it must be supported in the
   * template for this argument to have any effect.
   * @param {boolean} [options.tokenize=true] Whether to tokenize the output. If false, the output will be a string.
   * @param {boolean} [options.padding=false] Whether to pad sequences to the maximum length. Has no effect if tokenize is false.
   * @param {boolean} [options.truncation=false] Whether to truncate sequences to the maximum length. Has no effect if tokenize is false.
   * @param {number} [options.max_length=null] Maximum length (in tokens) to use for padding or truncation. Has no effect if tokenize is false.
   * If not specified, the tokenizer's `max_length` attribute will be used as a default.
   * @param {boolean} [options.return_tensor=true] Whether to return the output as a Tensor or an Array. Has no effect if tokenize is false.
   * @param {Object} [options.tokenizer_kwargs={}] Additional options to pass to the tokenizer.
   * @returns {string | Tensor | number[]| number[][]} The tokenized output.
   */
  apply_chat_template(conversation, {
    chat_template = null,
    add_generation_prompt = false,
    tokenize = true,
    padding = false,
    truncation = false,
    max_length = null,
    return_tensor = true,
    tokenizer_kwargs = {},
    ...kwargs
  } = {}) {
    if (!inspectType(conversation, {
      "type": "array",
      "elementType": "Message",
      "optional": false
    }, 'Tokenizer#apply_chat_template', 'conversation')) {
      youCanAddABreakpointHere();
    }
    if (!inspectType(chat_template, {
      "type": "string",
      "optional": true
    }, 'Tokenizer#apply_chat_template', 'options')) {
      youCanAddABreakpointHere();
    }
    if (!inspectType(add_generation_prompt, {
      "type": "boolean",
      "optional": true
    }, 'Tokenizer#apply_chat_template', 'options')) {
      youCanAddABreakpointHere();
    }
    if (!inspectType(tokenize, {
      "type": "boolean",
      "optional": true
    }, 'Tokenizer#apply_chat_template', 'options')) {
      youCanAddABreakpointHere();
    }
    if (!inspectType(padding, {
      "type": "boolean",
      "optional": true
    }, 'Tokenizer#apply_chat_template', 'options')) {
      youCanAddABreakpointHere();
    }
    if (!inspectType(truncation, {
      "type": "boolean",
      "optional": true
    }, 'Tokenizer#apply_chat_template', 'options')) {
      youCanAddABreakpointHere();
    }
    if (!inspectType(max_length, {
      "type": "number",
      "optional": true
    }, 'Tokenizer#apply_chat_template', 'options')) {
      youCanAddABreakpointHere();
    }
    if (!inspectType(return_tensor, {
      "type": "boolean",
      "optional": true
    }, 'Tokenizer#apply_chat_template', 'options')) {
      youCanAddABreakpointHere();
    }
    if (!inspectType(tokenizer_kwargs, {
      "type": "object",
      "optional": true
    }, 'Tokenizer#apply_chat_template', 'options')) {
      youCanAddABreakpointHere();
    }
    return kwargs;
  }
}
registerClass(Tokenizer);
const tokenizer = new Tokenizer();
tokenizer.apply_chat_template([1, 2, 3], {
  chat_template: "nope",
  lol: 123,
});
