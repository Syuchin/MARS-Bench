import json
import os
import sys
import argparse

# Add project root directory to Python path
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if root_dir not in sys.path:
    sys.path.append(root_dir)

# Initialize configuration
from config.config_wrapper import initialize_config
config_path = os.path.join(root_dir, 'config', 'config.yaml')
initialize_config(config_path)

# Import model
from models.deepseek_api import load_model

def main():
    parser = argparse.ArgumentParser(description='Deepseek API demo for NBA dialogue')
    parser.add_argument('--model_name', type=str, default='deepseek-chat', help='Deepseek model name')
    parser.add_argument('--api_key', type=str, help='Deepseek API key (optional, overrides config file)')
    parser.add_argument('--data_path', type=str, default='data/Questions/IS_NBA_Dialogue.jsonl', help='Path to the dialogue data')
    parser.add_argument('--game_id', type=str, default='401705361', help='Game ID to process')
    parser.add_argument('--output_path', type=str, default='result/chat-result/demo.json', help='Path to save the result')
    args = parser.parse_args()

    # Build complete paths
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_path = os.path.normpath(os.path.join(base_dir, args.data_path))
    output_path = os.path.normpath(os.path.join(base_dir, args.output_path))
    
    # Ensure output directory exists
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    # Load model, passing API key (if provided)
    model = load_model(args.model_name, api_key=args.api_key)
    
    # Read dialogue data
    with open(data_path, 'r', encoding='utf-8') as f:
        for line in f:
            data = json.loads(line.strip())
            if str(data['game_id']) == args.game_id:
                process_game(data, model, output_path)
                break
        else:
            print(f"Game ID {args.game_id} not found in the dataset.")

def process_game(data, model, output_path):
    game_id = data['game_id']
    task_type = data['task_type']
    system_prompt = data['SP']
    
    # Initialize result
    result = {
        "id": game_id,
        "task": task_type,
        "system_prompt": system_prompt,
        "dialogues": [],
        "answers": data.get('answer', []),
        "checklist": data.get('checklist', []),
        "eval_id": data.get('eval_id', []),
        "TS": data.get('TS', [])
    }
    
    # Process each question
    history = []
    
    # First add system prompt as the first message in history
    history.append({"role": "system", "content": system_prompt})
    
    # Calculate user question index
    user_question_index = 0
    # Set maximum number of questions to process
    max_questions = 10
    
    # Iterate through all messages
    for message in data['prompt']:
        if message['role'] == 'user':
            # If 10 questions have been processed, stop
            if user_question_index >= max_questions:
                print(f"Already processed {max_questions} questions, ending early.")
                break
                
            question = message['content']
            
            # Get corresponding prompt_id
            if 'prompt_id' in data and user_question_index < len(data['prompt_id']):
                prompt_id = data['prompt_id'][user_question_index]
                user_question_index += 1
            else:
                prompt_id = None
            
            # Call model to get answer
            responses = model([question], [history])
            response = responses[0]
            
            # Add question and answer to dialogue history
            history.append({"role": "user", "content": question})
            history.append({"role": "assistant", "content": response})
            
            # Save dialogue content
            result['dialogues'].append({
                "prompt_id": prompt_id,
                "question": question,
                "model_response": response
            })
            
            print(f"Processed question {user_question_index}/{sum(1 for m in data['prompt'] if m['role'] == 'user')}")
    
    # Save results
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    
    print(f"Results saved to {output_path}")

if __name__ == "__main__":
    main()
