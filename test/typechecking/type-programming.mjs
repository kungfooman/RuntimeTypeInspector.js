/**
 * A base class for creating callable objects.
 *
 * @type {new () => {(...args: any[]): any, _call(...args: any[]): any}}
 */
export const Callable = /** @type {any} */ (class {
  /**
   * Creates a new instance of the Callable class.
   */
  constructor() {
    /**
     * Creates a closure that delegates to a private method '_call' with the given arguments.
     * @type {any}
     * @param {...any} args - Zero or more arguments to pass to the '_call' method.
     * @returns {*} The result of calling the '_call' method.
     */
    const closure = function (...args) {
      return closure._call(...args);
    };
    return Object.setPrototypeOf(closure, new.target.prototype);
  }
  /**
   * This method should be implemented in subclasses to provide the
   * functionality of the callable object.
   *
   * @param {any[]} args - The arguments.
   * @throws {Error} If the subclass does not implement the `_call` method.
   */
  _call(...args) {
    throw Error('Must implement _call method in subclass');
  }
});
/**
 * A base class for pre-trained models that provides the model configuration and an ONNX session.
 */
export class PreTrainedModel extends Callable {
  main_input_name = 'input_ids';
  /**
   * Creates a new instance of the `PreTrainedModel` class.
   * @param {Object} config - The model configuration.
   * @param {any} session - session for the model.
   */
  constructor(config, session) {
    super();
  }
}
export class PreTrainedTokenizer extends Callable {
  return_token_type_ids = false;
  _default_chat_template = `{% for message in messages %}{{'<|im_start|>' + message['role'] + '\n' + message['content'] + '<|im_end|>' + '\n'}}{% endfor %}{% if add_generation_prompt %}{{ '<|im_start|>assistant\n' }}{% endif %}`;
  /**
   * Create a new PreTrainedTokenizer instance.
   * @param {Object} tokenizerJSON - The JSON of the tokenizer.
   * @param {Object} tokenizerConfig - The config of the tokenizer.
   */
  constructor(tokenizerJSON, tokenizerConfig) {
    super();
  }
}
class FeatureExtractor {}
/**
 * Represents a Processor that extracts features from an input.
 * @extends Callable
 */
export class Processor extends Callable {
  /**
   * Creates a new Processor with the given feature extractor.
   * @param {FeatureExtractor} feature_extractor - The function used to extract features from the input.
   */
  constructor(feature_extractor) {
    super();
    this.feature_extractor = feature_extractor;
    // TODO use tokenizer here?
  }
}
/**
 * @callback DisposeType Disposes the item.
 * @returns {Promise<void>} A promise that resolves when the item has been disposed.
 *
 * @typedef {Object} Disposable
 * @property {DisposeType} dispose A promise that resolves when the pipeline has been disposed.
 */
/**
 * The Pipeline class is the class from which all pipelines inherit.
 * Refer to this class for methods shared across different pipelines.
 * @augments Callable
 */
