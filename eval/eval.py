import re
import json
import logging
import os
import sys
import argparse
from typing import Any, Dict

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Add project root directory to Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(current_dir)
if root_dir not in sys.path:
    sys.path.append(root_dir)

# Import configuration initialization functions
from config.config_wrapper import initialize_config, get_config_wrapper

# Import DeepSeek model
try:
    from deepseek_api import load_model
except ImportError:
    logging.error("Unable to import deepseek_api module. Please make sure it is in the current directory or Python path.")
    from . import deepseek_api
    load_model = deepseek_api.load_model

# Default error score
DEFAULT_ERROR_SCORE = 0.0

# Judge prompt
JUDGE_PROMPT = """You are a meticulous Grader tasked with evaluating the factual accuracy and completeness of a large language model's `prediction` regarding a sports game. Your evaluation must be based *strictly* on the provided `checklist`. The `reference_answer` is provided as an ideal response example for context but scoring relies solely on the checklist items.

### Important Preprocessing Note:
Before beginning the evaluation, please note: the prediction text may contain HTML escape characters (e.g., `\u003c` represents `<`, `\u003e` represents `>`). When analyzing any tag content (especially the `<Summary>` tag), please first convert these escape characters back to their original symbolic form before making content judgments. For example, treat `\u003cSummary\u003e` as `<Summary>`.

### Evaluation Process:
1.  **Preprocess Escape Characters:** First, convert all HTML escape characters in the prediction text to their original symbols (e.g., convert `\u003c` to `<`, `\u003e` to `>`).
2.  **Analyze Checklist:** Carefully examine the `checklist`. It contains specific facts or pieces of information (`"{fact}"`) expected in the prediction, each associated with points (`points`). It might also contain a `first_check` section with overriding conditions.
3.  **Compare Prediction to Checklist:** For each item `"{fact}": points` in the main checklist:
    *   Determine if the specific `fact` is accurately present in the `prediction`. Reasonable paraphrasing is acceptable if the core meaning and data are identical to the fact stated in the checklist item.
    *   If the fact is present and correct in the prediction, award the corresponding `points`.
4.  **Calculate Initial Score:** Sum the points awarded for all correctly matched checklist items.
5.  **Apply `first_check` Overrides (If Applicable):** Examine the `first_check` section of the checklist, if present. This section typically contains key-value pairs like `{"Reason for Zero Score": 0}`.
    *   Evaluate if any of the listed "Reasons for Zero Score" accurately describe a fundamental flaw present in the `prediction`. A common example is if the prediction significantly misunderstands the core subject of the query (e.g., providing stats for the wrong player or team entirely when a specific one was asked about).
    *   If **any** condition listed in `first_check` is determined to be true based on your assessment of the `prediction`, the **final score must be 0**. This overrides any points accumulated from the main checklist items.
6.  **Determine Final Score:** The final score is the summed points from the main checklist (Step 3), potentially overridden to 0 if a `first_check` condition was met (Step 4). The score will be a float between 0.0 and 1.0.
7.  Please ensure the accuracy of various data, such as the number of attempts, hits, and assists, etc., and only when these numbers are completely consistent can the correctness of the check item be confirmed.

### Output Format:
Provide your evaluation in the following format:

[Scoring analysis]:
- Briefly explain which checklist items were found correctly in the `prediction` and which were missing or incorrect, referencing the awarded points.
- If a `first_check` condition was met and resulted in a score of 0, **clearly state which specific condition** (the key from the `first_check` dictionary, e.g., "Player name incorrect") was triggered and briefly explain why it applies to the prediction.
- Keep the analysis concise (around 100-150 words).
- Conclude with: "In conclusion, the prediction should receive x points" (where x is the final float score).

[Score]: x points

[JSON]:
```json
{
  "answer_score": [[score]]
}
```
---
**Example Scenario (Illustrative):**

*Checklist:*
```json
{
  "checklist": [
    "Player A scored 10 points": 0.4,
    "Player A had 3 assists": 0.3,
    "Player B had 5 rebounds": 0.3
  ],
  "first_check": [
     "Player name incorrect": 0
  ]
}
```
*Prediction:* "Player A scored 10 points and had 2 assists. Player C had 5 rebounds."

*[Scoring analysis]:*
The prediction correctly states "Player A scored 10 points" (0.4 points awarded).
The prediction incorrectly states Player A had 2 assists instead of 3 (0 points awarded for this item).
The prediction mentions Player C's rebounds, not Player B's (0 points awarded for this item).
No `first_check` condition applies as the player name (Player A) seems correct initially.
Total score = 0.4 + 0 + 0 = 0.4.
In conclusion, the prediction should receive 0.4 points.

*[Score]:* 0.4 points

*[JSON]:*
```json
{
  "answer_score": [[0.4]]
}
```
*(Note: If the query was about Player Z, and the prediction talked about Player A, the `first_check` might apply, making the score 0). There may be multiple answers that need to be judged at the same time in the answer. Please judge them one by one*
"""

