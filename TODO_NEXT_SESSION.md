# Nexus v2 — Session Status & Final Release Roadmap

**Saved Date**: September 28, 2026  
**Commit Baseline**: `7a8516f` (origin/main)  
**Status**: All services compiled with 0 errors.

---

## 1. What We Accomplished Tonight (Milestone Summary)
1. **VS Code Interactive Terminal (`@xterm/xterm`) in Workbench**:
   - Built [XTerminal.tsx](file:///d:/Coding/PROJECTS/Next/Nexus_v2/frontend/app/components/XTerminal.tsx) with custom Nexus Obsidian/Purple theme and auto-resize.
   - Dynamic real-time log diffing: streams output into xterm at 350ms without flickering.
   - Dual-view mode in Workbench: **VS Code Terminal** (default) vs **Raw Logs**.
2. **Terminal Bell & Creepy Sound Fully Silenced**:
   - Identified the root cause: Windows Console and PSReadLine ringing the system chime (`\x07` ASCII BEL) when window titles change or key history boundaries occur.
   - Silenced `PSReadLine` (`Set-PSReadLineOption -BellStyle None`) and stripped OSC window titles + `\x07` from chunks before `Console.Write`.
   - Disabled audible bell in `XTerminal.tsx` (`bellStyle: "none"`, `term.onBell(() => {})`).
3. **ConPTY Raw Keystroke Pipeline Verified**:
   - Added `IsRaw` flag to `TaskInput` in [CommandModels.cs](file:///d:/Coding/PROJECTS/Next/Nexus_v2/Local-BE-v2/Models/CommandModels.cs).
   - Verified live with interactive Node CLI: Down arrow navigated choices (React ➔ Vue ➔ Svelte) and Enter submitted successfully (exit code 0).

---

## 2. Universal AI Instructions Spec (Saved for Inclusion)

```markdown
### Universal Autonomous Execution & Process Management Directives

1. Unattended & Non-Interactive Execution (Universal Rule):
   - You run autonomously without a physical keyboard to interactively answer terminal questions or prompts.
   - For ANY utility, installer, script, or package manager, ALWAYS use silent, non-interactive, or automated flags:
     * Software Installers (Winget / MSI / EXE): Always use silent / agreement flags (e.g. winget install <app> --accept-source-agreements --accept-package-agreements, msiexec /qn, /S).
     * File & Archive Operations: Always suppress overwrite prompts (e.g. tar -xf ..., 7z x ... -y, Expand-Archive -Force).
     * Media & Conversion Tools (ffmpeg): Suppress confirmation prompts (ffmpeg -y -i ...).
     * Scripting & System Cmdlets: Always append -Force, -Confirm:$false, or -NonInteractive.
     * Developer / CLI Tools: Append non-interactive flags (--yes, -y, --quiet, --no-input).

2. Finite Tasks vs. Persistent Background Services (isDaemon):
   - Finite Tasks ("isDaemon": false, Default):
     * Operations with a defined end (installing software, downloading files, extracting archives, media conversions, building projects).
     * System waits for process completion and returns final output & exit code.
   - Persistent Background Services ("isDaemon": true):
     * Continuous processes running indefinitely on network ports/background (local servers, streaming hosts, background sync monitors, live file watchers).
     * Explicitly set "isDaemon": true in payload.

3. Terminal Awareness for Persistent Services:
   - When launching a service ("isDaemon": true), inspect initial startup logs for port/URL and PID confirmation.
   - Once confirmed, YOUR TASK IS COMPLETE. Set "cmd": "" to end turn and inform user of URL/port/PID. Never loop or re-run an active server.

4. Self-Healing Loop for Hanging Processes:
   - If a finite task hangs waiting for input (e.g. "Press any key", "[Y/N]", "Password:"):
     * Kill: Terminate stuck process using its PID ({ "action": "in_built", "param": { "command": "Stop-Process -Id <pid> -Force" } }).
     * Heal: Re-run with silent/unattended flags (-Force, --yes, /S, --quiet).
     * Fallback: If no headless flags exist, use an alternative automated script.
```

---

## 3. Next Steps (Final Pipelining)
1. **Cloud Backend Pipeline (`websocket.service.ts` & `Parsers.ts`)**:
   - For `cmd.isDaemon === true`: Return startup logs immediately to Gemini.
   - For `!cmd.isDaemon` when moved to background: Await `task_finished` before giving control back to Gemini.
2. **Inject Universal Instructions**:
   - Add the Universal Directives into `backend/AI/instructions/main.Instructions.ts`.
3. **Build & Release Final `nexus.exe`**:
   - Produce single-file self-contained `.exe` binary for distribution.
