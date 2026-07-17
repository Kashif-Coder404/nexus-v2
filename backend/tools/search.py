import subprocess 
import sys
import os

# Read arguments passed from Node.js
# sys.argv[1] is a comma-separated list of paths (e.g. 'C:,D:/Coding')
# sys.argv[2] is a comma-separated list of expected search query strings
paths = sys.argv[1].split(",")
expected_name = sys.argv[2].split(",")

def search_with_dir(path):
    # Normalize slash direction for Windows command prompt
    normalized_path = path.replace("/", "\\")
    
    # Get the drive letter if present (e.g. "C" or "D")
    drive = ""
    if ":" in path:
        drive = path.split(":")[0]
        
    # cd /d changes both the drive and the active directory in Windows cmd
    if drive:
        command = f'cd /d "{normalized_path}" && dir /b'
    else:
        command = f'cd "{normalized_path}" && dir /b'
        
    result = subprocess.run(
        command,
        capture_output=True,
        text=True,
        shell=True
    )
    return result.stdout

all_matching_folders = []

for path in paths:
    output_str = search_with_dir(path)
    folders_list = [line.strip() for line in output_str.splitlines() if line.strip()]
    
    for folder in folders_list:
        for expected in expected_name:
            if expected.lower() in folder.lower():
                all_matching_folders.append(folder)
                break

print(f"Searched Folders Found: {all_matching_folders}")
print(f"Output of (DIR '{path}') was: \n", output_str)