JUDGE_PROMPT_zh = """你是一名一丝不苟的评分员，负责评估大语言模型对一场体育比赛的 `prediction`（预测）在事实准确性和完整性方面的表现。你的评估必须*严格*基于提供的 `checklist`（检查清单）。`reference_answer`（参考答案）作为一个理想回应的范例，仅供参考，但评分仅依赖于检查清单中的项目。

### 重要预处理说明：
在开始评估前，请注意：预测文本中可能包含HTML转义字符（如 `\u003c` 代表 `<`, `\u003e` 代表 `>`）。在分析任何标签内容（特别是 `<Summary>` 标签）时，请先将这些转义字符转换回其原始符号形式，然后再进行内容判断。例如，将 `\u003cSummary\u003e` 视为 `<Summary>`。

### 评估流程：
1.  **预处理转义字符：** 首先将预测文本中的所有HTML转义字符转换为其原始符号（例如，将 `\u003c` 转换为 `<`，将 `\u003e` 转换为 `>`）。
2.  **分析检查清单：** 仔细检查 `checklist`。其中包含期望出现在预测中的具体事实或信息（`"{fact}"`），每项都分配了相应的分数（`points`）。它还可能包含一个名为 `first_check` 的部分，其中包含覆盖性条件。
3.  **将预测与检查清单进行比对：** 对于主检查清单中每一个 `"{fact}": points` 项：
    *   判断该特定 `fact` 是否准确地出现在 `prediction` 中。只要核心含义和数据与检查清单项完全一致，则合理的改写可以接受。
    *   如果该事实在预测中准确体现，则给予对应的 `points`。
4.  **计算初始得分：** 将所有正确匹配的检查清单项所获分数相加。
5.  **应用 `first_check` 覆盖条件（如适用）：** 检查清单中如有 `first_check` 部分，请对照评估。该部分通常包含类似 `{"Reason for Zero Score": 0}` 的键值对。
    *   判断 `prediction` 中是否存在所列出的"零分原因"中的任何一项明显缺陷。例如，如果预测严重误解了查询的核心内容（如问题明确问的是某位球员或球队，但预测中却提供了另一位球员或球队的数据），就可能触发该条件。
    *   如果你判定有**任意一个** `first_check` 中的条件被满足，则**最终得分必须为 0**。这会覆盖主检查清单中的所有得分。
6.  **确定最终得分：** 最终得分为主检查清单得分总和（步骤3），但如触发 `first_check` 条件，则被覆写为0。得分为 0.0 到 1.0 之间的浮点数。

### 输出格式：
请按照以下格式提供你的评分结果：

[评分分析]：
- 简要说明哪些检查清单项在 `prediction` 中被正确体现，哪些遗漏或不正确，并引用相应的得分。
- 如果触发了 `first_check` 条件并导致得分为0，**请明确指出是哪一具体条件**（即 `first_check` 字典中的键，例如 "Player name incorrect"），并简要说明其适用原因。
- 保持分析简洁（约100-150字）。
- 最后总结："综上，该预测应得 x 分"（其中 x 是最终浮点得分）。

[得分]：x 分

[JSON]:
```json
{
  "answer_score": [[score]]
}
```
---

**示例场景（说明性）**：

*清单：*

```json

{
"checklist": [
"Player A scored 10 points": 0.4,
"Player A had 3 assists": 0.3,
"Player B had 5 rebounds": 0.3
],
"first_check": [
"Player name incorrect": 0
]
}

```

*预测:* "Player A scored 10 points and had 2 assists. Player C had 5 rebounds."

*[评分分析]*

预测正确地指出 "Player A scored 10 points"（获得0.4分）。

预测错误地指出Player A有2次助攻而不是3次（此项目未获得0分）。

预测提到了Player C的篮板，而不是Player B的（此项目未获得0分）。

没有 `first_check` 条件适用，因为玩家名字（Player A）最初似乎是正确的。

总分 = 0.4 + 0 + 0 = 0.4。

总之，预测应获得0.4分。

*[得分]*: 0.4分

*[JSON]*:

```json

{
"answer_score": [[0.4]]
}

```

*(注意：如果查询是关于Player Z的，而预测提到了Player A，则 `first_check` 可能适用，使得得分0)。可能需要同时判断多个答案。请逐个判断*
"""