export class Pipeline extends Callable {
  /**
   * Create a new Pipeline.
   * @param {Object} options - An object containing the following properties:
   * @param {string} [options.task] - The task of the pipeline. Useful for specifying subtasks.
   * @param {PreTrainedModel} [options.model] - The model used by the pipeline.
   * @param {PreTrainedTokenizer|null} [options.tokenizer] - The tokenizer used by the pipeline (if any).
   * @param {Processor|null} [options.processor] - The processor used by the pipeline (if any).
   */
  constructor({ task, model, tokenizer = null, processor = null }) {
    super();
    this.task = task;
    this.model = model;
    this.tokenizer = tokenizer;
    this.processor = processor;
  }
  /** @type {DisposeType} */
  async dispose() {
    await this.model.dispose();
  }
}
// Pipeline:
class FillMaskPipeline                   { /** @param {...any} args - Test args */ constructor(...args) {console.log('FillMaskPipeline'                  , ...args)}}
class QuestionAnsweringPipeline          { /** @param {...any} args - Test args */ constructor(...args) {console.log('QuestionAnsweringPipeline'         , ...args)}}
class SummarizationPipeline              { /** @param {...any} args - Test args */ constructor(...args) {console.log('SummarizationPipeline'             , ...args)}}
class Text2TextGenerationPipeline        { /** @param {...any} args - Test args */ constructor(...args) {console.log('Text2TextGenerationPipeline'       , ...args)}}
class TokenClassificationPipeline        { /** @param {...any} args - Test args */ constructor(...args) {console.log('TokenClassificationPipeline'       , ...args)}}
class TextClassificationPipeline         { /** @param {...any} args - Test args */ constructor(...args) {console.log('TextClassificationPipeline'        , ...args)}}
class TranslationPipeline                { /** @param {...any} args - Test args */ constructor(...args) {console.log('TranslationPipeline'               , ...args)}}
class TextGenerationPipeline             { /** @param {...any} args - Test args */ constructor(...args) {console.log('TextGenerationPipeline'            , ...args)}}
class ZeroShotClassificationPipeline     { /** @param {...any} args - Test args */ constructor(...args) {console.log('AutoModelForCausalLM'              , ...args)}}
// Classification:
class AutoModelForSequenceClassification { /** @param {...any} args - Test args */ constructor(...args) {console.log('AutoModelForSequenceClassification', ...args)}}
class AutoModelForTokenClassification    { /** @param {...any} args - Test args */ constructor(...args) {console.log('AutoModelForTokenClassification'   , ...args)}}
// Other placeholders:
class AutoModelForQuestionAnswering      { /** @param {...any} args - Test args */ constructor(...args) {console.log('AutoModelForQuestionAnswering'     , ...args)}}
class AutoModelForMaskedLM               { /** @param {...any} args - Test args */ constructor(...args) {console.log('AutoModelForMaskedLM'              , ...args)}}
class AutoModelForSeq2SeqLM              { /** @param {...any} args - Test args */ constructor(...args) {console.log('AutoModelForSeq2SeqLM'             , ...args)}}
class AutoModelForCausalLM               { /** @param {...any} args - Test args */ constructor(...args) {console.log('AutoModelForCausalLM'              , ...args)}}
class AutoTokenizer                      { /** @param {...any} args - Test args */ constructor(...args) {console.log('AutoTokenizer'                     , ...args)}}
const SUPPORTED_TASKS = Object.freeze({
  "text-classification": {
    "tokenizer": AutoTokenizer,
    "pipeline": TextClassificationPipeline,
    "model": AutoModelForSequenceClassification,
    "default": {
      // TODO: replace with original
      // "model": "distilbert-base-uncased-finetuned-sst-2-english",
      "model": "Xenova/distilbert-base-uncased-finetuned-sst-2-english",
    },
    "type": "text",
  },
  "token-classification": {
    "tokenizer": AutoTokenizer,
    "pipeline": TokenClassificationPipeline,
    "model": AutoModelForTokenClassification,
    "default": {
      // TODO: replace with original
      // "model": "Davlan/bert-base-multilingual-cased-ner-hrl",
      "model": "Xenova/bert-base-multilingual-cased-ner-hrl",
    },
    "type": "text",
  },
  "question-answering": {
    "tokenizer": AutoTokenizer,
    "pipeline": QuestionAnsweringPipeline,
    "model": AutoModelForQuestionAnswering,
    "default": {
      // TODO: replace with original
      // "model": "distilbert-base-cased-distilled-squad",
      "model": "Xenova/distilbert-base-cased-distilled-squad",
    },
    "type": "text",
  },

  "fill-mask": {
    "tokenizer": AutoTokenizer,
    "pipeline": FillMaskPipeline,
    "model": AutoModelForMaskedLM,
    "default": {
      // TODO: replace with original
      // "model": "bert-base-uncased",
      "model": "Xenova/bert-base-uncased",
    },
    "type": "text",
  },
  "summarization": {
    "tokenizer": AutoTokenizer,
    "pipeline": SummarizationPipeline,
    "model": AutoModelForSeq2SeqLM,
    "default": {
      // TODO: replace with original
      // "model": "sshleifer/distilbart-cnn-6-6",
      "model": "Xenova/distilbart-cnn-6-6",
    },
    "type": "text",
  },
  "translation": {
    "tokenizer": AutoTokenizer,
    "pipeline": TranslationPipeline,
    "model": AutoModelForSeq2SeqLM,
    "default": {
      // TODO: replace with original
      // "model": "t5-small",
      "model": "Xenova/t5-small",
    },
    "type": "text",
  },
  "text2text-generation": {
    "tokenizer": AutoTokenizer,
    "pipeline": Text2TextGenerationPipeline,
    "model": AutoModelForSeq2SeqLM,
    "default": {
      // TODO: replace with original
      // "model": "google/flan-t5-small",
      "model": "Xenova/flan-t5-small",
    },
    "type": "text",
  },
  "text-generation": {
    "tokenizer": AutoTokenizer,
    "pipeline": TextGenerationPipeline,
    "model": AutoModelForCausalLM,
    "default": {
      // TODO: replace with original
      // "model": "gpt2",
      "model": "Xenova/gpt2",
    },
    "type": "text",
  },
  "zero-shot-classification": {
    "tokenizer": AutoTokenizer,
    "pipeline": ZeroShotClassificationPipeline,
    "model": AutoModelForSequenceClassification,
    "default": {
      // TODO: replace with original
      // "model": "typeform/distilbert-base-uncased-mnli",
      "model": "Xenova/distilbert-base-uncased-mnli",
    },
    "type": "text",
  },
});
// TODO: Add types for TASK_ALIASES
const TASK_ALIASES = Object.freeze({
  "sentiment-analysis": "text-classification",
  "ner": "token-classification"
});
/**
 * @typedef {keyof typeof SUPPORTED_TASKS} TaskType
 * @typedef {keyof typeof TASK_ALIASES} AliasType
 * @typedef {TaskType | AliasType} PipelineType All possible pipeline types.
 * @typedef {{[K in TaskType]: InstanceType<typeof SUPPORTED_TASKS[K]["pipeline"]>}} SupportedTasks A mapping of pipeline names to their corresponding pipeline classes.
 * @typedef {{[K in AliasType]: InstanceType<typeof SUPPORTED_TASKS[TASK_ALIASES[K]]["pipeline"]>}} AliasTasks A mapping from pipeline aliases to their corresponding pipeline classes.
 * @typedef {SupportedTasks & AliasTasks} AllTasks A mapping from all pipeline names and aliases to their corresponding pipeline classes.
 */
/**
 * @param {AliasTasks} x - Input
 * @returns {AliasTasks} Returns input.
 */
function identity(x) {
  return x;
}
identity(123);
