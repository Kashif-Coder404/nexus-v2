namespace Nexus.Agent.Models;

using System.Text.Json.Serialization;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum ExecutionTypes
{
    Wait,
    Background,
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum VerifyType
{
    None,
    Window,
    Pid,
}
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum OutputMode
{
    Final,
    Live,
    Event //Extra when the command tooks too long to response or something installing...
}

public class RunCommandDto
{
    public string Command { get; set; } = "";
    public int TimeoutSeconds { get; set; } = 30;
    public ExecutionTypes ExecutionType { get; set; } = ExecutionTypes.Wait;
    public VerifyType VerifyType { get; set; } = VerifyType.None;
    public OutputMode OutputMode { get; set; } = OutputMode.Final;
    public bool IsDaemon { get; set; } = false;
    public string? TaskId { get; set; }
}

public class CommandResponse
{
    public string Cmd { get; set; } = "";
    public string Msg { get; set; } = "";
    public string TerminalOutput { get; set; } = "";
    public string TerminalError { get; set; } = "";
    public bool IsSuccess { get; set; }
    public string? Pid { get; set; }
    public string? VerifiedStatus { get; set; }
    public int? ExitCode { get; set; }
    public string? ImageBase64 { get; set; }
    public bool IsBackground { get; set; } = false;
    public string? TaskId { get; set; }
}

public class AppProcess(string name, int pid, string title)
{
    public string Name { get; } = name;
    public int Pid { get; } = pid;
    public string Title { get; } = title;
}