# Judge user prompt
JUDGE_USER_PROMPT = """
---
Here is the model's prediction:
<Prediction>
{prediction}
</Prediction>
---
Here is the answer:
<Standard Answer>
{reference_answer}
</Standard Answer>
---
Here is the checklist:
<Checklist>
{checklist}
</Checklist>
You should evaluate the prediction using the checklist item by item.
"""

JUDGE_USER_PROMPT_IF = """
Here is the model's prediction:
<Prediction>
{prediction}
</Prediction>
---
Here is the answer:
<Standard Answer>
{reference_answer}
</Standard Answer>
Here is the checklist:
<Checklist>
{checklist}
</Checklist>
You should evaluate the prediction using the checklist item by item.
Based on the code evaluation, the length of the model's output prediction is: {prediction_length}.
If there is a summary subtask, the length of the summary response (including the <Summary></Summary> tags) is: {summary_length}.
The length of the main response, excluding the summary, is: {main_length}.
"""

JUDGE_USER_PROMPT_IF_zh = """
<预测>
{prediction}
</预测>
<参考答案>
{reference_answer}
</参考答案>
<检查清单>
{checklist}
</检查清单>
你应该逐项使用清单评估预测。

根据代码评估，模型输出的预测长度为：{prediction_length}。
如果存在摘要子任务，摘要响应（包括<Summary></Summary>标签）的长度为：{summary_length}。
主响应（不包括摘要）的长度为：{main_length}。
"""

def parse_judge_output(judge_output: str) -> float:
    """Parse numerical score from judge's output"""
    if not isinstance(judge_output, str):
        logging.warning(f"Input passed to parse_judge_output is not a string: {type(judge_output)}")
        return DEFAULT_ERROR_SCORE
    try:
        # Extract JSON part
        json_match = re.search(r"```json\s*(\{.*?\})\s*```", judge_output, re.DOTALL)
        if not json_match:
            logging.warning(f"Unable to find JSON block from judge output: {judge_output}")
            return DEFAULT_ERROR_SCORE

        judge_json = json.loads(json_match.group(1))
        # Extract score, assuming it's nested as [[score]]
        score = judge_json.get("answer_score", [[DEFAULT_ERROR_SCORE]])[0][0]
        return float(score)
    except (json.JSONDecodeError, IndexError, TypeError, ValueError) as e:
        logging.warning(f"Error parsing judge output JSON or score: {e}\nOutput: {judge_output}")
        return DEFAULT_ERROR_SCORE

