using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Runtime.InteropServices;


namespace Nexus.Agent.Services;


public static class CaptureScreenShots
{
    [DllImport("user32.dll")]
    private static extern bool SetProcessDPIAware();
    [DllImport("user32.dll")]
    private static extern int GetSystemMetrics(int nIndex);
    private const int SM_CXSCREEN = 0;
    private const int SM_CYSCREEN = 1;
    static CaptureScreenShots()
    {
        try { SetProcessDPIAware(); } catch { }
    }
    public static (bool Success, string? Base64, string Message) CaptureScreen()
    {
        try
        {
            int width = GetSystemMetrics(SM_CXSCREEN);
            int height = GetSystemMetrics(SM_CYSCREEN);
            if (width <= 0 || height <= 0) return (false, null, "Invalid Screen Dimension");
            using var bitmap = new Bitmap(width, height, PixelFormat.Format32bppArgb);
            // 3. Create a graphics pen targeting our blank canvas
            using (var graphics = Graphics.FromImage(bitmap))
            {
                // Copy pixels from screen (0,0) into canvas (0,0)
                graphics.CopyFromScreen(0, 0, 0, 0, new Size(width, height), CopyPixelOperation.SourceCopy);
            }

            using var ms = new MemoryStream();
            bitmap.Save(ms, ImageFormat.Png);

            string base64 = Convert.ToBase64String(ms.ToArray());
            return (true, base64, $"Screen captured successfully ({width}x{height})");
        }
        catch (Exception ex)
        {
            return (false, null, $"Screenshot failed: {ex.Message}");
        }
    }
}