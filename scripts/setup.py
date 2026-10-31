#!/usr/bin/env python3
"""Manage only the public, explicitly owned portion of a personal Claude setup."""
import argparse
import copy
import datetime
import json
import os
from pathlib import Path
import shlex
import shutil
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parent.parent
PARTS = ('preferences', 'instructions', 'rules', 'ponytail', 'moshi', 'herdr')
RULE = Path('rules/context7.md')
INSTRUCTION_FILES = {'instructions': Path('CLAUDE.md'), 'rules': RULE}


def load_json(path):
    if not path.exists():
        return {}
    data = json.loads(path.read_text())
    if not isinstance(data, dict):
        raise ValueError(f'{path}: expected a JSON object')
    return data


def get(data, path):
    for key in path:
        if not isinstance(data, dict) or key not in data:
            return False, None
        data = data[key]
    return True, data


def put(data, path, value):
    for key in path[:-1]:
        if key not in data:
            data[key] = {}
        if not isinstance(data[key], dict):
            raise ValueError(f'Cannot merge nested setting into non-object: {key}')
        data = data[key]
    data[path[-1]] = copy.deepcopy(value)


def preference_paths(settings=None, prefix=()):
    if settings is None:
        settings = load_json(ROOT / 'config/settings.json')
    for key, value in settings.items():
        path = prefix + (key,)
        if isinstance(value, dict) and value:
            yield from preference_paths(value, path)
        else:
            # Lists and explicitly empty objects are managed as whole values.
            yield path


def selected_preferences(data):
    result = {}
    for path in preference_paths():
        exists, value = get(data, path)
        if exists:
            put(result, path, value)
    return result


def save(path, text):
    """Replace contents atomically without following a destination symlink."""
    if path.is_symlink():
        raise ValueError(f'Refusing to replace symlink: {path}')
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, temporary = tempfile.mkstemp(prefix='.claude-setup-', dir=path.parent)
    try:
        with os.fdopen(fd, 'w') as stream:
            stream.write(text)
        os.replace(temporary, path)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)


def json_text(data):
    return json.dumps(data, indent=2, ensure_ascii=False) + '\n'


def command(argv, target, capture=False, overrides=None):
    print('+ ' + shlex.join(argv), flush=True)
    environment = dict(os.environ, CLAUDE_CONFIG_DIR=str(target))
    environment.update(overrides or {})
    return subprocess.run(argv, env=environment, cwd=ROOT, check=True,
                          text=True, capture_output=capture)


def install_moshi(target):
    # Isolate installer state, not runtime state; omit the shared visuals skill.
    with tempfile.TemporaryDirectory(prefix='claude-setup-moshi-') as temporary:
        root = Path(temporary)
        home = root / 'home'
        home.mkdir()
        config = root / 'xdg/moshi/config.toml'
        config.parent.mkdir(parents=True)
        config.write_text('[gateway]\ninline_visuals = false\n')
        command(['moshi-hook', 'install', '--target', 'claude'], target,
                overrides={'HOME': str(home), 'XDG_CONFIG_HOME': str(root / 'xdg'),
                           'MOSHI_CONFIG_DIR': str(root / 'state'),
                           'MOSHI_HOOK_SKIP_FIRST_RUN': '1'})


def desired_settings(current, parts):
    result = copy.deepcopy(current)
    if 'preferences' in parts:
        source = load_json(ROOT / 'config/settings.json')
        for path in preference_paths(source):
            exists, value = get(source, path)
            if exists:
                put(result, path, value)
    if 'ponytail' in parts:
        manifest = load_json(ROOT / 'integrations/ponytail/manifest.json')
        put(result, ('enabledPlugins', 'ponytail@ponytail'), True)
        for key, value in manifest['options'].items():
            put(result, ('pluginConfigs', 'ponytail@ponytail', 'options', key), value)
    return result


def preflight(target, parts):
    needed = []
    if 'rules' in parts:
        needed.append('npx')
    if 'ponytail' in parts:
        needed.extend(('claude', 'git', 'node'))
    if 'moshi' in parts:
        needed.append('moshi-hook')
    if 'herdr' in parts:
        needed.extend(('herdr', 'python3'))
    missing = sorted({item for item in needed if shutil.which(item) is None})
    if missing:
        raise ValueError('Missing prerequisites: ' + ', '.join(missing)
                         + '. See integrations/*/README.md and README.md before applying.')
    if 'ponytail' in parts:
        settings = load_json(target / 'settings.json')
        if settings.get('enabledPlugins', {}).get('ponytail@claude-setup'):
            raise ValueError('Ponytail is enabled through claude-setup already. Use one marketplace route, not both.')