def evaluate_response(task_type: str, game_type: str, model_response: str, reference_answer: str, checklist_str: str, judge_model) -> Dict[str, Any]:
    """Evaluate model response"""
    try:
        # Create judge prompt

        if task_type == "IF":
            if game_type == "NBA-zh":
                # 计算 prediction 中的汉字字符数
                prediction_length = len(re.findall(r'[\u4e00-\u9fff]', model_response))

                # 如果 summary 存在，就计算其中汉字字符数；否则为 0
                summary_match = re.search(r'<Summary>(.*?)</Summary>', model_response, re.DOTALL)
                summary = summary_match.group(1) if summary_match else ''
                summary_length = len(re.findall(r'[\u4e00-\u9fff]', summary))

                # main = prediction - summary
                main_length = prediction_length - summary_length

                judge_user_input = JUDGE_USER_PROMPT_IF_zh.format(
                    prediction=model_response,
                    reference_answer=reference_answer,
                    checklist=checklist_str,
                    prediction_length=prediction_length,
                    summary_length=summary_length,
                    main_length=main_length
                )
            else:
                summary_match = re.search(r'<Summary>(.*?)</Summary>', model_response, re.DOTALL)
                summary = summary_match.group(1).strip() if summary_match else ""

                # Calculate prediction total length
                prediction_length = len(re.findall(r'\b[a-zA-Z]+\b', model_response))
                
                # Calculate summary English word count
                summary_length = len(re.findall(r'\b[a-zA-Z]+\b', summary))
                
                # main = prediction - summary
                main_length = prediction_length - summary_length

                judge_user_input = JUDGE_USER_PROMPT_IF.format(
                    prediction=model_response,
                    reference_answer=reference_answer,
                    checklist=checklist_str,
                    prediction_length=prediction_length,
                    summary_length=summary_length,
                    main_length=main_length
                )
        else:
            judge_user_input = JUDGE_USER_PROMPT.format(
                prediction=model_response,
                reference_answer=reference_answer,
                checklist=checklist_str
            )
        
        # Call judge model
        history = [{"role": "system", "content": JUDGE_PROMPT}]
        judge_response = judge_model([judge_user_input], [history])[0]
        
        # Parse score
        score = parse_judge_output(judge_response)
        
        # Return evaluation result
        return {
            "judge_response": judge_response,
            "score": score
        }
    except Exception as e:
        logging.error(f"Error evaluating response: {e}")
        return {
            "judge_response": f"Evaluation process error: {e}",
            "score": 0.0
        }

