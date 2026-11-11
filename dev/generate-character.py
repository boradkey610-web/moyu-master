#!/usr/bin/env python3
"""Generate reference-conditioned art using the project's single model config."""
import argparse
import json
from pathlib import Path
import importlib
import sys

ROOT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--prompt-file', type=Path, required=True)
    parser.add_argument('--images', type=Path, nargs='+', required=True)
    parser.add_argument('--layout', choices=['strip', 'pose'], default='strip')
    parser.add_argument('--skill-directory', type=Path, default=Path.home() / '.myflicker/internal/skills/designai-generate-image')
    parser.add_argument('--dry-run', action='store_true')
    args = parser.parse_args()
    config = json.loads((ROOT / 'config/image-generation.json').read_text())
    ratio = config['layouts'][args.layout]
    if config['provider'] != 'myflicker-image-skill' or config['count'] != 1:
        parser.error('Unsupported provider or image count')
    if config['allowModelFallback']:
        parser.error('Automatic model substitution is disabled for character production')
    command = ['generate_with_fallback.py',
               '--mode', 'i2i', '--prompt', args.prompt_file.read_text(),
               '--gpt-model', config['model'], '--ratio', ratio,
               '--gpt-size', config['sizeTier'], '--quality', config['quality'],
               '-n', str(config['count']), '--images', *map(str, args.images)]
    if args.dry_run:
        print(json.dumps({'model': config['model'], 'references': list(map(str, args.images)),
                          'ratio': ratio, 'quality': config['quality']}))
        return 0
    sys.path.insert(0, str(args.skill_directory / 'scripts'))
    orchestrator = importlib.import_module('generate_with_fallback')
    # Reuse task history, URL persistence and bounded retries, without the
    # orchestrator's automatic Gemini substitution after two GPT failures.
    def pinned_route(params, prompt, stage, cancel=None):
        return orchestrator._attempt_model(params, prompt, config['model'], 2, cancel)
    orchestrator.generate_route = pinned_route
    sys.argv = command
    return orchestrator.run_cli(orchestrator.main)


if __name__ == '__main__':
    sys.exit(main())