def backup(target, parts):
    paths = [Path('settings.json')]
    paths.extend(relative for part, relative in INSTRUCTION_FILES.items() if part in parts)
    if 'moshi' in parts:
        paths.append(Path('moshi-plugin'))
    if 'herdr' in parts:
        paths.append(Path('hooks/herdr-agent-state.sh'))
    existing = [path for path in paths if (target / path).exists()]
    if not existing:
        return
    stamp = datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%S.%fZ')
    destination = target / 'backups/claude-setup' / stamp
    destination.mkdir(parents=True, mode=0o700)
    for relative in existing:
        source = target / relative
        out = destination / relative
        out.parent.mkdir(parents=True, exist_ok=True)
        if source.is_dir():
            shutil.copytree(source, out, symlinks=True)
        else:
            shutil.copy2(source, out)
    print(f'Private backup: {destination}')


def plan(target, parts):
    current = load_json(target / 'settings.json')
    wanted = desired_settings(current, parts)
    print(f'Target: {target}\nSelected: {", ".join(parts)}')
    if 'preferences' in parts:
        for path in preference_paths():
            if get(wanted, path) != get(current, path):
                print(f'  Set {".".join(path)} = {get(wanted, path)[1]!r}')
        if wanted.get('skipDangerousModePermissionPrompt'):
            print('  WARNING: personal baseline skips the dangerous-mode confirmation prompt.')
    if 'instructions' in parts:
        print(f'  Install personal instructions: {target / "CLAUDE.md"}')
    if 'rules' in parts:
        print(f'  Install standalone Context7 rule: {target / RULE} (requires Node.js/npx)')
    if 'ponytail' in parts:
        print('  Install upstream Ponytail from pinned marketplace revision; enable ledger and task names.')
    if 'moshi' in parts:
        print('  Run isolated Moshi Claude installer; omit visuals skill, preserve host pairing/settings.')
    if 'herdr' in parts:
        print('  Run herdr integration install claude (does not install shared skills).')
    print('Unrelated settings, hooks, skills, account data and work profiles are not synchronized.')
    print('Apply backs up affected existing files; dependency installers may add their own backups.')
    try:
        preflight(target, parts)
    except ValueError as error:
        print(f'Prerequisite: {error}')


def apply(target, parts):
    preflight(target, parts)
    # Validate JSON and nested settings before creating backups or invoking installers.
    desired_settings(load_json(target / 'settings.json'), parts)
    files = [relative for part, relative in INSTRUCTION_FILES.items() if part in parts]
    # Read all sources before mutation, so a missing source cannot partially apply.
    contents = {relative: (ROOT / 'config' / relative).read_text() for relative in files}
    for relative in [Path('settings.json')] + files:
        path = target / relative
        if path.is_symlink() or path.parent.is_symlink():
            raise ValueError(f'Refusing managed symlink: {path}')
    target.mkdir(parents=True, exist_ok=True)
    backup(target, parts)
    if 'ponytail' in parts:
        manifest = load_json(ROOT / 'integrations/ponytail/manifest.json')
        source = manifest['repository'] + '#' + manifest['ref']
        command(['claude', 'plugin', 'marketplace', 'add', source, '--scope', 'user'], target)
        command(['claude', 'plugin', 'install', 'ponytail@ponytail', '--scope', 'user',
                 '--config', 'ledger=true', '--config', 'sendNames=true'], target)
    if 'moshi' in parts:
        install_moshi(target)
    if 'herdr' in parts:
        command(['herdr', 'integration', 'install', 'claude'], target)
    # Reload because external installers own and may have changed their settings.
    current = load_json(target / 'settings.json')
    wanted = desired_settings(current, parts)
    if wanted != current:
        save(target / 'settings.json', json_text(wanted))
    for relative, content in contents.items():
        if not (target / relative).exists() or (target / relative).read_text() != content:
            save(target / relative, content)
    print('Applied. Run check, then complete the integration README runtime checks.')


def hook_commands(settings):
    return [hook.get('command', '')
            for groups in settings.get('hooks', {}).values()
            for group in groups for hook in group.get('hooks', [])]