# Load input file and complete model evaluation
def process_file(data: Dict, model, output_file: str = None):
    """Process input file, evaluate model response"""
    game_id = data['id']
    task_type = data['task']
    game_type = data['game_type']
    system_prompt = JUDGE_PROMPT
    
    # Initialize result
    results = {
        "game_id": game_id,
        "game_type": game_type,
        "task_type": task_type,
        "system_prompt": system_prompt,
        "evaluations": [],
        "accuracy": 0.0
    }
    
    # Parse answers and checklist
    answers_map = {}
    checklists_map = {}
    eval_ids = data.get("eval_id", [])
    
    for answer in data.get("answers", []):
        match = re.match(r"<([^>]+)> (.*)", answer, re.DOTALL)
        if match:
            eval_id, content = match.groups()
            answers_map[eval_id] = content
        
    for checklist in data.get("checklist", []):
        match = re.match(r"<([^>]+)> (.*)", checklist, re.DOTALL)
        if match:
            eval_id, content = match.groups()
            checklists_map[eval_id] = content

    # TS task eval_id list
    TS_eval_ids = {"Math": []}
    TS_scores = {"Math": []}  # Initialize Math key value
    TS_other_scores = []
    if task_type == "TS":
        retrieved_ts_eval_ids = data.get('TS', {})
        if isinstance(retrieved_ts_eval_ids, dict):
            for key in ["Math"]:
                if key in retrieved_ts_eval_ids and isinstance(retrieved_ts_eval_ids[key], list):
                    TS_eval_ids[key] = retrieved_ts_eval_ids[key]
    
    # Process each dialogue to be evaluated
    total_score = 0.0
    valid_evals = 0
    
    # Calculate the score of non-TS tasks
    non_ts_total_score = 0.0
    non_ts_valid_evals = 0
    
    logging.info(f"Data keys: {list(data.keys())}")
    logging.info(f"eval_ids: {eval_ids}")
    logging.info(f"answers: {len(data.get('answers', []))}")
    logging.info(f"checklist: {len(data.get('checklist', []))}")
    logging.info(f"dialogues: {len(data.get('dialogues', []))}")
    
    for dialogue in data.get("dialogues", []):
        prompt_id = dialogue.get("prompt_id", "")
        
        # If this prompt_id is in eval_id list, then evaluation is needed
        if prompt_id in eval_ids:
            question = dialogue.get("question", "")
            model_response = dialogue.get("model_response", "")
            reference_answer = answers_map.get(prompt_id, "")
            checklist_str = checklists_map.get(prompt_id, "")
            
            # If necessary information is missing, skip this evaluation
            if not model_response or not reference_answer or not checklist_str:
                logging.warning(f"Dialog {prompt_id} lacks necessary evaluation information, skipping")
                continue
            
            # Evaluate response
            evaluation = evaluate_response(task_type, game_type, model_response, reference_answer, checklist_str, model)
            
            # Record evaluation result
            eval_result = {
                "id": prompt_id,
                "question": question,
                "model_response": model_response,
                "reference_answer": reference_answer,
                "checklist": checklist_str,
                "judge_response": evaluation["judge_response"],
                "score": evaluation["score"]
            }
            
            results["evaluations"].append(eval_result)
            total_score += evaluation["score"]
            valid_evals += 1
            
            # Check if it's a TS task, if not, count it as a non-TS evaluation
            is_ts_eval = False
            if task_type == "TS":
                for category in TS_eval_ids:
                    if prompt_id in TS_eval_ids[category]:
                        is_ts_eval = True
                        break
            
            if not is_ts_eval:
                non_ts_total_score += evaluation["score"]
                non_ts_valid_evals += 1
            
            logging.info(f"Evaluation completed {prompt_id}: score {evaluation['score']}")

            # TS other task
            if task_type == "TS":
                if prompt_id in TS_eval_ids["Math"]:
                    TS_scores["Math"].append(evaluation["score"])
                else:
                    TS_other_scores.append(evaluation["score"])
    
    # Calculate total accuracy
    if valid_evals > 0:
        # Save the total accuracy of all evaluations (including TS) as the original accuracy
        results["original_accuracy"] = total_score / valid_evals
        
        # Use the accuracy of non-TS evaluations as the main accuracy
        if non_ts_valid_evals > 0:
            results["accuracy"] = non_ts_total_score / non_ts_valid_evals
        else:
            results["accuracy"] = 0.0
    
    # Calculate TS Math accuracy
    if TS_scores["Math"]:
        TS_math_accuracy = sum(TS_scores["Math"]) / len(TS_scores["Math"])
        results["TS_math_accuracy"] = TS_math_accuracy
    else:
        TS_math_accuracy = 0.0
    

    # Save result
    if output_file:
        output_dir = os.path.dirname(output_file)
        if output_dir and not os.path.exists(output_dir):
            os.makedirs(output_dir)
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
        
        logging.info(f"Evaluation results saved to {output_file}")
        logging.info(f"Total accuracy: {results['accuracy']:.4f}")
    
    return results

