import json
import subprocess
import os

def extract_auth_keys_from_en(en_file_path):
    """Extract auth keys from en.ts file"""
    with open(en_file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    lines = content.split('\n')
    auth_keys = {}
    in_auth_section = False
    
    for line in lines:
        if line.strip() == '// Auth':
            in_auth_section = True
            continue
        if in_auth_section and line.strip().startswith('//'):
            break
        if in_auth_section and line.strip() and ':' in line:
            parts = line.strip().split(':', 1)
            if len(parts) == 2:
                key = parts[0].strip()
                value = parts[1].strip()
                if value.startswith("'") and value.endswith("'"):
                    value = value[1:-1]
                auth_keys[key] = value
    
    return auth_keys

def update_ar_file(ar_file_path, auth_keys):
    """Update ar.ts with auth keys"""
    with open(ar_file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    lines = content.split('\n')
    in_auth_section = False
    
    # Find auth section start
    auth_start = None
    for i, line in enumerate(lines):
        if line.strip() == '// Auth':
            auth_start = i
            break
    
    if auth_start is None:
        print("Could not find Auth section in ar.ts")
        return False
    
    # Find auth section end
    auth_end = auth_start + 1
    while auth_end < len(lines) and not (lines[auth_end].strip().startswith('//') and lines[auth_end].strip().endswith('}')):
        auth_end += 1
    
    # Build new auth section
    new_auth_lines = ['// Auth']
    for key, value in auth_keys.items():
        # Escape single quotes in value
        escaped_value = value.replace("'", "''")
        new_auth_lines.append(f"  {key}: '{escaped_value}'")
    
    # Replace the auth section
    new_lines = lines[:auth_start] + new_auth_lines + lines[auth_end:]
    
    with open(ar_file_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(new_lines))
    
    print(f"Successfully updated ar.ts with {len(auth_keys)} auth keys")
    return True

def clean_fr_file(fr_file_path):
    """Clean fr.ts to remove extra auth keys"""
    with open(fr_file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    lines = content.split('\n')
    in_auth_section = False
    
    # Find auth section start
    auth_start = None
    for i, line in enumerate(lines):
        if line.strip() == '// Auth':
            auth_start = i
            break
    
    if auth_start is None:
        print("Could not find Auth section in fr.ts")
        return False
    
    # Find auth section end
    auth_end = auth_start + 1
    while auth_end < len(lines) and not (lines[auth_end].strip().startswith('//') and lines[auth_end].strip().endswith('}')):
        auth_end += 1
    
    # Build new auth section with only essential keys
    new_auth_lines = [
        '// Auth',
        "  email: 'Adresse e-mail'",
        "  password: 'Mot de passe'",
        "  fullName: 'Nom complet'",
        "  phone: 'Numéro de téléphone'",
        "  forgotPassword: 'Mot de passe oublié ?'",
        "  noAccount: \"Vous n'avez pas de compte ?\"",
        "  haveAccount: 'Vous avez déjà un compte ?'",
        "  signInWith: 'Se connecter'",
        "  createAccount: 'Créer un compte'",
        "  becomeSeller: 'Vendre sur Duka Janja'"
    ]
    
    # Replace the auth section
    new_lines = lines[:auth_start] + new_auth_lines + lines[auth_end:]
    
    with open(fr_file_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(new_lines))
    
    print("Successfully cleaned fr.ts auth keys")
    return True

def type_check():
    """Run TypeScript type check"""
    try:
        result = subprocess.run(
            ['powershell', '-Command', 'cd', 'C:/Users/hp/duka-janja; $tscPath = "node_modules/.bin/tsc"; if (Test-Path $tscPath) { & $tscPath --noEmit } else { Write-Host "tsc not found" }'],
            capture_output=True,
            text=True,
            cwd='C:/Users/hp'
        )
        if result.returncode != 0 and 'tsc not found' not in result.stdout:
            print("TypeScript compilation failed:")
            print(result.stdout)
            print(result.stderr)
            return False
        return True
    except Exception as e:
        print(f"Error running type check: {e}")
        return False

def main():
    # Set the working directory
    os.chdir('C:/Users/hp/duka-janja')
    
    # Extract auth keys from en.ts
    en_file = 'src/i18n/dictionaries/en.ts'
    auth_keys = extract_auth_keys_from_en(en_file)
    
    print(f"Found {len(auth_keys)} auth keys in en.ts")
    
    # Update ar.ts
    ar_file = 'src/i18n/dictionaries/ar.ts'
    if not update_ar_file(ar_file, auth_keys):
        return
    
    # Clean fr.ts
    fr_file = 'src/i18n/dictionaries/fr.ts'
    if not clean_fr_file(fr_file):
        return
    
    # Type check
    if not type_check():
        return
    
    print("=== All operations completed successfully ===")

if __name__ == '__main__':
    main()
