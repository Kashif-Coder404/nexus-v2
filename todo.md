# Nexus_v2 TODO & Problems List

## 🔴 Problem 1: Persistent Terminal State (CWD)
- **Issue:** When the AI executes a `cd` command, it runs in a temporary shell and immediately exits. Subsequent commands forget the directory change and run in the default project folder instead.
- **Proposed Solution:** Modify `execute.service.ts` to intercept `cd` commands. Track the "Current Working Directory" (CWD) in a variable within the backend. Whenever the AI navigates, update this variable. For all future commands, pass this variable into the `exec` function, forcing the child process to start in the correct directory.

## 🔴 Problem 2: Execution Flow Visibility
- **Issue:** Currently, the chat history (and frontend UI) only saves and displays the **final** output message from the AI. If the AI runs multiple commands to find an answer (like its internal feedback loop), the intermediate commands, their standard outputs, and errors are completely discarded and hidden from the user.
- **Proposed Solution:** 
  1. Modify `askAI.ts` so that it appends the entire sequence of intermediate messages (the commands run by the AI and the terminal outputs/errors fed back to it) to the `chat_{session}.json` file.
  2. Ensure that as each command finishes in the recursive loop, its output is broadcasted over the WebSocket so the frontend can render a "Terminal Output" block for the user to see in real-time.


##Problem 3: The App Should be search globally otherwise for all users the nexus search for the same app folder and did not able to find it!