def main():
    """Main function"""
    parser = argparse.ArgumentParser(description='Evaluate model response')
    parser.add_argument('--model_name', type=str, default='deepseek-chat', help='Model name')
    parser.add_argument('--api_key', type=str, help='API key (optional, will override config file)')
    parser.add_argument('--input', type=str, required=True, help='Input file path')
    parser.add_argument('--output', type=str, default='result/eval.json', help='Output file path')
    parser.add_argument('--config', type=str, default='config/config.yaml', help='Config file path')
    args = parser.parse_args()
    
    # Build full path
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    input_path = os.path.abspath(args.input)
    output_path = os.path.abspath(args.output)
    config_path = os.path.join(base_dir, args.config)
    
    # Initialize config
    try:
        initialize_config(config_path)
        logging.info(f"Config loaded from {config_path}")
    except Exception as e:
        logging.error(f"Error initializing config: {e}")
        return
    
    # Ensure output directory exists
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    logging.info(f"Input file: {input_path}")
    logging.info(f"Output file: {output_path}")
    
    # Load model
    try:
        model = load_model(args.model_name, api_key=args.api_key)
    except Exception as e:
        logging.error(f"Error loading model: {e}")
        return

    try:
        # Read entire JSON file instead of reading line by line
        with open(input_path, 'r', encoding='utf-8') as f:
            try:
                data = json.load(f)
                
                # Check if data is a list
                if isinstance(data, list):
                    logging.info(f"Processing a list of {len(data)} dialogue objects")
                    all_results = []
                    total_accuracy_sum = 0.0
                    valid_results = 0
                    
                    # Process each item in the list
                    for i, item in enumerate(data):
                        try:
                            # Use a temporary output file for individual results if needed
                            temp_output = None
                            
                            # Process each dialogue object
                            result = process_file(item, model, temp_output)
                            all_results.append(result)
                            
                            # Calculate overall accuracy
                            if "accuracy" in result and result["accuracy"] > 0:
                                total_accuracy_sum += result["accuracy"]
                                valid_results += 1
                                
                            logging.info(f"Processed item {i+1}/{len(data)}, accuracy: {result.get('accuracy', 0):.4f}")
                        except Exception as item_e:
                            logging.error(f"Error processing item {i+1}: {item_e}")
                            # Add an error result to maintain the list structure
                            all_results.append({
                                "error": str(item_e),
                                "game_id": item.get("id", f"unknown_{i}"),
                                "accuracy": 0.0
                            })
                    
                    # Calculate overall accuracy across all items
                    overall_accuracy = total_accuracy_sum / valid_results if valid_results > 0 else 0.0
                    
                    # Save all results to the output file
                    if output_path:
                        with open(output_path, 'w', encoding='utf-8') as out_f:
                            json.dump(all_results, out_f, ensure_ascii=False, indent=2)
                            
                        logging.info(f"All results saved to {output_path}")
                        logging.info(f"Overall accuracy across all items: {overall_accuracy:.4f}")
                else:
                    # Process single JSON object
                    result = process_file(data, model, output_path)
                    logging.info(f"Evaluation completed, total accuracy: {result['accuracy']:.4f}")
            except json.JSONDecodeError as je:
                # If unable to parse as single JSON object, try reading line by line
                logging.warning(f"Trying to read JSON line by line: {je}")
                f.seek(0)  # Reset file pointer to start
                results = []
                for line in f:
                    if line.strip():  # Skip empty lines
                        try:
                            data = json.loads(line.strip())
                            result = process_file(data, model, output_path)
                            results.append(result)
                        except json.JSONDecodeError as e:
                            logging.error(f"Error parsing JSON line: {e}")
                            continue
    except Exception as e:
        logging.error(f"Error processing file: {e}")
        return

if __name__ == "__main__":
    main()

# python eval.py --input /sport-memory/MARS-Bench/result/chat-result/chat-test.json --output /sport-memory/MARS-Bench/result/eval-result/chat-test-eval.json