const AIBOX = ({ message, cmd, terminal, terminalError }: any) => {
  return (
    <div className="AICont">
      <div className="AITitle">Nexus</div>
      <p className="AIContent">{message}</p>
      {cmd && (
        <>
          <h3>Command</h3>
          <p className="AICmd">&gt; {cmd}</p>
        </>
      )}
      {terminal && (
        <>
          <h3 className="my-2">Terminal Output</h3>
          <p className="AITerminal">{terminal}</p>
        </>
      )}
      {terminalError && (
        <>
          <h3 className="my-2">Terminal Error</h3>
          <p className="AITerminalError">{terminalError}</p>
        </>
      )}
    </div>
  );
};

export default AIBOX;
