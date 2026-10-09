import os
import sys
import json
import pathlib
from ctypes import *
from typing import List, Dict, Any

# --- Everything SDK Constants ---
EVERYTHING_REQUEST_FILE_NAME = 0x00000001
EVERYTHING_REQUEST_PATH = 0x00000002
EVERYTHING_REQUEST_FULL_PATH_AND_FILE_NAME = 0x00000004
EVERYTHING_REQUEST_EXTENSION = 0x00000008
EVERYTHING_REQUEST_SIZE = 0x00000010
EVERYTHING_REQUEST_DATE_CREATED = 0x00000020
EVERYTHING_REQUEST_DATE_MODIFIED = 0x00000040
EVERYTHING_REQUEST_DATE_ACCESSED = 0x00000080
EVERYTHING_REQUEST_ATTRIBUTES = 0x00000100

EVERYTHING_ERROR_MEMORY = 1
EVERYTHING_ERROR_IPC = 2
EVERYTHING_ERROR_REGISTERCLASSEX = 3
EVERYTHING_ERROR_CREATEWINDOW = 4
EVERYTHING_ERROR_CREATETHREAD = 5
EVERYTHING_ERROR_INVALIDINDEX = 6
EVERYTHING_ERROR_INVALIDCALL = 7

def print_error(msg: str) -> None:
    """Print an error as JSON to stderr."""
    print(json.dumps({
        "success": False,
        "error": msg
    }), file=sys.stderr)

def print_success(query: str, count: int, results: List[Dict[str, Any]]) -> None:
    """Print successful results as JSON to stdout."""
    print(json.dumps({
        "success": True,
        "query": query,
        "count": count,
        "results": results
    }))

def load_everything_dll():
    """Load the Everything64.dll dynamically from the current script directory."""
    script_dir = pathlib.Path(__file__).parent.resolve()
    dll_path = script_dir / "Everything64.dll"
    
    if not dll_path.exists():
        print_error("Everything64.dll not found.")
        sys.exit(1)
        
    try:
        return WinDLL(str(dll_path))
    except Exception as e:
        print_error(f"Failed to load Everything64.dll: {str(e)}")
        sys.exit(1)

def configure_sdk(everything: WinDLL) -> None:
    """Configure ctypes signatures for Everything SDK functions."""
    everything.Everything_SetSearchW.argtypes = [c_wchar_p]
    everything.Everything_SetSearchW.restype = None

    everything.Everything_SetRequestFlags.argtypes = [c_uint32]
    everything.Everything_SetRequestFlags.restype = None

    everything.Everything_QueryW.argtypes = [c_bool]
    everything.Everything_QueryW.restype = c_bool

    everything.Everything_GetNumResults.argtypes = []
    everything.Everything_GetNumResults.restype = c_uint32

    everything.Everything_GetResultFullPathNameW.argtypes = [c_uint32, c_wchar_p, c_uint32]
    everything.Everything_GetResultFullPathNameW.restype = c_uint32

    everything.Everything_GetResultSize.argtypes = [c_uint32, POINTER(c_uint64)]
    everything.Everything_GetResultSize.restype = c_bool
    
    everything.Everything_GetResultFileNameW.argtypes = [c_uint32]
    everything.Everything_GetResultFileNameW.restype = c_wchar_p
    
    everything.Everything_GetResultPathW.argtypes = [c_uint32]
    everything.Everything_GetResultPathW.restype = c_wchar_p

    everything.Everything_GetResultExtensionW.argtypes = [c_uint32]
    everything.Everything_GetResultExtensionW.restype = c_wchar_p

    everything.Everything_GetLastError.argtypes = []
    everything.Everything_GetLastError.restype = c_uint32

    everything.Everything_CleanUp.argtypes = []
    everything.Everything_CleanUp.restype = None

def main():
    try:
        if len(sys.argv) < 3:
            print_error("Missing arguments for path and name.")
            sys.exit(1)
            
        path_arg = sys.argv[1].strip()
        name_arg = sys.argv[2].strip()
        
        ext_arg = ""
        limit_str = ""
        
        if len(sys.argv) >= 4:
            arg3 = sys.argv[3].strip()
            if arg3.isdigit() and len(sys.argv) == 4:
                limit_str = arg3
            else:
                ext_arg = arg3
                
        if len(sys.argv) >= 5:
            limit_str = sys.argv[4].strip()
            
        limit = 20
        if limit_str:
            try:
                limit = int(limit_str)
                if limit > 100:
                    limit = 100
                elif limit < 1:
                    limit = 20
            except ValueError:
                limit = 20
                
        query = ""
        if path_arg and not name_arg:
            clean_path = path_arg.replace('/', '\\')
            if clean_path.endswith('\\') and len(clean_path) > 3:
                clean_path = clean_path.rstrip('\\')
            query = f'parent:"{clean_path}"'
        elif not path_arg and name_arg:
            query = f'nopath:{name_arg}'
        elif path_arg and name_arg:
            clean_path = path_arg.replace('/', '\\')
            if clean_path.endswith('\\') and len(clean_path) > 3:
                clean_path = clean_path.rstrip('\\')
            query = f'parent:"{clean_path}" nopath:{name_arg}'
        else:
            print_error("Both path and name cannot be empty.")
            sys.exit(1)
            
        if ext_arg:
            # Strip dot if user provides it (e.g. ".lnk" -> "lnk")
            clean_ext = ext_arg.lstrip('.')
            query += f' ext:{clean_ext}'

        # Load SDK
        everything = load_everything_dll()
        configure_sdk(everything)
        
        # Setup search
        everything.Everything_SetSearchW(query)
        
        # Request all necessary metadata from the Everything index
        flags = (EVERYTHING_REQUEST_FILE_NAME | 
                 EVERYTHING_REQUEST_PATH | 
                 EVERYTHING_REQUEST_FULL_PATH_AND_FILE_NAME | 
                 EVERYTHING_REQUEST_EXTENSION | 
                 EVERYTHING_REQUEST_SIZE)
        everything.Everything_SetRequestFlags(flags)

        # Execute query synchronously
        success = everything.Everything_QueryW(True)
        
        if not success:
            err_code = everything.Everything_GetLastError()
            if err_code == EVERYTHING_ERROR_IPC:
                print_error("Everything service is not running.")
            else:
                print_error(f"Everything query failed with error code: {err_code}")
            sys.exit(1)

        total_results = everything.Everything_GetNumResults()
        
        if total_results == 0:
            everything.Everything_CleanUp()
            print_success(query, 0, [])
            sys.exit(0)
            
        results = []
        actual_limit = min(total_results, limit)
        
        for i in range(actual_limit):
            name = everything.Everything_GetResultFileNameW(i) or ""
            folder = everything.Everything_GetResultPathW(i) or ""
            ext = everything.Everything_GetResultExtensionW(i) or ""
            
            # Fetch the full path using a buffer (Windows MAX_PATH logic / up to 32768 for long paths)
            buf_size = 32768
            buf = create_unicode_buffer(buf_size)
            everything.Everything_GetResultFullPathNameW(i, buf, buf_size)
            full_path = buf.value
            
            # Fetch the file size
            size_val = c_uint64(0)
            has_size = everything.Everything_GetResultSize(i, byref(size_val))
            
            item = {
                "name": name,
                "path": full_path,
                "folder": folder,
                "extension": ext,
            }
            
            if has_size:
                item["size"] = size_val.value
                
            results.append(item)
            
        # Clean up memory allocated by Everything SDK
        everything.Everything_CleanUp()
        
        # Print results to stdout
        print_success(query, len(results), results)
        
    except Exception as e:
        print_error(f"Unexpected error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()