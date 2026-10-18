using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace CommonBrewPOS.Services;

public class AiChatbotService
{
    private readonly HttpClient _http;
    private readonly string _apiKey;

    public AiChatbotService(HttpClient http, IConfiguration config)
    {
        _http = http;
        _apiKey = config["Gemini:ApiKey"] ?? "";
    }
    
    public async Task<string> AskAsync(string userQuestion)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(_apiKey))
                return "Gemini API key is missing in appsettings.json.";

            var payload = new
            {
                contents = new object[]
                {
                    new
                    {
                        parts = new object[]
                        {
                            new { text = userQuestion }
                        }
                    }
                }
            };

            var jsonPayload = JsonSerializer.Serialize(payload);

            using var req = new HttpRequestMessage(
                HttpMethod.Post,
                $"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key={_apiKey}");

            req.Content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");

            var response = await _http.SendAsync(req);
            var body = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                return $"Gemini error {(int)response.StatusCode}: {body}";
            }

            using var doc = JsonDocument.Parse(body);

            return doc.RootElement
                .GetProperty("candidates")[0]
                .GetProperty("content")
                .GetProperty("parts")[0]
                .GetProperty("text")
                .GetString() ?? "No response.";
        }
        catch (Exception ex)
        {
            return $"Chatbot error: {ex.Message}";
        }
    }
}