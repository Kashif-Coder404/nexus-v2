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


public class RunCommandDto
{
    public string Command { get; set; } = "";
    public int TimeoutSeconds { get; set; } = 30;
    public ExecutionTypes ExecutionType { get; set; } = ExecutionTypes.Wait;
    public VerifyType VerifyType { get; set; } = VerifyType.None;
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
}