def check(target, parts):
    failures = []
    def report(ok, label):
        print(('OK   ' if ok else 'FAIL ') + label)
        if not ok:
            failures.append(label)
    settings = load_json(target / 'settings.json')
    if 'preferences' in parts:
        report(selected_preferences(settings) == load_json(ROOT / 'config/settings.json'), 'owned preferences match')
    if 'instructions' in parts:
        path = target / 'CLAUDE.md'
        report(path.is_file() and path.read_bytes() == (ROOT / 'config/CLAUDE.md').read_bytes(),
               'personal CLAUDE.md matches')
    if 'rules' in parts:
        report((target / RULE).is_file() and (target / RULE).read_bytes() == (ROOT / 'config' / RULE).read_bytes(), 'Context7 rule matches')
        report(shutil.which('npx') is not None, 'npx is available for Context7')
    if 'ponytail' in parts:
        installed = load_json(target / 'plugins/installed_plugins.json')
        entries = installed.get('plugins', {}).get('ponytail@ponytail', [])
        report(any(entry.get('scope') == 'user' and Path(entry.get('installPath', '')).is_dir()
                   for entry in entries), 'upstream Ponytail installed at user scope')
        manifest = load_json(ROOT / 'integrations/ponytail/manifest.json')
        report(any(entry.get('scope') == 'user'
                   and entry.get('version') == manifest['version']
                   and entry.get('gitCommitSha') == manifest['revision']
                   for entry in entries), 'Ponytail release version and commit match')
        report(settings.get('enabledPlugins', {}).get('ponytail@ponytail') is True, 'upstream Ponytail enabled')
        expected = load_json(ROOT / 'integrations/ponytail/manifest.json')['options']
        options = settings.get('pluginConfigs', {}).get('ponytail@ponytail', {}).get('options', {})
        report(all(options.get(key) == value for key, value in expected.items()), 'Ponytail options match')
    commands = hook_commands(settings)
    for part, marker in [('moshi', 'moshi-hook'), ('herdr', 'herdr-agent-state.sh')]:
        if part not in parts:
            continue
        binary = 'moshi-hook' if part == 'moshi' else 'herdr'
        report(shutil.which(binary) is not None, f'{binary} executable available')
        report(any(marker in item for item in commands), f'{part} hook registered')
        if part == 'moshi':
            report((target / 'moshi-plugin/.claude-plugin/plugin.json').is_file(), 'Moshi prompt-suggestion plugin exists')
            directories = settings.get('env', {}).get('CLAUDE_CODE_PLUGIN_DIRS', '')
            report(str(target / 'moshi-plugin') in directories.split(os.pathsep),
                   'Moshi prompt-suggestion plugin configured to load')
        else:
            report((target / 'hooks/herdr-agent-state.sh').is_file(), 'Herdr hook file exists')
    print('Configuration checks only. Verify plugin loading in Claude; Moshi pairing/delivery and Herdr pane reporting require live checks in their READMEs.')
    return 1 if failures else 0


def capture(target, parts):
    if set(parts) - {'preferences', 'instructions', 'rules'}:
        raise ValueError('Capture supports only preferences,instructions,rules; never exports app-generated integrations.')
    outputs = []
    if 'preferences' in parts:
        source = selected_preferences(load_json(target / 'settings.json'))
        if not source:
            raise ValueError('No owned preferences found to capture')
        outputs.append((ROOT / 'config/settings.json', json_text(source)))
    for part, relative in INSTRUCTION_FILES.items():
        if part in parts:
            outputs.append((ROOT / 'config' / relative, (target / relative).read_text()))
    for path, content in outputs:
        save(path, content)
        print(f'Captured {path.relative_to(ROOT)}. Review before committing; instructions may contain personal text.')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=('plan', 'apply', 'check', 'capture'))
    parser.add_argument('--only', help='Comma-separated selection: ' + ','.join(PARTS))
    parser.add_argument('--config-dir', type=Path, default=Path.home() / '.claude',
                        help='Explicit personal target; defaults to ~/.claude, not CLAUDE_CONFIG_DIR')
    args = parser.parse_args()
    parts = args.only.split(',') if args.only else list(('preferences', 'instructions', 'rules') if args.action == 'capture' else PARTS)
    if not parts or any(part not in PARTS for part in parts) or len(parts) != len(set(parts)):
        parser.error('--only must contain unique supported component names')
    target = args.config_dir.expanduser().absolute()
    if '.claude-and' in target.parts or (Path.home() / '.claude-and').resolve() in (target.resolve(), *target.resolve().parents):
        parser.error('Work profile ~/.claude-and is out of scope')
    if target.resolve() == ROOT or ROOT in target.resolve().parents:
        parser.error('Keep installed configuration and private backups outside this public repository')
    try:
        if args.action == 'plan':
            plan(target, parts)
        elif args.action == 'apply':
            apply(target, parts)
        elif args.action == 'capture':
            capture(target, parts)
        else:
            return check(target, parts)
    except (ValueError, OSError, subprocess.CalledProcessError) as error:
        print(f'Error: {error}', file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
